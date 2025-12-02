import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from '../lib/mongodb.js';
import { Groq } from 'groq-sdk';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    if (!process.env.GROQ_API_KEY && !process.env.VITE_GROQ_API_KEY) {
        return res.status(500).json({ message: 'Groq API key not configured' });
    }

    try {
        const { question, conversationHistory, systemPrompt, subject, context, type } = req.body;

        if (!question && type !== 'generate-paper') {
            return res.status(400).json({ message: 'Question is required' });
        }

        // Get user ID if authenticated
        let userId = null;
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (token && process.env.JWT_SECRET) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET) as { userId: string };
                userId = decoded.userId;

                // Check if user is restricted
                const db = await getDb();
                const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });

                if (user && (user.isRestricted || user.isBanned)) {
                    return res.status(403).json({ message: 'You have been restricted from using AI services.' });
                }
            } catch (e) {
                // Token invalid, continue as guest
            }
        }

        // Determine if this is a chat (with history) or a simple ask
        const isChat = conversationHistory && Array.isArray(conversationHistory);

        // Build messages array
        const messages: any[] = [
            {
                role: 'system',
                content: systemPrompt ||
                    `You are Extrovert AI, a helpful educational assistant for university students. 
                    You help with studying, understanding concepts, creating flashcards, answering questions, and preparing for exams. 
                    Keep answers concise, clear, and educational. ${context ? `User context: ${context}` : ''}
                    ${isChat ? 'When creating flashcards or quizzes, remember the context of previous questions and answers in the conversation.' : ''}`
            }
        ];

        // Add conversation history if present
        if (isChat) {
            messages.push(...conversationHistory);
        }

        // Add current question
        if (req.body.type === 'generate-paper') {
            const { subject, program, year, branch } = req.body;
            messages.push({
                role: 'user',
                content: `Generate a realistic university question paper for:
                Subject: ${subject}
                Program: ${program}
                Year: ${year}
                Branch: ${branch}
                
                Strictly return ONLY a valid JSON object with this structure (no markdown, no other text):
                {
                    "universityName": "University Name",
                    "examName": "End Semester Examination",
                    "courseCode": "CS-101 (Example)",
                    "duration": "3 Hours",
                    "maxMarks": 60,
                    "instructions": ["Answer all questions", "Figures to the right indicate full marks"],
                    "sections": [
                        {
                            "name": "Section A - Multiple Choice Questions",
                            "marks": 10,
                            "questions": [
                                { "id": 1, "text": "Question text?", "options": ["A", "B", "C", "D"], "answer": "A" }
                            ]
                        },
                        {
                            "name": "Section B - Descriptive Questions",
                            "marks": 50,
                            "questions": [
                                { "id": 11, "text": "Question text?", "marks": 10 }
                            ]
                        }
                    ]
                }
                Generate 10 MCQs in Section A and 5 Descriptive Questions (10 marks each) in Section B based on the subject syllabus.`
            });
        } else {
            messages.push({
                role: 'user',
                content: question
            });
        }

        const chatCompletion = await groq.chat.completions.create({
            messages,
            model: 'llama-3.3-70b-versatile',
            temperature: 0.7,
            max_tokens: 1024
        });

        const answer = chatCompletion.choices[0]?.message?.content || 'Sorry, I could not generate a response.';

        // Save conversation to database if user is authenticated and it's a chat
        if (userId && isChat) {
            const db = await getDb();
            await db.collection('chatSessions').insertOne({
                userId: new ObjectId(userId),
                question,
                answer,
                conversationHistory,
                createdAt: new Date()
            });
        }

        // Return appropriate response format
        if (isChat) {
            res.json({
                answer,
                conversationHistory: [
                    ...conversationHistory,
                    { role: 'user', content: question },
                    { role: 'assistant', content: answer }
                ]
            });
        } else {
            res.status(200).json({ answer });
        }
    } catch (error: any) {
        console.error('AI Error:', error);
        res.status(500).json({
            message: error?.message || 'AI service error',
            error: process.env.NODE_ENV === 'development' ? error : undefined
        });
    }
}
