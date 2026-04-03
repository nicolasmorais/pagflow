'use client'

import {
    AreaChart, Area, BarChart, Bar,
    PieChart, Pie, Cell, XAxis, YAxis,
    CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import {
    DollarSign, TrendingUp, ShoppingBag, CheckCircle2,
    XCircle, Clock, ShoppingCart, Ticket, Zap, Wallet,
    ArrowUpRight, Package, MapPin
} from 'lucide-react'
import type { AnalyticsData } from './types'

const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmtShort = (v: number) => v >= 1000
    ? `R$ ${(v / 1000).toLocaleString('pt-BR', { minimumFractionDigits: 1 })}k`
    : `R$ ${fmt(v)}`

// ── Custom tooltip ────────────────────────────────────────────────────────────
const RevenueTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '12px 16px', boxShadow: '0 8px 24px rgba(0,0,0,0.25)' }}>
            <p style={{ margin: '0 0 8px', fontSize: '11px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>{label}</p>
            {payload.map((entry: any) => (
                <p key={entry.name} style={{ margin: '2px 0', fontSize: '13px', fontWeight: 800, color: entry.color }}>
                    {entry.name === 'revenue' ? `R$ ${fmt(entry.value)}` : `${entry.value} pedidos`}
                </p>
            ))}
        </div>
    )
}

const BarTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '10px 14px' }}>
            <p style={{ margin: '0 0 4px', fontSize: '11px', color: '#94a3b8', fontWeight: 700 }}>{label}</p>
            <p style={{ margin: 0, fontSize: '13px', fontWeight: 800, color: payload[0].fill }}>
                {payload[0].name === 'revenue' ? `R$ ${fmt(payload[0].value)}` : payload[0].value}
            </p>
        </div>
    )
}

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KpiCard({ icon: Icon, label, value, gradient, shadow, sub, badge }: {
    icon: any; label: string; value: string; gradient: string; shadow: string; sub?: string; badge?: { text: string; color: string; bg: string }
}) {
    return (
        <div className="analytics-kpi-card">
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '11px', background: gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 12px ${shadow}` }}>
                    <Icon size={18} color="white" strokeWidth={2.2} />
                </div>
                {badge && (
                    <span style={{ fontSize: '10px', fontWeight: 800, color: badge.color, background: badge.bg, padding: '3px 8px', borderRadius: '8px' }}>
                        {badge.text}
                    </span>
                )}
            </div>
            <p style={{ margin: '0 0 2px', fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
            <p style={{ margin: 0, fontSize: '22px', fontWeight: 900, color: '#1e293b', letterSpacing: '-0.03em', lineHeight: 1.1 }}>{value}</p>
            {sub && <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>{sub}</p>}
        </div>
    )
}

// ── Section Card wrapper ──────────────────────────────────────────────────────
function SectionCard({ title, subtitle, children, style }: { title: string; subtitle?: string; children: React.ReactNode; style?: React.CSSProperties }) {
    return (
        <div className="analytics-card" style={style}>
            <div style={{ marginBottom: '20px' }}>
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#1e293b' }}>{title}</h3>
                {subtitle && <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#94a3b8', fontWeight: 500 }}>{subtitle}</p>}
            </div>
            {children}
        </div>
    )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function AnalyticsCharts({ data }: { data: AnalyticsData }) {
    const { kpis, dailyData, paymentMethods, installments, cardBrands, topProducts, topStates, statusBreakdown, bumpStats, checkoutAccess } = data

    const maxState = topStates[0]?.revenue || 1
    const maxProduct = topProducts[0]?.revenue || 1

    const PIE_COLORS = ['#10b981', '#3b82f6']
    const funnelTotal = kpis.abandonedOrders + kpis.pendingOrders + kpis.paidOrders + kpis.rejectedOrders || 1
    const funnelSteps = [
        { label: 'Iniciaram checkout', count: funnelTotal, color: '#6366f1', pct: 100 },
        { label: 'Não abandonaram', count: kpis.totalOrders, color: '#3b82f6', pct: Math.round((kpis.totalOrders / funnelTotal) * 100) },
        { label: 'Pagamento pago', count: kpis.paidOrders, color: '#10b981', pct: Math.round((kpis.paidOrders / funnelTotal) * 100) },
    ]

    return (
        <>
            {/* ── KPI Grid ── */}
            <div className="analytics-kpi-grid">
                <KpiCard icon={DollarSign} label="Faturamento" value={`R$ ${fmt(kpis.totalRevenue)}`} gradient="linear-gradient(135deg,#10b981,#059669)" shadow="rgba(16,185,129,0.3)" sub={kpis.netRevenue > 0 ? `Líq. R$ ${fmt(kpis.netRevenue)}` : undefined} />
                <KpiCard icon={ShoppingBag} label="Total de Pedidos" value={String(kpis.totalOrders)} gradient="linear-gradient(135deg,#3b82f6,#2563eb)" shadow="rgba(59,130,246,0.3)" />
                <KpiCard icon={CheckCircle2} label="Pagos" value={String(kpis.paidOrders)} gradient="linear-gradient(135deg,#6366f1,#4f46e5)" shadow="rgba(99,102,241,0.3)" />
                <KpiCard icon={ShoppingCart} label="Abandonados" value={String(kpis.abandonedOrders)} gradient="linear-gradient(135deg,#f59e0b,#d97706)" shadow="rgba(245,158,11,0.3)" />
                <KpiCard icon={TrendingUp} label="Conversão" value={`${kpis.conversionRate.toFixed(1)}%`} gradient="linear-gradient(135deg,#0ea5e9,#2563eb)" shadow="rgba(14,165,233,0.3)" badge={kpis.conversionRate >= 50 ? { text: '✓ Ótimo', color: '#15803d', bg: '#dcfce7' } : undefined} />
                <KpiCard icon={Ticket} label="Ticket Médio" value={`R$ ${fmt(kpis.avgTicket)}`} gradient="linear-gradient(135deg,#8b5cf6,#6d28d9)" shadow="rgba(139,92,246,0.3)" />
                <KpiCard icon={XCircle} label="Recusados" value={String(kpis.rejectedOrders)} gradient="linear-gradient(135deg,#ef4444,#dc2626)" shadow="rgba(239,68,68,0.3)" />
                <KpiCard icon={Zap} label="Taxa Order Bump" value={`${kpis.bumpRate.toFixed(1)}%`} gradient="linear-gradient(135deg,#f97316,#ea580c)" shadow="rgba(249,115,22,0.3)" sub={`${bumpStats.withBump} pedidos com bump`} />
            </div>

            {/* ── Revenue Chart + Funnel ── */}
            <div className="analytics-2col-wide">
                <SectionCard title="Receita Diária" subtitle="Últimos 30 dias">
                    <ResponsiveContainer width="100%" height={220}>
                        <AreaChart data={dailyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="ordersGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} tickLine={false} axisLine={false} interval={4} />
                            <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} tickFormatter={v => v >= 1000 ? `${v / 1000}k` : v} />
                            <Tooltip content={<RevenueTooltip />} />
                            <Area type="monotone" dataKey="revenue" name="revenue" stroke="#6366f1" strokeWidth={2.5} fill="url(#revenueGrad)" dot={false} activeDot={{ r: 5, fill: '#6366f1' }} />
                        </AreaChart>
                    </ResponsiveContainer>

                    {/* Orders bar below */}
                    <div style={{ marginTop: '12px', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                        <p style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>Pedidos por dia</p>
                        <ResponsiveContainer width="100%" height={70}>
                            <BarChart data={dailyData} margin={{ top: 0, right: 4, left: -20, bottom: 0 }}>
                                <XAxis dataKey="date" hide />
                                <YAxis hide />
                                <Tooltip content={<BarTooltip />} />
                                <Bar dataKey="paidOrders" name="paidOrders" fill="#10b981" radius={[3, 3, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </SectionCard>

                <SectionCard title="Funil de Conversão" subtitle="Total acumulado">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {funnelSteps.map((step, i) => (
                            <div key={i}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>{step.label}</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontSize: '13px', fontWeight: 900, color: step.color }}>{step.count}</span>
                                        <span style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8' }}>{step.pct}%</span>
                                    </div>
                                </div>
                                <div style={{ width: '100%', height: '10px', background: '#f1f5f9', borderRadius: '6px', overflow: 'hidden' }}>
                                    <div style={{ width: `${step.pct}%`, height: '100%', background: step.color, borderRadius: '6px', transition: 'width 0.5s ease' }} />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Status breakdown */}
                    <div style={{ marginTop: '24px', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
                        <p style={{ margin: '0 0 12px', fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Distribuição de status</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {statusBreakdown.map(s => (
                                <div key={s.status} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                                    <span style={{ fontSize: '12px', color: '#475569', fontWeight: 600, flex: 1 }}>{s.label}</span>
                                    <span style={{ fontSize: '12px', fontWeight: 800, color: s.color }}>{s.count}</span>
                                    <span style={{ fontSize: '10px', color: '#94a3b8', width: '32px', textAlign: 'right' }}>{s.percentage}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </SectionCard>
            </div>

            {/* ── Payment Methods + Installments + Top Products ── */}
            <div className="analytics-3col">
                {/* Payment methods */}
                <SectionCard title="Método de Pagamento" subtitle="Pedidos pagos">
                    {paymentMethods.every(m => m.count === 0) ? (
                        <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '13px', padding: '24px 0' }}>Sem dados</p>
                    ) : (
                        <>
                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                                <ResponsiveContainer width="100%" height={160}>
                                    <PieChart>
                                        <Pie
                                            data={paymentMethods.filter(m => m.count > 0)}
                                            dataKey="count"
                                            nameKey="label"
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={48}
                                            outerRadius={70}
                                            paddingAngle={3}
                                        >
                                            {paymentMethods.map((_, i) => (
                                                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(val: any, name: any) => [`${val} pedidos`, name]} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
                                {paymentMethods.filter(m => m.count > 0).map((m, i) => (
                                    <div key={m.method} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: PIE_COLORS[i], flexShrink: 0 }} />
                                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569', flex: 1 }}>{m.label}</span>
                                        <span style={{ fontSize: '12px', fontWeight: 900, color: '#1e293b' }}>{m.count}</span>
                                        <span style={{ fontSize: '11px', color: '#94a3b8', width: '34px', textAlign: 'right' }}>{m.percentage}%</span>
                                    </div>
                                ))}
                            </div>
                            {cardBrands.length > 0 && (
                                <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
                                    <p style={{ margin: '0 0 8px', fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Bandeiras</p>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                        {cardBrands.map(b => (
                                            <span key={b.brand} style={{ fontSize: '11px', fontWeight: 700, color: '#3b82f6', background: '#eff6ff', padding: '3px 9px', borderRadius: '7px', border: '1px solid #bfdbfe' }}>
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
                                <Bar dataKey="count" name="count" fill="#6366f1" radius={[0, 6, 6, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </SectionCard>

                {/* Top products */}
                <SectionCard title="Top Produtos" subtitle="Por faturamento">
                    {topProducts.length === 0 ? (
                        <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '13px', padding: '24px 0' }}>Sem dados</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {topProducts.map((p, i) => (
                                <div key={i}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '6px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                                            <span style={{ width: '20px', height: '20px', borderRadius: '6px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 900, color: '#64748b', flexShrink: 0 }}>
                                                {i + 1}
                                            </span>
                                            <span style={{ fontSize: '12px', fontWeight: 700, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {p.name}
                                            </span>
                                        </div>
                                        <span style={{ fontSize: '12px', fontWeight: 900, color: '#059669', whiteSpace: 'nowrap' }}>
                                            {fmtShort(p.revenue)}
                                        </span>
                                    </div>
                                    <div style={{ width: '100%', height: '6px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                                        <div style={{ width: `${Math.round((p.revenue / maxProduct) * 100)}%`, height: '100%', background: `hsl(${220 + i * 20}, 80%, 55%)`, borderRadius: '4px' }} />
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3px' }}>
                                        <span style={{ fontSize: '10px', color: '#94a3b8' }}>{p.count} vendas</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </SectionCard>
            </div>

            {/* ── States + Bump Stats ── */}
            <div className="analytics-2col">
                {/* Top States */}
                <SectionCard title="Top Estados" subtitle="Por faturamento (pedidos pagos)">
                    {topStates.length === 0 ? (
                        <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '13px', padding: '24px 0' }}>Sem dados geográficos</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {topStates.map((s, i) => (
                                <div key={s.state}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ fontSize: '10px', fontWeight: 900, color: '#94a3b8', width: '16px' }}>{i + 1}</span>
                                            <span style={{ fontSize: '12px', fontWeight: 800, color: '#1e293b', background: '#f1f5f9', padding: '2px 8px', borderRadius: '5px' }}>{s.state}</span>
                                            <span style={{ fontSize: '11px', color: '#94a3b8' }}>{s.count} pedidos</span>
                                        </div>
                                        <span style={{ fontSize: '12px', fontWeight: 900, color: '#059669' }}>R$ {fmt(s.revenue)}</span>
                                    </div>
                                    <div style={{ width: '100%', height: '7px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                                        <div style={{
                                            width: `${Math.round((s.revenue / maxState) * 100)}%`, height: '100%',
                                            background: `linear-gradient(90deg, #6366f1, #8b5cf6)`, borderRadius: '4px'
                                        }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </SectionCard>

                {/* Bump Stats */}
                <SectionCard title="Análise de Order Bumps" subtitle="Impacto no ticket médio">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                        {[
                            { label: 'Com Bump', count: bumpStats.withBump, avgTicket: bumpStats.bumpAvgTicket, revenue: bumpStats.bumpRevenue, color: '#6366f1', bg: '#eef2ff' },
                            { label: 'Sem Bump', count: bumpStats.withoutBump, avgTicket: bumpStats.nonBumpAvgTicket, revenue: bumpStats.nonBumpRevenue, color: '#94a3b8', bg: '#f8fafc' },
                        ].map(b => (
                            <div key={b.label} style={{ background: b.bg, borderRadius: '12px', padding: '16px', border: `1px solid ${b.color}20` }}>
                                <p style={{ margin: '0 0 8px', fontSize: '11px', fontWeight: 800, color: b.color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{b.label}</p>
                                <p style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: 900, color: '#1e293b' }}>{b.count}</p>
                                <p style={{ margin: 0, fontSize: '11px', color: '#64748b', fontWeight: 600 }}>pedidos pagos</p>
                                <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: `1px solid ${b.color}20` }}>
                                    <p style={{ margin: '0 0 2px', fontSize: '10px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Ticket Médio</p>
                                    <p style={{ margin: 0, fontSize: '14px', fontWeight: 900, color: b.color }}>R$ {fmt(b.avgTicket)}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Bump revenue bar */}
                    {(bumpStats.bumpRevenue + bumpStats.nonBumpRevenue) > 0 && (
                        <>
                            <p style={{ margin: '0 0 10px', fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                Receita com bump vs sem bump
                            </p>
                            <div style={{ display: 'flex', height: '12px', borderRadius: '8px', overflow: 'hidden', background: '#f1f5f9' }}>
                                <div style={{
                                    width: `${Math.round((bumpStats.bumpRevenue / (bumpStats.bumpRevenue + bumpStats.nonBumpRevenue)) * 100)}%`,
                                    background: 'linear-gradient(90deg,#6366f1,#8b5cf6)', transition: 'width 0.5s'
                                }} />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                                <span style={{ fontSize: '11px', fontWeight: 700, color: '#6366f1' }}>
                                    R$ {fmt(bumpStats.bumpRevenue)} ({Math.round((bumpStats.bumpRevenue / (bumpStats.bumpRevenue + bumpStats.nonBumpRevenue)) * 100)}%)
                                </span>
                                <span style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8' }}>
                                    R$ {fmt(bumpStats.nonBumpRevenue)}
                                </span>
                            </div>
                        </>
                    )}

                    {bumpStats.withBump === 0 && bumpStats.withoutBump === 0 && (
                        <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '13px', padding: '16px 0 0' }}>Sem pedidos pagos ainda</p>
                    )}
                </SectionCard>
            </div>

            {/* ── Funnel Section ── */}
            <SectionCard title="Funil de Conversão" subtitle="Etapas do checkout">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>Acesso ao checkout</span>
                        <span style={{ fontSize: '14px', fontWeight: 800, color: '#6366f1' }}>{checkoutAccess.total}</span>
                    </div>
                    {[
                        { step: 'Dados do cliente', count: checkoutAccess.funnel.step1, color: '#6366f1', pct: checkoutAccess.total > 0 ? Math.round((checkoutAccess.funnel.step1 / checkoutAccess.total) * 100) : 0 },
                        { step: 'Entrega', count: checkoutAccess.funnel.step2, color: '#3b82f6', pct: checkoutAccess.total > 0 ? Math.round((checkoutAccess.funnel.step2 / checkoutAccess.total) * 100) : 0 },
                        { step: 'Pagamento', count: checkoutAccess.funnel.step3, color: '#10b981', pct: checkoutAccess.total > 0 ? Math.round((checkoutAccess.funnel.step3 / checkoutAccess.total) * 100) : 0 },
                        { step: 'Pago', count: checkoutAccess.funnel.payment, color: '#059669', pct: checkoutAccess.total > 0 ? Math.round((checkoutAccess.funnel.payment / checkoutAccess.total) * 100) : 0 },
                    ].map((item, i) => (
                        <div key={i}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                <span style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>{item.step}</span>
                                <span style={{ fontSize: '13px', fontWeight: 800, color: item.color }}>{item.count} ({item.pct}%)</span>
                            </div>
                            <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{
                                    width: `${item.pct}%`,
                                    height: '100%',
                                    background: item.color,
                                    transition: 'width 0.5s'
                                }} />
                            </div>
                        </div>
                    ))}
                </div>
            </SectionCard>

            {/* ── Checkout Access Section ── */}
            <div className="analytics-2col-wide">
                <SectionCard title="Acessos ao Checkout" subtitle="Visitantes e conversão">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '16px' }}>
                        <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                            <p style={{ margin: '0 0 4px', fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Total de Acessos</p>
                            <p style={{ margin: 0, fontSize: '24px', fontWeight: 900, color: '#1e293b' }}>{checkoutAccess.total}</p>
                        </div>
                        <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                            <p style={{ margin: '0 0 4px', fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Conversão</p>
                            <p style={{ margin: 0, fontSize: '24px', fontWeight: 900, color: checkoutAccess.conversionRate >= 50 ? '#10b981' : '#f59e0b' }}>
                                {checkoutAccess.conversionRate.toFixed(1)}%
                            </p>
                        </div>
                    </div>

                    {checkoutAccess.dailyAccess.length > 0 && (
                        <ResponsiveContainer width="100%" height={180}>
                            <AreaChart data={checkoutAccess.dailyAccess} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="accessGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} tickLine={false} axisLine={false} interval={4} />
                                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                                <Tooltip content={<BarTooltip />} />
                                <Area type="monotone" dataKey="count" name="accesses" stroke="#3b82f6" strokeWidth={2.5} fill="url(#accessGrad)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </SectionCard>

                <SectionCard title="Origem dos Acessos" subtitle="Por fonte UTM">
                    {checkoutAccess.bySource.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {checkoutAccess.bySource.slice(0, 5).map((item, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#f8fafc', borderRadius: '8px' }}>
                                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>{item.source}</span>
                                    <span style={{ fontSize: '13px', fontWeight: 800, color: '#3b82f6' }}>{item.count}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '13px', padding: '20px 0' }}>Sem dados de acesso</p>
                    )}
                </SectionCard>
            </div>

            <div className="analytics-2col-wide">
                <SectionCard title="Por Produto">
                    {checkoutAccess.byProduct.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {checkoutAccess.byProduct.slice(0, 5).map((item, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#f8fafc', borderRadius: '8px' }}>
                                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>{item.productName}</span>
                                    <span style={{ fontSize: '13px', fontWeight: 800, color: '#6366f1' }}>{item.count}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '13px', padding: '20px 0' }}>Sem dados</p>
                    )}
                </SectionCard>

                <SectionCard title="Campanhas">
                    {checkoutAccess.byCampaign.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {checkoutAccess.byCampaign.slice(0, 5).map((item, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#f8fafc', borderRadius: '8px' }}>
                                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>{item.campaign}</span>
                                    <span style={{ fontSize: '13px', fontWeight: 800, color: '#10b981' }}>{item.count}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '13px', padding: '20px 0' }}>Sem dados</p>
                    )}
                </SectionCard>
            </div>
        </>
    )
}
