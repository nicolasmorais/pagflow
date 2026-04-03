export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma'
import { TrendingUp, Users, ShoppingBag, ArrowUpRight, ArrowDownRight, DollarSign, UserX, ShoppingCart } from 'lucide-react'
import Link from 'next/link'

const StatCard = ({ title, value, icon: Icon, color, trend }: { title: string, value: string | number, icon: any, color: string, trend?: string }) => (
    <div style={{
        background: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: '16px',
        padding: '20px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
    }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ padding: '10px', background: `${color}15`, color: color, borderRadius: '12px', display: 'flex' }}>
                <Icon size={20} />
            </div>
            {trend && (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '3px',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: trend.startsWith('+') ? '#10b981' : '#ef4444',
                    background: trend.startsWith('+') ? '#f0fdf4' : '#fef2f2',
                    padding: '3px 8px',
                    borderRadius: '20px'
                }}>
                    {trend.startsWith('+') ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                    {trend}
                </div>
            )}
        </div>
        <div>
            <p style={{ margin: '0 0 4px', fontSize: '13px', color: '#64748b', fontWeight: 600, lineHeight: 1.4 }}>{title}</p>
            <h3 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: '#1e293b', lineHeight: 1.1 }}>{value}</h3>
        </div>
    </div>
)

export default async function SummaryPage() {
    const orders = await prisma.order.findMany({
        where: { deletedAt: null, NOT: { paymentStatus: 'abandonado' } },
        orderBy: { createdAt: 'desc' },
        take: 5
    })

    const totalSales = await prisma.order.count({ where: { deletedAt: null, NOT: { paymentStatus: 'abandonado' } } })
    const abandonedCount = await prisma.order.count({ where: { deletedAt: null, paymentStatus: 'abandonado' } })
    const revenueRes = await prisma.order.aggregate({
        _sum: { totalPrice: true },
        where: { deletedAt: null, paymentStatus: 'pago' }
    })
    const totalRevenue = revenueRes._sum.totalPrice || 0
    const uniqueCustomers = new Set((await prisma.order.findMany({ select: { email: true }, where: { deletedAt: null, NOT: { paymentStatus: 'abandonado' } } })).map(o => o.email)).size

    return (
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>

            {/* Page Title */}
            <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: 'clamp(1.25rem, 5vw, 1.75rem)', fontWeight: 900, color: '#1e293b', margin: 0, letterSpacing: '-0.02em' }}>
                    Dashboard
                </h1>
                <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#64748b', lineHeight: 1.5 }}>
                    Visão geral do desempenho da sua loja
                </p>
            </div>

            {/* Stats Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '12px',
                marginBottom: '24px'
            }} className="dash-stats-grid">
                <StatCard title="Faturamento" value={`R$ ${totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} icon={DollarSign} color="#10b981" trend="+15%" />
                <StatCard title="Vendas" value={totalSales} icon={TrendingUp} color="#6366f1" trend="+12%" />
                <StatCard title="Abandonados" value={abandonedCount} icon={UserX} color="#f59e0b" />
                <StatCard title="Clientes" value={uniqueCustomers} icon={Users} color="#3b82f6" />
            </div>

            {/* Recent Activity */}
            <div style={{
                background: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: '20px',
                overflow: 'hidden',
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                marginBottom: '16px'
            }}>
                <div style={{ padding: '20px 20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: '#1e293b' }}>Atividade Recente</h2>
                    <Link href="/admin/vendas" style={{
                        fontSize: '13px',
                        color: '#3b82f6',
                        fontWeight: 700,
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '6px 12px',
                        background: '#eff6ff',
                        borderRadius: '10px',
                        minHeight: '36px'
                    }}>
                        Ver todas
                    </Link>
                </div>

                <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '0' }}>
                    {orders.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
                            <ShoppingCart size={32} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.4 }} />
                            <p style={{ margin: 0, fontSize: '14px' }}>Sem atividade recente.</p>
                        </div>
                    ) : (
                        orders.map((order, idx) => (
                            <div key={order.id} style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                paddingTop: idx === 0 ? 0 : '14px',
                                paddingBottom: '14px',
                                borderBottom: idx < orders.length - 1 ? '1px solid #f1f5f9' : 'none',
                            }}>
                                {/* Icon */}
                                <div style={{
                                    width: '44px',
                                    height: '44px',
                                    minWidth: '44px',
                                    borderRadius: '12px',
                                    background: '#f8fafc',
                                    border: '1px solid #e2e8f0',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#64748b'
                                }}>
                                    <ShoppingBag size={18} />
                                </div>

                                {/* Info */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {(order.fullName || '').split(' ')[0]}
                                    </p>
                                    <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                                        {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                                    </p>
                                </div>

                                {/* Status Badge */}
                                <div style={{
                                    padding: '5px 10px',
                                    borderRadius: '8px',
                                    fontSize: '11px',
                                    fontWeight: 800,
                                    textTransform: 'uppercase',
                                    whiteSpace: 'nowrap',
                                    background: order.status === 'pendente' ? '#fffbeb' : '#f0fdf4',
                                    color: order.status === 'pendente' ? '#b45309' : '#15803d'
                                }}>
                                    {order.status}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Performance Card */}
            <div style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '20px',
                padding: '24px',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                boxShadow: '0 8px 24px rgba(102,126,234,0.3)'
            }}>
                <div style={{ fontSize: '36px', lineHeight: 1 }}>⚡</div>
                <div>
                    <p style={{ margin: 0, fontWeight: 800, fontSize: '15px', lineHeight: 1.4 }}>
                        Ótimo desempenho!
                    </p>
                    <p style={{ margin: '4px 0 0', fontSize: '13px', opacity: 0.85, lineHeight: 1.5 }}>
                        Sua taxa de conversão subiu <strong>8%</strong> nesta semana.
                    </p>
                </div>
            </div>

        </div>
    )
}
