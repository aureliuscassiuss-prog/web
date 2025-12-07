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

        // Route based on URL path or query parameter
        const { action } = req.query;

        // Allow public access for reading structure or stats
        if (req.method === 'GET') {
            if (action === 'structure') {
                return await handleGetStructure(res);
            } else if (action === 'stats') {
                return await handleGetStats(res);
            }
        }

        // Verify admin access
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const token = authHeader.split(' ')[1];
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET);

        const db = await getDb();
        const user = await db.collection('users').findOne({ _id: new ObjectId(decoded.userId) });

        // Check if user has any admin-related role
        const allowedRoles = ['admin', 'semi-admin', 'content-reviewer', 'structure-manager'];
        if (!user || !allowedRoles.includes(user.role)) {
            return res.status(403).json({ message: 'Forbidden: Admin access required' });
        }

        // Helper function to check permissions
        const hasPermission = (requiredRoles: string[]) => {
            return requiredRoles.includes(user.role);
        };

        if (req.method === 'GET') {
            if (action === 'pending') {
                // Approvals: admin, semi-admin, content-reviewer
                if (!hasPermission(['admin', 'semi-admin', 'content-reviewer'])) {
                    return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
                }
                return await handleGetPending(res);
            } else if (action === 'structure') {
                // Structure view: admin, semi-admin, structure-manager
                if (!hasPermission(['admin', 'semi-admin', 'structure-manager'])) {
                    return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
                }
                return await handleGetStructure(res);
            } else if (action === 'users') {
                // Users view: admin, semi-admin
                if (!hasPermission(['admin', 'semi-admin'])) {
                    return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
                }
                return await handleGetUsers(res);
            } else {
                return res.status(400).json({ message: 'Invalid action. Use: pending, structure, or users' });
            }
        } else if (req.method === 'POST') {
            let body = req.body;
            if (typeof body === 'string') {
                body = JSON.parse(body);
            }

            console.log('Admin API POST body:', JSON.stringify(body, null, 2));

            const { action: bodyAction, userAction } = body;

            if (userAction) {
                // User management: admin only
                if (!hasPermission(['admin'])) {
                    return res.status(403).json({ message: 'Forbidden: Admin access required for user management' });
                }
                return await handleUserAction(body, res);
            } else if (bodyAction === 'approve' || bodyAction === 'reject') {
                // Resource approval: admin, semi-admin, content-reviewer
                if (!hasPermission(['admin', 'semi-admin', 'content-reviewer'])) {
                    return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
                }
                return await handleResourceAction(body, res);
            } else if (bodyAction === 'structure') {
                // Structure management: admin, structure-manager
                if (!hasPermission(['admin', 'structure-manager'])) {
                    return res.status(403).json({ message: 'Forbidden: Insufficient permissions for structure management' });
                }
                return await handleUpdateStructure(body, res);
            } else {
                console.log('Invalid action received:', bodyAction);
                return res.status(400).json({ message: 'Invalid action. Use: approve, reject, structure, or user management' });
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

    // Fetch pending resources - the 'uploader' field already contains the name
    const pendingResources = await db.collection('resources').aggregate([
        {
            $match: { status: 'pending' }
        },
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
                as: 'uploaderInfo'
            }
        },
        {
            $addFields: {
                uploaderName: { $ifNull: ['$uploader', 'Unknown User'] },
                uploaderAvatar: { $arrayElemAt: ['$uploaderInfo.avatar', 0] },
                type: { $ifNull: ['$resourceType', 'Not specified'] }
            }
        },
        {
            $project: {
                uploaderInfo: 0
            }
        },
        {
            $sort: { createdAt: -1 }
        }
    ]).toArray();

    return res.status(200).json({ resources: pendingResources });
}

async function handleGetStructure(res: VercelResponse) {
    const db = await getDb();
    const structure = await db.collection('academic_structure').findOne({ _id: 'main' } as any);

    if (!structure) {
        // Initialize with default hierarchical structure
        const defaultStructure: any = {
            _id: 'main',
            programs: [
                {
                    id: 'btech',
                    name: 'B.Tech',
                    years: [
                        {
                            id: '1',
                            name: '1st Year',
                            courses: [
                                {
                                    id: 'cse',
                                    name: 'Computer Science',
                                    semesters: [
                                        {
                                            id: 'sem1',
                                            name: 'Semester 1',
                                            subjects: ['Data Structures', 'Algorithms', 'Programming']
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ]
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
    const { structureAction, programId, yearId, semesterId, courseId, name, value } = body;
    console.log('handleUpdateStructure:', { structureAction, programId, yearId, semesterId, courseId, name, value });

    const db = await getDb();

    // Idempotency / Duplicate Check
    if (structureAction && structureAction.startsWith('add-')) {
        const structure = await db.collection('academic_structure').findOne({ _id: 'main' }) as any;
        if (structure) {
            let exists = false;
            // Helper to safe navigation
            const p = structure.programs?.find((p: any) => p.id === programId);
            const y = p?.years?.find((y: any) => y.id === yearId);
            const c = y?.courses?.find((c: any) => c.id === courseId);
            const sem = c?.semesters?.find((s: any) => s.id === semesterId);
            const sub = sem?.subjects?.find((s: any) => (typeof s === 'string' ? s : s.name) === (body.subjectName || value)); // add-subject uses value, add-unit uses subjectName

            if (structureAction === 'add-program') {
                exists = structure.programs?.some((p: any) => p.name === value);
            } else if (structureAction === 'add-year') {
                exists = p?.years?.some((y: any) => y.id === value);
            } else if (structureAction === 'add-course') {
                exists = y?.courses?.some((c: any) => c.name === value);
            } else if (structureAction === 'add-semester') {
                exists = c?.semesters?.some((s: any) => s.name === value);
            } else if (structureAction === 'add-subject') {
                exists = sem?.subjects?.some((s: any) => (typeof s === 'string' ? s : s.name) === value);
            } else if (structureAction === 'add-unit') {
                // unit is added to 'sub'
                if (sub) {
                    if (typeof sub === 'string') exists = false; // logic in main block converts string to object, so essentially "doesn't exist as container yet" but actually if it's string, we can't have units yet.
                    else exists = sub.units?.some((u: any) => u.name === value);
                }
            } else if (structureAction === 'add-video') {
                // video added to unit.
                const { unitName, videoTitle, videoUrl } = body;
                const u = sub?.units?.find((u: any) => u.name === unitName);
                exists = u?.videos?.some((v: any) => v.title === videoTitle && v.url === videoUrl);
            }

            if (exists) {
                console.log(`[Idempotency] Item already exists: ${structureAction} - ${value || body.videoTitle}`);
                return res.status(200).json(structure);
            }
        }
    }

    try {
        if (structureAction === 'add-program') {
            const newProgram = {
                id: value.toLowerCase().replace(/\s+/g, '-'),
                name: value,
                years: []
            };

            await db.collection('academic_structure').updateOne(
                { _id: 'main' } as any,
                { $push: { programs: newProgram } } as any,
                { upsert: true }
            );
        }
        else if (structureAction === 'remove-program') {
            await db.collection('academic_structure').updateOne(
                { _id: 'main' } as any,
                { $pull: { programs: { id: programId } } } as any
            );
        }
        else if (structureAction === 'add-year') {
            const newYear = {
                id: value,
                name: `${value}${value === '1' ? 'st' : value === '2' ? 'nd' : value === '3' ? 'rd' : 'th'} Year`,
                semesters: []
            };

            await db.collection('academic_structure').updateOne(
                { _id: 'main', 'programs.id': programId } as any,
                { $push: { 'programs.$.years': newYear } } as any
            );
        }
        else if (structureAction === 'remove-year') {
            await db.collection('academic_structure').updateOne(
                { _id: 'main', 'programs.id': programId } as any,
                { $pull: { 'programs.$.years': { id: yearId } } } as any
            );
        }
        else if (structureAction === 'add-course') {
            const newCourse = {
                id: value.toLowerCase().replace(/\s+/g, '-'),
                name: value,
                semesters: []
            };

            await db.collection('academic_structure').updateOne(
                { _id: 'main', 'programs.id': programId, 'programs.years.id': yearId } as any,
                { $push: { 'programs.$[p].years.$[y].courses': newCourse } } as any,
                { arrayFilters: [{ 'p.id': programId }, { 'y.id': yearId }] }
            );
        }
        else if (structureAction === 'remove-course') {
            await db.collection('academic_structure').updateOne(
                { _id: 'main', 'programs.id': programId, 'programs.years.id': yearId } as any,
                { $pull: { 'programs.$[p].years.$[y].courses': { id: courseId } } } as any,
                { arrayFilters: [{ 'p.id': programId }, { 'y.id': yearId }] }
            );
        }
        else if (structureAction === 'add-semester') {
            const newSemester = {
                id: value.toLowerCase().replace(/\s+/g, '-'),
                name: value,
                subjects: []
            };

            await db.collection('academic_structure').updateOne(
                { _id: 'main', 'programs.id': programId, 'programs.years.id': yearId, 'programs.years.courses.id': courseId } as any,
                { $push: { 'programs.$[p].years.$[y].courses.$[c].semesters': newSemester } } as any,
                { arrayFilters: [{ 'p.id': programId }, { 'y.id': yearId }, { 'c.id': courseId }] }
            );
        }
        else if (structureAction === 'remove-semester') {
            await db.collection('academic_structure').updateOne(
                { _id: 'main', 'programs.id': programId, 'programs.years.id': yearId, 'programs.years.courses.id': courseId } as any,
                { $pull: { 'programs.$[p].years.$[y].courses.$[c].semesters': { id: semesterId } } } as any,
                { arrayFilters: [{ 'p.id': programId }, { 'y.id': yearId }, { 'c.id': courseId }] }
            );
        }
        else if (structureAction === 'add-subject') {
            await db.collection('academic_structure').updateOne(
                { _id: 'main', 'programs.id': programId, 'programs.years.id': yearId, 'programs.years.courses.id': courseId, 'programs.years.courses.semesters.id': semesterId } as any,
                { $push: { 'programs.$[p].years.$[y].courses.$[c].semesters.$[sem].subjects': value } } as any,
                { arrayFilters: [{ 'p.id': programId }, { 'y.id': yearId }, { 'c.id': courseId }, { 'sem.id': semesterId }] }
            );
        }
        else if (structureAction === 'remove-subject') {
            await db.collection('academic_structure').updateOne(
                { _id: 'main', 'programs.id': programId, 'programs.years.id': yearId, 'programs.years.courses.id': courseId, 'programs.years.courses.semesters.id': semesterId } as any,
                // Match either the string value OR an object with matching name property
                {
                    $pull: {
                        'programs.$[p].years.$[y].courses.$[c].semesters.$[sem].subjects': {
                            $or: [
                                { $eq: value },
                                { name: value }
                            ]
                        }
                    }
                } as any,
                { arrayFilters: [{ 'p.id': programId }, { 'y.id': yearId }, { 'c.id': courseId }, { 'sem.id': semesterId }] }
            );
        }
        else if (structureAction === 'add-unit') {
            const { subjectName } = body;

            // First, get the current subject to check if it's a string or object
            const structure = await db.collection('academic_structure').findOne({ _id: 'main' } as any);
            const program = structure?.programs?.find((p: any) => p.id === programId);
            const year = program?.years?.find((y: any) => y.id === yearId);
            const course = year?.courses?.find((c: any) => c.id === courseId);
            const semester = course?.semesters?.find((s: any) => s.id === semesterId);
            const subject = semester?.subjects?.find((s: any) =>
                (typeof s === 'string' ? s : s.name).trim() === subjectName.trim()
            );

            console.log('add-unit debug:', { programId, yearId, courseId, semesterId, subjectName, foundSubject: subject });

            if (!subject) {
                return res.status(404).json({ message: 'Subject not found' });
            }

            let result;
            if (typeof subject === 'string') {
                // Convert string subject to object with units array
                result = await db.collection('academic_structure').updateOne(
                    { _id: 'main', 'programs.id': programId, 'programs.years.id': yearId, 'programs.years.courses.id': courseId, 'programs.years.courses.semesters.id': semesterId } as any,
                    {
                        $set: {
                            'programs.$[p].years.$[y].courses.$[c].semesters.$[sem].subjects.$[s]': {
                                name: subject,
                                units: [value]
                            }
                        }
                    } as any,
                    { arrayFilters: [{ 'p.id': programId }, { 'y.id': yearId }, { 'c.id': courseId }, { 'sem.id': semesterId }, { 's': subject }] }
                );
            } else {
                // Subject is already an object, just push the unit
                console.log('Subject is object, pushing unit. Subject name:', subject.name);
                const filters = [{ 'p.id': programId }, { 'y.id': yearId }, { 'c.id': courseId }, { 'sem.id': semesterId }, { 's.name': subject.name }];
                console.log('Array filters:', JSON.stringify(filters));

                result = await db.collection('academic_structure').updateOne(
                    { _id: 'main', 'programs.id': programId, 'programs.years.id': yearId, 'programs.years.courses.id': courseId, 'programs.years.courses.semesters.id': semesterId } as any,
                    { $push: { 'programs.$[p].years.$[y].courses.$[c].semesters.$[sem].subjects.$[s].units': value } } as any,
                    { arrayFilters: filters }
                );
            }
            console.log('add-unit update result:', {
                matchedCount: result.matchedCount,
                modifiedCount: result.modifiedCount,
                acknowledged: result.acknowledged
            });
        }
        else if (structureAction === 'remove-unit') {
            const { subjectName } = body;

            // Similarly match string or object for unit removal (in case units get properties later, though currently they are usually strings, but let's be safe + they might be objects if we add video arrays to them! YES they do become objects when videos are added)
            await db.collection('academic_structure').updateOne(
                { _id: 'main', 'programs.id': programId, 'programs.years.id': yearId, 'programs.years.courses.id': courseId, 'programs.years.courses.semesters.id': semesterId } as any,
                {
                    $pull: {
                        'programs.$[p].years.$[y].courses.$[c].semesters.$[sem].subjects.$[s].units': {
                            $or: [
                                { $eq: value },
                                { name: value }
                            ]
                        }
                    }
                } as any,
                { arrayFilters: [{ 'p.id': programId }, { 'y.id': yearId }, { 'c.id': courseId }, { 'sem.id': semesterId }, { 's.name': subjectName }] }
            );
        }
        else if (structureAction === 'add-video') {
            const { subjectName, unitName, videoTitle, videoUrl } = body;

            // 1. Convert unit string to object if necessary
            await db.collection('academic_structure').updateOne(
                {
                    _id: 'main',
                    'programs.id': programId,
                    'programs.years.id': yearId,
                    'programs.years.courses.id': courseId,
                    'programs.years.courses.semesters.id': semesterId,
                    'programs.years.courses.semesters.subjects.name': subjectName,
                    'programs.years.courses.semesters.subjects.units': unitName // Matches string unit
                } as any,
                {
                    $set: {
                        'programs.$[p].years.$[y].courses.$[c].semesters.$[sem].subjects.$[s].units.$[u]': {
                            name: unitName,
                            videos: []
                        }
                    }
                } as any,
                {
                    arrayFilters: [
                        { 'p.id': programId },
                        { 'y.id': yearId },
                        { 'c.id': courseId },
                        { 'sem.id': semesterId },
                        { 's.name': subjectName },
                        { 'u': unitName } // Matches the string value
                    ]
                }
            );

            // 2. Add the video
            const newVideo = {
                id: Date.now().toString(),
                title: videoTitle,
                url: videoUrl,
                watched: false // Default state for user progress (though this should be user-specific ideally)
            };

            await db.collection('academic_structure').updateOne(
                { _id: 'main', 'programs.id': programId, 'programs.years.id': yearId, 'programs.years.courses.id': courseId, 'programs.years.courses.semesters.id': semesterId } as any,
                { $push: { 'programs.$[p].years.$[y].courses.$[c].semesters.$[sem].subjects.$[s].units.$[u].videos': newVideo } } as any,
                {
                    arrayFilters: [
                        { 'p.id': programId },
                        { 'y.id': yearId },
                        { 'c.id': courseId },
                        { 'sem.id': semesterId },
                        { 's.name': subjectName },
                        { 'u.name': unitName } // Matches the object name
                    ]
                }
            );
        }
        else if (structureAction === 'remove-video') {
            const { subjectName, unitName, videoId } = body;

            await db.collection('academic_structure').updateOne(
                { _id: 'main', 'programs.id': programId, 'programs.years.id': yearId, 'programs.years.courses.id': courseId, 'programs.years.courses.semesters.id': semesterId } as any,
                { $pull: { 'programs.$[p].years.$[y].courses.$[c].semesters.$[sem].subjects.$[s].units.$[u].videos': { id: videoId } } } as any,
                {
                    arrayFilters: [
                        { 'p.id': programId },
                        { 'y.id': yearId },
                        { 'c.id': courseId },
                        { 'sem.id': semesterId },
                        { 's.name': subjectName },
                        { 'u.name': unitName }
                    ]
                }
            );
        }
        else if (structureAction === 'rename') {
            const { type, id, newName, subjectName, unitName } = body;
            const structure = await db.collection('academic_structure').findOne({ _id: 'main' } as any);
            const targetId = id; // Renaming relies on ID matching (or name for sub/unit)

            console.log('Renaming:', { type, targetId, newName });

            let updateQuery = {};
            let arrayFilters = [];

            if (type === 'program') {
                updateQuery = { 'programs.$[p].name': newName };
                arrayFilters = [{ 'p.id': targetId }];
            } else if (type === 'year') {
                updateQuery = { 'programs.$[p].years.$[y].name': newName };
                arrayFilters = [{ 'p.id': programId }, { 'y.id': targetId }];
            } else if (type === 'course') {
                updateQuery = { 'programs.$[p].years.$[y].courses.$[c].name': newName };
                arrayFilters = [{ 'p.id': programId }, { 'y.id': yearId }, { 'c.id': targetId }];
            } else if (type === 'semester') {
                updateQuery = { 'programs.$[p].years.$[y].courses.$[c].semesters.$[sem].name': newName };
                arrayFilters = [{ 'p.id': programId }, { 'y.id': yearId }, { 'c.id': courseId }, { 'sem.id': targetId }];
            } else if (type === 'subject') {
                // Subject rename is tricky because it might be a string or object.
                // WE ONLY SUPPORT OBJECTS for robust renaming, or simple string replacement.
                // Assuming object structure for consistency or complex update.
                updateQuery = { 'programs.$[p].years.$[y].courses.$[c].semesters.$[sem].subjects.$[s].name': newName }; // If object
                // If it's a string, we might need a different approach, but let's assume objects for "editable" items as per new structure?
                // Actually, the frontend maps strings to objects.
                // Let's try to match by name (since subject ID is name often).
                // If the stored item is a string, we need to locate it by value and replace it.
                // MongoDB doesn't easily support "replace string in array if match".
                // So, we will assume we are modifying the object form or we have to pull and push.
                // For now, let's assume we match by name.
                const originalName = subjectName;
                // We'll stick to object update. If it fails (because it's a string), we might need migration.
                // But wait, the StructureCard uses "id" as name for strings.
                // Let's rely on arrayFilters matching the "name" property if object, or the value if string?
                // Actually, $set on a scalar array element is supported.
                // But we can't easily distinguish.
                // SIMPLIFICATION: Only support renaming if it's an object OR accept mixed.
                // We will try updating the 'name' field. If it's a string, this op does nothing.
                // To support string renaming, we need a separate logic found by value.

                // For this implementation, let's assume we target the object path 'name'.
                updateQuery = { 'programs.$[p].years.$[y].courses.$[c].semesters.$[sem].subjects.$[s].name': newName };
                arrayFilters = [{ 'p.id': programId }, { 'y.id': yearId }, { 'c.id': courseId }, { 'sem.id': semesterId }, { 's.name': originalName }];
            } else if (type === 'unit') {
                updateQuery = { 'programs.$[p].years.$[y].courses.$[c].semesters.$[sem].subjects.$[s].units.$[u].name': newName };
                arrayFilters = [{ 'p.id': programId }, { 'y.id': yearId }, { 'c.id': courseId }, { 'sem.id': semesterId }, { 's.name': subjectName }, { 'u.name': unitName }];
            } else if (type === 'video') {
                updateQuery = { 'programs.$[p].years.$[y].courses.$[c].semesters.$[sem].subjects.$[s].units.$[u].videos.$[v].title': newName };
                arrayFilters = [{ 'p.id': programId }, { 'y.id': yearId }, { 'c.id': courseId }, { 'sem.id': semesterId }, { 's.name': subjectName }, { 'u.name': unitName }, { 'v.id': targetId }];
            }

            if (Object.keys(updateQuery).length > 0) {
                await db.collection('academic_structure').updateOne(
                    { _id: 'main' } as any,
                    { $set: updateQuery } as any,
                    { arrayFilters }
                );
            }
        }
        else if (structureAction === 'reorder') {
            const { type, newOrder, subjectName, unitName } = body;

            // To safely reorder, it's often easiest to fetch, update in memory, and set back the specific path.
            // Using arrayFilters for replacement is possible but complex for deep nesting.
            // Given the document size is likely manageable, fetching 'main' is acceptable.

            const structure = await db.collection('academic_structure').findOne({ _id: 'main' } as any);
            if (!structure) throw new Error('Structure not found');

            let target: any = structure;
            let path = '';

            if (type === 'program') {
                target.programs = newOrder;
                path = 'programs';
            } else if (type === 'year') {
                const p = target.programs.find((p: any) => p.id === programId);
                if (p) p.years = newOrder;
                path = 'programs'; // We update the whole programs array to be safe or use positional operator if we were using updateOne logic strictly
            } else if (type === 'course') {
                const p = target.programs.find((p: any) => p.id === programId);
                const y = p?.years.find((y: any) => y.id === yearId);
                if (y) y.courses = newOrder;
                path = 'programs';
            } else if (type === 'semester') {
                const p = target.programs.find((p: any) => p.id === programId);
                const y = p?.years.find((y: any) => y.id === yearId);
                const c = y?.courses.find((c: any) => c.id === courseId);
                if (c) c.semesters = newOrder;
                path = 'programs';
            } else if (type === 'subject') {
                const p = target.programs.find((p: any) => p.id === programId);
                const y = p?.years.find((y: any) => y.id === yearId);
                const c = y?.courses.find((c: any) => c.id === courseId);
                const s = c?.semesters.find((s: any) => s.id === semesterId);
                if (s) s.subjects = newOrder;
                path = 'programs';
            } else if (type === 'unit') {
                const p = target.programs.find((p: any) => p.id === programId);
                const y = p?.years.find((y: any) => y.id === yearId);
                const c = y?.courses.find((c: any) => c.id === courseId);
                const s = c?.semesters.find((s: any) => s.id === semesterId);
                const sub = s?.subjects.find((sub: any) => (typeof sub === 'string' ? sub : sub.name) === subjectName);
                if (sub && typeof sub !== 'string') sub.units = newOrder;
                path = 'programs';
            } else if (type === 'video') {
                const p = target.programs.find((p: any) => p.id === programId);
                const y = p?.years.find((y: any) => y.id === yearId);
                const c = y?.courses.find((c: any) => c.id === courseId);
                const s = c?.semesters.find((s: any) => s.id === semesterId);
                const sub = s?.subjects.find((sub: any) => (typeof sub === 'string' ? sub : sub.name) === subjectName);
                const u = sub?.units?.find((u: any) => u.name === unitName);
                if (u) u.videos = newOrder;
                path = 'programs';
            }

            // Save the updated structure (replacing the programs array is safest for nested integrity)
            await db.collection('academic_structure').updateOne(
                { _id: 'main' } as any,
                { $set: { programs: target.programs } } as any
            );
        }

        const updatedStructure = await db.collection('academic_structure').findOne({ _id: 'main' } as any);
        return res.status(200).json(updatedStructure);
    } catch (error) {
        console.error('Structure Update Error:', error);
        return res.status(500).json({ message: 'Failed to update structure', error: String(error) });
    }
}

async function handleGetUsers(res: VercelResponse) {
    console.log('[Admin] Fetching users...');

    try {
        const db = await getDb();

        // Fetch all users (excluding passwords)
        const users = await db.collection('users')
            .find({}, { projection: { password: 0 } })
            .sort({ createdAt: -1 })
            .toArray();

        console.log(`[Admin] Found ${users.length} users`);

        // Log first user for debugging (without sensitive data)
        if (users.length > 0) {
            console.log('[Admin] Sample user:', {
                name: users[0].name,
                email: users[0].email,
                role: users[0].role,
                hasAvatar: !!users[0].avatar
            });
        }

        return res.status(200).json({ users });
    } catch (error) {
        console.error('[Admin] Error fetching users:', error);
        return res.status(500).json({
            users: [],
            message: 'Failed to fetch users',
            error: String(error)
        });
    }
}

async function handleUserAction(body: any, res: VercelResponse) {
    const { action, userId, role } = body;

    console.log('handleUserAction called with action:', action, 'userId:', userId);

    if (!userId) {
        return res.status(400).json({ message: 'User ID is required' });
    }

    const db = await getDb();

    // Handle delete action separately as it requires deletion instead of update
    if (action === 'delete') {
        console.log('DELETE ACTION DETECTED - Starting user deletion process');
        // First check if user exists
        const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });

        if (!user) {
            console.log('User not found:', userId);
            return res.status(404).json({ message: 'User not found' });
        }

        console.log('User found, deleting resources for userId:', userId);
        // Delete all resources/uploads by this user
        // Note: uploaderId is stored as a string in resources collection
        const resourcesDeleted = await db.collection('resources').deleteMany({
            uploaderId: userId
        });
        console.log('Resources deleted:', resourcesDeleted.deletedCount);

        // Delete the user
        const userDeleted = await db.collection('users').deleteOne({
            _id: new ObjectId(userId)
        });
        console.log('User deleted:', userDeleted.deletedCount);

        if (userDeleted.deletedCount === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        return res.status(200).json({
            message: 'User and all associated data deleted successfully',
            deletedUser: user.name,
            deletedResources: resourcesDeleted.deletedCount
        });
    }

    console.log('Not a delete action, proceeding to switch statement');

    let updateOperation: any = {};

    switch (action) {
        case 'ban':
            updateOperation = { $set: { isBanned: true, canUpload: false } };
            break;
        case 'unban':
            updateOperation = { $set: { isBanned: false, canUpload: true } };
            break;
        case 'restrict-upload':
            // Legacy support, maps to restrict
            updateOperation = { $set: { isRestricted: true, canUpload: false } };
            break;
        case 'allow-upload':
            // Legacy support, maps to unrestrict
            updateOperation = { $set: { isRestricted: false, canUpload: true } };
            break;
        case 'restrict':
            updateOperation = { $set: { isRestricted: true, canUpload: false } };
            break;
        case 'unrestrict':
            updateOperation = { $set: { isRestricted: false, canUpload: true } };
            break;
        case 'trust':
            updateOperation = { $set: { isTrusted: true } };
            break;
        case 'untrust':
            updateOperation = { $set: { isTrusted: false } };
            break;
        case 'assign-role':
            if (!role) return res.status(400).json({ message: 'Role is required' });
            updateOperation = { $set: { role: role } };
            break;
        default:
            return res.status(400).json({ message: 'Invalid user action' });
    }

    const result = await db.collection('users').findOneAndUpdate(
        { _id: new ObjectId(userId) },
        updateOperation,
        { returnDocument: 'after', projection: { password: 0 } }
    );

    if (!result) {
        return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({ message: `User ${action} successful`, user: result });
}

async function handleGetStats(res: VercelResponse) {
    const db = await getDb();

    // Count total approved resources and active users in parallel
    const [totalResources, totalUsers] = await Promise.all([
        db.collection('resources').countDocuments({
            $or: [
                { status: 'approved' },
                { status: 'public' }, // Assuming 'isPublic' might correspond to a status or field check
                { isPublic: true }
            ]
        }),
        db.collection('users').countDocuments({})
    ]);

    return res.status(200).json({
        totalResources,
        totalUsers
    });
}
