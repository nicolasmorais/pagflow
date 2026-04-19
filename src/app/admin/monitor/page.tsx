'use client'

import { useState, useEffect } from 'react'
import {
    Users,
    ShoppingCart,
    DollarSign,
    ArrowRight,
    Activity,
    ShieldAlert,
    CheckCircle2,
    RotateCcw,
    Zap,
    Settings
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import '../admin.css'

export default function MonitorPage() {
    const [stats, setStats] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [isRefreshing, setIsRefreshing] = useState(false)

    const fetchStats = async () => {
        setIsRefreshing(true)
        try {
            const res = await fetch('/api/admin/checkout-stats')
            const data = await res.json()
            setStats(data)
        } catch (error) {
            console.error('Failed to fetch stats:', error)
        } finally {
            setLoading(false)
            setIsRefreshing(false)
        }
    }

    useEffect(() => {
        fetchStats()
        const interval = setInterval(fetchStats, 10000) // Auto refresh every 10s
        return () => clearInterval(interval)
    }, [])

    if (loading && !stats) {
        return (
            <div className="admin-container">
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
                </div>
            </div>
        )
    }

    const convRate = stats?.funnel?.visits > 0
        ? ((stats.funnel.completed / stats.funnel.visits) * 100).toFixed(1)
        : '0.0'

    return (
        <div className="admin-container">
            <header className="page-header flex justify-between items-center mb-8">
                <div>
                    <h1 className="page-title mb-1">Monitor de Checkout</h1>
                    <p className="page-subtitle">Acompanhe o desempenho do seu funil em tempo real.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full border border-green-100">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        <span className="text-xs font-bold uppercase tracking-wider">Ao Vivo</span>
                    </div>
                    <button
                        onClick={fetchStats}
                        disabled={isRefreshing}
                        className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <RotateCcw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </header>

            {/* KPI GRID */}
            <div className="monitor-grid">
                <div className="monitor-card">
                    <div className="flex items-center justify-between mb-2">
                        <span className="monitor-label">Visitas Hoje</span>
                        <Users className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="monitor-value">{stats?.funnel?.visits || 0}</div>
                </div>
                <div className="monitor-card">
                    <div className="flex items-center justify-between mb-2">
                        <span className="monitor-label">Abandonos</span>
                        <ShoppingCart className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="monitor-value red">{stats?.orders?.abandoned || 0}</div>
                </div>
                <div className="monitor-card">
                    <div className="flex items-center justify-between mb-2">
                        <span className="monitor-label">Vendas Pagas</span>
                        <DollarSign className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="monitor-value green">{stats?.orders?.paid || 0}</div>
                </div>
                <div className="monitor-card">
                    <div className="flex items-center justify-between mb-2">
                        <span className="monitor-label">Conversão Geral</span>
                        <Zap className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="monitor-value">{convRate}%</div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* LEFT COLUMN */}
                <div className="flex flex-col gap-6">
                    {/* FUNNEL */}
                    <div className="monitor-card">
                        <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                            <Activity className="w-5 h-5" /> Funil de Conversão
                        </h3>
                        <div className="funnel-container">
                            {[
                                { label: 'Iniciou Checkout', val: stats?.funnel?.visits, color: '#1a1a18' },
                                { label: 'Dados Pessoais', val: stats?.funnel?.step1, color: '#333' },
                                { label: 'Entrega', val: stats?.funnel?.step2, color: '#444' },
                                { label: 'Pagamento', val: stats?.funnel?.step3, color: '#666' },
                                { label: 'Venda Concluída', val: stats?.funnel?.completed, color: '#10b981' },
                            ].map((step, i) => {
                                const percentage = stats?.funnel?.visits > 0
                                    ? ((step.val / stats.funnel.visits) * 100).toFixed(0)
                                    : 0
                                return (
                                    <div key={i} className="funnel-row">
                                        <div className="funnel-label">{step.label}</div>
                                        <div className="funnel-bar-bg">
                                            <div
                                                className="funnel-bar-fill"
                                                style={{ width: `${percentage}%`, background: step.color }}
                                            ></div>
                                        </div>
                                        <div className="w-16 text-right font-bold text-sm">
                                            {step.val} <span className="text-gray-400 font-normal">({percentage}%)</span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* QUICK ACTIONS */}
                    <div className="monitor-card">
                        <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                            <Settings className="w-5 h-5" /> Ações Rápidas
                        </h3>
                        <div className="flex flex-col gap-3">
                            <a href="/admin/antifuga" className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-100 transition-colors">
                                <span className="text-sm font-bold text-gray-700">Ajustar Sistema Anti-Fuga</span>
                                <ArrowRight className="w-4 h-4 text-gray-400" />
                            </a>
                            <a href="/admin/configuracoes" className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-100 transition-colors">
                                <span className="text-sm font-bold text-gray-700">Configurar Taxas e Descontos</span>
                                <ArrowRight className="w-4 h-4 text-gray-400" />
                            </a>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: ACTIVITY FEED */}
                <div className="monitor-card flex flex-col">
                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                        <Zap className="w-5 h-5" /> Atividade em Tempo Real
                    </h3>
                    <div className="activity-feed">
                        {stats?.activities?.length > 0 ? (
                            stats.activities.map((act: any, i: number) => (
                                <div key={i} className="activity-item">
                                    <div className="activity-icon">
                                        {act.type === 'access' ? (
                                            act.step === 'Finalizado' ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Users className="w-4 h-4 text-blue-500" />
                                        ) : (
                                            act.event === 'accepted' ? <Zap className="w-4 h-4 text-yellow-500" /> : <ShieldAlert className="w-4 h-4 text-gray-400" />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-sm font-bold">
                                            {act.type === 'access' ? (
                                                `Novo acesso ao checkout`
                                            ) : (
                                                `Gatilho Anti-Fuga: ${act.event === 'accepted' ? 'Aceito!' : act.event}`
                                            )}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {act.type === 'access' ? `Status: ${act.step}` : `Evento registrado`}
                                        </div>
                                    </div>
                                    <div className="text-[10px] uppercase font-bold text-gray-400">
                                        {formatDistanceToNow(new Date(act.time), { addSuffix: true, locale: ptBR })}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-12 text-gray-400">
                                Nenhuma atividade recente registrada hoje.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
