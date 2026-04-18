'use client'

import React, { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { clearAllSubscriptionsAction } from '@/app/actions'

export default function ClearSubscriptionsButton() {
    const [loading, setLoading] = useState(false)

    const handleClear = async () => {
        if (!confirm('Isso removerá todos os registros de notificações atuais. Você precisará permitir notificações novamente no navegador e no celular. Continuar?')) return;

        setLoading(true)
        try {
            await clearAllSubscriptionsAction()
            alert('Registros antigos limpos com sucesso!')
            window.location.reload()
        } catch (error) {
            alert('Erro ao limpar registros.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <button
            onClick={handleClear}
            disabled={loading}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                background: '#fee2e2',
                color: '#ef4444',
                border: '1px solid #fecaca',
                borderRadius: '12px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
            }}
        >
            <Trash2 size={16} />
            {loading ? 'Limpando...' : 'Limpar Tokens Antigos'}
        </button>
    )
}
