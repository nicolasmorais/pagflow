'use client'

import { useState, useEffect } from 'react'
import { sendConfirmationEmail, resendTrackingEmail, resendPixEmail, getEmailLogs } from '@/app/actions'
import { Mail, RefreshCw, CheckCircle2, XCircle, Clock, AlertTriangle, Package, Truck, Zap } from 'lucide-react'

interface Props {
    orderId: string
    email: string
    paymentStatus: string
    paymentMethod: string
    trackingCode?: string | null
}

const LOG_TYPE_LABEL: Record<string, string> = {
    confirmation: 'Confirmação',
    pix_pending: 'PIX Pendente',
    pix_followup_1: 'PIX Lembrete 2h',
    pix_followup_2: 'PIX Urgente 8h',
    rejected: 'Cartão Recusado',
    delivered: 'Entregue',
    tracking: 'Rastreio',
}

type SendState = 'idle' | 'loading' | 'success' | 'error'

function EmailTypeButton({
    icon: Icon,
    label,
    description,
    accentColor,
    accentBg,
    disabled,
    disabledReason,
    onSend,
}: {
    icon: any
    label: string
    description: string
    accentColor: string
    accentBg: string
    disabled?: boolean
    disabledReason?: string
    onSend: () => Promise<{ success: boolean; error?: any }>
}) {
    const [state, setState] = useState<SendState>('idle')
    const [errorMsg, setErrorMsg] = useState('')

    const handle = async () => {
        if (state === 'loading' || disabled) return
        setState('loading')
        setErrorMsg('')
        try {
            const res = await onSend()
            if (res.success) {
                setState('success')
                setTimeout(() => setState('idle'), 3500)
            } else {
                setState('error')
                setErrorMsg(String(res.error) || 'Erro desconhecido')
                setTimeout(() => setState('idle'), 5000)
            }
        } catch (e: any) {
            setState('error')
            setErrorMsg(e.message || 'Erro inesperado')
            setTimeout(() => setState('idle'), 5000)
        }
    }

    const isLoading = state === 'loading'
    const isSuccess = state === 'success'
    const isError = state === 'error'

    return (
        <div style={{
            border: `1px solid ${isError ? '#F5CDC9' : isSuccess ? '#C3E8D4' : '#E5E7EF'}`,
            borderRadius: '12px',
            padding: '14px 16px',
            background: isError ? '#FBEAE8' : isSuccess ? '#E3F4EA' : '#FAFAFA',
            transition: 'all 0.2s',
        }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                {/* Icon */}
                <div style={{
                    width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
                    background: disabled ? '#F5F6F9' : accentBg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: `1px solid ${disabled ? '#E5E7EF' : accentBg}`,
                }}>
                    <Icon size={16} color={disabled ? '#9ca3af' : accentColor} strokeWidth={1.8} />
                </div>

                {/* Text */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13.5px', fontWeight: 700, color: disabled ? '#9ca3af' : '#14151F', lineHeight: 1.2 }}>{label}</div>
                    <div style={{ fontSize: '11.5px', color: disabled ? '#bbbdc5' : '#6E7180', marginTop: '3px', lineHeight: 1.4 }}>
                        {isError ? errorMsg : disabled && disabledReason ? disabledReason : description}
                    </div>
                </div>

                {/* Button */}
                <button
                    onClick={handle}
                    disabled={isLoading || disabled}
                    title={disabled ? disabledReason : undefined}
                    style={{
                        display: 'inline-flex', alignItems: 'center', gap: '6px', flexShrink: 0,
                        padding: '7px 13px', borderRadius: '8px', border: 'none',
                        fontSize: '12px', fontWeight: 700, cursor: isLoading || disabled ? 'not-allowed' : 'pointer',
                        fontFamily: 'inherit', transition: 'all 0.15s',
                        background: isSuccess ? '#1E7A52'
                            : isError ? '#B23B32'
                            : disabled ? '#F5F6F9'
                            : accentColor,
                        color: disabled ? '#9ca3af' : '#fff',
                        opacity: isLoading ? 0.75 : 1,
                    }}
                >
                    {isLoading
                        ? <RefreshCw size={12} style={{ animation: 'spin 0.7s linear infinite' }} />
                        : isSuccess
                        ? <CheckCircle2 size={12} />
                        : isError
                        ? <XCircle size={12} />
                        : <RefreshCw size={12} />
                    }
                    {isLoading ? 'Enviando…' : isSuccess ? 'Enviado!' : isError ? 'Erro' : 'Reenviar'}
                </button>
            </div>
        </div>
    )
}

export default function EmailSection({ orderId, email, paymentStatus, paymentMethod, trackingCode }: Props) {
    const [logs, setLogs] = useState<any[]>([])
    const [logsLoaded, setLogsLoaded] = useState(false)

    useEffect(() => {
        getEmailLogs(orderId).then(l => { setLogs(l); setLogsLoaded(true) })
    }, [orderId])

    const isPago = paymentStatus === 'pago'
    const isPix = paymentMethod === 'pix'
    const isPixPending = isPix && ['aguardando', 'processando'].includes(paymentStatus)
    const hasTracking = !!trackingCode

    const lastSentFor = (type: string) => {
        const match = logs.find(l => l.type === type)
        if (!match) return null
        return new Date(match.sentAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
    }

    return (
        <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EF', borderRadius: '14px', padding: '24px' }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '11px', marginBottom: '20px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '9px', background: '#F5F6F9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid #E5E7EF' }}>
                    <Mail size={15} color="#14151F" strokeWidth={1.9} />
                </div>
                <div>
                    <div style={{ fontFamily: "'Fraunces', serif", fontSize: '17.5px', fontWeight: 600, letterSpacing: '-0.005em', color: '#14151F', lineHeight: 1.1 }}>E-mails</div>
                    <div style={{ fontSize: '11.5px', color: '#6E7180', marginTop: '2px' }}>{email || 'Sem e-mail'}</div>
                </div>
            </div>

            {/* Email type buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '22px' }}>
                <EmailTypeButton
                    icon={Package}
                    label="Confirmação de compra"
                    description={lastSentFor('confirmation') ? `Último envio: ${lastSentFor('confirmation')}` : 'Reenvia o e-mail de confirmação'}
                    accentColor="#6366f1"
                    accentBg="#eef2ff"
                    disabled={!isPago}
                    disabledReason="Disponível apenas para pedidos pagos"
                    onSend={() => sendConfirmationEmail(orderId)}
                />

                <EmailTypeButton
                    icon={Truck}
                    label="Código de rastreio"
                    description={lastSentFor('tracking') ? `Último envio: ${lastSentFor('tracking')}` : 'Envia o código de rastreio ao cliente'}
                    accentColor="#0284c7"
                    accentBg="#e0f2fe"
                    disabled={!hasTracking}
                    disabledReason="Adicione um código de rastreio primeiro"
                    onSend={() => resendTrackingEmail(orderId)}
                />

                <EmailTypeButton
                    icon={Zap}
                    label="Lembrete de PIX pendente"
                    description={lastSentFor('pix_pending') ? `Último envio: ${lastSentFor('pix_pending')}` : 'Reenvia o QR Code PIX ao cliente'}
                    accentColor="#d97706"
                    accentBg="#fffbeb"
                    disabled={!isPixPending}
                    disabledReason={isPix ? 'PIX já pago ou cancelado' : 'Somente para pedidos PIX pendentes'}
                    onSend={() => resendPixEmail(orderId)}
                />
            </div>

            {/* Divider */}
            <div style={{ borderTop: '1px solid #E5E7EF', paddingTop: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#6E7180', marginBottom: '12px' }}>
                    <Clock size={12} color="#6E7180" strokeWidth={2} />
                    Histórico de envios
                </div>

                {!logsLoaded ? (
                    <p style={{ fontSize: '12px', color: '#9ca3af', margin: 0 }}>Carregando…</p>
                ) : logs.length === 0 ? (
                    <p style={{ fontSize: '12px', color: '#6E7180', fontStyle: 'italic', margin: 0 }}>Nenhum e-mail enviado ainda.</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                        {logs.map((log) => (
                            <div key={log.id} style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px',
                                padding: '9px 0', borderBottom: '1px solid #E5E7EF',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {log.status === 'sent'
                                        ? <CheckCircle2 size={13} color="#1E7A52" strokeWidth={2} />
                                        : <AlertTriangle size={13} color="#B23B32" strokeWidth={2} />
                                    }
                                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#14151F' }}>
                                        {LOG_TYPE_LABEL[log.type] ?? log.type}
                                    </span>
                                    {log.status !== 'sent' && log.error && (
                                        <span style={{ fontSize: '11px', color: '#B23B32', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={log.error}>
                                            {log.error}
                                        </span>
                                    )}
                                </div>
                                <span style={{ fontSize: '11.5px', color: '#6E7180', fontFamily: "'IBM Plex Mono', monospace", flexShrink: 0 }}>
                                    {new Date(log.sentAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    )
}
