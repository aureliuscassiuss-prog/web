import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from '../../lib/mongodb';
import { Groq } from 'groq-sdk';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Content-Type', 'application/json');

    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const { question, conversationHistory = [] } = req.body;

        if (!process.env.GROQ_API_KEY && !process.env.VITE_GROQ_API_KEY) {
            return res.status(500).json({ message: 'Groq API key not configured' });
        }

        // Get user ID if authenticated
        let userId = null;
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (token && process.env.JWT_SECRET) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET) as { userId: string };
                userId = decoded.userId;
            } catch (e) {
                // Token invalid, continue as guest
            }
        }

        // Build messages array with conversation history
        const messages: any[] = [
            {
                role: 'system',
                content: 'You are MediNotes AI, a helpful educational assistant for college students. You help with studying, creating flashcards, answering questions, and providing study tips. Keep answers concise and helpful. When creating flashcards or quizzes, remember the context of previous questions and answers in the conversation.'
            },
            ...conversationHistory,
            {
                role: 'user',
                content: question
            }
        ];

        const chatCompletion = await groq.chat.completions.create({
            messages,
            model: 'llama-3.3-70b-versatile',
            temperature: 0.7,
            max_tokens: 1024
        });

        const answer = chatCompletion.choices[0]?.message?.content || 'No response';

        // Save conversation to database if user is authenticated
        if (userId) {
            const db = await getDb();
            await db.collection('chatSessions').insertOne({
                userId: new ObjectId(userId),
                question,
                answer,
                conversationHistory,
                createdAt: new Date()
            });
        }

        res.json({
            answer,
            conversationHistory: [
                ...conversationHistory,
                { role: 'user', content: question },
                { role: 'assistant', content: answer }
            ]
        });
    } catch (error: any) {
        console.error('AI Error:', error);
        res.status(500).json({ message: error.message });
    }
}
