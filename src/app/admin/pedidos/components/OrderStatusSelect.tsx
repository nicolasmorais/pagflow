'use client'

import React from 'react'
import { updateOrderStatus } from '../../../actions'

interface OrderStatusSelectProps {
    orderId: string
    initialStatus: string
}

export default function OrderStatusSelect({ orderId, initialStatus }: OrderStatusSelectProps) {
    const [status, setStatus] = React.useState(initialStatus)

    const getStatusColors = (currentStatus: string) => {
        const s = currentStatus?.toLowerCase();
        switch (s) {
            case 'entregue': return { color: '#059669', bg: '#ECFDF5' };
            case 'enviado': return { color: '#2563EB', bg: '#EFF6FF' };
            case 'cancelado': return { color: '#DC2626', bg: '#FEF2F2' };
            case 'aguardando_envio': return { color: '#D97706', bg: '#FFFBEB' };
            case 'pendente': return { color: '#64748B', bg: '#F1F5F9' };
            case 'processando': return { color: '#7C3AED', bg: '#F5F3FF' };
            default: return { color: '#64748B', bg: '#F1F5F9' };
        }
    }

    const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newStatus = e.target.value
        setStatus(newStatus)
        try {
            await updateOrderStatus(orderId, newStatus)
        } catch (error) {
            console.error('Failed to update order status:', error)
            setStatus(initialStatus)
        }
    }

    const colors = getStatusColors(status);

    return (
        <select
            value={status}
            onChange={handleChange}
            style={{
                fontSize: '11px',
                fontWeight: 700,
                color: colors.color,
                background: colors.bg,
                padding: '6px 12px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                outline: 'none',
                width: '100%',
                maxWidth: '150px',
                textTransform: 'uppercase',
                letterSpacing: '0.02em',
                appearance: 'none',
                textAlign: 'center'
            }}
        >
            <option value="pendente">PENDENTE</option>
            <option value="processando">PROCESSANDO</option>
            <option value="aguardando_envio">AGUARDANDO ENVIO</option>
            <option value="enviado">ENVIADO</option>
            <option value="entregue">ENTREGUE</option>
            <option value="cancelado">CANCELADO</option>
        </select>
    )
}
