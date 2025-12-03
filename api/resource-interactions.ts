import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from '../lib/mongodb.js';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
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
        const decoded = jwt.verify(token, process.env.JWT_SECRET) as { userId: string };
        const userId = decoded.userId;

        if (req.method === 'POST') {
            return await handleInteraction(req, userId, res);
        } else if (req.method === 'GET') {
            return await getSavedResources(userId, res);
        } else {
            return res.status(405).json({ message: 'Method not allowed' });
        }
    } catch (error) {
        console.error('Resource interaction error:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return res.status(500).json({ message: 'Server error', error: errorMessage });
    }
}

async function handleInteraction(req: VercelRequest, userId: string, res: VercelResponse) {
    const { resourceId, action, value } = req.body;

    if (!resourceId || !action) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    const db = await getDb();
    const objectId = new ObjectId(resourceId);

    try {
        switch (action) {
            case 'like':
                if (value) {
                    // Atomic: Add like only if not already liked
                    await db.collection('resources').updateOne(
                        { _id: objectId, likedBy: { $ne: userId } },
                        { $addToSet: { likedBy: userId }, $inc: { likes: 1 } } as any
                    );
                    // Atomic: Remove dislike if present
                    await db.collection('resources').updateOne(
                        { _id: objectId, dislikedBy: userId },
                        { $pull: { dislikedBy: userId }, $inc: { dislikes: -1 } } as any
                    );
                } else {
                    // Atomic: Remove like
                    await db.collection('resources').updateOne(
                        { _id: objectId, likedBy: userId },
                        { $pull: { likedBy: userId }, $inc: { likes: -1 } } as any
                    );
                }
                break;

            case 'dislike':
                if (value) {
                    // Atomic: Add dislike only if not already disliked
                    await db.collection('resources').updateOne(
                        { _id: objectId, dislikedBy: { $ne: userId } },
                        { $addToSet: { dislikedBy: userId }, $inc: { dislikes: 1 } } as any
                    );
                    // Atomic: Remove like if present
                    await db.collection('resources').updateOne(
                        { _id: objectId, likedBy: userId },
                        { $pull: { likedBy: userId }, $inc: { likes: -1 } } as any
                    );
                } else {
                    // Atomic: Remove dislike
                    await db.collection('resources').updateOne(
                        { _id: objectId, dislikedBy: userId },
                        { $pull: { dislikedBy: userId }, $inc: { dislikes: -1 } } as any
                    );
                }
                break;

            case 'save':
                if (value) {
                    // Atomic: Add save
                    await db.collection('resources').updateOne(
                        { _id: objectId, savedBy: { $ne: userId } },
                        { $addToSet: { savedBy: userId } } as any
                    );
                } else {
                    // Atomic: Remove save
                    await db.collection('resources').updateOne(
                        { _id: objectId, savedBy: userId },
                        { $pull: { savedBy: userId } } as any
                    );
                }
                break;

            case 'flag':
                if (value) {
                    // Atomic: Add flag only if not already flagged
                    await db.collection('resources').updateOne(
                        { _id: objectId, flaggedBy: { $ne: userId } },
                        { $addToSet: { flaggedBy: userId }, $inc: { flags: 1 } } as any
                    );
                }
                break;

            case 'download':
                // Atomic: Increment download count
                await db.collection('resources').updateOne(
                    { _id: objectId },
                    { $inc: { downloads: 1 } } as any
                );
                break;

            default:
                return res.status(400).json({ message: 'Invalid action' });
        }

        // Get updated resource to return fresh state
        const updatedResource = await db.collection('resources').findOne({ _id: objectId });

        if (!updatedResource) {
            return res.status(404).json({ message: 'Resource not found' });
        }

        // Calculate user states based on the fresh data
        const userLiked = updatedResource.likedBy?.includes(userId) || false;
        const userDisliked = updatedResource.dislikedBy?.includes(userId) || false;
        const userSaved = updatedResource.savedBy?.includes(userId) || false;
        const userFlagged = updatedResource.flaggedBy?.includes(userId) || false;

        return res.status(200).json({
            success: true,
            resource: {
                likes: updatedResource.likes || 0,
                dislikes: updatedResource.dislikes || 0,
                downloads: updatedResource.downloads || 0,
                flags: updatedResource.flags || 0,
                userLiked,
                userDisliked,
                userSaved,
                userFlagged
            }
        });

    } catch (error) {
        console.error('Interaction update error:', error);
        return res.status(500).json({ message: 'Failed to update interaction' });
    }
}

async function getSavedResources(userId: string, res: VercelResponse) {
    const db = await getDb();

    try {
        // Use aggregation to join with users collection and get avatar
        const resources = await db.collection('resources').aggregate([
            {
                $match: {
                    savedBy: userId,
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

        // Add user interaction states to each resource
        const resourcesWithStates = resources.map(resource => ({
            ...resource,
            userLiked: resource.likedBy?.includes(userId) || false,
            userDisliked: resource.dislikedBy?.includes(userId) || false,
            userSaved: true, // Always true for saved resources
            userFlagged: resource.flaggedBy?.includes(userId) || false
        }));

        return res.status(200).json({ resources: resourcesWithStates });
    } catch (error) {
        console.error('Error fetching saved resources:', error);
        return res.status(500).json({ message: 'Failed to fetch saved resources' });
    }
}
