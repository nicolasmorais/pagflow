import webpush from 'web-push';
import { prisma } from './prisma';

// Configure Web Push with VAPID keys
// Need to handle cases where keys might be undefined during build
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
    if (!publicKey || !privateKey) {
        console.warn('Push VAPID keys not configured. Skipping push notification.');
        return;
    }

    try {
        const subscriptions = await prisma.pushSubscription.findMany();
        if (subscriptions.length === 0) return;

        const payload = JSON.stringify({ title, body, url });

        const promises = subscriptions.map(async (sub) => {
            // Check if it's a native token
            if (sub.auth === 'capacitor' || sub.p256dh.startsWith('native-')) {
                // Native Push (Future FCM implementation)
                // console.log('Sending native push to:', sub.endpoint);
                return;
            }

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
                    console.error('Error sending push to endpoint:', sub.endpoint, error);
                }
            }
        });

        await Promise.all(promises);
    } catch (err) {
        console.error('Failed to broadcast admin push notification:', err);
    }
}
