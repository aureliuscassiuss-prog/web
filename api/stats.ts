import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../lib/supabase.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') return res.status(200).end();

    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const { count: resCount, error: resError } = await supabase
            .from('resources')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'approved');

        const { count: userCount, error: userError } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true });

        if (resError) throw resError;
        if (userError) throw userError;

        return res.status(200).json({
            totalResources: resCount || 0,
            totalUsers: userCount || 0
        });

    } catch (error) {
        console.error('Stats API Error:', error);
        return res.status(500).json({ message: 'Failed to fetch stats' });
    }
}
