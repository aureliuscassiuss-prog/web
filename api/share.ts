
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from '../lib/mongodb.js';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import crypto from 'crypto';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const db = await getDb();

    if (req.method === 'POST') {
        // Authenticated: Generate or Retrieve Slug
        if (!process.env.JWT_SECRET) {
            return res.status(500).json({ message: 'Server misconfiguration' });
        }

        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET) as { userId: string };
            const userId = decoded.userId;

            const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
            if (!user) return res.status(404).json({ message: 'User not found' });

            if (user.shareSlug) {
                return res.status(200).json({ slug: user.shareSlug });
            }

            // Generate new slug
            const slug = crypto.randomBytes(4).toString('hex'); // 8 characters

            // Ensure uniqueness (extremely unlikely to collide with 8 chars hex for small userbase, but good practice)
            // For now, we assume uniqueness for simplicity or do a quick check
            // await db.collection('users').findOne({ shareSlug: slug }) ...

            await db.collection('users').updateOne(
                { _id: new ObjectId(userId) },
                { $set: { shareSlug: slug } }
            );

            return res.status(200).json({ slug });

        } catch (error) {
            return res.status(500).json({ message: 'Failed to generate link' });
        }
    }

    if (req.method === 'GET') {
        // Public: Get Resources by Slug
        const { slug } = req.query;

        if (!slug || typeof slug !== 'string') {
            return res.status(400).json({ message: 'Invalid slug' });
        }

        try {
            const user = await db.collection('users').findOne({ shareSlug: slug });

            if (!user) {
                return res.status(404).json({ message: 'Shared list not found' });
            }

            // Fetch Saved Resources logic (similar to resource-interactions)
            const resources = await db.collection('resources').aggregate([
                {
                    $match: {
                        savedBy: user._id.toString(),
                        status: 'approved'
                    }
                },
                { $sort: { createdAt: -1 } },
                {
                    $lookup: {
                        from: 'users',
                        let: {
                            uploaderIdObj: {
                                $convert: {
                                    input: '$uploaderId',
                                    to: 'objectId',
                                    onError: null,
                                    onNull: null
                                }
                            }
                        },
                        pipeline: [
                            { $match: { $expr: { $eq: ['$_id', '$$uploaderIdObj'] } } },
                            { $project: { avatar: 1 } }
                        ],
                        as: 'uploaderDetails'
                    }
                },
                {
                    $addFields: {
                        uploaderAvatar: { $arrayElemAt: ['$uploaderDetails.avatar', 0] }
                    }
                },
                { $project: { uploaderDetails: 0 } }
            ]).toArray();

            return res.status(200).json({
                user: {
                    name: user.name,
                    avatar: user.avatar
                },
                resources
            });

        } catch (error) {
            console.error('Share fetch error:', error);
            return res.status(500).json({ message: 'Failed to fetch shared resources' });
        }
    }

    return res.status(405).json({ message: 'Method not allowed' });
}
