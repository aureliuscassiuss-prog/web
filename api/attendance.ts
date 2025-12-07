import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseKey || 'placeholder');

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    let userId: string;
    try {
        const token = authHeader.split(' ')[1];
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
        userId = decoded.userId;
    } catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
    }

    try {
        if (req.method === 'GET') {
            const { data } = await supabase
                .from('attendance')
                .select('*')
                .eq('userId', userId)
                .single();
            return res.status(200).json(data || { subjects: [], logs: [] });
        }

        if (req.method === 'POST') {
            const { subjects, logs } = req.body;

            const { error } = await supabase
                .from('attendance')
                .upsert({
                    userId,
                    subjects,
                    logs,
                    updatedAt: new Date()
                }, { onConflict: 'userId' });

            if (error) throw error;

            return res.status(200).json({ message: 'Attendance saved successfully' });
        }

        return res.status(405).json({ message: 'Method not allowed' });
    } catch (error) {
        console.error('Attendance API Error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}
