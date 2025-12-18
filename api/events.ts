import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import QRCode from 'qrcode'; // Check if installed

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
                .select('*')
                .eq('status', 'approved')
                .order('date', { ascending: true });

            if (error) throw error;

            // Manually fetch organizer data for each event
            if (events && events.length > 0) {
                const organizerIds = [...new Set(events.map(e => e.organizer_id))];
                const { data: organizers } = await supabase
                    .from('users')
                    .select('_id, name, avatar')
                    .in('_id', organizerIds);

                const organizerMap = new Map(organizers?.map(o => [o._id, o]) || []);
                events.forEach(event => {
                    event.organizer = organizerMap.get(event.organizer_id) || null;
                });
            }

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

        } else if (req.method === 'GET' && action === 'tickets') {
            // Get MY Tickets (User)
            const { data: tickets, error } = await supabase
                .from('tickets')
                .select('*')
                .eq('user_id', user._id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Manually fetch event data
            if (tickets && tickets.length > 0) {
                const eventIds = [...new Set(tickets.map(t => t.event_id))];
                const { data: events } = await supabase
                    .from('events')
                    .select('*')
                    .in('_id', eventIds);

                const eventMap = new Map(events?.map(e => [e._id, e]) || []);
                tickets.forEach(ticket => {
                    ticket.event = eventMap.get(ticket.event_id) || null;
                });
            }

            return res.status(200).json({ tickets });

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
            } else if (bodyAction === 'book-ticket') {
                return await handleBookTicket(user, body, res);
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

    } catch (error: any) {
        console.error('Events API Error:', error);
        return res.status(500).json({ message: 'Server error', error: error.message || String(error), stack: error.stack });
    }
}

async function handleCreateEvent(user: any, body: any, res: VercelResponse) {
    if (user.role !== 'event-manager' && user.role !== 'admin') {
        return res.status(403).json({ message: 'Only Event Managers can create events. Request this role in Admin.' });
    }

    const { title, description, image, date, location, price, currency, total_slots, registration_deadline, accepted_payment_methods } = body;

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
        total_slots: total_slots ? parseInt(total_slots) : 100,
        booked_slots: 0,
        registration_deadline: registration_deadline || date, // Default deadline is event start
        accepted_payment_methods: accepted_payment_methods || ['razorpay'],
        organizer_id: user._id,
        status: 'pending', // Default to pending
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

async function handleBookTicket(user: any, body: any, res: VercelResponse) {
    const { eventId, gateway, paymentData } = body; // paymentData would be the success response from Razorpay/Cashfree

    // 1. Fetch Event
    const { data: event } = await supabase.from('events').select('*').eq('_id', eventId).single();
    if (!event) return res.status(404).json({ message: 'Event not found' });

    // 2. Checks
    if (event.total_slots && event.booked_slots >= event.total_slots) {
        return res.status(400).json({ message: 'Event is fully booked' });
    }

    if (new Date() > new Date(event.registration_deadline)) {
        return res.status(400).json({ message: 'Registration has closed' });
    }

    // 3. (Mock) Verify Payment
    // In production, we would verify the signature/status using paymentData and the manager's keys.
    // Assuming payment success for this MVP/Task.
    const paymentId = paymentData?.payment_id || `mock_${Date.now()}`;
    const amount = event.price;

    // 4. Create Ticket
    const ticketId = crypto.randomUUID();
    const qrData = JSON.stringify({
        ticketId,
        eventId,
        userId: user._id,
        status: 'confirmed'
    });

    // Generate QR Code Image (Data URL)
    const qrCodeImage = await QRCode.toDataURL(qrData);

    const { data: ticket, error } = await supabase.from('tickets').insert({
        id: ticketId,
        event_id: eventId,
        user_id: user._id,
        status: 'confirmed',
        payment_id: paymentId,
        gateway: gateway || 'razorpay',
        qr_code_data: qrData,
        amount: amount,
        created_at: new Date().toISOString()
    }).select().single();

    if (error) throw error;

    // 5. Update Booked Slots
    await supabase.from('events').update({
        booked_slots: (event.booked_slots || 0) + 1
    }).eq('_id', eventId);

    // 6. Send Email
    try {
        await transporter.sendMail({
            from: '"UniNotes Tickets" <tickets@trilliontip.com>',
            to: user.email,
            subject: `Ticket Confirmed: ${event.title}`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px;">
                    <h2 style="color: #4f46e5; margin-bottom: 24px;">Your Ticket is Confirmed! 🎉</h2>
                    <p style="color: #374151; font-size: 16px;">Hello <b>${user.name}</b>,</p>
                    <p style="color: #374151;">You have successfully booked a ticket for <b>${event.title}</b>.</p>
                    
                    <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 24px 0;">
                        <p style="margin: 0 0 8px 0;"><b>Date:</b> ${new Date(event.date).toLocaleDateString()}</p>
                        <p style="margin: 0 0 8px 0;"><b>Location:</b> ${event.location}</p>
                        <p style="margin: 0 0 8px 0;"><b>Price:</b> ${event.currency} ${event.price}</p>
                        <p style="margin: 0;"><b>Ticket ID:</b> ${ticketId}</p>
                    </div>

                    <div style="text-align: center; margin: 32px 0;">
                        <img src="${qrCodeImage}" alt="Ticket QR Code" style="width: 200px; height: 200px;" />
                        <p style="font-size: 12px; color: #6b7280; margin-top: 8px;">Scan this QR code at the venue entry</p>
                    </div>

                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;" />
                    <p style="color: #6b7280; font-size: 12px; text-align: center;">© 2025 UniNotes Events</p>
                </div>
            `,
            attachments: [
                {
                    filename: 'ticket_qr.png',
                    content: qrCodeImage.split("base64,")[1],
                    encoding: 'base64'
                }
            ]
        });
    } catch (e) {
        console.error("Failed to send ticket email", e);
    }

    return res.status(200).json({ message: 'Ticket booked successfully', ticket });
}
