'use client'

import Link from 'next/link'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export type CouponReportData = {
    code: string
    pct: number
    visitors: number
    shown: number
    claimed: number
    dismissed: number
    orders: number
    paid: number
    revenue: number
    discountGiven: number
    daily: { date: string; exibidos: number; ativados: number; pagos: number }[]
    recentOrders: {
        id: string
        fullName: string
        createdAt: string
        paymentStatus: string
        paymentMethod: string
        total: number
        discount: number
    }[]
}

// Paleta tinta (espelha os tokens de admin.css)
const C = {
    ink: '#14151F',
    muted: '#6E7180',
    line: '#E5E7EF',
    sunken: '#F5F6F9',
    positive: '#1E7A52',
    positiveSoft: '#E3F4EA',
    info: '#2C5C86',
    infoSoft: '#BFD6EA',
    negative: '#B23B32',
    negativeSoft: '#FBEAE8',
    warning: '#92400E',
    warningSoft: '#FEF3C7',
}

const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const brl = (v: number) => `R$ ${fmt(v)}`
const fmtInt = (v: number) => v.toLocaleString('pt-BR')
const plural = (n: number, one: string, many: string) => `${fmtInt(n)} ${n === 1 ? one : many}`
const pct = (part: number, whole: number) => whole > 0 ? (part / whole) * 100 : 0
const fmtPct = (part: number, whole: number) => whole > 0 ? `${pct(part, whole).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%` : '—'
const shortDate = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`
const dateTime = (iso: string) => new Date(iso).toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
})

const STATUS: Record<string, { bg: string; color: string; label: string }> = {
    pago: { bg: C.positiveSoft, color: C.positive, label: 'Pago' },
    aguardando: { bg: C.warningSoft, color: C.warning, label: 'Aguardando' },
    processando: { bg: C.warningSoft, color: C.warning, label: 'Processando' },
    recusado: { bg: C.negativeSoft, color: C.negative, label: 'Recusado' },
    reembolsado: { bg: C.sunken, color: C.muted, label: 'Reembolsado' },
}

const METHOD: Record<string, string> = { pix: 'PIX', credito: 'Cartão', credit_card: 'Cartão' }

function Stat({ label, value, foot }: { label: string; value: string; foot: string }) {
    return (
        <div className="dash-stat">
            <p className="dash-stat-label">{label}</p>
            <p className="dash-stat-value">{value}</p>
            <div className="dash-stat-foot">{foot}</div>
        </div>
    )
}

function FunnelRow({ label, value, base, prev, color }: { label: string; value: number; base: number; prev?: number; color: string }) {
    const share = pct(value, base)
    return (
        <div className="dash-barrow">
            <div className="dash-barrow-top">
                <span className="dash-barrow-label">{label}</span>
                <span className="dash-barrow-value">
                    {fmtInt(value)}
                    {prev !== undefined && <span className="dash-barrow-sub">{fmtPct(value, prev)} da etapa anterior</span>}
                </span>
            </div>
            <div className="dash-bar-track">
                <div style={{ width: `${Math.max(share, share > 0 ? 2 : 0)}%`, background: color }} />
            </div>
        </div>
    )
}

function DailyTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null
    const d = payload[0].payload
    return (
        <div className="dash-tooltip">
            <p className="dash-tooltip-label">{shortDate(label)}</p>
            <p className="dash-tooltip-sub">{plural(d.exibidos, 'popup exibido', 'popups exibidos')}</p>
            <p className="dash-tooltip-sub">{plural(d.ativados, 'cupom ativado', 'cupons ativados')}</p>
            <p className="dash-tooltip-value">{plural(d.pagos, 'pedido pago', 'pedidos pagos')}</p>
        </div>
    )
}

export default function CouponReport({ data }: { data: CouponReportData }) {
    const { shown, claimed, dismissed, orders, paid, visitors } = data
    const hasActivity = shown > 0 || orders > 0

    return (
        <div className="dash-stack">
            {/* ── Resultado ── */}
            <section className="dash-card dash-hero-main" aria-label="Resultado do cupom">
                <p className="dash-chart-head">Receita de pedidos pagos com o cupom</p>
                <div className="dash-hero-figure">
                    <span className="dash-hero-value">{brl(data.revenue)}</span>
                </div>
                <p className="dash-hero-context">
                    {paid > 0
                        ? <>{plural(paid, 'pedido pago', 'pedidos pagos')} com {data.code} · {brl(data.discountGiven)} concedidos em desconto</>
                        : 'Nenhum pedido pago com o cupom neste período.'}
                </p>
                <div className="dash-stats dash-stats-4">
                    <Stat label="Viram o popup" value={fmtInt(shown)} foot={`${fmtPct(shown, visitors)} dos visitantes do checkout`} />
                    <Stat label="Ativaram o cupom" value={fmtInt(claimed)} foot={`${fmtPct(claimed, shown)} de quem viu`} />
                    <Stat label="Geraram pedido" value={fmtInt(orders)} foot={`${fmtPct(orders, claimed)} de quem ativou`} />
                    <Stat label="Pagaram" value={fmtInt(paid)} foot={`${fmtPct(paid, orders)} dos pedidos com cupom`} />
                </div>
            </section>

            <div className="dash-split">
                {/* ── Funil ── */}
                <section className="dash-card">
                    <h2 className="dash-card-title">Funil do popup</h2>
                    <p className="dash-card-sub">Visitantes únicos em cada etapa, a partir de quem viu o popup.</p>
                    {hasActivity ? (
                        <>
                            <FunnelRow label="Viram o popup" value={shown} base={shown} color={C.ink} />
                            <FunnelRow label="Ativaram o cupom" value={claimed} base={shown} prev={shown} color={C.info} />
                            <FunnelRow label="Geraram pedido" value={orders} base={shown} prev={claimed} color={C.info} />
                            <FunnelRow label="Pagaram" value={paid} base={shown} prev={orders} color={C.positive} />
                            <p className="od-hint">
                                {plural(dismissed, 'pessoa fechou', 'pessoas fecharam')} o popup sem ativar.
                            </p>
                        </>
                    ) : (
                        <p className="dash-empty">O popup ainda não apareceu neste período.</p>
                    )}
                </section>

                {/* ── Por dia ── */}
                <section className="dash-card">
                    <h2 className="dash-card-title">Por dia</h2>
                    <p className="dash-card-sub">Popups exibidos, cupons ativados e pedidos pagos.</p>
                    {data.daily.length > 0 ? (
                        <>
                            <div className="dash-legend">
                                <span><i style={{ background: C.infoSoft }} />Exibidos</span>
                                <span><i style={{ background: C.info }} />Ativados</span>
                                <span><i style={{ background: C.positive }} />Pagos</span>
                            </div>
                            <ResponsiveContainer width="100%" height={220}>
                                <BarChart data={data.daily} margin={{ top: 8, right: 4, left: -20, bottom: 0 }} barGap={2}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={C.line} vertical={false} />
                                    <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fontSize: 11, fill: C.muted }} tickLine={false} axisLine={false} />
                                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: C.muted }} tickLine={false} axisLine={false} />
                                    <Tooltip cursor={{ fill: C.sunken }} content={<DailyTooltip />} />
                                    <Bar dataKey="exibidos" fill={C.infoSoft} radius={[4, 4, 0, 0]} maxBarSize={18} />
                                    <Bar dataKey="ativados" fill={C.info} radius={[4, 4, 0, 0]} maxBarSize={18} />
                                    <Bar dataKey="pagos" fill={C.positive} radius={[4, 4, 0, 0]} maxBarSize={18} />
                                </BarChart>
                            </ResponsiveContainer>
                        </>
                    ) : (
                        <p className="dash-empty">Sem dados no período.</p>
                    )}
                </section>
            </div>

            {/* ── Pedidos ── */}
            <section className="dash-card">
                <h2 className="dash-card-title">Pedidos com o cupom</h2>
                <p className="dash-card-sub">
                    {data.recentOrders.length < orders
                        ? `Os ${data.recentOrders.length} mais recentes de ${fmtInt(orders)}.`
                        : 'Todos os pedidos do período que usaram o cupom.'}
                </p>
                {data.recentOrders.length > 0 ? (
                    <div className="dash-table-wrap">
                        <table className="dash-table">
                            <thead>
                                <tr>
                                    <th>Cliente</th>
                                    <th>Data</th>
                                    <th>Forma</th>
                                    <th>Status</th>
                                    <th className="num">Desconto</th>
                                    <th className="num">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.recentOrders.map(o => {
                                    const s = STATUS[o.paymentStatus] || { bg: C.sunken, color: C.muted, label: o.paymentStatus }
                                    return (
                                        <tr key={o.id}>
                                            <td className="strong">
                                                <Link href={`/admin/pedidos/${o.id}`} className="xc-order-link">{o.fullName}</Link>
                                            </td>
                                            <td className="num" style={{ textAlign: 'left' }}>{dateTime(o.createdAt)}</td>
                                            <td>{METHOD[o.paymentMethod] || o.paymentMethod || '—'}</td>
                                            <td><span className="dash-badge" style={{ color: s.color, background: s.bg }}>{s.label}</span></td>
                                            <td className="num" style={{ color: C.muted }}>−{brl(o.discount)}</td>
                                            <td className="num strong">{brl(o.total)}</td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="dash-empty">Nenhum pedido usou o cupom neste período.</p>
                )}
            </section>
        </div>
    )
}
