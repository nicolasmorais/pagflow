'use client'

import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';

export default function CapacitorInit() {
    useEffect(() => {
        if (Capacitor.isNativePlatform()) {
            registerPush();
        }
    }, []);

    const registerPush = () => {
        PushNotifications.checkPermissions().then((res) => {
            if (res.receive !== 'granted') {
                PushNotifications.requestPermissions().then((res) => {
                    if (res.receive === 'granted') {
                        PushNotifications.register();
                    }
                });
            } else {
                PushNotifications.register();
            }
        });

        PushNotifications.addListener('registration', (token) => {
            console.log('Push registration success, token: ' + token.value);
            // Aqui você enviaria o token para o seu backend para salvar
            fetch('/api/push/register-native', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: token.value, platform: Capacitor.getPlatform() })
            }).catch(err => console.error('Error saving native token:', err));
        });

        PushNotifications.addListener('registrationError', (error) => {
            console.error('Error on registration: ' + JSON.stringify(error));
        });

        PushNotifications.addListener('pushNotificationReceived', (notification) => {
            console.log('Push received: ' + JSON.stringify(notification));
        });

        PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
            console.log('Push action performed: ' + JSON.stringify(notification));
            if (notification.notification.data.url) {
                window.location.href = notification.notification.data.url;
            }
        });
    };

    return null;
}
