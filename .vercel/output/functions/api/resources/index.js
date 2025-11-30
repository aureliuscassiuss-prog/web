import { getDb } from '../../lib/mongodb.js';
export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' });
    }
    try {
        const { search, course, year, subject, resourceType } = req.query;
        const db = await getDb();
        const query = { isPublic: true };
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { subject: { $regex: search, $options: 'i' } }
            ];
        }
        if (course)
            query.course = course;
        if (year)
            query.year = year;
        if (subject)
            query.subject = subject;
        if (resourceType)
            query.resourceType = resourceType;
        const resources = await db.collection('resources')
            .find(query)
            .sort({ createdAt: -1 })
            .limit(50)
            .toArray();
        res.status(200).json({ resources });
    }
    catch (error) {
        console.error('Resources fetch error:', error);
        res.status(500).json({ message: 'Server error' });
    }
}
