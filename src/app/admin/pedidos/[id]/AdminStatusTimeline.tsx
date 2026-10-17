import { Check, XCircle } from 'lucide-react'

const STEPS = [
    { key: 'created', label: 'Pedido realizado', matchStatuses: ['pendente'] },
    { key: 'paid', label: 'Pagamento confirmado', matchStatuses: ['processando', 'pago'] },
    { key: 'production', label: 'Em separação', matchStatuses: ['aguardando_envio'] },
    { key: 'shipped', label: 'Enviado', matchStatuses: ['enviado', 'cl_shopee', 'rastreio_enviado'] },
    { key: 'delivered', label: 'Entregue', matchStatuses: ['entregue'] },
]

function getActiveIndex(status: string, paymentStatus?: string): number {
    const s = (status || '').toLowerCase()
    const ps = (paymentStatus || '').toLowerCase()
    for (let i = STEPS.length - 1; i >= 0; i--) {
        if (STEPS[i].matchStatuses.includes(s)) return i
    }
    if (['pago', 'aprovado'].includes(ps)) return 1
    return 0
}

const fmtDate = (d: string | null | undefined) =>
    d ? new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' }) : null

interface Props {
    status: string
    paymentStatus?: string
    createdAt: string
    paidAt?: string | null
    shippedAt?: string | null
    deliveredAt?: string | null
}

export default function AdminStatusTimeline({ status, paymentStatus, createdAt, paidAt, shippedAt, deliveredAt }: Props) {
    if ((status || '').toLowerCase() === 'cancelado') {
        return (
            <div className="od-cancelled">
                <XCircle size={18} aria-hidden />
                Pedido cancelado
            </div>
        )
    }

    const active = getActiveIndex(status, paymentStatus)
    const dates = [createdAt, paidAt, null, shippedAt, deliveredAt]

    return (
        <ol className="od-steps">
            {STEPS.map((step, i) => {
                const state = i < active ? 'is-done' : i === active ? 'is-current' : ''
                const date = i <= active ? fmtDate(dates[i]) : null
                return (
                    <li key={step.key} className={`od-step ${state}`} aria-current={i === active ? 'step' : undefined}>
                        <span className="od-step-dot" aria-hidden>
                            {i <= active ? <Check size={13} strokeWidth={3} /> : null}
                        </span>
                        <div>
                            <p className="od-step-label">{step.label}</p>
                            {date && <p className="od-step-date">{date}</p>}
                        </div>
                    </li>
                )
            })}
        </ol>
    )
}
