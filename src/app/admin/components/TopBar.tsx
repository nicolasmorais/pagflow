'use client'

import React, { useEffect, useState } from 'react'
import { getTodayRevenue } from '@/app/actions'
import { DollarSign, ShoppingCart, TrendingUp } from 'lucide-react'

export default function TopBar({ onToggleSidebar }: { onToggleSidebar?: () => void }) {
    const [todayStr, setTodayStr] = useState('')
    const [data, setData] = useState<{ revenue: number; orders: number } | null>(null)

    useEffect(() => {
        const d = new Date()
        const formatted = new Intl.DateTimeFormat('pt-BR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
        }).format(d)
        setTodayStr(formatted)

        getTodayRevenue().then(res => setData(res))
    }, [])

    if (!todayStr) return null

    const revenue = data?.revenue || 0
    const orders = data?.orders || 0
    const avg = orders > 0 ? revenue / orders : 0

    return (
        <div className="topbar-container" style={{
            padding: '16px 32px',
            background: '#fff',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 90,
            gap: '16px',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
                <div style={{ minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Hoje</p>
                    <p style={{ margin: 0, fontSize: '14px', color: '#0f172a', fontWeight: 700, textTransform: 'capitalize' }}>{todayStr}</p>
                </div>
            </div>

            <div className="topbar-stats" style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <DollarSign size={16} color="#16a34a" strokeWidth={2.5} />
                    </div>
                    <div>
                        <p style={{ margin: 0, fontSize: '10px', color: '#94a3b8', fontWeight: 600 }}>Vendas Hoje</p>
                        <p style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(revenue)}
                        </p>
                    </div>
                </div>

                <div style={{ width: '1px', height: '28px', background: '#f1f5f9' }} />

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ShoppingCart size={16} color="#3b82f6" strokeWidth={2.5} />
                    </div>
                    <div>
                        <p style={{ margin: 0, fontSize: '10px', color: '#94a3b8', fontWeight: 600 }}>Pedidos Pagos</p>
                        <p style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>{orders}</p>
                    </div>
                </div>

                <div style={{ width: '1px', height: '28px', background: '#f1f5f9' }} />

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#faf5ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <TrendingUp size={16} color="#8b5cf6" strokeWidth={2.5} />
                    </div>
                    <div>
                        <p style={{ margin: 0, fontSize: '10px', color: '#94a3b8', fontWeight: 600 }}>Ticket Médio</p>
                        <p style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(avg)}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
