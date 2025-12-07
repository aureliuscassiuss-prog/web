import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseKey || 'placeholder');
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') return res.status(200).end();

    if (req.method === 'POST') {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) return res.status(401).json({ message: 'Unauthorized' });

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
            const userId = decoded.userId;

            const { data: user } = await supabase.from('users').select('*').eq('_id', userId).single();
            if (!user) return res.status(404).json({ message: 'User not found' });

            const { resourceIds, note } = req.body;

            if (Array.isArray(resourceIds) && resourceIds.length > 0) {
                const slug = crypto.randomBytes(4).toString('hex');
                await supabase.from('shared_lists').insert({
                    slug,
                    ownerId: userId,
                    resources: resourceIds, // Postgres array of uuids
                    note: note || '',
                });
                return res.status(200).json({ slug });
            }

            if (user.shareSlug) {
                return res.status(200).json({ slug: user.shareSlug });
            }

            const slug = crypto.randomBytes(4).toString('hex');
            await supabase.from('users').update({ shareSlug: slug }).eq('_id', userId);

            return res.status(200).json({ slug });

        } catch (error) {
            console.error('Share generation error:', error);
            return res.status(500).json({ message: 'Failed to generate link' });
        }
    }

    if (req.method === 'GET') {
        const { slug } = req.query;
        if (!slug || typeof slug !== 'string') return res.status(400).json({ message: 'Invalid slug' });

        try {
            // 1. Check Shared List
            const { data: sharedList } = await supabase.from('shared_lists').select('*').eq('slug', slug).single();

            let resources: any[] = [];
            let ownerUser: any = null;

            if (sharedList) {
                // Fetch owner
                const { data: owner } = await supabase.from('users').select('name, avatar, _id').eq('_id', sharedList.ownerId).single();
                ownerUser = owner;

                // Fetch resources
                // sharedList.resources is array of UUIDs
                if (sharedList.resources && sharedList.resources.length > 0) {
                    const { data: resData } = await supabase
                        .from('resources')
                        .select('*, uploader:users(avatar)')
                        .in('_id', sharedList.resources)
                        .eq('status', 'approved')
                        .order('createdAt', { ascending: false });

                    resources = resData || [];
                }

            } else {
                // 2. Check User Slug
                const { data: owner } = await supabase.from('users').select('*').eq('shareSlug', slug).single();
                if (!owner) return res.status(404).json({ message: 'Shared list not found' });

                ownerUser = owner;

                // Fetch that user's saved resources
                const { data: resData } = await supabase
                    .from('resources')
                    .select('*, uploader:users(avatar)')
                    .contains('savedBy', [owner._id]) // Check if owner ID is in savedBy array
                    .eq('status', 'approved')
                    .order('createdAt', { ascending: false });

                resources = resData || [];
            }

            // Map data
            const mappedResources = resources.map((r: any) => ({
                ...r,
                uploaderAvatar: r.uploader?.avatar,
                // Add current user interactions if needed (omitted for brevity but can be added similarly to other endpoints)
            }));

            return res.status(200).json({
                user: {
                    name: ownerUser?.name || 'Anonymous',
                    avatar: ownerUser?.avatar
                },
                list: sharedList ? {
                    note: sharedList.note,
                    createdAt: sharedList.createdAt
                } : null,
                resources: mappedResources
            });

        } catch (error) {
            console.error('Share fetch error:', error);
            return res.status(500).json({ message: 'Failed to fetch shared resources' });
        }
    }

    return res.status(405).json({ message: 'Method not allowed' });
}
