import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import formidable from 'formidable';
import fs from 'fs';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseKey || 'placeholder');

// Helper for formidable
const parseForm = (req: any): Promise<{ fields: formidable.Fields; files: formidable.Files }> => {
    return new Promise((resolve, reject) => {
        const form = formidable({ maxFileSize: 10 * 1024 * 1024 }); // 10MB
        form.parse(req, (err, fields, files) => {
            if (err) reject(err);
            else resolve({ fields, files });
        });
    });
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        // --- GET: List Templates ---
        if (req.method === 'GET') {
            const { data, error } = await supabase.from('templates').select('*');
            if (error) throw error;

            // Map data structure if needed (assuming 'data' column holds the JSON)
            const templates = (data || []).map((row: any) => row.data);
            return res.status(200).json(templates);
        }

        // --- DELETE: Delete Template ---
        if (req.method === 'DELETE') {
            const id = req.query.id as string;
            if (!id) return res.status(400).json({ error: 'ID required' });

            const { error } = await supabase.from('templates').delete().eq('id', id);
            if (error) throw error;

            return res.status(200).json({ success: true });
        }

        // --- POST: Save or Upload ---
        if (req.method === 'POST') {
            const contentType = req.headers['content-type'] || '';

            // Handle File Upload (Multipart)
            if (contentType.includes('multipart/form-data')) {
                const { files } = await parseForm(req);
                const file = Array.isArray(files.file) ? files.file[0] : files.file;

                if (!file) {
                    return res.status(400).json({ error: 'No file uploaded' });
                }

                // Convert to Base64
                const buffer = fs.readFileSync(file.filepath);
                const base64 = buffer.toString('base64');
                const mimeType = file.mimetype || 'image/png';
                const dataUrl = `data:${mimeType};base64,${base64}`;

                // Return URL (Base64 for now)
                return res.status(200).json({ success: true, imageUrl: dataUrl });
            }

            // Handle Save JSON
            else {
                const template = req.body;
                if (!template || !template.id) {
                    return res.status(400).json({ error: 'Invalid template data' });
                }

                const { error } = await supabase
                    .from('templates')
                    .upsert({ id: template.id, data: template }, { onConflict: 'id' });

                if (error) throw error;

                return res.status(200).json({ success: true, template });
            }
        }

        return res.status(405).json({ message: 'Method not allowed' });
    } catch (error: any) {
        console.error('Templates API Error:', error);
        return res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
}
