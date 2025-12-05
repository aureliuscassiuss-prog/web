
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

            // CHECK: Selective Sharing
            const { resourceIds } = req.body;

            if (Array.isArray(resourceIds) && resourceIds.length > 0) {
                // Create a new shared list
                const slug = crypto.randomBytes(4).toString('hex'); // 8 characters

                await db.collection('shared_lists').insertOne({
                    slug,
                    ownerId: userId,
                    resources: resourceIds, // Store just the IDs
                    createdAt: new Date()
                });

                return res.status(200).json({ slug });
            }

            // Legacy: Full Profile Sharing
            if (user.shareSlug) {
                return res.status(200).json({ slug: user.shareSlug });
            }

            // Generate new slug for user
            const slug = crypto.randomBytes(4).toString('hex');

            await db.collection('users').updateOne(
                { _id: new ObjectId(userId) },
                { $set: { shareSlug: slug } }
            );

            return res.status(200).json({ slug });

        } catch (error) {
            console.error('Share generation error:', error);
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
            // 1. Check for Shared List (Selective)
            const sharedList = await db.collection('shared_lists').findOne({ slug });

            let queryMatch: any = {};
            let ownerUser: any = null;

            if (sharedList) {
                // It's a selective list
                // Fetch owner details
                ownerUser = await db.collection('users').findOne({ _id: new ObjectId(sharedList.ownerId) });

                // Convert string IDs to ObjectIds for the query if necessary, 
                // but usually resources._id is ObjectId. 
                // If the input IDs are strings, we need to convert them.
                const resourceObjectIds = sharedList.resources.map((id: string) => {
                    try { return new ObjectId(id); } catch (e) { return null; }
                }).filter((id: any) => id !== null);

                queryMatch = {
                    _id: { $in: resourceObjectIds },
                    status: 'approved'
                };

            } else {
                // 2. Fallback: User Full Profile (Legacy)
                ownerUser = await db.collection('users').findOne({ shareSlug: slug });

                if (!ownerUser) {
                    return res.status(404).json({ message: 'Shared list not found' });
                }

                queryMatch = {
                    savedBy: ownerUser._id.toString(),
                    status: 'approved'
                };
            }

            // Optional: Check for current user to return interaction states
            let currentUserId: string | null = null;
            const authHeader = req.headers.authorization;
            if (authHeader && authHeader.startsWith('Bearer ') && process.env.JWT_SECRET) {
                try {
                    const token = authHeader.split(' ')[1];
                    const decoded = jwt.verify(token, process.env.JWT_SECRET) as { userId: string };
                    currentUserId = decoded.userId;
                } catch (e) {
                    // Invalid token, treat as guest
                }
            }

            const aggregationPipeline: any[] = [
                { $match: queryMatch },
                { $sort: { createdAt: -1 } },
                {
                    $lookup: {
                        from: 'users',
                        let: { uploaderIdObj: { $toObjectId: '$uploaderId' } },
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
            ];

            // If user is logged in, check their interactions
            if (currentUserId) {
                aggregationPipeline.push({
                    $addFields: {
                        userSaved: {
                            $in: [currentUserId, { $ifNull: ['$savedBy', []] }]
                        },
                        userLiked: {
                            $in: [currentUserId, { $ifNull: ['$likedBy', []] }]
                        },
                        userDisliked: {
                            $in: [currentUserId, { $ifNull: ['$dislikedBy', []] }]
                        },
                        userFlagged: {
                            $in: [currentUserId, { $ifNull: ['$flaggedBy', []] }]
                        }
                    }
                });
            }

            const resources = await db.collection('resources').aggregate(aggregationPipeline).toArray();

            return res.status(200).json({
                user: {
                    name: ownerUser?.name || 'Anonymous',
                    avatar: ownerUser?.avatar
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
