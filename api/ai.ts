import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import Groq from 'groq-sdk';
import OpenAI from 'openai';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseKey || 'placeholder');

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY
});

const openrouter = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY || 'placeholder',
    baseURL: 'https://openrouter.ai/api/v1'
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

        // --- Translation Logic ---
        if (req.method === 'POST' && queryAction === 'translate') {
            const { text, targetLang } = req.body;
            if (!text || !targetLang) {
                return res.status(400).json({ error: 'Missing text or targetLang' });
            }
            try {
                const { translate } = await import('@vitalets/google-translate-api');
                const { text: translatedText } = await translate(text, { to: targetLang });
                return res.status(200).json({ translatedText });
            } catch (error: any) {
                console.error('Translation error:', error);
                return res.status(500).json({ error: 'Translation failed', details: error.message });
            }
        }

        // --- Standard AI Generation ---
        if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

        const { question, conversationHistory, systemPrompt, subject, context, type, action: bodyAction, image } = req.body;

        if (!question && !image && type !== 'generate-paper' && bodyAction !== 'chat') {
            return res.status(400).json({ message: 'Question or Image required' });
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

        // System Prompt
        const messages: any[] = [{
            role: 'system',
            content: systemPrompt ||
                `You are Extrovert AI, a helpful educational assistant. Keep answers concise. ${context ? `User context: ${context}` : ''}`
        }];

        if (isChat && conversationHistory) messages.push(...conversationHistory);

        if (type === 'generate-paper') {
            const { subject, program, year, branch } = req.body;
            // Format year for better AI context (e.g. "1" -> "Year 1")
            const formattedYear = /^\d+$/.test(String(year)) ? `Year ${year}` : year;

            messages.push({
                role: 'user',
                content: `Generate a university question paper with the following structure. Return ONLY valid JSON, no markdown, no code blocks:
{
  "courseCode": "course code here",
  "sections": [
    {
      "name": "Section A - Multiple Choice Questions (MCQs)",
      "questions": [
        {
          "text": "MCQ question 1",
          "options": ["option A", "option B", "option C", "option D"]
        }
        // ... 8 more MCQs (9 total)
      ]
    },
    {
      "name": "Section B - Short/Long Answer Questions",
      "questions": [
        {"text": "Question 2(i)"},
        {"text": "Question 2(ii)"},
        {"text": "OR Question 2"},
        {"text": "Question 3(i)"},
        {"text": "Question 3(ii)"},
        {"text": "OR Question 3"},
        {"text": "Question 4(i)"},
        {"text": "Question 4(ii)"},
        {"text": "OR Question 4"},
        {"text": "Question 5(i)"},
        {"text": "Question 5(ii)"},
        {"text": "OR Question 5"},
        {"text": "Question 6(i)"},
        {"text": "Question 6(ii)"},
        {"text": "Question 6(iii)"}
      ]
    }
  ]
}
Subject: ${subject}, Program: ${program}, Year: ${formattedYear}, Branch: ${branch}. ALL questions MUST have a "text" field with the actual question string.`
            });
        } else {
            // Check if we have an image
            if (image) {
                messages.push({
                    role: 'user',
                    content: [
                        { type: 'text', text: question || "Analyze this image." },
                        { type: 'image_url', image_url: { url: image } }
                    ]
                });
            } else {
                messages.push({ role: 'user', content: question });
            }
        }

        // Select model - use Vision for images if needed, otherwise use requested model or default
        let model = req.body.model || 'llama-3.3-70b-versatile';

        // Model validation/mapping
        const validModels = [
            'llama-3.3-70b-versatile',
            'llama-3.1-8b-instant',
            'openai/gpt-oss-120b',
            'openai/gpt-oss-20b',
            'qwen/qwen3-32b',
            'groq/compound',
            'llama-3.2-90b-vision-preview',
            'llama-3.2-11b-vision-preview',
            'llama-3.2-90b-vision-preview',
            'llama-3.2-11b-vision-preview',
        ];

        // If image is present, force a vision model (currently Groq supports Llama 3.2 vision or similar, let's use a safe default if specific vision model is needed)
        // For now, if image is present, we try 'llama-3.2-11b-vision-preview' or falls back. 
        if (image) {
            model = 'llama-3.2-90b-vision-preview';
        } else if (!validModels.includes(model)) {
            // Keep user choice if it looks like a custom ID, otherwise default
            if (!model.startsWith('deepseek/')) {
                model = 'llama-3.3-70b-versatile';
            }
        }

        console.log('Using Model:', model);

        let chatCompletion;

        // Route to appropriate client
        if (model.startsWith('deepseek/') || model.startsWith('openai/') || model.includes('/')) {
            // Assume OpenRouter for namespaced models (except if it was a custom groq one? Groq doesn't usually use slashes like deepseek/ in this app context except for openai/gpt-oss maybe? 
            // user's "openai/gpt-oss-120b" was from Groq previously. 
            // Actually, "openai/gpt-oss-120b" IS ON GROQ? The user provided that list for Groq previously.
            // "deepseek/..." is definitely OpenRouter.

            if (model.startsWith('deepseek/')) {
                chatCompletion = await openrouter.chat.completions.create({
                    messages,
                    model: model,
                    temperature: 0.7,
                    max_tokens: req.body.maxTokens || (type === 'generate-paper' ? 2048 : 2048),
                    stop: null
                });
            } else {
                // Fallback to Groq for others like openai/gpt-oss-120b (Groq supported)
                chatCompletion = await groq.chat.completions.create({
                    messages,
                    model: model,
                    temperature: 0.7,
                    max_tokens: req.body.maxTokens || (type === 'generate-paper' ? 2048 : 2048),
                    stop: null
                });
            }
        } else {
            chatCompletion = await groq.chat.completions.create({
                messages,
                model: model,
                temperature: 0.7,
                max_tokens: req.body.maxTokens || (type === 'generate-paper' ? 2048 : 2048),
                stop: null
            });
        }

        const answer = chatCompletion.choices[0]?.message?.content || 'Error generating response';

        if (userId && isChat) {
            const userContent = image
                ? [{ type: 'text', text: question || "Analyze this image." }, { type: 'image_url', image_url: { url: image } }]
                : question;

            const newMessages = [
                { role: 'user', content: userContent },
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
            const userHistoryContent = image
                ? [{ type: 'text', text: question || "Analyze this image." }, { type: 'image_url', image_url: { url: image } }]
                : question;

            res.json({
                answer,
                conversationHistory: [
                    ...(conversationHistory || []),
                    { role: 'user', content: userHistoryContent },
                    { role: 'assistant', content: answer }
                ]
            });
        } else {
            res.status(200).json({ answer });
        }

    } catch (error: any) {
        console.error('AI Error details:', error);
        // Return more specific error for debugging
        res.status(500).json({
            message: error?.message || 'AI service error',
            details: error?.response?.data || error?.toString()
        });
    }
}
