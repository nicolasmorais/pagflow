import * as admin from 'firebase-admin';

if (!admin.apps.length) {
    try {
        // PRIMARY: Use full service account JSON (most reliable way, no key parsing issues)
        const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

        if (serviceAccountJson) {
            const serviceAccount = JSON.parse(serviceAccountJson);
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
            });
            console.log('[Firebase] Admin initialized via SERVICE_ACCOUNT_JSON ✅');
        } else {
            console.warn('[Firebase] FIREBASE_SERVICE_ACCOUNT_JSON not set. Native push disabled.');
        }
    } catch (error) {
        console.error('[Firebase] Admin initialization failed:', error);
    }
}

export const messaging = admin.apps.length ? admin.messaging() : null;
