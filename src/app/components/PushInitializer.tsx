'use client'

import React, { useEffect } from 'react'

export default function PushInitializer() {
    useEffect(() => {
        if ('serviceWorker' in navigator && 'Notification' in window) {
            // Register service worker
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('SW Registered:', registration)
                })
                .catch(err => {
                    console.error('SW Registration failed:', err)
                })

            // Request initial permission if not granted
            if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
                Notification.requestPermission().then(permission => {
                    if (permission === 'granted') {
                        console.log('Notificações autorizadas!')
                    }
                })
            }
        }
    }, [])

    return null
}
