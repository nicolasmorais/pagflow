'use client'

import React from 'react'
import { Trash2 } from 'lucide-react'
import { deleteOrder } from '@/app/actions'

export default function DeleteOrderButton({ orderId }: { orderId: string }) {
    const handleDelete = async (e: React.FormEvent) => {
        e.preventDefault()
        if (window.confirm('Tem certeza que deseja mover este pedido para a lixeira?')) {
            try {
                await deleteOrder(orderId)
            } catch (error) {
                alert('Falha ao excluir pedido')
                console.error(error)
            }
        }
    }

    return (
        <form onSubmit={handleDelete}>
            <button
                type="submit"
                style={{
                    width: '32px',
                    height: '32px',
                    background: '#fef2f2',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ef4444',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                }}
                title="Mover para Lixeira"
            >
                <Trash2 size={14} />
            </button>
        </form>
    )
}
