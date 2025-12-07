import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import Groq from 'groq-sdk';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseKey || 'placeholder');

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST' && req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    if (!process.env.GROQ_API_KEY && !process.env.VITE_GROQ_API_KEY) {
        return res.status(500).json({ message: 'Groq API key not configured' });
    }

    try {
        const { action: queryAction } = req.query;

        // --- Credits Management ---
        if (queryAction === 'check-credits' || queryAction === 'use-credit') {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({ message: 'Unauthorized' });
            }

            const token = authHeader.substring(7);
            const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
            const userId = decoded.userId;

            const { data: user, error } = await supabase
                .from('users')
                .select('*')
                .eq('_id', userId)
                .single();

            if (error || !user) {
                return res.status(404).json({ message: 'User not found' });
            }

            // Init/Reset logic
            let credits = user.aiPaperCredits ?? 3;
            let lastReset = user.lastCreditReset ? new Date(user.lastCreditReset) : new Date(0);
            const now = new Date();
            const hoursSince = (now.getTime() - lastReset.getTime()) / (1000 * 60 * 60);

            if (hoursSince >= 24) {
                credits = 3;
                lastReset = now;
                // Update DB
                await supabase.from('users').update({ aiPaperCredits: 3, lastCreditReset: now }).eq('_id', userId);
            } else if (user.aiPaperCredits === null) {
                // Initialize if null
                await supabase.from('users').update({ aiPaperCredits: 3, lastCreditReset: now }).eq('_id', userId);
            }

            if (req.method === 'GET' && queryAction === 'check-credits') {
                return res.status(200).json({
                    credits: credits,
                    lastReset: lastReset
                });
            }

            if (req.method === 'POST' && queryAction === 'use-credit') {
                if (credits <= 0) {
                    return res.status(403).json({
                        message: 'No credits remaining. Credits reset every 24 hours.',
                        credits: 0
                    });
                }

                const newCredits = credits - 1;
                await supabase.from('users').update({ aiPaperCredits: newCredits }).eq('_id', userId);

                return res.status(200).json({
                    credits: newCredits,
                    message: 'Credit used successfully'
                });
            }
        }

        // --- History & Persistence ---
        if (req.method === 'GET' && queryAction === 'history') {
            const token = req.headers.authorization?.replace('Bearer ', '');
            if (!token) return res.status(401).json({ message: 'Unauthorized' });

            const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
            const { data: convo } = await supabase.from('ai_conversations').select('messages').eq('userId', decoded.userId).single();

            return res.status(200).json({
                history: convo ? convo.messages : []
            });
        }

        if (req.method === 'POST' && queryAction === 'clear') {
            const token = req.headers.authorization?.replace('Bearer ', '');
            if (!token) return res.status(401).json({ message: 'Unauthorized' });

            const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
            await supabase.from('ai_conversations').delete().eq('userId', decoded.userId);
            return res.status(200).json({ message: 'Conversation cleared' });
        }

        // --- Standard AI Generation ---
        if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

        const { question, conversationHistory, systemPrompt, subject, context, type, action: bodyAction } = req.body;

        if (!question && type !== 'generate-paper' && bodyAction !== 'chat') {
            return res.status(400).json({ message: 'Question required' });
        }

        let userId = null;
        let isRestricted = false;
        const token = req.headers.authorization?.replace('Bearer ', '');

        if (token && process.env.JWT_SECRET) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET) as { userId: string };
                userId = decoded.userId;
                const { data: u } = await supabase.from('users').select('isRestricted, isBanned').eq('_id', userId).single();
                if (u && (u.isRestricted || u.isBanned)) isRestricted = true;
            } catch (e) { }
        }

        if (isRestricted) return res.status(403).json({ message: 'Restricted' });

        const isChat = (conversationHistory && Array.isArray(conversationHistory)) || bodyAction === 'chat';
        const messages: any[] = [{
            role: 'system',
            content: systemPrompt ||
                `You are Extrovert AI, a helpful educational assistant. Keep answers concise. ${context ? `User context: ${context}` : ''}`
        }];

        if (isChat && conversationHistory) messages.push(...conversationHistory);

        if (type === 'generate-paper') {
            const { subject, program, year, branch } = req.body;
            messages.push({
                role: 'user',
                content: `Generate a realistic university question paper for: ${subject}, ${program}, ${year}, ${branch}. Return ONLY JSON.`
            });
        } else {
            messages.push({ role: 'user', content: question });
        }

        const chatCompletion = await groq.chat.completions.create({
            messages,
            model: 'llama-3.3-70b-versatile',
            temperature: 0.7,
            max_tokens: 1024
        });

        const answer = chatCompletion.choices[0]?.message?.content || 'Error generating response';

        if (userId && isChat) {
            const newMessages = [
                { role: 'user', content: question },
                { role: 'assistant', content: answer }
            ];

            // Append to messages using a simpler fetch-update approach for now since Postgres array append is cleaner but we stored JSONB.
            // We can use a stored procedure or just read-modify-write.
            // Read-modify-write is safest without complex SQL.
            const { data: existing } = await supabase.from('ai_conversations').select('messages').eq('userId', userId).single();
            const updatedMsgs = existing ? [...existing.messages, ...newMessages] : newMessages;

            // Upsert
            const { error } = await supabase.from('ai_conversations').upsert({
                userId,
                messages: updatedMsgs,
                updatedAt: new Date()
            }, { onConflict: 'userId' });
        }

        if (isChat) {
            res.json({
                answer,
                conversationHistory: [
                    ...(conversationHistory || []),
                    { role: 'user', content: question },
                    { role: 'assistant', content: answer }
                ]
            });
        } else {
            res.status(200).json({ answer });
        }

    } catch (error: any) {
        console.error('AI Error:', error);
        res.status(500).json({ message: error?.message || 'AI error' });
    }
}
