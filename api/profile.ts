import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from '../lib/mongodb.js';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import formidable from 'formidable';
import fs from 'fs';

// Disable default body parsing for Vercel
export const config = {
    api: {
        bodyParser: false,
    },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
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
        const decoded = jwt.verify(token, process.env.JWT_SECRET) as { userId: string };

        if (req.method === 'GET') {
            return await handleGetUploads(decoded.userId, res);
        } else if (req.method === 'PUT') {
            return await handleUpdateProfile(req, decoded.userId, res);
        } else {
            return res.status(405).json({ message: 'Method not allowed' });
        }
    } catch (error) {
        console.error('Profile error:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return res.status(500).json({ message: 'Server error', error: errorMessage });
    }
}

async function handleGetUploads(userId: string, res: VercelResponse) {
    const db = await getDb();

    // Get user's uploads
    const uploads = await db.collection('resources')
        .find({ uploaderId: userId })
        .sort({ createdAt: -1 })
        .toArray();

    // Fetch interaction status for each resource
    // Since we already have the resource documents, we can just check the arrays
    const uploadsWithStatus = uploads.map(resource => ({
        ...resource,
        userLiked: resource.likedBy?.includes(userId) || false,
        userDisliked: resource.dislikedBy?.includes(userId) || false,
        userSaved: resource.savedBy?.includes(userId) || false,
        userFlagged: resource.flaggedBy?.includes(userId) || false
    }));

    return res.status(200).json({ uploads: uploadsWithStatus });
}

async function handleUpdateProfile(req: VercelRequest, userId: string, res: VercelResponse) {
    // Parse form data
    const form = formidable({
        keepExtensions: true,
        maxFileSize: 5 * 1024 * 1024, // 5MB limit
    });

    const [fields, files] = await new Promise<[formidable.Fields, formidable.Files]>((resolve, reject) => {
        form.parse(req, (err, fields, files) => {
            if (err) reject(err);
            else resolve([fields, files]);
        });
    });

    // Helper to get single value from fields
    const getValue = (key: string) => {
        const val = fields[key];
        if (Array.isArray(val)) return val[0];
        return val;
    };

    const name = getValue('name');
    const email = getValue('email');
    const phone = getValue('phone');
    const semester = getValue('semester');
    const college = getValue('college');
    const branch = getValue('branch');
    const course = getValue('course'); // Program
    const year = getValue('year');

    const gender = getValue('gender');

    const db = await getDb();

    // Build update object
    const updateFields: any = {};
    if (name) updateFields.name = name;
    if (email) updateFields.email = email;
    if (phone) updateFields.phone = phone;
    if (semester) updateFields.semester = semester;
    if (college) updateFields.college = college;
    if (branch) updateFields.branch = branch;
    if (course) updateFields.course = course;
    if (year) updateFields.year = parseInt(year as string);
    if (gender) updateFields.gender = gender;

    // Handle Avatar File
    const avatarFile = files.avatar?.[0];
    if (avatarFile) {
        // Convert file to Base64 string
        const fileData = fs.readFileSync(avatarFile.filepath);
        const base64Image = `data:${avatarFile.mimetype};base64,${fileData.toString('base64')}`;
        updateFields.avatar = base64Image;
    } else if (gender && !updateFields.avatar) {
        // If gender changed but no new avatar uploaded, check if we should set default
        // We only set default if current avatar is one of the defaults or empty
        // But for simplicity, let's just update the avatar if it's currently empty or a default one
        // Actually, better to let the frontend handle the "preview" and send the avatar if needed.
        // But the requirement is "set default avatar accordingly".
        // If the user selects gender in the modal, we might want to update the avatar too if they don't have a custom one.

        // Let's check the current user first
        const currentUser = await db.collection('users').findOne({ _id: new ObjectId(userId) });
        if (currentUser && (!currentUser.avatar || currentUser.avatar === '/1.webp' || currentUser.avatar === '/girl.webp')) {
            updateFields.avatar = gender === 'female' ? '/girl.webp' : '/1.webp';
        }
    }

    console.log('Updating user:', userId, 'with fields:', Object.keys(updateFields));

    // Update user
    const result = await db.collection('users').findOneAndUpdate(
        { _id: new ObjectId(userId) },
        { $set: updateFields },
        { returnDocument: 'after' }
    );

    if (!result) {
        return res.status(404).json({ message: 'User not found' });
    }

    // Return updated user
    return res.status(200).json({
        user: {
            id: result._id,
            name: result.name,
            email: result.email,
            avatar: result.avatar,
            phone: result.phone,
            semester: result.semester,
            college: result.college,
            branch: result.branch,
            course: result.course,
            year: result.year,
            gender: result.gender,
            reputation: result.reputation || 0
        }
    });
}
