'use client';

import {
    AreaChart, Area, BarChart, Bar,
    PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { DollarSign, TrendingUp, Users, BarChart3, CheckCircle, XCircle, Clock } from 'lucide-react';

const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtK = (v: number) => v >= 1000 ? `R$ ${(v / 1000).toFixed(1)}k` : `R$ ${fmt(v)}`;

const ChartTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{ background: 'linear-gradient(135deg,#0f172a 0%,#1e293b 100%)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '12px 16px', boxShadow: '0 20px 50px rgba(0,0,0,0.4)' }}>
            <p style={{ margin: '0 0 8px', fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</p>
            {payload.map((entry: any) => (
                <div key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '4px 0' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: entry.color }} />
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>{entry.name}</span>
                    <span style={{ fontSize: 12, color: '#fff', fontWeight: 800, marginLeft: 'auto' }}>R$ {fmt(entry.value)}</span>
                </div>
            ))}
        </div>
    );
};

const PieTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0];
    return (
        <div style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '10px 14px' }}>
            <p style={{ margin: 0, color: '#fff', fontWeight: 700, fontSize: 13 }}>{d.name}: {d.value}</p>
        </div>
    );
};

type KPIs = {
    total: number; ativas: number; concluidas: number; canceladas: number;
    totalRecebido: number; totalProjetado: number; activeMRR: number;
    conversionRate: number; avgParcelas: number;
};

interface Props {
    kpis: KPIs;
    weeklyRevenue: { week: string; valor: number }[];
    projection: { week: string; valor: number }[];
    installmentDist: { name: string; value: number }[];
    byProduct: { name: string; total: number; ativas: number; receita: number }[];
    statusOverTime: { week: string; pago: number; aguardando: number; cancelado: number }[];
}

const DONUT_COLORS = ['#6366f1', '#16a34a', '#d97706'];
const CARD_STYLE: React.CSSProperties = { background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: '20px 22px' };
const SECTION_TITLE: React.CSSProperties = { margin: '0 0 16px', fontSize: 13, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' };

export default function AnalyticsCharts({ kpis, weeklyRevenue, projection, installmentDist, byProduct, statusOverTime }: Props) {
    const kpiCards = [
        { label: 'Total recebido', value: `R$ ${fmt(kpis.totalRecebido)}`, sub: `${kpis.total} assinaturas`, icon: <DollarSign size={18} color="#16a34a" />, iconBg: '#dcfce7' },
        { label: 'Projeção restante', value: `R$ ${fmt(kpis.totalProjetado)}`, sub: `${kpis.ativas} ativas`, icon: <TrendingUp size={18} color="#6366f1" />, iconBg: '#ede9fe' },
        { label: 'MRR semanal', value: `R$ ${fmt(kpis.activeMRR)}`, sub: 'receita semanal ativa', icon: <BarChart3 size={18} color="#0369a1" />, iconBg: '#e0f2fe' },
        { label: 'Taxa de conversão', value: `${kpis.conversionRate.toFixed(1)}%`, sub: `média ${kpis.avgParcelas.toFixed(1)}x parcelas`, icon: <Users size={18} color="#d97706" />, iconBg: '#fef3c7' },
    ];

    const totalDist = installmentDist.reduce((s, d) => s + d.value, 0);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Status pills */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {[
                    { label: 'Ativas', value: kpis.ativas, icon: <CheckCircle size={13} color="#15803d" />, bg: '#dcfce7', color: '#15803d' },
                    { label: 'Concluídas', value: kpis.concluidas, icon: <CheckCircle size={13} color="#6366f1" />, bg: '#ede9fe', color: '#6366f1' },
                    { label: 'Canceladas', value: kpis.canceladas, icon: <XCircle size={13} color="#b91c1c" />, bg: '#fee2e2', color: '#b91c1c' },
                    { label: 'Aguardando', value: kpis.total - kpis.ativas - kpis.concluidas - kpis.canceladas, icon: <Clock size={13} color="#92400e" />, bg: '#fef3c7', color: '#92400e' },
                ].map(p => (
                    <div key={p.label} style={{ display: 'flex', alignItems: 'center', gap: 7, background: p.bg, color: p.color, borderRadius: 10, padding: '7px 14px', fontSize: 13, fontWeight: 700 }}>
                        {p.icon} {p.label}: {p.value}
                    </div>
                ))}
            </div>

            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
                {kpiCards.map(c => (
                    <div key={c.label} style={CARD_STYLE}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                            <div style={{ width: 36, height: 36, borderRadius: 10, background: c.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{c.icon}</div>
                            <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>{c.label}</span>
                        </div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>{c.value}</div>
                        <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{c.sub}</div>
                    </div>
                ))}
            </div>

            {/* Receita histórica + Projeção */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div style={CARD_STYLE}>
                    <p style={SECTION_TITLE}>Receita recebida (últimas 10 semanas)</p>
                    {weeklyRevenue.every(w => w.valor === 0) ? (
                        <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 13 }}>Sem dados ainda</div>
                    ) : (
                        <ResponsiveContainer width="100%" height={200}>
                            <AreaChart data={weeklyRevenue} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="gradGreen" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                                <YAxis tickFormatter={fmtK} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                                <Tooltip content={<ChartTooltip />} />
                                <Area type="monotone" dataKey="valor" name="Recebido" stroke="#16a34a" fill="url(#gradGreen)" strokeWidth={2} dot={false} />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </div>

                <div style={{ ...CARD_STYLE, border: '1px dashed #c7d2fe' }}>
                    <p style={{ ...SECTION_TITLE, color: '#6366f1' }}>Projeção futura (próximas 8 semanas)</p>
                    {projection.every(w => w.valor === 0) ? (
                        <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 13 }}>Nenhuma assinatura ativa</div>
                    ) : (
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={projection} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                                <YAxis tickFormatter={fmtK} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                                <Tooltip content={<ChartTooltip />} />
                                <Bar dataKey="valor" name="Previsto" fill="#6366f1" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            {/* Distribuição de parcelas + Por produto */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 14 }}>

                {/* Donut */}
                <div style={CARD_STYLE}>
                    <p style={SECTION_TITLE}>Distribuição por parcelas</p>
                    {installmentDist.length === 0 ? (
                        <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 13 }}>Sem dados</div>
                    ) : (
                        <>
                            <ResponsiveContainer width="100%" height={180}>
                                <PieChart>
                                    <Pie data={installmentDist} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" nameKey="name">
                                        {installmentDist.map((_, i) => (
                                            <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<PieTooltip />} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
                                {installmentDist.map((d, i) => (
                                    <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700 }}>
                                        <span style={{ width: 10, height: 10, borderRadius: 3, background: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                                        <span style={{ color: '#0f172a' }}>{d.name}</span>
                                        <span style={{ color: '#94a3b8' }}>{totalDist > 0 ? Math.round((d.value / totalDist) * 100) : 0}%</span>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* Por produto */}
                <div style={CARD_STYLE}>
                    <p style={SECTION_TITLE}>Receita por produto</p>
                    {byProduct.length === 0 ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 13, minHeight: 200 }}>Sem dados</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {byProduct.slice(0, 6).map((p, i) => {
                                const maxReceita = byProduct[0]?.receita || 1;
                                const pct = Math.round((p.receita / maxReceita) * 100);
                                return (
                                    <div key={p.name}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                                            <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '55%' }}>{p.name}</span>
                                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                                <span style={{ fontSize: 11, color: '#94a3b8' }}>{p.ativas} ativas</span>
                                                <span style={{ fontSize: 13, fontWeight: 800, color: '#16a34a' }}>R$ {fmt(p.receita)}</span>
                                            </div>
                                        </div>
                                        <div style={{ height: 6, borderRadius: 4, background: '#f1f5f9', overflow: 'hidden' }}>
                                            <div style={{ height: '100%', width: `${pct}%`, borderRadius: 4, background: `hsl(${220 + i * 30}, 80%, 55%)`, transition: 'width .4s' }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Status ao longo do tempo */}
            <div style={CARD_STYLE}>
                <p style={SECTION_TITLE}>Novas assinaturas por semana (últimas 10 semanas)</p>
                {statusOverTime.every(w => w.pago === 0 && w.aguardando === 0 && w.cancelado === 0) ? (
                    <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 13 }}>Sem dados ainda</div>
                ) : (
                    <ResponsiveContainer width="100%" height={160}>
                        <BarChart data={statusOverTime} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                            <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} allowDecimals={false} />
                            <Tooltip content={({ active, payload, label }: any) => {
                                if (!active || !payload?.length) return null;
                                return (
                                    <div style={{ background: '#0f172a', borderRadius: 10, padding: '10px 14px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                        <p style={{ margin: '0 0 6px', color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>{label}</p>
                                        {payload.map((e: any) => (
                                            <div key={e.name} style={{ display: 'flex', gap: 8, alignItems: 'center', margin: '3px 0' }}>
                                                <span style={{ width: 8, height: 8, borderRadius: '50%', background: e.fill }} />
                                                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>{e.name}</span>
                                                <span style={{ fontSize: 12, color: '#fff', fontWeight: 700 }}>{e.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                );
                            }} />
                            <Bar dataKey="pago" name="Pagas" fill="#16a34a" radius={[4, 4, 0, 0]} stackId="a" />
                            <Bar dataKey="aguardando" name="Aguardando" fill="#f59e0b" radius={[0, 0, 0, 0]} stackId="a" />
                            <Bar dataKey="cancelado" name="Canceladas" fill="#ef4444" radius={[0, 0, 4, 4]} stackId="a" />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
}
