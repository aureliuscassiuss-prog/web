// @ts-nocheck
import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import { Groq } from 'groq-sdk';
// @ts-ignore
import registerHandler from './api/auth/register.ts';
// @ts-ignore
import loginHandler from './api/auth/login.ts';

// Handler adapter for Vercel-style handlers
const adaptHandler = (handler: any) => async (req: Request, res: Response) => {
    try {
        await handler(req, res);
    } catch (error) {
        console.error('Handler error:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
};

const app = express();
const PORT = 3000;

app.use(cors());

// Global Request Logger
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Test Route
// @ts-ignore
import uploadTestHandler from './api/upload/test.ts';
app.post('/api/upload/test', adaptHandler(uploadTestHandler));

// Upload Route - MUST be before express.json() to avoid body parsing
// @ts-ignore
import uploadResourceHandler from './api/upload/resource.ts';
app.post('/api/upload/resource', adaptHandler(uploadResourceHandler));

// Now apply JSON parsing for other routes
app.use(express.json());

// AI Route
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY
});

app.post('/api/ai/ask', async (req: Request, res: Response) => {
    try {
        const { question } = req.body;

        if (!process.env.GROQ_API_KEY && !process.env.VITE_GROQ_API_KEY) {
            return res.status(500).json({ message: 'Groq API key not configured' });
        }

        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: 'You are MediNotes AI, a helpful educational assistant. Keep answers concise and helpful.'
                },
                {
                    role: 'user',
                    content: question
                }
            ],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.7,
            max_tokens: 1024
        });

        res.json({ answer: chatCompletion.choices[0]?.message?.content || 'No response' });
    } catch (error: any) {
        console.error('AI Error:', error);
        res.status(500).json({ message: error.message });
    }
});



// Auth Routes
app.post('/api/auth/register', adaptHandler(registerHandler));
app.post('/api/auth/login', adaptHandler(loginHandler));

// Profile Routes
// @ts-ignore
import profileUpdateHandler from './api/profile/update.ts';
// @ts-ignore
import profileUploadsHandler from './api/profile/uploads.ts';
app.put('/api/profile/update', adaptHandler(profileUpdateHandler));
app.get('/api/profile/uploads', adaptHandler(profileUploadsHandler));

// Enhanced AI Route with memory
// @ts-ignore
import aiChatHandler from './api/ai/chat.ts';
app.post('/api/ai/chat', adaptHandler(aiChatHandler));

// Leaderboard Route
// @ts-ignore
import leaderboardHandler from './api/leaderboard/top.ts';
app.get('/api/leaderboard/top', adaptHandler(leaderboardHandler));

// Resources Route
// @ts-ignore
import resourcesHandler from './api/resources/list.ts';
app.get('/api/resources/list', adaptHandler(resourcesHandler));

// Admin Routes
// @ts-ignore
import adminPendingHandler from './api/admin/pending.ts';
// @ts-ignore
import adminActionHandler from './api/admin/action.ts';
app.get('/api/admin/pending', adaptHandler(adminPendingHandler));
app.post('/api/admin/action', adaptHandler(adminActionHandler));

app.listen(PORT, () => {
    console.log(`Dev Server running on http://localhost:${PORT}`);
    console.log(`- AI: http://localhost:${PORT}/api/ai/ask`);
    console.log(`- AI Chat (with memory): http://localhost:${PORT}/api/ai/chat`);
    console.log(`- Auth: http://localhost:${PORT}/api/auth/*`);
    console.log(`- Profile: http://localhost:${PORT}/api/profile/*`);
    console.log(`- Leaderboard: http://localhost:${PORT}/api/leaderboard/top`);
    console.log(`- Resources: http://localhost:${PORT}/api/resources/list`);
    console.log(`- Upload: http://localhost:${PORT}/api/upload/resource`);
    console.log(`- Admin: http://localhost:${PORT}/api/admin/*`);
});
