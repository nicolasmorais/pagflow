'use client'

import { useState } from 'react'
import { Bot, Copy, Check, Globe, Zap, Shield, Database } from 'lucide-react'

const restEndpoints = [
    { path: '/health', desc: 'Health check do servidor', auth: false },
    { path: '/api/sales-summary', desc: 'Resumo agregado de vendas' },
    { path: '/api/orders', desc: 'Lista pedidos com filtros' },
    { path: '/api/orders/:id', desc: 'Detalhes de um pedido' },
    { path: '/api/orders/search', desc: 'Busca por nome, email, CPF' },
    { path: '/api/products', desc: 'Lista produtos com vendas' },
    { path: '/api/top-products', desc: 'Ranking de produtos' },
    { path: '/api/sales-by-period', desc: 'Vendas por dia/semana/mês' },
    { path: '/api/utm-performance', desc: 'Performance de campanhas UTM' },
    { path: '/api/financial', desc: 'Receitas e despesas' },
    { path: '/api/dashboard-kpis', desc: 'KPIs com comparação de período' },
    { path: '/api/customers', desc: 'Clientes únicos com histórico' },
    { path: '/api/conversion-funnel', desc: 'Funil de conversão' },
    { path: '/api/email-logs', desc: 'Logs de e-mails enviados' },
]

const mcpTools = [
    { name: 'get_sales_summary', desc: 'Resumo agregado de vendas (receita, ticket médio, por método)' },
    { name: 'get_orders', desc: 'Lista pedidos com filtros (data, status, produto, email)' },
    { name: 'get_order_detail', desc: 'Detalhes completos de um pedido específico' },
    { name: 'search_orders', desc: 'Busca por nome, email, CPF, payment ID ou tracking code' },
    { name: 'get_products', desc: 'Lista produtos com preços, custos e contagem de vendas' },
    { name: 'get_top_products', desc: 'Ranking dos produtos mais vendidos' },
    { name: 'get_sales_by_period', desc: 'Vendas agrupadas por dia/semana/mês (gráficos)' },
    { name: 'get_utm_performance', desc: 'Performance de campanhas UTM' },
    { name: 'get_financial_records', desc: 'Registros financeiros (receitas e despesas)' },
    { name: 'get_dashboard_kpis', desc: 'KPIs do dashboard com comparação de período' },
    { name: 'get_customers', desc: 'Clientes únicos com total de pedidos e gasto' },
    { name: 'get_conversion_funnel', desc: 'Funil de conversão (pendente → pago → enviado)' },
    { name: 'get_sales_table', desc: 'Dados da tabela sales legada' },
    { name: 'get_email_logs', desc: 'Logs de e-mails enviados' },
    { name: 'update_product_cost', desc: 'Atualiza custo de produto com backfill nos pedidos' },
    { name: 'backfill_all_product_costs', desc: 'Backfill do productCost em todos os pedidos' },
]

const examples = [
    { label: 'Resumo de vendas', cmd: `curl -H "x-api-key: hermes-pagflow-key" https://mcp.elabela.store/api/sales-summary?from=2026-01-01` },
    { label: 'Listar pedidos', cmd: `curl -H "x-api-key: hermes-pagflow-key" https://mcp.elabela.store/api/orders?limit=10` },
    { label: 'Buscar pedido', cmd: `curl -H "x-api-key: hermes-pagflow-key" "https://mcp.elabela.store/api/orders/search?q=joao@email.com"` },
    { label: 'Dashboard KPIs', cmd: `curl -H "x-api-key: hermes-pagflow-key" "https://mcp.elabela.store/api/dashboard-kpis?from=2026-07-01&to=2026-07-31"` },
]

const mcpConfig = `{
  "mcpServers": {
    "hermes-pagflow": {
      "command": "node",
      "args": ["hermes-agent-mcp/dist/index.js"],
      "cwd": "C:/Users/Administrator/Documents/apps novos - antigravity/pagflow"
    }
  }
}`

export default function McpPage() {
    const [copiedKey, setCopiedKey] = useState(false)
    const [copiedConfig, setCopiedConfig] = useState(false)
    const [copiedExample, setCopiedExample] = useState<string | null>(null)
    const [tab, setTab] = useState<'rest' | 'mcp'>('rest')

    const apiKey = 'hermes-pagflow-key'

    function copy(text: string, setter: (v: boolean) => void) {
        navigator.clipboard.writeText(text)
        setter(true)
        setTimeout(() => setter(false), 2000)
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '40px' }}>

            {/* Header */}
            <div className="orders-head" style={{ marginBottom: 0 }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                        <div style={{
                            width: '36px', height: '36px', borderRadius: '10px',
                            background: 'var(--surface-sunken)', border: '1px solid var(--line)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}>
                            <Bot size={18} color="var(--ink)" strokeWidth={1.8} />
                        </div>
                        <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.025em' }}>
                            Hermes API
                        </h1>
                    </div>
                    <p style={{ margin: 0, fontSize: '14px', color: 'var(--ink-muted)' }}>
                        Interface de dados do PagFlow — MCP tools e REST endpoints
                    </p>
                </div>
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '7px 14px', borderRadius: '8px',
                    background: 'var(--surface)', border: '1px solid var(--line)',
                    fontSize: '12px', fontWeight: 700, color: 'var(--positive)',
                    flexShrink: 0,
                }}>
                    <span style={{
                        width: '6px', height: '6px', borderRadius: '50%',
                        background: 'var(--positive)', flexShrink: 0,
                    }} />
                    Ativo
                </div>
            </div>

            {/* KPI strip */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '10px' }}>
                {[
                    { icon: Globe, label: 'Base URL', value: 'mcp.elabela.store', mono: true },
                    { icon: Database, label: 'MCP Tools', value: String(mcpTools.length) },
                    { icon: Zap, label: 'Endpoints REST', value: String(restEndpoints.length) },
                    { icon: Shield, label: 'Autenticação', value: 'API Key' },
                ].map(({ icon: Icon, label, value, mono }) => (
                    <div key={label} className="dash-card" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 18px' }}>
                        <div style={{
                            width: '34px', height: '34px', borderRadius: '9px',
                            background: 'var(--surface-sunken)', border: '1px solid var(--line)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}>
                            <Icon size={15} color="var(--ink-muted)" />
                        </div>
                        <div style={{ minWidth: 0 }}>
                            <p style={{ margin: 0, fontSize: '10px', fontWeight: 700, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</p>
                            <p style={{
                                margin: '3px 0 0', fontSize: '13px', fontWeight: 700, color: 'var(--ink)',
                                fontFamily: mono ? 'monospace' : 'inherit',
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            }}>{value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* API Key */}
            <div style={{
                background: 'var(--ink)', borderRadius: '14px', padding: '18px 22px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                gap: '16px', flexWrap: 'wrap',
            }}>
                <div>
                    <p style={{ margin: '0 0 6px', fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        API Key
                    </p>
                    <code style={{ fontSize: '15px', fontWeight: 700, color: '#fff', fontFamily: 'monospace', letterSpacing: '0.01em' }}>
                        {apiKey}
                    </code>
                    <p style={{ margin: '6px 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>
                        Envie no header{' '}
                        <code style={{ background: 'rgba(255,255,255,0.09)', padding: '1px 5px', borderRadius: '4px', fontSize: '11px' }}>
                            x-api-key
                        </code>
                    </p>
                </div>
                <button
                    onClick={() => copy(apiKey, setCopiedKey)}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        padding: '9px 16px', borderRadius: '9px', border: '1px solid rgba(255,255,255,0.12)',
                        background: copiedKey ? 'rgba(30,122,82,0.25)' : 'rgba(255,255,255,0.07)',
                        color: copiedKey ? '#34d399' : 'rgba(255,255,255,0.6)',
                        fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                        transition: 'all 0.15s', flexShrink: 0,
                    }}
                >
                    {copiedKey ? <Check size={13} /> : <Copy size={13} />}
                    {copiedKey ? 'Copiado' : 'Copiar'}
                </button>
            </div>

            {/* Tabs */}
            <div>
                <div style={{
                    display: 'flex', gap: '2px',
                    background: 'var(--surface-sunken)', border: '1px solid var(--line)',
                    borderRadius: '10px', padding: '3px', width: 'fit-content', marginBottom: '12px',
                }}>
                    {(['rest', 'mcp'] as const).map((t) => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            style={{
                                padding: '6px 18px', borderRadius: '8px', border: 'none',
                                background: tab === t ? 'var(--surface)' : 'transparent',
                                color: tab === t ? 'var(--ink)' : 'var(--ink-muted)',
                                fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                                boxShadow: tab === t ? '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)' : 'none',
                                transition: 'all 0.12s',
                            }}
                        >
                            {t === 'rest' ? 'REST API' : 'MCP Tools'}
                        </button>
                    ))}
                </div>

                <div className="dash-card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{
                        padding: '14px 20px', borderBottom: '1px solid var(--line)',
                        background: 'var(--surface-sunken)',
                    }}>
                        {tab === 'rest' ? (
                            <>
                                <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: 'var(--ink)' }}>Endpoints REST</p>
                                <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--ink-muted)' }}>
                                    Todos GET · autenticados por <code style={{ fontSize: '11px' }}>x-api-key</code>
                                </p>
                            </>
                        ) : (
                            <>
                                <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: 'var(--ink)' }}>MCP Tools</p>
                                <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--ink-muted)' }}>
                                    Disponíveis via Claude Code · servidor <code style={{ fontSize: '11px' }}>hermes-pagflow</code>
                                </p>
                            </>
                        )}
                    </div>
                    <div className="dash-table-wrap" style={{ margin: 0, padding: 0 }}>
                        {tab === 'rest' ? (
                            <table className="dash-table" style={{ margin: 0 }}>
                                <thead>
                                    <tr>
                                        <th style={{ paddingLeft: '20px', width: '56px' }}>Método</th>
                                        <th style={{ width: '220px' }}>Path</th>
                                        <th style={{ paddingRight: '20px' }}>Descrição</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {restEndpoints.map((ep) => (
                                        <tr key={ep.path} className="orders-row">
                                            <td style={{ paddingLeft: '20px' }}>
                                                <span style={{
                                                    fontSize: '10px', fontWeight: 800, letterSpacing: '0.05em',
                                                    color: 'var(--positive)', background: 'var(--positive-soft)',
                                                    padding: '2px 7px', borderRadius: '5px',
                                                }}>GET</span>
                                            </td>
                                            <td>
                                                <code style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink)', fontFamily: 'monospace' }}>
                                                    {ep.path}
                                                </code>
                                                {ep.auth === false && (
                                                    <span style={{
                                                        marginLeft: '8px', fontSize: '10px', fontWeight: 700,
                                                        color: 'var(--ink-muted)', background: 'var(--surface-sunken)',
                                                        border: '1px solid var(--line)', padding: '1px 6px', borderRadius: '4px',
                                                    }}>público</span>
                                                )}
                                            </td>
                                            <td style={{ color: 'var(--ink-muted)', fontSize: '13px', paddingRight: '20px' }}>
                                                {ep.desc}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <table className="dash-table" style={{ margin: 0 }}>
                                <thead>
                                    <tr>
                                        <th style={{ paddingLeft: '20px', width: '260px' }}>Tool</th>
                                        <th style={{ paddingRight: '20px' }}>Descrição</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {mcpTools.map((t) => (
                                        <tr key={t.name} className="orders-row">
                                            <td style={{ paddingLeft: '20px', whiteSpace: 'nowrap' }}>
                                                <code style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink)', fontFamily: 'monospace' }}>
                                                    {t.name}
                                                </code>
                                            </td>
                                            <td style={{ color: 'var(--ink-muted)', fontSize: '13px', paddingRight: '20px' }}>
                                                {t.desc}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>

            {/* Examples */}
            <div className="dash-card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--line)', background: 'var(--surface-sunken)' }}>
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: 'var(--ink)' }}>Exemplos de Uso</p>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--ink-muted)' }}>Copie e cole no terminal</p>
                </div>
                {examples.map((ex, i) => (
                    <div key={ex.label} style={{
                        display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 20px',
                        borderBottom: i < examples.length - 1 ? '1px solid var(--line)' : 'none',
                    }}>
                        <span style={{
                            fontSize: '12px', fontWeight: 600, color: 'var(--ink-muted)',
                            minWidth: '110px', flexShrink: 0,
                        }}>{ex.label}</span>
                        <div style={{
                            flex: 1, display: 'flex', alignItems: 'center', gap: '8px',
                            background: 'var(--ink)', borderRadius: '9px', padding: '9px 12px',
                            overflow: 'hidden',
                        }}>
                            <code style={{
                                flex: 1, color: 'rgba(255,255,255,0.75)', fontSize: '11px',
                                fontFamily: 'monospace', whiteSpace: 'nowrap', overflow: 'auto',
                                scrollbarWidth: 'none',
                            }}>{ex.cmd}</code>
                            <button
                                onClick={() => copy(ex.cmd, (v) => setCopiedExample(v ? ex.label : null))}
                                style={{
                                    display: 'flex', alignItems: 'center', padding: '4px 8px',
                                    borderRadius: '6px', border: 'none', cursor: 'pointer', flexShrink: 0,
                                    background: copiedExample === ex.label ? 'rgba(30,122,82,0.25)' : 'rgba(255,255,255,0.07)',
                                    color: copiedExample === ex.label ? '#34d399' : 'rgba(255,255,255,0.45)',
                                    transition: 'all 0.15s',
                                }}
                            >
                                {copiedExample === ex.label ? <Check size={12} /> : <Copy size={12} />}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Config */}
            <div className="dash-card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{
                    padding: '14px 20px', borderBottom: '1px solid var(--line)',
                    background: 'var(--surface-sunken)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                    <div>
                        <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: 'var(--ink)' }}>Configuração Claude Code</p>
                        <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--ink-muted)' }}>
                            .claude/settings.json · projeto pagflow
                        </p>
                    </div>
                    <button
                        onClick={() => copy(mcpConfig, setCopiedConfig)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '5px',
                            padding: '7px 13px', borderRadius: '8px',
                            border: '1px solid var(--line)', background: 'var(--surface)',
                            color: copiedConfig ? 'var(--positive)' : 'var(--ink-muted)',
                            fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                            transition: 'all 0.15s',
                        }}
                    >
                        {copiedConfig ? <Check size={12} /> : <Copy size={12} />}
                        {copiedConfig ? 'Copiado' : 'Copiar'}
                    </button>
                </div>
                <div style={{ padding: '16px 20px' }}>
                    <pre style={{
                        margin: 0, padding: '14px 16px',
                        background: 'var(--ink)', borderRadius: '10px',
                        fontSize: '12px', color: 'rgba(255,255,255,0.75)',
                        fontFamily: 'monospace', lineHeight: 1.7, overflow: 'auto',
                    }}>{mcpConfig}</pre>
                </div>
            </div>

        </div>
    )
}
