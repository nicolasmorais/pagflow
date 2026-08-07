'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
    AreaChart, Area, BarChart, Bar,
    PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import {
    DollarSign, TrendingUp, TrendingDown, Wallet,
    Target, Percent, Plus, Trash2, X, BarChart3,
    Package, Activity, Zap, CircleDollarSign
} from 'lucide-react'

const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmtNum = (v: number) => v.toLocaleString('pt-BR')

type FinancialRecord = {
    id: string; type: string; category: string; description: string; amount: number; date: string
}

type TaboolaAccount = {
    accountId: string; label: string
    totalSpent: number; totalImpressions: number; totalClicks: number
    totalConversions: number; cpc: number; ctr: number; cpa: number
    error?: string
}

type TaboolaRevenue = {
    accountId: string; paidRevenue: number; unpaidRevenue: number
    totalRevenue: number; paidOrders: number; totalOrders: number
}

type FinancialData = {
    receitaBruta: number; receitaLiquida: number; custoProduto: number
    gastosMarketing: number; gastosOperacionais: number; taboolaSpent: number
    lucroOperacional: number; margemLucro: number; roi: number
    dailyRevenue: { date: string; receita: number; despesa: number; lucro: number }[]
    categoryBreakdown: { name: string; value: number; color: string }[]
    totalCost: number
    period: string
    taboolaAccounts?: TaboolaAccount[]
    taboolaRevenue?: TaboolaRevenue[]
}

const EXPENSE_CATEGORIES = [
    { value: 'custo_produto', label: 'Custo Produto', color: '#dc2626', icon: '📦' },
    { value: 'marketing', label: 'Marketing', color: '#f97316', icon: '📢' },
    { value: 'operacional', label: 'Operacional', color: '#6366f1', icon: '⚙️' },
    { value: 'frete', label: 'Frete', color: '#0ea5e9', icon: '🚚' },
    { value: 'taxa', label: 'Taxas', color: '#ec4899', icon: '💳' },
    { value: 'outros', label: 'Outros', color: '#64748b', icon: '📋' },
]

const PIE_COLORS = ['#dc2626', '#f97316', '#6366f1', '#0ea5e9', '#ec4899', '#64748b']

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
                    <span style={{ fontSize: '12px', color: '#fff', fontWeight: 800, marginLeft: 'auto' }}>R$ {fmt(entry.value)}</span>
                </div>
            ))}
        </div>
    )
}

const PieTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null
    const d = payload[0]
    return (
        <div style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px',
            padding: '10px 14px', boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: d.payload.color }} />
                <span style={{ fontSize: '12px', color: '#fff', fontWeight: 700 }}>{d.name}</span>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#fff', fontWeight: 900, fontFamily: "'Space Grotesk', sans-serif" }}>
                R$ {fmt(d.value)}
            </p>
        </div>
    )
}

function SectionCard({ title, subtitle, children, style, headerRight }: {
    title: string; subtitle?: string; children: React.ReactNode; style?: React.CSSProperties; headerRight?: React.ReactNode
}) {
    return (
        <div style={{
            background: 'linear-gradient(145deg, #ffffff 0%, #fafbfc 100%)',
            border: '1px solid rgba(241, 245, 249, 0.8)',
            borderRadius: '20px', padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.01), 0 4px 16px rgba(0,0,0,0.03)',
            ...style
        }}>
            <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.01em' }}>{title}</h3>
                    {subtitle && <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#94a3b8', fontWeight: 500 }}>{subtitle}</p>}
                </div>
                {headerRight}
            </div>
            {children}
        </div>
    )
}

function AddExpenseModal({ open, onClose, onAdd }: {
    open: boolean; onClose: () => void; onAdd: (data: { type: string; category: string; description: string; amount: number; date: string }) => void
}) {
    const [category, setCategory] = useState('marketing')
    const [description, setDescription] = useState('')
    const [amount, setAmount] = useState('')
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])

    if (!open) return null

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!description || !amount) return
        onAdd({ type: 'despesa', category, description, amount: parseFloat(amount), date })
        setDescription('')
        setAmount('')
        onClose()
    }

    return (
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999, backdropFilter: 'blur(8px)',
        }} onClick={onClose}>
            <div style={{
                background: '#fff', borderRadius: '24px', padding: '32px',
                width: '90%', maxWidth: '440px',
                boxShadow: '0 32px 80px rgba(0,0,0,0.35)',
                animation: 'modalSlideIn 0.3s ease-out',
            }} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 900, color: '#0f172a' }}>Nova Despesa</h3>
                        <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#94a3b8' }}>Registre um novo gasto</p>
                    </div>
                    <button onClick={onClose} style={{
                        background: '#f1f5f9', border: 'none', cursor: 'pointer',
                        color: '#64748b', padding: '8px', borderRadius: '10px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <X size={18} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                        <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px', display: 'block' }}>
                            Categoria
                        </label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                            {EXPENSE_CATEGORIES.map(c => (
                                <button key={c.value} type="button" onClick={() => setCategory(c.value)} style={{
                                    padding: '10px 8px', borderRadius: '12px',
                                    border: `2px solid ${category === c.value ? c.color : '#f1f5f9'}`,
                                    background: category === c.value ? c.color + '10' : '#fff',
                                    color: category === c.value ? c.color : '#64748b',
                                    fontSize: '11px', fontWeight: 700, cursor: 'pointer',
                                    transition: 'all 0.2s', display: 'flex', flexDirection: 'column',
                                    alignItems: 'center', gap: '4px',
                                }}>
                                    <span style={{ fontSize: '16px' }}>{c.icon}</span>
                                    {c.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px', display: 'block' }}>
                            Descrição
                        </label>
                        <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Ex: Anúncio Meta Ads" required
                            style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '2px solid #e2e8f0', fontSize: '13px', fontWeight: 600, color: '#1e293b', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                            onFocus={e => e.target.style.borderColor = '#6366f1'}
                            onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                        />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                            <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px', display: 'block' }}>
                                Valor (R$)
                            </label>
                            <input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0,00" required
                                style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '2px solid #e2e8f0', fontSize: '13px', fontWeight: 600, color: '#1e293b', outline: 'none', boxSizing: 'border-box' }}
                                onFocus={e => e.target.style.borderColor = '#6366f1'}
                                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px', display: 'block' }}>
                                Data
                            </label>
                            <input type="date" value={date} onChange={e => setDate(e.target.value)}
                                style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '2px solid #e2e8f0', fontSize: '13px', fontWeight: 600, color: '#1e293b', outline: 'none', boxSizing: 'border-box' }}
                                onFocus={e => e.target.style.borderColor = '#6366f1'}
                                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                            />
                        </div>
                    </div>
                    <button type="submit" style={{
                        padding: '14px', borderRadius: '14px', border: 'none',
                        background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                        color: '#fff', fontSize: '14px', fontWeight: 800, cursor: 'pointer',
                        boxShadow: '0 8px 24px rgba(99,102,241,0.35)',
                        transition: 'all 0.2s', marginTop: '4px',
                    }}>
                        Adicionar Despesa
                    </button>
                </form>
            </div>
        </div>
    )
}

export default function FinanceiroClient({ initialData, records, kpis }: {
    initialData: FinancialData; records: FinancialRecord[]; kpis: any
}) {
    const router = useRouter()
    const [allRecords, setAllRecords] = useState(records)
    const [showAddModal, setShowAddModal] = useState(false)
    const filterPeriod = initialData.period
    const [taboolaPeriod, setTaboolaPeriod] = useState(initialData.period)
    const [taboolaLoading, setTaboolaLoading] = useState(false)
    const [taboolaData, setTaboolaData] = useState<{ accounts: TaboolaAccount[]; revenue: TaboolaRevenue[] } | null>(null)

    const currentTaboola = taboolaData || {
        accounts: initialData.taboolaAccounts || [],
        revenue: initialData.taboolaRevenue || [],
    }

    const setFilterPeriod = useCallback((period: string) => {
        router.push(`/admin/financeiro?period=${period}`, { scroll: false })
    }, [router])

    const fetchTaboolaData = useCallback(async (period: string) => {
        setTaboolaLoading(true)
        try {
            const res = await fetch(`/api/admin/taboola?period=${period}`)
            const data = await res.json()

            const accounts: TaboolaAccount[] = (data.accounts || []).map((a: any) => ({
                accountId: a.accountId,
                label: a.label,
                totalSpent: a.summary?.totalSpent || 0,
                totalImpressions: a.summary?.totalImpressions || 0,
                totalClicks: a.summary?.totalClicks || 0,
                totalConversions: a.summary?.totalConversions || 0,
                cpc: a.summary?.cpc || 0,
                ctr: a.summary?.ctr || 0,
                cpa: a.summary?.cpa || 0,
                error: a.error,
            }))

            setTaboolaData({ accounts, revenue: data.revenue || [] })
        } catch { /* keep existing data */ }
        setTaboolaLoading(false)
    }, [])

    const expenseRecords = allRecords.filter(r => r.type === 'despesa')
    const totalDespesas = expenseRecords.reduce((s, r) => s + r.amount, 0)
    const totalReceita = kpis.totalRevenue
    const totalNet = kpis.netRevenue
    const custoProduto = kpis.totalCost || 0
    const taboola = initialData.taboolaSpent || 0
    const totalInvestido = custoProduto + totalDespesas + taboola
    const lucroCalc = totalNet - totalInvestido
    const margemCalc = totalReceita > 0 ? (lucroCalc / totalReceita) * 100 : 0
    const roiNum = totalInvestido > 0 ? totalNet / totalInvestido : 0
    const gastosMarketingManual = expenseRecords.filter(r => r.category === 'marketing').reduce((s, r) => s + r.amount, 0)
    const gastosMarketing = gastosMarketingManual + taboola
    const roas = gastosMarketing > 0 ? totalReceita / gastosMarketing : 0

    const categoryTotals = EXPENSE_CATEGORIES.map(c => ({
        name: c.label,
        value: expenseRecords.filter(r => r.category === c.value).reduce((s, r) => s + r.amount, 0),
        color: c.color,
        icon: c.icon,
    })).filter(c => c.value > 0)

    // Adicionar Taboola como categoria se houver gasto
    if (taboola > 0) {
        categoryTotals.push({ name: 'Taboola Ads', value: taboola, color: '#4285f4', icon: '📢' })
    }

    const handleAdd = async (newRecord: { type: string; category: string; description: string; amount: number; date: string }) => {
        const res = await fetch('/api/admin/financial', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newRecord),
        })
        if (res.ok) {
            const saved = await res.json()
            setAllRecords(prev => [saved, ...prev])
            router.refresh()
        }
    }

    const handleDelete = async (id: string) => {
        const res = await fetch(`/api/admin/financial?id=${id}`, { method: 'DELETE' })
        if (res.ok) {
            setAllRecords(prev => prev.filter(r => r.id !== id))
            router.refresh()
        }
    }

    return (
        <div style={{ paddingBottom: '40px' }}>
            <style jsx global>{`
                @keyframes modalSlideIn {
                    from { opacity: 0; transform: translateY(20px) scale(0.96); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(16px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .fin-card { animation: fadeUp 0.4s ease-out both; }
                .fin-card:nth-child(1) { animation-delay: 0s; }
                .fin-card:nth-child(2) { animation-delay: 0.05s; }
                .fin-card:nth-child(3) { animation-delay: 0.1s; }
                .fin-card:nth-child(4) { animation-delay: 0.15s; }
                .fin-card:nth-child(5) { animation-delay: 0.2s; }
                .fin-card:nth-child(6) { animation-delay: 0.25s; }
                .fin-card:nth-child(7) { animation-delay: 0.3s; }
                .fin-card:nth-child(8) { animation-delay: 0.35s; }
                .fin-charts-row { grid-template-columns: 2fr 1fr !important; }
                .fin-composition-row { grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)) !important; }
                @media (max-width: 768px) {
                    .fin-charts-row { grid-template-columns: 1fr !important; }
                    .fin-composition-row { grid-template-columns: 1fr !important; }
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
                            background: 'linear-gradient(135deg, #10b981, #059669)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 6px 20px rgba(16,185,129,0.35)', flexShrink: 0,
                        }}>
                            <Wallet size={20} color="white" />
                        </div>
                        <div>
                            <h1 style={{ fontSize: 'clamp(1.1rem, 4vw, 1.5rem)', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.03em' }}>
                                Financeiro
                            </h1>
                            <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0, fontWeight: 500 }}>
                                Lucro, despesas e performance.
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
                            { key: 'this_month', label: 'Este Mês' },
                            { key: 'last_month', label: 'Mês Passado' },
                            { key: '90d', label: '90 dias' },
                            { key: 'all', label: 'Tudo' },
                        ].map(p => (
                            <button key={p.key} onClick={() => setFilterPeriod(p.key)} style={{
                                padding: '7px 14px', borderRadius: '9px', border: 'none', cursor: 'pointer',
                                background: filterPeriod === p.key ? '#fff' : 'transparent',
                                color: filterPeriod === p.key ? '#0f172a' : '#94a3b8',
                                fontSize: '11px', fontWeight: 700,
                                boxShadow: filterPeriod === p.key ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                                transition: 'all 0.2s',
                            }}>
                                {p.label}
                            </button>
                        ))}
                    </div>
                    <button onClick={() => setShowAddModal(true)} style={{
                        padding: '9px 18px', borderRadius: '12px', border: 'none',
                        background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                        color: '#fff', fontSize: '12px', fontWeight: 800, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '6px',
                        boxShadow: '0 4px 16px rgba(99,102,241,0.35)',
                        transition: 'all 0.2s',
                    }}>
                        <Plus size={14} /> Nova Despesa
                    </button>
                </div>
            </header>

            {/* KPI Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '12px', marginBottom: '24px' }}>
                {/* Receita Bruta */}
                <div className="fin-card" style={{
                    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                    borderRadius: '20px', padding: '22px', position: 'relative', overflow: 'hidden',
                    boxShadow: '0 8px 32px rgba(15, 23, 42, 0.3)',
                }}>
                    <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', background: 'radial-gradient(circle, rgba(16,185,129,0.2) 0%, transparent 70%)', borderRadius: '50%' }} />
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(5,150,105,0.15))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <DollarSign size={18} color="#34d399" />
                        </div>
                        <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>{kpis.paidOrders} pedidos</span>
                    </div>
                    <p style={{ margin: '0 0 4px', fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Receita Bruta</p>
                    <p style={{ margin: 0, fontSize: '26px', fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', fontFamily: "'Space Grotesk', sans-serif" }}>
                        R$ {fmt(totalReceita)}
                    </p>
                </div>

                {/* Receita Líquida */}
                <div className="fin-card" style={{
                    background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
                    border: '1px solid rgba(241,245,249,0.8)', borderRadius: '20px', padding: '22px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.02), 0 4px 12px rgba(0,0,0,0.03)',
                }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #eef2ff, #e0e7ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px', boxShadow: '0 2px 8px rgba(99,102,241,0.1)' }}>
                        <Wallet size={18} color="#6366f1" />
                    </div>
                    <p style={{ margin: '0 0 4px', fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Receita Líquida</p>
                    <p style={{ margin: 0, fontSize: '22px', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em', fontFamily: "'Space Grotesk', sans-serif" }}>
                        R$ {fmt(totalNet)}
                    </p>
                </div>

                {/* Total Despesas */}
                <div className="fin-card" style={{
                    background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
                    border: '1px solid rgba(241,245,249,0.8)', borderRadius: '20px', padding: '22px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.02), 0 4px 12px rgba(0,0,0,0.03)',
                }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #fff7ed, #ffedd5)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px', boxShadow: '0 2px 8px rgba(249,115,22,0.1)' }}>
                        <TrendingDown size={18} color="#f97316" />
                    </div>
                    <p style={{ margin: '0 0 4px', fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Despesas</p>
                    <p style={{ margin: 0, fontSize: '22px', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em', fontFamily: "'Space Grotesk', sans-serif" }}>
                        R$ {fmt(totalDespesas)}
                    </p>
                </div>

                {/* Lucro Operacional */}
                <div className="fin-card" style={{
                    background: lucroCalc >= 0
                        ? 'linear-gradient(135deg, #059669 0%, #047857 100%)'
                        : 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                    borderRadius: '20px', padding: '22px', position: 'relative', overflow: 'hidden',
                    boxShadow: lucroCalc >= 0 ? '0 8px 32px rgba(5,150,105,0.3)' : '0 8px 32px rgba(220,38,38,0.3)',
                }}>
                    <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)', borderRadius: '50%' }} />
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <TrendingUp size={18} color="#fff" />
                        </div>
                        <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', fontWeight: 700, background: 'rgba(255,255,255,0.1)', padding: '3px 8px', borderRadius: '6px' }}>
                            {margemCalc.toFixed(1)}% margem
                        </span>
                    </div>
                    <p style={{ margin: '0 0 4px', fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Lucro Operacional</p>
                    <p style={{ margin: 0, fontSize: '26px', fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', fontFamily: "'Space Grotesk', sans-serif" }}>
                        R$ {fmt(lucroCalc)}
                    </p>
                </div>

                {/* ROI */}
                <div className="fin-card" style={{
                    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                    borderRadius: '20px', padding: '22px', position: 'relative', overflow: 'hidden',
                    boxShadow: '0 8px 32px rgba(15, 23, 42, 0.3)',
                }}>
                    <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', background: 'radial-gradient(circle, rgba(236,72,153,0.2) 0%, transparent 70%)', borderRadius: '50%' }} />
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, rgba(236,72,153,0.2), rgba(219,39,119,0.15))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Zap size={18} color="#f472b6" />
                        </div>
                        <span style={{ fontSize: '28px', fontWeight: 900, color: roiNum >= 1 ? '#34d399' : '#f87171', fontFamily: "'Space Grotesk', sans-serif" }}>
                            {roiNum > 0 ? `${roiNum.toFixed(1)}x` : '—'}
                        </span>
                    </div>
                    <p style={{ margin: '0 0 4px', fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>ROI</p>
                    <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>
                        {roiNum > 0 ? `A cada R$1 investido, R$${roiNum.toFixed(2)} de retorno` : 'Sem dados de investimento'}
                    </p>
                </div>

                {/* ROAS */}
                <div className="fin-card" style={{
                    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                    borderRadius: '20px', padding: '22px', position: 'relative', overflow: 'hidden',
                    boxShadow: '0 8px 32px rgba(15, 23, 42, 0.3)',
                }}>
                    <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', background: 'radial-gradient(circle, rgba(249,115,22,0.2) 0%, transparent 70%)', borderRadius: '50%' }} />
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, rgba(249,115,22,0.2), rgba(234,88,12,0.15))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Activity size={18} color="#fb923c" />
                        </div>
                        <span style={{ fontSize: '28px', fontWeight: 900, color: roas >= 3 ? '#34d399' : roas >= 1 ? '#fbbf24' : '#f87171', fontFamily: "'Space Grotesk', sans-serif" }}>
                            {roas > 0 ? `${roas.toFixed(1)}x` : '—'}
                        </span>
                    </div>
                    <p style={{ margin: '0 0 4px', fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>ROAS</p>
                    <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>
                        {roas > 0 ? `A cada R$1 em marketing, R$${roas.toFixed(2)} de receita` : 'Sem gastos em marketing'}
                    </p>
                </div>

                {/* Taxa Média MP */}
                <div className="fin-card" style={{
                    background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
                    border: '1px solid rgba(241,245,249,0.8)', borderRadius: '20px', padding: '22px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.02), 0 4px 12px rgba(0,0,0,0.03)',
                }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #fdf2f8, #fce7f3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px', boxShadow: '0 2px 8px rgba(236,72,153,0.1)' }}>
                        <CircleDollarSign size={18} color="#ec4899" />
                    </div>
                    <p style={{ margin: '0 0 4px', fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Taxa MP</p>
                    <p style={{ margin: 0, fontSize: '22px', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em', fontFamily: "'Space Grotesk', sans-serif" }}>
                        R$ {fmt(totalReceita - totalNet)}
                    </p>
                    <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>
                        {totalReceita > 0 ? ((totalReceita - totalNet) / totalReceita * 100).toFixed(1) : 0}% da receita
                    </p>
                </div>
            </div>

            {/* Charts Row */}
            <div className="fin-charts-row" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <SectionCard title="Evolução Financeira" subtitle={`Receita vs Despesas — ${filterPeriod === 'today' ? 'Hoje' : filterPeriod === '7d' ? '7 dias' : filterPeriod === '90d' ? '90 dias' : filterPeriod === 'this_month' ? 'Este Mês' : filterPeriod === 'last_month' ? 'Mês Passado' : filterPeriod === 'all' ? 'Tudo' : '30 dias'}`}>
                    <ResponsiveContainer width="100%" height={280}>
                        <AreaChart data={initialData.dailyRevenue} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                            <defs>
                                <linearGradient id="gradReceita" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.25} />
                                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="gradDespesa" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#f97316" stopOpacity={0.2} />
                                    <stop offset="100%" stopColor="#f97316" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="gradLucro" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.15} />
                                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} tickLine={false} axisLine={false} interval={4} />
                            <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v} />
                            <Tooltip content={<ChartTooltip />} />
                            <Area type="monotone" dataKey="receita" name="Receita" stroke="#10b981" strokeWidth={2.5} fill="url(#gradReceita)" dot={false} activeDot={{ r: 5, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }} />
                            <Area type="monotone" dataKey="despesa" name="Despesa" stroke="#f97316" strokeWidth={2} fill="url(#gradDespesa)" dot={false} strokeDasharray="6 4" activeDot={{ r: 4, fill: '#f97316', stroke: '#fff', strokeWidth: 2 }} />
                            <Area type="monotone" dataKey="lucro" name="Lucro" stroke="#6366f1" strokeWidth={2.5} fill="url(#gradLucro)" dot={false} activeDot={{ r: 5, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 }} />
                        </AreaChart>
                    </ResponsiveContainer>
                    <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginTop: '12px', padding: '10px 0', borderTop: '1px solid #f1f5f9' }}>
                        {[
                            { color: '#10b981', label: 'Receita', dash: false },
                            { color: '#f97316', label: 'Despesa', dash: true },
                            { color: '#6366f1', label: 'Lucro', dash: false },
                        ].map(l => (
                            <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ width: '20px', height: '3px', borderRadius: '2px', background: l.color, borderStyle: l.dash ? 'dashed' : 'solid' }} />
                                <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>{l.label}</span>
                            </div>
                        ))}
                    </div>
                </SectionCard>

                <SectionCard title="Despesas por Categoria" subtitle="Distribuição do período">
                    {categoryTotals.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '48px 0' }}>
                            <div style={{
                                width: '64px', height: '64px', borderRadius: '18px',
                                background: 'linear-gradient(135deg, #f1f5f9, #e2e8f0)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                margin: '0 auto 16px',
                            }}>
                                <BarChart3 size={28} color="#94a3b8" />
                            </div>
                            <p style={{ color: '#64748b', fontSize: '14px', fontWeight: 700, margin: 0 }}>Nenhuma despesa</p>
                            <p style={{ color: '#cbd5e1', fontSize: '12px', margin: '6px 0 0' }}>Registre gastos para ver o gráfico</p>
                        </div>
                    ) : (
                        <>
                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                                <ResponsiveContainer width="100%" height={170}>
                                    <PieChart>
                                        <Pie
                                            data={categoryTotals}
                                            dataKey="value" nameKey="name"
                                            cx="50%" cy="50%"
                                            innerRadius={45} outerRadius={70} paddingAngle={5}
                                            stroke="none"
                                        >
                                            {categoryTotals.map((c, i) => (
                                                <Cell key={i} fill={c.color} style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }} />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<PieTooltip />} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
                                {categoryTotals.map((c) => {
                                    const pct = (totalDespesas + taboola) > 0 ? ((c.value / (totalDespesas + taboola)) * 100).toFixed(0) : 0
                                    return (
                                        <div key={c.name} style={{
                                            display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px',
                                            background: '#f8fafc', borderRadius: '10px', border: '1px solid #f1f5f9',
                                        }}>
                                            <span style={{ fontSize: '14px' }}>{c.icon}</span>
                                            <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569', flex: 1 }}>{c.name}</span>
                                            <span style={{ fontSize: '12px', fontWeight: 900, color: '#1e293b', fontFamily: "'Space Grotesk', sans-serif" }}>R$ {fmt(c.value)}</span>
                                            <span style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', background: '#e2e8f0', padding: '2px 7px', borderRadius: '6px' }}>{pct}%</span>
                                        </div>
                                    )
                                })}
                            </div>
                        </>
                    )}
                </SectionCard>
            </div>

            {/* Composição do Lucro */}
            <SectionCard title="Composição do Lucro" subtitle="Detalhamento financeiro" style={{ marginBottom: '14px' }}>
                <div className="fin-composition-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px' }}>
                    {[
                        { label: 'Receita Bruta', value: totalReceita, color: '#10b981', bg: '#ecfdf5', icon: '💰' },
                        { label: '(-) Taxa MP', value: totalReceita - totalNet, color: '#ec4899', bg: '#fdf2f8', icon: '💳' },
                        { label: 'Receita Líquida', value: totalNet, color: '#6366f1', bg: '#eef2ff', icon: '🏦' },
                        { label: '(-) Custo Produto', value: expenseRecords.filter(r => r.category === 'custo_produto').reduce((s, r) => s + r.amount, 0) || custoProduto, color: '#dc2626', bg: '#fef2f2', icon: '📦' },
                        { label: '(-) Marketing', value: gastosMarketing, color: '#f97316', bg: '#fff7ed', icon: '📢' },
                        { label: '(-) Operacional', value: expenseRecords.filter(r => r.category === 'operacional').reduce((s, r) => s + r.amount, 0), color: '#6366f1', bg: '#eef2ff', icon: '⚙️' },
                        { label: '(-) Frete', value: expenseRecords.filter(r => r.category === 'frete').reduce((s, r) => s + r.amount, 0), color: '#0ea5e9', bg: '#f0f9ff', icon: '🚚' },
                        { label: '(-) Taxas', value: expenseRecords.filter(r => r.category === 'taxa').reduce((s, r) => s + r.amount, 0), color: '#ec4899', bg: '#fdf2f8', icon: '📋' },
                    ].map(item => (
                        <div key={item.label} style={{
                            padding: '14px', background: item.bg, borderRadius: '14px',
                            border: '1px solid rgba(0,0,0,0.03)',
                            transition: 'transform 0.2s',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                                <span style={{ fontSize: '12px' }}>{item.icon}</span>
                                <p style={{ margin: 0, fontSize: '9px', fontWeight: 700, color: item.color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    {item.label}
                                </p>
                            </div>
                            <p style={{ margin: 0, fontSize: '17px', fontWeight: 900, color: '#0f172a', fontFamily: "'Space Grotesk', sans-serif" }}>
                                R$ {fmt(item.value)}
                            </p>
                        </div>
                    ))}
                    <div style={{
                        padding: '14px',
                        background: lucroCalc >= 0 ? 'linear-gradient(135deg, #059669, #047857)' : 'linear-gradient(135deg, #dc2626, #b91c1c)',
                        borderRadius: '14px',
                        boxShadow: lucroCalc >= 0 ? '0 4px 16px rgba(5,150,105,0.25)' : '0 4px 16px rgba(220,38,38,0.25)',
                    }}>
                        <p style={{ margin: '0 0 6px', fontSize: '9px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            (=) LUCRO OPERACIONAL
                        </p>
                        <p style={{ margin: 0, fontSize: '17px', fontWeight: 900, color: '#fff', fontFamily: "'Space Grotesk', sans-serif" }}>
                            R$ {fmt(lucroCalc)}
                        </p>
                        <p style={{ margin: '4px 0 0', fontSize: '10px', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>
                            ROI: {roiNum > 0 ? `${roiNum.toFixed(1)}x` : '—'}
                        </p>
                    </div>
                </div>
            </SectionCard>

            {/* Taboola Accounts */}
            {currentTaboola.accounts && currentTaboola.accounts.length > 0 && (
                <SectionCard
                    title="Contas Taboola"
                    subtitle={`Performance por conta — ${currentTaboola.accounts.filter(a => !a.error).length} de ${currentTaboola.accounts.length} conectadas`}
                    style={{ marginBottom: '14px' }}
                    headerRight={
                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                            {taboolaLoading && <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600 }}>Carregando...</span>}
                            {[
                                { value: 'today', label: 'Hoje' },
                                { value: 'yesterday', label: 'Ontem' },
                                { value: 'week', label: 'Esta semana' },
                                { value: 'this_month', label: 'Este mês' },
                                { value: 'last_month', label: 'Mês passado' },
                            ].map(p => (
                                <button
                                    key={p.value}
                                    type="button"
                                    onClick={() => { setTaboolaPeriod(p.value); fetchTaboolaData(p.value) }}
                                    style={{
                                        padding: '5px 10px', borderRadius: '6px',
                                        border: 'none',
                                        background: taboolaPeriod === p.value ? '#14151F' : '#f1f5f9',
                                        color: taboolaPeriod === p.value ? '#fff' : '#64748b',
                                        fontSize: '10px', fontWeight: 700, cursor: 'pointer',
                                        transition: 'all 0.15s', fontFamily: 'inherit',
                                    }}
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>
                    }
                >
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '14px' }}>
                        {currentTaboola.accounts.map((acc, i) => {
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
                                    {/* Header */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                                        <div style={{
                                            width: '36px', height: '36px', borderRadius: '10px',
                                            background: acc.error ? '#fecaca' : `${accent}18`,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            flexShrink: 0,
                                        }}>
                                            <Target size={16} color={acc.error ? '#dc2626' : accent} />
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <p style={{ margin: 0, fontSize: '13px', fontWeight: 800, color: acc.error ? '#991b1b' : '#0f172a' }}>
                                                {acc.label}
                                            </p>
                                            <p style={{ margin: '2px 0 0', fontSize: '10px', color: '#94a3b8', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {acc.accountId}
                                            </p>
                                        </div>
                                        {acc.error ? (
                                            <span style={{
                                                fontSize: '9px', fontWeight: 700, color: '#dc2626',
                                                background: '#fef2f2', padding: '3px 8px', borderRadius: '6px',
                                                border: '1px solid #fecaca',
                                            }}>
                                                Erro
                                            </span>
                                        ) : (
                                            <span style={{
                                                fontSize: '9px', fontWeight: 700, color: '#059669',
                                                background: '#ecfdf5', padding: '3px 8px', borderRadius: '6px',
                                            }}>
                                                Conectada
                                            </span>
                                        )}
                                    </div>

                                    {acc.error ? (
                                        <p style={{ margin: 0, fontSize: '12px', color: '#b91c1c', fontWeight: 500 }}>{acc.error}</p>
                                    ) : (
                                        <>
                                            {/* Main metric */}
                                            <div style={{ marginBottom: '14px' }}>
                                                <p style={{ margin: '0 0 2px', fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Gasto Total</p>
                                                <p style={{ margin: 0, fontSize: '24px', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em', fontFamily: "'Space Grotesk', sans-serif" }}>
                                                    R$ {fmt(acc.totalSpent)}
                                                </p>
                                            </div>

                                            {/* Metrics grid */}
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                                                <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '10px', border: '1px solid #f1f5f9' }}>
                                                    <p style={{ margin: 0, fontSize: '9px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Impressões</p>
                                                    <p style={{ margin: '4px 0 0', fontSize: '14px', fontWeight: 900, color: '#1e293b', fontFamily: "'Space Grotesk', sans-serif" }}>
                                                        {fmtNum(acc.totalImpressions)}
                                                    </p>
                                                </div>
                                                <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '10px', border: '1px solid #f1f5f9' }}>
                                                    <p style={{ margin: 0, fontSize: '9px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cliques</p>
                                                    <p style={{ margin: '4px 0 0', fontSize: '14px', fontWeight: 900, color: '#1e293b', fontFamily: "'Space Grotesk', sans-serif" }}>
                                                        {fmtNum(acc.totalClicks)}
                                                    </p>
                                                </div>
                                                <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '10px', border: '1px solid #f1f5f9' }}>
                                                    <p style={{ margin: 0, fontSize: '9px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>CTR</p>
                                                    <p style={{ margin: '4px 0 0', fontSize: '14px', fontWeight: 900, color: '#1e293b', fontFamily: "'Space Grotesk', sans-serif" }}>
                                                        {acc.ctr.toFixed(2)}%
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Bottom row */}
                                            {/* Metrics row 2 */}
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginTop: '8px' }}>
                                                <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '10px', border: '1px solid #f1f5f9' }}>
                                                    <p style={{ margin: 0, fontSize: '9px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Conversões</p>
                                                    <p style={{ margin: '4px 0 0', fontSize: '14px', fontWeight: 900, color: acc.totalConversions > 0 ? '#059669' : '#1e293b', fontFamily: "'Space Grotesk', sans-serif" }}>
                                                        {fmtNum(acc.totalConversions)}
                                                    </p>
                                                </div>
                                                <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '10px', border: '1px solid #f1f5f9' }}>
                                                    <p style={{ margin: 0, fontSize: '9px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>CPA</p>
                                                    <p style={{ margin: '4px 0 0', fontSize: '14px', fontWeight: 900, color: '#1e293b', fontFamily: "'Space Grotesk', sans-serif" }}>
                                                        {acc.cpa > 0 ? `R$ ${fmt(acc.cpa)}` : '—'}
                                                    </p>
                                                </div>
                                                <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '10px', border: '1px solid #f1f5f9' }}>
                                                    <p style={{ margin: 0, fontSize: '9px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>CPC</p>
                                                    <p style={{ margin: '4px 0 0', fontSize: '14px', fontWeight: 900, color: '#1e293b', fontFamily: "'Space Grotesk', sans-serif" }}>
                                                        R$ {fmt(acc.cpc)}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Revenue Attribution */}
                                            {(() => {
                                                const rev = currentTaboola.revenue?.find(r => r.accountId === acc.accountId)
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
                                                        {/* Progress bar */}
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

                    {/* Total row */}
                    {currentTaboola.accounts.filter(a => !a.error).length > 1 && (
                        <div style={{
                            marginTop: '14px', padding: '16px 20px',
                            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                            borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            boxShadow: '0 8px 32px rgba(15,23,42,0.2)',
                        }}>
                            <div>
                                <p style={{ margin: 0, fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total Taboola (todas as contas)</p>
                                <p style={{ margin: '4px 0 0', fontSize: '22px', fontWeight: 900, color: '#fff', fontFamily: "'Space Grotesk', sans-serif" }}>
                                    R$ {fmt(taboola)}
                                </p>
                            </div>
                            <div style={{ display: 'flex', gap: '20px' }}>
                                <div style={{ textAlign: 'right' }}>
                                    <p style={{ margin: 0, fontSize: '9px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Conversões</p>
                                    <p style={{ margin: '2px 0 0', fontSize: '16px', fontWeight: 900, color: '#34d399', fontFamily: "'Space Grotesk', sans-serif" }}>
                                        {fmtNum(currentTaboola.accounts.reduce((s, a) => s + a.totalConversions, 0))}
                                    </p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <p style={{ margin: 0, fontSize: '9px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>CPA Médio</p>
                                    <p style={{ margin: '2px 0 0', fontSize: '16px', fontWeight: 900, color: '#fff', fontFamily: "'Space Grotesk', sans-serif" }}>
                                        {(() => { const totalConv = currentTaboola.accounts.reduce((s, a) => s + a.totalConversions, 0); return totalConv > 0 ? `R$ ${fmt(taboola / totalConv)}` : '—' })()}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </SectionCard>
            )}

            {/* Despesas */}
            <SectionCard title="Últimas Despesas" subtitle={`${expenseRecords.length} registros no período`}>
                {expenseRecords.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '32px 0' }}>
                        <p style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 600, margin: 0 }}>Nenhuma despesa no período</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {expenseRecords.slice(0, 10).map(record => {
                            const cat = EXPENSE_CATEGORIES.find(c => c.value === record.category)
                            return (
                                <div key={record.id} style={{
                                    display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px',
                                    background: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9',
                                    transition: 'all 0.2s',
                                }}>
                                    <div style={{
                                        width: '38px', height: '38px', borderRadius: '10px',
                                        background: (cat?.color || '#64748b') + '12',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                        fontSize: '16px',
                                    }}>
                                        {cat?.icon || '📋'}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>
                                            {record.description}
                                        </p>
                                        <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>
                                            {cat?.label || record.category} · {new Date(record.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                        </p>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <span style={{ fontSize: '14px', fontWeight: 900, color: '#dc2626', fontFamily: "'Space Grotesk', sans-serif" }}>
                                            -R$ {fmt(record.amount)}
                                        </span>
                                        <button onClick={() => handleDelete(record.id)} style={{
                                            background: 'none', border: 'none', cursor: 'pointer',
                                            color: '#cbd5e1', padding: '6px', borderRadius: '8px',
                                            transition: 'all 0.2s', display: 'flex', alignItems: 'center',
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.color = '#dc2626'; e.currentTarget.style.background = '#fef2f2' }}
                                        onMouseLeave={e => { e.currentTarget.style.color = '#cbd5e1'; e.currentTarget.style.background = 'none' }}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </SectionCard>

            <AddExpenseModal open={showAddModal} onClose={() => setShowAddModal(false)} onAdd={handleAdd} />
        </div>
    )
}
