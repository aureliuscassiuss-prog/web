import { getDb } from '../../lib/mongodb.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
export default async function handler(req, res) {
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
            }
            catch (e) {
                console.error('Error parsing body:', e);
                return res.status(400).json({ message: 'Invalid JSON body' });
            }
        }
        const { name, email, password } = body || {};
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
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        // Check if this is an admin email
        const ADMIN_EMAIL = 'rajraja8852@gmail.com';
        const isAdmin = email === ADMIN_EMAIL;
        // Create user with extended profile
        const result = await db.collection('users').insertOne({
            name,
            email,
            password: hashedPassword,
            reputation: 0,
            avatar: 'avatar1', // Default premium avatar
            phone: '',
            semester: 1,
            college: 'Medicaps University',
            branch: '',
            year: 1,
            uploads: [],
            role: isAdmin ? 'admin' : 'user',
            createdAt: new Date()
        });
        // Create token
        const token = jwt.sign({ userId: result.insertedId }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.status(201).json({
            token,
            user: {
                id: result.insertedId,
                name,
                email,
                reputation: 0,
                avatar: 'avatar1',
                phone: '',
                semester: 1,
                college: 'Medicaps University',
                branch: '',
                year: 1,
                role: isAdmin ? 'admin' : 'user'
            }
        });
    }
    catch (error) {
        console.error('Registration error:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return res.status(500).json({ message: 'Server error', error: errorMessage });
    }
}
