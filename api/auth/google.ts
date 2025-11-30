import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from '../../lib/mongodb.js';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';

interface User {
    _id: ObjectId;
    name: string;
    email: string;
    role: string;
    googleId?: string;
    avatar?: string;
    reputation: number;
    createdAt: Date;
    updatedAt: Date;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    if (!process.env.JWT_SECRET) {
        return res.status(500).json({ message: 'Server misconfiguration' });
    }

    try {
        const { token: accessToken } = req.body;

        if (!accessToken) {
            return res.status(400).json({ message: 'No access token provided' });
        }

        // Get User Info from Google
        const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        if (!userInfoResponse.ok) {
            return res.status(401).json({ message: 'Invalid Google token' });
        }

        const googleUser: any = await userInfoResponse.json();
        const { email, name, picture, sub: googleId } = googleUser;

        if (!email) {
            return res.status(400).json({ message: 'Email not found in Google profile' });
        }

        const db = await getDb();
        const usersCollection = db.collection('users');

        // Check if user exists
        let user = await usersCollection.findOne({ email }) as unknown as User | null;

        // Check if this is an admin email
        const ADMIN_EMAIL = 'rajraja8852@gmail.com';
        const isAdmin = email === ADMIN_EMAIL;

        if (!user) {
            // Create new user
            const newUser = {
                name: name || 'Google User',
                email,
                googleId,
                avatar: picture,
                reputation: 0,
                role: isAdmin ? 'admin' : 'user',
                createdAt: new Date(),
                updatedAt: new Date()
            };

            const result = await usersCollection.insertOne(newUser);
            user = { ...newUser, _id: result.insertedId } as User;
        } else {
            // Update existing user with Google info if missing
            const updateFields: any = {
                updatedAt: new Date()
            };

            if (!user.googleId) updateFields.googleId = googleId;
            if (!user.avatar) updateFields.avatar = picture;
            if (isAdmin && user.role !== 'admin') updateFields.role = 'admin';

            if (Object.keys(updateFields).length > 1) { // More than just updatedAt
                await usersCollection.updateOne(
                    { _id: user._id },
                    { $set: updateFields }
                );
                user.avatar = user.avatar || picture;
                if (isAdmin) user.role = 'admin';
            }
        }

        // Generate JWT
        const token = jwt.sign(
            { userId: user!._id, email: user!.email, name: user!.name, role: user!.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Return user info and token
        res.status(200).json({
            token,
            user: {
                id: user!._id,
                name: user!.name,
                email: user!.email,
                reputation: user!.reputation,
                avatar: user!.avatar,
                role: user!.role
            }
        });

    } catch (error) {
        console.error('Google Auth Error:', error);
        return res.status(500).json({ message: 'Authentication failed', error: String(error) });
    }
}
