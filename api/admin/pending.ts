import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from '../../lib/mongodb';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Content-Type', 'application/json');

    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) return res.status(401).json({ message: 'Unauthorized' });

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
        const db = await getDb();

        // Verify admin role
        const user = await db.collection('users').findOne({ _id: new ObjectId(decoded.userId) });
        if (!user || user.role !== 'admin') {
            return res.status(403).json({ message: 'Forbidden: Admin access required' });
        }

        // Fetch pending resources
        const pendingResources = await db.collection('resources')
            .find({ status: 'pending' })
            .sort({ createdAt: -1 })
            .toArray();

        res.status(200).json({ resources: pendingResources });
    } catch (error) {
        console.error('Admin pending fetch error:', error);
        res.status(500).json({ message: 'Server error' });
    }
}
