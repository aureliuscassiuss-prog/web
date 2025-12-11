import { VercelRequest, VercelResponse } from '@vercel/node';
import { translate } from '@vitalets/google-translate-api';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { text, targetLang } = req.body;

        if (!text || !targetLang) {
            return res.status(400).json({ error: 'Missing text or targetLang' });
        }

        const { text: translatedText } = await translate(text, { to: targetLang });

        return res.status(200).json({ translatedText });
    } catch (error) {
        console.error('Translation error:', error);
        return res.status(500).json({ error: 'Translation failed', details: error.message });
    }
}
