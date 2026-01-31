import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import formidable from 'formidable';
import fs from 'fs';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseKey || 'placeholder');

const parseForm = (req: any): Promise<{ fields: formidable.Fields; files: formidable.Files }> => {
    return new Promise((resolve, reject) => {
        const form = formidable({ maxFileSize: 10 * 1024 * 1024 });
        form.parse(req, (err, fields, files) => {
            if (err) reject(err);
            else resolve({ fields, files });
        });
    });
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        if (req.method === 'GET') {
            const { data, error } = await supabase.from('fonts').select('*');
            if (error) throw error;
            const fonts = (data || []).map((row: any) => row.data);
            return res.status(200).json(fonts);
        }

        if (req.method === 'POST') {
            const { fields, files } = await parseForm(req);
            const file = Array.isArray(files.file) ? files.file[0] : files.file;
            const name = Array.isArray(fields.name) ? fields.name[0] : fields.name; // Font Name

            if (!file || !name) {
                return res.status(400).json({ error: 'File and name are required' });
            }

            const buffer = fs.readFileSync(file.filepath);
            const base64 = buffer.toString('base64');
            const mimeType = file.mimetype || 'font/ttf';
            const dataUrl = `data:${mimeType};base64,${base64}`;

            const font = {
                id: Math.random().toString(36).substr(2, 9),
                name,
                dataUrl
            };

            const { error } = await supabase
                .from('fonts')
                .upsert({ id: font.id, data: font }, { onConflict: 'id' });

            if (error) throw error;

            return res.status(200).json({ success: true, font });
        }

        return res.status(405).json({ message: 'Method not allowed' });
    } catch (error: any) {
        console.error('Fonts API Error:', error);
        return res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
}
