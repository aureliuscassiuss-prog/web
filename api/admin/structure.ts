import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from '../../lib/mongodb.js';
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

    // Verify admin access
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);

        const db = await getDb();
        const user = await db.collection('users').findOne({ _id: new ObjectId(decoded.userId) });

        if (!user || user.role !== 'admin') {
            return res.status(403).json({ message: 'Forbidden: Admin access required' });
        }

        // GET - Fetch academic structure
        if (req.method === 'GET') {
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

        // POST - Add or remove items
        if (req.method === 'POST') {
            const { type, value, action } = req.body;

            if (!type || !value || !action) {
                return res.status(400).json({ message: 'Missing required fields' });
            }

            if (!['program', 'year', 'branch', 'subject'].includes(type)) {
                return res.status(400).json({ message: 'Invalid type' });
            }

            if (!['add', 'remove'].includes(action)) {
                return res.status(400).json({ message: 'Invalid action' });
            }

            const fieldName = type + 's'; // Convert to plural (programs, years, etc.)

            let updateOperation;
            if (action === 'add') {
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

        return res.status(405).json({ message: 'Method not allowed' });

    } catch (error) {
        console.error('Structure API Error:', error);
        return res.status(500).json({ message: 'Server error', error: String(error) });
    }
}
