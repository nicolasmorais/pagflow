'use client'

import React from 'react'
import { Menu, User, Bell } from 'lucide-react'
import NotificationCenter from './NotificationCenter'

export default function TopBar() {
    return (
        <header style={{
            height: '70px',
            background: 'white',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            padding: '0 40px',
            position: 'sticky',
            top: 0,
            zIndex: 90,
            transition: 'all 0.3s ease'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <NotificationCenter />

                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '6px 12px',
                    borderRadius: '15px',
                    border: '1px solid #e2e8f0',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    marginLeft: '8px'
                }}>
                    <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '10px',
                        background: '#eff6ff',
                        color: '#3b82f6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '0.75rem'
                    }}>
                        AD
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b' }}>Admin</span>
                        <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#10b981' }}>Pro Plan</span>
                    </div>
                </div>
            </div>
        </header>
    )
}
