import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseKey || 'placeholder');

// Email Transporter (Reused from auth)
const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.BREVO_USER,
        pass: process.env.BREVO_PASS
    }
});

// Admin Emails to notify
const ADMIN_EMAILS = ['trilliontip@gmail.com'];

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        // 1. Authenticate if Authorization header is present
        let user: any = null;
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            try {
                if (process.env.JWT_SECRET) {
                    const decoded: any = jwt.verify(token, process.env.JWT_SECRET);
                    // Fetch full user for role check
                    const { data: u } = await supabase.from('users').select('*').eq('_id', decoded.userId).single();
                    user = u;
                }
            } catch (e) {
                console.error("Token verification failed:", e);
                // Continue as public if just viewing events, but restrict actions
            }
        }

        const { action } = req.query;

        // --- PUBLIC GET ---
        if (req.method === 'GET' && !action) {
            // Get public approved events
            const { data: events, error } = await supabase
                .from('events')
                .select('*, organizer:users(name, avatar)')
                .eq('status', 'approved')
                .order('date', { ascending: true }); // Detailed view shows upcoming first? or created? Date makes sense.

            if (error) throw error;
            return res.status(200).json({ events });
        }

        // --- AUTH PROTECTED ROUTES ---
        if (!user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        if (req.method === 'GET' && action === 'manager') {
            // Get MY events (Event Manager)
            const { data: events, error } = await supabase
                .from('events')
                .select('*')
                .eq('organizer_id', user._id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return res.status(200).json({ events });

        } else if (req.method === 'GET' && action === 'config') {
            // Get payment config
            const { data: config } = await supabase
                .from('payment_configs')
                .select('*')
                .eq('user_id', user._id)
                .single();

            // Don't return secret in full if possible, but for editing we might need it or just return mask
            // For MVP returning full string. Secure environment assumed.
            return res.status(200).json({ config });

        } else if (req.method === 'POST') {
            let body = req.body;
            if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { } }

            const { action: bodyAction } = body;

            if (bodyAction === 'create-event') {
                return await handleCreateEvent(user, body, res);
            } else if (bodyAction === 'save-config') {
                return await handleSaveConfig(user, body, res);
            }
        } else if (req.method === 'DELETE') {
            const { id } = req.query;
            if (!id) return res.status(400).json({ message: 'ID required' });

            // Check ownership OR Admin
            const { data: event } = await supabase.from('events').select('*').eq('_id', id).single();
            if (!event) return res.status(404).json({ message: 'Event not found' });

            if (event.organizer_id !== user._id && user.role !== 'admin') {
                return res.status(403).json({ message: 'Forbidden' });
            }

            await supabase.from('events').delete().eq('_id', id);
            return res.status(200).json({ message: 'Event deleted' });
        }

        return res.status(400).json({ message: 'Invalid action' });

    } catch (error) {
        console.error('Events API Error:', error);
        return res.status(500).json({ message: 'Server error', error: String(error) });
    }
}

async function handleCreateEvent(user: any, body: any, res: VercelResponse) {
    if (user.role !== 'event-manager' && user.role !== 'admin') {
        return res.status(403).json({ message: 'Only Event Managers can create events. Request this role in Admin.' });
    }

    const { title, description, image, date, location, price, currency, paymentConfigId } = body;

    if (!title || !date || !price) {
        return res.status(400).json({ message: 'Title, Date, and Price are required' });
    }

    // Insert
    const { data: event, error } = await supabase.from('events').insert({
        title,
        description,
        image,
        date,
        location,
        price,
        currency: currency || 'INR',
        organizer_id: user._id,
        status: 'pending', // Default to pending
        payment_config_id: paymentConfigId || null,
        created_at: new Date().toISOString()
    }).select().single();

    if (error) throw error;

    // Notify Admins
    if (user.role !== 'admin') { // Don't notify if admin created it (auto-approve logic could be added, but per spec 'only event manager creates')
        // Find Admins, Semi-Admins, Content Managers
        const { data: admins } = await supabase
            .from('users')
            .select('email')
            .in('role', ['admin', 'semi-admin', 'content-reviewer']);

        if (admins && admins.length > 0) {
            const emails = admins.map(a => a.email);
            try {
                await transporter.sendMail({
                    from: '"UniNotes Events" <events@trilliontip.com>',
                    to: emails,
                    subject: 'New Event Pending Approval',
                    html: `<p>User <b>${user.name}</b> has created a new event: <b>${title}</b>.</p>
                           <p>Please review and approve it in the Admin Panel.</p>`
                });
            } catch (e) {
                console.error("Failed to send notification email", e);
            }
        }
    }

    return res.status(200).json({ message: 'Event created and pending approval', event });
}

async function handleSaveConfig(user: any, body: any, res: VercelResponse) {
    const { provider, keyId, keySecret } = body;

    if (!keyId || !keySecret) {
        return res.status(400).json({ message: 'Key ID and Secret are required' });
    }

    // Check if exists
    const { data: existing } = await supabase
        .from('payment_configs')
        .select('_id')
        .eq('user_id', user._id)
        .single();

    if (existing) {
        await supabase.from('payment_configs').update({
            provider: provider || 'razorpay',
            key_id: keyId,
            key_secret: keySecret, // In real app, encrypt this!
            updated_at: new Date().toISOString()
        }).eq('_id', existing._id);
    } else {
        await supabase.from('payment_configs').insert({
            user_id: user._id,
            provider: provider || 'razorpay',
            key_id: keyId,
            key_secret: keySecret
        });
    }

    return res.status(200).json({ message: 'Payment configuration saved' });
}
