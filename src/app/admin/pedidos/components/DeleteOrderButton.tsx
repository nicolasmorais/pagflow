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
                className="orders-icon-btn is-danger"
                title="Mover para a lixeira"
                aria-label="Mover pedido para a lixeira"
            >
                <Trash2 size={14} aria-hidden />
            </button>
        </form>
    )
}
