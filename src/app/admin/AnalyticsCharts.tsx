'use client'

import Link from 'next/link'
import {
    AreaChart, Area, BarChart, Bar, XAxis, YAxis,
    CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { ArrowUpRight, ArrowDownRight, ChevronRight } from 'lucide-react'
import type { AnalyticsData } from './types'

// ── Paleta tinta (espelha os tokens de admin.css) ─────────────────────────────
const C = {
    ink: '#14151F',
    muted: '#6E7180',
    line: '#E5E7EF',
    sunken: '#F5F6F9',
    positive: '#1E7A52',
    positiveSoft: '#E3F4EA',
    info: '#2C5C86',
    infoSoft: '#E7F1F8',
    negative: '#B23B32',
    negativeSoft: '#FBEAE8',
    warning: '#92400E',
    warningSoft: '#FEF3C7',
    warningBar: '#D97706',
}

// ── Formatação ────────────────────────────────────────────────────────────────
const fmt = (v: number | undefined | null) => (v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const brl = (v: number | undefined | null) => {
    const n = v || 0
    return n < 0 ? `−R$ ${fmt(-n)}` : `R$ ${fmt(n)}`
}
const fmtInt = (v: number) => v.toLocaleString('pt-BR')
const fmtDec = (v: number, digits: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits })
const plural = (n: number, one: string, many: string) => `${fmtInt(n)} ${n === 1 ? one : many}`
const axisMoney = (v: number) => v >= 1000 ? `${fmtDec(v / 1000, v % 1000 === 0 ? 0 : 1)}k` : String(v)
const pct = (part: number, whole: number) => whole > 0 ? (part / whole) * 100 : 0

type Change = { value: string; positive: boolean } | null

function pctChange(current: number, prev: number): Change {
    if (prev === 0 && current === 0) return null
    if (prev === 0) return { value: 'novo', positive: true }
    const p = ((current - prev) / prev) * 100
    return { value: `${fmtDec(Math.abs(p), 1)}%`, positive: p >= 0 }
}

// ── Peças ─────────────────────────────────────────────────────────────────────
function Delta({ change, large }: { change: Change; large?: boolean }) {
    if (!change) return null
    const Arrow = change.positive ? ArrowUpRight : ArrowDownRight
    return (
        <span
            className="dash-delta"
            title="Comparado ao período anterior de mesma duração"
            style={{
                color: change.positive ? C.positive : C.negative,
                background: change.positive ? C.positiveSoft : C.negativeSoft,
                fontSize: large ? '13px' : '11px',
            }}
        >
            <Arrow size={large ? 14 : 12} aria-hidden />
            {change.value}
        </span>
    )
}

function Stat({ label, value, change, tone, hint }: {
    label: string; value: string; change?: Change; tone?: 'negative' | 'positive'; hint?: string
}) {
    return (
        <div className="dash-stat">
            <p className="dash-stat-label">{label}</p>
            <p className="dash-stat-value" style={{ color: tone === 'negative' ? C.negative : tone === 'positive' ? C.positive : C.ink }}>{value}</p>
            {(change || hint) && (
                <div className="dash-stat-foot">
                    {change && <Delta change={change} />}
                    {hint && <span>{hint}</span>}
                </div>
            )}
        </div>
    )
}

function SectionHead({ title, children }: { title: string; children?: React.ReactNode }) {
    return (
        <div className="dash-section-head">
            <h2>{title}</h2>
            {children && <p>{children}</p>}
        </div>
    )
}

function Card({ title, subtitle, children, className }: {
    title?: string; subtitle?: string; children: React.ReactNode; className?: string
}) {
    return (
        <section className={`dash-card ${className || ''}`}>
            {title && <h3 className="dash-card-title">{title}</h3>}
            {subtitle && <p className="dash-card-sub">{subtitle}</p>}
            {children}
        </section>
    )
}

function Empty({ children }: { children: React.ReactNode }) {
    return <p className="dash-empty">{children}</p>
}

/** Linha de barra horizontal: rótulo e valor em cima, barra proporcional embaixo. */
function BarRow({ label, value, sub, share, color }: {
    label: React.ReactNode; value: string; sub?: string; share: number; color: string
}) {
    return (
        <div className="dash-barrow">
            <div className="dash-barrow-top">
                <span className="dash-barrow-label">{label}</span>
                <span className="dash-barrow-value">
                    {value}
                    {sub && <span className="dash-barrow-sub">{sub}</span>}
                </span>
            </div>
            <div className="dash-bar-track">
                <div style={{ width: `${Math.max(share, share > 0 ? 2 : 0)}%`, background: color }} />
            </div>
        </div>
    )
}

function Legend({ items }: { items: { label: string; color: string }[] }) {
    return (
        <div className="dash-legend">
            {items.map(i => (
                <span key={i.label}><i style={{ background: i.color }} />{i.label}</span>
            ))}
        </div>
    )
}

function ChartTooltip({ active, payload, label, render }: any) {
    if (!active || !payload?.length) return null
    return (
        <div className="dash-tooltip">
            {label !== undefined && <p className="dash-tooltip-label">{label}</p>}
            {render(payload[0].payload)}
        </div>
    )
}

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
    pago: { bg: C.positiveSoft, color: C.positive, label: 'Pago' },
    aguardando: { bg: C.warningSoft, color: C.warning, label: 'Aguardando' },
    processando: { bg: C.warningSoft, color: C.warning, label: 'Processando' },
    recusado: { bg: C.negativeSoft, color: C.negative, label: 'Recusado' },
    pendente: { bg: C.sunken, color: C.muted, label: 'Pendente' },
}

function StatusBadge({ status }: { status: string }) {
    const s = STATUS_STYLES[status] || STATUS_STYLES.pendente
    return <span className="dash-badge" style={{ color: s.color, background: s.bg }}>{s.label}</span>
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export default function AnalyticsCharts({ data }: { data: AnalyticsData }) {
    if (!data) return <Empty>Carregando dados...</Empty>

    const {
        kpis, dailyData, paymentMethods, installments,
        cardBrands, topProducts, topStates, statusBreakdown, bumpStats,
        hourlyDetail, weekdayData, shiftData, bestShift, recentOrders, prevKpis,
        taboolaAccounts, taboolaRevenue, taboolaSpent, taboolaKpis
    } = data

    const hasDaily = dailyData.some(d => d.revenue > 0)
    const hasHourly = hourlyDetail.some(h => h.total > 0)
    const peakHour = hourlyDetail.reduce((best, h) => h.total > best.total ? h : best, hourlyDetail[0])
    const hasWeekday = weekdayData.some(d => d.revenue > 0)
    const bestWeekday = weekdayData.reduce((best, d) => d.revenue > best.revenue ? d : best, weekdayData[0])
    const hasShiftSales = bestShift.paid > 0
    const totalPayments = paymentMethods.reduce((s, m) => s + m.count, 0)
    const totalInstallments = installments.reduce((s, i) => s + i.count, 0)
    const totalBrands = cardBrands.reduce((s, b) => s + b.count, 0)
    const maxProduct = topProducts[0]?.revenue || 1
    const maxState = topStates[0]?.revenue || 1
    const bumpBase = bumpStats.bumpRevenue + bumpStats.nonBumpRevenue
    const bumpShare = pct(bumpStats.bumpRevenue, bumpBase)

    const connected = taboolaAccounts?.filter(a => !a.error) || []
    const tabTotals = connected.reduce((t, a) => {
        const rev = taboolaRevenue?.find(r => r.accountId === a.accountId)
        return {
            spent: t.spent + a.totalSpent,
            impressions: t.impressions + a.totalImpressions,
            clicks: t.clicks + a.totalClicks,
            conversions: t.conversions + a.totalConversions,
            paidRevenue: t.paidRevenue + (rev?.paidRevenue || 0),
            totalRevenue: t.totalRevenue + (rev?.totalRevenue || 0),
        }
    }, { spent: 0, impressions: 0, clicks: 0, conversions: 0, paidRevenue: 0, totalRevenue: 0 })

    return (
        <div className="dash">
            {/* ═══ Resumo do período ═══ */}
            <div className="dash-hero">
                <section className="dash-card dash-hero-main">
                    <div className="dash-hero-top">
                        <div>
                            <p className="dash-stat-label">Faturamento</p>
                            <div className="dash-hero-figure">
                                <span className="dash-hero-value">{brl(kpis.totalRevenue)}</span>
                                <Delta change={pctChange(kpis.totalRevenue, prevKpis.totalRevenue)} large />
                            </div>
                            <p className="dash-hero-context">
                                {plural(kpis.paidOrders, 'pedido pago', 'pedidos pagos')} de {fmtInt(kpis.totalOrders)}
                                {prevKpis.totalRevenue > 0 && <> · antes {brl(prevKpis.totalRevenue)}</>}
                            </p>
                        </div>
                    </div>

                    <div className="dash-stats dash-stats-4">
                        <Stat label="Lucro" value={brl(kpis.profit)} tone={kpis.profit < 0 ? 'negative' : undefined} hint="após custos e anúncios" />
                        <Stat label="Conversão" value={`${fmtDec(kpis.conversionRate, 1)}%`} change={pctChange(kpis.conversionRate, prevKpis.conversionRate)} />
                        <Stat label="Ticket médio" value={brl(kpis.avgTicket)} change={pctChange(kpis.avgTicket, prevKpis.avgTicket)} />
                        <Stat label="Recusados" value={fmtInt(kpis.rejectedOrders)} hint={kpis.totalOrders > 0 ? `${fmtDec(pct(kpis.rejectedOrders, kpis.totalOrders), 0)}% dos pedidos` : undefined} />
                    </div>

                    <div className="dash-hero-chart">
                        <div className="dash-chart-head">
                            <span>Receita diária · últimos 30 dias</span>
                        </div>
                        <div style={{ position: 'relative' }}>
                            <ResponsiveContainer width="100%" height={200}>
                                <AreaChart data={dailyData} margin={{ top: 6, right: 4, left: -12, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={C.info} stopOpacity={0.16} />
                                            <stop offset="95%" stopColor={C.info} stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke={C.line} vertical={false} />
                                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: C.muted }} tickLine={false} axisLine={false} interval={4} />
                                    <YAxis tick={{ fontSize: 11, fill: C.muted }} tickLine={false} axisLine={false} tickFormatter={axisMoney} width={44} />
                                    <Tooltip cursor={{ stroke: C.line }} content={
                                        <ChartTooltip render={(d: any) => (
                                            <>
                                                <p className="dash-tooltip-value">{brl(d.revenue)}</p>
                                                <p className="dash-tooltip-sub">{plural(d.paidOrders, 'pedido pago', 'pedidos pagos')}</p>
                                            </>
                                        )} />
                                    } />
                                    <Area type="monotone" dataKey="revenue" stroke={C.info} strokeWidth={2.5} fill="url(#revenueGrad)" dot={false} activeDot={{ r: 4, fill: C.info, stroke: '#fff', strokeWidth: 2 }} />
                                </AreaChart>
                            </ResponsiveContainer>
                            {!hasDaily && <p className="dash-empty dash-empty-overlay">Nenhuma venda paga nos últimos 30 dias</p>}
                        </div>
                    </div>
                </section>

                <Card title="Pedidos recentes" subtitle="Últimos do período" className="dash-recent">
                    {recentOrders.length === 0 ? (
                        <Empty>Nenhum pedido no período</Empty>
                    ) : (
                        <div className="dash-recent-list">
                            {recentOrders.map(o => (
                                <Link key={o.id} href={`/admin/pedidos/${o.id}`} className="dash-recent-row">
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p className="dash-recent-name">{o.fullName}</p>
                                        <p className="dash-recent-date">{o.createdAt}</p>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <p className="dash-recent-value">{brl(o.totalPrice)}</p>
                                        <StatusBadge status={o.paymentStatus} />
                                    </div>
                                    <ChevronRight size={15} color={C.muted} aria-hidden style={{ flexShrink: 0 }} />
                                </Link>
                            ))}
                            <Link href="/admin/pedidos" className="dash-link">Ver todos os pedidos</Link>
                        </div>
                    )}
                </Card>
            </div>

            {/* ═══ Taboola ═══ */}
            {taboolaKpis && taboolaAccounts && taboolaAccounts.length > 0 && (
                <div>
                    <SectionHead title="Tráfego Taboola">
                        {connected.length} de {taboolaAccounts.length} contas conectadas
                    </SectionHead>
                    <section className="dash-card">
                        <div className="dash-stats dash-stats-wide">
                            <Stat label="Gasto" value={brl(taboolaKpis.totalSpent)} />
                            <Stat label="Faturamento UTM" value={brl(taboolaKpis.paidRevenue)} hint="pedidos pagos" />
                            <Stat label="ROAS" value={`${fmtDec(taboolaKpis.roas, 2)}x`}
                                tone={taboolaKpis.totalSpent > 0 ? (taboolaKpis.roas >= 1 ? 'positive' : 'negative') : undefined}
                                hint={taboolaKpis.totalSpent > 0 ? (taboolaKpis.roas >= 1 ? 'retorno acima do gasto' : 'abaixo do gasto') : undefined} />
                            <Stat label="Conversões" value={fmtInt(taboolaKpis.totalConversions)} />
                            <Stat label="CPA" value={taboolaKpis.avgCpa > 0 ? brl(taboolaKpis.avgCpa) : '—'} />
                            <Stat label="Cliques" value={fmtInt(taboolaKpis.totalClicks)} />
                            <Stat label="Impressões" value={fmtInt(taboolaKpis.totalImpressions)} />
                        </div>

                        <div className="dash-table-wrap" style={{ marginTop: '20px' }}>
                            <table className="dash-table">
                                <thead>
                                    <tr>
                                        <th>Conta</th>
                                        <th className="num">Gasto</th>
                                        <th className="num">Impressões</th>
                                        <th className="num">Cliques</th>
                                        <th className="num">CTR</th>
                                        <th className="num">Conv.</th>
                                        <th className="num">CPA</th>
                                        <th className="num">CPC</th>
                                        <th className="num">Fat. UTM pago</th>
                                        <th className="num">% pago</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {taboolaAccounts.map(acc => {
                                        const rev = taboolaRevenue?.find(r => r.accountId === acc.accountId)
                                        if (acc.error) {
                                            return (
                                                <tr key={acc.accountId}>
                                                    <td><strong>{acc.label}</strong></td>
                                                    <td colSpan={9} style={{ color: C.negative }}>Erro: {acc.error}</td>
                                                </tr>
                                            )
                                        }
                                        const idle = acc.totalSpent === 0 && acc.totalImpressions === 0
                                        return (
                                            <tr key={acc.accountId} className={idle ? 'is-idle' : undefined}>
                                                <td>
                                                    <strong>{acc.label}</strong>
                                                    <span className="dash-table-sub" title={acc.accountId}>{idle ? 'sem veiculação no período' : acc.accountId}</span>
                                                </td>
                                                <td className="num strong">{brl(acc.totalSpent)}</td>
                                                <td className="num">{fmtInt(acc.totalImpressions)}</td>
                                                <td className="num">{fmtInt(acc.totalClicks)}</td>
                                                <td className="num">{acc.totalImpressions > 0 ? `${fmtDec(acc.ctr, 2)}%` : '—'}</td>
                                                <td className="num" style={{ color: acc.totalConversions > 0 ? C.positive : undefined }}>{fmtInt(acc.totalConversions)}</td>
                                                <td className="num">{acc.cpa > 0 ? brl(acc.cpa) : '—'}</td>
                                                <td className="num">{acc.totalClicks > 0 ? brl(acc.cpc) : '—'}</td>
                                                <td className="num">{rev && rev.paidRevenue > 0 ? brl(rev.paidRevenue) : '—'}</td>
                                                <td className="num">{rev && rev.totalRevenue > 0 ? `${fmtDec(pct(rev.paidRevenue, rev.totalRevenue), 0)}%` : '—'}</td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                                {connected.length > 1 && (
                                    <tfoot>
                                        <tr>
                                            <td>Total</td>
                                            <td className="num">{brl(taboolaSpent || tabTotals.spent)}</td>
                                            <td className="num">{fmtInt(tabTotals.impressions)}</td>
                                            <td className="num">{fmtInt(tabTotals.clicks)}</td>
                                            <td className="num">{tabTotals.impressions > 0 ? `${fmtDec(pct(tabTotals.clicks, tabTotals.impressions), 2)}%` : '—'}</td>
                                            <td className="num">{fmtInt(tabTotals.conversions)}</td>
                                            <td className="num">{tabTotals.conversions > 0 ? brl(tabTotals.spent / tabTotals.conversions) : '—'}</td>
                                            <td className="num">{tabTotals.clicks > 0 ? brl(tabTotals.spent / tabTotals.clicks) : '—'}</td>
                                            <td className="num">{tabTotals.paidRevenue > 0 ? brl(tabTotals.paidRevenue) : '—'}</td>
                                            <td className="num">{tabTotals.totalRevenue > 0 ? `${fmtDec(pct(tabTotals.paidRevenue, tabTotals.totalRevenue), 0)}%` : '—'}</td>
                                        </tr>
                                    </tfoot>
                                )}
                            </table>
                        </div>
                    </section>
                </div>
            )}

            {/* ═══ Quando vendem ═══ */}
            <div>
                <SectionHead title="Quando vendem">Horário de Brasília</SectionHead>
                <div className="dash-stack">
                    <Card
                        title="Pedidos por hora"
                        subtitle={hasHourly ? `Pico às ${peakHour.hour}, com ${plural(peakHour.total, 'pedido', 'pedidos')}` : 'Sem pedidos no período'}
                    >
                        {hasHourly ? (
                            <>
                                <Legend items={[
                                    { label: 'Pagas', color: C.positive },
                                    { label: 'Aguardando', color: C.warningBar },
                                    { label: 'Recusadas', color: C.negative },
                                ]} />
                                <ResponsiveContainer width="100%" height={210}>
                                    <BarChart data={hourlyDetail} margin={{ top: 8, right: 4, left: -20, bottom: 0 }} barCategoryGap="18%">
                                        <CartesianGrid strokeDasharray="3 3" stroke={C.line} vertical={false} />
                                        <XAxis dataKey="hour" tick={{ fontSize: 11, fill: C.muted }} tickLine={false} axisLine={false} interval={1} />
                                        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: C.muted }} tickLine={false} axisLine={false} />
                                        <Tooltip cursor={{ fill: C.sunken }} content={
                                            <ChartTooltip render={(h: any) => (
                                                <>
                                                    <p className="dash-tooltip-value">{plural(h.total, 'pedido', 'pedidos')}</p>
                                                    <p className="dash-tooltip-sub">{fmtInt(h.paid)} pagas · {fmtInt(h.pending)} aguard. · {fmtInt(h.rejected)} recus.</p>
                                                    <p className="dash-tooltip-sub">Receita {brl(h.revenue)}</p>
                                                </>
                                            )} />
                                        } />
                                        <Bar dataKey="paid" stackId="h" fill={C.positive} />
                                        <Bar dataKey="pending" stackId="h" fill={C.warningBar} />
                                        <Bar dataKey="rejected" stackId="h" fill={C.negative} radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </>
                        ) : <Empty>Nenhum pedido no período</Empty>}
                    </Card>

                    <div className="dash-split">
                        <Card title="Por turno" subtitle={hasShiftSales ? `${bestShift.label} concentra mais vendas pagas` : 'Nenhuma venda paga no período'}>
                            <div className="dash-table-wrap">
                                <table className="dash-table">
                                    <thead>
                                        <tr>
                                            <th>Turno</th>
                                            <th className="num">Pedidos</th>
                                            <th className="num">Pagas</th>
                                            <th className="num">Recusadas</th>
                                            <th className="num">Receita</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {shiftData.map(s => {
                                            const best = hasShiftSales && s.shift === bestShift.shift
                                            return (
                                                <tr key={s.shift} className={best ? 'is-best' : undefined}>
                                                    <td>
                                                        <strong>{s.label}</strong>
                                                        <span className="dash-table-sub">{s.range}</span>
                                                    </td>
                                                    <td className="num">{fmtInt(s.total)}</td>
                                                    <td className="num" style={{ color: s.paid > 0 ? C.positive : undefined }}>{fmtInt(s.paid)}</td>
                                                    <td className="num" style={{ color: s.rejected > 0 ? C.negative : undefined }}>{fmtInt(s.rejected)}</td>
                                                    <td className="num strong">{brl(s.revenue)}</td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </Card>

                        <Card title="Receita por dia da semana" subtitle={hasWeekday ? `${bestWeekday.day} é o dia mais forte` : 'Sem vendas pagas no período'}>
                            {hasWeekday ? (
                                <ResponsiveContainer width="100%" height={210}>
                                    <BarChart data={weekdayData} margin={{ top: 8, right: 4, left: -12, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke={C.line} vertical={false} />
                                        <XAxis dataKey="day" tick={{ fontSize: 12, fill: C.ink, fontWeight: 600 }} tickLine={false} axisLine={false} />
                                        <YAxis tick={{ fontSize: 11, fill: C.muted }} tickLine={false} axisLine={false} tickFormatter={axisMoney} width={44} />
                                        <Tooltip cursor={{ fill: C.sunken }} content={
                                            <ChartTooltip render={(d: any) => (
                                                <>
                                                    <p className="dash-tooltip-value">{brl(d.revenue)}</p>
                                                    <p className="dash-tooltip-sub">{plural(d.orders, 'pedido', 'pedidos')} no total</p>
                                                </>
                                            )} />
                                        } />
                                        <Bar dataKey="revenue" fill={C.info} radius={[5, 5, 0, 0]} maxBarSize={44} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : <Empty>Nenhuma venda paga no período</Empty>}
                        </Card>
                    </div>
                </div>
            </div>

            {/* ═══ Pagamentos ═══ */}
            <div>
                <SectionHead title="Pagamentos">Status de todos os pedidos; método, parcelas e bandeiras dos pagos</SectionHead>
                <section className="dash-card dash-cols-4">
                    <div>
                        <h3 className="dash-card-title">Status</h3>
                        <p className="dash-card-sub">{plural(kpis.totalOrders, 'pedido', 'pedidos')}</p>
                        {statusBreakdown.map(s => (
                            <BarRow key={s.status} label={s.label} value={fmtInt(s.count)} sub={`${s.percentage}%`} share={s.percentage} color={s.color} />
                        ))}
                    </div>
                    <div>
                        <h3 className="dash-card-title">Método</h3>
                        <p className="dash-card-sub">{plural(totalPayments, 'pedido pago', 'pedidos pagos')}</p>
                        {totalPayments === 0 ? <Empty>Sem vendas pagas</Empty> : paymentMethods.map(m => (
                            <BarRow key={m.method} label={m.label} value={fmtInt(m.count)} sub={brl(m.revenue)} share={m.percentage} color={m.method === 'pix' ? C.ink : C.info} />
                        ))}
                    </div>
                    <div>
                        <h3 className="dash-card-title">Parcelas</h3>
                        <p className="dash-card-sub">Pagos no cartão</p>
                        {totalInstallments === 0 ? <Empty>Sem vendas no cartão</Empty> : installments.map(i => (
                            <BarRow key={i.label} label={i.label === '1x' ? 'À vista' : i.label} value={fmtInt(i.count)} sub={brl(i.revenue)} share={pct(i.count, totalInstallments)} color={C.info} />
                        ))}
                    </div>
                    <div>
                        <h3 className="dash-card-title">Bandeiras</h3>
                        <p className="dash-card-sub">Pagos no cartão</p>
                        {totalBrands === 0 ? <Empty>Sem vendas no cartão</Empty> : cardBrands.map(b => (
                            <BarRow key={b.brand} label={b.brand} value={fmtInt(b.count)} sub={`${fmtDec(pct(b.count, totalBrands), 0)}%`} share={pct(b.count, totalBrands)} color={C.muted} />
                        ))}
                    </div>
                </section>
            </div>

            {/* ═══ O que vende e onde ═══ */}
            <div>
                <SectionHead title="O que vende e onde">Vendas pagas no período</SectionHead>
                <div className="dash-stack">
                    <div className="dash-split dash-split-wide">
                        <Card title="Produtos" subtitle="Por faturamento">
                            {topProducts.length === 0 ? <Empty>Sem vendas pagas no período</Empty> : (
                                <div className="dash-table-wrap">
                                    <table className="dash-table">
                                        <thead>
                                            <tr>
                                                <th style={{ width: '28px' }}>#</th>
                                                <th>Produto</th>
                                                <th className="num">Vendas</th>
                                                <th className="num">Receita</th>
                                                <th className="bar-col" aria-hidden></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {topProducts.map((p, i) => (
                                                <tr key={i}>
                                                    <td className="rank">{i + 1}</td>
                                                    <td className="ellipsis"><strong title={p.name}>{p.name}</strong></td>
                                                    <td className="num">{fmtInt(p.count)}</td>
                                                    <td className="num strong">{brl(p.revenue)}</td>
                                                    <td className="bar-col"><div className="dash-bar-track"><div style={{ width: `${pct(p.revenue, maxProduct)}%`, background: i === 0 ? C.ink : C.info }} /></div></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </Card>

                        <Card title="Estados" subtitle="Por faturamento">
                            {topStates.length === 0 ? <Empty>Sem dados de endereço no período</Empty> : (
                                <div className="dash-table-wrap">
                                    <table className="dash-table">
                                        <thead>
                                            <tr>
                                                <th>UF</th>
                                                <th className="num">Pedidos</th>
                                                <th className="num">Receita</th>
                                                <th className="bar-col" aria-hidden></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {topStates.map(s => (
                                                <tr key={s.state}>
                                                    <td><strong>{s.state}</strong></td>
                                                    <td className="num">{fmtInt(s.count)}</td>
                                                    <td className="num strong">{brl(s.revenue)}</td>
                                                    <td className="bar-col"><div className="dash-bar-track"><div style={{ width: `${pct(s.revenue, maxState)}%`, background: C.info }} /></div></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </Card>
                    </div>

                    <Card title="Order bumps" subtitle="Pedidos pagos com e sem o produto adicional">
                        <div className="dash-stats dash-stats-3">
                            <Stat label="Com bump" value={plural(bumpStats.withBump, 'pedido', 'pedidos')}
                                hint={bumpStats.withBump > 0 ? `ticket médio ${brl(bumpStats.bumpAvgTicket)}` : 'nenhum no período'} />
                            <Stat label="Sem bump" value={plural(bumpStats.withoutBump, 'pedido', 'pedidos')}
                                hint={bumpStats.withoutBump > 0 ? `ticket médio ${brl(bumpStats.nonBumpAvgTicket)}` : undefined} />
                            <Stat label="Receita com bump" value={brl(bumpStats.bumpRevenue)}
                                hint={`${fmtDec(bumpShare, 0)}% da receita paga`} />
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    )
}
