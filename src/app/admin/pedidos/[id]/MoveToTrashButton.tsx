'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Loader2 } from 'lucide-react'
import { deleteOrder } from '@/app/actions'

export default function MoveToTrashButton({ orderId }: { orderId: string }) {
    const router = useRouter()
    const [busy, setBusy] = useState(false)

    const handleClick = async () => {
        if (!window.confirm('Mover este pedido para a lixeira? Você pode restaurá-lo depois.')) return
        setBusy(true)
        try {
            await deleteOrder(orderId)
            router.push('/admin/pedidos')
        } catch {
            setBusy(false)
            alert('Não foi possível mover o pedido para a lixeira.')
        }
    }

    return (
        <button type="button" onClick={handleClick} disabled={busy} className="od-btn is-danger">
            {busy ? <Loader2 size={14} className="od-spin" aria-hidden /> : <Trash2 size={14} aria-hidden />}
            Lixeira
        </button>
    )
}
