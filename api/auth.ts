import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from '../lib/mongodb.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import nodemailer from 'nodemailer';

interface User {
    _id: ObjectId;
    name: string;
    email: string;
    role: string;
    googleId?: string;
    avatar?: string;
    reputation: number;
    phone?: string;
    semester?: number;
    college?: string;
    branch?: string;
    course?: string;
    year?: number;
    gender?: 'male' | 'female' | 'other';
    isBanned?: boolean;
    canUpload?: boolean;
    createdAt: Date;
    updatedAt?: Date;
}

const ADMIN_EMAIL = 'rajraja8852@gmail.com';

// Configure Nodemailer Transporter for Brevo
const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false, // true for 465, false for other ports
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

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    // Check for required environment variables
    if (!process.env.MONGODB_URI) {
        console.error('MONGODB_URI not set');
        return res.status(500).json({ message: 'Server misconfiguration: MONGODB_URI not set' });
    }

    if (!process.env.JWT_SECRET) {
        console.error('JWT_SECRET not set');
        return res.status(500).json({ message: 'Server misconfiguration: JWT_SECRET not set' });
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

        const { action } = body || {};
        console.log('Auth API Request:', { action, email: body?.email });

        // Route to appropriate handler based on action
        if (action === 'login') {
            return await handleLogin(body, res);
        } else if (action === 'register') {
            return await handleRegister(body, res);
        } else if (action === 'verify-otp') {
            return await handleVerifyOtp(body, res);
        } else if (action === 'google') {
            return await handleGoogleAuth(body, res);
        } else {
            return res.status(400).json({ message: 'Invalid action. Use: login, register, verify-otp, or google' });
        }
    } catch (error) {
        console.error('Auth error:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return res.status(500).json({ message: 'Server error', error: errorMessage });
    }
}

async function handleLogin(body: any, res: VercelResponse) {
    const { email, password } = body;

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

    const isAdmin = user.email === ADMIN_EMAIL;

    // Update user role in database if needed
    if (isAdmin && user.role !== 'admin') {
        await db.collection('users').updateOne(
            { _id: user._id },
            { $set: { role: 'admin' } }
        );
    }

    const token = jwt.sign(
        { userId: user._id, name: user.name, email: user.email, role: user.role },
        process.env.JWT_SECRET!,
        { expiresIn: '7d' }
    );

    return res.status(200).json({
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
            course: user.course,
            year: user.year,
            role: isAdmin ? 'admin' : (user.role || 'user')
        }
    });
}

async function handleRegister(body: any, res: VercelResponse) {
    const { name, email, password, gender } = body;

    if (!name || !email || !password) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    if (password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const db = await getDb();

    // Check if user already exists
    const existingUser = await db.collection('users').findOne({ email });
    if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
    }

    // Generate 4-digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Store in pending_registrations
    await db.collection('pending_registrations').updateOne(
        { email },
        {
            $set: {
                name,
                email,
                password: hashedPassword,
                gender: gender || 'male',
                otp,
                otpExpires,
                createdAt: new Date()
            }
        },
        { upsert: true }
    );

    // Send OTP Email via Brevo
    try {
        if (!process.env.BREVO_USER || !process.env.BREVO_PASS) {
            console.warn('Brevo credentials not set, skipping email sending. OTP:', otp);
        } else {
            console.log('Sending OTP email via Brevo to:', email);
            await transporter.sendMail({
                from: '"UniNotes" <otp@trilliontip.com>', // Must be a verified sender in Brevo
                to: email,
                subject: 'UniNotes Verification OTP',
                text: `Your verification code is: ${otp}. It expires in 10 minutes.`,
                html: `<p>Your verification code is: <strong>${otp}</strong></p><p>It expires in 10 minutes.</p>`
            });
            console.log('OTP email sent successfully');
        }
    } catch (emailError: any) {
        console.error('Failed to send email:', emailError);

        // Extract specific error message
        let errorMessage = 'Failed to send verification email';
        if (emailError.code === 'EAUTH') {
            errorMessage = 'Email authentication failed. Please check server configuration.';
        } else if (emailError.response) {
            errorMessage = `Email provider error: ${emailError.response}`;
        } else if (emailError.message) {
            errorMessage = `Email error: ${emailError.message}`;
        }

        return res.status(500).json({
            message: errorMessage,
            details: emailError.toString()
        });
    }

    console.log('Registration successful, requiring OTP');
    return res.status(200).json({
        message: 'OTP sent to email',
        requireOtp: true,
        email
    });
}

async function handleVerifyOtp(body: any, res: VercelResponse) {
    const { email, otp } = body;

    if (!email || !otp) {
        return res.status(400).json({ message: 'Email and OTP are required' });
    }

    const db = await getDb();
    const pendingUser = await db.collection('pending_registrations').findOne({ email });

    if (!pendingUser) {
        return res.status(400).json({ message: 'Registration request not found or expired' });
    }

    if (pendingUser.otp !== otp) {
        return res.status(400).json({ message: 'Invalid OTP' });
    }

    if (new Date() > pendingUser.otpExpires) {
        return res.status(400).json({ message: 'OTP expired' });
    }

    const isAdmin = email === ADMIN_EMAIL;

    // Create user
    const result = await db.collection('users').insertOne({
        name: pendingUser.name,
        email: pendingUser.email,
        password: pendingUser.password,
        reputation: 0,
        avatar: pendingUser.gender === 'female' ? '/girl.webp' : '/1.webp',
        gender: pendingUser.gender || 'male',
        phone: '',
        semester: 1,
        college: 'Medicaps University',
        branch: '',
        course: '',
        year: 1,
        uploads: [],
        role: isAdmin ? 'admin' : 'user',
        createdAt: new Date()
    });

    // Delete pending registration
    await db.collection('pending_registrations').deleteOne({ email });

    // Create token
    const token = jwt.sign(
        { userId: result.insertedId, name: pendingUser.name, email, role: isAdmin ? 'admin' : 'user' },
        process.env.JWT_SECRET!,
        { expiresIn: '7d' }
    );

    return res.status(201).json({
        token,
        user: {
            id: result.insertedId,
            name: pendingUser.name,
            email,
            reputation: 0,
            avatar: pendingUser.gender === 'female' ? '/girl.webp' : '/1.webp',
            gender: pendingUser.gender || 'male',
            phone: '',
            semester: 1,
            college: 'Medicaps University',
            branch: '',
            course: '',
            year: 1,
            role: isAdmin ? 'admin' : 'user'
        }
    });
}

async function handleGoogleAuth(body: any, res: VercelResponse) {
    const { token: accessToken } = body;

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

        if (Object.keys(updateFields).length > 1) {
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
        process.env.JWT_SECRET!,
        { expiresIn: '7d' }
    );

    // Return user info and token
    return res.status(200).json({
        token,
        user: {
            id: user!._id,
            name: user!.name,
            email: user!.email,
            reputation: user!.reputation,
            avatar: user!.avatar,
            gender: user!.gender,
            phone: user!.phone,
            semester: user!.semester,
            college: user!.college,
            branch: user!.branch,
            course: user!.course,
            year: user!.year,
            role: user!.role
        }
    });
}
