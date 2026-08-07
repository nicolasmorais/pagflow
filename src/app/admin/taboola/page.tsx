'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
    AreaChart, Area, BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import {
    Target, Eye, MousePointerClick, DollarSign,
    TrendingUp, BarChart3, Zap, Activity, Loader2,
    Percent, BadgeDollarSign
} from 'lucide-react'

const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmtNum = (v: number) => v.toLocaleString('pt-BR')

type TaboolaAccount = {
    accountId: string
    label: string
    summary: {
        totalSpent: number
        totalImpressions: number
        totalClicks: number
        totalConversions: number
        cpc: number
        ctr: number
        cpa: number
    }
    daily: { date: string; spent: number }[]
    error?: string
}

type TaboolaRevenue = {
    accountId: string
    paidRevenue: number
    unpaidRevenue: number
    totalRevenue: number
    paidOrders: number
    totalOrders: number
}

type TaboolaData = {
    accounts: TaboolaAccount[]
    revenue: TaboolaRevenue[]
    totalSpent: number
    period: string
    dateRange: { start: string; end: string }
}

const SectionCard = ({ title, subtitle, children, style }: {
    title: string; subtitle?: string; children: React.ReactNode; style?: React.CSSProperties
}) => (
    <div style={{
        background: 'linear-gradient(145deg, #ffffff 0%, #fafbfc 100%)',
        border: '1px solid rgba(241, 245, 249, 0.8)',
        borderRadius: '20px', padding: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.01), 0 4px 16px rgba(0,0,0,0.03)',
        ...style
    }}>
        <div style={{ marginBottom: '20px' }}>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.01em' }}>{title}</h3>
            {subtitle && <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#94a3b8', fontWeight: 500 }}>{subtitle}</p>}
        </div>
        {children}
    </div>
)

const ChartTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
        <div style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px',
            padding: '12px 16px', boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
        }}>
            <p style={{ margin: '0 0 8px', fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</p>
            {payload.map((entry: any) => (
                <div key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '4px 0' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: entry.color, boxShadow: `0 0 8px ${entry.color}40` }} />
                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>{entry.name}</span>
                    <span style={{ fontSize: '12px', color: '#fff', fontWeight: 800, marginLeft: 'auto' }}>
                        {entry.name === 'CTR' ? `${entry.value.toFixed(2)}%` : entry.name === 'CPC' ? `R$ ${fmt(entry.value)}` : fmtNum(entry.value)}
                    </span>
                </div>
            ))}
        </div>
    )
}

export default function TaboolaPage() {
    const router = useRouter()
    const [period, setPeriod] = useState('30d')
    const [data, setData] = useState<TaboolaData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchData = useCallback(async (p: string) => {
        setLoading(true)
        setError(null)
        try {
            const res = await fetch(`/api/admin/taboola?period=${p}`)
            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || 'Erro ao buscar dados')
            }
            const json = await res.json()
            setData(json)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchData(period)
    }, [period, fetchData])

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr + 'T12:00:00')
        return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
    }

    const accounts = data?.accounts || []
    const revenue = data?.revenue || []

    // Aggregated summary from all accounts
    const summary = accounts.length > 0 ? {
        totalSpent: accounts.reduce((s, a) => s + a.summary.totalSpent, 0),
        totalImpressions: accounts.reduce((s, a) => s + a.summary.totalImpressions, 0),
        totalClicks: accounts.reduce((s, a) => s + a.summary.totalClicks, 0),
        totalConversions: accounts.reduce((s, a) => s + a.summary.totalConversions, 0),
        cpc: 0, ctr: 0, cpa: 0,
    } : null
    if (summary) {
        summary.cpc = summary.totalClicks > 0 ? summary.totalSpent / summary.totalClicks : 0
        summary.ctr = summary.totalImpressions > 0 ? (summary.totalClicks / summary.totalImpressions) * 100 : 0
        summary.cpa = summary.totalConversions > 0 ? summary.totalSpent / summary.totalConversions : 0
    }

    // Merge daily data from all accounts
    const dailyMap = new Map<string, number>()
    for (const acc of accounts) {
        for (const d of acc.daily) {
            dailyMap.set(d.date, (dailyMap.get(d.date) || 0) + d.spent)
        }
    }
    const daily = Array.from(dailyMap.entries())
        .map(([date, spent]) => ({ date: formatDate(date), spent }))
        .sort((a, b) => a.date.localeCompare(b.date))

    const totalPaidRevenue = revenue.reduce((s, r) => s + r.paidRevenue, 0)
    const totalUnpaidRevenue = revenue.reduce((s, r) => s + r.unpaidRevenue, 0)

    return (
        <div style={{ paddingBottom: '40px' }}>
            <style jsx global>{`
                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(16px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes tabSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                @keyframes tabPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
                .tab-card { animation: fadeUp 0.4s ease-out both; }
                .tab-card:nth-child(1) { animation-delay: 0s; }
                .tab-card:nth-child(2) { animation-delay: 0.05s; }
                .tab-card:nth-child(3) { animation-delay: 0.1s; }
                .tab-card:nth-child(4) { animation-delay: 0.15s; }
                .tab-card:nth-child(5) { animation-delay: 0.2s; }
                .tab-card:nth-child(6) { animation-delay: 0.25s; }
                .tab-card:nth-child(7) { animation-delay: 0.3s; }
                .tab-charts-row { grid-template-columns: 2fr 1fr !important; }
                .tab-campaigns-row { grid-template-columns: 1fr !important; }
                @media (max-width: 768px) {
                    .tab-charts-row { grid-template-columns: 1fr !important; }
                }
            `}</style>

            {/* Header */}
            <header style={{
                marginBottom: '28px', display: 'flex', alignItems: 'flex-start',
                justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px',
            }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                        <div style={{
                            width: '42px', height: '42px', borderRadius: '14px',
                            background: 'linear-gradient(135deg, #4285f4, #1a73e8)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 6px 20px rgba(66,133,244,0.35)', flexShrink: 0,
                        }}>
                            <Target size={20} color="white" />
                        </div>
                        <div>
                            <h1 style={{ fontSize: 'clamp(1.1rem, 4vw, 1.5rem)', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.03em' }}>
                                Taboola Ads
                            </h1>
                            <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0, fontWeight: 500 }}>
                                Gastos, impressões e performance de campanhas.
                            </p>
                        </div>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '12px', padding: '3px', border: '1px solid #e2e8f0' }}>
                        {[
                            { key: 'today', label: 'Hoje' },
                            { key: '7d', label: '7 dias' },
                            { key: '30d', label: '30 dias' },
                            { key: '90d', label: '90 dias' },
                        ].map(p => (
                            <button key={p.key} onClick={() => setPeriod(p.key)} style={{
                                padding: '7px 14px', borderRadius: '9px', border: 'none', cursor: 'pointer',
                                background: period === p.key ? '#fff' : 'transparent',
                                color: period === p.key ? '#0f172a' : '#94a3b8',
                                fontSize: '11px', fontWeight: 700,
                                boxShadow: period === p.key ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                                transition: 'all 0.2s',
                            }}>
                                {p.label}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            {/* Loading State */}
            {loading && (
                <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    padding: '80px 0', gap: '16px',
                }}>
                    <div style={{
                        width: '56px', height: '56px', borderRadius: '16px',
                        background: 'linear-gradient(135deg, #4285f4, #1a73e8)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 8px 24px rgba(66,133,244,0.3)',
                        animation: 'tabPulse 1.5s ease-in-out infinite',
                    }}>
                        <Loader2 size={24} color="white" style={{ animation: 'tabSpin 1s linear infinite' }} />
                    </div>
                    <p style={{ color: '#94a3b8', fontSize: '14px', fontWeight: 600, margin: 0 }}>
                        Carregando dados do Taboola...
                    </p>
                </div>
            )}

            {/* Error State */}
            {error && !loading && (
                <div style={{
                    background: 'linear-gradient(145deg, #fef2f2, #fff1f2)',
                    border: '1px solid #fecaca', borderRadius: '20px', padding: '32px',
                    textAlign: 'center', marginBottom: '24px',
                }}>
                    <div style={{
                        width: '56px', height: '56px', borderRadius: '16px',
                        background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 16px', boxShadow: '0 8px 24px rgba(220,38,38,0.25)',
                    }}>
                        <Target size={24} color="white" />
                    </div>
                    <p style={{ fontSize: '16px', fontWeight: 800, color: '#991b1b', margin: '0 0 8px' }}>
                        Erro ao conectar com Taboola
                    </p>
                    <p style={{ fontSize: '13px', color: '#b91c1c', margin: 0, fontWeight: 500 }}>{error}</p>
                    <button
                        onClick={() => fetchData(period)}
                        style={{
                            marginTop: '16px', padding: '10px 24px', borderRadius: '12px', border: 'none',
                            background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
                            color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer',
                            boxShadow: '0 4px 16px rgba(220,38,38,0.3)',
                        }}
                    >
                        Tentar novamente
                    </button>
                </div>
            )}

            {/* Data */}
            {data && !loading && (
                <>
                    {/* KPI Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '12px', marginBottom: '24px' }}>
                        {/* Gasto Total */}
                        <div className="tab-card" style={{
                            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                            borderRadius: '20px', padding: '22px', position: 'relative', overflow: 'hidden',
                            boxShadow: '0 8px 32px rgba(15, 23, 42, 0.3)',
                        }}>
                            <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', background: 'radial-gradient(circle, rgba(239,68,68,0.2) 0%, transparent 70%)', borderRadius: '50%' }} />
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, rgba(239,68,68,0.2), rgba(220,38,38,0.15))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <DollarSign size={18} color="#f87171" />
                                </div>
                                <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>{data.dateRange.start} — {data.dateRange.end}</span>
                            </div>
                            <p style={{ margin: '0 0 4px', fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Gasto Total</p>
                            <p style={{ margin: 0, fontSize: '26px', fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', fontFamily: "'Space Grotesk', sans-serif" }}>
                                R$ {fmt(summary!.totalSpent)}
                            </p>
                        </div>

                        {/* Impressões */}
                        <div className="tab-card" style={{
                            background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
                            border: '1px solid rgba(241,245,249,0.8)', borderRadius: '20px', padding: '22px',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.02), 0 4px 12px rgba(0,0,0,0.03)',
                        }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #eff6ff, #dbeafe)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px', boxShadow: '0 2px 8px rgba(59,130,246,0.1)' }}>
                                <Eye size={18} color="#3b82f6" />
                            </div>
                            <p style={{ margin: '0 0 4px', fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Impressões</p>
                            <p style={{ margin: 0, fontSize: '22px', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em', fontFamily: "'Space Grotesk', sans-serif" }}>
                                {fmtNum(summary!.totalImpressions)}
                            </p>
                        </div>

                        {/* Cliques */}
                        <div className="tab-card" style={{
                            background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
                            border: '1px solid rgba(241,245,249,0.8)', borderRadius: '20px', padding: '22px',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.02), 0 4px 12px rgba(0,0,0,0.03)',
                        }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px', boxShadow: '0 2px 8px rgba(34,197,94,0.1)' }}>
                                <MousePointerClick size={18} color="#22c55e" />
                            </div>
                            <p style={{ margin: '0 0 4px', fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Cliques</p>
                            <p style={{ margin: 0, fontSize: '22px', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em', fontFamily: "'Space Grotesk', sans-serif" }}>
                                {fmtNum(summary!.totalClicks)}
                            </p>
                        </div>

                        {/* CPC Médio */}
                        <div className="tab-card" style={{
                            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                            borderRadius: '20px', padding: '22px', position: 'relative', overflow: 'hidden',
                            boxShadow: '0 8px 32px rgba(15, 23, 42, 0.3)',
                        }}>
                            <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', background: 'radial-gradient(circle, rgba(168,85,247,0.2) 0%, transparent 70%)', borderRadius: '50%' }} />
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, rgba(168,85,247,0.2), rgba(147,51,234,0.15))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <BadgeDollarSign size={18} color="#a855f7" />
                                </div>
                            </div>
                            <p style={{ margin: '0 0 4px', fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>CPC Médio</p>
                            <p style={{ margin: 0, fontSize: '26px', fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', fontFamily: "'Space Grotesk', sans-serif" }}>
                                R$ {fmt(summary!.cpc)}
                            </p>
                        </div>

                        {/* CTR */}
                        <div className="tab-card" style={{
                            background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
                            border: '1px solid rgba(241,245,249,0.8)', borderRadius: '20px', padding: '22px',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.02), 0 4px 12px rgba(0,0,0,0.03)',
                        }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #fff7ed, #ffedd5)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px', boxShadow: '0 2px 8px rgba(249,115,22,0.1)' }}>
                                <Percent size={18} color="#f97316" />
                            </div>
                            <p style={{ margin: '0 0 4px', fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>CTR</p>
                            <p style={{ margin: 0, fontSize: '22px', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em', fontFamily: "'Space Grotesk', sans-serif" }}>
                                {summary!.ctr.toFixed(2)}%
                            </p>
                        </div>

                        {/* Conversões */}
                        <div className="tab-card" style={{
                            background: summary!.totalConversions > 0
                                ? 'linear-gradient(135deg, #059669 0%, #047857 100%)'
                                : 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
                            border: summary!.totalConversions > 0 ? 'none' : '1px solid rgba(241,245,249,0.8)',
                            borderRadius: '20px', padding: '22px', position: 'relative', overflow: 'hidden',
                            boxShadow: summary!.totalConversions > 0 ? '0 8px 32px rgba(5,150,105,0.3)' : '0 1px 3px rgba(0,0,0,0.02)',
                        }}>
                            {summary!.totalConversions > 0 && <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)', borderRadius: '50%' }} />}
                            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: summary!.totalConversions > 0 ? 'rgba(255,255,255,0.15)' : 'linear-gradient(135deg, #faf5ff, #f3e8ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px', boxShadow: summary!.totalConversions > 0 ? 'none' : '0 2px 8px rgba(168,85,247,0.1)' }}>
                                <Zap size={18} color={summary!.totalConversions > 0 ? '#fff' : '#a855f7'} />
                            </div>
                            <p style={{ margin: '0 0 4px', fontSize: '10px', fontWeight: 700, color: summary!.totalConversions > 0 ? 'rgba(255,255,255,0.5)' : '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Conversões</p>
                            <p style={{ margin: 0, fontSize: '22px', fontWeight: 900, color: summary!.totalConversions > 0 ? '#fff' : '#0f172a', letterSpacing: '-0.03em', fontFamily: "'Space Grotesk', sans-serif" }}>
                                {fmtNum(summary!.totalConversions)}
                            </p>
                            {summary!.cpa > 0 && (
                                <p style={{ margin: '4px 0 0', fontSize: '11px', color: summary!.totalConversions > 0 ? 'rgba(255,255,255,0.5)' : '#94a3b8', fontWeight: 600 }}>
                                    CPA: R$ {fmt(summary!.cpa)}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Charts Row */}
                    <div className="tab-charts-row" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '14px', marginBottom: '14px' }}>
                        {/* Spending Chart */}
                        <SectionCard title="Gasto Diário" subtitle={`R$ gastos por dia — ${period === 'today' ? 'Hoje' : period === '7d' ? '7 dias' : period === '90d' ? '90 dias' : '30 dias'}`}>
                            <ResponsiveContainer width="100%" height={280}>
                                <AreaChart data={daily} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="gradSpent" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#ef4444" stopOpacity={0.25} />
                                            <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} tickLine={false} axisLine={false} interval={4} />
                                    <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v} />
                                    <Tooltip content={<ChartTooltip />} />
                                    <Area type="monotone" dataKey="spent" name="Gasto" stroke="#ef4444" strokeWidth={2.5} fill="url(#gradSpent)" dot={false} activeDot={{ r: 5, fill: '#ef4444', stroke: '#fff', strokeWidth: 2 }} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </SectionCard>

                        {/* ROAS Card */}
                        <SectionCard title="Retorno" subtitle="Faturamento vs Gasto">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', justifyContent: 'center', height: '100%' }}>
                                <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '16px', border: '1px solid #f1f5f9' }}>
                                    <p style={{ margin: 0, fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Faturamento Pago</p>
                                    <p style={{ margin: '4px 0 0', fontSize: '22px', fontWeight: 900, color: '#059669', fontFamily: "'Space Grotesk', sans-serif" }}>R$ {fmt(totalPaidRevenue)}</p>
                                </div>
                                <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '16px', border: '1px solid #f1f5f9' }}>
                                    <p style={{ margin: 0, fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Faturamento Não Pago</p>
                                    <p style={{ margin: '4px 0 0', fontSize: '22px', fontWeight: 900, color: '#dc2626', fontFamily: "'Space Grotesk', sans-serif" }}>R$ {fmt(totalUnpaidRevenue)}</p>
                                </div>
                                <div style={{ background: summary && summary.totalSpent > 0 ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' : '#f8fafc', borderRadius: '12px', padding: '16px', border: summary && summary.totalSpent > 0 ? 'none' : '1px solid #f1f5f9' }}>
                                    <p style={{ margin: 0, fontSize: '10px', fontWeight: 700, color: summary && summary.totalSpent > 0 ? 'rgba(255,255,255,0.4)' : '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>ROAS</p>
                                    <p style={{ margin: '4px 0 0', fontSize: '22px', fontWeight: 900, color: summary && summary.totalSpent > 0 ? '#fff' : '#0f172a', fontFamily: "'Space Grotesk', sans-serif" }}>
                                        {summary && summary.totalSpent > 0 ? `${(totalPaidRevenue / summary.totalSpent).toFixed(2)}x` : '—'}
                                    </p>
                                </div>
                            </div>
                        </SectionCard>
                    </div>

                    {/* Per-Account Cards */}
                    {accounts.length > 0 && (
                        <SectionCard title="Contas Taboola" subtitle={`${accounts.filter(a => !a.error).length} de ${accounts.length} contas conectadas`}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '14px' }}>
                                {accounts.map((acc, i) => {
                                    const colors = ['#4285f4', '#8b5cf6', '#f97316']
                                    const accent = colors[i % colors.length]
                                    const rev = revenue.find(r => r.accountId === acc.accountId)
                                    const paidPct = rev && rev.totalRevenue > 0 ? (rev.paidRevenue / rev.totalRevenue) * 100 : 0
                                    return (
                                        <div key={acc.accountId} style={{
                                            background: acc.error ? 'linear-gradient(145deg, #fef2f2, #fff1f2)' : 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
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
                                                    <p style={{ margin: '0 0 2px', fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Gasto</p>
                                                    <p style={{ margin: '0 0 12px', fontSize: '24px', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em', fontFamily: "'Space Grotesk', sans-serif" }}>R$ {fmt(acc.summary.totalSpent)}</p>
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                                                        <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '10px', border: '1px solid #f1f5f9' }}>
                                                            <p style={{ margin: 0, fontSize: '9px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Impressões</p>
                                                            <p style={{ margin: '4px 0 0', fontSize: '14px', fontWeight: 900, color: '#1e293b', fontFamily: "'Space Grotesk', sans-serif" }}>{fmtNum(acc.summary.totalImpressions)}</p>
                                                        </div>
                                                        <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '10px', border: '1px solid #f1f5f9' }}>
                                                            <p style={{ margin: 0, fontSize: '9px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cliques</p>
                                                            <p style={{ margin: '4px 0 0', fontSize: '14px', fontWeight: 900, color: '#1e293b', fontFamily: "'Space Grotesk', sans-serif" }}>{fmtNum(acc.summary.totalClicks)}</p>
                                                        </div>
                                                        <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '10px', border: '1px solid #f1f5f9' }}>
                                                            <p style={{ margin: 0, fontSize: '9px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>CTR</p>
                                                            <p style={{ margin: '4px 0 0', fontSize: '14px', fontWeight: 900, color: '#1e293b', fontFamily: "'Space Grotesk', sans-serif" }}>{acc.summary.ctr.toFixed(2)}%</p>
                                                        </div>
                                                    </div>
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                                                        <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '10px', border: '1px solid #f1f5f9' }}>
                                                            <p style={{ margin: 0, fontSize: '9px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Conversões</p>
                                                            <p style={{ margin: '4px 0 0', fontSize: '14px', fontWeight: 900, color: acc.summary.totalConversions > 0 ? '#059669' : '#1e293b', fontFamily: "'Space Grotesk', sans-serif" }}>{fmtNum(acc.summary.totalConversions)}</p>
                                                        </div>
                                                        <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '10px', border: '1px solid #f1f5f9' }}>
                                                            <p style={{ margin: 0, fontSize: '9px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>CPA</p>
                                                            <p style={{ margin: '4px 0 0', fontSize: '14px', fontWeight: 900, color: '#1e293b', fontFamily: "'Space Grotesk', sans-serif" }}>{acc.summary.cpa > 0 ? `R$ ${fmt(acc.summary.cpa)}` : '—'}</p>
                                                        </div>
                                                        <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '10px', border: '1px solid #f1f5f9' }}>
                                                            <p style={{ margin: 0, fontSize: '9px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>CPC</p>
                                                            <p style={{ margin: '4px 0 0', fontSize: '14px', fontWeight: 900, color: '#1e293b', fontFamily: "'Space Grotesk', sans-serif" }}>R$ {fmt(acc.summary.cpc)}</p>
                                                        </div>
                                                    </div>
                                                    {rev && rev.totalRevenue > 0 && (
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
                                                                <div style={{ width: `${paidPct}%`, height: '100%', background: '#22c55e', borderRadius: '4px' }} />
                                                            </div>
                                                            <p style={{ margin: '4px 0 0', fontSize: '10px', fontWeight: 700, color: '#15803d', textAlign: 'right' }}>{paidPct.toFixed(0)}% pago</p>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </SectionCard>
                    )}
                </>
            )}
        </div>
    )
}
