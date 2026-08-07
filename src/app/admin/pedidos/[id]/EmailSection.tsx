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

    useEffect(() => { fetchLogs() }, [orderId])

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
        <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EF', borderRadius: '14px', padding: '24px', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '11px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '9px', background: '#F5F6F9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid #E5E7EF' }}>
                        <Mail size={15} color="#14151F" strokeWidth={1.9} />
                    </div>
                    <div style={{ fontFamily: "'Fraunces', serif", fontSize: '17.5px', fontWeight: 600, letterSpacing: '-0.005em', color: '#14151F' }}>E-mail de confirmação</div>
                </div>
                {status === 'success' && (
                    <span style={{ fontSize: '11px', color: '#1E7A52', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', background: '#E3F4EA', padding: '4px 10px', borderRadius: '999px' }}>
                        <CheckCircle2 size={12} /> Enviado!
                    </span>
                )}
                {status === 'error' && (
                    <span style={{ fontSize: '11px', color: '#B23B32', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', background: '#FBEAE8', padding: '4px 10px', borderRadius: '999px' }} title={errorMsg}>
                        <XCircle size={12} /> Erro
                    </span>
                )}
            </div>

            {status === 'error' && errorMsg && (
                <div style={{ padding: '10px 14px', background: '#FBEAE8', border: '1px solid #F5CDC9', borderRadius: '9px', marginBottom: '16px', fontSize: '12px', color: '#B23B32', fontWeight: 500 }}>
                    {errorMsg}
                </div>
            )}

            {/* Destinatário */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px', padding: '11px 0', borderBottom: '1px solid #E5E7EF' }}>
                <div>
                    <div style={{ fontSize: '10.5px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#6E7180', marginBottom: '4px' }}>Destinatário</div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#14151F', wordBreak: 'break-all' }}>{email}</div>
                </div>
            </div>

            {/* Botao */}
            <div style={{ marginTop: '16px' }}>
                <button
                    onClick={handleResend}
                    disabled={loading}
                    style={{
                        width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
                        background: 'transparent', color: '#14151F', border: '1px solid #E5E7EF', borderRadius: '9px',
                        padding: '11px 18px', fontSize: '13.5px', fontWeight: 600,
                        cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1,
                        transition: 'border-color 0.15s', fontFamily: 'inherit',
                    }}
                >
                    <RefreshCw size={14} style={{ animation: loading ? 'spin 0.8s linear infinite' : 'none' }} strokeWidth={2} />
                    {loading ? 'Enviando...' : 'Reenviar e-mail de confirmação'}
                </button>
            </div>
            <div style={{ fontSize: '12px', color: '#6E7180', marginTop: '10px', lineHeight: 1.55 }}>
                E-mails de confirmação são enviados automaticamente para compras aprovadas.
            </div>

            {/* Historico */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#6E7180', margin: '18px 0 6px' }}>
                <Clock size={13} color="#6E7180" strokeWidth={2} />
                Histórico de envios
            </div>

            {logs.length === 0 ? (
                <p style={{ fontSize: '12px', color: '#6E7180', fontStyle: 'italic', margin: 0, fontWeight: 500 }}>Nenhum e-mail enviado ainda.</p>
            ) : (
                logs.map((log) => (
                    <div key={log.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', padding: '10px 0', borderBottom: '1px solid #E5E7EF' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '9px', fontSize: '13.5px', fontWeight: 600, color: '#14151F' }}>
                            {log.status === 'sent'
                                ? <CheckCircle2 size={14} color="#1E7A52" strokeWidth={2} />
                                : <AlertTriangle size={14} color="#B23B32" strokeWidth={2} />
                            }
                            {log.type === 'confirmation' ? 'Confirmação' : log.type === 'pix_pending' ? 'PIX Pendente' : log.type === 'pix_followup_1' ? 'PIX Lembrete 2h' : log.type === 'pix_followup_2' ? 'PIX Urgente 8h' : log.type === 'rejected' ? 'Recusado' : log.type === 'delivered' ? 'Entregue' : log.type === 'tracking' ? 'Rastreio' : log.type}
                        </div>
                        <div style={{ fontSize: '12px', color: '#6E7180', fontFamily: "'IBM Plex Mono', monospace", fontVariantNumeric: 'tabular-nums' }}>
                            {new Date(log.sentAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </div>
                    </div>
                ))
            )}

            <style jsx>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    )
}
