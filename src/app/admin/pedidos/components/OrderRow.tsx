'use client'

import { Phone, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import PaymentStatusSelect from './PaymentStatusSelect'
import OrderStatusSelect from './OrderStatusSelect'
import DeleteOrderButton from './DeleteOrderButton'
import R2CheckButton from './R2CheckButton'

const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default function OrderRow({ order }: { order: any }) {
    const date = new Date(order.createdAt)
    return (
        <tr style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#fafbfc')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
            <td style={{ padding: '14px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        width: '36px', height: '36px', borderRadius: '10px',
                        background: '#f1f5f9', color: '#475569',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '13px', fontWeight: 800, flexShrink: 0,
                    }}>
                        {order.fullName?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div style={{ minWidth: 0 }}>
                        <Link
                            href={`/admin/pedidos/${order.id}`}
                            style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', textDecoration: 'none', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '160px' }}
                        >
                            {order.fullName || 'Sem nome'}
                        </Link>
                        <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '160px' }}>{order.email}</p>
                    </div>
                </div>
            </td>
            <td style={{ padding: '14px 20px' }}>
                <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{order.product?.name || 'Produto'}</p>
                <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>{order.paymentMethod === 'pix' ? 'PIX' : 'Cartão'}</p>
            </td>
            <td style={{ padding: '14px 20px' }}>
                <span style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', fontFamily: "'Space Grotesk', sans-serif" }}>R$ {fmt(order.totalPrice || 0)}</span>
            </td>
            <td style={{ padding: '14px 20px' }}>
                <PaymentStatusSelect orderId={order.id} initialStatus={order.paymentStatus || 'processando'} />
            </td>
            <td style={{ padding: '14px 20px' }}>
                <OrderStatusSelect orderId={order.id} initialStatus={order.status || 'pendente'} />
            </td>
            <td style={{ padding: '14px 20px' }}>
                <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</p>
                <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>{date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
            </td>
            <td style={{ padding: '14px 20px' }}>
                <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                    <a
                        href={`https://wa.me/${(order.phone || '').replace(/\D/g, '')}`}
                        target="_blank" rel="noreferrer"
                        style={{
                            width: '32px', height: '32px', borderRadius: '10px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: '#f0fdf4', color: '#16a34a', textDecoration: 'none',
                            border: '1px solid #dcfce7',
                        }}
                        title="WhatsApp"
                    >
                        <Phone size={14} />
                    </a>
                    <Link
                        href={`/admin/pedidos/${order.id}`}
                        style={{
                            width: '32px', height: '32px', borderRadius: '10px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: '#f1f5f9', color: '#64748b', textDecoration: 'none',
                            border: '1px solid #e2e8f0',
                        }}
                        title="Ver detalhes"
                    >
                        <ExternalLink size={14} />
                    </Link>
                    <R2CheckButton orderId={order.id} />
                    <DeleteOrderButton orderId={order.id} />
                </div>
            </td>
        </tr>
    )
}
