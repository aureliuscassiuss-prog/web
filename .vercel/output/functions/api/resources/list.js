import { getDb } from '../../lib/mongodb.js';
export default async function handler(req, res) {
    res.setHeader('Content-Type', 'application/json');
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' });
    }
    try {
        const db = await getDb();
        const { search, branch, year, subject, type } = req.query;
        // Build query
        const query = { status: 'approved' };
        if (type && typeof type === 'string') {
            query.resourceType = type;
        }
        if (search && typeof search === 'string') {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { subject: { $regex: search, $options: 'i' } },
                { uploader: { $regex: search, $options: 'i' } }
            ];
        }
        if (branch && typeof branch === 'string') {
            query.branch = branch;
        }
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
            }
            else {
                query.year = yearStr;
            }
        }
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
    }
    catch (error) {
        console.error('Resources fetch error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
}
