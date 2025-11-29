import type { VercelRequest, VercelResponse } from '@vercel/node';
import Groq from 'groq-sdk';

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const { question, subject, context } = req.body;

        if (!question) {
            return res.status(400).json({ message: 'Question is required' });
        }

        if (!process.env.GROQ_API_KEY) {
            return res.status(503).json({ message: 'AI service not configured' });
        }

        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: `You are MediNotes AI, a helpful educational assistant for university students. 
          You help with studying, understanding concepts, and preparing for exams. 
          Keep answers concise, clear, and educational. ${context ? `User context: ${context}` : ''}`
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

        const answer = chatCompletion.choices[0]?.message?.content || 'Sorry, I could not generate a response.';

        res.status(200).json({ answer });
    } catch (error: any) {
        console.error('AI error:', error);
        res.status(500).json({
            message: error?.message || 'AI service error',
            error: process.env.NODE_ENV === 'development' ? error : undefined
        });
    }
}
