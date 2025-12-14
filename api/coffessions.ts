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
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        // --- 1. GET: List Active Confessions ---
        // --- 1. GET: List Active Confessions ---
        if (req.method === 'GET' && !req.query.action) {
            const { sort = 'new' } = req.query; // 'new' | 'trending'

            // Calculate 48h ago timestamp for filtering
            const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

            let query = supabase
                .from('coffessions')
                .select('*')
                .gt('created_at', twoDaysAgo) // Only active posts

            if (sort === 'trending') {
                query = query.order('likes', { ascending: false });
            } else {
                query = query.order('created_at', { ascending: false });
            }

            const { data, error } = await query.limit(50); // Limit to recent 50 for performance

            if (error) throw error;
            return res.status(200).json(data);
        }

        // --- 1.5. GET: My Votes ---
        if (req.method === 'GET' && req.query.action === 'my-votes') {
            const token = req.headers.authorization?.replace('Bearer ', '');
            if (!token) return res.status(200).json({});

            let userId: string;
            try {
                const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
                userId = decoded.userId;
            } catch (e) {
                console.error('Token verification failed:', e);
                return res.status(200).json({}); // Silent fail for auth is ok, just empty votes
            }

            const { data, error } = await supabase
                .from('coffession_votes')
                .select('coffession_id, vote_type')
                .eq('user_id', userId);

            if (error) {
                console.error('Fetch votes DB Error:', error);
                throw error; // Let main catch handle it or return 500
            }

            console.log(`Fetched ${data?.length} votes for user ${userId}`);

            // Return as map: { [id]: 'like' | 'dislike' }
            const voteMap = (data || []).reduce((acc: any, curr: any) => {
                acc[curr.coffession_id] = curr.vote_type;
                return acc;
            }, {});

            return res.status(200).json(voteMap);
        }

        // --- 2. POST: Create Confession ---
        if (req.method === 'POST' && !req.query.action) {
            // ... (Auth happens inside POST block for creation)
            const token = req.headers.authorization?.replace('Bearer ', '');
            if (!token) return res.status(401).json({ message: 'Unauthorized' });

            let userId: string;
            try {
                const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
                userId = decoded.userId;
            } catch (e) {
                return res.status(401).json({ message: 'Invalid token' });
            }

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

        // --- 3. POST /vote: Relational Vote (Upsert) ---
        if (req.method === 'POST' && req.query.action === 'vote') {
            const token = req.headers.authorization?.replace('Bearer ', '');
            if (!token) return res.status(401).json({ message: 'Unauthorized' });

            let userId: string;
            try {
                const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
                userId = decoded.userId;
            } catch (e) {
                return res.status(401).json({ message: 'Invalid token' });
            }

            const { id, type } = req.body; // type: 'like' | 'dislike' | null (remove)

            if (!id) return res.status(400).json({ message: 'Missing ID' });

            // Using "Upsert" logic with the new relational table.
            // The DB Trigger (handle_vote_update) maintains the counts on the posts table automatically.

            if (type) {
                // Insert or Update the vote row
                const { error } = await supabase
                    .from('coffession_votes')
                    .upsert({
                        user_id: userId,
                        coffession_id: id,
                        vote_type: type
                    }, { onConflict: 'user_id, coffession_id' }); // Relies on the unique constraint

                if (error) throw error;
            } else {
                // Delete the vote row (Unvote)
                const { error } = await supabase
                    .from('coffession_votes')
                    .delete()
                    .match({ user_id: userId, coffession_id: id });

                if (error) throw error;
            }

            return res.status(200).json({ success: true });
        }

        // --- 4. DELETE: Delete Confession (Admin Only) ---
        if (req.method === 'DELETE' || (req.method === 'POST' && req.query.action === 'delete')) {
            const { id } = req.body;
            if (!id) return res.status(400).json({ message: 'Missing ID' });

            // Check Role
            const { data: user, error: userError } = await supabase
                .from('users')
                .select('role')
                .eq('_id', userId) // Using _id as per likely schema (MongoDB style ID used in Supabase typically mapped, checking strict equality)
                .single();

            // Fallback: try checking 'id' if '_id' fails or if schema uses 'id'
            let validRole = false;
            if (user && (user.role === 'admin' || user.role === 'semi-admin')) {
                validRole = true;
            } else if (!user) {
                // Try looking up by 'auth_id' or 'id' if _id is strictly internal
                const { data: user2 } = await supabase.from('users').select('role').eq('id', userId).single();
                if (user2 && (user2.role === 'admin' || user2.role === 'semi-admin')) validRole = true;
            }

            if (!validRole) return res.status(403).json({ message: 'Forbidden' });

            const { error: deleteError } = await supabase
                .from('coffessions')
                .delete()
                .eq('id', id);

            if (deleteError) throw deleteError;
            return res.status(200).json({ success: true });
        }

        return res.status(405).json({ message: 'Method not allowed' });

    } catch (error: any) {
        console.error('Coffessions Error:', error);
        return res.status(500).json({ message: error.message || 'Server error' });
    }
}
