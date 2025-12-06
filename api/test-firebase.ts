import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getApps, initializeApp, cert, getApp } from 'firebase-admin/app';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        if (!getApps().length) {
            // Re-init logic similar to lib/firebase-admin.ts to test it here
            initializeApp({
                credential: cert({
                    projectId: process.env.FIREBASE_PROJECT_ID,
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                    privateKey: process.env.FIREBASE_PRIVATE_KEY
                        ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
                        : undefined,
                }),
            });
        }

        const appName = getApp().name;
        // Try a dummy verify (will fail but verifies SDK is loaded)
        // or just return config check
        const configCheck = {
            projectId: process.env.FIREBASE_PROJECT_ID,
            email: process.env.FIREBASE_CLIENT_EMAIL,
            hasKey: !!process.env.FIREBASE_PRIVATE_KEY,
            keyLength: process.env.FIREBASE_PRIVATE_KEY?.length,
            appName
        };

        return res.status(200).json({ status: 'Firebase Admin OK', config: configCheck });
    } catch (error: any) {
        return res.status(500).json({ status: 'Error', error: error.message, stack: error.stack });
    }
}
