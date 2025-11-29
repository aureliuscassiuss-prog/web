const express = require('express');
const cors = require('cors');
const Groq = require('groq-sdk');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY
});

// API Routes
app.post('/api/ai/ask', async (req, res) => {
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
    } catch (error) {
        console.error('AI Error:', error);
        res.status(500).json({ message: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`API endpoint available at http://localhost:${PORT}/api/ai/ask`);
});
