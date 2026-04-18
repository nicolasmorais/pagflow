'use client'

import React from 'react'
import { RotateCcw, Trash2 } from 'lucide-react'
import { restoreOrder, permanentDeleteOrder } from '../../../../actions'

export function RestoreButton({ orderId }: { orderId: string }) {
    return (
        <form action={restoreOrder.bind(null, orderId)}>
            <button
                type="submit"
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    background: '#ECFDF5',
                    color: '#059669',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 700,
                    border: '1px solid #A7F3D0',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                }}
            >
                <RotateCcw size={14} />
                Restaurar
            </button>
        </form>
    )
}

export function PermanentDeleteButton({ orderId }: { orderId: string }) {
    const handleDelete = async (e: React.FormEvent) => {
        if (!window.confirm('AVISO: Esta ação é irreversível. O pedido será apagado permanentemente do banco de dados. Deseja continuar?')) {
            e.preventDefault()
        }
    }

    return (
        <form action={permanentDeleteOrder.bind(null, orderId)} onSubmit={handleDelete}>
            <button
                type="submit"
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    background: '#FEF2F2',
                    color: '#EF4444',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 700,
                    border: '1px solid #FECACA',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                }}
            >
                <Trash2 size={14} />
                Excluir Definitivo
            </button>
        </form>
    )
}
