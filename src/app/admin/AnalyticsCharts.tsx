'use client'

import {
    AreaChart, Area, BarChart, Bar,
    PieChart, Pie, Cell, XAxis, YAxis,
    CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import {
    DollarSign, TrendingUp, ShoppingBag, CheckCircle2,
    XCircle, Clock, ShoppingCart, Ticket, Zap, Wallet,
    ArrowUpRight, Package, MapPin, Users, Target
} from 'lucide-react'
import type { AnalyticsData } from './types'

const fmt = (v: number | undefined | null) => (v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmtShort = (v: number | undefined | null) => {
    const n = v || 0
    return n >= 1000
        ? `R$ ${(n / 1000).toLocaleString('pt-BR', { minimumFractionDigits: 1 })}k`
        : `R$ ${fmt(n)}`
}

// ── Custom Tooltips ────────────────────────────────────────────────────────────
const RevenueTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
        <div style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '12px 16px', boxShadow: '0 12px 32px rgba(0,0,0,0.35)' }}>
            <p style={{ margin: '0 0 8px', fontSize: '10px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</p>
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
        <div style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '10px 14px', boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}>
            <p style={{ margin: '0 0 4px', fontSize: '10px', color: '#64748b', fontWeight: 700 }}>{label}</p>
            <p style={{ margin: 0, fontSize: '13px', fontWeight: 800, color: payload[0].fill || '#6366f1' }}>
                {payload[0].name === 'revenue' ? `R$ ${fmt(payload[0].value)}` : payload[0].value}
            </p>
        </div>
    )
}

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KpiCard({ icon: Icon, label, value, sub, badge, featured }: {
    icon: any; label: string; value: string; sub?: string; badge?: { text: string; color: string; bg: string }; featured?: boolean
}) {
    return (
        <div className="stark-card" style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            padding: featured ? '28px 24px' : '20px',
            background: '#ffffff',
            border: featured ? 'none' : '1px solid var(--admin-border)',
            borderRadius: featured ? '24px' : '18px',
            boxShadow: featured ? '0 12px 32px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04), inset 0 0 0 1px rgba(0,0,0,0.02)' : '0 1px 3px rgba(0, 0, 0, 0.04)',
            color: 'inherit',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {featured && (
                <div style={{ position: 'absolute', right: '-20px', top: '-20px', opacity: 0.03, pointerEvents: 'none', transform: 'scale(3)' }}>
                    <Icon size={120} strokeWidth={1} />
                </div>
            )}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: featured ? '20px' : '16px', position: 'relative', zIndex: 1 }}>
                <div style={{
                    width: featured ? '48px' : '38px',
                    height: featured ? '48px' : '38px',
                    borderRadius: featured ? '14px' : '12px',
                    background: featured ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'var(--admin-accent-light)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: featured ? '#ffffff' : 'var(--admin-accent)',
                    boxShadow: featured ? '0 6px 16px rgba(99,102,241,0.25)' : 'none'
                }}>
                    <Icon size={featured ? 24 : 18} strokeWidth={2.5} />
                </div>
                {badge && (
                    <span style={{ fontSize: '10px', fontWeight: 800, color: badge.color, background: badge.bg, padding: '4px 10px', borderRadius: '20px', border: `1px solid ${badge.color}15` }}>
                        {badge.text}
                    </span>
                )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', position: 'relative', zIndex: 1 }}>
                <span style={{ fontSize: featured ? '13px' : '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {label}
                </span>
                <div style={{
                    fontSize: featured ? 'clamp(32px, 4vw, 42px)' : 'clamp(22px, 2.5vw, 26px)',
                    fontWeight: 900,
                    color: '#0f172a',
                    letterSpacing: '-0.04em',
                    lineHeight: 1.1
                }}>
                    {value}
                </div>
            </div>

            {sub && (
                <div style={{ marginTop: 'auto', paddingTop: featured ? '16px' : '12px', position: 'relative', zIndex: 1 }}>
                    <div style={{ fontSize: featured ? '14px' : '12px', color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {featured ? <div style={{ fontSize: '11px', fontWeight: 800, background: '#e0e7ff', color: '#4338ca', padding: '2px 8px', borderRadius: '4px' }}>LÍQ</div> : null}
                        {featured ? sub.replace('Líq. ', '') : sub}
                    </div>
                </div>
            )}
        </div>
    )
}


function SectionCard({ title, subtitle, children, style, accent }: {
    title: string; subtitle?: string; children: React.ReactNode; style?: React.CSSProperties; accent?: string
}) {
    return (
        <div className="stark-card" style={{ ...style, position: 'relative', overflow: 'hidden' }}>
            {accent && (
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
                    background: accent
                }} />
            )}
            <div style={{ marginBottom: '24px' }}>
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 900, color: 'var(--admin-text-primary)', letterSpacing: '-0.01em' }}>{title}</h3>
                {subtitle && <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--admin-text-muted)', fontWeight: 500 }}>{subtitle}</p>}
            </div>
            {children}
        </div>
    )
}

// ── Funnel Bar ────────────────────────────────────────────────────────────────
function FunnelStep({ label, count, pct, color, icon }: { label: string; count: number; pct: number; color: string; icon: string }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 900, color: 'var(--admin-text-primary)' }}>{label}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 900, color: 'black' }}>{count}</span>
                    <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--admin-text-muted)', background: '#F1F5F9', padding: '2px 7px', borderRadius: '4px' }}>{pct}%</span>
                </div>
            </div>
            <div style={{ width: '100%', height: '8px', background: '#F1F5F9', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '4px', transition: 'width 0.6s ease' }} />
            </div>
        </div>
    )
}

// ── Source Row ────────────────────────────────────────────────────────────────
function SourceRow({ label, count, color, max }: { label: string; count: number; color: string; max: number }) {
    const pct = max > 0 ? Math.round((count / max) * 100) : 0
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: '#FFFFFF', borderRadius: '10px', border: '1px solid var(--admin-border)' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--admin-text-primary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
            <div style={{ width: '60px', height: '4px', background: '#F1F5F9', borderRadius: '4px', overflow: 'hidden', flexShrink: 0 }}>
                <div style={{ width: `${pct}%`, height: '100%', background: '#0F172A', borderRadius: '4px' }} />
            </div>
            <span style={{ fontSize: '13px', fontWeight: 900, color: 'var(--admin-text-primary)', flexShrink: 0, minWidth: '24px', textAlign: 'right' }}>{count}</span>
        </div>
    )
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function AnalyticsCharts({ data }: { data: AnalyticsData }) {
    if (!data) return <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Carregando dados...</div>
    const { kpis, dailyData, paymentMethods, installments, cardBrands, topProducts, topStates, statusBreakdown, bumpStats, checkoutAccess } = data

    const maxState = topStates[0]?.revenue || 1
    const maxProduct = topProducts[0]?.revenue || 1
    const maxSource = checkoutAccess.bySource[0]?.count || 1
    const maxCampaign = checkoutAccess.byCampaign[0]?.count || 1

    const PIE_COLORS = ['#0F172A', '#475569', '#94A3B8', '#CBD5E1']
    const funnelTotal = kpis.abandonedOrders + kpis.pendingOrders + kpis.paidOrders + kpis.rejectedOrders || 1
    const funnelSteps = [
        { label: 'Iniciaram checkout', count: funnelTotal, color: '#0F172A', pct: 100 },
        { label: 'Não abandonaram', count: kpis.totalOrders, color: '#475569', pct: Math.round((kpis.totalOrders / funnelTotal) * 100) },
        { label: 'Pagamento pago', count: kpis.paidOrders, color: '#0F172A', pct: Math.round((kpis.paidOrders / funnelTotal) * 100) },
    ]

    return (
        <>
            {/* ── KPI Grid ── */}
            <div className="analytics-kpi-grid">
                <KpiCard featured icon={DollarSign} label="Faturamento" value={`R$ ${fmt(kpis.totalRevenue)}`} sub={kpis.netRevenue > 0 ? `Líq. R$ ${fmt(kpis.netRevenue)}` : undefined} />
                <KpiCard icon={ShoppingBag} label="Total de Pedidos" value={String(kpis.totalOrders)} />
                <KpiCard icon={CheckCircle2} label="Pagos" value={String(kpis.paidOrders)} />
                <KpiCard icon={ShoppingCart} label="Abandonados" value={String(kpis.abandonedOrders)} />
                <KpiCard icon={TrendingUp} label="Conversão" value={`${kpis.conversionRate.toFixed(1)}%`} badge={kpis.conversionRate >= 50 ? { text: 'Ótimo', color: '#059669', bg: '#ECFDF5' } : undefined} />
                <KpiCard icon={Ticket} label="Ticket Médio" value={`R$ ${fmt(kpis.avgTicket)}`} />
                <KpiCard icon={XCircle} label="Recusados" value={String(kpis.rejectedOrders)} />
                <KpiCard icon={Zap} label="Taxa Order Bump" value={`${kpis.bumpRate.toFixed(1)}%`} sub={`${bumpStats.withBump} pedidos`} />
            </div>

            {/* ── Revenue Chart + Funnel ── */}
            <div className="analytics-2col-wide">
                <SectionCard title="Receita Diária" subtitle="Evolução financeira no período">
                    <ResponsiveContainer width="100%" height={210}>
                        <AreaChart data={dailyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#0F172A" stopOpacity={0.08} />
                                    <stop offset="95%" stopColor="#0F172A" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} tickLine={false} axisLine={false} interval={4} />
                            <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} tickFormatter={v => v >= 1000 ? `${v / 1000}k` : v} />
                            <Tooltip content={<RevenueTooltip />} />
                            <Area type="monotone" dataKey="revenue" name="revenue" stroke="#0F172A" strokeWidth={2.5} fill="url(#revenueGrad)" dot={false} />
                        </AreaChart>
                    </ResponsiveContainer>

                    <div style={{ marginTop: '12px', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                        <p style={{ fontSize: '10px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 8px' }}>Pedidos Pagos</p>
                        <ResponsiveContainer width="100%" height={60}>
                            <BarChart data={dailyData} margin={{ top: 0, right: 4, left: -20, bottom: 0 }}>
                                <XAxis dataKey="date" hide />
                                <YAxis hide />
                                <Tooltip content={<BarTooltip />} />
                                <Bar dataKey="paidOrders" name="paidOrders" fill="#0F172A" radius={[3, 3, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </SectionCard>

                <SectionCard title="Funil de Conversão" subtitle="Total acumulado" accent="linear-gradient(90deg, #10b981, #3b82f6)">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        {funnelSteps.map((step, i) => (
                            <FunnelStep key={i} label={step.label} count={step.count} pct={step.pct} color={step.color} icon={['🔵', '🟦', '✅'][i]} />
                        ))}
                    </div>

                    <div style={{ marginTop: '22px', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
                        <p style={{ margin: '0 0 12px', fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Distribuição de status</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {statusBreakdown.map(s => (
                                <div key={s.status} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: s.color, flexShrink: 0, boxShadow: `0 0 6px ${s.color}60` }} />
                                    <span style={{ fontSize: '12px', color: '#475569', fontWeight: 600, flex: 1 }}>{s.label}</span>
                                    <span style={{ fontSize: '12px', fontWeight: 800, color: s.color }}>{s.count}</span>
                                    <span style={{ fontSize: '10px', color: '#94a3b8', width: '32px', textAlign: 'right', fontWeight: 700 }}>{s.percentage}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </SectionCard>
            </div>

            {/* ── Payment Methods + Installments + Top Products ── */}
            <div className="analytics-3col">
                {/* Payment methods */}
                <SectionCard title="Método de Pagamento" subtitle="Pedidos pagos" accent="linear-gradient(90deg, #10b981, #059669)">
                    {paymentMethods.every(m => m.count === 0) ? (
                        <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '13px', padding: '24px 0' }}>Sem dados</p>
                    ) : (
                        <>
                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                                <ResponsiveContainer width="100%" height={150}>
                                    <PieChart>
                                        <Pie
                                            data={paymentMethods.filter(m => m.count > 0)}
                                            dataKey="count"
                                            nameKey="label"
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={44}
                                            outerRadius={66}
                                            paddingAngle={4}
                                        >
                                            {paymentMethods.map((_, i) => (
                                                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(val: any, name: any) => [`${val} pedidos`, name]} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                                {paymentMethods.filter(m => m.count > 0).map((m, i) => (
                                    <div key={m.method} style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: '7px 10px', background: '#f8fafc', borderRadius: '9px' }}>
                                        <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: PIE_COLORS[i], flexShrink: 0 }} />
                                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569', flex: 1 }}>{m.label}</span>
                                        <span style={{ fontSize: '12px', fontWeight: 900, color: '#1e293b' }}>{m.count}</span>
                                        <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 700 }}>{m.percentage}%</span>
                                    </div>
                                ))}
                            </div>
                            {cardBrands.length > 0 && (
                                <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
                                    <p style={{ margin: '0 0 8px', fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Bandeiras</p>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                                        {cardBrands.map(b => (
                                            <span key={b.brand} style={{ fontSize: '11px', fontWeight: 700, color: '#6366f1', background: '#eef2ff', padding: '3px 9px', borderRadius: '20px', border: '1px solid #c7d2fe' }}>
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
                <SectionCard title="Parcelamentos" subtitle="Pedidos no cartão" accent="linear-gradient(90deg, #6366f1, #8b5cf6)">
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
                <SectionCard title="Top Produtos" subtitle="Por faturamento" accent="linear-gradient(90deg, #f59e0b, #f97316)">
                    {topProducts.length === 0 ? (
                        <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '13px', padding: '24px 0' }}>Sem dados</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            {topProducts.map((p, i) => (
                                <div key={i}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                                            <span style={{
                                                width: '22px', height: '22px', borderRadius: '7px',
                                                background: `linear-gradient(135deg, hsl(${220 + i * 25}, 75%, 58%), hsl(${240 + i * 25}, 75%, 68%))`,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: '10px', fontWeight: 900, color: 'white', flexShrink: 0
                                            }}>
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
                                        <div style={{ width: `${Math.round((p.revenue / maxProduct) * 100)}%`, height: '100%', background: `linear-gradient(90deg, hsl(${220 + i * 25}, 75%, 58%), hsl(${240 + i * 25}, 75%, 68%))`, borderRadius: '4px' }} />
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3px' }}>
                                        <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600 }}>{p.count} vendas</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </SectionCard>
            </div>

            {/* ── States + Bump Stats ── */}
            <div className="analytics-2col">
                <SectionCard title="Top Estados" subtitle="Por faturamento (pedidos pagos)" accent="linear-gradient(90deg, #3b82f6, #6366f1)">
                    {topStates.length === 0 ? (
                        <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '13px', padding: '24px 0' }}>Sem dados geográficos</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {topStates.map((s, i) => (
                                <div key={s.state}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ fontSize: '10px', fontWeight: 900, color: '#94a3b8', width: '16px' }}>{i + 1}</span>
                                            <span style={{ fontSize: '11px', fontWeight: 800, color: '#3b82f6', background: '#eff6ff', padding: '2px 8px', borderRadius: '6px', border: '1px solid #bfdbfe' }}>{s.state}</span>
                                            <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>{s.count} pedidos</span>
                                        </div>
                                        <span style={{ fontSize: '12px', fontWeight: 900, color: '#059669' }}>R$ {fmt(s.revenue)}</span>
                                    </div>
                                    <div style={{ width: '100%', height: '7px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                                        <div style={{ width: `${Math.round((s.revenue / maxState) * 100)}%`, height: '100%', background: `linear-gradient(90deg, #6366f1, #8b5cf6)`, borderRadius: '4px' }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </SectionCard>

                <SectionCard title="Análise de Order Bumps" subtitle="Impacto no ticket médio" accent="linear-gradient(90deg, #f97316, #f59e0b)">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '18px' }}>
                        {[
                            { label: 'Com Bump', count: bumpStats.withBump, avgTicket: bumpStats.bumpAvgTicket, revenue: bumpStats.bumpRevenue, color: '#6366f1', bg: 'linear-gradient(135deg,#eef2ff,#e0e7ff)', border: '#c7d2fe' },
                            { label: 'Sem Bump', count: bumpStats.withoutBump, avgTicket: bumpStats.nonBumpAvgTicket, revenue: bumpStats.nonBumpRevenue, color: '#64748b', bg: 'linear-gradient(135deg,#f8fafc,#f1f5f9)', border: '#e2e8f0' },
                        ].map(b => (
                            <div key={b.label} style={{ background: b.bg, borderRadius: '14px', padding: '14px', border: `1px solid ${b.border}` }}>
                                <p style={{ margin: '0 0 6px', fontSize: '10px', fontWeight: 700, color: b.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{b.label}</p>
                                <p style={{ margin: '0 0 2px', fontSize: '22px', fontWeight: 900, color: '#1e293b' }}>{b.count}</p>
                                <p style={{ margin: 0, fontSize: '10px', color: '#64748b', fontWeight: 600 }}>pedidos pagos</p>
                                <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: `1px solid ${b.border}` }}>
                                    <p style={{ margin: '0 0 2px', fontSize: '10px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Ticket Médio</p>
                                    <p style={{ margin: 0, fontSize: '14px', fontWeight: 900, color: b.color }}>R$ {fmt(b.avgTicket)}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {(bumpStats.bumpRevenue + bumpStats.nonBumpRevenue) > 0 && (
                        <>
                            <p style={{ margin: '0 0 8px', fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                                Receita com bump vs sem bump
                            </p>
                            <div style={{ display: 'flex', height: '12px', borderRadius: '8px', overflow: 'hidden', background: '#f1f5f9', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.05)' }}>
                                <div style={{
                                    width: `${Math.round((bumpStats.bumpRevenue / (bumpStats.bumpRevenue + bumpStats.nonBumpRevenue)) * 100)}%`,
                                    background: 'linear-gradient(90deg,#6366f1,#8b5cf6)', transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)'
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

            {/* ── Checkout Funnel Section ── */}
            <SectionCard title="Funil de Conversão — Checkout" subtitle="Etapas do checkout em tempo real" accent="linear-gradient(90deg, #6366f1, #3b82f6, #10b981)">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '12px', marginBottom: '22px' }}>
                    {[
                        { label: 'Acessaram', value: checkoutAccess.total, color: '#6366f1', bg: '#eef2ff' },
                        { label: 'Dados', value: checkoutAccess.funnel.step1, color: '#3b82f6', bg: '#eff6ff' },
                        { label: 'Entrega', value: checkoutAccess.funnel.step2, color: '#0ea5e9', bg: '#f0f9ff' },
                        { label: 'Pagamento', value: checkoutAccess.funnel.step3, color: '#10b981', bg: '#ecfdf5' },
                        { label: 'Converteram', value: checkoutAccess.funnel.payment, color: '#059669', bg: '#d1fae5' },
                    ].map((item) => (
                        <div key={item.label} style={{ background: item.bg, borderRadius: '12px', padding: '14px 12px', textAlign: 'center', border: `1px solid ${item.color}20` }}>
                            <p style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: 900, color: item.color }}>{item.value}</p>
                            <p style={{ margin: 0, fontSize: '10px', fontWeight: 700, color: item.color, opacity: 0.75, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{item.label}</p>
                        </div>
                    ))}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {[
                        { step: 'Dados do cliente', count: checkoutAccess.funnel.step1, color: '#6366f1', icon: '👤', pct: checkoutAccess.total > 0 ? Math.round((checkoutAccess.funnel.step1 / checkoutAccess.total) * 100) : 0 },
                        { step: 'Endereço de entrega', count: checkoutAccess.funnel.step2, color: '#3b82f6', icon: '📦', pct: checkoutAccess.total > 0 ? Math.round((checkoutAccess.funnel.step2 / checkoutAccess.total) * 100) : 0 },
                        { step: 'Chegaram ao pagamento', count: checkoutAccess.funnel.step3, color: '#10b981', icon: '💳', pct: checkoutAccess.total > 0 ? Math.round((checkoutAccess.funnel.step3 / checkoutAccess.total) * 100) : 0 },
                        { step: 'Pagamento concluído', count: checkoutAccess.funnel.payment, color: '#059669', icon: '✅', pct: checkoutAccess.total > 0 ? Math.round((checkoutAccess.funnel.payment / checkoutAccess.total) * 100) : 0 },
                    ].map((item, i) => (
                        <FunnelStep key={i} label={item.step} count={item.count} pct={item.pct} color={item.color} icon={item.icon} />
                    ))}
                </div>
            </SectionCard>

            {/* ── Checkout Access Section ── */}
            <div className="analytics-2col-wide">
                <SectionCard title="Acessos ao Checkout" subtitle="Visitantes e conversão" accent="linear-gradient(90deg, #3b82f6, #6366f1)">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '16px' }}>
                        {[
                            { label: 'Total de Acessos', value: checkoutAccess.total, color: '#6366f1' },
                            { label: 'Taxa de Conversão', value: `${checkoutAccess.conversionRate.toFixed(1)}%`, color: checkoutAccess.conversionRate >= 50 ? '#10b981' : '#f59e0b' },
                        ].map(item => (
                            <div key={item.label} style={{ background: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                <p style={{ margin: '0 0 4px', fontSize: '10px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{item.label}</p>
                                <p style={{ margin: 0, fontSize: '24px', fontWeight: 900, color: item.color, letterSpacing: '-0.03em' }}>{item.value}</p>
                            </div>
                        ))}
                    </div>

                    {checkoutAccess.dailyAccess.length > 0 && (
                        <ResponsiveContainer width="100%" height={170}>
                            <AreaChart data={checkoutAccess.dailyAccess} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="accessGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.28} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} tickLine={false} axisLine={false} interval={4} />
                                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                                <Tooltip content={<BarTooltip />} />
                                <Area type="monotone" dataKey="count" name="accesses" stroke="#3b82f6" strokeWidth={2.5} fill="url(#accessGrad)" dot={false} activeDot={{ r: 5, fill: '#3b82f6', strokeWidth: 0 }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </SectionCard>

                <SectionCard title="Origem dos Acessos" subtitle="Por fonte UTM" accent="linear-gradient(90deg, #10b981, #6366f1)">
                    {checkoutAccess.bySource.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                            {checkoutAccess.bySource.slice(0, 5).map((item, i) => (
                                <SourceRow key={i} label={item.source} count={item.count} color={PIE_COLORS[i % PIE_COLORS.length]} max={maxSource} />
                            ))}
                        </div>
                    ) : (
                        <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '13px', padding: '20px 0' }}>Sem dados de acesso</p>
                    )}
                </SectionCard>
            </div>

            <div className="analytics-2col-wide">
                <SectionCard title="Por Produto" subtitle="Acessos por produto">
                    {checkoutAccess.byProduct.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                            {checkoutAccess.byProduct.slice(0, 5).map((item, i) => (
                                <SourceRow key={i} label={item.productName} count={item.count} color={PIE_COLORS[i % PIE_COLORS.length]} max={checkoutAccess.byProduct[0]?.count || 1} />
                            ))}
                        </div>
                    ) : (
                        <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '13px', padding: '20px 0' }}>Sem dados</p>
                    )}
                </SectionCard>

                <SectionCard title="Campanhas" subtitle="Acessos por campanha UTM">
                    {checkoutAccess.byCampaign.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                            {checkoutAccess.byCampaign.slice(0, 5).map((item, i) => (
                                <SourceRow key={i} label={item.campaign} count={item.count} color={['#10b981', '#6366f1', '#f59e0b', '#3b82f6', '#f97316'][i % 5]} max={maxCampaign} />
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
