'use client'

import {
    BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { Eye, UserCheck, ShoppingBag, CheckCircle2, TrendingUp } from 'lucide-react'

type FunnelStep = { label: string; value: number }
type BreakdownRow = {
    source: string
    campaign: string
    visits: number
    checkoutsIniciados: number
    pedidos: number
    pagos: number
    receita: number
    conversao: number
}
type Kpis = { visitas: number; iniciaramCheckout: number; pedidos: number; pagos: number; pagosRastreados: number; conversao: number; receita: number }
type DailyPoint = { date: string; visitas: number; pedidos: number; pagos: number }

const FUNNEL_COLORS = ['#E7F1F8', '#7BB8E0', '#2C5C86', '#1a3a5c', '#1E7A52']
const PIE_COLORS = ['#14151F', '#2C5C86', '#6E7180', '#A0A8B8']

function fmt(n: number) {
    return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function fmtInt(n: number) {
    return n.toLocaleString('pt-BR')
}

function KpiCard({ icon: Icon, label, value, featured }: { icon: any; label: string; value: string; featured?: boolean }) {
    return (
        <div style={{
            background: featured ? '#14151F' : '#FFFFFF',
            border: featured ? 'none' : '1px solid #E5E7EF',
            borderRadius: '14px', padding: '20px',
            display: 'flex', flexDirection: 'column', gap: '14px',
            position: 'relative', overflow: 'hidden',
            boxShadow: featured ? '0 4px 20px rgba(20,21,31,0.15)' : '0 1px 3px rgba(0,0,0,0.02)',
        }}>
            {featured && (
                <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '120px', height: '120px', background: 'radial-gradient(circle, rgba(44,92,134,0.12) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
            )}
            <div style={{
                width: '40px', height: '40px', borderRadius: '10px',
                background: featured ? 'rgba(44,92,134,0.2)' : '#F5F6F9',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: featured ? '1px solid rgba(44,92,134,0.15)' : '1px solid #E5E7EF',
            }}>
                <Icon size={18} strokeWidth={2} color={featured ? '#7BB8E0' : '#2C5C86'} />
            </div>
            <div>
                <p style={{ margin: '0 0 6px', fontSize: '10.5px', fontWeight: 700, color: featured ? 'rgba(255,255,255,0.4)' : '#6E7180', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</p>
                <p style={{ margin: 0, fontSize: featured ? '28px' : '24px', fontWeight: 700, color: featured ? '#fff' : '#14151F', letterSpacing: '-0.04em', lineHeight: 1, fontFamily: "'Fraunces', serif" }}>{value}</p>
            </div>
        </div>
    )
}

function SectionCard({ title, subtitle, children, style }: { title: string; subtitle?: string; children: React.ReactNode; style?: React.CSSProperties }) {
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

function FunnelTooltip({ active, payload }: any) {
    if (!active || !payload?.length) return null
    const p = payload[0].payload
    return (
        <div style={{ background: '#14151F', color: '#fff', padding: '8px 12px', borderRadius: '8px', fontSize: '12px' }}>
            <strong>{p.label}</strong><br />{p.value} visitante(s)
        </div>
    )
}

function DailyTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null
    return (
        <div style={{ background: '#14151F', color: '#fff', padding: '10px 12px', borderRadius: '8px', fontSize: '12px' }}>
            <strong>{label}</strong>
            {payload.map((p: any) => (
                <div key={p.dataKey} style={{ color: p.color, marginTop: '2px' }}>{p.name}: {p.value}</div>
            ))}
        </div>
    )
}

export default function FunnelCharts({ funnel, breakdown, totalPageViews, kpis, dailyData }: {
    funnel: FunnelStep[]
    breakdown: BreakdownRow[]
    totalPageViews: number
    kpis: Kpis
    dailyData: DailyPoint[]
}) {
    const maxVisits = Math.max(...breakdown.map(b => b.visits), 1)
    const withVisits = breakdown.filter(b => b.visits > 0)
    const top3 = withVisits.slice(0, 3)
    const rest = withVisits.slice(3)
    const restVisits = rest.reduce((s, b) => s + b.visits, 0)
    const donutData = restVisits > 0
        ? [...top3, { source: 'Outros', campaign: `${rest.length} origem(ns)`, visits: restVisits, checkoutsIniciados: 0, pedidos: 0, pagos: 0, receita: 0, conversao: 0 }]
        : top3

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* ── KPIs ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
                <KpiCard featured icon={Eye} label="Visitas ao checkout" value={fmtInt(kpis.visitas)} />
                <KpiCard icon={UserCheck} label="Iniciaram checkout" value={fmtInt(kpis.iniciaramCheckout)} />
                <KpiCard icon={ShoppingBag} label="Pedidos criados" value={fmtInt(kpis.pedidos)} />
                <KpiCard icon={CheckCircle2} label="Pagos (total no período)" value={fmtInt(kpis.pagos)} />
                <KpiCard icon={TrendingUp} label="Conversão de visitas rastreadas" value={`${kpis.conversao.toFixed(1)}%`} />
            </div>

            {/* ── Funil + Tendência diária ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '14px' }} className="dashboard-grid">
                <SectionCard title="Funil de conversão" subtitle="Visitantes únicos em cada etapa do checkout">
                    {totalPageViews === 0 ? (
                        <p style={{ textAlign: 'center', color: '#6E7180', fontSize: '13px', padding: '24px 0' }}>Nenhum acesso ao checkout registrado nesse período.</p>
                    ) : (
                        <>
                            <ResponsiveContainer width="100%" height={220}>
                                <BarChart data={funnel} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EF" horizontal={false} />
                                    <XAxis type="number" tick={{ fontSize: 11, fill: '#6E7180' }} tickLine={false} axisLine={false} />
                                    <YAxis type="category" dataKey="label" width={140} tick={{ fontSize: 11, fill: '#14151F', fontWeight: 600 }} tickLine={false} axisLine={false} />
                                    <Tooltip content={<FunnelTooltip />} />
                                    <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                                        {funnel.map((_, i) => <Cell key={i} fill={FUNNEL_COLORS[i % FUNNEL_COLORS.length]} />)}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px' }}>
                                {funnel.map((s, i) => {
                                    const prev = i === 0 ? totalPageViews : funnel[i - 1].value
                                    const pct = prev > 0 ? (s.value / prev) * 100 : 0
                                    return (
                                        <p key={s.label} style={{ margin: 0, fontSize: '11px', color: '#6E7180' }}>
                                            <strong style={{ color: '#14151F' }}>{s.label}:</strong> {s.value}
                                            {i > 0 && <span> ({pct.toFixed(1)}% da etapa anterior)</span>}
                                        </p>
                                    )
                                })}
                            </div>
                        </>
                    )}
                </SectionCard>

                <SectionCard title="Visitas x Pedidos x Pagos por dia" subtitle="Evolução no período selecionado">
                    {dailyData.length === 0 ? (
                        <p style={{ textAlign: 'center', color: '#6E7180', fontSize: '13px', padding: '24px 0' }}>Sem dados no período.</p>
                    ) : (
                        <ResponsiveContainer width="100%" height={280}>
                            <AreaChart data={dailyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="visitasGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#2C5C86" stopOpacity={0.15} />
                                        <stop offset="95%" stopColor="#2C5C86" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EF" vertical={false} />
                                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6E7180', fontWeight: 600 }} tickLine={false} axisLine={false} />
                                <YAxis tick={{ fontSize: 10, fill: '#6E7180' }} tickLine={false} axisLine={false} />
                                <Tooltip content={<DailyTooltip />} />
                                <Legend wrapperStyle={{ fontSize: '11px' }} />
                                <Area type="monotone" dataKey="visitas" name="Visitas" stroke="#2C5C86" strokeWidth={2.5} fill="url(#visitasGrad)" dot={false} />
                                <Area type="monotone" dataKey="pedidos" name="Pedidos" stroke="#A0A8B8" strokeWidth={2} fill="none" dot={false} />
                                <Area type="monotone" dataKey="pagos" name="Pagos" stroke="#1E7A52" strokeWidth={2} fill="none" dot={false} />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </SectionCard>
            </div>

            {/* ── Origem do tráfego ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: '14px' }} className="dashboard-grid">
                <SectionCard title="Visitas por origem" subtitle="Click id da Taboola / UTM">
                    {donutData.length === 0 ? (
                        <p style={{ textAlign: 'center', color: '#6E7180', fontSize: '13px', padding: '24px 0' }}>Sem dados no período.</p>
                    ) : (
                        <>
                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                                <ResponsiveContainer width="100%" height={160}>
                                    <PieChart>
                                        <Pie data={donutData} dataKey="visits" nameKey="source" cx="50%" cy="50%" innerRadius={42} outerRadius={62} paddingAngle={4}>
                                            {donutData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                                        </Pie>
                                        <Tooltip formatter={(val: any, name: any) => [`${val} visitas`, name]} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
                                {donutData.map((o, i) => (
                                    <div key={o.source + o.campaign} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', background: '#F5F6F9', borderRadius: '8px' }}>
                                        <span style={{ width: '8px', height: '8px', borderRadius: '3px', background: PIE_COLORS[i % PIE_COLORS.length], flexShrink: 0 }} />
                                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#6E7180', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={o.campaign}>{o.source}</span>
                                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#14151F' }}>{o.visits}</span>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </SectionCard>

                <SectionCard title="Conversão por origem" subtitle="Visitas rastreadas desde a ativação do tracking; pedidos/pagos consideram todo o período">
                    {breakdown.length === 0 ? (
                        <p style={{ textAlign: 'center', color: '#6E7180', fontSize: '13px', padding: '24px 0' }}>Sem dados no período.</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '360px', overflowY: 'auto' }}>
                            {breakdown.slice(0, 12).map((row, i) => (
                                <div key={row.source + row.campaign}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                                        <div style={{ minWidth: 0 }}>
                                            <p style={{ margin: 0, fontSize: '12px', fontWeight: 700, color: '#14151F' }}>{row.source}</p>
                                            <p style={{ margin: 0, fontSize: '10px', color: '#6E7180', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '260px' }} title={row.campaign}>{row.campaign}</p>
                                        </div>
                                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#1E7A52', whiteSpace: 'nowrap' }}>R$ {fmt(row.receita)}</span>
                                    </div>
                                    <div style={{ width: '100%', height: '6px', background: '#F5F6F9', borderRadius: '3px', overflow: 'hidden' }}>
                                        <div style={{ width: `${(row.visits / maxVisits) * 100}%`, height: '100%', background: PIE_COLORS[i % PIE_COLORS.length] }} />
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px', marginTop: '4px', flexWrap: 'wrap' }}>
                                        <span style={{ fontSize: '10px', color: '#6E7180', fontWeight: 600 }}>{row.visits} visitas</span>
                                        <span style={{ fontSize: '10px', color: '#6E7180', fontWeight: 600 }}>{row.checkoutsIniciados} iniciaram</span>
                                        <span style={{ fontSize: '10px', color: '#6E7180', fontWeight: 600 }}>{row.pedidos} pedidos</span>
                                        <span style={{ fontSize: '10px', color: '#1E7A52', fontWeight: 700 }}>{row.pagos} pagos</span>
                                        <span style={{ fontSize: '10px', color: row.conversao > 0 ? '#1E7A52' : '#6E7180', fontWeight: 700, marginLeft: 'auto' }}>
                                            {row.visits > 0 ? `${Math.min(row.conversao, 999).toFixed(1)}% conv.` : 'sem visita rastreada'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </SectionCard>
            </div>
        </div>
    )
}
