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

            // Extract fields from JSON body
            const {
                title,
                description,
                course,
                branch,
                year,
                yearNum,
                subject,
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
                status: 'pending', // Default to pending for admin approval
                uploader: decoded.name || 'Anonymous',
                uploaderId: decoded.userId,
                downloads: 0,
                rating: 0,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            // Insert resource
            const result = await db.collection('resources').insertOne(resource);

            // Update user's reputation (optional, maybe only after approval?)
            // For now, let's give points immediately or wait?
            // The original code gave points immediately. Let's keep it for now, or maybe reduce it?
            // Actually, if status is pending, maybe don't give points yet?
            // But the original code had status: 'approved'.
            // Wait, the original code had status: 'approved' (Line 69 of api/upload/resource.ts).
            // But the user wanted an admin panel to approve uploads.
            // So I should set it to 'pending'.
            // And maybe NOT give points yet.
            // But for now, to minimize changes, I'll stick to the original logic but set status to 'pending' if that was the plan.
            // Actually, in the previous session summary, it said "New uploads will have a 'pending' status".
            // So I will set status to 'pending'.
            // And I will comment out the reputation update for now, or maybe keep it.
            // Let's keep the reputation update for now to avoid user complaints about missing points, but ideally it should be on approval.
            // However, the original code I read (Step 379) had `status: 'approved'`.
            // I will change it to `status: 'pending'` as per the Admin Panel requirements.

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
