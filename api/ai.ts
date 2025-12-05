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
            // Verify JWT token
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({ message: 'Unauthorized' });
            }

            const token = authHeader.substring(7);
            let decoded: any;

            try {
                decoded = jwt.verify(token, process.env.JWT_SECRET!);
            } catch (error) {
                return res.status(401).json({ message: 'Invalid token' });
            }

            const userId = new ObjectId(decoded.userId);
            const db = await getDb();
            const usersCollection = db.collection('users');

            // Get user
            const user = await usersCollection.findOne({ _id: userId });
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            // Initialize credits if not set
            if (user.aiPaperCredits === undefined) {
                await usersCollection.updateOne(
                    { _id: userId },
                    {
                        $set: {
                            aiPaperCredits: 3,
                            lastCreditReset: new Date()
                        }
                    }
                );
                user.aiPaperCredits = 3;
                user.lastCreditReset = new Date();
            }

            // Check if 24 hours have passed since last reset
            const now = new Date();
            const lastReset = user.lastCreditReset ? new Date(user.lastCreditReset) : new Date(0);
            const hoursSinceReset = (now.getTime() - lastReset.getTime()) / (1000 * 60 * 60);

            if (hoursSinceReset >= 24) {
                // Reset credits
                await usersCollection.updateOne(
                    { _id: userId },
                    {
                        $set: {
                            aiPaperCredits: 3,
                            lastCreditReset: now
                        }
                    }
                );
                user.aiPaperCredits = 3;
            }

            if (req.method === 'GET' && queryAction === 'check-credits') {
                return res.status(200).json({
                    credits: user.aiPaperCredits || 0,
                    lastReset: user.lastCreditReset
                });
            }

            if (req.method === 'POST' && queryAction === 'use-credit') {
                // Use one credit
                if ((user.aiPaperCredits || 0) <= 0) {
                    return res.status(403).json({
                        message: 'No credits remaining. Credits reset every 24 hours.',
                        credits: 0
                    });
                }

                const newCredits = (user.aiPaperCredits || 0) - 1;
                await usersCollection.updateOne(
                    { _id: userId },
                    { $set: { aiPaperCredits: newCredits } }
                );

                return res.status(200).json({
                    credits: newCredits,
                    message: 'Credit used successfully'
                });
            }

            return res.status(400).json({ message: 'Invalid credits action' });
        }

        // --- History & Persistence Management ---
        if (req.method === 'GET' && queryAction === 'history') {
            const token = req.headers.authorization?.replace('Bearer ', '');
            if (!token) return res.status(401).json({ message: 'Unauthorized' });

            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
                const db = await getDb();
                // Retrieve active conversation
                const conversation = await db.collection('ai_conversations').findOne({
                    userId: new ObjectId(decoded.userId)
                });

                return res.status(200).json({
                    history: conversation ? conversation.messages : []
                });
            } catch (e) {
                return res.status(401).json({ message: 'Invalid token' });
            }
        }

        if (req.method === 'POST' && queryAction === 'clear') {
            const token = req.headers.authorization?.replace('Bearer ', '');
            if (!token) return res.status(401).json({ message: 'Unauthorized' });

            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
                const db = await getDb();
                await db.collection('ai_conversations').deleteOne({ userId: new ObjectId(decoded.userId) });
                return res.status(200).json({ message: 'Conversation cleared' });
            } catch (e) {
                return res.status(401).json({ message: 'Invalid token' });
            }
        }

        // --- Standard AI Generation ---
        if (req.method !== 'POST') {
            return res.status(405).json({ message: 'Method not allowed' });
        }

        const { question, conversationHistory, systemPrompt, subject, context, type, action: bodyAction } = req.body;

        if (!question && type !== 'generate-paper' && bodyAction !== 'chat') {
            return res.status(400).json({ message: 'Question is required' });
        }

        // Get user ID if authenticated
        let userId = null;
        let isRestricted = false;
        const token = req.headers.authorization?.replace('Bearer ', '');

        if (token && process.env.JWT_SECRET) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET) as { userId: string };
                userId = decoded.userId;

                // Check if user is restricted
                const db = await getDb();
                const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });

                if (user && (user.isRestricted || user.isBanned)) {
                    isRestricted = true;
                }
            } catch (e) {
                // Token invalid, continue as guest
            }
        }

        if (isRestricted) {
            return res.status(403).json({ message: 'You have been restricted from using AI services.' });
        }

        // Determine if this is a chat (with history) or a simple ask
        const isChat = (conversationHistory && Array.isArray(conversationHistory)) || bodyAction === 'chat';

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
        if (isChat && conversationHistory) {
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
                Semester: ${req.body.semester}
                
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

        // --- PERSISTENCE & TTL LOGIC ---
        if (userId && isChat) {
            const db = await getDb();
            const conversationCollection = db.collection('ai_conversations');

            // Create TTL index (only needs to be done once, but safe to call)
            // Expire after 10 days (864000 seconds)
            await conversationCollection.createIndex({ updatedAt: 1 }, { expireAfterSeconds: 864000 });

            // Only store the new exchange to append to the document
            const newMessages = [
                { role: 'user', content: question },
                { role: 'assistant', content: answer }
            ];

            await conversationCollection.updateOne(
                { userId: new ObjectId(userId) },
                {
                    $push: { messages: { $each: newMessages } },
                    $set: { updatedAt: new Date() },
                    $setOnInsert: { createdAt: new Date() }
                },
                { upsert: true }
            );
        }

        // Return appropriate response format
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
        res.status(500).json({
            message: error?.message || 'AI service error',
            error: process.env.NODE_ENV === 'development' ? error : undefined
        });
    }
}
