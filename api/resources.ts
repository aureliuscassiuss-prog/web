import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from '../lib/mongodb.js';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const db = await getDb();
        const { action } = req.query;

        // --- GET REQUESTS ---
        if (req.method === 'GET') {

            // 1. Leaderboard Action
            if (action === 'leaderboard') {
                console.log('[Leaderboard] Fetching leaderboard data...');

                try {
                    // Optimized: Split query approach is often faster on M0 free tier than complex $lookup

                    // 1. Get top users
                    const topUsers = await db.collection('users')
                        .aggregate([
                            { $addFields: { reputation: { $ifNull: ['$reputation', 0] } } },
                            { $sort: { reputation: -1 } },
                            { $limit: 50 },
                            { $project: { name: 1, reputation: 1, avatar: 1 } }
                        ]).toArray();

                    console.log(`[Leaderboard] Found ${topUsers.length} top users`);

                    if (topUsers.length === 0) {
                        return res.status(200).json({ leaderboard: [] });
                    }

                    // 2. Get upload counts for these users in one go
                    const userIds = topUsers.map(u => u._id.toString());

                    const uploadCounts = await db.collection('resources').aggregate([
                        {
                            $match: {
                                uploaderId: { $in: userIds },
                                status: 'approved'
                            }
                        },
                        { $group: { _id: '$uploaderId', count: { $sum: 1 } } }
                    ]).toArray();

                    // 3. Map counts
                    const countMap = new Map();
                    uploadCounts.forEach((item: any) => {
                        countMap.set(item._id, item.count);
                    });

                    // 4. Assemble result
                    const rankedLeaderboard = topUsers.map((user: any, index: number) => ({
                        rank: index + 1,
                        name: user.name || 'Anonymous',
                        points: user.reputation || 0,
                        uploads: countMap.get(user._id.toString()) || 0,
                        avatar: user.avatar || 'boy1'
                    }));

                    console.log(`[Leaderboard] Processed ${rankedLeaderboard.length} entries`);

                    return res.status(200).json({ leaderboard: rankedLeaderboard });
                } catch (leaderboardError) {
                    console.error('[Leaderboard] Error:', leaderboardError);
                    return res.status(500).json({
                        leaderboard: [],
                        message: 'Failed to fetch leaderboard'
                    });
                }
            }

            // 2. Standard Resource Fetching
            const {
                type, resourceType, examYear, search,
                branch, course, year, semester, subject, unit
            } = req.query;

            const query: any = { status: 'approved' }; // Default to showing approved resources only

            // Resource type filtering
            if (typeof type === 'string') {
                query.resourceType = type;
            } else if (typeof resourceType === 'string') {
                query.resourceType = resourceType;
            }

            // Exam Year filtering
            if (typeof examYear === 'string') {
                query.examYear = examYear;
            }

            // Search filtering
            if (typeof search === 'string') {
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
            if (typeof branch === 'string') {
                query.branch = branch;
            }

            // Course (Program) filtering
            if (typeof course === 'string') {
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

            // Semester filtering
            if (typeof semester === 'string') {
                query.semester = semester;
            }

            // Subject filtering
            if (typeof subject === 'string') {
                query.subject = subject;
            }

            // Unit filtering
            // Unit filtering (Flexible matching)
            if (typeof unit === 'string') {
                // escape regex strings
                const escapedUnit = unit.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                // Create a regex that allows optional "Unit " prefix and case insensitivity
                // If user sends "1", it matches "Unit 1", "unit 1", "1"
                // If user sends "Unit 1", it matches "Unit 1"
                // We'll strip "Unit" "unit" from the input and from the db just to be safe or just use flexible regex

                const numberOnly = unit.replace(/unit\s*/i, '');

                query.unit = {
                    $regex: new RegExp(`(unit\\s*)?${numberOnly}$`, 'i')
                };
            }

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

            // Get user ID if authenticated
            let userId: string | null = null;
            try {
                const token = req.headers.authorization?.replace('Bearer ', '');
                if (token && process.env.JWT_SECRET) {
                    const decoded = jwt.verify(token, process.env.JWT_SECRET) as { userId: string };
                    userId = decoded.userId;
                }
            } catch (e) {
                // Not authenticated, continue without user ID
            }

            // Add user interaction states if authenticated
            const resourcesWithStates = resources.map((resource: any) => ({
                ...resource,
                ...(userId ? {
                    userLiked: resource.likedBy?.includes(userId) || false,
                    userDisliked: resource.dislikedBy?.includes(userId) || false,
                    userSaved: resource.savedBy?.includes(userId) || false,
                    userFlagged: resource.flaggedBy?.includes(userId) || false
                } : {})
            }));

            return res.status(200).json({ resources: resourcesWithStates });
        }

        // --- POST REQUESTS ---
        if (req.method === 'POST') {
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
                semester,
                subject,
                unit,
                resourceType,
                driveLink,
                examYear
            } = req.body;

            // Validate required fields
            if (!title || !branch || !subject || !resourceType || !driveLink) {
                return res.status(400).json({ message: 'Missing required fields' });
            }

            // Validate Exam Year for PYQs
            if (resourceType === 'pyq' && !examYear) {
                return res.status(400).json({ message: 'Exam Year is required for Previous Year Questions' });
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
                semester: semester || '',
                subject,
                unit,
                resourceType,
                driveLink, // Store the link directly
                examYear: resourceType === 'pyq' ? examYear : undefined,
                status,
                uploader: decoded.name || 'Anonymous',
                uploaderId: decoded.userId,
                downloads: 0,
                likes: 0,
                dislikes: 0,
                flags: 0,
                likedBy: [],
                dislikedBy: [],
                savedBy: [],
                flaggedBy: [],
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
        }

        // --- DELETE REQUESTS ---
        if (req.method === 'DELETE') {
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

            return res.status(200).json({ message: 'Resource deleted successfully' });
        }

        return res.status(405).json({ message: 'Method not allowed' });

    } catch (error) {
        console.error('Resources API error:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);

        if (errorMessage.includes('jwt') || errorMessage.includes('token')) {
            return res.status(401).json({ message: 'Invalid or expired token' });
        }

        return res.status(500).json({ message: 'Server error', error: errorMessage });
    }
}
