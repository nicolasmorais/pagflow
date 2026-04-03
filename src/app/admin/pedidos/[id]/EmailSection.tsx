'use client'

import { useState } from 'react'
import { sendConfirmationEmail } from '@/app/actions'
import { Mail, RefreshCw, CheckCircle2, XCircle } from 'lucide-react'

export default function EmailSection({ orderId, email }: { orderId: string; email: string }) {
    const [loading, setLoading] = useState(false)
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')

    const handleResend = async () => {
        setLoading(true)
        setStatus('idle')
        try {
            const result = await sendConfirmationEmail(orderId)
            if (result.success) {
                setStatus('success')
                setTimeout(() => setStatus('idle'), 4000)
            } else {
                setStatus('error')
            }
        } catch {
            setStatus('error')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="pedido-card" style={{ marginBottom: '16px' }}>
            <div className="pedido-card-header">
                <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#fdf4ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Mail size={14} color="#a855f7" />
                </div>
                <span className="pedido-card-title">E-mail de Confirmação</span>
                {status === 'success' && (
                    <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#10b981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', background: '#ecfdf5', padding: '3px 10px', borderRadius: '8px', border: '1px solid #a7f3d0', whiteSpace: 'nowrap' }}>
                        <CheckCircle2 size={12} /> Enviado!
                    </span>
                )}
                {status === 'error' && (
                    <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#ef4444', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', background: '#fef2f2', padding: '3px 10px', borderRadius: '8px', border: '1px solid #fecaca', whiteSpace: 'nowrap' }}>
                        <XCircle size={12} /> Erro
                    </span>
                )}
            </div>
            <div className="pedido-card-body">
                {/* Recipient display */}
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px 14px', marginBottom: '14px' }}>
                    <p style={{ margin: '0 0 2px', fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        Destinatário
                    </p>
                    <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#1e293b', wordBreak: 'break-all' }}>
                        {email}
                    </p>
                </div>

                {/* Send button */}
                <button
                    onClick={handleResend}
                    disabled={loading}
                    style={{
                        width: '100%', padding: '13px 18px', borderRadius: '12px',
                        background: loading ? '#475569' : '#111827',
                        color: '#fff', border: 'none',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontSize: '14px', fontWeight: 700,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        transition: 'background 0.2s, transform 0.15s',
                        minHeight: '48px',
                        letterSpacing: '-0.01em'
                    }}
                    onMouseEnter={e => { if (!loading) (e.currentTarget.style.background = '#1e293b') }}
                    onMouseLeave={e => { if (!loading) (e.currentTarget.style.background = '#111827') }}
                >
                    <RefreshCw
                        size={16}
                        style={{ animation: loading ? 'spin 0.8s linear infinite' : 'none' }}
                    />
                    {loading ? 'Enviando...' : 'Reenviar E-mail de Confirmação'}
                </button>

                <p style={{ marginTop: '12px', fontSize: '12px', color: '#94a3b8', lineHeight: 1.5 }}>
                    💡 E-mails de confirmação são enviados automaticamente para compras aprovadas.
                </p>
            </div>

            <style jsx>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    )
}
