
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { MongoClient } from 'mongodb';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Set headers to allow viewing in browser easily
    res.setHeader('Content-Type', 'application/json');

    const results: any = {
        timestamp: new Date().toISOString(),
        env: {
            hasMongoUri: !!process.env.MONGODB_URI,
            nodeVersion: process.version
        },
        steps: []
    };

    function log(step: string, data?: any) {
        console.error(`[HEALTH] ${step}`, data || '');
        results.steps.push({ step, data, time: new Date().toISOString() });
    }

    try {
        log('Starting Health Check');

        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI is missing');
        }

        const uri = process.env.MONGODB_URI;
        // Mask URI for safety
        const maskedUri = uri.replace(/(:[^:@]+@)/, ':****@');
        log('URI configured', maskedUri);

        log('Initializing MongoClient');
        const client = new MongoClient(uri, {
            serverSelectionTimeoutMS: 5000, // Fail fast (5s)
            connectTimeoutMS: 5000,
            socketTimeoutMS: 5000,
        });

        log('Attempting connection...');
        await client.connect();
        log('Connected successfully');

        const db = client.db();
        log('Pinging database...');
        const ping = await db.command({ ping: 1 });
        log('Ping successful', ping);

        log('Checking users collection...');
        const count = await db.collection('users').estimatedDocumentCount();
        results.userCount = count;
        log(`Found ${count} users`);

        await client.close();
        log('Connection closed');

        return res.status(200).json({
            status: 'ok',
            message: 'Database connection healthy',
            details: results
        });

    } catch (error: any) {
        log('ERROR', {
            name: error.name,
            message: error.message,
            code: error.code,
            codeName: error.codeName
        });

        return res.status(500).json({
            status: 'error',
            message: 'Database connection failed',
            error: {
                name: error.name,
                message: error.message,
                cause: 'Most likely IP Whitelist issue if message is "Server selection timed out"'
            },
            details: results
        });
    }
}
