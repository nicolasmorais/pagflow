'use client'

import React from 'react'
import { updatePaymentStatus } from '../../../actions'

interface PaymentStatusSelectProps {
    orderId: string
    initialStatus: string
}

export default function PaymentStatusSelect({ orderId, initialStatus }: PaymentStatusSelectProps) {
    const [status, setStatus] = React.useState(initialStatus)

    const getPaymentColor = (currentStatus: string) => {
        const s = currentStatus?.toLowerCase();
        switch (s) {
            case 'pago': return '#10b981';
            case 'recusado': return '#ef4444';
            case 'aguardando': return '#f59e0b';
            case 'reembolsado': return '#6366f1';
            case 'processando': return '#3b82f6';
            default: return '#94a3b8';
        }
    }

    const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newStatus = e.target.value
        setStatus(newStatus)
        try {
            await updatePaymentStatus(orderId, newStatus)
        } catch (error) {
            console.error('Failed to update payment status:', error)
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
                color: getPaymentColor(status),
                background: '#fff',
                padding: '4px 10px',
                borderRadius: '8px',
                border: `1.5px solid ${getPaymentColor(status)}`,
                cursor: 'pointer',
                outline: 'none',
                width: '100%',
                maxWidth: '130px',
                textTransform: 'uppercase',
                letterSpacing: '0.02em',
                appearance: 'none',
                textAlign: 'center'
            }}
        >
            <option value="processando">PROCESSANDO</option>
            <option value="aguardando">AGUARDANDO</option>
            <option value="pago">PAGO</option>
            <option value="recusado">RECUSADO</option>
            <option value="reembolsado">REEMBOLSADO</option>
        </select>
    )
}
