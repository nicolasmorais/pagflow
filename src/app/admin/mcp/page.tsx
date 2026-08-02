'use client'

import { useState } from 'react'
import {
    Bot, Copy, Check, Terminal, Database, Zap, Search,
    BarChart3, ShoppingCart, Package, TrendingUp, Users,
    Mail, DollarSign, GitBranch, Activity, Shield, Globe
} from 'lucide-react'

const endpoints = [
    { method: 'GET', path: '/api/health', desc: 'Health check do servidor', icon: Activity, color: '#22c55e' },
    { method: 'GET', path: '/api/sales-summary', desc: 'Resumo agregado de vendas', icon: BarChart3, color: '#6366f1' },
    { method: 'GET', path: '/api/orders', desc: 'Lista pedidos com filtros', icon: ShoppingCart, color: '#3b82f6' },
    { method: 'GET', path: '/api/orders/:id', desc: 'Detalhes de um pedido', icon: ShoppingCart, color: '#0ea5e9' },
    { method: 'GET', path: '/api/orders/search', desc: 'Busca por nome, email, CPF', icon: Search, color: '#8b5cf6' },
    { method: 'GET', path: '/api/products', desc: 'Lista produtos com vendas', icon: Package, color: '#f59e0b' },
    { method: 'GET', path: '/api/top-products', desc: 'Ranking de produtos', icon: TrendingUp, color: '#10b981' },
    { method: 'GET', path: '/api/sales-by-period', desc: 'Vendas por dia/semana/mês', icon: Activity, color: '#ec4899' },
    { method: 'GET', path: '/api/utm-performance', desc: 'Performance de campanhas UTM', icon: GitBranch, color: '#14b8a6' },
    { method: 'GET', path: '/api/financial', desc: 'Receitas e despesas', icon: DollarSign, color: '#f97316' },
    { method: 'GET', path: '/api/dashboard-kpis', desc: 'KPIs com comparação', icon: BarChart3, color: '#6366f1' },
    { method: 'GET', path: '/api/customers', desc: 'Clientes únicos', icon: Users, color: '#a855f7' },
    { method: 'GET', path: '/api/conversion-funnel', desc: 'Funil de conversão', icon: Zap, color: '#22c55e' },
    { method: 'GET', path: '/api/email-logs', desc: 'Logs de e-mails', icon: Mail, color: '#06b6d4' },
]

export default function McpPage() {
    const [copiedUrl, setCopiedUrl] = useState(false)
    const [copiedKey, setCopiedKey] = useState(false)
    const [copiedExample, setCopiedExample] = useState<string | null>(null)

    const baseUrl = 'https://mcp.elabela.store'
    const apiKey = 'hermes-pagflow-key'

    const handleCopy = (text: string, setter: (v: boolean) => void) => {
        navigator.clipboard.writeText(text)
        setter(true)
        setTimeout(() => setter(false), 2000)
    }

    const handleCopyExample = (text: string, id: string) => {
        navigator.clipboard.writeText(text)
        setCopiedExample(id)
        setTimeout(() => setCopiedExample(null), 2000)
    }

    const examples = [
        { id: 'summary', label: 'Resumo de vendas', cmd: `curl -H "x-api-key: ${apiKey}" ${baseUrl}/api/sales-summary?from=2026-01-01` },
        { id: 'orders', label: 'Listar pedidos', cmd: `curl -H "x-api-key: ${apiKey}" ${baseUrl}/api/orders?limit=10` },
        { id: 'search', label: 'Buscar pedido', cmd: `curl -H "x-api-key: ${apiKey}" "${baseUrl}/api/orders/search?q=joao@email.com"` },
        { id: 'kpis', label: 'Dashboard KPIs', cmd: `curl -H "x-api-key: ${apiKey}" ${baseUrl}/api/dashboard-kpis?from=2026-07-01&to=2026-07-31` },
    ]

    return (
        <div style={{ paddingBottom: '40px' }}>
            <style jsx global>{`
                @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes mcpPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
                .mcp-card { animation: fadeUp 0.4s ease-out both; }
                .mcp-card:nth-child(1) { animation-delay: 0s; }
                .mcp-card:nth-child(2) { animation-delay: 0.05s; }
                .mcp-card:nth-child(3) { animation-delay: 0.1s; }
                .mcp-card:nth-child(4) { animation-delay: 0.15s; }
            `}</style>

            {/* Header */}
            <header style={{ marginBottom: '28px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                    <div style={{
                        width: '42px', height: '42px', borderRadius: '14px',
                        background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 6px 20px rgba(139,92,246,0.35)', flexShrink: 0,
                    }}>
                        <Bot size={20} color="white" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: 'clamp(1.1rem, 4vw, 1.5rem)', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.03em' }}>
                            Hermes API
                        </h1>
                        <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0, fontWeight: 500 }}>
                            REST API para consultas de dados — autenticada por API Key
                        </p>
                    </div>
                </div>
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    background: '#ecfdf5', padding: '8px 16px', borderRadius: '12px',
                    border: '1px solid #bbf7d0',
                }}>
                    <div style={{
                        width: '8px', height: '8px', borderRadius: '50%',
                        background: '#22c55e', boxShadow: '0 0 8px rgba(34,197,94,0.5)',
                        animation: 'mcpPulse 2s ease-in-out infinite',
                    }} />
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#059669' }}>Ativo</span>
                </div>
            </header>

            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '24px' }}>
                <div className="mcp-card" style={{
                    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                    borderRadius: '20px', padding: '22px', position: 'relative', overflow: 'hidden',
                    boxShadow: '0 8px 32px rgba(15, 23, 42, 0.3)',
                }}>
                    <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', background: 'radial-gradient(circle, rgba(139,92,246,0.2) 0%, transparent 70%)', borderRadius: '50%' }} />
                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(109,40,217,0.15))', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
                        <Globe size={18} color="#a78bfa" />
                    </div>
                    <p style={{ margin: '0 0 4px', fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Base URL</p>
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: 900, color: '#fff', fontFamily: "'Space Grotesk', sans-serif", wordBreak: 'break-all' }}>{baseUrl}</p>
                </div>

                <div className="mcp-card" style={{
                    background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
                    border: '1px solid rgba(241,245,249,0.8)', borderRadius: '20px', padding: '22px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.02), 0 4px 12px rgba(0,0,0,0.03)',
                }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #eff6ff, #dbeafe)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px', boxShadow: '0 2px 8px rgba(59,130,246,0.1)' }}>
                        <Zap size={18} color="#3b82f6" />
                    </div>
                    <p style={{ margin: '0 0 4px', fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Endpoints</p>
                    <p style={{ margin: 0, fontSize: '22px', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em', fontFamily: "'Space Grotesk', sans-serif" }}>14</p>
                </div>

                <div className="mcp-card" style={{
                    background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
                    border: '1px solid rgba(241,245,249,0.8)', borderRadius: '20px', padding: '22px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.02), 0 4px 12px rgba(0,0,0,0.03)',
                }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #faf5ff, #f3e8ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px', boxShadow: '0 2px 8px rgba(168,85,247,0.1)' }}>
                        <Shield size={18} color="#a855f7" />
                    </div>
                    <p style={{ margin: '0 0 4px', fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Autenticação</p>
                    <p style={{ margin: 0, fontSize: '18px', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em', fontFamily: "'Space Grotesk', sans-serif" }}>API Key</p>
                </div>

                <div className="mcp-card" style={{
                    background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
                    border: '1px solid rgba(241,245,249,0.8)', borderRadius: '20px', padding: '22px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.02), 0 4px 12px rgba(0,0,0,0.03)',
                }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #ecfdf5, #dcfce7)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px', boxShadow: '0 2px 8px rgba(34,197,94,0.1)' }}>
                        <Database size={18} color="#22c55e" />
                    </div>
                    <p style={{ margin: '0 0 4px', fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Tipo</p>
                    <p style={{ margin: 0, fontSize: '18px', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em', fontFamily: "'Space Grotesk', sans-serif" }}>Read-only</p>
                </div>
            </div>

            {/* API Key */}
            <div className="mcp-card" style={{
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                borderRadius: '20px', padding: '24px', marginBottom: '24px',
                boxShadow: '0 8px 32px rgba(15, 23, 42, 0.3)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                        <p style={{ margin: '0 0 4px', fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>API Key</p>
                        <p style={{ margin: 0, fontSize: '16px', fontWeight: 900, color: '#fff', fontFamily: "'JetBrains Mono', monospace" }}>{apiKey}</p>
                        <p style={{ margin: '6px 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>Envie no header <code style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px' }}>x-api-key</code></p>
                    </div>
                    <button
                        onClick={() => handleCopy(apiKey, setCopiedKey)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            padding: '10px 18px', borderRadius: '12px', border: 'none',
                            background: copiedKey ? 'rgba(34,197,94,0.2)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                            color: copiedKey ? '#22c55e' : '#fff', fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                            boxShadow: copiedKey ? 'none' : '0 4px 12px rgba(99,102,241,0.3)',
                        }}
                    >
                        {copiedKey ? <Check size={14} /> : <Copy size={14} />}
                        {copiedKey ? 'Copiado!' : 'Copiar'}
                    </button>
                </div>
            </div>

            {/* Examples */}
            <div style={{
                background: 'linear-gradient(145deg, #ffffff 0%, #fafbfc 100%)',
                border: '1px solid rgba(241, 245, 249, 0.8)',
                borderRadius: '20px', padding: '24px', marginBottom: '24px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.01), 0 4px 16px rgba(0,0,0,0.03)',
            }}>
                <div style={{ marginBottom: '16px' }}>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.01em' }}>Exemplos de Uso</h3>
                    <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#94a3b8', fontWeight: 500 }}>Copie e cole no terminal</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {examples.map((ex) => (
                        <div key={ex.id} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', minWidth: '120px' }}>{ex.label}</span>
                            <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: '#0f172a', borderRadius: '10px', padding: '10px 14px', gap: '10px' }}>
                                <code style={{ flex: 1, color: '#e2e8f0', fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", overflow: 'auto', whiteSpace: 'nowrap' }}>{ex.cmd}</code>
                                <button
                                    onClick={() => handleCopyExample(ex.cmd, ex.id)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '4px',
                                        padding: '4px 10px', borderRadius: '6px', border: 'none',
                                        background: copiedExample === ex.id ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.1)',
                                        color: copiedExample === ex.id ? '#22c55e' : '#94a3b8',
                                        fontSize: '11px', fontWeight: 600, cursor: 'pointer', flexShrink: 0,
                                    }}
                                >
                                    {copiedExample === ex.id ? <Check size={12} /> : <Copy size={12} />}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Endpoints List */}
            <div style={{
                background: 'linear-gradient(145deg, #ffffff 0%, #fafbfc 100%)',
                border: '1px solid rgba(241, 245, 249, 0.8)',
                borderRadius: '20px', padding: '24px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.01), 0 4px 16px rgba(0,0,0,0.03)',
            }}>
                <div style={{ marginBottom: '20px' }}>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.01em' }}>Endpoints Disponíveis</h3>
                    <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#94a3b8', fontWeight: 500 }}>Todos GET — read-only, autenticados por API Key</p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '8px' }}>
                    {endpoints.map((ep) => {
                        const Icon = ep.icon
                        return (
                            <div key={ep.path} style={{
                                display: 'flex', alignItems: 'center', gap: '12px',
                                padding: '14px', borderRadius: '14px',
                                transition: 'all 0.15s',
                            }}
                                onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            >
                                <div style={{
                                    width: '36px', height: '36px', borderRadius: '10px',
                                    background: `${ep.color}15`, display: 'flex',
                                    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                }}>
                                    <Icon size={16} color={ep.color} />
                                </div>
                                <div style={{ minWidth: 0, flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{
                                            fontSize: '10px', fontWeight: 800, color: '#22c55e',
                                            background: '#f0fdf4', padding: '2px 6px', borderRadius: '4px',
                                            letterSpacing: '0.05em',
                                        }}>GET</span>
                                        <span style={{
                                            fontSize: '12px', fontWeight: 700, color: '#0f172a',
                                            fontFamily: "'JetBrains Mono', monospace",
                                        }}>{ep.path}</span>
                                    </div>
                                    <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#94a3b8', fontWeight: 500 }}>{ep.desc}</p>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
