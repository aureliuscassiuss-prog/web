import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import formidable from 'formidable';
import * as fs from 'fs';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseKey || 'placeholder');

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
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }

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
        return res.status(500).json({ message: 'Server error' });
    }
}

async function handleGetUploads(userId: string, res: VercelResponse) {
    const { data: uploads, error } = await supabase
        .from('resources')
        .select('*')
        .eq('uploaderId', userId)
        .order('createdAt', { ascending: false });

    if (error) {
        return res.status(500).json({ uploads: [] });
    }

    const uploadsWithStatus = uploads.map((resource: any) => ({
        ...resource,
        userLiked: resource.likedBy?.includes(userId) || false,
        userDisliked: resource.dislikedBy?.includes(userId) || false,
        userSaved: resource.savedBy?.includes(userId) || false,
        userFlagged: resource.flaggedBy?.includes(userId) || false
    }));

    return res.status(200).json({ uploads: uploadsWithStatus });
}

async function handleUpdateProfile(req: VercelRequest, userId: string, res: VercelResponse) {
    const form = formidable({
        keepExtensions: true,
        maxFileSize: 5 * 1024 * 1024,
    });

    try {
        const [fields, files] = await new Promise<[formidable.Fields, formidable.Files]>((resolve, reject) => {
            form.parse(req, (err, fields, files) => {
                if (err) reject(err);
                else resolve([fields, files]);
            });
        });

        const getValue = (key: string) => {
            const val = fields[key];
            if (Array.isArray(val)) return val[0];
            return val;
        };

        const updateFields: any = {};
        const allowed = ['name', 'email', 'phone', 'semester', 'college', 'branch', 'course', 'year', 'gender'];

        allowed.forEach(key => {
            const val = getValue(key);
            if (val !== undefined) {
                if (key === 'year' || key === 'semester') {
                    const num = parseInt(val as string);
                    if (!isNaN(num)) updateFields[key] = num;
                } else {
                    updateFields[key] = val;
                }
            }
        });

        // Handle Avatar
        const avatarFile = files.avatar?.[0];
        if (avatarFile) {
            const fileData = fs.readFileSync(avatarFile.filepath);
            const base64Image = `data:${avatarFile.mimetype};base64,${fileData.toString('base64')}`;
            updateFields.avatar = base64Image;
        } else if (updateFields.gender && !updateFields.avatar) {
            // Check current avatar to see if we should set default
            const { data: currentUser } = await supabase.from('users').select('avatar').eq('_id', userId).single();
            if (currentUser && (!currentUser.avatar || currentUser.avatar.includes('.webp'))) {
                updateFields.avatar = updateFields.gender === 'female' ? '/girl.webp' : '/1.webp';
            }
        }

        const { data: result, error } = await supabase
            .from('users')
            .update(updateFields)
            .eq('_id', userId)
            .select()
            .single();

        if (error || !result) {
            return res.status(404).json({ message: 'User not found or update failed' });
        }

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
    } catch (e) {
        console.error('Update profile error:', e);
        return res.status(500).json({ message: 'Failed to update profile' });
    }
}
