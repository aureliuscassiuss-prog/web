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
        const { action } = req.query;

        // Public GET routes
        if (req.method === 'GET') {
            if (action === 'structure') return await handleGetStructure(res);
            if (action === 'stats') return await handleGetStats(res);
        }

        // Auth Check
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const token = authHeader.split(' ')[1];
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET);
        const db = await getDb();
        const user = await db.collection('users').findOne({ _id: new ObjectId(decoded.userId) });

        const allowedRoles = ['admin', 'semi-admin', 'content-reviewer', 'structure-manager'];
        if (!user || !allowedRoles.includes(user.role)) {
            return res.status(403).json({ message: 'Forbidden' });
        }

        const hasPermission = (requiredRoles: string[]) => requiredRoles.includes(user.role);

        // Authenticated GET
        if (req.method === 'GET') {
            if (action === 'pending') {
                if (!hasPermission(['admin', 'semi-admin', 'content-reviewer'])) return res.status(403).json({ message: 'Forbidden' });
                return await handleGetPending(res);
            } else if (action === 'users') {
                if (!hasPermission(['admin', 'semi-admin'])) return res.status(403).json({ message: 'Forbidden' });
                return await handleGetUsers(res);
            }
        }
        // Authenticated POST
        else if (req.method === 'POST') {
            let body = req.body;
            if (typeof body === 'string') body = JSON.parse(body);

            const { action: bodyAction, userAction } = body;

            if (userAction) {
                if (!hasPermission(['admin'])) return res.status(403).json({ message: 'Forbidden' });
                return await handleUserAction(body, res);
            } else if (bodyAction === 'approve' || bodyAction === 'reject') {
                if (!hasPermission(['admin', 'semi-admin', 'content-reviewer'])) return res.status(403).json({ message: 'Forbidden' });
                return await handleResourceAction(body, res);
            } else if (bodyAction === 'structure') {
                if (!hasPermission(['admin', 'structure-manager'])) return res.status(403).json({ message: 'Forbidden' });
                return await handleUpdateStructure(body, res);
            }
        }

        return res.status(400).json({ message: 'Invalid action' });

    } catch (error) {
        console.error('Admin API Error:', error);
        return res.status(500).json({ message: 'Server error', error: String(error) });
    }
}

// --- STRUCTURE HANDLER (REWRITTEN FOR STABILITY) ---

async function handleUpdateStructure(body: any, res: VercelResponse) {
    const {
        structureAction, programId, yearId, semesterId, courseId,
        name, value, subjectName, unitName, videoTitle, videoUrl, videoId, newName, newOrder
    } = body;

    console.log(`[Structure Update] Action: ${structureAction}`);

    const db = await getDb();

    // 1. FETCH
    let structure: any = await db.collection('academic_structure').findOne({ _id: 'main' });

    if (!structure) {
        structure = { _id: 'main', programs: [] };
    }
    if (!structure.programs) structure.programs = [];

    // Helper: Generate ID from name
    const genId = (val: string) => val ? val.toLowerCase().trim().replace(/\s+/g, '-') : '';

    // 2. TRAVERSE & MODIFY IN MEMORY
    try {
        // Pointers to current level
        let pIndex = -1, yIndex = -1, cIndex = -1, sIndex = -1, subIndex = -1, uIndex = -1;

        // Find Program
        if (programId) {
            pIndex = structure.programs.findIndex((p: any) => p.id === programId);
        }

        // --- ADDING ITEMS ---
        if (structureAction === 'add-program') {
            const newId = genId(value);
            // Check Duplicate
            if (!structure.programs.some((p: any) => p.id === newId)) {
                structure.programs.push({ id: newId, name: value, years: [] });
            }
        }
        else if (pIndex !== -1) {
            const program = structure.programs[pIndex];
            if (!program.years) program.years = [];

            if (structureAction === 'add-year') {
                const newId = value; // Year IDs are usually '1', '2'
                if (!program.years.some((y: any) => y.id === newId)) {
                    program.years.push({
                        id: newId,
                        name: `${value}${value === '1' ? 'st' : value === '2' ? 'nd' : value === '3' ? 'rd' : 'th'} Year`,
                        courses: []
                    });
                }
            }
            else if (yearId) {
                yIndex = program.years.findIndex((y: any) => y.id === yearId);
                if (yIndex !== -1) {
                    const year = program.years[yIndex];
                    if (!year.courses) year.courses = [];

                    if (structureAction === 'add-course') {
                        const newId = genId(value);
                        if (!year.courses.some((c: any) => c.id === newId)) {
                            year.courses.push({ id: newId, name: value, semesters: [] });
                        }
                    }
                    else if (courseId) {
                        cIndex = year.courses.findIndex((c: any) => c.id === courseId);
                        if (cIndex !== -1) {
                            const course = year.courses[cIndex];
                            if (!course.semesters) course.semesters = [];

                            if (structureAction === 'add-semester') {
                                const newId = genId(value);
                                if (!course.semesters.some((s: any) => s.id === newId)) {
                                    course.semesters.push({ id: newId, name: value, subjects: [] });
                                }
                            }
                            else if (semesterId) {
                                sIndex = course.semesters.findIndex((s: any) => s.id === semesterId);
                                if (sIndex !== -1) {
                                    const semester = course.semesters[sIndex];
                                    if (!semester.subjects) semester.subjects = [];

                                    if (structureAction === 'add-subject') {
                                        // Store as Object to prevent glitches later
                                        const exists = semester.subjects.some((s: any) =>
                                            (typeof s === 'string' ? s : s.name) === value
                                        );
                                        if (!exists) {
                                            semester.subjects.push({ name: value, units: [] });
                                        }
                                    }
                                    else if (structureAction === 'add-unit' || structureAction === 'remove-subject' || structureAction === 'rename' || structureAction === 'add-video' || structureAction === 'remove-unit') {
                                        // We need to find the subject. It might be a string or object.
                                        // Target name is passed as 'subjectName' or 'value' depending on context
                                        const targetSubName = subjectName || (structureAction === 'remove-subject' ? value : null);

                                        subIndex = semester.subjects.findIndex((s: any) =>
                                            (typeof s === 'string' ? s : s.name) === targetSubName
                                        );

                                        if (subIndex !== -1) {
                                            // MIGRATION: If subject is string, convert to object immediately
                                            if (typeof semester.subjects[subIndex] === 'string') {
                                                semester.subjects[subIndex] = {
                                                    name: semester.subjects[subIndex],
                                                    units: []
                                                };
                                            }
                                            const subject = semester.subjects[subIndex];
                                            if (!subject.units) subject.units = [];

                                            if (structureAction === 'add-unit') {
                                                const exists = subject.units.some((u: any) => (typeof u === 'string' ? u : u.name) === value);
                                                if (!exists) {
                                                    subject.units.push({ name: value, videos: [] });
                                                }
                                            }
                                            else if (structureAction === 'add-video') {
                                                uIndex = subject.units.findIndex((u: any) => (typeof u === 'string' ? u : u.name) === unitName);
                                                if (uIndex !== -1) {
                                                    // MIGRATION: If unit is string, convert to object
                                                    if (typeof subject.units[uIndex] === 'string') {
                                                        subject.units[uIndex] = { name: subject.units[uIndex], videos: [] };
                                                    }
                                                    const unit = subject.units[uIndex];
                                                    if (!unit.videos) unit.videos = [];

                                                    // Check duplicate video
                                                    if (!unit.videos.some((v: any) => v.url === videoUrl)) {
                                                        unit.videos.push({
                                                            id: Date.now().toString(),
                                                            title: videoTitle,
                                                            url: videoUrl,
                                                            watched: false
                                                        });
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        // --- REMOVAL ACTIONS (Using standard JS splice/filter) ---
        if (structureAction === 'remove-program') {
            structure.programs = structure.programs.filter((p: any) => p.id !== programId);
        }
        else if (structureAction === 'remove-year' && pIndex !== -1) {
            structure.programs[pIndex].years = structure.programs[pIndex].years.filter((y: any) => y.id !== yearId);
        }
        else if (structureAction === 'remove-course' && pIndex !== -1 && yIndex !== -1) {
            structure.programs[pIndex].years[yIndex].courses = structure.programs[pIndex].years[yIndex].courses.filter((c: any) => c.id !== courseId);
        }
        else if (structureAction === 'remove-semester' && pIndex !== -1 && yIndex !== -1 && cIndex !== -1) {
            structure.programs[pIndex].years[yIndex].courses[cIndex].semesters = structure.programs[pIndex].years[yIndex].courses[cIndex].semesters.filter((s: any) => s.id !== semesterId);
        }
        else if (structureAction === 'remove-subject' && pIndex !== -1 && yIndex !== -1 && cIndex !== -1 && sIndex !== -1) {
            // Filter out by name (handles both string and object subjects)
            structure.programs[pIndex].years[yIndex].courses[cIndex].semesters[sIndex].subjects =
                structure.programs[pIndex].years[yIndex].courses[cIndex].semesters[sIndex].subjects
                    .filter((s: any) => (typeof s === 'string' ? s : s.name) !== value);
        }
        else if (structureAction === 'remove-unit' && pIndex !== -1 && yIndex !== -1 && cIndex !== -1 && sIndex !== -1 && subIndex !== -1) {
            // Filter units
            structure.programs[pIndex].years[yIndex].courses[cIndex].semesters[sIndex].subjects[subIndex].units =
                structure.programs[pIndex].years[yIndex].courses[cIndex].semesters[sIndex].subjects[subIndex].units
                    .filter((u: any) => (typeof u === 'string' ? u : u.name) !== value);
        }
        else if (structureAction === 'remove-video' && pIndex !== -1 && yIndex !== -1 && cIndex !== -1 && sIndex !== -1 && subIndex !== -1) {
            // Find unit index again based on unitName passed in body
            const unitIdx = structure.programs[pIndex].years[yIndex].courses[cIndex].semesters[sIndex].subjects[subIndex].units
                .findIndex((u: any) => (typeof u === 'string' ? u : u.name) === unitName);

            if (unitIdx !== -1) {
                structure.programs[pIndex].years[yIndex].courses[cIndex].semesters[sIndex].subjects[subIndex].units[unitIdx].videos =
                    structure.programs[pIndex].years[yIndex].courses[cIndex].semesters[sIndex].subjects[subIndex].units[unitIdx].videos
                        .filter((v: any) => v.id !== videoId);
            }
        }

        // --- RENAME ACTIONS ---
        if (structureAction === 'rename') {
            // Logic: Traverse to item, set .name property
            if (pIndex !== -1 && !yearId) structure.programs[pIndex].name = newName;
            else if (yIndex !== -1 && !courseId) structure.programs[pIndex].years[yIndex].name = newName;
            else if (cIndex !== -1 && !semesterId) structure.programs[pIndex].years[yIndex].courses[cIndex].name = newName;
            else if (sIndex !== -1 && !subjectName) structure.programs[pIndex].years[yIndex].courses[cIndex].semesters[sIndex].name = newName;
            else if (subIndex !== -1 && !unitName) {
                // Rename Subject
                const subj = structure.programs[pIndex].years[yIndex].courses[cIndex].semesters[sIndex].subjects[subIndex];
                if (typeof subj === 'string') {
                    // Convert to object with new name, preserve nothing (string had no props)
                    structure.programs[pIndex].years[yIndex].courses[cIndex].semesters[sIndex].subjects[subIndex] = { name: newName, units: [] };
                } else {
                    subj.name = newName;
                }
            }
            else if (unitName && !videoTitle) { // Rename Unit
                const subj = structure.programs[pIndex].years[yIndex].courses[cIndex].semesters[sIndex].subjects[subIndex];
                const uIdx = subj.units.findIndex((u: any) => (typeof u === 'string' ? u : u.name) === unitName);
                if (uIdx !== -1) {
                    if (typeof subj.units[uIdx] === 'string') {
                        subj.units[uIdx] = { name: newName, videos: [] };
                    } else {
                        subj.units[uIdx].name = newName;
                    }
                }
            }
        }

        // --- REORDER ACTIONS ---
        if (structureAction === 'reorder') {
            // Apply newOrder array to the specific level
            // Note: newOrder implies the *entire* array for that level is sent back sorted
            const { type } = body;
            if (type === 'program') structure.programs = newOrder;
            else if (type === 'year' && pIndex !== -1) structure.programs[pIndex].years = newOrder;
            else if (type === 'course' && yIndex !== -1) structure.programs[pIndex].years[yIndex].courses = newOrder;
            else if (type === 'semester' && cIndex !== -1) structure.programs[pIndex].years[yIndex].courses[cIndex].semesters = newOrder;
            else if (type === 'subject' && sIndex !== -1) structure.programs[pIndex].years[yIndex].courses[cIndex].semesters[sIndex].subjects = newOrder;
            else if (type === 'unit' && subIndex !== -1) structure.programs[pIndex].years[yIndex].courses[cIndex].semesters[sIndex].subjects[subIndex].units = newOrder;
            else if (type === 'video' && subIndex !== -1) {
                const uIdx = structure.programs[pIndex].years[yIndex].courses[cIndex].semesters[sIndex].subjects[subIndex].units
                    .findIndex((u: any) => (typeof u === 'string' ? u : u.name) === unitName);
                if (uIdx !== -1) {
                    structure.programs[pIndex].years[yIndex].courses[cIndex].semesters[sIndex].subjects[subIndex].units[uIdx].videos = newOrder;
                }
            }
        }

    } catch (err) {
        console.error("Structure Traversal Error:", err);
        // Fallthrough: we might still save valid parts or fail safely
    }

    // 3. SAVE (Full Replace ensures consistency)
    await db.collection('academic_structure').replaceOne({ _id: 'main' }, structure);

    return res.status(200).json(structure);
}

// --- OTHER HANDLERS (UNCHANGED) ---

async function handleGetStructure(res: VercelResponse) {
    const db = await getDb();
    const structure = await db.collection('academic_structure').findOne({ _id: 'main' });
    if (!structure) {
        const defaultStruct = { _id: 'main', programs: [] };
        await db.collection('academic_structure').insertOne(defaultStruct);
        return res.status(200).json(defaultStruct);
    }
    return res.status(200).json(structure);
}

async function handleGetPending(res: VercelResponse) {
    const db = await getDb();
    const pendingResources = await db.collection('resources').aggregate([
        { $match: { status: 'pending' } },
        { $sort: { createdAt: -1 } }
    ]).toArray();

    // Quick manual lookup for user details to avoid complex joins if not needed, 
    // or keep your aggregation if it works. Simplified here for safety.
    const enriched = await Promise.all(pendingResources.map(async (r) => {
        const u = r.uploaderId ? await db.collection('users').findOne({ _id: new ObjectId(r.uploaderId) }) : null;
        return {
            ...r,
            uploaderName: u ? u.name : 'Unknown',
            uploaderAvatar: u ? u.avatar : null
        };
    }));

    return res.status(200).json({ resources: enriched });
}

async function handleResourceAction(body: any, res: VercelResponse) {
    const { action, resourceId } = body;
    if (!resourceId) return res.status(400).json({ message: 'Resource ID required' });
    const db = await getDb();

    if (action === 'approve') {
        const resource = await db.collection('resources').findOneAndUpdate(
            { _id: new ObjectId(resourceId) },
            { $set: { status: 'approved' } },
            { returnDocument: 'after' }
        );
        if (resource && resource.uploaderId) {
            await db.collection('users').updateOne(
                { _id: new ObjectId(resource.uploaderId) },
                { $inc: { reputation: 10 } }
            );
        }
        return res.status(200).json({ message: 'Approved' });
    } else if (action === 'reject') {
        await db.collection('resources').deleteOne({ _id: new ObjectId(resourceId) });
        return res.status(200).json({ message: 'Rejected' });
    }
    return res.status(400).json({ message: 'Invalid action' });
}

async function handleGetStats(res: VercelResponse) {
    const db = await getDb();
    const totalResources = await db.collection('resources').countDocuments({ status: 'approved' });
    const totalUsers = await db.collection('users').countDocuments({});
    return res.status(200).json({ totalResources, totalUsers });
}

async function handleGetUsers(res: VercelResponse) {
    const db = await getDb();
    const users = await db.collection('users').find({}, { projection: { password: 0 } }).sort({ createdAt: -1 }).toArray();
    return res.status(200).json({ users });
}

async function handleUserAction(body: any, res: VercelResponse) {
    const { action, userId, role } = body;
    const db = await getDb();

    if (action === 'delete') {
        await db.collection('resources').deleteMany({ uploaderId: userId });
        await db.collection('users').deleteOne({ _id: new ObjectId(userId) });
        return res.status(200).json({ message: 'User deleted' });
    }

    let update = {};
    if (action === 'ban') update = { isBanned: true, canUpload: false };
    else if (action === 'unban') update = { isBanned: false, canUpload: true };
    else if (action === 'assign-role') update = { role: role };

    await db.collection('users').updateOne({ _id: new ObjectId(userId) }, { $set: update });
    return res.status(200).json({ message: 'Updated' });
}