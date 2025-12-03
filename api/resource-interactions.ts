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
    const resource = await db.collection('resources').findOne({ _id: new ObjectId(resourceId) });

    if (!resource) {
        return res.status(404).json({ message: 'Resource not found' });
    }

    // Initialize arrays if they don't exist
    const likedBy = resource.likedBy || [];
    const dislikedBy = resource.dislikedBy || [];
    const savedBy = resource.savedBy || [];
    const flaggedBy = resource.flaggedBy || [];

    let updateQuery: any = {};
    let userLiked = likedBy.includes(userId);
    let userDisliked = dislikedBy.includes(userId);
    let userSaved = savedBy.includes(userId);
    let userFlagged = flaggedBy.includes(userId);

    switch (action) {
        case 'like':
            if (value) {
                // Add like
                if (!userLiked) {
                    updateQuery.$addToSet = { likedBy: userId };
                    updateQuery.$inc = { likes: 1 };
                    userLiked = true;
                }
                // Remove dislike if exists
                if (userDisliked) {
                    updateQuery.$pull = { dislikedBy: userId };
                    updateQuery.$inc = { ...updateQuery.$inc, dislikes: -1 };
                    userDisliked = false;
                }
            } else {
                // Remove like
                if (userLiked) {
                    updateQuery.$pull = { likedBy: userId };
                    updateQuery.$inc = { likes: -1 };
                    userLiked = false;
                }
            }
            break;

        case 'dislike':
            if (value) {
                // Add dislike
                if (!userDisliked) {
                    updateQuery.$addToSet = { dislikedBy: userId };
                    updateQuery.$inc = { dislikes: 1 };
                    userDisliked = true;
                }
                // Remove like if exists
                if (userLiked) {
                    updateQuery.$pull = { likedBy: userId };
                    updateQuery.$inc = { ...updateQuery.$inc, likes: -1 };
                    userLiked = false;
                }
            } else {
                // Remove dislike
                if (userDisliked) {
                    updateQuery.$pull = { dislikedBy: userId };
                    updateQuery.$inc = { dislikes: -1 };
                    userDisliked = false;
                }
            }
            break;

        case 'save':
            if (value) {
                // Add save
                if (!userSaved) {
                    updateQuery.$addToSet = { savedBy: userId };
                    userSaved = true;
                }
            } else {
                // Remove save
                if (userSaved) {
                    updateQuery.$pull = { savedBy: userId };
                    userSaved = false;
                }
            }
            break;

        case 'flag':
            // Flags cannot be removed once added
            if (value && !userFlagged) {
                updateQuery.$addToSet = { flaggedBy: userId };
                updateQuery.$inc = { flags: 1 };
                userFlagged = true;
            }
            break;

        case 'download':
            // Just increment download count
            updateQuery.$inc = { downloads: 1 };
            break;

        default:
            return res.status(400).json({ message: 'Invalid action' });
    }

    // Update resource if there are changes
    if (Object.keys(updateQuery).length > 0) {
        await db.collection('resources').updateOne(
            { _id: new ObjectId(resourceId) },
            updateQuery
        );
    }

    // Get updated resource
    const updatedResource = await db.collection('resources').findOne({ _id: new ObjectId(resourceId) });

    return res.status(200).json({
        success: true,
        resource: {
            likes: updatedResource?.likes || 0,
            dislikes: updatedResource?.dislikes || 0,
            downloads: updatedResource?.downloads || 0,
            flags: updatedResource?.flags || 0,
            userLiked,
            userDisliked,
            userSaved,
            userFlagged
        }
    });
}

async function getSavedResources(userId: string, res: VercelResponse) {
    const db = await getDb();

    // Get all resources where user has saved them
    const resources = await db.collection('resources')
        .find({
            savedBy: userId,
            status: 'approved'
        })
        .sort({ createdAt: -1 })
        .toArray();

    // Add user interaction states to each resource
    const resourcesWithStates = resources.map(resource => ({
        ...resource,
        userLiked: resource.likedBy?.includes(userId) || false,
        userDisliked: resource.dislikedBy?.includes(userId) || false,
        userSaved: true, // Always true for saved resources
        userFlagged: resource.flaggedBy?.includes(userId) || false
    }));

    return res.status(200).json({ resources: resourcesWithStates });
}
