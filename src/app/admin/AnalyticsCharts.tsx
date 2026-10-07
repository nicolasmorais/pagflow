'use client'

import Link from 'next/link'
import {
    AreaChart, Area, BarChart, Bar,
    PieChart, Pie, Cell, XAxis, YAxis,
    CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import {
    DollarSign, TrendingUp, ShoppingBag, CheckCircle2,
    XCircle, Clock, Ticket, ArrowUpRight, ArrowDownRight,
    Activity, BarChart3, Target, MousePointerClick,
    Sunrise, Sun, Sunset, Moon, Trophy, ChevronRight
} from 'lucide-react'
import type { AnalyticsData } from './types'

// ── Paleta tinta (espelha os tokens de admin.css) ─────────────────────────────
const C = {
    ink: '#14151F',
    muted: '#6E7180',
    line: '#E5E7EF',
    sunken: '#F5F6F9',
    surface: '#FFFFFF',
    positive: '#1E7A52',
    positiveSoft: '#E3F4EA',
    info: '#2C5C86',
    infoSoft: '#E7F1F8',
    infoLight: '#7BB8E0',
    negative: '#B23B32',
    negativeSoft: '#FBEAE8',
    warning: '#92400E',
    warningSoft: '#FEF3C7',
    warningBar: '#D97706',
    // Variantes para texto sobre fundo tinta
    onInkMuted: 'rgba(255,255,255,0.55)',
    onInkPositive: '#6EE7B7',
    onInkWarning: '#FCD34D',
    onInkNegative: '#F0A49C',
}

const fmt = (v: number | undefined | null) => (v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const brl = (v: number | undefined | null) => {
    const n = v || 0
    return n < 0 ? `−R$ ${fmt(-n)}` : `R$ ${fmt(n)}`
}
const fmtInt = (v: number) => v.toLocaleString('pt-BR')
const fmtDec = (v: number, digits: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits })
const plural = (n: number, one: string, many: string) => `${fmtInt(n)} ${n === 1 ? one : many}`
const axisMoney = (v: number) => v >= 1000 ? `${fmtDec(v / 1000, v % 1000 === 0 ? 0 : 1)}k` : String(v)

function pctChange(current: number, prev: number): { value: string; positive: boolean } | null {
    if (prev === 0 && current === 0) return null
    if (prev === 0) return { value: 'Novo', positive: true }
    const pct = ((current - prev) / prev) * 100
    return {
        value: `${pct >= 0 ? '+' : '−'}${fmtDec(Math.abs(pct), 1)}%`,
        positive: pct >= 0
    }
}

const labelStyle: React.CSSProperties = {
    margin: 0, fontSize: '10px', fontWeight: 700, color: C.muted,
    textTransform: 'uppercase', letterSpacing: '0.08em',
}

const emptyStyle: React.CSSProperties = { textAlign: 'center', color: C.muted, fontSize: '13px', padding: '24px 0', margin: 0 }

// ── Tooltip ───────────────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label, format }: any) {
    if (!active || !payload?.length) return null
    return (
        <div style={{ background: C.ink, border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '8px 12px', boxShadow: '0 12px 32px rgba(20,21,31,0.3)' }}>
            {label !== undefined && (
                <p style={{ margin: '0 0 4px', fontSize: '10px', color: C.onInkMuted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</p>
            )}
            {payload.map((entry: any) => (
                <p key={entry.name} style={{ margin: 0, fontSize: '12px', fontWeight: 700, color: '#fff' }}>
                    {format(entry.value, entry)}
                </p>
            ))}
        </div>
    )
}

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KpiCard({ icon: Icon, label, value, change, featured, tone }: {
    icon: any; label: string; value: string; featured?: boolean
    change?: { value: string; positive: boolean } | null
    tone?: 'negative'
}) {
    const changeColor = change?.positive
        ? (featured ? C.onInkPositive : C.positive)
        : (featured ? C.onInkNegative : C.negative)
    const changeBg = change?.positive
        ? (featured ? 'rgba(110,231,183,0.12)' : C.positiveSoft)
        : (featured ? 'rgba(240,164,156,0.14)' : C.negativeSoft)

    return (
        <div style={{
            background: featured ? C.ink : C.surface,
            border: featured ? 'none' : `1px solid ${C.line}`,
            borderRadius: '14px',
            padding: '18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            minWidth: 0,
            position: 'relative',
            overflow: 'hidden',
            boxShadow: featured ? '0 4px 20px rgba(20,21,31,0.15)' : '0 1px 3px rgba(0,0,0,0.02)',
        }}>
            {featured && (
                <div style={{
                    position: 'absolute', top: '-30px', right: '-30px',
                    width: '120px', height: '120px',
                    background: 'radial-gradient(circle, rgba(44,92,134,0.14) 0%, transparent 70%)',
                    borderRadius: '50%', pointerEvents: 'none',
                }} />
            )}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <div style={{
                    width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
                    background: featured ? 'rgba(44,92,134,0.22)' : C.sunken,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: featured ? '1px solid rgba(123,184,224,0.15)' : `1px solid ${C.line}`,
                }}>
                    <Icon size={17} strokeWidth={2} color={featured ? C.infoLight : C.info} aria-hidden />
                </div>
                {change && (
                    <span
                        title="Comparado ao período anterior de mesma duração"
                        style={{
                            fontSize: '11px', fontWeight: 700, color: changeColor, background: changeBg,
                            padding: '3px 8px', borderRadius: '8px', whiteSpace: 'nowrap',
                            display: 'flex', alignItems: 'center', gap: '3px',
                        }}
                    >
                        {change.positive ? <ArrowUpRight size={12} aria-hidden /> : <ArrowDownRight size={12} aria-hidden />}
                        {change.value}
                    </span>
                )}
            </div>

            <div style={{ minWidth: 0 }}>
                <p style={{ ...labelStyle, margin: '0 0 6px', color: featured ? C.onInkMuted : C.muted }}>{label}</p>
                <p style={{
                    margin: 0, fontSize: featured ? '26px' : '22px', fontWeight: 700,
                    color: featured ? '#fff' : tone === 'negative' ? C.negative : C.ink,
                    letterSpacing: '-0.03em', lineHeight: 1.1,
                    fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap',
                    overflow: 'hidden', textOverflow: 'ellipsis',
                }}>{value}</p>
            </div>
        </div>
    )
}

function SectionCard({ title, subtitle, children, style }: {
    title: string; subtitle?: string; children: React.ReactNode; style?: React.CSSProperties
}) {
    return (
        <section style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: '14px', padding: '22px', minWidth: 0, ...style }}>
            <div style={{ marginBottom: '18px' }}>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: C.ink, letterSpacing: '-0.01em' }}>{title}</h3>
                {subtitle && <p style={{ margin: '4px 0 0', fontSize: '12px', color: C.muted, fontWeight: 500 }}>{subtitle}</p>}
            </div>
            {children}
        </section>
    )
}

// ── Heatmap ───────────────────────────────────────────────────────────────────
const HEAT_SCALE = [C.sunken, C.infoSoft, C.infoLight, C.info, '#1A3A5C']

function HeatmapCell({ value, max, hour }: { value: number; max: number; hour: string }) {
    const intensity = max > 0 ? value / max : 0
    const step = intensity === 0 ? 0 : intensity < 0.25 ? 1 : intensity < 0.5 ? 2 : intensity < 0.75 ? 3 : 4
    return (
        <div
            title={`${hour}: ${plural(value, 'pedido', 'pedidos')}`}
            style={{
                background: HEAT_SCALE[step], borderRadius: '4px', height: '26px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '10px', fontWeight: 700,
                color: step >= 3 ? '#fff' : C.info,
            }}
        >
            {value > 0 ? value : ''}
        </div>
    )
}

// ── Status Badge ──────────────────────────────────────────────────────────────
const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
    pago: { bg: C.positiveSoft, color: C.positive, label: 'Pago' },
    aguardando: { bg: C.warningSoft, color: C.warning, label: 'Aguardando' },
    processando: { bg: C.warningSoft, color: C.warning, label: 'Processando' },
    recusado: { bg: C.negativeSoft, color: C.negative, label: 'Recusado' },
    pendente: { bg: C.sunken, color: C.muted, label: 'Pendente' },
}

function StatusBadge({ status }: { status: string }) {
    const s = STATUS_STYLES[status] || STATUS_STYLES.pendente
    return (
        <span style={{ fontSize: '10px', fontWeight: 700, color: s.color, background: s.bg, padding: '2px 8px', borderRadius: '6px', display: 'inline-block', marginTop: '3px' }}>
            {s.label}
        </span>
    )
}

function Chip({ children, color, bg, border }: { children: React.ReactNode; color: string; bg: string; border?: string }) {
    return (
        <span style={{ fontSize: '10px', fontWeight: 700, color, background: bg, border: border || 'none', padding: '3px 8px', borderRadius: '6px', whiteSpace: 'nowrap' }}>
            {children}
        </span>
    )
}

function RankBadge({ index }: { index: number }) {
    return (
        <span style={{
            width: '22px', height: '22px', borderRadius: '6px',
            background: index === 0 ? C.ink : index === 1 ? C.info : C.muted,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '10px', fontWeight: 700, color: '#fff', flexShrink: 0
        }}>{index + 1}</span>
    )
}

function MetricTile({ label, value, color }: { label: string; value: string; color?: string }) {
    return (
        <div style={{ background: C.sunken, borderRadius: '10px', padding: '10px', border: `1px solid ${C.line}`, minWidth: 0 }}>
            <p style={{ ...labelStyle, fontSize: '9.5px' }}>{label}</p>
            <p style={{ margin: '4px 0 0', fontSize: '14px', fontWeight: 700, color: color || C.ink, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</p>
        </div>
    )
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function AnalyticsCharts({ data }: { data: AnalyticsData }) {
    if (!data) return <div style={{ padding: '40px', textAlign: 'center', color: C.muted }}>Carregando dados...</div>

    const {
        kpis, dailyData, paymentMethods, installments,
        cardBrands, topProducts, topStates, statusBreakdown, bumpStats,
        hourlyData, weekdayData, topHours, shiftData, bestShift, recentOrders, prevKpis,
        taboolaAccounts, taboolaRevenue, taboolaSpent, taboolaKpis
    } = data

    const maxState = topStates[0]?.revenue || 1
    const maxProduct = topProducts[0]?.revenue || 1
    const maxHourly = Math.max(...hourlyData.map(h => h.orders), 1)
    const maxTopHour = Math.max(...topHours.map(h => h.total), 1)
    const hasDailyRevenue = dailyData.some(d => d.revenue > 0 || d.paidOrders > 0)
    const hasWeekdayRevenue = weekdayData.some(d => d.revenue > 0)
    const hasShiftSales = bestShift.paid > 0
    const activePayments = paymentMethods.filter(m => m.count > 0)

    const PIE_COLORS = [C.ink, C.info, C.muted, '#A0A8B8']
    const SHIFT_ICONS: Record<string, any> = { madrugada: Moon, manha: Sunrise, tarde: Sun, noite: Sunset }

    const connectedTaboola = taboolaAccounts?.filter(a => !a.error) || []
    const taboolaTotalConversions = connectedTaboola.reduce((s, a) => s + a.totalConversions, 0)

    return (
        <>
            {/* ── KPIs de vendas ── */}
            <div className="kpi-grid" style={{ marginBottom: '14px' }}>
                <KpiCard featured icon={DollarSign} label="Faturamento" value={brl(kpis.totalRevenue)}
                    change={pctChange(kpis.totalRevenue, prevKpis.totalRevenue)} />
                <KpiCard icon={TrendingUp} label="Lucro" value={brl(kpis.profit)} tone={kpis.profit < 0 ? 'negative' : undefined} />
                <KpiCard icon={ShoppingBag} label="Pedidos" value={fmtInt(kpis.totalOrders)}
                    change={pctChange(kpis.totalOrders, prevKpis.totalOrders)} />
                <KpiCard icon={CheckCircle2} label="Pagos" value={fmtInt(kpis.paidOrders)}
                    change={pctChange(kpis.paidOrders, prevKpis.paidOrders)} />
                <KpiCard icon={Activity} label="Conversão" value={`${fmtDec(kpis.conversionRate, 1)}%`}
                    change={pctChange(kpis.conversionRate, prevKpis.conversionRate)} />
                <KpiCard icon={Ticket} label="Ticket Médio" value={brl(kpis.avgTicket)}
                    change={pctChange(kpis.avgTicket, prevKpis.avgTicket)} />
                <KpiCard icon={XCircle} label="Recusados" value={fmtInt(kpis.rejectedOrders)} />
            </div>

            {/* ── KPIs Taboola (mesmas colunas da linha de cima) ── */}
            {taboolaKpis && (
                <div className="kpi-grid" style={{ marginBottom: '24px' }}>
                    <KpiCard featured icon={Target} label="Gasto Taboola" value={brl(taboolaKpis.totalSpent)} />
                    <KpiCard icon={Activity} label="Faturamento UTM" value={brl(taboolaKpis.paidRevenue)} />
                    <KpiCard icon={TrendingUp} label="ROAS" value={`${fmtDec(taboolaKpis.roas, 2)}x`} />
                    <KpiCard icon={CheckCircle2} label="Conversões" value={fmtInt(taboolaKpis.totalConversions)} />
                    <KpiCard icon={DollarSign} label="CPA" value={taboolaKpis.avgCpa > 0 ? brl(taboolaKpis.avgCpa) : '—'} />
                    <KpiCard icon={MousePointerClick} label="Cliques" value={fmtInt(taboolaKpis.totalClicks)} />
                    <KpiCard icon={BarChart3} label="Impressões" value={fmtInt(taboolaKpis.totalImpressions)} />
                </div>
            )}

            {/* ── Receita diária + Pedidos recentes ── */}
            <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <SectionCard title="Receita Diária" subtitle="Últimos 30 dias, independente do filtro">
                    <div style={{ position: 'relative' }}>
                        <ResponsiveContainer width="100%" height={240}>
                            <AreaChart data={dailyData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={C.info} stopOpacity={0.14} />
                                        <stop offset="95%" stopColor={C.info} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke={C.line} vertical={false} />
                                <XAxis dataKey="date" tick={{ fontSize: 10, fill: C.muted, fontWeight: 600 }} tickLine={false} axisLine={false} interval={4} />
                                <YAxis tick={{ fontSize: 10, fill: C.muted }} tickLine={false} axisLine={false} tickFormatter={axisMoney} />
                                <Tooltip cursor={{ stroke: C.line }} content={<ChartTooltip format={(v: number) => brl(v)} />} />
                                <Area type="monotone" dataKey="revenue" name="revenue" stroke={C.info} strokeWidth={2.5} fill="url(#revenueGrad)" dot={false} />
                            </AreaChart>
                        </ResponsiveContainer>
                        {!hasDailyRevenue && (
                            <p style={{ ...emptyStyle, position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                                Nenhuma venda paga nos últimos 30 dias
                            </p>
                        )}
                    </div>
                    <div style={{ marginTop: '12px', borderTop: `1px solid ${C.line}`, paddingTop: '12px' }}>
                        <p style={{ ...labelStyle, margin: '0 0 8px' }}>Pedidos pagos por dia</p>
                        <ResponsiveContainer width="100%" height={50}>
                            <BarChart data={dailyData} margin={{ top: 0, right: 4, left: 4, bottom: 0 }}>
                                <XAxis dataKey="date" hide />
                                <YAxis hide />
                                <Tooltip cursor={{ fill: C.sunken }} content={<ChartTooltip format={(v: number) => plural(v, 'pedido pago', 'pedidos pagos')} />} />
                                <Bar dataKey="paidOrders" name="paidOrders" fill={C.ink} radius={[3, 3, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </SectionCard>

                <SectionCard title="Pedidos Recentes" subtitle="Últimos 5 do período">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {recentOrders.length === 0 ? (
                            <p style={emptyStyle}>Nenhum pedido no período</p>
                        ) : recentOrders.map(o => (
                            <Link key={o.id} href={`/admin/pedidos/${o.id}`} className="dash-recent-row">
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ margin: 0, fontSize: '12px', fontWeight: 700, color: C.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.fullName}</p>
                                    <p style={{ margin: '2px 0 0', fontSize: '11px', color: C.muted, fontWeight: 500 }}>{o.createdAt}</p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <p style={{ margin: 0, fontSize: '12px', fontWeight: 700, color: C.ink, fontVariantNumeric: 'tabular-nums' }}>{brl(o.totalPrice)}</p>
                                    <StatusBadge status={o.paymentStatus} />
                                </div>
                                <ChevronRight size={14} color={C.muted} aria-hidden style={{ flexShrink: 0 }} />
                            </Link>
                        ))}
                    </div>
                </SectionCard>
            </div>

            {/* ── Horários de pico + Dia da semana ── */}
            <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <SectionCard title="Horários de Pico" subtitle="Pedidos por hora do dia">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '4px' }}>
                        {hourlyData.map(h => (
                            <div key={h.hour} style={{ textAlign: 'center', minWidth: 0 }}>
                                <HeatmapCell value={h.orders} max={maxHourly} hour={h.hour} />
                                <span style={{ fontSize: '10px', color: C.muted, fontWeight: 600, marginTop: '3px', display: 'block' }}>{h.hour}</span>
                            </div>
                        ))}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px', marginTop: '12px' }}>
                        <span style={{ fontSize: '10px', color: C.muted, fontWeight: 600, marginRight: '2px' }}>Menos</span>
                        {HEAT_SCALE.map(c => (
                            <div key={c} style={{ width: '12px', height: '12px', borderRadius: '3px', background: c, border: c === C.sunken ? `1px solid ${C.line}` : 'none' }} />
                        ))}
                        <span style={{ fontSize: '10px', color: C.muted, fontWeight: 600, marginLeft: '2px' }}>Mais</span>
                    </div>
                </SectionCard>

                <SectionCard title="Receita por Dia da Semana" subtitle="Vendas pagas no período">
                    {hasWeekdayRevenue ? (
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={weekdayData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke={C.line} vertical={false} />
                                <XAxis dataKey="day" tick={{ fontSize: 11, fill: C.ink, fontWeight: 700 }} tickLine={false} axisLine={false} />
                                <YAxis tick={{ fontSize: 10, fill: C.muted }} tickLine={false} axisLine={false} tickFormatter={axisMoney} />
                                <Tooltip cursor={{ fill: C.sunken }} content={<ChartTooltip format={(v: number) => brl(v)} />} />
                                <Bar dataKey="revenue" name="revenue" fill={C.info} radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <p style={emptyStyle}>Sem vendas pagas no período</p>
                    )}
                </SectionCard>
            </div>

            {/* ── Turnos + Top horários ── */}
            <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <SectionCard
                    title="Vendas por Turno"
                    subtitle={hasShiftSales ? `${bestShift.label} é o turno com mais vendas pagas` : 'Nenhuma venda paga no período'}
                >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {shiftData.map(s => {
                            const Icon = SHIFT_ICONS[s.shift] || Clock
                            const isBest = hasShiftSales && s.shift === bestShift.shift
                            return (
                                <div key={s.shift} style={{
                                    padding: '12px', borderRadius: '12px',
                                    background: isBest ? C.ink : C.sunken,
                                    border: isBest ? `1px solid ${C.ink}` : `1px solid ${C.line}`,
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '8px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                                            <div style={{
                                                width: '28px', height: '28px', borderRadius: '8px', flexShrink: 0,
                                                background: isBest ? 'rgba(123,184,224,0.15)' : C.surface,
                                                border: isBest ? '1px solid rgba(123,184,224,0.2)' : `1px solid ${C.line}`,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            }}>
                                                <Icon size={14} color={isBest ? C.infoLight : C.info} aria-hidden />
                                            </div>
                                            <div>
                                                <p style={{ margin: 0, fontSize: '12px', fontWeight: 700, color: isBest ? '#fff' : C.ink }}>{s.label}</p>
                                                <p style={{ margin: 0, fontSize: '10px', color: isBest ? C.onInkMuted : C.muted, fontWeight: 600 }}>{s.range}</p>
                                            </div>
                                            {isBest && (
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '10px', fontWeight: 700, color: C.onInkPositive, background: 'rgba(110,231,183,0.12)', padding: '3px 7px', borderRadius: '6px' }}>
                                                    <Trophy size={10} aria-hidden /> Top
                                                </span>
                                            )}
                                        </div>
                                        <span style={{ fontSize: '13px', fontWeight: 700, color: isBest ? '#fff' : C.ink, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{brl(s.revenue)}</span>
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                        {isBest ? (
                                            <>
                                                <Chip color={C.onInkPositive} bg="rgba(110,231,183,0.12)">{plural(s.paid, 'paga', 'pagas')}</Chip>
                                                <Chip color={C.onInkWarning} bg="rgba(252,211,77,0.12)">{fmtInt(s.pending)} aguard.</Chip>
                                                <Chip color={C.onInkNegative} bg="rgba(240,164,156,0.14)">{fmtInt(s.rejected)} recus.</Chip>
                                                <Chip color={C.onInkMuted} bg="rgba(255,255,255,0.08)">{fmtInt(s.total)} total</Chip>
                                            </>
                                        ) : (
                                            <>
                                                <Chip color={C.positive} bg={C.positiveSoft}>{plural(s.paid, 'paga', 'pagas')}</Chip>
                                                <Chip color={C.warning} bg={C.warningSoft}>{fmtInt(s.pending)} aguard.</Chip>
                                                <Chip color={C.negative} bg={C.negativeSoft}>{fmtInt(s.rejected)} recus.</Chip>
                                                <Chip color={C.muted} bg={C.surface} border={`1px solid ${C.line}`}>{fmtInt(s.total)} total</Chip>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </SectionCard>

                <SectionCard title="Top Horários de Vendas" subtitle="Horas com mais pedidos, por status">
                    {topHours.every(h => h.total === 0) ? (
                        <p style={emptyStyle}>Sem pedidos no período</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            {topHours.filter(h => h.total > 0).map((h, i) => (
                                <div key={h.hour}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                                            <RankBadge index={i} />
                                            <span style={{ fontSize: '13px', fontWeight: 700, color: C.ink }}>{h.hour}</span>
                                        </div>
                                        <span style={{ fontSize: '12px', fontWeight: 700, color: C.positive, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{brl(h.revenue)}</span>
                                    </div>
                                    <div style={{ width: '100%', height: '6px', background: C.sunken, borderRadius: '3px', overflow: 'hidden', display: 'flex' }}>
                                        <div style={{ width: `${(h.paid / maxTopHour) * 100}%`, height: '100%', background: C.positive }} />
                                        <div style={{ width: `${(h.pending / maxTopHour) * 100}%`, height: '100%', background: C.warningBar }} />
                                        <div style={{ width: `${(h.rejected / maxTopHour) * 100}%`, height: '100%', background: C.negative }} />
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '5px' }}>
                                        <span style={{ fontSize: '11px', color: C.positive, fontWeight: 600 }}>{plural(h.paid, 'paga', 'pagas')}</span>
                                        <span style={{ fontSize: '11px', color: C.warning, fontWeight: 600 }}>{fmtInt(h.pending)} aguard.</span>
                                        <span style={{ fontSize: '11px', color: C.negative, fontWeight: 600 }}>{fmtInt(h.rejected)} recus.</span>
                                        <span style={{ fontSize: '11px', color: C.muted, fontWeight: 600, marginLeft: 'auto' }}>{fmtInt(h.total)} total</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </SectionCard>
            </div>

            {/* ── Status + Método de pagamento + Parcelamentos ── */}
            <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: '14px', marginBottom: '14px' }}>
                <SectionCard title="Status dos Pedidos" subtitle="Distribuição no período">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {statusBreakdown.map(s => (
                            <div key={s.status} style={{ padding: '12px', background: C.sunken, borderRadius: '10px', border: `1px solid ${C.line}` }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: s.color }} />
                                        <span style={{ fontSize: '12px', fontWeight: 700, color: C.ink }}>{s.label}</span>
                                    </div>
                                    <span style={{ fontSize: '14px', fontWeight: 700, color: C.ink, fontVariantNumeric: 'tabular-nums' }}>{fmtInt(s.count)}</span>
                                </div>
                                <div style={{ width: '100%', height: '4px', background: C.line, borderRadius: '2px', overflow: 'hidden' }}>
                                    <div style={{ width: `${s.percentage}%`, height: '100%', background: s.color, borderRadius: '2px', transition: 'width 0.5s ease' }} />
                                </div>
                                <p style={{ margin: '4px 0 0', fontSize: '11px', color: C.muted, fontWeight: 600, textAlign: 'right' }}>{s.percentage}%</p>
                            </div>
                        ))}
                    </div>
                </SectionCard>

                <SectionCard title="Método de Pagamento" subtitle="Pedidos pagos">
                    {activePayments.length === 0 ? (
                        <p style={emptyStyle}>Sem vendas pagas no período</p>
                    ) : (
                        <>
                            <ResponsiveContainer width="100%" height={150}>
                                <PieChart>
                                    <Pie
                                        data={activePayments}
                                        dataKey="count" nameKey="label"
                                        cx="50%" cy="50%"
                                        innerRadius={42} outerRadius={62} paddingAngle={activePayments.length > 1 ? 4 : 0}
                                        stroke="none"
                                    >
                                        {activePayments.map((m, i) => (
                                            <Cell key={m.method} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<ChartTooltip format={(v: number, e: any) => `${e.name}: ${plural(v, 'pedido', 'pedidos')}`} />} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
                                {activePayments.map((m, i) => (
                                    <div key={m.method} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', background: C.sunken, borderRadius: '8px' }}>
                                        <span style={{ width: '8px', height: '8px', borderRadius: '3px', background: PIE_COLORS[i % PIE_COLORS.length], flexShrink: 0 }} />
                                        <span style={{ fontSize: '12px', fontWeight: 600, color: C.ink, flex: 1 }}>{m.label}</span>
                                        <span style={{ fontSize: '12px', fontWeight: 700, color: C.ink, fontVariantNumeric: 'tabular-nums' }}>{fmtInt(m.count)}</span>
                                        <span style={{ fontSize: '11px', color: C.muted, fontWeight: 600, minWidth: '32px', textAlign: 'right' }}>{m.percentage}%</span>
                                    </div>
                                ))}
                            </div>
                            {cardBrands.length > 0 && (
                                <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: `1px solid ${C.line}` }}>
                                    <p style={{ ...labelStyle, margin: '0 0 6px' }}>Bandeiras</p>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                        {cardBrands.map(b => (
                                            <Chip key={b.brand} color={C.info} bg={C.infoSoft}>{b.brand} · {fmtInt(b.count)}</Chip>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </SectionCard>

                <SectionCard title="Parcelamentos" subtitle="Pedidos pagos no cartão">
                    {installments.length === 0 ? (
                        <p style={emptyStyle}>Sem vendas no cartão no período</p>
                    ) : (
                        <ResponsiveContainer width="100%" height={Math.max(120, installments.length * 44)}>
                            <BarChart data={installments} layout="vertical" margin={{ top: 0, right: 8, left: 8, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke={C.line} horizontal={false} />
                                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10, fill: C.muted }} tickLine={false} axisLine={false} />
                                <YAxis type="category" dataKey="label" tick={{ fontSize: 11, fill: C.ink, fontWeight: 700 }} tickLine={false} axisLine={false} width={28} />
                                <Tooltip cursor={{ fill: C.sunken }} content={<ChartTooltip format={(v: number) => plural(v, 'pedido', 'pedidos')} />} />
                                <Bar dataKey="count" name="count" fill={C.ink} radius={[0, 6, 6, 0]} maxBarSize={28} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </SectionCard>
            </div>

            {/* ── Top produtos + Top estados ── */}
            <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <SectionCard title="Top Produtos" subtitle="Por faturamento">
                    {topProducts.length === 0 ? (
                        <p style={emptyStyle}>Sem vendas pagas no período</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {topProducts.map((p, i) => (
                                <div key={i}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                                            <RankBadge index={i} />
                                            <span style={{ fontSize: '12px', fontWeight: 700, color: C.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                                        </div>
                                        <span style={{ fontSize: '12px', fontWeight: 700, color: C.positive, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{brl(p.revenue)}</span>
                                    </div>
                                    <div style={{ width: '100%', height: '5px', background: C.sunken, borderRadius: '3px', overflow: 'hidden' }}>
                                        <div style={{ width: `${Math.round((p.revenue / maxProduct) * 100)}%`, height: '100%', background: i === 0 ? C.ink : i === 1 ? C.info : C.muted, borderRadius: '3px' }} />
                                    </div>
                                    <span style={{ fontSize: '11px', color: C.muted, fontWeight: 600 }}>{plural(p.count, 'venda', 'vendas')}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </SectionCard>

                <SectionCard title="Top Estados" subtitle="Por faturamento">
                    {topStates.length === 0 ? (
                        <p style={emptyStyle}>Sem dados geográficos no período</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {topStates.map((s, i) => (
                                <div key={s.state}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ fontSize: '11px', fontWeight: 700, color: C.muted, width: '14px' }}>{i + 1}</span>
                                            <Chip color={C.info} bg={C.infoSoft}>{s.state}</Chip>
                                            <span style={{ fontSize: '11px', color: C.muted, fontWeight: 600 }}>{plural(s.count, 'pedido', 'pedidos')}</span>
                                        </div>
                                        <span style={{ fontSize: '12px', fontWeight: 700, color: C.positive, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{brl(s.revenue)}</span>
                                    </div>
                                    <div style={{ width: '100%', height: '4px', background: C.sunken, borderRadius: '2px', overflow: 'hidden' }}>
                                        <div style={{ width: `${Math.round((s.revenue / maxState) * 100)}%`, height: '100%', background: C.info, borderRadius: '2px' }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </SectionCard>
            </div>

            {/* ── Order bumps ── */}
            <SectionCard title="Análise de Order Bumps" subtitle="Impacto no ticket médio e receita" style={{ marginBottom: '14px' }}>
                <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                    {[
                        { label: 'Com bump', count: bumpStats.withBump, ticket: bumpStats.bumpAvgTicket },
                        { label: 'Sem bump', count: bumpStats.withoutBump, ticket: bumpStats.nonBumpAvgTicket },
                    ].map(b => (
                        <div key={b.label} style={{ background: C.sunken, borderRadius: '12px', padding: '16px', border: `1px solid ${C.line}` }}>
                            <p style={{ ...labelStyle, margin: '0 0 8px' }}>{b.label}</p>
                            <p style={{ margin: '0 0 2px', fontSize: '24px', fontWeight: 700, color: C.ink, fontVariantNumeric: 'tabular-nums' }}>{fmtInt(b.count)}</p>
                            <p style={{ margin: 0, fontSize: '11px', color: C.muted, fontWeight: 600 }}>{b.count === 1 ? 'pedido pago' : 'pedidos pagos'}</p>
                            <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: `1px solid ${C.line}` }}>
                                <p style={{ ...labelStyle, margin: '0 0 2px' }}>Ticket médio</p>
                                <p style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: C.ink, fontVariantNumeric: 'tabular-nums' }}>{b.count > 0 ? brl(b.ticket) : '—'}</p>
                            </div>
                        </div>
                    ))}
                    {(() => {
                        const totalBumpBase = bumpStats.bumpRevenue + bumpStats.nonBumpRevenue
                        const bumpShare = totalBumpBase > 0 ? Math.round((bumpStats.bumpRevenue / totalBumpBase) * 100) : 0
                        return (
                            <div style={{ background: C.sunken, borderRadius: '12px', padding: '16px', border: `1px solid ${C.line}` }}>
                                <p style={{ ...labelStyle, margin: '0 0 8px' }}>Receita com bump</p>
                                <p style={{ margin: '0 0 2px', fontSize: '24px', fontWeight: 700, color: C.ink, fontVariantNumeric: 'tabular-nums' }}>{brl(bumpStats.bumpRevenue)}</p>
                                <p style={{ margin: '0 0 10px', fontSize: '11px', color: C.muted, fontWeight: 600 }}>{bumpShare}% da receita paga</p>
                                <div style={{ width: '100%', height: '6px', background: C.line, borderRadius: '3px', overflow: 'hidden' }}>
                                    <div style={{ width: `${bumpShare}%`, height: '100%', background: C.info, borderRadius: '3px' }} />
                                </div>
                                <p style={{ margin: '6px 0 0', fontSize: '11px', color: C.muted, fontWeight: 600 }}>
                                    {brl(bumpStats.nonBumpRevenue)} sem bump
                                </p>
                            </div>
                        )
                    })()}
                </div>
            </SectionCard>

            {/* ── Contas Taboola ── */}
            {taboolaAccounts && taboolaAccounts.length > 0 && (
                <SectionCard
                    title="Contas Taboola"
                    subtitle={`Performance por conta · ${connectedTaboola.length} de ${taboolaAccounts.length} conectadas`}
                    style={{ marginBottom: '14px' }}
                >
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
                        {taboolaAccounts.map(acc => {
                            const rev = taboolaRevenue?.find(r => r.accountId === acc.accountId)
                            const paidPct = rev && rev.totalRevenue > 0 ? (rev.paidRevenue / rev.totalRevenue) * 100 : 0
                            return (
                                <div key={acc.accountId} style={{
                                    background: acc.error ? C.negativeSoft : C.surface,
                                    border: `1px solid ${acc.error ? '#F3CFCB' : C.line}`,
                                    borderRadius: '12px', padding: '18px', minWidth: 0,
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                                        <div style={{
                                            width: '34px', height: '34px', borderRadius: '10px', flexShrink: 0,
                                            background: acc.error ? C.surface : C.infoSoft,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        }}>
                                            <Target size={16} color={acc.error ? C.negative : C.info} aria-hidden />
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: C.ink }}>{acc.label}</p>
                                            <p style={{ margin: '2px 0 0', fontSize: '11px', color: C.muted, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={acc.accountId}>{acc.accountId}</p>
                                        </div>
                                        {acc.error
                                            ? <Chip color={C.negative} bg={C.surface}>Erro</Chip>
                                            : <Chip color={C.positive} bg={C.positiveSoft}>Conectada</Chip>}
                                    </div>

                                    {acc.error ? (
                                        <p style={{ margin: 0, fontSize: '12px', color: C.negative, fontWeight: 500 }}>{acc.error}</p>
                                    ) : (
                                        <>
                                            <div style={{ marginBottom: '14px' }}>
                                                <p style={{ ...labelStyle, margin: '0 0 2px' }}>Gasto total</p>
                                                <p style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: C.ink, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}>{brl(acc.totalSpent)}</p>
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '8px' }}>
                                                <MetricTile label="Impressões" value={fmtInt(acc.totalImpressions)} />
                                                <MetricTile label="Cliques" value={fmtInt(acc.totalClicks)} />
                                                <MetricTile label="CTR" value={`${fmtDec(acc.ctr, 2)}%`} />
                                                <MetricTile label="Conversões" value={fmtInt(acc.totalConversions)} color={acc.totalConversions > 0 ? C.positive : undefined} />
                                                <MetricTile label="CPA" value={acc.cpa > 0 ? brl(acc.cpa) : '—'} />
                                                <MetricTile label="CPC" value={acc.totalClicks > 0 ? brl(acc.cpc) : '—'} />
                                            </div>
                                            {rev && rev.totalRevenue > 0 && (
                                                <div style={{ marginTop: '10px', background: C.sunken, borderRadius: '10px', padding: '12px', border: `1px solid ${C.line}` }}>
                                                    <p style={{ ...labelStyle, margin: '0 0 8px' }}>Faturamento via UTM</p>
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                                        <div>
                                                            <p style={{ margin: 0, fontSize: '11px', fontWeight: 700, color: C.positive }}>Pago</p>
                                                            <p style={{ margin: '2px 0 0', fontSize: '14px', fontWeight: 700, color: C.ink, fontVariantNumeric: 'tabular-nums' }}>{brl(rev.paidRevenue)}</p>
                                                            <p style={{ margin: '1px 0 0', fontSize: '11px', color: C.muted }}>{plural(rev.paidOrders, 'pedido', 'pedidos')}</p>
                                                        </div>
                                                        <div>
                                                            <p style={{ margin: 0, fontSize: '11px', fontWeight: 700, color: C.negative }}>Não pago</p>
                                                            <p style={{ margin: '2px 0 0', fontSize: '14px', fontWeight: 700, color: C.ink, fontVariantNumeric: 'tabular-nums' }}>{brl(rev.unpaidRevenue)}</p>
                                                            <p style={{ margin: '1px 0 0', fontSize: '11px', color: C.muted }}>{plural(rev.totalOrders - rev.paidOrders, 'pedido', 'pedidos')}</p>
                                                        </div>
                                                    </div>
                                                    <div style={{ marginTop: '10px', height: '4px', background: C.negativeSoft, borderRadius: '4px', overflow: 'hidden' }}>
                                                        <div style={{ width: `${paidPct}%`, height: '100%', background: C.positive, borderRadius: '4px', transition: 'width 0.4s' }} />
                                                    </div>
                                                    <p style={{ margin: '4px 0 0', fontSize: '11px', fontWeight: 700, color: C.positive, textAlign: 'right' }}>{fmtDec(paidPct, 0)}% pago</p>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            )
                        })}
                    </div>

                    {connectedTaboola.length > 1 && (
                        <div style={{
                            marginTop: '14px', padding: '16px 20px', background: C.ink, borderRadius: '12px',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px',
                        }}>
                            <div>
                                <p style={{ ...labelStyle, color: C.onInkMuted }}>Total Taboola · todas as contas</p>
                                <p style={{ margin: '4px 0 0', fontSize: '22px', fontWeight: 700, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>{brl(taboolaSpent || 0)}</p>
                            </div>
                            <div style={{ display: 'flex', gap: '24px' }}>
                                <div style={{ textAlign: 'right' }}>
                                    <p style={{ ...labelStyle, color: C.onInkMuted }}>Conversões</p>
                                    <p style={{ margin: '2px 0 0', fontSize: '16px', fontWeight: 700, color: taboolaTotalConversions > 0 ? C.onInkPositive : '#fff', fontVariantNumeric: 'tabular-nums' }}>{fmtInt(taboolaTotalConversions)}</p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <p style={{ ...labelStyle, color: C.onInkMuted }}>CPA médio</p>
                                    <p style={{ margin: '2px 0 0', fontSize: '16px', fontWeight: 700, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>
                                        {taboolaTotalConversions > 0 ? brl((taboolaSpent || 0) / taboolaTotalConversions) : '—'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </SectionCard>
            )}
        </>
    )
}
