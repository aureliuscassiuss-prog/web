import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from '../../lib/mongodb.js';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Content-Type', 'application/json');

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

        let body = req.body;
        if (typeof body === 'string') {
            try {
                body = JSON.parse(body);
            } catch (e) {
                console.error('Error parsing body:', e);
                return res.status(400).json({ message: 'Invalid JSON body' });
            }
        }

        const { name, email, avatar, phone, semester, college, branch, year } = body || {};

        const db = await getDb();

        // Build update object (only include provided fields)
        const updateFields: any = {};
        if (name !== undefined) updateFields.name = name;
        if (email !== undefined) updateFields.email = email;
        if (avatar !== undefined) updateFields.avatar = avatar;
        if (phone !== undefined) updateFields.phone = phone;
        if (semester !== undefined) updateFields.semester = semester;
        if (college !== undefined) updateFields.college = college;
        if (branch !== undefined) updateFields.branch = branch;
        if (year !== undefined) updateFields.year = year;

        console.log('Updating user:', decoded.userId, 'with fields:', updateFields);

        // Update user
        const result = await db.collection('users').findOneAndUpdate(
            { _id: new ObjectId(decoded.userId) },
            { $set: updateFields },
            { returnDocument: 'after' }
        );

        console.log('Update result:', result);

        if (!result) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Return updated user (without password)
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
