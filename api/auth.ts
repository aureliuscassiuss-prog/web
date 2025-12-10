import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseKey || 'placeholder');
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import * as fs from 'fs';

// --- CONFIGURATION ---
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-dev-secret-do-not-use-in-prod';
const ADMIN_EMAIL = 'trilliontip@gmail.com';

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

// --- HELPER FUNCTIONS ---

function generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendEmail(to: string, subject: string, html: string) {
    try {
        const info = await transporter.sendMail({
            from: '"Extrovert Community" <otp@trilliontip.com>', // Sender address
            to,
            subject,
            html
        });
        console.log('Message sent: %s', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
}

// --- HANDLERS ---

async function handleLogin(body: any, res: VercelResponse) {
    const { email, password } = body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    // Supabase: Get user
    const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

    if (error || !user) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (user.isBanned) {
        return res.status(403).json({ message: 'Your account has been suspended. Please contact support for assistance.' });
    }

    // Verify password
    // Note: Google users might not have a password
    if (!user.password && user.googleId) {
        return res.status(400).json({ message: 'This account uses Google Sign-In. Please use that instead.' });
    }

    const isValid = await bcrypt.compare(password, user.password || '');
    if (!isValid) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Auto-restore Admin role for owner if lost
    if (user.email === ADMIN_EMAIL && user.role !== 'admin') {
        await supabase.from('users').update({ role: 'admin' }).eq('_id', user._id);
        user.role = 'admin'; // Update local object
    }

    const isAdmin = user.email === ADMIN_EMAIL || user.role === 'admin';

    // Generate JWT
    const token = jwt.sign(
        { userId: user._id, email: user.email, role: user.role }, // _id is uuid string now
        JWT_SECRET!,
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
            role: isAdmin ? 'admin' : (user.role || 'user'),
            isRestricted: user.isRestricted,
            isTrusted: user.isTrusted
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

    // Check if user already exists
    const { data: existingUser } = await supabase
        .from('users')
        .select('_id')
        .eq('email', email)
        .single();

    if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
    }

    const otp = generateOtp();
    const hashedPassword = await bcrypt.hash(password, 10);

    // Upsert into pending_registrations
    // We clean up by email to avoid duplicates
    await supabase.from('pending_registrations').delete().eq('email', email);

    const { error: insertError } = await supabase.from('pending_registrations').insert({
        email,
        otp,
        name,
        password: hashedPassword,
        gender
    });

    if (insertError) {
        console.error('Registration insert error:', insertError);
        return res.status(500).json({ message: 'Registration failed during database operation' });
    }

    // Send OTP Email
    try {
        await sendEmail(
            email,
            'Verify your UniNotes Account',
            `<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border: 1px solid #e5e7eb;">
                <div style="background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); padding: 32px; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -1px;">Extrovert Community</h1>
                </div>
                <div style="padding: 40px 32px; text-align: center;">
                    <h2 style="color: #1f2937; margin-top: 0; font-size: 24px;">Verify Your Account</h2>
                    <p style="color: #4b5563; font-size: 16px; line-height: 1.5; margin-bottom: 24px;">Welcome to Extrovert! Please use the verification code below to complete your registration:</p>
                    <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; display: inline-block; margin-bottom: 24px;">
                        <span style="font-family: monospace; font-size: 32px; font-weight: 700; color: #4f46e5; letter-spacing: 4px;">${otp}</span>
                    </div>
                    <p style="color: #6b7280; font-size: 14px;">This code will expire in 10 minutes.</p>
                </div>
                <div style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
                    <p style="color: #9ca3af; font-size: 12px; margin: 0;">&copy; ${new Date().getFullYear()} Extrovert Community. All rights reserved.</p>
                </div>
             </div>`
        );
    } catch (emailError: any) {
        console.error('Email sending failed:', emailError);

        console.error('Email sending failed (Invalid Credentials). Switching to DEV MODE.');
        console.log('Login/Register OTP:', otp); // Log OTP to console for user
        try {
            fs.writeFileSync('otp.txt', `Your OTP Code: ${otp}`);
        } catch (e) {
            console.error('Failed to write OTP file:', e);
        }
        console.log('---------------------------------------------------');

        // Allow flow to continue even if email fails
        return res.status(200).json({
            message: 'OTP generated (Email failed, check terminal console)',
            requireOtp: true,
            email
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
    const { email, otp, year, semester } = body;

    if (!email || !otp) {
        return res.status(400).json({ message: 'Email and OTP are required' });
    }

    // Find pending registration
    const { data: pendingUser, error } = await supabase
        .from('pending_registrations')
        .select('*')
        .eq('email', email)
        .single();

    if (error || !pendingUser) {
        return res.status(400).json({ message: 'Registration request not found or expired' });
    }

    console.log(`Verifying OTP for ${email}. Input: '${otp}', Stored: '${pendingUser.otp}'`);
    if (String(pendingUser.otp).trim() !== String(otp).trim()) {
        return res.status(400).json({ message: 'Invalid OTP' });
    }

    const isAdmin = email === ADMIN_EMAIL;
    const avatar = pendingUser.gender === 'female' ? '/girl.webp' : '/1.webp';

    // Insert new user
    const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
            name: pendingUser.name,
            email: email,
            password: pendingUser.password,
            role: isAdmin ? 'admin' : 'user',
            reputation: 0,
            avatar: avatar,
            gender: pendingUser.gender || 'male',
            semester: semester || null, // Allow null
            college: 'Medicaps University', // Default
            year: year || null, // Allow null
            isBanned: false,
            isRestricted: false,
            isTrusted: false
        })
        .select()
        .single();

    if (createError || !newUser) {
        console.error('Create user error:', createError);
        return res.status(500).json({ message: 'Failed to create user account' });
    }

    // Delete pending registration
    await supabase.from('pending_registrations').delete().eq('email', email);

    // Generate JWT
    const token = jwt.sign(
        { userId: newUser._id, email: newUser.email, role: newUser.role },
        JWT_SECRET!,
        { expiresIn: '7d' }
    );

    return res.status(201).json({
        token,
        user: {
            id: newUser._id,
            name: newUser.name,
            email: newUser.email,
            reputation: 0,
            avatar: newUser.avatar,
            gender: newUser.gender,
            phone: newUser.phone || '',
            semester: newUser.semester,
            college: newUser.college,
            branch: newUser.branch || '',
            course: newUser.course || '',
            year: newUser.year,
            role: newUser.role
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
    const { email, name, sub: googleId, picture } = googleUser;

    // Check if user exists
    let { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

    if (!user) {
        // Create new user
        const fixedAvatar = Math.random() > 0.5 ? '/girl.webp' : '/1.webp';

        const { data: newUser, error: createError } = await supabase
            .from('users')
            .insert({
                email,
                name,
                googleId,
                avatar: picture || fixedAvatar,
                role: email === ADMIN_EMAIL ? 'admin' : 'user',
                reputation: 0,
                semester: 1,
                college: 'Medicaps University',
                year: 1,
                isBanned: false,
                isRestricted: false,
                isTrusted: false
            })
            .select()
            .single();

        if (createError || !newUser) {
            return res.status(500).json({ message: 'Failed to create Google user' });
        }
        user = newUser;
    } else {
        // Update Google ID if missing
        if (!user.googleId) {
            await supabase
                .from('users')
                .update({ googleId, avatar: user.avatar || picture })
                .eq('_id', user._id);
            user.googleId = googleId;
        }

        // Auto-restore Admin role for owner if lost (Google Auth)
        if (user.email === ADMIN_EMAIL && user.role !== 'admin') {
            await supabase.from('users').update({ role: 'admin' }).eq('_id', user._id);
            user.role = 'admin';
        }

        if (user.isBanned) {
            return res.status(403).json({ message: 'Your account has been suspended.' });
        }
    }

    // Generate JWT
    const token = jwt.sign(
        { userId: user._id, email: user.email, role: user.role },
        JWT_SECRET!,
        { expiresIn: '7d' }
    );

    // Return user info and token
    return res.status(200).json({
        token,
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            reputation: user.reputation,
            avatar: user.avatar,
            gender: user.gender,
            phone: user.phone,
            semester: user.semester,
            college: user.college,
            branch: user.branch,
            course: user.course,
            year: user.year,
            role: user.role
        }
    });
}

async function handleForgotPassword(body: any, res: VercelResponse) {
    const { email } = body;

    if (!email) {
        return res.status(400).json({ message: 'Email is required' });
    }

    // Check if user exists
    const { data: user } = await supabase
        .from('users')
        .select('_id')
        .eq('email', email)
        .single();

    if (!user) {
        return res.status(200).json({
            message: 'If an account exists with this email, you will receive a password reset code.',
            requireOtp: true,
            email
        });
    }

    const otp = generateOtp();

    // Store in password_resets
    await supabase.from('password_resets').delete().eq('email', email);
    await supabase.from('password_resets').insert({
        email,
        otp
    });

    // Send Email
    try {
        await sendEmail(
            email,
            'Reset your UniNotes Password',
            `<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border: 1px solid #e5e7eb;">
                <div style="background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%); padding: 32px; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -1px;">Extrovert Community</h1>
                </div>
                <div style="padding: 40px 32px; text-align: center;">
                    <h2 style="color: #1f2937; margin-top: 0; font-size: 24px;">Password Reset</h2>
                    <p style="color: #4b5563; font-size: 16px; line-height: 1.5; margin-bottom: 24px;">We received a request to reset your password. Use the code below to proceed:</p>
                    <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; display: inline-block; margin-bottom: 24px;">
                        <span style="font-family: monospace; font-size: 32px; font-weight: 700; color: #dc2626; letter-spacing: 4px;">${otp}</span>
                    </div>
                    <p style="color: #6b7280; font-size: 14px;">This code will expire in 10 minutes.</p>
                    <p style="color: #9ca3af; font-size: 12px; margin-top: 20px;">If you didn't request a password reset, you can safely ignore this email.</p>
                </div>
                <div style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
                    <p style="color: #9ca3af; font-size: 12px; margin: 0;">&copy; ${new Date().getFullYear()} Extrovert Community. All rights reserved.</p>
                </div>
             </div>`
        );
    } catch (emailError: any) {
        console.error('Email sending failed:', emailError);
        let errorMessage = 'Failed to send OTP email';
        if (emailError.response) {
            errorMessage = `Email provider error: ${emailError.response}`;
        } else if (emailError.message) {
            errorMessage = `Email error: ${emailError.message}`;
        }

        return res.status(500).json({
            message: errorMessage,
            details: emailError.toString()
        });
    }

    return res.status(200).json({
        message: 'If an account exists with this email, you will receive a password reset code.',
        requireOtp: true,
        email
    });
}

async function handleResetPassword(body: any, res: VercelResponse) {
    const { email, otp, newPassword } = body;

    if (!email || !otp || !newPassword) {
        return res.status(400).json({ message: 'Email, OTP, and new password are required' });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Check password reset request
    const { data: resetRequest } = await supabase
        .from('password_resets')
        .select('*')
        .eq('email', email)
        .single();

    if (!resetRequest) {
        return res.status(400).json({ message: 'Invalid or expired reset request' });
    }

    if (resetRequest.otp !== otp) {
        return res.status(400).json({ message: 'Invalid OTP' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password
    const { data: updatedUser, error } = await supabase
        .from('users')
        .update({ password: hashedPassword, updatedAt: new Date().toISOString() })
        .eq('email', email)
        .select()
        .single();

    if (error || !updatedUser) {
        return res.status(404).json({ message: 'User not found' });
    }

    // Delete password reset request
    await supabase.from('password_resets').delete().eq('email', email);

    return res.status(200).json({
        message: 'Password reset successfully'
    });
}

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

    try {
        let body = req.body;
        // Handle Vercel's potentially inconsistent body parsing
        if (typeof body === 'string') {
            try { body = JSON.parse(body); } catch (e) { }
        }

        // Check both query and body for 'action'
        const action = req.query.action || body.action;

        if (action === 'register') {
            return await handleRegister(body, res);
        } else if (action === 'login') {
            return await handleLogin(body, res);
        } else if (action === 'verify-otp') {
            return await handleVerifyOtp(body, res);
        } else if (action === 'forgot-password') {
            return await handleForgotPassword(body, res);
        } else if (action === 'reset-password') {
            return await handleResetPassword(body, res);
        } else if (action === 'google') {
            return await handleGoogleAuth(body, res);
        } else {
            return res.status(400).json({ message: 'Invalid action.' });
        }
    } catch (error) {
        console.error('Auth error:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return res.status(500).json({ message: 'Server error', error: errorMessage });
    }
}
