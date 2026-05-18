'use client'

import React, { useState, useRef, useEffect } from 'react'
import { updateOrderStatus } from '@/app/actions'
import { Package, Truck, CheckCircle2, XCircle, Clock, Loader2, ChevronDown } from 'lucide-react'

const STATUSES = [
    {
        value: 'pendente', label: 'Pendente', icon: Clock,
        color: '#475569', bg: '#f1f5f9', border: '#cbd5e1',
        dot: '#94a3b8', hoverBg: '#e2e8f0',
    },
    {
        value: 'processando', label: 'Processando', icon: Package,
        color: '#5b21b6', bg: '#ede9fe', border: '#c4b5fd',
        dot: '#8b5cf6', hoverBg: '#ddd6fe',
    },
    {
        value: 'aguardando_envio', label: 'Aguardando Envio', icon: Package,
        color: '#92400e', bg: '#fef3c7', border: '#fcd34d',
        dot: '#f59e0b', hoverBg: '#fde68a',
    },
    {
        value: 'enviado', label: 'Enviado', icon: Truck,
        color: '#1e40af', bg: '#dbeafe', border: '#93c5fd',
        dot: '#3b82f6', hoverBg: '#bfdbfe',
    },
    {
        value: 'entregue', label: 'Entregue', icon: CheckCircle2,
        color: '#065f46', bg: '#d1fae5', border: '#6ee7b7',
        dot: '#10b981', hoverBg: '#a7f3d0',
    },
    {
        value: 'cancelado', label: 'Cancelado', icon: XCircle,
        color: '#991b1b', bg: '#fee2e2', border: '#fca5a5',
        dot: '#ef4444', hoverBg: '#fecaca',
    },
]

export default function OrderStatusSelect({ orderId, initialStatus }: { orderId: string; initialStatus: string }) {
    const [status, setStatus] = useState(initialStatus)
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const ref = useRef<HTMLDivElement>(null)

    const current = STATUSES.find(s => s.value === status) || STATUSES[0]

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
        }
        document.addEventListener('mousedown', handleClick)
        return () => document.removeEventListener('mousedown', handleClick)
    }, [])

    const handleSelect = async (value: string) => {
        if (value === status || loading) return
        setOpen(false)
        setLoading(true)
        const prev = status
        setStatus(value)
        try {
            await updateOrderStatus(orderId, value)
        } catch {
            setStatus(prev)
        } finally {
            setLoading(false)
        }
    }

    const Icon = current.icon

    return (
        <div ref={ref} style={{ position: 'relative', display: 'inline-block', minWidth: '130px' }}>
            <button
                onClick={() => setOpen(!open)}
                disabled={loading}
                style={{
                    display: 'flex', alignItems: 'center', gap: '7px',
                    padding: '6px 12px', borderRadius: '20px',
                    background: current.bg,
                    border: `1.5px solid ${current.border}`,
                    cursor: loading ? 'wait' : 'pointer',
                    transition: 'all 0.15s', width: '100%',
                    opacity: loading ? 0.7 : 1,
                    boxShadow: `0 1px 3px ${current.border}40`,
                }}
            >
                {loading ? (
                    <Loader2 size={14} color={current.color} style={{ animation: 'spin 1s linear infinite' }} />
                ) : (
                    <Icon size={14} color={current.color} strokeWidth={2.5} />
                )}
                <span style={{ fontSize: '11px', fontWeight: 800, color: current.color, flex: 1, textAlign: 'left', letterSpacing: '-0.01em' }}>
                    {current.label}
                </span>
                <ChevronDown size={12} color={current.color} style={{ transform: open ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.15s', flexShrink: 0 }} />
            </button>

            {open && (
                <div style={{
                    position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 50,
                    background: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px',
                    padding: '5px', minWidth: '180px',
                    boxShadow: '0 12px 32px rgba(0,0,0,0.12)',
                    animation: 'fadeIn 0.12s ease-out',
                }}>
                    {STATUSES.map(s => {
                        const SIcon = s.icon
                        const isActive = s.value === status
                        return (
                            <button
                                key={s.value}
                                onClick={() => handleSelect(s.value)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '10px',
                                    padding: '9px 12px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                                    background: isActive ? s.bg : 'transparent',
                                    width: '100%', transition: 'all 0.12s',
                                }}
                                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = s.hoverBg }}
                                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
                            >
                                <div style={{
                                    width: '26px', height: '26px', borderRadius: '8px',
                                    background: isActive ? s.border + '60' : '#f1f5f9',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                }}>
                                    <SIcon size={14} color={isActive ? s.color : '#94a3b8'} strokeWidth={2.2} />
                                </div>
                                <span style={{ fontSize: '12px', fontWeight: isActive ? 800 : 600, color: isActive ? s.color : '#475569', flex: 1, textAlign: 'left' }}>
                                    {s.label}
                                </span>
                                {isActive && <CheckCircle2 size={15} color={s.color} strokeWidth={2.5} />}
                            </button>
                        )
                    })}
                </div>
            )}

            <style jsx>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    )
}
