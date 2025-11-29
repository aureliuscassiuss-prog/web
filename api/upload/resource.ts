import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from '../../lib/mongodb.js';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import { IncomingForm } from 'formidable';
import { promises as fs } from 'fs';

// Disable Vercel body parser for this route
export const config = {
    api: {
        bodyParser: false,
    },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    if (!process.env.JWT_SECRET) {
        return res.status(500).json({ message: 'Server misconfiguration' });
    }

    try {
        // Parse form data with file
        const form = new IncomingForm({
            maxFileSize: 50 * 1024 * 1024, // 50MB
            keepExtensions: true,
        });

        const [fields, files] = await new Promise<[any, any]>((resolve, reject) => {
            form.parse(req as any, (err, fields, files) => {
                if (err) {
                    console.error('Formidable parse error:', err);
                    reject(err);
                    return;
                }
                resolve([fields, files]);
            });
        });

        console.log('Parsed fields:', fields);
        console.log('Parsed files:', files);

        // Get token from header
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET) as { userId: string; name: string };

        // Extract fields (they come as arrays from formidable)
        const title = Array.isArray(fields.title) ? fields.title[0] : fields.title;
        const description = Array.isArray(fields.description) ? fields.description[0] : fields.description;
        const course = Array.isArray(fields.course) ? fields.course[0] : fields.course;
        const branch = Array.isArray(fields.branch) ? fields.branch[0] : fields.branch;
        const year = Array.isArray(fields.year) ? fields.year[0] : fields.year;
        const subject = Array.isArray(fields.subject) ? fields.subject[0] : fields.subject;
        const resourceType = Array.isArray(fields.resourceType) ? fields.resourceType[0] : fields.resourceType;
        const yearNum = Array.isArray(fields.yearNum) ? fields.yearNum[0] : fields.yearNum;

        // Validate required fields
        if (!title || !branch || !subject || !resourceType) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Handle file upload
        const file = Array.isArray(files.file) ? files.file[0] : files.file;
        if (!file) {
            return res.status(400).json({ message: 'No file provided' });
        }

        // Validate file type
        const allowedMimeTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation'
        ];

        if (!file.mimetype || !allowedMimeTypes.includes(file.mimetype)) {
            return res.status(400).json({ message: 'Invalid file type' });
        }

        // Validate file size (50MB)
        if (file.size > 50 * 1024 * 1024) {
            return res.status(400).json({ message: 'File too large' });
        }

        // Store file info
        const fileData = {
            originalName: file.originalFilename || 'file',
            size: file.size,
            mimetype: file.mimetype,
        };

        const db = await getDb();

        // Create resource document
        const resource = {
            title,
            description: description || '',
            course: course || 'B.Tech',
            branch,
            year: yearNum ? parseInt(yearNum as string) : (year ? parseInt(year as string) : 1),
            subject,
            resourceType,
            file: fileData,
            status: 'approved',
            uploader: decoded.name || 'Anonymous',
            uploaderId: decoded.userId,
            downloads: 0,
            rating: 0,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        console.log('Creating resource:', resource);

        // Insert resource
        const result = await db.collection('resources').insertOne(resource);

        console.log('Resource created:', result.insertedId);

        // Update user's reputation
        await db.collection('users').updateOne(
            { _id: new ObjectId(decoded.userId) },
            {
                $inc: { reputation: 10 },
                $push: { uploads: result.insertedId } as any
            }
        );

        // Clean up temporary file
        if (file.filepath) {
            await fs.unlink(file.filepath).catch(console.error);
        }

        res.status(201).json({
            message: 'Resource uploaded successfully',
            resourceId: result.insertedId,
            resource: {
                ...resource,
                _id: result.insertedId
            }
        });
    } catch (error) {
        console.error('Upload error:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);

        if (errorMessage.includes('jwt') || errorMessage.includes('token')) {
            return res.status(401).json({ message: 'Invalid or expired token' });
        }

        return res.status(500).json({ message: 'Server error', error: errorMessage });
    }
}
