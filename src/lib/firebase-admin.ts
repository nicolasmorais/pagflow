import * as admin from 'firebase-admin';

if (!admin.apps.length) {
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (privateKey) {
        // Fix for environment variables with quotes or literal \n
        privateKey = privateKey.trim();
        if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
            privateKey = privateKey.substring(1, privateKey.length - 1);
        }
        // Replace both literal \n and real newlines to ensure consistency
        privateKey = privateKey.replace(/\\n/g, '\n');
    }

    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

    if (projectId && clientEmail && privateKey && privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
        try {
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId,
                    clientEmail,
                    privateKey,
                }),
            });
            console.log('Firebase Admin initialized successfully');
        } catch (error) {
            console.error('Firebase Admin initialization error (Invalid key format?):', error);
        }
    } else {
        // Do not block build if credentials are missing
        if (process.env.NODE_ENV !== 'production' || process.env.NEXT_PHASE !== 'phase-production-build') {
            const reason = !privateKey ? 'Key missing' : !privateKey.includes('BEGIN') ? 'Invalid PEM header' : 'Missing metadata';
            console.warn(`Firebase Admin skipped initialization: ${reason}`);
        }
    }
}

export const messaging = admin.apps.length ? admin.messaging() : null;
