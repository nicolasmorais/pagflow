'use client'

import { useState, useEffect, useCallback } from 'react'
import { sendConfirmationEmail, resendTrackingEmail, resendPixEmail, getEmailLogs } from '@/app/actions'
import { CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react'

interface Props {
    orderId: string
    email: string
    paymentStatus: string
    paymentMethod: string
    hasTracking: boolean
}

const LOG_LABEL: Record<string, string> = {
    confirmation: 'Confirmação de compra',
    pix_pending: 'PIX pendente',
    pix_followup_1: 'Lembrete PIX (2h)',
    pix_followup_2: 'Lembrete PIX (8h)',
    rejected: 'Cartão recusado',
    delivered: 'Pedido entregue',
    tracking: 'Código de rastreio',
}

const fmtWhen = (d: string | Date) =>
    new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })

type SendState = 'idle' | 'loading' | 'success' | 'error'

function MailAction({ title, sub, disabledReason, onSend, onSent }: {
    title: string
    sub: string
    disabledReason?: string | null
    onSend: () => Promise<{ success: boolean; error?: unknown }>
    onSent: () => void
}) {
    const [state, setState] = useState<SendState>('idle')
    const [error, setError] = useState('')
    const disabled = !!disabledReason

    const handle = async () => {
        if (disabled || state === 'loading') return
        setState('loading')
        setError('')
        try {
            const res = await onSend()
            if (res.success) {
                setState('success')
                onSent()
                setTimeout(() => setState('idle'), 3000)
            } else {
                setState('error')
                setError(res.error ? String(res.error) : 'Falha ao enviar')
            }
        } catch (e: any) {
            setState('error')
            setError(e?.message || 'Falha ao enviar')
        }
    }

    return (
        <div className={`od-mail${disabled ? ' is-off' : ''}`}>
            <div className="od-mail-body">
                <p className="od-mail-title">{title}</p>
                <p className={`od-mail-sub${state === 'error' ? ' is-err' : ''}`}>
                    {state === 'error' ? error : disabled ? disabledReason : sub}
                </p>
            </div>
            <button
                type="button"
                onClick={handle}
                disabled={disabled || state === 'loading'}
                className={`od-btn is-small${state === 'success' ? ' is-done' : ''}`}
                title={disabled ? disabledReason || undefined : undefined}
            >
                {state === 'loading' && <Loader2 size={13} className="od-spin" aria-hidden />}
                {state === 'success' && <CheckCircle2 size={13} aria-hidden />}
                {state === 'loading' ? 'Enviando…' : state === 'success' ? 'Enviado' : state === 'error' ? 'Tentar de novo' : 'Enviar'}
            </button>
        </div>
    )
}

export default function EmailSection({ orderId, email, paymentStatus, paymentMethod, hasTracking }: Props) {
    const [logs, setLogs] = useState<any[]>([])
    const [loaded, setLoaded] = useState(false)

    const loadLogs = useCallback(() => {
        getEmailLogs(orderId)
            .then(l => setLogs(Array.isArray(l) ? l : []))
            .catch(() => setLogs([]))
            .finally(() => setLoaded(true))
    }, [orderId])

    useEffect(() => { loadLogs() }, [loadLogs])

    const isPaid = paymentStatus === 'pago'
    const isPixPending = paymentMethod === 'pix' && ['aguardando', 'processando'].includes(paymentStatus)
    const noEmail = !email ? 'Cliente sem e-mail cadastrado' : null

    const lastSent = (type: string) => {
        const hit = logs.find(l => l.type === type && l.status === 'sent')
        return hit ? `Último envio em ${fmtWhen(hit.sentAt)}` : null
    }

    return (
        <section className="dash-card">
            <div className="od-card-head">
                <h2>E-mails</h2>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>{email || 'Sem e-mail'}</span>
            </div>

            <MailAction
                title="Confirmação de compra"
                sub={lastSent('confirmation') || 'Nunca enviado'}
                disabledReason={noEmail || (!isPaid ? 'Disponível quando o pagamento for aprovado' : null)}
                onSend={() => sendConfirmationEmail(orderId)}
                onSent={loadLogs}
            />
            <MailAction
                title="Código de rastreio"
                sub={lastSent('tracking') || 'Nunca enviado'}
                disabledReason={noEmail || (!hasTracking ? 'Adicione o rastreio primeiro' : null)}
                onSend={() => resendTrackingEmail(orderId)}
                onSent={loadLogs}
            />
            {isPixPending && (
                <MailAction
                    title="QR Code do PIX"
                    sub={lastSent('pix_pending') || 'Reenvia o PIX para o cliente pagar'}
                    disabledReason={noEmail}
                    onSend={() => resendPixEmail(orderId)}
                    onSent={loadLogs}
                />
            )}

            <p className="od-subhead" style={{ marginTop: 16 }}>Histórico</p>
            {!loaded ? (
                <p className="od-hint" style={{ marginTop: 0 }}>Carregando…</p>
            ) : logs.length === 0 ? (
                <p className="od-hint" style={{ marginTop: 0 }}>Nenhum e-mail enviado para este pedido.</p>
            ) : (
                <div>
                    {logs.map(log => (
                        <div key={log.id} className="od-log">
                            <span className="od-log-name" title={log.status !== 'sent' && log.error ? log.error : undefined}>
                                {log.status === 'sent'
                                    ? <CheckCircle2 size={14} color="#1E7A52" aria-label="Enviado" />
                                    : <AlertTriangle size={14} color="#B23B32" aria-label="Falhou" />}
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {LOG_LABEL[log.type] ?? log.type}
                                </span>
                            </span>
                            <span className="od-log-time">{fmtWhen(log.sentAt)}</span>
                        </div>
                    ))}
                </div>
            )}
        </section>
    )
}
