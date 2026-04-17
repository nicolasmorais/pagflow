'use client'

import { useState } from 'react'
import { Send } from 'lucide-react'
import { testPushNotificationAction } from '@/app/actions'

export default function TestPushButton() {
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)

    const handleTest = async () => {
        setLoading(true)
        setSuccess(false)
        try {
            const res = await testPushNotificationAction()
            if (res.success) {
                setSuccess(true)
                setTimeout(() => setSuccess(false), 3000)
            } else {
                alert('Erro: ' + res.error)
            }
        } catch (error) {
            console.error(error)
            alert('Falha ao enviar notificação')
        } finally {
            setLoading(false)
        }
    }

    return (
        <button
            onClick={handleTest}
            disabled={loading}
            style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '10px 20px', borderRadius: '12px',
                background: success ? '#10b981' : '#0f172a',
                color: 'white', fontWeight: 800, fontSize: '13px',
                border: 'none', cursor: loading ? 'wait' : 'pointer',
                transition: 'all 0.2s',
                opacity: loading ? 0.7 : 1,
            }}
        >
            <Send size={16} />
            {loading ? 'Enviando...' : success ? 'Enviado!' : 'Testar Notificação Local'}
        </button>
    )
}
