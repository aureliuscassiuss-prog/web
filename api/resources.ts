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

// Helper function to send email notifications to all admins and content reviewers
async function sendUploadNotification(uploaderName: string, uploaderAvatar: string, resourceTitle: string, resourceId: string, resourceType: string) {
    try {
        // Get all admin and content reviewer emails from database
        const { data: adminUsers, error } = await supabase
            .from('users')
            .select('email, name')
            .in('role', ['admin', 'semi-admin', 'content-reviewer']);

        if (error || !adminUsers || adminUsers.length === 0) {
            console.error('No admin users found for notifications:', error);
            return;
        }

        const approvalLink = `https://extrovert.site/admin?action=approve&resourceId=${resourceId}`;

        const emailHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
                    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border: 1px solid #e5e7eb; }
                    .header { background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); padding: 32px; text-align: center; }
                    .content { padding: 40px 32px; }
                    .uploader-info { display: flex; align-items: center; margin-bottom: 24px; padding: 16px; background: #f3f4f6; border-radius: 8px; }
                    .avatar { width: 50px; height: 50px; border-radius: 50%; margin-right: 16px; object-fit: cover; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                    .resource-card { margin: 24px 0; padding: 20px; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; border-left: 4px solid #6366f1; }
                    .btn { display: inline-block; padding: 14px 32px; background: #4f46e5; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; text-align: center; font-size: 16px; margin-top: 24px; box-shadow: 0 4px 6px rgba(79, 70, 229, 0.25); }
                    .btn:hover { background: #4338ca; }
                    .footer { background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -1px;">Extrovert Community</h1>
                        <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 16px;">New Resource Submission</p>
                    </div>
                    <div class="content">
                        <div class="uploader-info">
                            <img src="${uploaderAvatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(uploaderName)}" alt="${uploaderName}" class="avatar">
                            <div>
                                <h3 style="margin: 0; color: #1f2937; font-size: 16px;">${uploaderName}</h3>
                                <p style="margin: 4px 0 0 0; color: #6b7280; font-size: 14px;">has uploaded a new resource</p>
                            </div>
                        </div>
                        
                        <div class="resource-card">
                            <h3 style="margin: 0 0 12px 0; color: #111827; font-size: 18px;">📄 ${resourceTitle}</h3>
                            <div style="display: grid; grid-template-columns: auto 1fr; gap: 8px; font-size: 14px; color: #4b5563;">
                                <strong>Type:</strong> <span>${resourceType.toUpperCase()}</span>
                                <strong>ID:</strong> <span style="font-family: monospace;">${resourceId}</span>
                            </div>
                        </div>
                        
                        <p style="color: #4b5563; margin-bottom: 24px;">This resource is pending review. Please verify the content guidelines before approving.</p>
                        
                        <div style="text-align: center;">
                            <a href="${approvalLink}" class="btn">Review & Approve</a>
                        </div>
                    </div>
                    
                    <div class="footer">
                        <p style="margin: 0;">&copy; ${new Date().getFullYear()} Extrovert Admin System</p>
                        <p style="margin: 8px 0 0 0;">You received this because you are an admin or content reviewer.</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        // Send email to all admin users
        const emailPromises = adminUsers.map(admin =>
            transporter.sendMail({
                from: '"Extrovert Admin" <resources@trilliontip.com>',
                to: admin.email,
                subject: `📚 New Upload: ${resourceTitle} by ${uploaderName}`,
                html: emailHtml
            })
        );

        await Promise.all(emailPromises);
        console.log(`Upload notification sent to ${adminUsers.length} admin(s)/reviewer(s)`);
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
        let { action } = req.query;
        // Infer share action if slug is present (robustness for lost query params)
        if (!action && req.query.slug) {
            action = 'share';
            console.log('[API] Inferred action=share from slug presence');
        }

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
            if (!action) {
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
        }

        // 3. Fetched Saved Resources
        if (action === 'saved') {
            const token = req.headers.authorization?.replace('Bearer ', '');
            if (!token) return res.status(401).json({ message: 'Unauthorized' });

            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
                const { data: savedResources, error } = await supabase
                    .from('resources')
                    .select('*, uploaderRel:users(avatar)')
                    .contains('savedBy', [decoded.userId])
                    .order('createdAt', { ascending: false });

                if (error) throw error;

                // Format response similar to standard fetch
                const formatted = (savedResources || []).map((r: any) => ({
                    ...r,
                    uploaderAvatar: r.uploaderRel?.avatar,
                    likes: (r.likedBy || []).length,
                    dislikes: (r.dislikedBy || []).length,
                    downloads: r.downloads || 0,
                    flags: (r.flaggedBy || []).length,
                    userLiked: (r.likedBy || []).includes(decoded.userId),
                    userDisliked: (r.dislikedBy || []).includes(decoded.userId),
                    userSaved: true,
                    userFlagged: (r.flaggedBy || []).includes(decoded.userId)
                }));

                return res.status(200).json({ resources: formatted });
            } catch (e) {
                return res.status(500).json({ message: 'Failed to fetch saved' });
            }
        }

        // 4. Shared Resources Fetch
        if (action === 'share') {
            const { slug } = req.query;
            if (!slug || typeof slug !== 'string') return res.status(400).json({ message: 'Invalid slug' });

            try {
                // 1. Check Shared List
                const { data: sharedList } = await supabase.from('shared_lists').select('*').eq('slug', slug).single();
                console.log('[API] Shared List Fetch:', { slug, found: !!sharedList, ownerId: sharedList?.ownerId });

                let resources: any[] = [];
                let ownerUser: any = null;

                if (sharedList) {
                    // Try to fetch owner using _id OR id to be safe against schema variations
                    // Note: sharedList.ownerId is a string. Using .or() with syntax: field.eq.value,field2.eq.value
                    const { data: owner, error: ownerError } = await supabase
                        .from('users')
                        .select('name, avatar, _id, id')
                        .or(`_id.eq.${sharedList.ownerId},id.eq.${sharedList.ownerId}`)
                        .maybeSingle();

                    console.log('[API] Owner Fetch:', { ownerId: sharedList.ownerId, ownerFound: !!owner, error: ownerError });
                    ownerUser = owner;

                    if (sharedList.resources && sharedList.resources.length > 0) {
                        const { data: resData, error: resError } = await supabase
                            .from('resources')
                            .select('*, uploaderRel:users(avatar)')
                            .in('_id', sharedList.resources)
                            .eq('status', 'approved')
                            .order('createdAt', { ascending: false });

                        console.log('[API] Resources Fetch:', {
                            ids: sharedList.resources,
                            found: resData?.length,
                            error: resError
                        });
                        resources = resData || [];
                    }
                } else {
                    // ... (User Slug logic kept similar but should be rare now)
                    const { data: owner } = await supabase.from('users').select('*').eq('shareSlug', slug).single();
                    if (!owner) return res.status(404).json({ message: 'Shared list not found' });
                    ownerUser = owner;
                    // ...
                }

                // ... (Viewer state mapping) ...
                let viewerUserId: string | null = null;
                try {
                    const token = req.headers.authorization?.replace('Bearer ', '');
                    if (token && process.env.JWT_SECRET) {
                        const decoded = jwt.verify(token, process.env.JWT_SECRET) as { userId: string };
                        viewerUserId = decoded.userId;
                    }
                } catch (e) { }

                const mappedResources = (resources || []).map((r: any) => ({
                    ...r,
                    uploaderAvatar: r.uploaderRel?.avatar,
                    likes: (r.likedBy || []).length,
                    dislikes: (r.dislikedBy || []).length,
                    flags: (r.flaggedBy || []).length,
                    downloads: r.downloads || 0,
                    userLiked: viewerUserId && (r.likedBy || []).includes(viewerUserId),
                    userDisliked: viewerUserId && (r.dislikedBy || []).includes(viewerUserId),
                    userSaved: viewerUserId && (r.savedBy || []).includes(viewerUserId),
                    userFlagged: viewerUserId && (r.flaggedBy || []).includes(viewerUserId)
                }));

                return res.status(200).json({
                    user: { name: ownerUser?.name || 'Anonymous', avatar: ownerUser?.avatar },
                    list: sharedList ? { note: sharedList.note, createdAt: sharedList.createdAt } : null,
                    resources: mappedResources,
                    debug: {
                        slug,
                        listFound: !!sharedList,
                        ownerId: sharedList?.ownerId,
                        ownerFound: !!ownerUser,
                        resourceCount: resources.length,
                        resourceIds: sharedList?.resources
                    }
                });
            } catch (error) {
                console.error('Share fetch error:', error);
                return res.status(500).json({ message: 'Failed to fetch shared' });
            }
        }

        // --- POST REQUESTS ---
        if (req.method === 'POST') {
            // Handle Interactions (Like, Save, etc)
            const { resourceId, action: interactionAction, value, type: voteType } = req.body;

            // DEBUG LOGS
            console.log(`[API] POST Action Request. Query: ${JSON.stringify(req.query)}, Body:`, req.body);

            // Simplified action detection: check body.action first, then query param, then infer from payload
            const effectiveAction = req.body.action || interactionAction || req.query.action || (req.body.resourceIds ? 'share' : null);
            console.log(`[API] Effective Action: ${effectiveAction}`);

            if (effectiveAction && ['like', 'dislike', 'save', 'flag', 'rate', 'download', 'share'].includes(effectiveAction)) {
                if (!process.env.JWT_SECRET) return res.status(500).json({ message: 'Server error' });
                const token = req.headers.authorization?.replace('Bearer ', '');
                if (!token) return res.status(401).json({ message: 'Unauthorized' });

                try {
                    const decoded = jwt.verify(token, process.env.JWT_SECRET) as { userId: string };
                    const userId = decoded.userId;

                    // Handle Share Creation specifically
                    if (effectiveAction === 'share') {
                        const { resourceIds, note } = req.body;
                        const { default: crypto } = await import('crypto');

                        const { data: user } = await supabase.from('users').select('*').eq('_id', userId).single();
                        if (!user) return res.status(404).json({ message: 'User not found' });

                        if (Array.isArray(resourceIds) && resourceIds.length > 0) {
                            const slug = crypto.randomBytes(4).toString('hex');
                            const { error: insertError } = await supabase.from('shared_lists').insert({
                                slug, ownerId: userId, resources: resourceIds, note: note || ''
                            });

                            if (insertError) {
                                console.error('Shared List Insert Error:', insertError);
                                // If table missing or other error, fallback to user slug or error out
                                // But better to error out so we know
                                return res.status(500).json({ message: 'Failed to create shared list', error: insertError });
                            }

                            return res.status(200).json({ slug });
                        }

                        // Legacy / Full profile share
                        if (user.shareSlug) return res.status(200).json({ slug: user.shareSlug });

                        const slug = crypto.randomBytes(4).toString('hex');
                        await supabase.from('users').update({ shareSlug: slug }).eq('_id', userId);
                        return res.status(200).json({ slug });
                    }

                    const { data: resource, error: fetchError } = await supabase
                        .from('resources')
                        .select('*')
                        .eq('_id', resourceId)
                        .single();

                    if (fetchError || !resource) return res.status(404).json({ message: 'Resource not found' });

                    const toggle = (arr: string[], id: string) => {
                        if (!arr) arr = [];
                        const idx = arr.indexOf(id);
                        if (idx === -1) arr.push(id);
                        else arr.splice(idx, 1);
                        return arr;
                    };

                    let dbUpdates: any = {};
                    let responseData: any = {};
                    let message = '';

                    if (effectiveAction === 'like') {
                        let likedBy = resource.likedBy || [];
                        let dislikedBy = resource.dislikedBy || [];
                        if (dislikedBy.includes(userId)) {
                            dislikedBy = dislikedBy.filter((id: string) => id !== userId);
                            dbUpdates.dislikedBy = dislikedBy;
                        }
                        likedBy = toggle(likedBy, userId);
                        dbUpdates.likedBy = likedBy;
                        responseData.likes = likedBy.length;
                        responseData.dislikes = dislikedBy.length;
                        responseData.isLiked = likedBy.includes(userId);
                        responseData.isDisliked = false;
                        message = likedBy.includes(userId) ? 'Liked' : 'Unliked';
                    }
                    else if (effectiveAction === 'dislike') {
                        let likedBy = resource.likedBy || [];
                        let dislikedBy = resource.dislikedBy || [];
                        if (likedBy.includes(userId)) {
                            likedBy = likedBy.filter((id: string) => id !== userId);
                            dbUpdates.likedBy = likedBy;
                        }
                        dislikedBy = toggle(dislikedBy, userId);
                        dbUpdates.dislikedBy = dislikedBy;
                        responseData.likes = likedBy.length;
                        responseData.dislikes = dislikedBy.length;
                        responseData.isLiked = false;
                        responseData.isDisliked = dislikedBy.includes(userId);
                        message = dislikedBy.includes(userId) ? 'Disliked' : 'Undisliked';
                    }
                    else if (effectiveAction === 'save') {
                        let savedBy = toggle(resource.savedBy || [], userId);
                        dbUpdates.savedBy = savedBy;
                        responseData.isSaved = savedBy.includes(userId);
                        message = savedBy.includes(userId) ? 'Saved' : 'Unsaved';
                    }
                    else if (effectiveAction === 'flag') {
                        let flaggedBy = toggle(resource.flaggedBy || [], userId);
                        dbUpdates.flaggedBy = flaggedBy;
                        responseData.isFlagged = flaggedBy.includes(userId);
                        message = 'Flagged';
                    }
                    else if (effectiveAction === 'rate') {
                        dbUpdates.rating = value; // Needs aggregation logic usually but simplified for now
                        message = 'Rated';
                    }
                    else if (effectiveAction === 'download') {
                        dbUpdates.downloads = (resource.downloads || 0) + 1;
                        message = 'Download counted';
                    }

                    if (Object.keys(dbUpdates).length > 0) {
                        const { error: updateError } = await supabase
                            .from('resources')
                            .update(dbUpdates)
                            .eq('_id', resourceId);
                        if (updateError) throw updateError;
                    }

                    const returnResource = {
                        ...resource,
                        ...dbUpdates,
                        likes: (dbUpdates.likedBy || resource.likedBy || []).length,
                        dislikes: (dbUpdates.dislikedBy || resource.dislikedBy || []).length,
                        flags: (dbUpdates.flaggedBy || resource.flaggedBy || []).length,
                        downloads: dbUpdates.downloads !== undefined ? dbUpdates.downloads : (resource.downloads || 0),
                        ...responseData
                    };

                    return res.status(200).json({ message, resource: returnResource });

                } catch (err: any) {
                    return res.status(500).json({ message: 'Interaction failed', error: err.message });
                }
            }


            // --- Standard Upload Logic continues... ---
            // SAFEGUARD: If this is a share or interaction request, don't validate upload fields
            if (req.body.action || req.query.action || req.body.resourceIds || req.body.resourceId) {
                console.error('[API] Request with action/resourceIds reached upload section. This should not happen.');
                console.error('[API] Body:', req.body);
                console.error('[API] Query:', req.query);
                return res.status(400).json({
                    message: 'Invalid request - action not recognized',
                    debug: {
                        action: req.body.action || req.query.action,
                        hasResourceIds: !!req.body.resourceIds,
                        hasResourceId: !!req.body.resourceId
                    }
                });
            }

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

            // Send email notification to all admins and content reviewers about new upload
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
