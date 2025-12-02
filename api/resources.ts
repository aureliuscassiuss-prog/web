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

    try {
        const db = await getDb();

        if (req.method === 'GET') {
            const { search, branch, year, subject, unit, type, course, resourceType } = req.query;

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
            }

            // Course (Program) filtering
            if (course && typeof course === 'string') {
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

            // Unit filtering
            if (unit && typeof unit === 'string') {
                query.unit = unit;
            }

            // Fetch resources
            // Fetch resources with uploader details
            const resources = await db.collection('resources').aggregate([
                { $match: query },
                { $sort: { createdAt: -1 } },
                { $limit: 100 },
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

            return res.status(200).json({ resources });

        } else if (req.method === 'POST') {
            if (!process.env.JWT_SECRET) {
                return res.status(500).json({ message: 'Server misconfiguration' });
            }

            // Get token from header
            const token = req.headers.authorization?.replace('Bearer ', '');
            if (!token) {
                return res.status(401).json({ message: 'No token provided' });
            }

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET) as { userId: string; name: string };

            // Check if user is banned or restricted from uploading
            const user = await db.collection('users').findOne({ _id: new ObjectId(decoded.userId) });

            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            if (user.isBanned) {
                return res.status(403).json({ message: 'Your account has been banned. You cannot upload resources.' });
            }

            if (user.isRestricted || user.canUpload === false) {
                return res.status(403).json({ message: 'You have been restricted from uploading resources. Contact admin for more information.' });
            }

            // Extract fields from JSON body
            const {
                title,
                description,
                course,
                branch,
                year,
                yearNum,
                subject,
                unit,
                resourceType,
                driveLink
            } = req.body;

            // Validate required fields
            if (!title || !branch || !subject || !resourceType || !driveLink) {
                return res.status(400).json({ message: 'Missing required fields' });
            }

            // Validate Drive Link (basic check)
            if (!driveLink.includes('drive.google.com') && !driveLink.includes('docs.google.com')) {
                return res.status(400).json({ message: 'Invalid Google Drive link' });
            }

            // Determine status based on user trust level
            const status = user.isTrusted ? 'approved' : 'pending';

            // Create resource document
            const resource = {
                title,
                description: description || '',
                course: course || 'B.Tech',
                branch,
                year: yearNum ? parseInt(yearNum) : (year ? parseInt(year) : 1),
                subject,
                unit,
                resourceType,
                driveLink, // Store the link directly
                status,
                uploader: decoded.name || 'Anonymous',
                uploaderId: decoded.userId,
                downloads: 0,
                rating: 0,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            // Insert resource
            const result = await db.collection('resources').insertOne(resource);

            // Update user's reputation and uploads list
            await db.collection('users').updateOne(
                { _id: new ObjectId(decoded.userId) },
                {
                    $inc: { reputation: 10 },
                    $push: { uploads: result.insertedId } as any
                }
            );

            return res.status(201).json({
                message: 'Resource uploaded successfully',
                resourceId: result.insertedId,
                resource: {
                    ...resource,
                    _id: result.insertedId
                }
            });
        } else if (req.method === 'DELETE') {
            if (!process.env.JWT_SECRET) {
                return res.status(500).json({ message: 'Server misconfiguration' });
            }

            const token = req.headers.authorization?.replace('Bearer ', '');
            if (!token) {
                return res.status(401).json({ message: 'No token provided' });
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET) as { userId: string; role?: string };
            const { id } = req.query;

            if (!id || typeof id !== 'string') {
                return res.status(400).json({ message: 'Resource ID is required' });
            }

            const resource = await db.collection('resources').findOne({ _id: new ObjectId(id) });

            if (!resource) {
                return res.status(404).json({ message: 'Resource not found' });
            }

            // Check ownership or admin role
            if (resource.uploaderId !== decoded.userId && decoded.role !== 'admin') {
                return res.status(403).json({ message: 'You are not authorized to delete this resource' });
            }

            await db.collection('resources').deleteOne({ _id: new ObjectId(id) });

            // Optionally remove from user's uploads array and decrease reputation?
            // For now, just delete the resource.

            return res.status(200).json({ message: 'Resource deleted successfully' });

        } else {
            return res.status(405).json({ message: 'Method not allowed' });
        }
    } catch (error) {
        console.error('Resources API error:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);

        if (errorMessage.includes('jwt') || errorMessage.includes('token')) {
            return res.status(401).json({ message: 'Invalid or expired token' });
        }

        return res.status(500).json({ message: 'Server error', error: errorMessage });
    }
}
