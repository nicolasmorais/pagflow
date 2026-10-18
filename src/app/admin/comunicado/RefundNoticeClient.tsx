'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { sendRefundNotices } from './actions'
import { buildRefundNotice, fixEmail, looksLikeTest, looksMistyped } from './notice'

type Row = {
    id: string
    fullName: string
    email: string
    product: string
    total: number
    createdAt: string
    sentAt: string | null
    lastError: boolean
}

const BATCH = 10
const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const date = (iso: string) =>
    new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })

export default function RefundNoticeClient({ orders }: { orders: Row[] }) {
    const router = useRouter()
    const pending = orders.filter(o => !o.sentAt)
    const [selected, setSelected] = useState<Set<string>>(
        () => new Set(pending.filter(o => o.email).map(o => o.id))
    )
    const [descriptor, setDescriptor] = useState('Elabela Store')
    const [previewId, setPreviewId] = useState<string | null>(orders[0]?.id ?? null)
    const [sending, setSending] = useState(false)
    const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
    const [outcome, setOutcome] = useState<Record<string, { status: string; error?: string }>>({})

    const previewOrder = orders.find(o => o.id === previewId) ?? orders[0]
    const preview = useMemo(
        () => buildRefundNotice(previewOrder?.fullName ?? 'Maria', descriptor),
        [previewOrder, descriptor]
    )

    const toggle = (id: string) =>
        setSelected(prev => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })

    const allPendingSelected = pending.length > 0 && pending.every(o => selected.has(o.id))
    const selectedTotal = orders.filter(o => selected.has(o.id)).reduce((s, o) => s + o.total, 0)

    async function send() {
        const ids = pending.filter(o => selected.has(o.id)).map(o => o.id)
        if (!ids.length) return
        const ok = window.confirm(
            `Enviar o comunicado de reembolso para ${ids.length} cliente${ids.length > 1 ? 's' : ''}?\n\n` +
            `Nome na fatura: ${descriptor}\n\nIsso não pode ser desfeito.`
        )
        if (!ok) return

        setSending(true)
        setProgress({ done: 0, total: ids.length })
        try {
            for (let i = 0; i < ids.length; i += BATCH) {
                const { results } = await sendRefundNotices(ids.slice(i, i + BATCH), descriptor)
                setOutcome(prev => {
                    const next = { ...prev }
                    for (const r of results) next[r.orderId] = { status: r.status, error: r.error }
                    return next
                })
                setProgress({ done: Math.min(i + BATCH, ids.length), total: ids.length })
            }
        } catch (e: any) {
            window.alert(`Envio interrompido: ${e?.message || 'erro desconhecido'}. Os já enviados ficaram registrados.`)
        } finally {
            setSending(false)
            setSelected(new Set())
            router.refresh()
        }
    }

    const sentCount = Object.values(outcome).filter(o => o.status === 'sent').length
    const failCount = Object.values(outcome).filter(o => o.status !== 'sent').length

    return (
        <>
            <div className="od-stats dash-stats">
                <div className="dash-stat">
                    <span className="dash-stat-label">Pedidos no filtro</span>
                    <span className="dash-stat-value">{orders.length}</span>
                </div>
                <div className="dash-stat">
                    <span className="dash-stat-label">Já receberam</span>
                    <span className="dash-stat-value">{orders.length - pending.length}</span>
                </div>
                <div className="dash-stat">
                    <span className="dash-stat-label">Selecionados</span>
                    <span className="dash-stat-value">{selected.size}</span>
                    <span className="dash-stat-foot">{brl(selectedTotal)}</span>
                </div>
            </div>

            <div className="od-grid">
                <section className="dash-card">
                    <div className="od-card-head">
                        <h2 className="dash-card-title">Destinatários</h2>
                        <button
                            className="od-btn is-small"
                            disabled={sending || pending.length === 0}
                            onClick={() => setSelected(allPendingSelected ? new Set() : new Set(pending.map(o => o.id)))}
                        >
                            {allPendingSelected ? 'Limpar seleção' : `Marcar todos (${pending.length})`}
                        </button>
                    </div>

                    {orders.length === 0 ? (
                        <p className="od-hint">Nenhum pedido pago no cartão em processando para esses produtos.</p>
                    ) : (
                        <div className="dash-table-wrap">
                            <table className="dash-table">
                                <thead>
                                    <tr>
                                        <th aria-label="Selecionar" />
                                        <th>Cliente</th>
                                        <th>Produto</th>
                                        <th className="num">Valor</th>
                                        <th>Situação</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.map(o => {
                                        const result = outcome[o.id]
                                        const typo = looksMistyped(o.email)
                                        const test = looksLikeTest(o.fullName, o.product)
                                        return (
                                            <tr key={o.id} className={o.sentAt ? 'is-idle' : ''} onClick={() => setPreviewId(o.id)}>
                                                <td>
                                                    <input
                                                        type="checkbox"
                                                        aria-label={`Selecionar ${o.fullName}`}
                                                        checked={selected.has(o.id)}
                                                        disabled={sending || !!o.sentAt || !o.email}
                                                        onChange={() => toggle(o.id)}
                                                        onClick={e => e.stopPropagation()}
                                                    />
                                                </td>
                                                <td>
                                                    <strong>{o.fullName}</strong>
                                                    <span className="dash-table-sub">{o.email || 'sem e-mail'}</span>
                                                    {typo && (
                                                        <span className="dash-table-sub" style={{ color: 'var(--positive)' }}>
                                                            Vai para: {fixEmail(o.email)}
                                                        </span>
                                                    )}
                                                </td>
                                                <td>
                                                    {o.product}
                                                    <span className="dash-table-sub">{date(o.createdAt)}{test ? ' · parece teste' : ''}</span>
                                                </td>
                                                <td className="num">{brl(o.total)}</td>
                                                <td>
                                                    {result ? (
                                                        <span
                                                            className="dash-badge"
                                                            title={result.error}
                                                            style={result.status === 'sent'
                                                                ? { background: 'var(--positive-soft)', color: 'var(--positive)' }
                                                                : { background: 'var(--negative-soft)', color: 'var(--negative)' }}
                                                        >
                                                            {result.status === 'sent' ? 'Enviado' : result.status === 'skipped' ? 'Pulado' : 'Erro'}
                                                        </span>
                                                    ) : o.sentAt ? (
                                                        <span className="dash-badge" style={{ background: 'var(--positive-soft)', color: 'var(--positive)' }}>
                                                            Enviado {date(o.sentAt)}
                                                        </span>
                                                    ) : o.lastError ? (
                                                        <span className="dash-badge" style={{ background: 'var(--negative-soft)', color: 'var(--negative)' }}>
                                                            Falhou antes
                                                        </span>
                                                    ) : (
                                                        <span className="dash-badge" style={{ background: 'var(--surface-sunken)', color: 'var(--ink-muted)' }}>
                                                            Não enviado
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>

                <section className="dash-card">
                    <h2 className="dash-card-title">E-mail</h2>
                    <div className="od-form">
                        <label className="od-hint" htmlFor="descriptor">Nome que aparece na fatura do cartão</label>
                        <input
                            id="descriptor"
                            className="od-input"
                            value={descriptor}
                            disabled={sending}
                            onChange={e => setDescriptor(e.target.value)}
                        />
                        <p className="od-hint">Confira numa fatura ou no Mercado Pago. Se estiver errado, o banco não acha a compra.</p>
                    </div>

                    <p className="od-hint" style={{ marginTop: 16 }}>
                        <strong>Assunto:</strong> {preview.subject}
                        {previewOrder ? <> · prévia para {previewOrder.fullName.split(' ')[0]} (clique numa linha para trocar)</> : null}
                    </p>
                    <div
                        style={{ border: '1px solid var(--line)', borderRadius: 10, overflow: 'hidden', marginTop: 8 }}
                        dangerouslySetInnerHTML={{ __html: preview.html }}
                    />

                    <button
                        className="od-btn is-primary"
                        style={{ width: '100%', marginTop: 16 }}
                        disabled={sending || selected.size === 0}
                        onClick={send}
                    >
                        {sending && progress
                            ? `Enviando ${progress.done} de ${progress.total}...`
                            : selected.size === 0
                                ? 'Selecione os destinatários'
                                : `Enviar para ${selected.size} cliente${selected.size > 1 ? 's' : ''}`}
                    </button>
                    {!sending && (sentCount > 0 || failCount > 0) && (
                        <p className="od-feedback" style={{ marginTop: 10 }}>
                            {sentCount} enviado{sentCount !== 1 ? 's' : ''}
                            {failCount ? ` · ${failCount} não enviado${failCount !== 1 ? 's' : ''} (passe o mouse no selo para ver o motivo)` : ''}
                        </p>
                    )}
                </section>
            </div>
        </>
    )
}
