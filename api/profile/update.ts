import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from '../../lib/mongodb.js';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import formidable from 'formidable';
import fs from 'fs';
import { handleCors } from '../../lib/cors.js';

// Disable default body parsing for Vercel
export const config = {
    api: {
        bodyParser: false,
    },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Handle CORS
    if (handleCors(req, res)) return;

    if (req.method !== 'PUT') {
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
        const decoded = jwt.verify(token, process.env.JWT_SECRET) as { userId: string };

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
        const year = getValue('year');

        const db = await getDb();

        // Build update object
        const updateFields: any = {};
        if (name) updateFields.name = name;
        if (email) updateFields.email = email;
        if (phone) updateFields.phone = phone;
        if (semester) updateFields.semester = parseInt(semester as string);
        if (college) updateFields.college = college;
        if (branch) updateFields.branch = branch;
        if (year) updateFields.year = parseInt(year as string);

        // Handle Avatar File
        const avatarFile = files.avatar?.[0];
        if (avatarFile) {
            // Convert file to Base64 string
            const fileData = fs.readFileSync(avatarFile.filepath);
            const base64Image = `data:${avatarFile.mimetype};base64,${fileData.toString('base64')}`;
            updateFields.avatar = base64Image;
        }

        console.log('Updating user:', decoded.userId, 'with fields:', Object.keys(updateFields));

        // Update user
        const result = await db.collection('users').findOneAndUpdate(
            { _id: new ObjectId(decoded.userId) },
            { $set: updateFields },
            { returnDocument: 'after' }
        );

        if (!result) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Return updated user
        res.status(200).json({
            user: {
                id: result._id,
                name: result.name,
                email: result.email,
                avatar: result.avatar,
                phone: result.phone,
                semester: result.semester,
                college: result.college,
                branch: result.branch,
                year: result.year,
                reputation: result.reputation || 0
            }
        });

    } catch (error) {
        console.error('Profile update error:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return res.status(500).json({ message: 'Server error', error: errorMessage });
    }
}
