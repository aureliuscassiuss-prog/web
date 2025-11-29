import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        console.log('=== UPLOAD TEST ENDPOINT HIT ===');
        console.log('Headers:', req.headers);
        console.log('Method:', req.method);
        console.log('Content-Type:', req.headers['content-type']);

        return res.status(200).json({
            message: 'Test endpoint working!',
            headers: req.headers,
            method: req.method
        });
    } catch (error) {
        console.error('Test endpoint error:', error);
        return res.status(500).json({ message: 'Error', error: String(error) });
    }
}
