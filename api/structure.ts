import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from '../lib/mongodb.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const db = await getDb();
        const structure = await db.collection('academic_structure').findOne({ _id: 'main' } as any);

        if (!structure) {
            // Return default structure
            const defaultStructure = {
                programs: ['B.Tech', 'M.Tech', 'MBA', 'MCA'],
                years: ['1st Year', '2nd Year', '3rd Year', '4th Year'],
                branches: ['Computer Science', 'Electronics', 'Mechanical', 'Civil'],
                subjects: ['Mathematics', 'Physics', 'Chemistry', 'Programming']
            };

            return res.status(200).json(defaultStructure);
        }

        // Return structure without _id field
        const { _id, ...structureData } = structure;
        return res.status(200).json(structureData);
    } catch (error) {
        console.error('Structure API Error:', error);
        return res.status(500).json({ message: 'Server error', error: String(error) });
    }
}
