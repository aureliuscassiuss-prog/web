// @ts-nocheck
import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';

// Import consolidated API handlers
import authHandler from './api/auth.ts';
import resourcesHandler from './api/resources.ts';
import profileHandler from './api/profile.ts';
import adminHandler from './api/admin.ts';
import aiHandler from './api/ai.ts';
// import leaderboardHandler from './api/leaderboard.ts'; // File does not exist, leaderboard handled in resources.ts
import statsHandler from './api/stats.ts';
import attendanceHandler from './api/attendance.ts';
import templatesHandler from './api/templates.ts';
import fontsHandler from './api/fonts.ts';

// Handler adapter for Vercel-style handlers
const adaptHandler = (handler: any) => async (req: Request, res: Response) => {
    try {
        // Vercel handlers expect (req, res)
        // We need to ensure req.query and req.body are available
        await handler(req, res);
    } catch (error) {
        console.error('Handler error:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Internal Server Error', details: error.message });
        }
    }
};

const app = express();
const PORT = 3000;

// Allow access from any origin (for mobile testing)
app.use(cors());

// Global Request Logger
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// IMPORTANT: Do NOT use express.json() globally if some handlers need raw body (like file uploads)
// But for our consolidated endpoints, most need JSON. 
// If profile/resources handlers use 'formidable', they handle the stream themselves.
// We'll apply json parsing conditionally or let the handlers deal with it.
// For now, let's use it but be aware of upload endpoints.
// Actually, 'formidable' in Vercel functions usually expects the raw request.
// So we should NOT use express.json() for routes that handle uploads.

// Middleware to parse JSON for non-upload routes
const jsonParser = express.json();

// --- ROUTES ---

// 1. Auth
app.all('/api/auth', jsonParser, adaptHandler(authHandler));

// 2. Resources (List & Upload)
// Note: Uploads use multipart/form-data, so we skip jsonParser for POSTs to /api/resources if it's an upload
app.use('/api/resources', (req, res, next) => {
    if (req.method === 'POST' && req.headers['content-type']?.includes('multipart/form-data')) {
        next();
    } else {
        jsonParser(req, res, next);
    }
}, adaptHandler(resourcesHandler));

// 3. Profile (Update & Uploads)
app.use('/api/profile', (req, res, next) => {
    if (req.method === 'PUT' && req.headers['content-type']?.includes('multipart/form-data')) {
        next();
    } else {
        jsonParser(req, res, next);
    }
}, adaptHandler(profileHandler));

// 4. Admin
app.all('/api/admin', jsonParser, adaptHandler(adminHandler));

// 5. AI
app.all('/api/ai', jsonParser, adaptHandler(aiHandler));

// 6. Leaderboard
// app.all('/api/leaderboard', jsonParser, adaptHandler(leaderboardHandler));

// 7. Stats
// 7. Stats
app.all('/api/stats', jsonParser, adaptHandler(statsHandler));

// 8. Attendance
app.all('/api/attendance', jsonParser, adaptHandler(attendanceHandler));

// 9. Translation Proxy
// 9. Translation Proxy (Merged into AI)
// 10. Coffessions
import coffessionsHandler from './api/coffessions.ts';
app.all('/api/coffessions', jsonParser, adaptHandler(coffessionsHandler));

// 11. Events
import eventsHandler from './api/events.ts';
app.all('/api/events', jsonParser, adaptHandler(eventsHandler));

// 12. Templates
app.all('/api/templates', (req, res, next) => {
    // Skip JSON parser for multipart (uploads)
    if (req.method === 'POST' && req.headers['content-type']?.includes('multipart/form-data')) {
        next();
    } else {
        jsonParser(req, res, next);
    }
}, adaptHandler(templatesHandler));
app.all('/api/templates/upload', (req, res, next) => next(), adaptHandler(templatesHandler)); // Alias for upload

// 13. Fonts
app.all('/api/fonts', (req, res, next) => {
    if (req.method === 'POST' && req.headers['content-type']?.includes('multipart/form-data')) {
        next();
    } else {
        jsonParser(req, res, next);
    }
}, adaptHandler(fontsHandler));

// Listen on 0.0.0.0 to be accessible from network
app.listen(PORT, '0.0.0.0', () => {
    console.log(`
🚀 Dev Server running on http://localhost:${PORT}
📱 Network Access: http://0.0.0.0:${PORT} (Use your local IP)

Endpoints:
- Auth:        http://localhost:${PORT}/api/auth
- Resources:   http://localhost:${PORT}/api/resources
- Profile:     http://localhost:${PORT}/api/profile
- Admin:       http://localhost:${PORT}/api/admin
- AI:          http://localhost:${PORT}/api/ai
- Coffessions: http://localhost:${PORT}/api/coffessions
- Events:      http://localhost:${PORT}/api/events
- Templates:   http://localhost:${PORT}/api/templates
- Fonts:       http://localhost:${PORT}/api/fonts
- Leaderboard: http://localhost:${PORT}/api/leaderboard
- Stats:       http://localhost:${PORT}/api/stats
    `);
});
