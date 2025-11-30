import { getDb } from '../../lib/mongodb.js';
import jwt from 'jsonwebtoken';
export default async function handler(req, res) {
    res.setHeader('Content-Type', 'application/json');
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' });
    }
    if (!process.env.JWT_SECRET) {
        return res.status(500).json({ message: 'Server misconfiguration' });
    }
    try {
        // Get token from header
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const db = await getDb();
        // Get user's uploads
        const uploads = await db.collection('resources')
            .find({ uploaderId: decoded.userId })
            .sort({ createdAt: -1 })
            .toArray();
        res.status(200).json({ uploads });
    }
    catch (error) {
        console.error('Get uploads error:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return res.status(500).json({ message: 'Server error', error: errorMessage });
    }
}
