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

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        // --- 1. GET: List Active Confessions ---
        if (req.method === 'GET') {
            const { sort = 'new' } = req.query; // 'new' | 'trending'

            // Calculate 48h ago timestamp for filtering
            const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

            let query = supabase
                .from('coffessions')
                .select('*')
                .gt('created_at', twoDaysAgo) // Only active posts
            // .eq('is_hidden', false) // Optional: if we implement hiding

            if (sort === 'trending') {
                query = query.order('likes', { ascending: false });
            } else {
                query = query.order('created_at', { ascending: false });
            }

            const { data, error } = await query.limit(50); // Limit to recent 50 for performance

            if (error) throw error;
            return res.status(200).json(data);
        }

        // --- Auth Check for Writes ---
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) return res.status(401).json({ message: 'Unauthorized' });

        let userId: string;
        try {
            const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
            userId = decoded.userId;
        } catch (e) {
            return res.status(401).json({ message: 'Invalid token' });
        }

        // --- 2. POST: Create Confession ---
        if (req.method === 'POST' && !req.query.action) {
            const { content, theme = 'espresso' } = req.body;

            if (!content || content.length < 5) return res.status(400).json({ message: 'Content too short' });

            const { data, error } = await supabase
                .from('coffessions')
                .insert([{
                    user_id: userId, // Linked for moderation, hidden in frontend
                    content,
                    theme,
                    created_at: new Date()
                }])
                .select()
                .single();

            if (error) throw error;
            return res.status(201).json(data);
        }

        // --- 3. POST /vote: Like/Dislike ---
        if (req.method === 'POST' && req.query.action === 'vote') {
            const { id, type } = req.body; // type: 'like' | 'dislike'

            if (!id || !['like', 'dislike'].includes(type)) return res.status(400).json({ message: 'Invalid vote' });

            // In a real app, we'd check if user already voted in a separate 'coffession_votes' table.
            // For this 'lite' version, we'll just increment the counter.
            // Security Note: A user could spam likes if they spam requests. 
            // We rely on the frontend local storage 'alreadyVoted' check for basic UX, avoiding complex table logic for now.

            const rpcName = type === 'like' ? 'increment_likes' : 'increment_dislikes';

            // If we don't have RPCs set up, we do a read-update-write (less safe concurrency but works for MVP)
            const { data: current, error: fetchError } = await supabase.from('coffessions').select('likes, dislikes').eq('id', id).single();

            if (fetchError || !current) return res.status(404).json({ message: 'Post not found' });

            const update = type === 'like'
                ? { likes: (current.likes || 0) + 1 }
                : { dislikes: (current.dislikes || 0) + 1 };

            const { error: updateError } = await supabase.from('coffessions').update(update).eq('id', id);

            if (updateError) throw updateError;
            return res.status(200).json({ success: true });
        }

        return res.status(405).json({ message: 'Method not allowed' });

    } catch (error: any) {
        console.error('Coffessions Error:', error);
        return res.status(500).json({ message: error.message || 'Server error' });
    }
}
