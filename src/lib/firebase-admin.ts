import * as admin from 'firebase-admin';

if (!admin.apps.length) {
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (privateKey) {
        // Step 1: Basic cleaning
        let key = privateKey.trim();
        if (key.startsWith('"') && key.endsWith('"')) {
            key = key.substring(1, key.length - 1);
        }

        // Step 2: Remove all existing whitespace/newlines and PEM headers to get the raw base64
        const rawBase64 = key
            .replace(/-----BEGIN PRIVATE KEY-----/, '')
            .replace(/-----END PRIVATE KEY-----/, '')
            .replace(/\\n/g, '')
            .replace(/\s/g, '');

        // Step 3: Reconstruct with strict PEM format (header, 64-char lines, footer)
        const lines = rawBase64.match(/.{1,64}/g) || [];
        privateKey = `-----BEGIN PRIVATE KEY-----\n${lines.join('\n')}\n-----END PRIVATE KEY-----\n`;

        console.log(`[Firebase] Key reconstructed with strict PEM format. Body segments: ${lines.length}`);
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
