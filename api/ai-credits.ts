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

    // Verify JWT token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const token = authHeader.substring(7);
    let decoded: any;

    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET!);
    } catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
    }

    const userId = new ObjectId(decoded.userId);

    try {
        const db = await getDb();
        const usersCollection = db.collection('users');

        // Get user
        const user = await usersCollection.findOne({ _id: userId });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Initialize credits if not set
        if (user.aiPaperCredits === undefined) {
            await usersCollection.updateOne(
                { _id: userId },
                {
                    $set: {
                        aiPaperCredits: 3,
                        lastCreditReset: new Date()
                    }
                }
            );
            user.aiPaperCredits = 3;
            user.lastCreditReset = new Date();
        }

        // Check if 24 hours have passed since last reset
        const now = new Date();
        const lastReset = user.lastCreditReset ? new Date(user.lastCreditReset) : new Date(0);
        const hoursSinceReset = (now.getTime() - lastReset.getTime()) / (1000 * 60 * 60);

        if (hoursSinceReset >= 24) {
            // Reset credits
            await usersCollection.updateOne(
                { _id: userId },
                {
                    $set: {
                        aiPaperCredits: 3,
                        lastCreditReset: now
                    }
                }
            );
            user.aiPaperCredits = 3;
        }

        const { action } = req.query;

        if (req.method === 'GET' && action === 'check') {
            // Return current credits
            return res.status(200).json({
                credits: user.aiPaperCredits || 0,
                lastReset: user.lastCreditReset
            });
        }

        if (req.method === 'POST' && action === 'use') {
            // Use one credit
            if ((user.aiPaperCredits || 0) <= 0) {
                return res.status(403).json({
                    message: 'No credits remaining. Credits reset every 24 hours.',
                    credits: 0
                });
            }

            const newCredits = (user.aiPaperCredits || 0) - 1;
            await usersCollection.updateOne(
                { _id: userId },
                { $set: { aiPaperCredits: newCredits } }
            );

            return res.status(200).json({
                credits: newCredits,
                message: 'Credit used successfully'
            });
        }

        return res.status(400).json({ message: 'Invalid action. Use: check or use' });

    } catch (error) {
        console.error('AI Credits error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
}
