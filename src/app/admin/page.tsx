import { prisma } from '@/lib/prisma'
import { TrendingUp, Users, Package, Clock, ShoppingBag, ArrowUpRight, ArrowDownRight, DollarSign, UserX } from 'lucide-react'
import Link from 'next/link'

const StatCard = ({ title, value, icon: Icon, color, trend }: { title: string, value: string | number, icon: any, color: string, trend?: string }) => (
    <div className="glass-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div style={{ padding: '0.75rem', background: `${color}10`, color: color, borderRadius: '12px' }}>
                <Icon size={20} />
            </div>
            {trend && (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '12px',
                    fontWeight: '700',
                    color: trend.startsWith('+') ? '#10b981' : '#ef4444',
                    background: trend.startsWith('+') ? '#f0fdf4' : '#fef2f2',
                    padding: '2px 8px',
                    borderRadius: '20px'
                }}>
                    {trend.startsWith('+') ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    {trend}
                </div>
            )}
        </div>
        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--admin-text-secondary)', fontWeight: 600 }}>{title}</p>
        <h3 style={{ margin: '4px 0 0', fontSize: '1.75rem', fontWeight: 800, color: 'var(--admin-text-primary)' }}>{value}</h3>
    </div>
)

export default async function SummaryPage() {
    const orders = await prisma.order.findMany({
        where: { NOT: { paymentStatus: 'abandonado' } },
        orderBy: { createdAt: 'desc' },
        take: 5
    })

    const totalSales = await prisma.order.count({ where: { NOT: { paymentStatus: 'abandonado' } } })
    const abandonedCount = await prisma.order.count({ where: { paymentStatus: 'abandonado' } })
    const completedCount = await prisma.order.count({ where: { paymentStatus: 'pago' } })
    const revenueRes = await prisma.order.aggregate({
        _sum: { totalPrice: true },
        where: { paymentStatus: 'pago' }
    })
    const totalRevenue = revenueRes._sum.totalPrice || 0
    const uniqueCustomers = new Set((await prisma.order.findMany({ select: { email: true }, where: { NOT: { paymentStatus: 'abandonado' } } })).map(o => o.email)).size

    return (
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>

            {/* Dashboard Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                <StatCard
                    title="Faturamento (Pago)"
                    value={`R$ ${totalRevenue.toFixed(2)}`}
                    icon={DollarSign}
                    color="#10b981"
                    trend="+15%"
                />
                <StatCard
                    title="Vendas Totais"
                    value={totalSales}
                    icon={TrendingUp}
                    color="#6366f1"
                    trend="+12%"
                />
                <StatCard
                    title="Abandonados"
                    value={abandonedCount}
                    icon={UserX}
                    color="#f59e0b"
                />
                <StatCard
                    title="Clientes Ativos"
                    value={uniqueCustomers}
                    icon={Users}
                    color="#3b82f6"
                />
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr',
                gap: '1.5rem'
            }}>
                {/* Recent Activity */}
                <div className="glass-card" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>Atividade Recente</h2>
                        <Link href="/admin/vendas" style={{ fontSize: '0.85rem', color: '#3b82f6', fontWeight: 700, textDecoration: 'none' }}>Ver todas as vendas</Link>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {orders.length === 0 ? (
                            <p style={{ color: 'var(--admin-text-secondary)', fontSize: '0.9rem', textAlign: 'center', padding: '2rem' }}>Sem atividade recente.</p>
                        ) : (
                            orders.map(order => (
                                <div key={order.id} style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    paddingBottom: '1rem',
                                    borderBottom: '1px solid #f1f5f9'
                                }}>
                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                        <div style={{
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '10px',
                                            background: '#f8fafc',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: '#64748b',
                                            border: '1px solid #e2e8f0'
                                        }}>
                                            <ShoppingBag size={18} />
                                        </div>
                                        <div>
                                            <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700 }}>Novo pedido de {order.fullName.split(' ')[0]}</p>
                                            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--admin-text-secondary)' }}>{new Date(order.createdAt).toLocaleDateString('pt-BR')}</p>
                                        </div>
                                    </div>
                                    <div style={{
                                        padding: '4px 10px',
                                        borderRadius: '8px',
                                        fontSize: '11px',
                                        fontWeight: 800,
                                        background: order.status === 'pendente' ? '#fffbeb' : '#f0fdf4',
                                        color: order.status === 'pendente' ? '#b45309' : '#15803d',
                                        textTransform: 'uppercase'
                                    }}>
                                        {order.status}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Growth/Mini stats */}
                <div className="glass-card" style={{ padding: '1.5rem', background: 'linear-gradient(180deg, #fff 0%, #f8fafc 100%)' }}>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1.5rem' }}>Desempenho</h2>
                    <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                        <div style={{
                            fontSize: '48px',
                            marginBottom: '4px'
                        }}>⚡</div>
                        <p style={{ fontSize: '0.9rem', color: 'var(--admin-text-secondary)', lineHeight: '1.5' }}>
                            Sua taxa de conversão subiu <strong style={{ color: '#10b981' }}>8%</strong> nesta semana!
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
