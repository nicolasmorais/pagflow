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
                padding: '9px 16px', borderRadius: '9px',
                background: '#E3F4EA', border: '1px solid #C3E8D4',
                color: '#1E7A52', fontSize: '12px', fontWeight: 600,
            }}>
                <CheckCircle size={14} strokeWidth={2} />
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
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
                    background: '#14151F', color: '#fff', border: 'none', borderRadius: '9px',
                    padding: '11px 18px', fontSize: '13.5px', fontWeight: 600,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.7 : 1,
                    transition: 'all 0.15s',
                    fontFamily: 'inherit',
                }}
            >
                {loading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} strokeWidth={2} /> : <Mail size={14} strokeWidth={2} />}
                {loading ? 'Enviando...' : 'Reenviar PIX'}
            </button>
            {result === 'error' && (
                <span style={{ fontSize: '12px', color: '#B23B32', fontWeight: 500 }}>{errorMsg}</span>
            )}
        </div>
    )
}
