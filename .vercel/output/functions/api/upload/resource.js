import { getDb } from '../../lib/mongodb.js';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
export default async function handler(req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
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
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Extract fields from JSON body
        const { title, description, course, branch, year, yearNum, subject, resourceType, driveLink } = req.body;
        // Validate required fields
        if (!title || !branch || !subject || !resourceType || !driveLink) {
            return res.status(400).json({ message: 'Missing required fields' });
        }
        // Validate Drive Link (basic check)
        if (!driveLink.includes('drive.google.com') && !driveLink.includes('docs.google.com')) {
            return res.status(400).json({ message: 'Invalid Google Drive link' });
        }
        const db = await getDb();
        // Create resource document
        const resource = {
            title,
            description: description || '',
            course: course || 'B.Tech',
            branch,
            year: yearNum ? parseInt(yearNum) : (year ? parseInt(year) : 1),
            subject,
            resourceType,
            driveLink, // Store the link directly
            status: 'approved',
            uploader: decoded.name || 'Anonymous',
            uploaderId: decoded.userId,
            downloads: 0, // We can track clicks as "downloads"
            rating: 0,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        console.log('Creating resource:', resource);
        // Insert resource
        const result = await db.collection('resources').insertOne(resource);
        console.log('Resource created:', result.insertedId);
        // Update user's reputation
        await db.collection('users').updateOne({ _id: new ObjectId(decoded.userId) }, {
            $inc: { reputation: 10 },
            $push: { uploads: result.insertedId }
        });
        res.status(201).json({
            message: 'Resource uploaded successfully',
            resourceId: result.insertedId,
            resource: {
                ...resource,
                _id: result.insertedId
            }
        });
    }
    catch (error) {
        console.error('Upload error:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('jwt') || errorMessage.includes('token')) {
            return res.status(401).json({ message: 'Invalid or expired token' });
        }
        return res.status(500).json({ message: 'Server error', error: errorMessage });
    }
}
