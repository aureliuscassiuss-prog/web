import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from '../lib/mongodb.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const db = await getDb();

        // Count total approved resources
        const totalResources = await db.collection('resources').countDocuments({
            $or: [
                { status: 'approved' },
                { isPublic: true }
            ]
        });

        // Count total active users (users who have uploaded at least one resource)
        const totalUsers = await db.collection('users').countDocuments({});

        return res.status(200).json({
            totalResources,
            totalUsers
        });
    } catch (error) {
        console.error('Stats API error:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return res.status(500).json({ message: 'Server error', error: errorMessage });
    }
}
