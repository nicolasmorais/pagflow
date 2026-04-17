'use client'

import React from 'react'
import { updatePaymentStatus } from '../../../actions'

interface PaymentStatusSelectProps {
    orderId: string
    initialStatus: string
}

export default function PaymentStatusSelect({ orderId, initialStatus }: PaymentStatusSelectProps) {
    const [status, setStatus] = React.useState(initialStatus)

    const getPaymentColors = (currentStatus: string) => {
        const s = currentStatus?.toLowerCase();
        switch (s) {
            case 'pago': return { color: '#059669', bg: '#ECFDF5' };
            case 'recusado': return { color: '#DC2626', bg: '#FEF2F2' };
            case 'aguardando': return { color: '#D97706', bg: '#FFFBEB' };
            case 'reembolsado': return { color: '#7C3AED', bg: '#F5F3FF' };
            case 'processando': return { color: '#2563EB', bg: '#EFF6FF' };
            default: return { color: '#64748B', bg: '#F1F5F9' };
        }
    }

    const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newStatus = e.target.value
        setStatus(newStatus)
        try {
            await updatePaymentStatus(orderId, newStatus)
        } catch (error) {
            console.error('Failed to update payment status:', error)
            setStatus(initialStatus)
        }
    }

    const colors = getPaymentColors(status);

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
