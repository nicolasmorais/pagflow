'use client'

import React, { useEffect, useState } from 'react'
import { getTotalRevenue } from '@/app/actions'

export default function TopBar() {
    const [todayStr, setTodayStr] = useState('')
    const [revenue, setRevenue] = useState(0)

    useEffect(() => {
        // Run on client side to avoid hydration mismatch
        const d = new Date()
        const formatted = new Intl.DateTimeFormat('pt-BR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        }).format(d)
        setTodayStr(formatted)

        // Fetch paid revenue
        getTotalRevenue().then(res => setRevenue(res || 0))
    }, [])

    if (!todayStr) return null

    const GOAL = 10000;
    const progress = Math.min((revenue / GOAL) * 100, 100);

    return (
        <div style={{
            padding: '22px 32px',
            background: '#fff',
            borderBottom: '1px solid var(--admin-sidebar-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 90
        }}>
            <span style={{ fontSize: '15px', color: '#94a3b8', fontWeight: 500 }}>
                Olá, <strong style={{ color: '#0f172a', fontWeight: 700 }}>Nicolas Morais braga!</strong> Hoje é {todayStr}
            </span>

            {/* Revenue Progress Bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <span style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(revenue)}
                    </span>
                </div>

                <div style={{
                    width: '180px',
                    height: '10px',
                    background: '#f1f5f9',
                    borderRadius: '5px',
                    overflow: 'hidden',
                    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)'
                }}>
                    <div style={{
                        height: '100%',
                        width: `${progress}%`,
                        background: 'linear-gradient(90deg, #3b82f6, #10b981)',
                        borderRadius: '5px',
                        transition: 'width 1s ease-in-out'
                    }} />
                </div>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#10b981' }}>
                    10k
                </span>
            </div>

        </div>
    )
}

