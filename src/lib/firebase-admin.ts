import * as admin from 'firebase-admin';

if (!admin.apps.length) {
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (privateKey) {
        // Step 1: Basic cleaning
        let key = privateKey.trim();
        if (key.startsWith('"') && key.endsWith('"')) {
            key = key.substring(1, key.length - 1);
        }

        // Step 2: Fix escaped newlines (very common in Docker/CI)
        key = key.replace(/\\n/g, '\n').replace(/\\r/g, '');

        // Step 3: Check if PEM structure is valid. If it's one giant line, reformat it.
        // Some environments strip newlines but keep the header/footer.
        if (key.includes('BEGIN PRIVATE KEY') && !key.includes('\n', 30)) {
            const body = key
                .replace(/-----BEGIN PRIVATE KEY-----/, '')
                .replace(/-----END PRIVATE KEY-----/, '')
                .replace(/\s/g, '');

            // Reconstruct properly formatted PEM
            key = `-----BEGIN PRIVATE KEY-----\n${body}\n-----END PRIVATE KEY-----\n`;
        }

        privateKey = key;
        console.log(`[Firebase] Key normalization applied. Original length: ${privateKey.length}`);
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
