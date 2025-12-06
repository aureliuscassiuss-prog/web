import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db, auth } from '../lib/firebase-admin.js';
import jwt from 'jsonwebtoken';

interface User {
    uid: string;
    email: string;
    name: string;
    role: string;
    avatar?: string;
    reputation: number;
    createdAt: any; // Firestore Timestamp
    // Add other fields as needed
}

const ADMIN_EMAIL = 'trilliontip@gmail.com';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS & Headers
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

    try {
        let body = req.body;
        if (typeof body === 'string') {
            try {
                body = JSON.parse(body);
            } catch (e) {
                return res.status(400).json({ message: 'Invalid JSON body' });
            }
        }

        const { action } = body || {};
        console.log('Auth API Request:', { action });

        if (action === 'firebase-login') {
            return await handleFirebaseLogin(body, res);
        } else {
            return res.status(400).json({ message: 'Only firebase-login is supported now.' });
        }
    } catch (error: any) {
        console.error('Auth handler error:', error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
}

async function handleFirebaseLogin(body: any, res: VercelResponse) {
    const { token, userData } = body;

    if (!token) {
        return res.status(400).json({ message: 'No firebase token provided' });
    }

    try {
        // 1. Verify Firebase Token
        const decodedToken = await auth.verifyIdToken(token);
        const { email, uid, name, picture } = decodedToken;

        if (!email) {
            return res.status(400).json({ message: 'Email not found in firebase token' });
        }

        // 2. Interact with Firestore
        const userRef = db.collection('users').doc(uid);
        const userDoc = await userRef.get();

        let userPayload: any;
        const isAdmin = email === ADMIN_EMAIL;

        if (!userDoc.exists) {
            // Create New User
            const newUser = {
                uid,
                name: name || userData?.name || 'User',
                email,
                avatar: picture || '/boy1.png',
                reputation: 0,
                role: isAdmin ? 'admin' : 'user',
                createdAt: new Date(),
                updatedAt: new Date(),
                isBanned: false,
                uploads: [],
                // Default fields for profile compatibility
                semester: 1,
                year: 1,
                college: 'Medicaps University'
            };

            await userRef.set(newUser);
            userPayload = newUser;
        } else {
            // Update Existing User
            const existingData = userDoc.data();
            if (existingData?.isBanned) {
                return res.status(403).json({ message: 'User is banned' });
            }

            const updates: any = { updatedAt: new Date() };
            if (!existingData?.avatar && picture) updates.avatar = picture;
            if (isAdmin && existingData?.role !== 'admin') updates.role = 'admin';

            await userRef.set(updates, { merge: true });

            // Merge for response
            userPayload = { ...existingData, ...updates };
        }

        // 3. Generate App Session Token (JWT)
        // We use the Firestore UID as the userId now
        const appToken = jwt.sign(
            { userId: uid, email, name: userPayload.name, role: userPayload.role },
            process.env.JWT_SECRET || 'default-secret',
            { expiresIn: '7d' }
        );

        return res.status(200).json({
            token: appToken,
            user: {
                id: uid, // Frontend expects 'id'
                ...userPayload
            }
        });

    } catch (error: any) {
        console.error('Firebase Auth Error:', error);
        return res.status(401).json({ message: 'Authentication failed', error: error.message });
    }
}
