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
            borderRadius: '20px', padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02), 0 2px 8px rgba(0,0,0,0.02)',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '22px' }}>
                <div style={{
                    width: '34px', height: '34px', borderRadius: '10px',
                    background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '1px solid #e2e8f0',
                }}>
                    <Mail size={16} color="#8b5cf6" strokeWidth={1.8} />
                </div>
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.01em', flex: 1 }}>
                    E-mail de Confirmação
                </h3>
                {status === 'success' && (
                    <span style={{ fontSize: '11px', color: '#059669', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', background: '#ecfdf5', padding: '4px 12px', borderRadius: '8px', border: '1px solid #d1fae5', whiteSpace: 'nowrap' }}>
                        <CheckCircle2 size={12} /> Enviado!
                    </span>
                )}
                {status === 'error' && (
                    <span style={{ fontSize: '11px', color: '#ef4444', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', background: '#fef2f2', padding: '4px 12px', borderRadius: '8px', border: '1px solid #fecaca', whiteSpace: 'nowrap' }} title={errorMsg}>
                        <XCircle size={12} /> Erro
                    </span>
                )}
            </div>

            {status === 'error' && errorMsg && (
                <div style={{ padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', marginBottom: '16px', fontSize: '12px', color: '#ef4444', fontWeight: 500 }}>
                    {errorMsg}
                </div>
            )}

            {/* Recipient display */}
            <div style={{ background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: '12px', padding: '16px 18px', marginBottom: '16px' }}>
                <p style={{ margin: '0 0 4px', fontSize: '10px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Destinatário
                </p>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#0f172a', wordBreak: 'break-all' }}>
                    {email}
                </p>
            </div>

            {/* Send button */}
            <button
                onClick={handleResend}
                disabled={loading}
                style={{
                    width: '100%', padding: '14px 20px', borderRadius: '12px',
                    background: loading ? '#94a3b8' : '#0f172a',
                    color: '#fff', border: 'none',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: '14px', fontWeight: 600,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                    minHeight: '50px',
                    letterSpacing: '-0.01em',
                    boxShadow: loading ? 'none' : '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(15,23,42,0.12)',
                }}
                onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(15,23,42,0.18)' } }}
                onMouseLeave={e => { if (!loading) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(15,23,42,0.12)' } }}
            >
                <RefreshCw
                    size={15}
                    style={{ animation: loading ? 'spin 0.8s linear infinite' : 'none' }}
                />
                {loading ? 'Enviando...' : 'Reenviar E-mail de Confirmação'}
            </button>

            <p style={{ marginTop: '14px', fontSize: '12px', color: '#94a3b8', lineHeight: 1.6, fontWeight: 500, marginBottom: '22px' }}>
                E-mails de confirmação são enviados automaticamente para compras aprovadas.
            </p>

            {/* EMAIL LOGS HISTORY */}
            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '18px' }}>
                <h4 style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Clock size={14} color="#94a3b8" strokeWidth={1.8} /> Histórico de Envios
                </h4>

                {logs.length === 0 ? (
                    <p style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic', margin: 0, fontWeight: 500 }}>Nenhum e-mail enviado ainda.</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {logs.map((log) => (
                            <div key={log.id} style={{
                                display: 'flex', alignItems: 'center', gap: '14px',
                                background: '#f8fafc', padding: '12px 16px', borderRadius: '12px',
                                border: '1px solid #f1f5f9',
                            }}>
                                {log.status === 'sent' ? (
                                    <CheckCircle2 size={16} color="#10b981" strokeWidth={1.8} />
                                ) : (
                                    <AlertTriangle size={16} color="#ef4444" strokeWidth={1.8} />
                                )}
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>
                                            {log.type === 'confirmation' ? 'Confirmação' : log.type === 'pix_pending' ? 'PIX Pendente' : log.type === 'pix_followup_1' ? 'PIX Lembrete 2h' : log.type === 'pix_followup_2' ? 'PIX Urgente 8h' : log.type === 'rejected' ? 'Recusado' : log.type === 'delivered' ? 'Entregue' : log.type === 'tracking' ? 'Rastreio' : log.type}
                                        </span>
                                        <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 500 }}>
                                            {new Date(log.sentAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    {log.status === 'error' && log.error && (
                                        <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#ef4444', fontWeight: 500 }}>
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
