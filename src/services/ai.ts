const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || '';

export const getAIResponse = async (message: string) => {
    try {
        // 1. Try Backend API first (Production/Vercel)
        try {
            const backendResponse = await fetch('/api/ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'ask', question: message })
            });

            if (backendResponse.ok) {
                const data = await backendResponse.json();
                return data.answer;
            }
        } catch (e) {
            console.log('Backend API not available, falling back to direct call');
        }

        // 2. Fallback to Direct API (Local Dev)
        console.log('Sending request to Groq API (Direct)...');

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messages: [
                    {
                        role: 'system',
                        content: 'You are MediNotes AI, a helpful and knowledgeable study assistant for university students. You help with summarizing concepts, creating quizzes, and explaining complex topics. Keep your answers concise, encouraging, and easy to understand. Use emojis occasionally to be friendly.'
                    },
                    {
                        role: 'user',
                        content: message
                    }
                ],
                model: 'llama-3.3-70b-versatile',
                temperature: 0.7,
                max_tokens: 1024,
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('Groq API Error:', response.status, response.statusText, errorData);
            throw new Error(`API request failed with status ${response.status}`);
        }

        const data = await response.json();
        return data.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response at the moment.";

    } catch (error) {
        console.error('Error calling Groq API:', error);
        return "I'm having trouble connecting to my brain right now. Please check your internet connection or try again later.";
    }
};
