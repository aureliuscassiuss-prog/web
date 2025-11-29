import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from '../../lib/mongodb.js';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Content-Type', 'application/json');

    if (req.method !== 'POST') {
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

        const { resourceId, action } = req.body; // action: 'approve' | 'reject'

        if (!resourceId || !['approve', 'reject'].includes(action)) {
            return res.status(400).json({ message: 'Invalid request' });
        }

        if (action === 'approve') {
            await db.collection('resources').updateOne(
                { _id: new ObjectId(resourceId) },
                { $set: { status: 'approved', approvedAt: new Date(), approvedBy: user._id } }
            );
            // Optionally award reputation points here if not done on upload
        } else {
            await db.collection('resources').updateOne(
                { _id: new ObjectId(resourceId) },
                { $set: { status: 'rejected', rejectedAt: new Date(), rejectedBy: user._id } }
            );
        }

        res.status(200).json({ message: `Resource ${action}d successfully` });
    } catch (error) {
        console.error('Admin action error:', error);
        res.status(500).json({ message: 'Server error' });
    }
}
