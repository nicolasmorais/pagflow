'use client'

import { Phone, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import PaymentStatusSelect from './PaymentStatusSelect'
import OrderStatusSelect from './OrderStatusSelect'
import DeleteOrderButton from './DeleteOrderButton'
import R2CheckButton from './R2CheckButton'

const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const methodLabel = (m: string) => m === 'pix' ? 'PIX' : m === 'pix_automatico' ? 'PIX Parcelado' : 'Cartão'

export default function OrderRow({ order }: { order: any }) {
    const time = new Date(order.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })
    return (
        <tr className="orders-row">
            <td className="orders-time">{time}</td>
            <td>
                <Link href={`/admin/pedidos/${order.id}`} className="orders-name">
                    {order.fullName || 'Sem nome'}
                </Link>
                <span className="orders-sub" title={order.email}>{order.email}</span>
            </td>
            <td>
                <span className="orders-product" title={order.product?.name}>{order.product?.name || 'Produto'}</span>
                <span className="orders-sub">{methodLabel(order.paymentMethod)}{order.installments > 1 ? ` · ${order.installments}x` : ''}</span>
            </td>
            <td className="num orders-value">R$ {fmt(order.totalPrice || 0)}</td>
            <td>
                <PaymentStatusSelect orderId={order.id} initialStatus={order.paymentStatus || 'processando'} />
            </td>
            <td>
                <OrderStatusSelect orderId={order.id} initialStatus={order.status || 'pendente'} />
            </td>
            <td>
                <div className="orders-actions">
                    <a
                        href={`https://wa.me/${(order.phone || '').replace(/\D/g, '')}`}
                        target="_blank" rel="noreferrer"
                        className="orders-icon-btn is-whatsapp"
                        title="Abrir WhatsApp"
                        aria-label={`WhatsApp de ${order.fullName || 'cliente'}`}
                    >
                        <Phone size={14} aria-hidden />
                    </a>
                    <Link href={`/admin/pedidos/${order.id}`} className="orders-icon-btn" title="Ver detalhes" aria-label="Ver detalhes do pedido">
                        <ExternalLink size={14} aria-hidden />
                    </Link>
                    <R2CheckButton orderId={order.id} />
                    <DeleteOrderButton orderId={order.id} />
                </div>
            </td>
        </tr>
    )
}
