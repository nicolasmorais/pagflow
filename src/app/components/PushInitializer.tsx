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

async function registerWebPush() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return;

        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!vapidPublicKey) return;

        let subscription = await registration.pushManager.getSubscription();
        if (!subscription) {
            subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
            });
        }

        if (subscription) {
            await fetch('/api/push/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(subscription)
            }).catch(err => console.error("Erro ao salvar inscrição web push:", err));
        }
    } catch (e) {
        console.error('Web Push registration error:', e);
    }
}

async function registerNativePush() {
    try {
        // Dynamically import Capacitor modules (safe for web too)
        const { Capacitor } = await import('@capacitor/core');
        if (!Capacitor.isNativePlatform()) return; // Skip on web

        console.log('[PushInit] Native platform detected:', Capacitor.getPlatform());
        const { PushNotifications } = await import('@capacitor/push-notifications');

        // Create notification channel for Android
        if (Capacitor.getPlatform() === 'android') {
            await PushNotifications.createChannel({
                id: 'default',
                name: 'Notificações PagFlow',
                description: 'Notificações de vendas e pedidos',
                importance: 5,
                visibility: 1,
                sound: 'default',
                vibration: true,
            });
        }

        // Check & request permission
        let { receive } = await PushNotifications.checkPermissions();
        if (receive !== 'granted') {
            const result = await PushNotifications.requestPermissions();
            receive = result.receive;
        }

        if (receive !== 'granted') {
            console.warn('[PushInit] Push permission denied');
            return;
        }

        // Register listeners BEFORE calling register()
        PushNotifications.addListener('registration', async (token) => {
            console.log('[PushInit] FCM Token received:', token.value.slice(0, 20) + '...');
            try {
                const res = await fetch('/api/push/register-native', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token: token.value, platform: Capacitor.getPlatform() })
                });
                const data = await res.json();
                console.log('[PushInit] Token registration result:', data);
            } catch (err) {
                console.error('[PushInit] Error saving FCM token:', err);
            }
        });

        PushNotifications.addListener('registrationError', (error) => {
            console.error('[PushInit] FCM registration error:', JSON.stringify(error));
        });

        PushNotifications.addListener('pushNotificationReceived', (notification) => {
            console.log('[PushInit] Push received (foreground):', notification.title);
        });

        PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
            const url = action.notification.data?.url;
            if (url) window.location.href = url;
        });

        // Trigger FCM token generation
        await PushNotifications.register();
        console.log('[PushInit] PushNotifications.register() called');

    } catch (e) {
        console.error('[PushInit] Native push setup error:', e);
    }
}

export default function PushInitializer() {
    useEffect(() => {
        registerNativePush();  // Try native first (Capacitor)
        registerWebPush();     // Web push for browsers
    }, []);

    return null;
}
