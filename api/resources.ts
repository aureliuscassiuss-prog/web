import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseKey || 'placeholder');

// Email transporter setup
const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.BREVO_USER,
        pass: process.env.BREVO_PASS
    }
});

// Helper function to send email notifications
async function sendUploadNotification(uploaderName: string, uploaderAvatar: string, resourceTitle: string, resourceId: string, resourceType: string) {
    const adminEmail = process.env.ADMIN_EMAIL || 'abhishekgarg2705@gmail.com'; // Default to your email
    const approvalLink = `https://extrovert.site/admin?action=approve&resourceId=${resourceId}`;

    const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                .uploader-info { display: flex; align-items: center; margin: 20px 0; padding: 15px; background: #f5f5f5; border-radius: 8px; }
                .avatar { width: 60px; height: 60px; border-radius: 50%; margin-right: 15px; object-fit: cover; }
                .resource-details { margin: 20px 0; padding: 15px; background: #e8f4f8; border-left: 4px solid #667eea; }
                .btn { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 20px; }
                .btn:hover { background: #764ba2; }
                .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎓 New Resource Uploaded!</h1>
                </div>
                <div class="content">
                    <div class="uploader-info">
                        <img src="${uploaderAvatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(uploaderName)}" alt="${uploaderName}" class="avatar">
                        <div>
                            <h3 style="margin: 0;">${uploaderName}</h3>
                            <p style="margin: 5px 0 0 0; color: #666;">Uploaded a new ${resourceType}</p>
                        </div>
                    </div>
                    
                    <div class="resource-details">
                        <h3 style="margin-top: 0;">📄 ${resourceTitle}</h3>
                        <p><strong>Type:</strong> ${resourceType.toUpperCase()}</p>
                        <p><strong>Resource ID:</strong> ${resourceId}</p>
                    </div>
                    
                    <p>A new resource has been uploaded and is pending your review. Please click the button below to approve or review this resource.</p>
                    
                    <a href="${approvalLink}" class="btn">🎯 Approve Now</a>
                    
                    <div class="footer">
                        <p>This is an automated notification from UniNotes.<br>You're receiving this because you're an admin.</p>
                    </div>
                </div>
            </div>
        </body>
        </html>
    `;

    try {
        await transporter.sendMail({
            from: '"UniNotes Admin" <noreply@uninotes.com>',
            to: adminEmail,
            subject: `📚 New Upload: ${resourceTitle} by ${uploaderName}`,
            html: emailHtml
        });
        console.log('Upload notification sent to admin');
    } catch (error) {
        console.error('Failed to send upload notification:', error);
        // Don't throw - we don't want email failure to block upload
    }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const { action } = req.query;

        // --- GET REQUESTS ---
        if (req.method === 'GET') {

            // 1. Leaderboard Action
            if (action === 'leaderboard') {
                try {
                    // Fetch top 50 users by reputation
                    const { data: topUsers, error: userError } = await supabase
                        .from('users')
                        .select('name, reputation, avatar, _id')
                        .order('reputation', { ascending: false })
                        .limit(50);

                    if (userError) throw userError;
                    if (!topUsers || topUsers.length === 0) {
                        return res.status(200).json({ leaderboard: [] });
                    }

                    // Get counts for these users
                    const userIds = topUsers.map(u => u._id);

                    // We fetch all approved resources for these users to count them
                    // Optimization: Standard SQL count group by would be better but this is JS-side for now
                    const { data: resources, error: resError } = await supabase
                        .from('resources')
                        .select('uploaderId')
                        .eq('status', 'approved')
                        .in('uploaderId', userIds);

                    const countMap = new Map();
                    if (resources) {
                        resources.forEach((r: any) => {
                            const uid = r.uploaderId;
                            countMap.set(uid, (countMap.get(uid) || 0) + 1);
                        });
                    }

                    const rankedLeaderboard = topUsers.map((user: any, index: number) => ({
                        rank: index + 1,
                        name: user.name || 'Anonymous',
                        points: user.reputation || 0,
                        uploads: countMap.get(user._id) || 0,
                        avatar: user.avatar || 'boy1'
                    }));

                    return res.status(200).json({ leaderboard: rankedLeaderboard });

                } catch (err) {
                    console.error('[Leaderboard] Error:', err);
                    return res.status(500).json({ leaderboard: [], message: 'Failed to fetch leaderboard' });
                }
            }

            // 2. Standard Resource Fetching
            const {
                type, resourceType, examYear, search,
                branch, course, year, semester, subject, unit
            } = req.query;

            let query = supabase
                .from('resources')
                .select('*, uploaderRel:users(avatar)') // Join with users to get avatar. requires FK
                .eq('status', 'approved')
                .limit(100);

            // Filtering
            if (typeof type === 'string') query = query.eq('resourceType', type);
            if (typeof resourceType === 'string') query = query.eq('resourceType', resourceType);
            if (typeof examYear === 'string') query = query.eq('examYear', examYear);
            if (typeof branch === 'string') query = query.eq('branch', branch);
            if (typeof course === 'string') query = query.eq('course', course);
            if (typeof semester === 'string') query = query.eq('semester', semester);
            if (typeof subject === 'string') query = query.eq('subject', subject);

            if (year) {
                const yearStr = year.toString();
                const yearNum = parseInt(yearStr.replace(/\D/g, ''));
                if (!isNaN(yearNum)) {
                    // In supabase we stored 'year' as text column in schema script to be flexible
                    // But if we want to match multiple formats, we might need an OR
                    // .or(`year.eq.${yearNum},year.eq.${yearStr},...`)
                    // For simplicity, let's just try exact match first or check the schema type
                    // Schema says "year text". So we search for the string.
                    query = query.or(`year.eq.${yearNum},year.eq.${yearStr},year.eq.${yearNum}${yearNum === 1 ? 'st' : yearNum === 2 ? 'nd' : yearNum === 3 ? 'rd' : 'th'} Year`);
                } else {
                    query = query.eq('year', yearStr);
                }
            }

            // Unit Filtering (partial match)
            if (typeof unit === 'string') {
                const numberOnly = unit.replace(/unit\s*/i, '');
                // ilike %numberOnly
                query = query.ilike('unit', `%${numberOnly}%`);
            }

            // Search (OR condition)
            if (typeof search === 'string') {
                const s = search; // simplify
                // ILIKE on title, description, subject, uploader
                // Note: uploader is a column in resources (denormalized name)
                query = query.or(`title.ilike.%${s}%,description.ilike.%${s}%,subject.ilike.%${s}%,uploader.ilike.%${s}%`);
            }

            // Execute
            const { data: resources, error } = await query.order('createdAt', { ascending: false });

            if (error) {
                console.error('Resource fetch error:', error);
                return res.status(500).json({ message: 'Failed to fetch resources' });
            }

            // Map results

            // Get user ID if authenticated
            let userId: string | null = null;
            try {
                const token = req.headers.authorization?.replace('Bearer ', '');
                if (token && process.env.JWT_SECRET) {
                    const decoded = jwt.verify(token, process.env.JWT_SECRET) as { userId: string };
                    userId = decoded.userId;
                }
            } catch (e) { }

            const resourcesWithStates = (resources || []).map((resource: any) => {
                // Flatten avatar from join
                const avatar = resource.uploaderRel?.avatar;

                // Calculate counts from arrays
                const likedBy = resource.likedBy || [];
                const dislikedBy = resource.dislikedBy || [];
                const savedBy = resource.savedBy || [];
                const flaggedBy = resource.flaggedBy || [];

                return {
                    ...resource,
                    uploaderAvatar: avatar,
                    // Counts
                    likes: likedBy.length,
                    dislikes: dislikedBy.length,
                    flags: flaggedBy.length,
                    downloads: resource.downloads || 0,
                    // User-specific states
                    userLiked: userId && likedBy.includes(userId),
                    userDisliked: userId && dislikedBy.includes(userId),
                    userSaved: userId && savedBy.includes(userId),
                    userFlagged: userId && flaggedBy.includes(userId)
                };
            });

            return res.status(200).json({ resources: resourcesWithStates });
        }

        // --- POST REQUESTS ---
        if (req.method === 'POST') {
            if (!process.env.JWT_SECRET) {
                return res.status(500).json({ message: 'Server misconfiguration' });
            }

            const token = req.headers.authorization?.replace('Bearer ', '');
            if (!token) return res.status(401).json({ message: 'No token provided' });

            const decoded = jwt.verify(token, process.env.JWT_SECRET) as { userId: string; name: string };
            const userId = decoded.userId;

            // Check user status
            const { data: user, error: userError } = await supabase
                .from('users')
                .select('*')
                .eq('_id', userId)
                .single();

            if (userError || !user) return res.status(404).json({ message: 'User not found' });
            if (user.isBanned) return res.status(403).json({ message: 'Banned' });
            if (user.isRestricted || user.canUpload === false) return res.status(403).json({ message: 'Restricted' });

            // Extract fields
            const {
                title, description, course, branch, year, yearNum, semester,
                subject, unit, resourceType, driveLink, examYear
            } = req.body;

            if (!title || !branch || !subject || !resourceType || !driveLink) {
                return res.status(400).json({ message: 'Missing required fields' });
            }
            if (resourceType === 'pyq' && !examYear) {
                return res.status(400).json({ message: 'Exam Year required for PYQ' });
            }

            const status = user.isTrusted ? 'approved' : 'pending';

            // Insert Resource
            // Patch: Store examYear in 'unit' column if PYQ to avoid 'column not found' error
            const storedUnit = resourceType === 'pyq' ? examYear : unit;

            const newResource = {
                title,
                description: description || '',
                course: course || 'B.Tech',
                branch,
                year: String(parseInt(String(yearNum || year || '1').replace(/\D/g, '')) || '1'), // Sanitize: "1st Year" -> "1"
                semester: semester || '',
                subject,
                unit,
                resourceType,
                driveLink,
                examYear: resourceType === 'pyq' ? examYear : null,
                status,
                uploader: user.name || 'Anonymous',
                uploaderId: userId,
                // Defaults handled by DB but good to be explicit or let DB handle it
                // likes/views/etc default to 0 in schema
                likedBy: [],
                dislikedBy: [],
                savedBy: [],
                flaggedBy: [],
            };

            const { data: inserted, error: insertError } = await supabase
                .from('resources')
                .insert(newResource)
                .select()
                .single();

            if (insertError) {
                console.error('Upload Error:', insertError);
                return res.status(500).json({ message: 'Upload failed', details: insertError });
            }

            // Update Reputation
            // We can rpc or just fetch-update. Just update is easier.
            // But we need to increment.
            // Supabase doesn't have simple 'inc' without rpc.
            // So we fetch user -> newRep = oldRep + 10 -> update.
            await supabase
                .from('users')
                .update({ reputation: (user.reputation || 0) + 10 })
                .eq('_id', userId);

            // Send email notification to admin about new upload
            // Don't await - run in background to avoid delaying response
            sendUploadNotification(
                user.name || 'Anonymous',
                user.avatar || '',
                title,
                inserted._id,
                resourceType
            ).catch(err => console.error('Email notification error:', err));

            return res.status(201).json({
                message: 'Resource uploaded successfully',
                resourceId: inserted._id,
                resource: inserted
            });
        }

        // --- DELETE REQUESTS ---
        if (req.method === 'DELETE') {
            if (!process.env.JWT_SECRET) return res.status(500).json({ message: 'Server error' });
            const token = req.headers.authorization?.replace('Bearer ', '');
            if (!token) return res.status(401).json({ message: 'Unauthorized' });

            const decoded = jwt.verify(token, process.env.JWT_SECRET) as { userId: string; role?: string };
            const { id } = req.query;

            if (!id || typeof id !== 'string') return res.status(400).json({ message: 'ID required' });

            // Check resource
            const { data: resource } = await supabase
                .from('resources')
                .select('*')
                .eq('_id', id)
                .single();

            if (!resource) return res.status(404).json({ message: 'Not found' });

            if (resource.uploaderId !== decoded.userId && decoded.role !== 'admin') {
                return res.status(403).json({ message: 'Forbidden' });
            }

            await supabase.from('resources').delete().eq('_id', id);
            return res.status(200).json({ message: 'Deleted' });
        }

        return res.status(405).json({ message: 'Method not allowed' });

    } catch (error) {
        console.error('Resource API Error:', error);
        return res.status(500).json({ message: 'Server error', error: String(error) });
    }
}
