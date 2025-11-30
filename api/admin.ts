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

    if (!process.env.JWT_SECRET) {
        return res.status(500).json({ message: 'Server misconfiguration' });
    }

    try {
        // Verify admin access
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const token = authHeader.split(' ')[1];
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET);

        const db = await getDb();
        const user = await db.collection('users').findOne({ _id: new ObjectId(decoded.userId) });

        if (!user || user.role !== 'admin') {
            return res.status(403).json({ message: 'Forbidden: Admin access required' });
        }

        // Route based on URL path or query parameter
        const { action } = req.query;

        if (req.method === 'GET') {
            if (action === 'pending') {
                return await handleGetPending(res);
            } else if (action === 'structure') {
                return await handleGetStructure(res);
            } else {
                return res.status(400).json({ message: 'Invalid action. Use: pending or structure' });
            }
        } else if (req.method === 'POST') {
            let body = req.body;
            if (typeof body === 'string') {
                body = JSON.parse(body);
            }

            const { action: bodyAction } = body;

            if (bodyAction === 'approve' || bodyAction === 'reject') {
                return await handleResourceAction(body, res);
            } else if (bodyAction === 'structure') {
                return await handleUpdateStructure(body, res);
            } else {
                return res.status(400).json({ message: 'Invalid action. Use: approve, reject, or structure' });
            }
        } else {
            return res.status(405).json({ message: 'Method not allowed' });
        }
    } catch (error) {
        console.error('Admin API Error:', error);
        return res.status(500).json({ message: 'Server error', error: String(error) });
    }
}

async function handleGetPending(res: VercelResponse) {
    const db = await getDb();

    // Fetch pending resources
    const pendingResources = await db.collection('resources')
        .find({ status: 'pending' })
        .sort({ createdAt: -1 })
        .toArray();

    return res.status(200).json({ resources: pendingResources });
}

async function handleGetStructure(res: VercelResponse) {
    const db = await getDb();
    const structure = await db.collection('academic_structure').findOne({ _id: 'main' } as any);

    if (!structure) {
        // Initialize with default structure
        const defaultStructure: any = {
            _id: 'main',
            programs: ['B.Tech', 'M.Tech', 'MBA', 'MCA'],
            years: ['1st Year', '2nd Year', '3rd Year', '4th Year'],
            branches: ['Computer Science', 'Electronics', 'Mechanical', 'Civil'],
            subjects: ['Mathematics', 'Physics', 'Chemistry', 'Programming']
        };

        await db.collection('academic_structure').insertOne(defaultStructure);
        return res.status(200).json(defaultStructure);
    }

    return res.status(200).json(structure);
}

async function handleResourceAction(body: any, res: VercelResponse) {
    const { action, resourceId } = body;

    if (!resourceId) {
        return res.status(400).json({ message: 'Resource ID is required' });
    }

    const db = await getDb();

    if (action === 'approve') {
        // Update resource status to approved
        const resource = await db.collection('resources').findOneAndUpdate(
            { _id: new ObjectId(resourceId) },
            { $set: { status: 'approved' } },
            { returnDocument: 'after' }
        );

        if (!resource) {
            return res.status(404).json({ message: 'Resource not found' });
        }

        // Update user reputation
        if (resource.uploaderId) {
            await db.collection('users').updateOne(
                { _id: new ObjectId(resource.uploaderId) },
                { $inc: { reputation: 10 } }
            );
        }

        return res.status(200).json({ message: 'Resource approved', resource });
    } else if (action === 'reject') {
        // Delete the resource
        const result = await db.collection('resources').deleteOne({ _id: new ObjectId(resourceId) });

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Resource not found' });
        }

        return res.status(200).json({ message: 'Resource rejected and deleted' });
    }

    return res.status(400).json({ message: 'Invalid action' });
}

async function handleUpdateStructure(body: any, res: VercelResponse) {
    const { type, value, structureAction } = body;

    if (!type || !value || !structureAction) {
        return res.status(400).json({ message: 'Missing required fields: type, value, structureAction' });
    }

    if (!['program', 'year', 'branch', 'subject'].includes(type)) {
        return res.status(400).json({ message: 'Invalid type' });
    }

    if (!['add', 'remove'].includes(structureAction)) {
        return res.status(400).json({ message: 'Invalid structureAction' });
    }

    const db = await getDb();
    const fieldName = type + 's'; // Convert to plural (programs, years, etc.)

    let updateOperation;
    if (structureAction === 'add') {
        updateOperation = { $addToSet: { [fieldName]: value } };
    } else {
        updateOperation = { $pull: { [fieldName]: value } };
    }

    await db.collection('academic_structure').updateOne(
        { _id: 'main' } as any,
        updateOperation,
        { upsert: true }
    );

    const updatedStructure = await db.collection('academic_structure').findOne({ _id: 'main' } as any);
    return res.status(200).json(updatedStructure);
}
