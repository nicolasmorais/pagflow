'use client'

import {
    AreaChart, Area, BarChart, Bar,
    PieChart, Pie, Cell, XAxis, YAxis,
    CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import {
    DollarSign, TrendingUp, ShoppingBag, CheckCircle2,
    XCircle, Clock, Ticket, Zap, ArrowUpRight, ArrowDownRight,
    Package, MapPin, Activity, BarChart3, Target,
    Sunrise, Sun, Sunset, Moon, Trophy
} from 'lucide-react'
import type { AnalyticsData } from './types'

const fmt = (v: number | undefined | null) => (v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmtShort = (v: number | undefined | null) => {
    const n = v || 0
    return n >= 1000
        ? `R$ ${(n / 1000).toLocaleString('pt-BR', { minimumFractionDigits: 1 })}k`
        : `R$ ${fmt(n)}`
}
const fmtInt = (v: number) => v.toLocaleString('pt-BR')

function pctChange(current: number, prev: number): { value: string; positive: boolean } | null {
    if (prev === 0 && current === 0) return null
    if (prev === 0) return { value: '+100%', positive: true }
    const pct = ((current - prev) / prev) * 100
    return {
        value: `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`,
        positive: pct >= 0
    }
}

// ── Custom Tooltips ────────────────────────────────────────────────────────────
const RevenueTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
        <div style={{ background: '#14151F', border: '1px solid #E5E7EF', borderRadius: '12px', padding: '10px 14px', boxShadow: '0 12px 32px rgba(0,0,0,0.35)' }}>
            <p style={{ margin: '0 0 6px', fontSize: '10px', color: '#6E7180', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</p>
            {payload.map((entry: any) => (
                <p key={entry.name} style={{ margin: '2px 0', fontSize: '12px', fontWeight: 800, color: entry.color }}>
                    {entry.name === 'revenue' ? `R$ ${fmt(entry.value)}` : `${entry.value} pedidos`}
                </p>
            ))}
        </div>
    )
}

const BarTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
        <div style={{ background: '#14151F', border: '1px solid #E5E7EF', borderRadius: '10px', padding: '8px 12px', boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}>
            <p style={{ margin: '0 0 2px', fontSize: '10px', color: '#6E7180', fontWeight: 700 }}>{label}</p>
            <p style={{ margin: 0, fontSize: '12px', fontWeight: 800, color: payload[0].fill || '#2C5C86' }}>
                {payload[0].name === 'revenue' ? `R$ ${fmt(payload[0].value)}` : payload[0].value}
            </p>
        </div>
    )
}

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KpiCard({ icon: Icon, label, value, change, featured }: {
    icon: any; label: string; value: string; featured?: boolean
    change?: { value: string; positive: boolean } | null
}) {
    return (
        <div style={{
            background: featured ? '#14151F' : '#FFFFFF',
            border: featured ? 'none' : '1px solid #E5E7EF',
            borderRadius: '14px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: featured
                ? '0 4px 20px rgba(20,21,31,0.15)'
                : '0 1px 3px rgba(0,0,0,0.02)',
        }}>
            {featured && (
                <div style={{
                    position: 'absolute', top: '-30px', right: '-30px',
                    width: '120px', height: '120px',
                    background: 'radial-gradient(circle, rgba(44,92,134,0.12) 0%, transparent 70%)',
                    borderRadius: '50%', pointerEvents: 'none',
                }} />
            )}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{
                    width: '40px', height: '40px', borderRadius: '10px',
                    background: featured ? 'rgba(44,92,134,0.2)' : '#F5F6F9',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: featured ? '1px solid rgba(44,92,134,0.15)' : '1px solid #E5E7EF',
                }}>
                    <Icon size={18} strokeWidth={2} color={featured ? '#7BB8E0' : '#2C5C86'} />
                </div>
                {change && (
                    <span style={{
                        fontSize: '11px', fontWeight: 700,
                        color: change.positive ? (featured ? '#34d399' : '#1E7A52') : '#B23B32',
                        background: change.positive
                            ? (featured ? 'rgba(52,211,153,0.12)' : '#E3F4EA')
                            : (featured ? 'rgba(178,59,50,0.12)' : '#FBEAE8'),
                        padding: '4px 10px', borderRadius: '8px',
                        display: 'flex', alignItems: 'center', gap: '4px',
                    }}>
                        {change.positive ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                        {change.value}
                    </span>
                )}
            </div>

            <div>
                <p style={{
                    margin: '0 0 6px', fontSize: '10.5px', fontWeight: 700,
                    color: featured ? 'rgba(255,255,255,0.4)' : '#6E7180',
                    textTransform: 'uppercase', letterSpacing: '0.08em',
                }}>{label}</p>
                <p style={{
                    margin: 0, fontSize: featured ? '28px' : '24px', fontWeight: 700,
                    color: featured ? '#fff' : '#14151F',
                    letterSpacing: '-0.04em', lineHeight: 1,
                    fontFamily: "'Fraunces', serif",
                }}>{value}</p>
            </div>
        </div>
    )
}

function SectionCard({ title, subtitle, children, style }: {
    title: string; subtitle?: string; children: React.ReactNode; style?: React.CSSProperties
}) {
    return (
        <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EF', borderRadius: '14px', padding: '22px', ...style }}>
            <div style={{ marginBottom: '20px' }}>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#14151F', fontFamily: "'Fraunces', serif", letterSpacing: '-0.005em' }}>{title}</h3>
                {subtitle && <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#6E7180', fontWeight: 500 }}>{subtitle}</p>}
            </div>
            {children}
        </div>
    )
}

// ── Heatmap Cell ──────────────────────────────────────────────────────────────
function HeatmapCell({ value, max }: { value: number; max: number }) {
    const intensity = max > 0 ? value / max : 0
    const bg = intensity === 0 ? '#F5F6F9'
        : intensity < 0.25 ? '#E7F1F8'
        : intensity < 0.5 ? '#7BB8E0'
        : intensity < 0.75 ? '#2C5C86'
        : '#1a3a5c'
    return (
        <div style={{
            background: bg, borderRadius: '4px', height: '24px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '9px', fontWeight: 700,
            color: intensity > 0.5 ? '#fff' : '#6E7180',
        }}>
            {value > 0 ? value : ''}
        </div>
    )
}

// ── Status Badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
    const styles: Record<string, { bg: string; color: string; label: string }> = {
        pago: { bg: '#E3F4EA', color: '#1E7A52', label: 'Pago' },
        aguardando: { bg: '#FEF3C7', color: '#92400E', label: 'Aguardando' },
        processando: { bg: '#FEF3C7', color: '#92400E', label: 'Processando' },
        recusado: { bg: '#FBEAE8', color: '#B23B32', label: 'Recusado' },
        pendente: { bg: '#F5F6F9', color: '#6E7180', label: 'Pendente' },
    }
    const s = styles[status] || styles.pendente
    return (
        <span style={{ fontSize: '10px', fontWeight: 700, color: s.color, background: s.bg, padding: '3px 8px', borderRadius: '6px' }}>
            {s.label}
        </span>
    )
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function AnalyticsCharts({ data }: { data: AnalyticsData }) {
    if (!data) return <div style={{ padding: '40px', textAlign: 'center', color: '#6E7180' }}>Carregando dados...</div>

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

    const PIE_COLORS = ['#14151F', '#2C5C86', '#6E7180', '#A0A8B8']
    const SHIFT_ICONS: Record<string, any> = { madrugada: Moon, manha: Sunrise, tarde: Sun, noite: Sunset }

    return (
        <>
            {/* ── KPI Grid ── */}
            <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '24px' }}>
                <KpiCard featured icon={DollarSign} label="Faturamento" value={`R$ ${fmt(kpis.totalRevenue)}`}
                    change={pctChange(kpis.totalRevenue, prevKpis.totalRevenue)} />
                <KpiCard icon={TrendingUp} label="Lucro" value={`R$ ${fmt(kpis.profit)}`} />
                <KpiCard icon={ShoppingBag} label="Pedidos" value={fmtInt(kpis.totalOrders)}
                    change={pctChange(kpis.totalOrders, prevKpis.totalOrders)} />
                <KpiCard icon={CheckCircle2} label="Pagos" value={fmtInt(kpis.paidOrders)}
                    change={pctChange(kpis.paidOrders, prevKpis.paidOrders)} />
                <KpiCard icon={TrendingUp} label="Conversão" value={`${kpis.conversionRate.toFixed(1)}%`}
                    change={pctChange(kpis.conversionRate, prevKpis.conversionRate)} />
                <KpiCard icon={Ticket} label="Ticket Médio" value={`R$ ${fmt(kpis.avgTicket)}`}
                    change={pctChange(kpis.avgTicket, prevKpis.avgTicket)} />
                <KpiCard icon={XCircle} label="Recusados" value={fmtInt(kpis.rejectedOrders)} />
            </div>

            {/* ── Taboola KPI Grid ── */}
            {taboolaKpis && (
                <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '24px' }}>
                    <div style={{
                        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                        borderRadius: '14px', padding: '20px',
                        display: 'flex', flexDirection: 'column', gap: '14px',
                        position: 'relative', overflow: 'hidden',
                        boxShadow: '0 4px 20px rgba(15,23,42,0.15)',
                    }}>
                        <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', background: 'radial-gradient(circle, rgba(66,133,244,0.15) 0%, transparent 70%)', borderRadius: '50%' }} />
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(66,133,244,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(66,133,244,0.1)' }}>
                                <Target size={18} strokeWidth={2} color="#7BB8E0" />
                            </div>
                            <span style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Taboola</span>
                        </div>
                        <div>
                            <p style={{ margin: '0 0 6px', fontSize: '10.5px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Gasto Total</p>
                            <p style={{ margin: 0, fontSize: '28px', fontWeight: 700, color: '#fff', letterSpacing: '-0.04em', lineHeight: 1, fontFamily: "'Fraunces', serif" }}>R$ {fmt(taboolaKpis.totalSpent)}</p>
                        </div>
                    </div>
                    <KpiCard icon={Target} label="Conversões" value={fmtInt(taboolaKpis.totalConversions)} />
                    <KpiCard icon={DollarSign} label="CPA" value={taboolaKpis.avgCpa > 0 ? `R$ ${fmt(taboolaKpis.avgCpa)}` : '—'} />
                    <KpiCard icon={TrendingUp} label="ROAS" value={`${taboolaKpis.roas.toFixed(2)}x`} />
                    <KpiCard icon={Activity} label="Faturamento UTM" value={`R$ ${fmt(taboolaKpis.paidRevenue)}`} />
                    <KpiCard icon={BarChart3} label="Impressões" value={fmtInt(taboolaKpis.totalImpressions)} />
                </div>
            )}

            {/* ── Revenue Chart + Recent Orders ── */}
            <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <SectionCard title="Receita Diária" subtitle="Evolução financeira nos últimos 30 dias">
                    <ResponsiveContainer width="100%" height={240}>
                        <AreaChart data={dailyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#2C5C86" stopOpacity={0.12} />
                                    <stop offset="95%" stopColor="#2C5C86" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EF" vertical={false} />
                            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6E7180', fontWeight: 600 }} tickLine={false} axisLine={false} interval={4} />
                            <YAxis tick={{ fontSize: 10, fill: '#6E7180' }} tickLine={false} axisLine={false} tickFormatter={v => v >= 1000 ? `${v / 1000}k` : v} />
                            <Tooltip content={<RevenueTooltip />} />
                            <Area type="monotone" dataKey="revenue" name="revenue" stroke="#2C5C86" strokeWidth={2.5} fill="url(#revenueGrad)" dot={false} />
                        </AreaChart>
                    </ResponsiveContainer>
                    <div style={{ marginTop: '12px', borderTop: '1px solid #E5E7EF', paddingTop: '12px' }}>
                        <p style={{ fontSize: '10px', fontWeight: 700, color: '#6E7180', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 8px' }}>Pedidos Pagos por Dia</p>
                        <ResponsiveContainer width="100%" height={50}>
                            <BarChart data={dailyData} margin={{ top: 0, right: 4, left: -20, bottom: 0 }}>
                                <XAxis dataKey="date" hide />
                                <YAxis hide />
                                <Tooltip content={<BarTooltip />} />
                                <Bar dataKey="paidOrders" name="paidOrders" fill="#14151F" radius={[3, 3, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </SectionCard>

                <SectionCard title="Pedidos Recentes" subtitle="Últimas 5 movimentações">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {recentOrders.length === 0 ? (
                            <p style={{ textAlign: 'center', color: '#6E7180', fontSize: '13px', padding: '24px 0' }}>Nenhum pedido no período</p>
                        ) : recentOrders.map(o => (
                            <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: '#F5F6F9', borderRadius: '10px', border: '1px solid #E5E7EF' }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ margin: 0, fontSize: '12px', fontWeight: 700, color: '#14151F', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.fullName}</p>
                                    <p style={{ margin: '2px 0 0', fontSize: '10px', color: '#6E7180', fontWeight: 600 }}>{o.createdAt}</p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <p style={{ margin: 0, fontSize: '12px', fontWeight: 700, color: '#14151F' }}>R$ {fmt(o.totalPrice)}</p>
                                    <StatusBadge status={o.paymentStatus} />
                                </div>
                            </div>
                        ))}
                    </div>
                </SectionCard>
            </div>

            {/* ── Hourly Heatmap + Weekday Chart ── */}
            <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <SectionCard title="Horários de Pico" subtitle="Pedidos por hora do dia">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '4px' }}>
                        {hourlyData.map(h => (
                            <div key={h.hour} style={{ textAlign: 'center' }}>
                                <HeatmapCell value={h.orders} max={maxHourly} />
                                <span style={{ fontSize: '8px', color: '#6E7180', fontWeight: 600, marginTop: '2px', display: 'block' }}>{h.hour}</span>
                            </div>
                        ))}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px', marginTop: '10px' }}>
                        <span style={{ fontSize: '9px', color: '#6E7180', fontWeight: 600 }}>Menos</span>
                        {['#F5F6F9', '#E7F1F8', '#7BB8E0', '#2C5C86', '#1a3a5c'].map(c => (
                            <div key={c} style={{ width: '12px', height: '12px', borderRadius: '3px', background: c }} />
                        ))}
                        <span style={{ fontSize: '9px', color: '#6E7180', fontWeight: 600 }}>Mais</span>
                    </div>
                </SectionCard>

                <SectionCard title="Receita por Dia da Semana" subtitle="Distribuição semanal">
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={weekdayData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EF" vertical={false} />
                            <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#14151F', fontWeight: 700 }} tickLine={false} axisLine={false} />
                            <YAxis tick={{ fontSize: 10, fill: '#6E7180' }} tickLine={false} axisLine={false} tickFormatter={v => v >= 1000 ? `${v / 1000}k` : v} />
                            <Tooltip content={<BarTooltip />} />
                            <Bar dataKey="revenue" name="revenue" fill="#2C5C86" radius={[6, 6, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </SectionCard>
            </div>

            {/* ── Turnos + Top Horários ── */}
            <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <SectionCard title="Vendas por Turno" subtitle={`${bestShift.label} é o turno com mais vendas pagas`}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {shiftData.map(s => {
                            const Icon = SHIFT_ICONS[s.shift] || Clock
                            const isBest = s.shift === bestShift.shift && bestShift.paid > 0
                            return (
                                <div key={s.shift} style={{
                                    padding: '12px', borderRadius: '12px',
                                    background: isBest ? '#14151F' : '#F5F6F9',
                                    border: isBest ? 'none' : '1px solid #E5E7EF',
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={{
                                                width: '28px', height: '28px', borderRadius: '8px',
                                                background: isBest ? 'rgba(123,184,224,0.15)' : '#FFFFFF',
                                                border: isBest ? '1px solid rgba(123,184,224,0.2)' : '1px solid #E5E7EF',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            }}>
                                                <Icon size={14} color={isBest ? '#7BB8E0' : '#2C5C86'} />
                                            </div>
                                            <div>
                                                <p style={{ margin: 0, fontSize: '12px', fontWeight: 700, color: isBest ? '#fff' : '#14151F' }}>{s.label}</p>
                                                <p style={{ margin: 0, fontSize: '9px', color: isBest ? 'rgba(255,255,255,0.4)' : '#6E7180', fontWeight: 600 }}>{s.range}</p>
                                            </div>
                                            {isBest && (
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '9px', fontWeight: 700, color: '#34d399', background: 'rgba(52,211,153,0.12)', padding: '3px 7px', borderRadius: '6px' }}>
                                                    <Trophy size={10} /> Top
                                                </span>
                                            )}
                                        </div>
                                        <span style={{ fontSize: '13px', fontWeight: 700, color: isBest ? '#fff' : '#14151F' }}>R$ {fmt(s.revenue)}</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '6px' }}>
                                        <span style={{ fontSize: '10px', fontWeight: 700, color: '#1E7A52', background: isBest ? 'rgba(52,211,153,0.12)' : '#E3F4EA', padding: '3px 8px', borderRadius: '6px' }}>{s.paid} pagas</span>
                                        <span style={{ fontSize: '10px', fontWeight: 700, color: '#92400E', background: isBest ? 'rgba(217,119,6,0.15)' : '#FEF3C7', padding: '3px 8px', borderRadius: '6px' }}>{s.pending} aguard.</span>
                                        <span style={{ fontSize: '10px', fontWeight: 700, color: '#B23B32', background: isBest ? 'rgba(178,59,50,0.15)' : '#FBEAE8', padding: '3px 8px', borderRadius: '6px' }}>{s.rejected} recus.</span>
                                        <span style={{ fontSize: '10px', fontWeight: 700, color: isBest ? 'rgba(255,255,255,0.5)' : '#6E7180', background: isBest ? 'rgba(255,255,255,0.08)' : '#FFFFFF', border: isBest ? 'none' : '1px solid #E5E7EF', padding: '3px 8px', borderRadius: '6px' }}>{s.total} total</span>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </SectionCard>

                <SectionCard title="Top Horários de Vendas" subtitle="Horas com mais pedidos, por status">
                    {topHours.every(h => h.total === 0) ? (
                        <p style={{ textAlign: 'center', color: '#6E7180', fontSize: '13px', padding: '24px 0' }}>Sem dados no período</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {topHours.map((h, i) => (
                                <div key={h.hour}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                                            <span style={{
                                                width: '22px', height: '22px', borderRadius: '6px',
                                                background: i === 0 ? '#14151F' : i === 1 ? '#2C5C86' : '#6E7180',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: '10px', fontWeight: 700, color: 'white', flexShrink: 0
                                            }}>{i + 1}</span>
                                            <span style={{ fontSize: '13px', fontWeight: 700, color: '#14151F' }}>{h.hour}</span>
                                        </div>
                                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#1E7A52', whiteSpace: 'nowrap' }}>R$ {fmt(h.revenue)}</span>
                                    </div>
                                    <div style={{ width: '100%', height: '6px', background: '#F5F6F9', borderRadius: '3px', overflow: 'hidden', display: 'flex' }}>
                                        <div style={{ width: `${(h.paid / maxTopHour) * 100}%`, height: '100%', background: '#1E7A52' }} />
                                        <div style={{ width: `${(h.pending / maxTopHour) * 100}%`, height: '100%', background: '#d97706' }} />
                                        <div style={{ width: `${(h.rejected / maxTopHour) * 100}%`, height: '100%', background: '#B23B32' }} />
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                                        <span style={{ fontSize: '10px', color: '#1E7A52', fontWeight: 600 }}>{h.paid} pagas</span>
                                        <span style={{ fontSize: '10px', color: '#92400E', fontWeight: 600 }}>{h.pending} aguard.</span>
                                        <span style={{ fontSize: '10px', color: '#B23B32', fontWeight: 600 }}>{h.rejected} recus.</span>
                                        <span style={{ fontSize: '10px', color: '#6E7180', fontWeight: 600, marginLeft: 'auto' }}>{h.total} total</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </SectionCard>
            </div>

            {/* ── Status + Payment Methods + Installments ── */}
            <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: '14px', marginBottom: '14px' }}>
                {/* Status Breakdown */}
                <SectionCard title="Status dos Pedidos" subtitle="Distribuição no período">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {statusBreakdown.map(s => (
                            <div key={s.status} style={{ padding: '12px', background: '#F5F6F9', borderRadius: '10px', border: '1px solid #E5E7EF' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: s.color }} />
                                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#14151F' }}>{s.label}</span>
                                    </div>
                                    <span style={{ fontSize: '14px', fontWeight: 700, color: s.color }}>{s.count}</span>
                                </div>
                                <div style={{ width: '100%', height: '4px', background: '#E5E7EF', borderRadius: '2px', overflow: 'hidden' }}>
                                    <div style={{ width: `${s.percentage}%`, height: '100%', background: s.color, borderRadius: '2px', transition: 'width 0.5s ease' }} />
                                </div>
                                <p style={{ margin: '4px 0 0', fontSize: '10px', color: '#6E7180', fontWeight: 600, textAlign: 'right' }}>{s.percentage}%</p>
                            </div>
                        ))}
                    </div>
                </SectionCard>

                {/* Payment Methods */}
                <SectionCard title="Método de Pagamento" subtitle="Pedidos pagos">
                    {paymentMethods.every(m => m.count === 0) ? (
                        <p style={{ textAlign: 'center', color: '#6E7180', fontSize: '13px', padding: '24px 0' }}>Sem dados</p>
                    ) : (
                        <>
                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                                <ResponsiveContainer width="100%" height={150}>
                                    <PieChart>
                                        <Pie
                                            data={paymentMethods.filter(m => m.count > 0)}
                                            dataKey="count" nameKey="label"
                                            cx="50%" cy="50%"
                                            innerRadius={42} outerRadius={62} paddingAngle={4}
                                        >
                                            {paymentMethods.map((_, i) => (
                                                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(val: any, name: any) => [`${val} pedidos`, name]} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
                                {paymentMethods.filter(m => m.count > 0).map((m, i) => (
                                    <div key={m.method} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', background: '#F5F6F9', borderRadius: '8px' }}>
                                        <span style={{ width: '8px', height: '8px', borderRadius: '3px', background: PIE_COLORS[i], flexShrink: 0 }} />
                                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#6E7180', flex: 1 }}>{m.label}</span>
                                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#14151F' }}>{m.count}</span>
                                        <span style={{ fontSize: '10px', color: '#6E7180', fontWeight: 600 }}>{m.percentage}%</span>
                                    </div>
                                ))}
                            </div>
                            {cardBrands.length > 0 && (
                                <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #E5E7EF' }}>
                                    <p style={{ margin: '0 0 6px', fontSize: '10px', fontWeight: 700, color: '#6E7180', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Bandeiras</p>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                        {cardBrands.map(b => (
                                            <span key={b.brand} style={{ fontSize: '10px', fontWeight: 700, color: '#2C5C86', background: '#E7F1F8', padding: '3px 8px', borderRadius: '12px' }}>
                                                {b.brand} ({b.count})
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </SectionCard>

                {/* Installments */}
                <SectionCard title="Parcelamentos" subtitle="Pedidos no cartão">
                    {installments.length === 0 ? (
                        <p style={{ textAlign: 'center', color: '#6E7180', fontSize: '13px', padding: '24px 0' }}>Sem dados</p>
                    ) : (
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={installments} layout="vertical" margin={{ top: 0, right: 8, left: 8, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EF" horizontal={false} />
                                <XAxis type="number" tick={{ fontSize: 10, fill: '#6E7180' }} tickLine={false} axisLine={false} />
                                <YAxis type="category" dataKey="label" tick={{ fontSize: 11, fill: '#14151F', fontWeight: 700 }} tickLine={false} axisLine={false} width={28} />
                                <Tooltip content={<BarTooltip />} />
                                <Bar dataKey="count" name="count" fill="#14151F" radius={[0, 6, 6, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </SectionCard>
            </div>

            {/* ── Top Products + Top States ── */}
            <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <SectionCard title="Top Produtos" subtitle="Por faturamento">
                    {topProducts.length === 0 ? (
                        <p style={{ textAlign: 'center', color: '#6E7180', fontSize: '13px', padding: '24px 0' }}>Sem dados</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {topProducts.map((p, i) => (
                                <div key={i}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                                            <span style={{
                                                width: '22px', height: '22px', borderRadius: '6px',
                                                background: i === 0 ? '#14151F' : i === 1 ? '#2C5C86' : '#6E7180',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: '10px', fontWeight: 700, color: 'white', flexShrink: 0
                                            }}>{i + 1}</span>
                                            <span style={{ fontSize: '12px', fontWeight: 700, color: '#14151F', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                                        </div>
                                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#1E7A52', whiteSpace: 'nowrap' }}>{fmtShort(p.revenue)}</span>
                                    </div>
                                    <div style={{ width: '100%', height: '5px', background: '#F5F6F9', borderRadius: '3px', overflow: 'hidden' }}>
                                        <div style={{ width: `${Math.round((p.revenue / maxProduct) * 100)}%`, height: '100%', background: i === 0 ? '#14151F' : i === 1 ? '#2C5C86' : '#6E7180', borderRadius: '3px' }} />
                                    </div>
                                    <span style={{ fontSize: '10px', color: '#6E7180', fontWeight: 600 }}>{p.count} vendas</span>
                                </div>
                            ))}
                        </div>
                    )}
                </SectionCard>

                <SectionCard title="Top Estados" subtitle="Por faturamento">
                    {topStates.length === 0 ? (
                        <p style={{ textAlign: 'center', color: '#6E7180', fontSize: '13px', padding: '24px 0' }}>Sem dados geográficos</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {topStates.map((s, i) => (
                                <div key={s.state}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ fontSize: '10px', fontWeight: 700, color: '#6E7180', width: '14px' }}>{i + 1}</span>
                                            <span style={{ fontSize: '11px', fontWeight: 700, color: '#2C5C86', background: '#E7F1F8', padding: '2px 7px', borderRadius: '5px' }}>{s.state}</span>
                                            <span style={{ fontSize: '10px', color: '#6E7180', fontWeight: 600 }}>{s.count} pedidos</span>
                                        </div>
                                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#1E7A52' }}>R$ {fmt(s.revenue)}</span>
                                    </div>
                                    <div style={{ width: '100%', height: '4px', background: '#F5F6F9', borderRadius: '2px', overflow: 'hidden' }}>
                                        <div style={{ width: `${Math.round((s.revenue / maxState) * 100)}%`, height: '100%', background: '#2C5C86', borderRadius: '2px' }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </SectionCard>
            </div>

            {/* ── Order Bump Analysis ── */}
            <SectionCard title="Análise de Order Bumps" subtitle="Impacto no ticket médio e receita" style={{ marginBottom: '14px' }}>
                <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                    <div style={{ background: '#F5F6F9', borderRadius: '14px', padding: '16px', border: '1px solid #E5E7EF' }}>
                        <p style={{ margin: '0 0 8px', fontSize: '10px', fontWeight: 700, color: '#2C5C86', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Com Bump</p>
                        <p style={{ margin: '0 0 2px', fontSize: '24px', fontWeight: 700, color: '#14151F', fontFamily: "'Fraunces', serif" }}>{bumpStats.withBump}</p>
                        <p style={{ margin: 0, fontSize: '11px', color: '#6E7180', fontWeight: 600 }}>pedidos pagos</p>
                        <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #E5E7EF' }}>
                            <p style={{ margin: '0 0 2px', fontSize: '10px', color: '#6E7180', fontWeight: 700, textTransform: 'uppercase' }}>Ticket Médio</p>
                            <p style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#2C5C86', fontFamily: "'Fraunces', serif" }}>R$ {fmt(bumpStats.bumpAvgTicket)}</p>
                        </div>
                    </div>
                    <div style={{ background: '#F5F6F9', borderRadius: '14px', padding: '16px', border: '1px solid #E5E7EF' }}>
                        <p style={{ margin: '0 0 8px', fontSize: '10px', fontWeight: 700, color: '#6E7180', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Sem Bump</p>
                        <p style={{ margin: '0 0 2px', fontSize: '24px', fontWeight: 700, color: '#14151F', fontFamily: "'Fraunces', serif" }}>{bumpStats.withoutBump}</p>
                        <p style={{ margin: 0, fontSize: '11px', color: '#6E7180', fontWeight: 600 }}>pedidos pagos</p>
                        <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #E5E7EF' }}>
                            <p style={{ margin: '0 0 2px', fontSize: '10px', color: '#6E7180', fontWeight: 700, textTransform: 'uppercase' }}>Ticket Médio</p>
                            <p style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#6E7180', fontFamily: "'Fraunces', serif" }}>R$ {fmt(bumpStats.nonBumpAvgTicket)}</p>
                        </div>
                    </div>
                    <div style={{ background: '#F5F6F9', borderRadius: '14px', padding: '16px', border: '1px solid #E5E7EF' }}>
                        <p style={{ margin: '0 0 8px', fontSize: '10px', fontWeight: 700, color: '#1E7A52', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Receita Total</p>
                        <p style={{ margin: '0 0 2px', fontSize: '16px', fontWeight: 700, color: '#2C5C86', fontFamily: "'Fraunces', serif" }}>R$ {fmt(bumpStats.bumpRevenue)}</p>
                        <p style={{ margin: '0 0 8px', fontSize: '10px', color: '#6E7180', fontWeight: 600 }}>com bump</p>
                        <div style={{ width: '100%', height: '6px', background: '#E5E7EF', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{
                                width: `${(bumpStats.bumpRevenue + bumpStats.nonBumpRevenue) > 0 ? Math.round((bumpStats.bumpRevenue / (bumpStats.bumpRevenue + bumpStats.nonBumpRevenue)) * 100) : 0}%`,
                                height: '100%', background: '#2C5C86', borderRadius: '3px'
                            }} />
                        </div>
                        <p style={{ margin: '6px 0 0', fontSize: '10px', color: '#6E7180', fontWeight: 600 }}>
                            R$ {fmt(bumpStats.nonBumpRevenue)} sem bump
                        </p>
                    </div>
                </div>
            </SectionCard>

            {/* ── Taboola Accounts ── */}
            {taboolaAccounts && taboolaAccounts.length > 0 && (
                <SectionCard
                    title="Contas Taboola"
                    subtitle={`Performance por conta — ${taboolaAccounts.filter(a => !a.error).length} de ${taboolaAccounts.length} conectadas`}
                    style={{ marginBottom: '14px' }}
                >
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '14px' }}>
                        {taboolaAccounts.map((acc, i) => {
                            const colors = ['#4285f4', '#8b5cf6', '#f97316']
                            const accent = colors[i % colors.length]
                            return (
                                <div key={acc.accountId} style={{
                                    background: acc.error
                                        ? 'linear-gradient(145deg, #fef2f2, #fff1f2)'
                                        : 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
                                    border: acc.error ? '1px solid #fecaca' : '1px solid rgba(241,245,249,0.8)',
                                    borderRadius: '18px', padding: '20px',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.02), 0 4px 12px rgba(0,0,0,0.03)',
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                                        <div style={{
                                            width: '36px', height: '36px', borderRadius: '10px',
                                            background: acc.error ? '#fecaca' : `${accent}18`,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                        }}>
                                            <Target size={16} color={acc.error ? '#dc2626' : accent} />
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <p style={{ margin: 0, fontSize: '13px', fontWeight: 800, color: acc.error ? '#991b1b' : '#0f172a' }}>{acc.label}</p>
                                            <p style={{ margin: '2px 0 0', fontSize: '10px', color: '#94a3b8', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{acc.accountId}</p>
                                        </div>
                                        {acc.error ? (
                                            <span style={{ fontSize: '9px', fontWeight: 700, color: '#dc2626', background: '#fef2f2', padding: '3px 8px', borderRadius: '6px', border: '1px solid #fecaca' }}>Erro</span>
                                        ) : (
                                            <span style={{ fontSize: '9px', fontWeight: 700, color: '#059669', background: '#ecfdf5', padding: '3px 8px', borderRadius: '6px' }}>Conectada</span>
                                        )}
                                    </div>

                                    {acc.error ? (
                                        <p style={{ margin: 0, fontSize: '12px', color: '#b91c1c', fontWeight: 500 }}>{acc.error}</p>
                                    ) : (
                                        <>
                                            <div style={{ marginBottom: '14px' }}>
                                                <p style={{ margin: '0 0 2px', fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Gasto Total</p>
                                                <p style={{ margin: 0, fontSize: '24px', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em', fontFamily: "'Space Grotesk', sans-serif" }}>R$ {fmt(acc.totalSpent)}</p>
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                                                <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '10px', border: '1px solid #f1f5f9' }}>
                                                    <p style={{ margin: 0, fontSize: '9px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Impressões</p>
                                                    <p style={{ margin: '4px 0 0', fontSize: '14px', fontWeight: 900, color: '#1e293b', fontFamily: "'Space Grotesk', sans-serif" }}>{fmtInt(acc.totalImpressions)}</p>
                                                </div>
                                                <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '10px', border: '1px solid #f1f5f9' }}>
                                                    <p style={{ margin: 0, fontSize: '9px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cliques</p>
                                                    <p style={{ margin: '4px 0 0', fontSize: '14px', fontWeight: 900, color: '#1e293b', fontFamily: "'Space Grotesk', sans-serif" }}>{fmtInt(acc.totalClicks)}</p>
                                                </div>
                                                <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '10px', border: '1px solid #f1f5f9' }}>
                                                    <p style={{ margin: 0, fontSize: '9px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>CTR</p>
                                                    <p style={{ margin: '4px 0 0', fontSize: '14px', fontWeight: 900, color: '#1e293b', fontFamily: "'Space Grotesk', sans-serif" }}>{acc.ctr.toFixed(2)}%</p>
                                                </div>
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginTop: '8px' }}>
                                                <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '10px', border: '1px solid #f1f5f9' }}>
                                                    <p style={{ margin: 0, fontSize: '9px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Conversões</p>
                                                    <p style={{ margin: '4px 0 0', fontSize: '14px', fontWeight: 900, color: acc.totalConversions > 0 ? '#059669' : '#1e293b', fontFamily: "'Space Grotesk', sans-serif" }}>{fmtInt(acc.totalConversions)}</p>
                                                </div>
                                                <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '10px', border: '1px solid #f1f5f9' }}>
                                                    <p style={{ margin: 0, fontSize: '9px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>CPA</p>
                                                    <p style={{ margin: '4px 0 0', fontSize: '14px', fontWeight: 900, color: '#1e293b', fontFamily: "'Space Grotesk', sans-serif" }}>{acc.cpa > 0 ? `R$ ${fmt(acc.cpa)}` : '—'}</p>
                                                </div>
                                                <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '10px', border: '1px solid #f1f5f9' }}>
                                                    <p style={{ margin: 0, fontSize: '9px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>CPC</p>
                                                    <p style={{ margin: '4px 0 0', fontSize: '14px', fontWeight: 900, color: '#1e293b', fontFamily: "'Space Grotesk', sans-serif" }}>R$ {fmt(acc.cpc)}</p>
                                                </div>
                                            </div>
                                            {(() => {
                                                const rev = taboolaRevenue?.find(r => r.accountId === acc.accountId)
                                                if (!rev || rev.totalRevenue === 0) return null
                                                const paidPct = rev.totalRevenue > 0 ? (rev.paidRevenue / rev.totalRevenue) * 100 : 0
                                                return (
                                                    <div style={{ marginTop: '10px', background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)', borderRadius: '12px', padding: '12px', border: '1px solid #bbf7d0' }}>
                                                        <p style={{ margin: '0 0 8px', fontSize: '9px', fontWeight: 700, color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Faturamento via UTM</p>
                                                        <div style={{ display: 'flex', gap: '8px' }}>
                                                            <div style={{ flex: 1, background: '#fff', borderRadius: '8px', padding: '8px 10px', border: '1px solid #dcfce7' }}>
                                                                <p style={{ margin: 0, fontSize: '9px', fontWeight: 700, color: '#16a34a' }}>Pago</p>
                                                                <p style={{ margin: '2px 0 0', fontSize: '14px', fontWeight: 900, color: '#15803d', fontFamily: "'Space Grotesk', sans-serif" }}>R$ {fmt(rev.paidRevenue)}</p>
                                                                <p style={{ margin: '1px 0 0', fontSize: '9px', color: '#86efac' }}>{rev.paidOrders} pedidos</p>
                                                            </div>
                                                            <div style={{ flex: 1, background: '#fff', borderRadius: '8px', padding: '8px 10px', border: '1px solid #fee2e2' }}>
                                                                <p style={{ margin: 0, fontSize: '9px', fontWeight: 700, color: '#ef4444' }}>Não Pago</p>
                                                                <p style={{ margin: '2px 0 0', fontSize: '14px', fontWeight: 900, color: '#b91c1c', fontFamily: "'Space Grotesk', sans-serif" }}>R$ {fmt(rev.unpaidRevenue)}</p>
                                                                <p style={{ margin: '1px 0 0', fontSize: '9px', color: '#fca5a5' }}>{rev.totalOrders - rev.paidOrders} pedidos</p>
                                                            </div>
                                                        </div>
                                                        <div style={{ marginTop: '8px', height: '4px', background: '#fecaca', borderRadius: '4px', overflow: 'hidden' }}>
                                                            <div style={{ width: `${paidPct}%`, height: '100%', background: '#22c55e', borderRadius: '4px', transition: 'width 0.4s' }} />
                                                        </div>
                                                        <p style={{ margin: '4px 0 0', fontSize: '10px', fontWeight: 700, color: '#15803d', textAlign: 'right' }}>{paidPct.toFixed(0)}% pago</p>
                                                    </div>
                                                )
                                            })()}
                                        </>
                                    )}
                                </div>
                            )
                        })}
                    </div>

                    {taboolaAccounts.filter(a => !a.error).length > 1 && (
                        <div style={{
                            marginTop: '14px', padding: '16px 20px',
                            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                            borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            boxShadow: '0 8px 32px rgba(15,23,42,0.2)',
                        }}>
                            <div>
                                <p style={{ margin: 0, fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total Taboola (todas as contas)</p>
                                <p style={{ margin: '4px 0 0', fontSize: '22px', fontWeight: 900, color: '#fff', fontFamily: "'Space Grotesk', sans-serif" }}>R$ {fmt(taboolaSpent || 0)}</p>
                            </div>
                            <div style={{ display: 'flex', gap: '20px' }}>
                                <div style={{ textAlign: 'right' }}>
                                    <p style={{ margin: 0, fontSize: '9px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Conversões</p>
                                    <p style={{ margin: '2px 0 0', fontSize: '16px', fontWeight: 900, color: '#34d399', fontFamily: "'Space Grotesk', sans-serif" }}>{fmtInt(taboolaAccounts.reduce((s, a) => s + a.totalConversions, 0))}</p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <p style={{ margin: 0, fontSize: '9px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>CPA Médio</p>
                                    <p style={{ margin: '2px 0 0', fontSize: '16px', fontWeight: 900, color: '#fff', fontFamily: "'Space Grotesk', sans-serif" }}>
                                        {(() => { const totalConv = taboolaAccounts.reduce((s, a) => s + a.totalConversions, 0); return totalConv > 0 ? `R$ ${fmt((taboolaSpent || 0) / totalConv)}` : '—' })()}
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
