'use client'

import { useState, useEffect } from 'react'
import { sendConfirmationEmail, getEmailLogs } from '@/app/actions'
import { Mail, RefreshCw, CheckCircle2, XCircle, Clock, AlertTriangle } from 'lucide-react'

export default function EmailSection({ orderId, email }: { orderId: string; email: string }) {
    const [loading, setLoading] = useState(false)
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
    const [errorMsg, setErrorMsg] = useState<string>('')
    const [logs, setLogs] = useState<any[]>([])

    const fetchLogs = async () => {
        const history = await getEmailLogs(orderId)
        setLogs(history)
    }

    useEffect(() => {
        fetchLogs()
    }, [orderId])

    const handleResend = async () => {
        setLoading(true)
        setStatus('idle')
        setErrorMsg('')
        try {
            const result = await sendConfirmationEmail(orderId)
            if (result.success) {
                setStatus('success')
                fetchLogs()
                setTimeout(() => setStatus('idle'), 4000)
            } else {
                setStatus('error')
                setErrorMsg(result.error as string || 'Erro desconhecido')
            }
        } catch (err: any) {
            setStatus('error')
            setErrorMsg(err.message || 'Erro inesperado')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={{
            background: '#fff', border: '1px solid #f1f5f9',
            borderRadius: '18px', padding: '22px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <div style={{
                    width: '32px', height: '32px', borderRadius: '10px',
                    background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '1px solid #e2e8f0',
                }}>
                    <Mail size={15} color="#a855f7" strokeWidth={2} />
                </div>
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.01em', flex: 1 }}>
                    E-mail de Confirmação
                </h3>
                {status === 'success' && (
                    <span style={{ fontSize: '11px', color: '#059669', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', background: '#ecfdf5', padding: '4px 10px', borderRadius: '8px', border: '1px solid #a7f3d0', whiteSpace: 'nowrap' }}>
                        <CheckCircle2 size={12} /> Enviado!
                    </span>
                )}
                {status === 'error' && (
                    <span style={{ fontSize: '11px', color: '#ef4444', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', background: '#fef2f2', padding: '4px 10px', borderRadius: '8px', border: '1px solid #fecaca', whiteSpace: 'nowrap' }} title={errorMsg}>
                        <XCircle size={12} /> Erro
                    </span>
                )}
            </div>

            {status === 'error' && errorMsg && (
                <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', marginBottom: '14px', fontSize: '12px', color: '#ef4444', fontWeight: 600 }}>
                    {errorMsg}
                </div>
            )}

            {/* Recipient display */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px 16px', marginBottom: '14px' }}>
                <p style={{ margin: '0 0 3px', fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Destinatário
                </p>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0f172a', wordBreak: 'break-all' }}>
                    {email}
                </p>
            </div>

            {/* Send button */}
            <button
                onClick={handleResend}
                disabled={loading}
                style={{
                    width: '100%', padding: '14px 18px', borderRadius: '12px',
                    background: loading ? '#94a3b8' : '#0f172a',
                    color: '#fff', border: 'none',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: '14px', fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    minHeight: '48px',
                    letterSpacing: '-0.01em',
                    boxShadow: loading ? 'none' : '0 4px 16px rgba(15,23,42,0.2)',
                }}
                onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(15,23,42,0.3)' } }}
                onMouseLeave={e => { if (!loading) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(15,23,42,0.2)' } }}
            >
                <RefreshCw
                    size={16}
                    style={{ animation: loading ? 'spin 0.8s linear infinite' : 'none' }}
                />
                {loading ? 'Enviando...' : 'Reenviar E-mail de Confirmação'}
            </button>

            <p style={{ marginTop: '12px', fontSize: '12px', color: '#94a3b8', lineHeight: 1.5, fontWeight: 500, marginBottom: '20px' }}>
                E-mails de confirmação são enviados automaticamente para compras aprovadas.
            </p>

            {/* EMAIL LOGS HISTORY */}
            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
                <h4 style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px', letterSpacing: '-0.01em' }}>
                    <Clock size={14} color="#64748b" /> Histórico de Envios
                </h4>

                {logs.length === 0 ? (
                    <p style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic', margin: 0, fontWeight: 500 }}>Nenhum e-mail enviado ainda.</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {logs.map((log) => (
                            <div key={log.id} style={{
                                display: 'flex', alignItems: 'center', gap: '12px',
                                background: '#f8fafc', padding: '12px 14px', borderRadius: '12px',
                                border: '1px solid #e2e8f0',
                            }}>
                                {log.status === 'sent' ? (
                                    <CheckCircle2 size={16} color="#10b981" />
                                ) : (
                                    <AlertTriangle size={16} color="#ef4444" />
                                )}
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                                            {log.type === 'confirmation' ? 'Confirmação' : 'Rastreio'}
                                        </span>
                                        <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>
                                            {new Date(log.sentAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    {log.status === 'error' && log.error && (
                                        <p style={{ margin: '3px 0 0', fontSize: '11px', color: '#ef4444', fontWeight: 600 }}>
                                            Erro: {JSON.parse(log.error).message || 'API Error'}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
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
