'use client'

import { useState } from 'react'
import {
    Bot, Copy, Check, Terminal, Database, Zap, Search,
    BarChart3, ShoppingCart, Package, TrendingUp, Users,
    Mail, DollarSign, GitBranch, Activity
} from 'lucide-react'

const tools = [
    { name: 'get_sales_summary', desc: 'Resumo agregado de vendas (receita, ticket médio, por método)', icon: BarChart3, color: '#6366f1' },
    { name: 'get_orders', desc: 'Lista pedidos com filtros (data, status, produto, email)', icon: ShoppingCart, color: '#3b82f6' },
    { name: 'get_order_detail', desc: 'Detalhes completos de um pedido específico', icon: ShoppingCart, color: '#0ea5e9' },
    { name: 'search_orders', desc: 'Busca por nome, email, CPF, payment ID ou tracking', icon: Search, color: '#8b5cf6' },
    { name: 'get_products', desc: 'Lista produtos com preços, custos e contagem de vendas', icon: Package, color: '#f59e0b' },
    { name: 'get_top_products', desc: 'Ranking dos produtos mais vendidos', icon: TrendingUp, color: '#10b981' },
    { name: 'get_sales_by_period', desc: 'Vendas agrupadas por dia/semana/mês (para gráficos)', icon: Activity, color: '#ec4899' },
    { name: 'get_utm_performance', desc: 'Performance de campanhas UTM', icon: GitBranch, color: '#14b8a6' },
    { name: 'get_financial_records', desc: 'Registros financeiros (receitas e despesas)', icon: DollarSign, color: '#f97316' },
    { name: 'get_dashboard_kpis', desc: 'KPIs do dashboard com comparação de período', icon: BarChart3, color: '#6366f1' },
    { name: 'get_customers', desc: 'Clientes únicos com total de pedidos e gasto', icon: Users, color: '#a855f7' },
    { name: 'get_conversion_funnel', desc: 'Funil de conversão (pendente → pago → enviado)', icon: Zap, color: '#22c55e' },
    { name: 'get_sales_table', desc: 'Dados da tabela sales legada', icon: Database, color: '#64748b' },
    { name: 'get_email_logs', desc: 'Logs de e-mails enviados', icon: Mail, color: '#06b6d4' },
]

const exampleQuestions = [
    'Quantas vendas tivemos hoje?',
    'Qual o ticket médio dos últimos 30 dias?',
    'Quais são os produtos mais vendidos?',
    'Mostre o funil de conversão da semana',
    'Busque pedidos do email joao@email.com',
    'Como estão as campanhas UTM do mês?',
    'Qual o lucro líquido considerando receitas e despesas?',
    'Quais clientes são recorrentes?',
]

export default function McpPage() {
    const [copiedJson, setCopiedJson] = useState(false)
    const [copiedDev, setCopiedDev] = useState(false)
    const [expandedTool, setExpandedTool] = useState<string | null>(null)

    const prodJson = JSON.stringify({
        mcpServers: {
            'hermes-pagflow': {
                command: 'node',
                args: ['C:/Users/Administrator/Documents/apps novos - antigravity/pagflow/hermes-agent-mcp/dist/index.js'],
                env: {
                    DATABASE_URL: 'postgresql://user:password@localhost:5432/pagflow'
                }
            }
        }
    }, null, 2)

    const devJson = JSON.stringify({
        mcpServers: {
            'hermes-pagflow': {
                command: 'npx',
                args: ['tsx', 'C:/Users/Administrator/Documents/apps novos - antigravity/pagflow/hermes-agent-mcp/src/index.ts'],
                env: {
                    DATABASE_URL: 'postgresql://user:password@localhost:5432/pagflow'
                }
            }
        }
    }, null, 2)

    const handleCopy = (text: string, setter: (v: boolean) => void) => {
        navigator.clipboard.writeText(text)
        setter(true)
        setTimeout(() => setter(false), 2000)
    }

    return (
        <div style={{ paddingBottom: '40px' }}>
            <style jsx global>{`
                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(16px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes mcpPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
                .mcp-card { animation: fadeUp 0.4s ease-out both; }
                .mcp-card:nth-child(1) { animation-delay: 0s; }
                .mcp-card:nth-child(2) { animation-delay: 0.05s; }
                .mcp-card:nth-child(3) { animation-delay: 0.1s; }
                .mcp-card:nth-child(4) { animation-delay: 0.15s; }
            `}</style>

            {/* Header */}
            <header style={{
                marginBottom: '28px', display: 'flex', alignItems: 'flex-start',
                justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px',
            }}>
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
                            Hermes Agent MCP
                        </h1>
                        <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0, fontWeight: 500 }}>
                            Servidor MCP para consultas de dados via IA — 14 tools disponíveis
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
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#059669' }}>Ativo e funcionando</span>
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
                        <Terminal size={18} color="#a78bfa" />
                    </div>
                    <p style={{ margin: '0 0 4px', fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Nome do Servidor</p>
                    <p style={{ margin: 0, fontSize: '18px', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', fontFamily: "'Space Grotesk', sans-serif" }}>
                        hermes-pagflow
                    </p>
                </div>

                <div className="mcp-card" style={{
                    background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
                    border: '1px solid rgba(241,245,249,0.8)', borderRadius: '20px', padding: '22px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.02), 0 4px 12px rgba(0,0,0,0.03)',
                }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #eff6ff, #dbeafe)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px', boxShadow: '0 2px 8px rgba(59,130,246,0.1)' }}>
                        <Zap size={18} color="#3b82f6" />
                    </div>
                    <p style={{ margin: '0 0 4px', fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Tools Disponíveis</p>
                    <p style={{ margin: 0, fontSize: '22px', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em', fontFamily: "'Space Grotesk', sans-serif" }}>14</p>
                </div>

                <div className="mcp-card" style={{
                    background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
                    border: '1px solid rgba(241,245,249,0.8)', borderRadius: '20px', padding: '22px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.02), 0 4px 12px rgba(0,0,0,0.03)',
                }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px', boxShadow: '0 2px 8px rgba(34,197,94,0.1)' }}>
                        <Database size={18} color="#22c55e" />
                    </div>
                    <p style={{ margin: '0 0 4px', fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Transporte</p>
                    <p style={{ margin: 0, fontSize: '18px', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em', fontFamily: "'Space Grotesk', sans-serif" }}>stdio</p>
                </div>

                <div className="mcp-card" style={{
                    background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
                    border: '1px solid rgba(241,245,249,0.8)', borderRadius: '20px', padding: '22px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.02), 0 4px 12px rgba(0,0,0,0.03)',
                }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #faf5ff, #f3e8ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px', boxShadow: '0 2px 8px rgba(168,85,247,0.1)' }}>
                        <Activity size={18} color="#a855f7" />
                    </div>
                    <p style={{ margin: '0 0 4px', fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Tipo</p>
                    <p style={{ margin: 0, fontSize: '18px', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em', fontFamily: "'Space Grotesk', sans-serif" }}>Read-only</p>
                </div>
            </div>

            {/* Connection Config */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '24px' }}>
                {/* Production */}
                <div className="mcp-card" style={{
                    background: 'linear-gradient(145deg, #ffffff 0%, #fafbfc 100%)',
                    border: '1px solid rgba(241, 245, 249, 0.8)',
                    borderRadius: '20px', padding: '24px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.01), 0 4px 16px rgba(0,0,0,0.03)',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.01em' }}>Produção (build)</h3>
                            <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#94a3b8', fontWeight: 500 }}>Claude Code / Cursor / Windsurf</p>
                        </div>
                        <button
                            onClick={() => handleCopy(prodJson, setCopiedJson)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                padding: '8px 14px', borderRadius: '10px', border: 'none',
                                background: copiedJson ? '#ecfdf5' : '#f1f5f9',
                                color: copiedJson ? '#059669' : '#64748b',
                                fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                                transition: 'all 0.2s',
                            }}
                        >
                            {copiedJson ? <Check size={14} /> : <Copy size={14} />}
                            {copiedJson ? 'Copiado!' : 'Copiar'}
                        </button>
                    </div>
                    <pre style={{
                        background: '#0f172a', color: '#e2e8f0',
                        padding: '16px', borderRadius: '14px',
                        fontSize: '11px', lineHeight: '1.6',
                        overflow: 'auto', margin: 0,
                        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                    }}>
                        <code>{prodJson}</code>
                    </pre>
                </div>

                {/* Development */}
                <div className="mcp-card" style={{
                    background: 'linear-gradient(145deg, #ffffff 0%, #fafbfc 100%)',
                    border: '1px solid rgba(241, 245, 249, 0.8)',
                    borderRadius: '20px', padding: '24px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.01), 0 4px 16px rgba(0,0,0,0.03)',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.01em' }}>Desenvolvimento (tsx)</h3>
                            <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#94a3b8', fontWeight: 500 }}>Sem necessidade de build</p>
                        </div>
                        <button
                            onClick={() => handleCopy(devJson, setCopiedDev)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                padding: '8px 14px', borderRadius: '10px', border: 'none',
                                background: copiedDev ? '#ecfdf5' : '#f1f5f9',
                                color: copiedDev ? '#059669' : '#64748b',
                                fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                                transition: 'all 0.2s',
                            }}
                        >
                            {copiedDev ? <Check size={14} /> : <Copy size={14} />}
                            {copiedDev ? 'Copiado!' : 'Copiar'}
                        </button>
                    </div>
                    <pre style={{
                        background: '#0f172a', color: '#e2e8f0',
                        padding: '16px', borderRadius: '14px',
                        fontSize: '11px', lineHeight: '1.6',
                        overflow: 'auto', margin: 0,
                        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                    }}>
                        <code>{devJson}</code>
                    </pre>
                </div>
            </div>

            {/* Tools List */}
            <div style={{
                background: 'linear-gradient(145deg, #ffffff 0%, #fafbfc 100%)',
                border: '1px solid rgba(241, 245, 249, 0.8)',
                borderRadius: '20px', padding: '24px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.01), 0 4px 16px rgba(0,0,0,0.03)',
                marginBottom: '24px',
            }}>
                <div style={{ marginBottom: '20px' }}>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.01em' }}>Tools Disponíveis</h3>
                    <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#94a3b8', fontWeight: 500 }}>14 endpoints de consulta read-only</p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '8px' }}>
                    {tools.map((tool) => {
                        const isExpanded = expandedTool === tool.name
                        const Icon = tool.icon
                        return (
                            <div
                                key={tool.name}
                                onClick={() => setExpandedTool(isExpanded ? null : tool.name)}
                                style={{
                                    display: 'flex', alignItems: 'flex-start', gap: '12px',
                                    padding: '14px', borderRadius: '14px',
                                    background: isExpanded ? '#f8fafc' : 'transparent',
                                    border: `1px solid ${isExpanded ? '#e2e8f0' : 'transparent'}`,
                                    cursor: 'pointer', transition: 'all 0.15s',
                                }}
                                onMouseEnter={(e) => {
                                    if (!isExpanded) e.currentTarget.style.background = '#f8fafc'
                                }}
                                onMouseLeave={(e) => {
                                    if (!isExpanded) e.currentTarget.style.background = 'transparent'
                                }}
                            >
                                <div style={{
                                    width: '36px', height: '36px', borderRadius: '10px',
                                    background: `${tool.color}15`, display: 'flex',
                                    alignItems: 'center', justifyContent: 'center',
                                    flexShrink: 0,
                                }}>
                                    <Icon size={16} color={tool.color} />
                                </div>
                                <div style={{ minWidth: 0 }}>
                                    <p style={{
                                        margin: 0, fontSize: '13px', fontWeight: 700,
                                        color: '#0f172a', fontFamily: "'JetBrains Mono', monospace",
                                        fontSize: '12px',
                                    }}>
                                        {tool.name}
                                    </p>
                                    <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#94a3b8', fontWeight: 500, lineHeight: '1.4' }}>
                                        {tool.desc}
                                    </p>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Example Questions */}
            <div style={{
                background: 'linear-gradient(145deg, #ffffff 0%, #fafbfc 100%)',
                border: '1px solid rgba(241, 245, 249, 0.8)',
                borderRadius: '20px', padding: '24px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.01), 0 4px 16px rgba(0,0,0,0.03)',
            }}>
                <div style={{ marginBottom: '16px' }}>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.01em' }}>Exemplos de Uso</h3>
                    <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#94a3b8', fontWeight: 500 }}>Perguntas que você pode fazer ao agente</p>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {exampleQuestions.map((q, i) => (
                        <div key={i} style={{
                            padding: '10px 16px', borderRadius: '12px',
                            background: '#f8fafc', border: '1px solid #f1f5f9',
                            fontSize: '13px', color: '#475569', fontWeight: 500,
                            transition: 'all 0.15s',
                        }}>
                            "{q}"
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
