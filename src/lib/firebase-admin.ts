import * as admin from 'firebase-admin';

if (!admin.apps.length) {
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (privateKey) {
        // Fix for environment variables with quotes or literal \n
        privateKey = privateKey.trim();
        if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
            privateKey = privateKey.substring(1, privateKey.length - 1);
        }

        // Handle double-escaped newlines or literal \n
        privateKey = privateKey.replace(/\\n/g, '\n').replace(/\\r/g, '\r');

        console.log(`[Firebase] Key Length: ${privateKey.length}, Starts with: ${privateKey.substring(0, 20)}..., Ends with: ...${privateKey.substring(privateKey.length - 20)}`);
    }

    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

    if (projectId && clientEmail && privateKey && privateKey.includes('BEGIN PRIVATE KEY')) {
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
            console.error('Firebase Admin initialization error! Key status:', {
                hasProjectId: !!projectId,
                hasClientEmail: !!clientEmail,
                keyLength: privateKey?.length,
                keyValidHeader: privateKey?.includes('-----BEGIN PRIVATE KEY-----'),
                keyValidFooter: privateKey?.includes('-----END PRIVATE KEY-----')
            });
            console.error(error);
        }
    } else {
        if (process.env.NODE_ENV !== 'production' || process.env.NEXT_PHASE !== 'phase-production-build') {
            console.warn('Firebase Admin skipped: missing or invalid credentials');
        }
    }
}

export const messaging = admin.apps.length ? admin.messaging() : null;
