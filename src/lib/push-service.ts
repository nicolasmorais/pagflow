import { prisma } from './prisma';
import { messaging } from './firebase-admin';

export async function sendAdminPush(title: string, body: string, url: string = '/admin') {
    if (!messaging) {
        console.warn('[Push] Firebase Cloud Messaging not configured. Skipping.');
        return { success: false, error: 'Push nativo não configurado (Verifique chaves Firebase)' };
    }

    try {
        const subscriptions = await prisma.pushSubscription.findMany();
        console.log(`[Push] Found ${subscriptions.length} subscriptions in DB.`);

        if (subscriptions.length === 0) {
            return { success: false, error: 'Nenhum dispositivo registrado. Abra o app primeiro.' };
        }

        const promises = subscriptions.map(async (sub) => {
            const isNative = sub.auth === 'capacitor' || sub.p256dh.startsWith('native-');

            // Apenas enviamos se for um token nativo (FCM)
            if (isNative) {
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
                    if (error.code === 'messaging/registration-token-not-registered' || error.code === 'messaging/invalid-argument') {
                        console.warn(`[Push] Token invalid or stale, deleting: ${sub.id}`);
                        await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => { });
                    } else {
                        console.error('[Push] FCM Native Push Error:', error);
                    }
                }
            } else {
                // Caso ainda exista alguma assinatura web antiga no banco, ignoramos
                console.log(`[Push] Skipping non-native subscription: ${sub.id}`);
            }
        });

        await Promise.all(promises);
    } catch (err) {
        console.error('Failed to broadcast admin push notification:', err);
    }
}

