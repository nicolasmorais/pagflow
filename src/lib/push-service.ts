import webpush from 'web-push';
import { prisma } from './prisma';
import { messaging } from './firebase-admin';

// Configure Web Push with VAPID keys
const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const privateKey = process.env.VAPID_PRIVATE_KEY || '';

if (publicKey && privateKey) {
    webpush.setVapidDetails(
        process.env.VAPID_SUBJECT || 'mailto:admin@pagflow.com',
        publicKey,
        privateKey
    );
}

export async function sendAdminPush(title: string, body: string, url: string = '/admin') {
    const webPushEnabled = !!(publicKey && privateKey);
    const nativePushEnabled = !!messaging;

    if (!webPushEnabled && !nativePushEnabled) {
        console.warn('[Push] Neither Web Push nor Firebase configured. Skipping.');
        return { success: false, error: 'Push não configurado no servidor (Verifique as chaves Firebase/VAPID)' };
    }

    try {
        const subscriptions = await prisma.pushSubscription.findMany();
        console.log(`[Push] Found ${subscriptions.length} subscriptions in DB.`);

        if (subscriptions.length === 0) {
            return { success: false, error: 'Nenhum dispositivo registrado. Abra o app ou site primeiro.' };
        }

        const payload = JSON.stringify({ title, body, url });

        const promises = subscriptions.map(async (sub) => {
            // 1. Check if it's a native token for FCM
            if (nativePushEnabled && (sub.auth === 'capacitor' || sub.p256dh.startsWith('native-'))) {
                console.log(`[Push] Sending native FCM to: ${sub.endpoint.slice(0, 15)}...`);
                try {
                    const result = await messaging!.send({
                        token: sub.endpoint,
                        notification: { title, body },
                        data: { url },
                        android: {
                            priority: 'high',
                            notification: {
                                sound: 'default',
                                clickAction: 'FCM_PLUGIN_ACTIVITY',
                                channelId: 'default'
                            }
                        },
                        apns: { payload: { aps: { sound: 'default', badge: 1 } } }
                    });
                    console.log(`[Push] Native FCM Success: ${result}`);
                } catch (error: any) {
                    if (error.code === 'messaging/registration-token-not-registered') {
                        console.warn(`[Push] Token stale, deleting: ${sub.id}`);
                        await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => { });
                    } else {
                        console.error('[Push] FCM Native Push Error:', error);
                    }
                }
                return;
            }

            // 2. Web Push (Standard)
            if (webPushEnabled && sub.auth !== 'capacitor') {
                try {
                    await webpush.sendNotification(
                        {
                            endpoint: sub.endpoint,
                            keys: {
                                p256dh: sub.p256dh,
                                auth: sub.auth,
                            },
                        },
                        payload
                    );
                } catch (error: any) {
                    if (error.statusCode === 410 || error.statusCode === 404) {
                        await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => { });
                    } else {
                        console.error('Web Push Error:', error);
                    }
                }
            }
        });

        await Promise.all(promises);
    } catch (err) {
        console.error('Failed to broadcast admin push notification:', err);
    }
}
