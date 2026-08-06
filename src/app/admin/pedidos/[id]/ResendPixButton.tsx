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
                padding: '9px 18px', borderRadius: '10px',
                background: '#ecfdf5', border: '1px solid #d1fae5',
                color: '#059669', fontSize: '12px', fontWeight: 600,
            }}>
                <CheckCircle size={14} strokeWidth={1.8} />
                PIX reenviado!
            </span>
        )
    }

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
                type="button"
                onClick={handleResend}
                disabled={loading}
                style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '9px 18px', borderRadius: '10px',
                    background: '#059669', border: 'none',
                    color: '#fff', fontSize: '12px', fontWeight: 600,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.7 : 1,
                    transition: 'all 0.2s ease',
                    boxShadow: loading ? 'none' : '0 1px 3px rgba(0,0,0,0.04), 0 2px 8px rgba(5,150,105,0.15)',
                }}
            >
                {loading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} strokeWidth={1.8} /> : <Mail size={14} strokeWidth={1.8} />}
                {loading ? 'Enviando...' : 'Reenviar PIX'}
            </button>
            {result === 'error' && (
                <span style={{ fontSize: '12px', color: '#dc2626', fontWeight: 500 }}>
                    {errorMsg}
                </span>
            )}
        </div>
    )
}
