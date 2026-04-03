'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Bell, Package, CheckCircle2, AlertCircle, ShoppingCart } from 'lucide-react'

interface Notification {
    id: string
    title: string
    message: string
    time: string
    type: 'sale' | 'abandoned' | 'system'
    read: boolean
}

export default function NotificationCenter() {
    const [isOpen, setIsOpen] = useState(false)
    const [notifications, setNotifications] = useState<Notification[]>([
        {
            id: '1',
            title: 'Nova Venda!',
            message: 'Você recebeu um novo pedido de R$ 197,00',
            time: '2 min atrás',
            type: 'sale',
            read: false
        },
        {
            id: '2',
            title: 'Carrinho Abandonado',
            message: 'João Silva deixou o checkout',
            time: '15 min atrás',
            type: 'abandoned',
            read: false
        },
        {
            id: '3',
            title: 'Sistema',
            message: 'Seu template de rastreio foi atualizado',
            time: '1h atrás',
            type: 'system',
            read: true
        }
    ])

    const dropdownRef = useRef<HTMLDivElement>(null)
    const unreadCount = notifications.filter(n => !n.read).length

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const markAllAsRead = () => {
        setNotifications(notifications.map(n => ({ ...n, read: true })))
    }

    const getIcon = (type: string) => {
        switch (type) {
            case 'sale': return <ShoppingCart size={16} color="#10b981" />
            case 'abandoned': return <AlertCircle size={16} color="#f59e0b" />
            default: return <Package size={16} color="#3b82f6" />
        }
    }

    return (
        <div style={{ position: 'relative' }} ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    background: 'white',
                    border: '1px solid #e2e8f0',
                    padding: '10px',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                <Bell size={20} color="#64748b" />
                {unreadCount > 0 && (
                    <span style={{
                        position: 'absolute',
                        top: '-4px',
                        right: '-4px',
                        background: '#ef4444',
                        color: 'white',
                        fontSize: '10px',
                        fontWeight: 800,
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '2px solid white'
                    }}>
                        {unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="notification-dropdown">
                    <div style={{ padding: '20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#1e293b' }}>Notificações</h4>
                        <button onClick={markAllAsRead} style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>Marcar todas como lidas</button>
                    </div>

                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        {notifications.length > 0 ? (
                            notifications.map(notif => (
                                <div key={notif.id} style={{
                                    padding: '16px 20px',
                                    borderBottom: '1px solid #f1f5f9',
                                    display: 'flex',
                                    gap: '12px',
                                    background: notif.read ? 'transparent' : '#f8faff',
                                    transition: 'background 0.2s'
                                }}>
                                    <div style={{
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '10px',
                                        background: 'white',
                                        border: '1px solid #e2e8f0',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0
                                    }}>
                                        {getIcon(notif.type)}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b' }}>{notif.title}</span>
                                            <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{notif.time}</span>
                                        </div>
                                        <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b', lineHeight: '1.4' }}>{notif.message}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                                <CheckCircle2 size={32} color="#cbd5e1" style={{ marginBottom: '12px', margin: '0 auto' }} />
                                <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Nenhuma notificação por enquanto</p>
                            </div>
                        )}
                    </div>

                    <button style={{ width: '100%', padding: '14px', background: '#f8fafc', border: 'none', borderTop: '1px solid #f1f5f9', color: '#64748b', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}>
                        Ver todas as notificações
                    </button>
                </div>
            )}
            <style jsx>{`
                .notification-dropdown {
                    position: absolute;
                    bottom: 50px;
                    left: 20px;
                    width: 320px;
                    background: white;
                    border-radius: 20px;
                    box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1);
                    border: 1px solid #e2e8f0;
                    z-index: 1000;
                    overflow: hidden;
                }
                @media (max-width: 1024px) {
                    .notification-dropdown {
                        position: fixed;
                        bottom: 85px;
                        top: auto;
                        left: 50%;
                        transform: translateX(-50%);
                        width: calc(100vw - 32px);
                        right: auto;
                    }
                }
            `}</style>
        </div>
    )
}
