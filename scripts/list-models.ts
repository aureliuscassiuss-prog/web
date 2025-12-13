import Groq from 'groq-sdk';
import dotenv from 'dotenv';
dotenv.config();

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY
});

async function main() {
    try {
        const models = await groq.models.list();
        console.log('Available Models:');
        models.data.forEach((m: any) => {
            if (m.id.includes('vision') || m.id.includes('llama')) {
                console.log('-', m.id);
            }
        });
    } catch (error) {
        console.error('Error fetching models:', error);
    }
}

main();
