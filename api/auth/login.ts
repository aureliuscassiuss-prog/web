import type { VercelRequest, VercelResponse } from '@vercel/node';

import { getDb } from '../../lib/mongodb.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Set CORS headers
    res.setHeader('Content-Type', 'application/json');

    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    // Check for required environment variables
    if (!process.env.MONGODB_URI) {
        console.error('MONGODB_URI not set');
        return res.status(500).json({ message: 'Server misconfiguration: MONGODB_URI not set', error: 'MONGODB_URI not set' });
    }

    if (!process.env.JWT_SECRET) {
        console.error('JWT_SECRET not set');
        return res.status(500).json({ message: 'Server misconfiguration: JWT_SECRET not set', error: 'JWT_SECRET not set' });
    }

    try {
        let body = req.body;
        if (typeof body === 'string') {
            try {
                body = JSON.parse(body);
            } catch (e) {
                console.error('Error parsing body:', e);
                return res.status(400).json({ message: 'Invalid JSON body' });
            }
        }

        const { email, password } = body || {};

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const db = await getDb();
        const user = await db.collection('users').findOne({ email });

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check if this is an admin email
        const ADMIN_EMAIL = 'rajraja8852@gmail.com';
        const isAdmin = user.email === ADMIN_EMAIL;

        // Update user role in database if needed
        if (isAdmin && user.role !== 'admin') {
            await db.collection('users').updateOne(
                { _id: user._id },
                { $set: { role: 'admin' } }
            );
        }

        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(200).json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                reputation: user.reputation || 0,
                avatar: user.avatar,
                phone: user.phone,
                semester: user.semester,
                college: user.college,
                branch: user.branch,
                year: user.year,
                role: isAdmin ? 'admin' : (user.role || 'user')
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return res.status(500).json({ message: 'Server error', error: errorMessage });
    }
}
