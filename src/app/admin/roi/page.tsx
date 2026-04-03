'use client'

import React from 'react'
import { TrendingUp, DollarSign, MousePointer2, Target, ArrowUpRight, BarChart3, PieChart, Calendar } from 'lucide-react'

const StatCard = ({ icon: Icon, label, value, trend, color }: any) => (
    <div style={{ background: 'white', padding: '24px', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div style={{ background: `${color}10`, padding: '12px', borderRadius: '12px' }}>
                <Icon size={24} color={color} />
            </div>
            {trend && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: trend > 0 ? '#10b981' : '#ef4444', background: trend > 0 ? '#ecfdf5' : '#fef2f2', padding: '4px 8px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700 }}>
                    <ArrowUpRight size={14} /> {trend}%
                </div>
            )}
        </div>
        <div>
            <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</p>
            <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>{value}</h3>
        </div>
    </div>
)

export default function ROIPage() {
    return (
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#1e293b', margin: '0 0 8px 0' }}>ROI de Anúncios</h1>
                    <p style={{ color: '#64748b', margin: 0, fontSize: '0.95rem' }}>Acompanhe o retorno sobre o investimento de suas campanhas.</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button style={{ padding: '12px 20px', borderRadius: '12px', background: 'white', border: '1px solid #e2e8f0', color: '#1e293b', fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <Calendar size={18} /> Últimos 30 dias
                    </button>
                    <button style={{ padding: '12px 24px', borderRadius: '12px', background: '#000', color: 'white', border: 'none', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' }}>
                        Importar Dados
                    </button>
                </div>
            </header>

            <div className="stats-grid">
                <StatCard icon={Target} label="Investimento" value="R$ 12.450,00" trend={12} color="#4f46e5" />
                <StatCard icon={DollarSign} label="Faturamento" value="R$ 48.920,00" trend={18} color="#10b981" />
                <StatCard icon={TrendingUp} label="ROI Atual" value="3.92x" trend={5} color="#f59e0b" />
                <StatCard icon={MousePointer2} label="Custo por Clique" value="R$ 0,42" trend={-2} color="#ef4444" />
            </div>

            <div className="dashboard-layout">
                <div style={{ background: 'white', padding: '32px', borderRadius: '24px', border: '1px solid #e2e8f0', minHeight: '400px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>Desempenho por Campanha</h3>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#64748b' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4f46e5' }}></div> Investimento
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#64748b' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></div> Conversão
                            </div>
                        </div>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', minWidth: '600px' }}>
                            {[
                                { name: 'Facebook Ads - Conversão VIP', spend: 4500, rev: 18400, roi: 4.08 },
                                { name: 'Google Search - Kit 3 Potes', spend: 3200, rev: 12100, roi: 3.78 },
                                { name: 'TikTok Ads - Viral Video', spend: 2800, rev: 10500, roi: 3.75 },
                                { name: 'Instagram Stories - Promo Outono', spend: 1950, rev: 7920, roi: 4.06 },
                            ].map(item => (
                                <div key={item.name} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', alignItems: 'center', padding: '16px', borderRadius: '12px', background: '#f8fafc' }}>
                                    <span style={{ fontWeight: 700, color: '#1e293b' }}>{item.name}</span>
                                    <span style={{ color: '#64748b', fontSize: '0.9rem' }}>R$ {item.spend.toLocaleString()}</span>
                                    <span style={{ color: '#10b981', fontWeight: 600 }}>R$ {item.rev.toLocaleString()}</span>
                                    <span style={{ textAlign: 'right', fontWeight: 800, color: '#4f46e5' }}>{item.roi}x</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div style={{ background: 'white', padding: '32px', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e293b', marginBottom: '24px' }}>Canais de Origem</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        {[
                            { label: 'Facebook/Instagram', value: 58, color: '#4f46e5' },
                            { label: 'Google Ads', value: 24, color: '#10b981' },
                            { label: 'TikTok', value: 12, color: '#fbbf24' },
                            { label: 'Direto/Outros', value: 6, color: '#94a3b8' },
                        ].map(channel => (
                            <div key={channel.label}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 700 }}>
                                    <span style={{ color: '#1e293b' }}>{channel.label}</span>
                                    <span style={{ color: channel.color }}>{channel.value}%</span>
                                </div>
                                <div style={{ width: '100%', height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                                    <div style={{ width: `${channel.value}%`, height: '100%', background: channel.color, borderRadius: '4px' }}></div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div style={{ marginTop: '40px', padding: '20px', borderRadius: '16px', background: '#eff6ff', border: '1px solid #dbeafe' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                            <BarChart3 size={20} color="#1d4ed8" />
                            <span style={{ fontWeight: 800, color: '#1d4ed8', fontSize: '0.85rem' }}>INSIGHT DA IA</span>
                        </div>
                        <p style={{ fontSize: '0.8rem', color: '#1e40af', lineHeight: '1.5', margin: 0 }}>
                            Sua campanha do <strong>Facebook Ads</strong> está com custo por aquisição 15% abaixo da média. Sugerimos aumentar o orçamento em 20%.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
