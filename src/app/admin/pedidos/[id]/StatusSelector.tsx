'use client'

import { useState } from 'react'
import { updateOrderStatus, updatePaymentStatus } from '@/app/actions'
import { ChevronDown } from 'lucide-react'

const ORDER_STATUSES = [
    { value: 'pendente', label: 'Pendente' },
    { value: 'pago', label: 'Pago' },
    { value: 'enviado', label: 'Enviado' },
    { value: 'entregue', label: 'Entregue' },
    { value: 'cancelado', label: 'Cancelado' },
]

const PAYMENT_STATUSES = [
    { value: 'processando', label: 'Aguardando' },
    { value: 'pago', label: 'Pago' },
    { value: 'recusado', label: 'Recusado' },
    { value: 'reembolsado', label: 'Reembolsado' },
    { value: 'cancelado', label: 'Cancelado' },
]

const STATUS_COLORS: Record<string, { bg: string; color: string; border: string }> = {
    pendente: { bg: '#FEF3C7', color: '#92400E', border: '#FDE68A' },
    pago: { bg: '#E3F4EA', color: '#1E7A52', border: '#C3E8D4' },
    enviado: { bg: '#E7F1F8', color: '#2C5C86', border: '#C5DDEF' },
    entregue: { bg: '#E3F4EA', color: '#1E7A52', border: '#C3E8D4' },
    cancelado: { bg: '#FBEAE8', color: '#B23B32', border: '#F5CDC9' },
    processando: { bg: '#FEF3C7', color: '#92400E', border: '#FDE68A' },
    recusado: { bg: '#FBEAE8', color: '#B23B32', border: '#F5CDC9' },
    reembolsado: { bg: '#E7F1F8', color: '#2C5C86', border: '#C5DDEF' },
    aguardando: { bg: '#FEF3C7', color: '#92400E', border: '#FDE68A' },
}

function getStyle(status: string) {
    return STATUS_COLORS[status?.toLowerCase()] || STATUS_COLORS.pendente
}

export default function StatusSelector({ orderId, currentStatus, currentPaymentStatus }: {
    orderId: string
    currentStatus: string
    currentPaymentStatus: string
}) {
    const [orderStatus, setOrderStatus] = useState(currentStatus || 'pendente')
    const [paymentStatus, setPaymentStatus] = useState(currentPaymentStatus || 'processando')
    const [saving, setSaving] = useState(false)

    const handleOrderChange = async (val: string) => {
        setSaving(true)
        setOrderStatus(val)
        await updateOrderStatus(orderId, val)
        setSaving(false)
    }

    const handlePaymentChange = async (val: string) => {
        setSaving(true)
        setPaymentStatus(val)
        await updatePaymentStatus(orderId, val)
        setSaving(false)
    }

    const os = getStyle(orderStatus)
    const ps = getStyle(paymentStatus)

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Status do Pedido */}
            <div>
                <div style={{ fontSize: '10.5px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#6E7180', marginBottom: '6px' }}>
                    Status do pedido
                </div>
                <div style={{ position: 'relative' }}>
                    <select
                        value={orderStatus}
                        onChange={e => handleOrderChange(e.target.value)}
                        disabled={saving}
                        style={{
                            width: '100%', padding: '10px 36px 10px 14px',
                            borderRadius: '9px', border: '1px solid ' + os.border,
                            background: os.bg, color: os.color,
                            fontSize: '13px', fontWeight: 700,
                            appearance: 'none', cursor: 'pointer',
                            fontFamily: 'inherit', outline: 'none',
                        }}
                    >
                        {ORDER_STATUSES.map(s => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                    </select>
                    <ChevronDown size={14} color={os.color} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                </div>
            </div>

            {/* Status do Pagamento */}
            <div>
                <div style={{ fontSize: '10.5px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#6E7180', marginBottom: '6px' }}>
                    Status do pagamento
                </div>
                <div style={{ position: 'relative' }}>
                    <select
                        value={paymentStatus}
                        onChange={e => handlePaymentChange(e.target.value)}
                        disabled={saving}
                        style={{
                            width: '100%', padding: '10px 36px 10px 14px',
                            borderRadius: '9px', border: '1px solid ' + ps.border,
                            background: ps.bg, color: ps.color,
                            fontSize: '13px', fontWeight: 700,
                            appearance: 'none', cursor: 'pointer',
                            fontFamily: 'inherit', outline: 'none',
                        }}
                    >
                        {PAYMENT_STATUSES.map(s => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                    </select>
                    <ChevronDown size={14} color={ps.color} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                </div>
            </div>

            {saving && (
                <div style={{ fontSize: '11px', color: '#6E7180', fontWeight: 500 }}>Salvando...</div>
            )}
        </div>
    )
}
