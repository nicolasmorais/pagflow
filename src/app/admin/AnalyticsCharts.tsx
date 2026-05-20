'use client'

import {
    AreaChart, Area, BarChart, Bar,
    PieChart, Pie, Cell, XAxis, YAxis,
    CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import {
    DollarSign, TrendingUp, ShoppingBag, CheckCircle2,
    XCircle, Clock, Ticket, Zap, ArrowUpRight, ArrowDownRight,
    Package, MapPin, Activity, BarChart3
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
        <div style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '10px 14px', boxShadow: '0 12px 32px rgba(0,0,0,0.35)' }}>
            <p style={{ margin: '0 0 6px', fontSize: '10px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</p>
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
        <div style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '8px 12px', boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}>
            <p style={{ margin: '0 0 2px', fontSize: '10px', color: '#64748b', fontWeight: 700 }}>{label}</p>
            <p style={{ margin: 0, fontSize: '12px', fontWeight: 800, color: payload[0].fill || '#6366f1' }}>
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
            background: '#fff',
            border: '1px solid #f1f5f9',
            borderRadius: featured ? '20px' : '16px',
            padding: featured ? '24px' : '18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            transition: 'all 0.2s ease',
            position: 'relative',
            overflow: 'hidden',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{
                    width: featured ? '42px' : '36px',
                    height: featured ? '42px' : '36px',
                    borderRadius: '10px',
                    background: featured ? '#0f172a' : '#f8fafc',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: featured ? '#fff' : '#64748b',
                }}>
                    <Icon size={featured ? 20 : 17} strokeWidth={2} />
                </div>
                {change && (
                    <span style={{
                        fontSize: '11px', fontWeight: 700,
                        color: change.positive ? '#059669' : '#dc2626',
                        background: change.positive ? '#ecfdf5' : '#fef2f2',
                        padding: '3px 8px', borderRadius: '6px',
                        display: 'flex', alignItems: 'center', gap: '2px',
                    }}>
                        {change.positive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                        {change.value}
                    </span>
                )}
            </div>
            <div>
                <p style={{ margin: '0 0 4px', fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
                <p style={{ margin: 0, fontSize: featured ? '28px' : '22px', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em', lineHeight: 1.1 }}>{value}</p>
            </div>
        </div>
    )
}

function SectionCard({ title, subtitle, children, style }: {
    title: string; subtitle?: string; children: React.ReactNode; style?: React.CSSProperties
}) {
    return (
        <div style={{ background: '#fff', border: '1px solid #f1f5f9', borderRadius: '18px', padding: '22px', ...style }}>
            <div style={{ marginBottom: '20px' }}>
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.01em' }}>{title}</h3>
                {subtitle && <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#94a3b8', fontWeight: 500 }}>{subtitle}</p>}
            </div>
            {children}
        </div>
    )
}

// ── Heatmap Cell ──────────────────────────────────────────────────────────────
function HeatmapCell({ value, max }: { value: number; max: number }) {
    const intensity = max > 0 ? value / max : 0
    const bg = intensity === 0 ? '#f8fafc'
        : intensity < 0.25 ? '#e0e7ff'
        : intensity < 0.5 ? '#a5b4fc'
        : intensity < 0.75 ? '#6366f1'
        : '#4338ca'
    return (
        <div style={{
            background: bg,
            borderRadius: '4px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '9px',
            fontWeight: 700,
            color: intensity > 0.5 ? '#fff' : '#64748b',
            transition: 'all 0.15s',
        }}>
            {value > 0 ? value : ''}
        </div>
    )
}

// ── Status Badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
    const styles: Record<string, { bg: string; color: string; label: string }> = {
        pago: { bg: '#dcfce7', color: '#16a34a', label: 'Pago' },
        aguardando: { bg: '#fef3c7', color: '#d97706', label: 'Aguardando' },
        processando: { bg: '#fef3c7', color: '#d97706', label: 'Processando' },
        recusado: { bg: '#fee2e2', color: '#dc2626', label: 'Recusado' },
        pendente: { bg: '#f1f5f9', color: '#64748b', label: 'Pendente' },
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
    if (!data) return <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Carregando dados...</div>

    const {
        kpis, dailyData, paymentMethods, installments,
        cardBrands, topProducts, topStates, statusBreakdown, bumpStats,
        hourlyData, weekdayData, recentOrders, prevKpis
    } = data

    const maxState = topStates[0]?.revenue || 1
    const maxProduct = topProducts[0]?.revenue || 1
    const maxHourly = Math.max(...hourlyData.map(h => h.orders), 1)
    const maxWeekday = Math.max(...weekdayData.map(d => d.revenue), 1)

    const PIE_COLORS = ['#0F172A', '#6366f1', '#94A3B8', '#CBD5E1']

    return (
        <>
            {/* ── KPI Grid ── */}
            <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '24px' }}>
                <KpiCard featured icon={DollarSign} label="Faturamento" value={`R$ ${fmt(kpis.totalRevenue)}`}
                    change={pctChange(kpis.totalRevenue, prevKpis.totalRevenue)} />
                <KpiCard icon={ShoppingBag} label="Pedidos" value={fmtInt(kpis.totalOrders)}
                    change={pctChange(kpis.totalOrders, prevKpis.totalOrders)} />
                <KpiCard icon={CheckCircle2} label="Pagos" value={fmtInt(kpis.paidOrders)}
                    change={pctChange(kpis.paidOrders, prevKpis.paidOrders)} />
                <KpiCard icon={TrendingUp} label="Conversão" value={`${kpis.conversionRate.toFixed(1)}%`}
                    change={pctChange(kpis.conversionRate, prevKpis.conversionRate)} />
                <KpiCard icon={Ticket} label="Ticket Médio" value={`R$ ${fmt(kpis.avgTicket)}`}
                    change={pctChange(kpis.avgTicket, prevKpis.avgTicket)} />
                <KpiCard icon={XCircle} label="Recusados" value={fmtInt(kpis.rejectedOrders)} />
                <KpiCard icon={Zap} label="Bump Rate" value={`${kpis.bumpRate.toFixed(1)}%`} />
            </div>

            {/* ── Revenue Chart + Recent Orders ── */}
            <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <SectionCard title="Receita Diária" subtitle="Evolução financeira nos últimos 30 dias">
                    <ResponsiveContainer width="100%" height={240}>
                        <AreaChart data={dailyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.12} />
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} tickLine={false} axisLine={false} interval={4} />
                            <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} tickFormatter={v => v >= 1000 ? `${v / 1000}k` : v} />
                            <Tooltip content={<RevenueTooltip />} />
                            <Area type="monotone" dataKey="revenue" name="revenue" stroke="#6366f1" strokeWidth={2.5} fill="url(#revenueGrad)" dot={false} />
                        </AreaChart>
                    </ResponsiveContainer>
                    <div style={{ marginTop: '12px', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                        <p style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 8px' }}>Pedidos Pagos por Dia</p>
                        <ResponsiveContainer width="100%" height={50}>
                            <BarChart data={dailyData} margin={{ top: 0, right: 4, left: -20, bottom: 0 }}>
                                <XAxis dataKey="date" hide />
                                <YAxis hide />
                                <Tooltip content={<BarTooltip />} />
                                <Bar dataKey="paidOrders" name="paidOrders" fill="#0F172A" radius={[3, 3, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </SectionCard>

                <SectionCard title="Pedidos Recentes" subtitle="Últimas 5 movimentações">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {recentOrders.length === 0 ? (
                            <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '13px', padding: '24px 0' }}>Nenhum pedido no período</p>
                        ) : recentOrders.map(o => (
                            <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ margin: 0, fontSize: '12px', fontWeight: 700, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.fullName}</p>
                                    <p style={{ margin: '2px 0 0', fontSize: '10px', color: '#94a3b8', fontWeight: 600 }}>{o.createdAt}</p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <p style={{ margin: 0, fontSize: '12px', fontWeight: 800, color: '#0f172a' }}>R$ {fmt(o.totalPrice)}</p>
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
                                <span style={{ fontSize: '8px', color: '#94a3b8', fontWeight: 600, marginTop: '2px', display: 'block' }}>{h.hour}</span>
                            </div>
                        ))}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px', marginTop: '10px' }}>
                        <span style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 600 }}>Menos</span>
                        {['#f8fafc', '#e0e7ff', '#a5b4fc', '#6366f1', '#4338ca'].map(c => (
                            <div key={c} style={{ width: '12px', height: '12px', borderRadius: '3px', background: c }} />
                        ))}
                        <span style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 600 }}>Mais</span>
                    </div>
                </SectionCard>

                <SectionCard title="Receita por Dia da Semana" subtitle="Distribuição semanal">
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={weekdayData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                            <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#475569', fontWeight: 700 }} tickLine={false} axisLine={false} />
                            <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} tickFormatter={v => v >= 1000 ? `${v / 1000}k` : v} />
                            <Tooltip content={<BarTooltip />} />
                            <Bar dataKey="revenue" name="revenue" fill="#6366f1" radius={[6, 6, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </SectionCard>
            </div>

            {/* ── Status + Payment Methods + Installments ── */}
            <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: '14px', marginBottom: '14px' }}>
                {/* Status Breakdown */}
                <SectionCard title="Status dos Pedidos" subtitle="Distribuição no período">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {statusBreakdown.map(s => (
                            <div key={s.status} style={{ padding: '12px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: s.color }} />
                                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#1e293b' }}>{s.label}</span>
                                    </div>
                                    <span style={{ fontSize: '14px', fontWeight: 900, color: s.color }}>{s.count}</span>
                                </div>
                                <div style={{ width: '100%', height: '4px', background: '#e2e8f0', borderRadius: '2px', overflow: 'hidden' }}>
                                    <div style={{ width: `${s.percentage}%`, height: '100%', background: s.color, borderRadius: '2px', transition: 'width 0.5s ease' }} />
                                </div>
                                <p style={{ margin: '4px 0 0', fontSize: '10px', color: '#94a3b8', fontWeight: 600, textAlign: 'right' }}>{s.percentage}%</p>
                            </div>
                        ))}
                    </div>
                </SectionCard>

                {/* Payment Methods */}
                <SectionCard title="Método de Pagamento" subtitle="Pedidos pagos">
                    {paymentMethods.every(m => m.count === 0) ? (
                        <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '13px', padding: '24px 0' }}>Sem dados</p>
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
                                    <div key={m.method} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', background: '#f8fafc', borderRadius: '8px' }}>
                                        <span style={{ width: '8px', height: '8px', borderRadius: '3px', background: PIE_COLORS[i], flexShrink: 0 }} />
                                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569', flex: 1 }}>{m.label}</span>
                                        <span style={{ fontSize: '12px', fontWeight: 900, color: '#1e293b' }}>{m.count}</span>
                                        <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 700 }}>{m.percentage}%</span>
                                    </div>
                                ))}
                            </div>
                            {cardBrands.length > 0 && (
                                <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
                                    <p style={{ margin: '0 0 6px', fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Bandeiras</p>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                        {cardBrands.map(b => (
                                            <span key={b.brand} style={{ fontSize: '10px', fontWeight: 700, color: '#6366f1', background: '#eef2ff', padding: '3px 8px', borderRadius: '12px' }}>
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
                        <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '13px', padding: '24px 0' }}>Sem dados</p>
                    ) : (
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={installments} layout="vertical" margin={{ top: 0, right: 8, left: 8, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                                <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                                <YAxis type="category" dataKey="label" tick={{ fontSize: 11, fill: '#475569', fontWeight: 700 }} tickLine={false} axisLine={false} width={28} />
                                <Tooltip content={<BarTooltip />} />
                                <Bar dataKey="count" name="count" fill="#0f172a" radius={[0, 6, 6, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </SectionCard>
            </div>

            {/* ── Top Products + Top States ── */}
            <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <SectionCard title="Top Produtos" subtitle="Por faturamento">
                    {topProducts.length === 0 ? (
                        <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '13px', padding: '24px 0' }}>Sem dados</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {topProducts.map((p, i) => (
                                <div key={i}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                                            <span style={{
                                                width: '22px', height: '22px', borderRadius: '6px',
                                                background: i === 0 ? '#0f172a' : i === 1 ? '#475569' : '#94a3b8',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: '10px', fontWeight: 900, color: 'white', flexShrink: 0
                                            }}>{i + 1}</span>
                                            <span style={{ fontSize: '12px', fontWeight: 700, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                                        </div>
                                        <span style={{ fontSize: '12px', fontWeight: 900, color: '#059669', whiteSpace: 'nowrap' }}>{fmtShort(p.revenue)}</span>
                                    </div>
                                    <div style={{ width: '100%', height: '5px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                                        <div style={{ width: `${Math.round((p.revenue / maxProduct) * 100)}%`, height: '100%', background: i === 0 ? '#0f172a' : i === 1 ? '#475569' : '#94a3b8', borderRadius: '3px' }} />
                                    </div>
                                    <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600 }}>{p.count} vendas</span>
                                </div>
                            ))}
                        </div>
                    )}
                </SectionCard>

                <SectionCard title="Top Estados" subtitle="Por faturamento">
                    {topStates.length === 0 ? (
                        <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '13px', padding: '24px 0' }}>Sem dados geográficos</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {topStates.map((s, i) => (
                                <div key={s.state}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ fontSize: '10px', fontWeight: 900, color: '#94a3b8', width: '14px' }}>{i + 1}</span>
                                            <span style={{ fontSize: '11px', fontWeight: 800, color: '#6366f1', background: '#eef2ff', padding: '2px 7px', borderRadius: '5px' }}>{s.state}</span>
                                            <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600 }}>{s.count} pedidos</span>
                                        </div>
                                        <span style={{ fontSize: '11px', fontWeight: 900, color: '#059669' }}>R$ {fmt(s.revenue)}</span>
                                    </div>
                                    <div style={{ width: '100%', height: '4px', background: '#f1f5f9', borderRadius: '2px', overflow: 'hidden' }}>
                                        <div style={{ width: `${Math.round((s.revenue / maxState) * 100)}%`, height: '100%', background: '#6366f1', borderRadius: '2px' }} />
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
                    <div style={{ background: '#f8fafc', borderRadius: '14px', padding: '16px', border: '1px solid #f1f5f9' }}>
                        <p style={{ margin: '0 0 8px', fontSize: '10px', fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Com Bump</p>
                        <p style={{ margin: '0 0 2px', fontSize: '24px', fontWeight: 900, color: '#1e293b' }}>{bumpStats.withBump}</p>
                        <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>pedidos pagos</p>
                        <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #e2e8f0' }}>
                            <p style={{ margin: '0 0 2px', fontSize: '10px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Ticket Médio</p>
                            <p style={{ margin: 0, fontSize: '15px', fontWeight: 900, color: '#6366f1' }}>R$ {fmt(bumpStats.bumpAvgTicket)}</p>
                        </div>
                    </div>
                    <div style={{ background: '#f8fafc', borderRadius: '14px', padding: '16px', border: '1px solid #f1f5f9' }}>
                        <p style={{ margin: '0 0 8px', fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Sem Bump</p>
                        <p style={{ margin: '0 0 2px', fontSize: '24px', fontWeight: 900, color: '#1e293b' }}>{bumpStats.withoutBump}</p>
                        <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>pedidos pagos</p>
                        <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #e2e8f0' }}>
                            <p style={{ margin: '0 0 2px', fontSize: '10px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Ticket Médio</p>
                            <p style={{ margin: 0, fontSize: '15px', fontWeight: 900, color: '#64748b' }}>R$ {fmt(bumpStats.nonBumpAvgTicket)}</p>
                        </div>
                    </div>
                    <div style={{ background: '#f8fafc', borderRadius: '14px', padding: '16px', border: '1px solid #f1f5f9' }}>
                        <p style={{ margin: '0 0 8px', fontSize: '10px', fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Receita Total</p>
                        <p style={{ margin: '0 0 2px', fontSize: '14px', fontWeight: 900, color: '#6366f1' }}>R$ {fmt(bumpStats.bumpRevenue)}</p>
                        <p style={{ margin: '0 0 8px', fontSize: '10px', color: '#94a3b8', fontWeight: 600 }}>com bump</p>
                        <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{
                                width: `${(bumpStats.bumpRevenue + bumpStats.nonBumpRevenue) > 0 ? Math.round((bumpStats.bumpRevenue / (bumpStats.bumpRevenue + bumpStats.nonBumpRevenue)) * 100) : 0}%`,
                                height: '100%', background: '#6366f1', borderRadius: '3px'
                            }} />
                        </div>
                        <p style={{ margin: '6px 0 0', fontSize: '10px', color: '#94a3b8', fontWeight: 600 }}>
                            R$ {fmt(bumpStats.nonBumpRevenue)} sem bump
                        </p>
                    </div>
                </div>
            </SectionCard>
        </>
    )
}
