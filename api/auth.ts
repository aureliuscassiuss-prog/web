```
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db, auth as adminAuth } from '../lib/firebase-admin.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';

const ADMIN_EMAIL = 'trilliontip@gmail.com';

// Configure Nodemailer
const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false, 
    auth: {
        user: process.env.BREVO_USER,
        pass: process.env.BREVO_PASS
    }
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

    try {
        let body = req.body;
        if (typeof body === 'string') {
            try { body = JSON.parse(body); } catch (e) { return res.status(400).json({ message: 'Invalid JSON body' }); }
        }

        const { action } = body || {};
        
        switch (action) {
            case 'login': return await handleLogin(body, res);
            case 'register': return await handleRegister(body, res);
            case 'verify-otp': return await handleVerifyOtp(body, res);
            case 'forgot-password': return await handleForgotPassword(body, res);
            case 'reset-password': return await handleResetPassword(body, res);
            case 'firebase-login': return await handleFirebaseLogin(body, res); // Keep Google Login support
            default: return res.status(400).json({ message: 'Invalid action' });
        }
    } catch (error: any) {
        console.error('Auth error:', error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
}

// --- Helpers ---
async function findUserByEmail(email: string) {
    const snapshot = await db.collection('users').where('email', '==', email).limit(1).get();
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return { _id: doc.id, ...doc.data() } as any;
}

// --- Handlers ---

async function handleLogin(body: any, res: VercelResponse) {
    const { email, password } = body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

    const user = await findUserByEmail(email);
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    if (user.isBanned) return res.status(403).json({ message: 'Account banned' });

    // Verify Password (bcrypt) - Stored in Firestore
    const isValid = await bcrypt.compare(password, user.password || '');
    if (!isValid) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
        { userId: user._id, name: user.name, email: user.email, role: user.role },
        process.env.JWT_SECRET!,
        { expiresIn: '7d' }
    );

    return res.status(200).json({
        token,
        user: { ...user, id: user._id }
    });
}

async function handleRegister(body: any, res: VercelResponse) {
    const { name, email, password, gender } = body;
    if (!name || !email || !password) return res.status(400).json({ message: 'All fields required' });
    if (password.length < 6) return res.status(400).json({ message: 'Password must be 6+ chars' });

    // Check existing
    const existing = await findUserByEmail(email);
    if (existing) return res.status(400).json({ message: 'User already exists' });

    // Generate OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save to Firestore 'pending_registrations' (Doc ID = email)
    await db.collection('pending_registrations').doc(email).set({
        name,
        email,
        password: hashedPassword,
        gender: gender || 'male',
        otp,
        otpExpires,
        createdAt: new Date().toISOString()
    });

    // Send Email
    try {
        if (process.env.BREVO_USER) {
            await transporter.sendMail({
                from: '"UniNotes" <otp@trilliontip.com>',
                to: email,
                subject: 'UniNotes Verification OTP',
                text: `Your verification code is: ${ otp } `,
                html: `< p > Your verification code is: <strong>${ otp } </strong></p > `
            });
        }
    } catch (e) {
        console.error('Email failed:', e);
         // Continue anyway for testing if email fails
    }

    return res.status(200).json({ message: 'OTP sent', requireOtp: true, email });
}

async function handleVerifyOtp(body: any, res: VercelResponse) {
    const { email, otp } = body;
    if (!email || !otp) return res.status(400).json({ message: 'Email and OTP required' });

    const doc = await db.collection('pending_registrations').doc(email).get();
    if (!doc.exists) return res.status(400).json({ message: 'Request not found/expired' });
    
    const data = doc.data() as any;
    if (data.otp !== otp) return res.status(400).json({ message: 'Invalid OTP' });
    if (new Date() > new Date(data.otpExpires)) return res.status(400).json({ message: 'OTP expired' });

    const isAdmin = email === ADMIN_EMAIL;
    const newUser = {
        name: data.name,
        email: data.email,
        password: data.password, // Keep hashed password in Firestore
        reputation: 0,
        avatar: data.gender === 'female' ? '/girl.webp' : '/1.webp',
        gender: data.gender || 'male',
        role: isAdmin ? 'admin' : 'user',
        createdAt: new Date().toISOString(), 
        uploads: []
    };

    // Create User in Firestore
    const userRef = await db.collection('users').add(newUser);
    await db.collection('pending_registrations').doc(email).delete();

    const token = jwt.sign(
        { userId: userRef.id, name: newUser.name, email, role: newUser.role },
        process.env.JWT_SECRET!,
        { expiresIn: '7d' }
    );

    return res.status(201).json({
        token,
        user: { ...newUser, id: userRef.id }
    });
}

async function handleForgotPassword(body: any, res: VercelResponse) {
    const { email } = body;
    if (!email) return res.status(400).json({ message: 'Email required' });

    const user = await findUserByEmail(email);
    if (!user) return res.status(200).json({ message: 'If account exists, code sent.', requireOtp: true, email });

    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    await db.collection('password_resets').doc(email).set({
        email, otp, otpExpires, createdAt: new Date().toISOString()
    });

    if (process.env.BREVO_USER) {
        await transporter.sendMail({
            to: email,
            subject: 'UniNotes Password Reset',
            text: `Code: ${ otp } `
        }).catch(console.error);
    }

    return res.status(200).json({ message: 'Code sent', requireOtp: true, email });
}

async function handleResetPassword(body: any, res: VercelResponse) {
    const { email, otp, newPassword } = body;
    const doc = await db.collection('password_resets').doc(email).get();
    
    if (!doc.exists) return res.status(400).json({ message: 'Request invalid' });
    const data = doc.data() as any;
    if (data.otp !== otp) return res.status(400).json({ message: 'Invalid OTP' });

    const user = await findUserByEmail(email);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.collection('users').doc(user._id).update({ password: hashedPassword });
    await db.collection('password_resets').doc(email).delete();

    return res.status(200).json({ message: 'Password reset successful' });
}

async function handleFirebaseLogin(body: any, res: VercelResponse) {
    // Re-implement Hybrid Login for Google Sign In
    const { token } = body;
    try {
        const decoded = await adminAuth.verifyIdToken(token);
        const { email, uid, name, picture } = decoded;
        if (!email) throw new Error('No email');

        let user = await findUserByEmail(email);
        if (!user) {
            const newUser = {
                name: name || 'Google User',
                email,
                avatar: picture,
                role: email === ADMIN_EMAIL ? 'admin' : 'user',
                firebaseUid: uid,
                createdAt: new Date().toISOString(),
                reputation: 0,
                uploads: []
            };
            const ref = await db.collection('users').add(newUser);
            user = { ...newUser, _id: ref.id };
        } else {
            // Update
             await db.collection('users').doc(user._id).update({ firebaseUid: uid });
        }

        const appToken = jwt.sign(
            { userId: user._id, email, name: user.name, role: user.role },
            process.env.JWT_SECRET!,
            { expiresIn: '7d' }
        );

        return res.status(200).json({ token: appToken, user: { ...user, id: user._id } });

    } catch (e: any) {
        return res.status(401).json({ message: 'Firebase auth failed', error: e.message });
    }
}
```
