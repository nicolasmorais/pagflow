'use client'

import React, { useEffect } from 'react'

// Helper function to convert base64 vapid key to Uint8Array
function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export default function PushInitializer() {
    useEffect(() => {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            navigator.serviceWorker.register('/sw.js')
                .then(async (registration) => {
                    console.log('SW Registered:', registration)

                    // Verify permission and subscribe
                    const permission = await Notification.requestPermission()
                    if (permission === 'granted') {
                        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
                        if (!vapidPublicKey) {
                            console.warn("VAPID public key não configurada.");
                            return;
                        }

                        // Check if already subscribed
                        let subscription = await registration.pushManager.getSubscription();

                        if (!subscription) {
                            try {
                                const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
                                subscription = await registration.pushManager.subscribe({
                                    userVisibleOnly: true,
                                    applicationServerKey: convertedVapidKey
                                });
                            } catch (e) {
                                console.error('Erro ao subscrever push:', e);
                            }
                        }

                        if (subscription) {
                            // Send to backend
                            await fetch('/api/push/subscribe', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(subscription)
                            }).catch(err => console.error("Erro ao salvar inscrição no server:", err));
                        }
                    }
                })
                .catch(err => {
                    console.error('SW Registration failed:', err)
                })
        }
    }, [])

    return null
}
