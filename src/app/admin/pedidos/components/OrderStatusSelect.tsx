'use client'

import React from 'react'
import { updateOrderStatus } from '../../../actions'

interface OrderStatusSelectProps {
    orderId: string
    initialStatus: string
}

export default function OrderStatusSelect({ orderId, initialStatus }: OrderStatusSelectProps) {
    const [status, setStatus] = React.useState(initialStatus)

    const getStatusColor = (currentStatus: string) => {
        const s = currentStatus?.toLowerCase();
        switch (s) {
            case 'entregue': return '#10b981';
            case 'enviado': return '#3b82f6';
            case 'cancelado': return '#ef4444';
            case 'aguardando_envio': return '#f59e0b';
            case 'pendente': return '#94a3b8';
            case 'processando': return '#6366f1';
            default: return '#94a3b8';
        }
    }

    const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newStatus = e.target.value
        setStatus(newStatus)
        try {
            await updateOrderStatus(orderId, newStatus)
        } catch (error) {
            console.error('Failed to update order status:', error)
            setStatus(initialStatus) // Revert to initial on failure
        }
    }

    return (
        <select
            value={status}
            onChange={handleChange}
            style={{
                fontSize: '0.7rem',
                fontWeight: 800,
                color: getStatusColor(status),
                background: '#fff',
                padding: '4px 10px',
                borderRadius: '8px',
                border: `1.5px solid ${getStatusColor(status)}`,
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
