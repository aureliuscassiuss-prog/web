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
        const { search, branch, year, subject, type, course, resourceType } = req.query;

        // Build query - support both 'status: approved' and 'isPublic: true' for backward compatibility
        const query: any = {
            $or: [
                { status: 'approved' },
                { isPublic: true }
            ]
        };

        // Resource type filtering
        if (type && typeof type === 'string') {
            query.resourceType = type;
        } else if (resourceType && typeof resourceType === 'string') {
            query.resourceType = resourceType;
        }

        // Search filtering
        if (search && typeof search === 'string') {
            query.$and = query.$and || [];
            query.$and.push({
                $or: [
                    { title: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } },
                    { subject: { $regex: search, $options: 'i' } },
                    { uploader: { $regex: search, $options: 'i' } }
                ]
            });
        }

        // Branch filtering
        if (branch && typeof branch === 'string') {
            query.branch = branch;
        } else if (course && typeof course === 'string') {
            query.course = course;
        }

        // Year filtering
        if (year) {
            const yearStr = year.toString();
            const yearNum = parseInt(yearStr.replace(/\D/g, ''));

            if (!isNaN(yearNum)) {
                // Match either the number, the string representation, or the "1st Year" format
                query.year = {
                    $in: [
                        yearNum,
                        yearStr,
                        `${yearNum}${yearNum === 1 ? 'st' : yearNum === 2 ? 'nd' : yearNum === 3 ? 'rd' : 'th'} Year`
                    ]
                };
            } else {
                query.year = yearStr;
            }
        }

        // Subject filtering
        if (subject && typeof subject === 'string') {
            query.subject = subject;
        }

        // Fetch resources
        const resources = await db.collection('resources')
            .find(query)
            .sort({ createdAt: -1 })
            .limit(100)
            .toArray();

        res.status(200).json({ resources });
    } catch (error) {
        console.error('Resources fetch error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
}
