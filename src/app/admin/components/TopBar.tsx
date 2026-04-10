'use client'

import React from 'react'
import { Menu, User, Bell } from 'lucide-react'
import NotificationCenter from './NotificationCenter'

export default function TopBar() {
    return (
        <header style={{
            height: '80px',
            background: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderBottom: '1px solid var(--admin-sidebar-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            padding: '0 32px',
            position: 'sticky',
            top: 0,
            zIndex: 90,
            fontFamily: '"Nunito", sans-serif'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <NotificationCenter />

                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '8px 16px',
                    borderRadius: '16px',
                    border: '1px solid var(--admin-sidebar-border)',
                    background: '#fff',
                    cursor: 'pointer',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)'
                }}>
                    <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '10px',
                        background: 'var(--admin-accent-light)',
                        color: 'var(--admin-accent)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 900,
                        fontSize: '0.75rem'
                    }}>
                        AD
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--admin-text-primary)' }}>Admin</span>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--admin-accent)' }}>Premium Plan</span>
                    </div>
                </div>
            </div>
        </header>
    )
}
