'use client'

import { useState } from 'react'
import { resendPixEmail } from '@/app/actions'
import { Mail, CheckCircle, Loader2 } from 'lucide-react'

export default function ResendPixButton({ orderId }: { orderId: string }) {
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<'success' | 'error' | null>(null)
    const [errorMsg, setErrorMsg] = useState('')

    async function handleResend() {
        setLoading(true)
        setResult(null)
        try {
            const res = await resendPixEmail(orderId)
            if (res.success) {
                setResult('success')
                setTimeout(() => setResult(null), 4000)
            } else {
                setResult('error')
                setErrorMsg(res.error || 'Erro ao reenviar')
                setTimeout(() => setResult(null), 5000)
            }
        } catch {
            setResult('error')
            setErrorMsg('Erro inesperado')
            setTimeout(() => setResult(null), 5000)
        } finally {
            setLoading(false)
        }
    }

    if (result === 'success') {
        return (
            <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '8px 16px', borderRadius: '10px',
                background: '#ecfdf5', border: '1px solid #a7f3d0',
                color: '#059669', fontSize: '12px', fontWeight: 700,
            }}>
                <CheckCircle size={14} />
                PIX reenviado!
            </span>
        )
    }

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
                type="button"
                onClick={handleResend}
                disabled={loading}
                style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '8px 16px', borderRadius: '10px',
                    background: '#059669', border: 'none',
                    color: '#fff', fontSize: '12px', fontWeight: 700,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.7 : 1,
                    transition: 'all 0.15s',
                }}
            >
                {loading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Mail size={14} />}
                {loading ? 'Enviando...' : 'Reenviar PIX'}
            </button>
            {result === 'error' && (
                <span style={{ fontSize: '12px', color: '#dc2626', fontWeight: 600 }}>
                    {errorMsg}
                </span>
            )}
        </div>
    )
}
