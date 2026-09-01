'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

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

const COLORS = ['#2C5C86', '#3E7CAD', '#5A97C4', '#7FB0D6', '#A9C9E4', '#1F8F5F']

function FunnelTooltip({ active, payload }: any) {
    if (!active || !payload?.length) return null
    const p = payload[0].payload
    return (
        <div style={{ background: '#14151F', color: '#fff', padding: '8px 12px', borderRadius: '8px', fontSize: '12px' }}>
            <strong>{p.label}</strong><br />{p.value} visitante(s)
        </div>
    )
}

export default function FunnelCharts({ funnel, breakdown, totalPageViews }: { funnel: FunnelStep[]; breakdown: BreakdownRow[]; totalPageViews: number }) {
    const cardStyle: React.CSSProperties = { background: '#FFFFFF', border: '1px solid #E5E7EF', borderRadius: '14px', padding: '22px' }
    const titleStyle: React.CSSProperties = { fontSize: '15px', fontWeight: 700, color: '#14151F', fontFamily: "'Fraunces', serif", marginBottom: '16px' }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={cardStyle}>
                <h3 style={titleStyle}>Funil de conversão do checkout</h3>
                {totalPageViews === 0 ? (
                    <p style={{ fontSize: '13px', color: '#6E7180' }}>Nenhum acesso ao checkout registrado nesse período.</p>
                ) : (
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={funnel} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EF" horizontal={false} />
                            <XAxis type="number" tick={{ fontSize: 11, fill: '#6E7180' }} tickLine={false} axisLine={false} />
                            <YAxis type="category" dataKey="label" width={160} tick={{ fontSize: 12, fill: '#14151F', fontWeight: 600 }} tickLine={false} axisLine={false} />
                            <Tooltip content={<FunnelTooltip />} />
                            <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                                {funnel.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                )}
                <div style={{ display: 'flex', gap: '18px', flexWrap: 'wrap', marginTop: '10px' }}>
                    {funnel.map((s, i) => {
                        const prev = i === 0 ? totalPageViews : funnel[i - 1].value
                        const pct = prev > 0 ? (s.value / prev) * 100 : 0
                        return (
                            <div key={s.label} style={{ fontSize: '12px', color: '#6E7180' }}>
                                <strong style={{ color: '#14151F' }}>{s.label}:</strong> {s.value}
                                {i > 0 && <span> ({pct.toFixed(1)}% da etapa anterior)</span>}
                            </div>
                        )
                    })}
                </div>
            </div>

            <div style={cardStyle}>
                <h3 style={titleStyle}>Origem do tráfego (click id Taboola / UTM)</h3>
                {breakdown.length === 0 ? (
                    <p style={{ fontSize: '13px', color: '#6E7180' }}>Sem dados de tráfego nesse período.</p>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', color: '#6E7180', borderBottom: '1px solid #E5E7EF' }}>
                                    <th style={{ padding: '8px 6px' }}>Origem</th>
                                    <th style={{ padding: '8px 6px' }}>Campanha / Click ID</th>
                                    <th style={{ padding: '8px 6px', textAlign: 'right' }}>Visitas</th>
                                    <th style={{ padding: '8px 6px', textAlign: 'right' }}>Iniciou checkout</th>
                                    <th style={{ padding: '8px 6px', textAlign: 'right' }}>Pedidos</th>
                                    <th style={{ padding: '8px 6px', textAlign: 'right' }}>Pagos</th>
                                    <th style={{ padding: '8px 6px', textAlign: 'right' }}>Receita</th>
                                    <th style={{ padding: '8px 6px', textAlign: 'right' }}>Conversão</th>
                                </tr>
                            </thead>
                            <tbody>
                                {breakdown.map(row => (
                                    <tr key={row.source + row.campaign} style={{ borderBottom: '1px solid #F0F1F5' }}>
                                        <td style={{ padding: '8px 6px', fontWeight: 600, color: '#14151F' }}>{row.source}</td>
                                        <td style={{ padding: '8px 6px', color: '#6E7180', maxWidth: '260px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={row.campaign}>{row.campaign}</td>
                                        <td style={{ padding: '8px 6px', textAlign: 'right' }}>{row.visits}</td>
                                        <td style={{ padding: '8px 6px', textAlign: 'right' }}>{row.checkoutsIniciados}</td>
                                        <td style={{ padding: '8px 6px', textAlign: 'right' }}>{row.pedidos}</td>
                                        <td style={{ padding: '8px 6px', textAlign: 'right' }}>{row.pagos}</td>
                                        <td style={{ padding: '8px 6px', textAlign: 'right' }}>R$ {row.receita.toFixed(2)}</td>
                                        <td style={{ padding: '8px 6px', textAlign: 'right', fontWeight: 700, color: row.conversao > 0 ? '#1F8F5F' : '#6E7180' }}>{row.conversao.toFixed(1)}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}
