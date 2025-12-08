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
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST' && req.method !== 'GET') return res.status(405).json({ message: 'Method not allowed' });

    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) return res.status(401).json({ message: 'Unauthorized' });

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
        const userId = decoded.userId;

        // --- GET: Fetch Save Resources ---
        if (req.method === 'GET') {
            const { data: resources, error } = await supabase
                .from('resources')
                .select('*, uploaderRel:users(avatar)')
                .contains('savedBy', [userId])
                .order('createdAt', { ascending: false });

            if (error) {
                console.error('Fetch Saved Error:', error);
                return res.status(500).json({ message: 'Failed to fetch saved resources' });
            }

            const formatted = (resources || []).map((r: any) => ({
                ...r,
                uploaderAvatar: r.uploaderRel?.avatar, // Use alias from resource.ts if possible, or just uploaderRel
                // Calculate counts
                likes: (r.likedBy || []).length,
                dislikes: (r.dislikedBy || []).length,
                downloads: r.downloads || 0,
                flags: (r.flaggedBy || []).length,
                // User state
                userLiked: (r.likedBy || []).includes(userId),
                userDisliked: (r.dislikedBy || []).includes(userId),
                userSaved: true, // By definition
                userFlagged: (r.flaggedBy || []).includes(userId)
            }));

            return res.status(200).json({ resources: formatted });
        }

        // --- POST: Handle Interactions ---
        const { resourceId, action, value } = req.body; // action: like, dislike, save, flag, rate

        if (!resourceId) return res.status(400).json({ message: 'Resource ID required' });

        // Get current resource
        const { data: resource, error: fetchError } = await supabase
            .from('resources')
            .select('*')
            .eq('_id', resourceId)
            .single();

        if (fetchError || !resource) return res.status(404).json({ message: 'Resource not found' });

        // Helper to Toggle in Array
        const toggle = (arr: string[], id: string) => {
            if (!arr) arr = [];
            const idx = arr.indexOf(id);
            if (idx === -1) arr.push(id);
            else arr.splice(idx, 1);
            return arr;
        };

        // Separate DB updates from Response data
        let dbUpdates: any = {};
        let responseData: any = {};
        let message = '';

        if (action === 'like') {
            let likedBy = resource.likedBy || [];
            let dislikedBy = resource.dislikedBy || [];

            // If already disliked, remove dislike
            if (dislikedBy.includes(userId)) {
                dislikedBy = dislikedBy.filter((id: string) => id !== userId);
                dbUpdates.dislikedBy = dislikedBy;
            }

            likedBy = toggle(likedBy, userId);
            dbUpdates.likedBy = likedBy;

            // Calculate counts for response
            responseData.likes = likedBy.length;
            responseData.dislikes = dislikedBy.length;
            responseData.isLiked = likedBy.includes(userId);
            responseData.isDisliked = false;

            message = likedBy.includes(userId) ? 'Liked' : 'Unliked';
        }
        else if (action === 'dislike') {
            let likedBy = resource.likedBy || [];
            let dislikedBy = resource.dislikedBy || [];

            // If already liked, remove like
            if (likedBy.includes(userId)) {
                likedBy = likedBy.filter((id: string) => id !== userId);
                dbUpdates.likedBy = likedBy;
            }

            dislikedBy = toggle(dislikedBy, userId);
            dbUpdates.dislikedBy = dislikedBy;

            // Calculate counts for response
            responseData.likes = likedBy.length;
            responseData.dislikes = dislikedBy.length;
            responseData.isLiked = false;
            responseData.isDisliked = dislikedBy.includes(userId);

            message = dislikedBy.includes(userId) ? 'Disliked' : 'Undisliked';
        }
        else if (action === 'save') {
            let savedBy = toggle(resource.savedBy || [], userId);
            dbUpdates.savedBy = savedBy;
            responseData.isSaved = savedBy.includes(userId);
            message = savedBy.includes(userId) ? 'Saved' : 'Unsaved';
        }
        else if (action === 'flag') {
            let flaggedBy = toggle(resource.flaggedBy || [], userId);
            dbUpdates.flaggedBy = flaggedBy;
            responseData.isFlagged = flaggedBy.includes(userId);
            message = 'Flagged';
        }
        else if (action === 'rate') {
            dbUpdates.rating = value;
            message = 'Rated';
        } else {
            return res.status(400).json({ message: 'Invalid action' });
        }

        const { error: updateError } = await supabase
            .from('resources')
            .update(dbUpdates)
            .eq('_id', resourceId);

        if (updateError) throw updateError;

        return res.status(200).json({ message, ...dbUpdates, ...responseData });

    } catch (error) {
        console.error('Interaction Error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
}
