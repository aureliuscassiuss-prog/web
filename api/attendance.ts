import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from '../lib/mongodb.js';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Auth Check
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    let userId: string;

    try {
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
        userId = decoded.userId;
    } catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
    }

    const db = await getDb();
    const collection = db.collection('attendance');

    try {
        if (req.method === 'GET') {
            const data = await collection.findOne({ userId: new ObjectId(userId) });
            return res.status(200).json(data || { subjects: [], logs: [] });
        }

        if (req.method === 'POST') {
            const { subjects, logs } = req.body;

            await collection.updateOne(
                { userId: new ObjectId(userId) },
                {
                    $set: {
                        subjects,
                        logs,
                        updatedAt: new Date()
                    }
                },
                { upsert: true }
            );

            return res.status(200).json({ message: 'Attendance saved successfully' });
        }

        return res.status(405).json({ message: 'Method not allowed' });
    } catch (error) {
        console.error('Attendance API Error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}
