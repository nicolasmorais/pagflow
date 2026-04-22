export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma'
import { ShoppingCart, Users, Eye, UserCheck, CreditCard } from 'lucide-react'
import AnalyticsFilterForm from '../AnalyticsFilterForm'
import { getDateFilters } from '@/lib/date-utils'
import AbandonedOrdersList from './AbandonedOrdersList'

export default async function AbandonadosPage({
    searchParams,
}: {
    searchParams: Promise<{ from?: string; to?: string; filter?: string }>
}) {
    const params = await searchParams

    const { fromDate, toDate, fromDateUTC, toDateUTC } = getDateFilters(
        params.filter, params.from, params.to
    )

    // Busca pedidos abandonados — filtra por updatedAt para capturar usuários que voltaram
    const abandonedOrders = await prisma.order.findMany({
        where: {
            deletedAt: null,
            updatedAt: {
                gte: fromDateUTC,
                lte: toDateUTC,
            },
            paymentStatus: 'abandonado'
        },
        orderBy: { updatedAt: 'desc' },
        include: { product: true }
    })

    // Busca acessos ao checkout (todo mundo que abriu)
    const checkoutAccesses = await prisma.checkoutAccess.findMany({
        where: {
            createdAt: {
                gte: fromDateUTC,
                lte: toDateUTC,
            },
            paymentCompleted: false,
        },
        orderBy: { createdAt: 'desc' },
    })

    const totalAccess = checkoutAccesses.length
    const step1Done = checkoutAccesses.filter(a => a.step1Completed).length
    const step2Done = checkoutAccesses.filter(a => a.step2Completed).length
    const step3Done = checkoutAccesses.filter(a => a.step3Completed).length

    const gridLayout = 'minmax(180px, 1.2fr) minmax(130px, 0.8fr) minmax(130px, 0.8fr) minmax(150px, 1fr) minmax(100px, 0.6fr) minmax(120px, 0.7fr) 180px';



    return (
        <div style={{ width: '100%', padding: '24px' }}>
            <div style={{ marginBottom: '32px' }}>
                <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                    <div className="page-title-section" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div className="page-title-icon" style={{ background: '#fee2e2', padding: '10px', borderRadius: '12px', color: '#ef4444' }}>
                            <ShoppingCart size={24} />
                        </div>
                        <div>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--admin-text-primary)' }}>Carrinhos Abandonados</h2>
                            <p style={{ fontSize: '0.85rem', color: 'var(--admin-text-secondary)' }}>Checkouts iniciados que não foram finalizados.</p>
                        </div>
                    </div>
                    <AnalyticsFilterForm
                        currentFilter={params.filter || 'today'}
                        fromDate={fromDate}
                        toDate={toDate}
                    />
                </div>
            </div>

            {/* ── Funnel Summary ── */}
            <div className="stark-card" style={{ marginBottom: '24px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, #ef4444, #f59e0b, #10b981)' }} />
                <div style={{ marginBottom: '20px' }}>
                    <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 900, color: 'var(--admin-text-primary)', letterSpacing: '-0.01em' }}>Funil de Abandono</h3>
                    <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--admin-text-muted)', fontWeight: 500 }}>Onde os visitantes estão desistindo no checkout</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px' }}>
                    {[
                        { label: 'Acessaram', value: totalAccess, icon: Eye, color: '#6366f1', bg: '#eef2ff', border: '#c7d2fe' },
                        { label: 'Dados', value: step1Done, icon: UserCheck, color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe' },
                        { label: 'Entrega', value: step2Done, icon: Users, color: '#0ea5e9', bg: '#f0f9ff', border: '#bae6fd' },
                        { label: 'Pagamento', value: step3Done, icon: CreditCard, color: '#f59e0b', bg: '#fffbeb', border: '#fed7aa' },
                        { label: 'Desistiram', value: totalAccess - 0, icon: ShoppingCart, color: '#ef4444', bg: '#fef2f2', border: '#fecaca' },
                    ].map((item) => (
                        <div key={item.label} style={{
                            background: item.bg, borderRadius: '14px', padding: '16px 14px',
                            border: `1px solid ${item.border}`, textAlign: 'center',
                        }}>
                            <item.icon size={18} color={item.color} style={{ marginBottom: '6px' }} />
                            <p style={{ margin: '0 0 2px', fontSize: '24px', fontWeight: 900, color: item.color }}>{item.value}</p>
                            <p style={{ margin: 0, fontSize: '10px', fontWeight: 700, color: item.color, opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{item.label}</p>
                        </div>
                    ))}
                </div>

                {/* Drop-off bars */}
                <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {[
                        { label: 'Saíram antes de preencher dados', count: totalAccess - step1Done, total: totalAccess, color: '#ef4444' },
                        { label: 'Preencheram dados mas saíram no endereço', count: step1Done - step2Done, total: totalAccess, color: '#f59e0b' },
                        { label: 'Chegaram ao pagamento e desistiram', count: step3Done, total: totalAccess, color: '#6366f1' },
                    ].filter(item => item.count > 0).map((item, i) => {
                        const pct = totalAccess > 0 ? Math.round((item.count / totalAccess) * 100) : 0
                        return (
                            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--admin-text-primary)' }}>{item.label}</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontSize: '13px', fontWeight: 900, color: item.color }}>{item.count}</span>
                                        <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--admin-text-muted)', background: '#F1F5F9', padding: '2px 7px', borderRadius: '4px' }}>{pct}%</span>
                                    </div>
                                </div>
                                <div style={{ width: '100%', height: '6px', background: '#F1F5F9', borderRadius: '4px', overflow: 'hidden' }}>
                                    <div style={{ width: `${pct}%`, height: '100%', background: item.color, borderRadius: '4px', transition: 'width 0.6s ease' }} />
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* ── Abandoned Orders List ── */}
            <div style={{ marginBottom: '16px', padding: '0 4px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 900, color: 'var(--admin-text-primary)' }}>
                    Clientes Identificados ({abandonedOrders.length})
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--admin-text-muted)', marginTop: '2px' }}>Clientes que preencheram dados mas não finalizaram a compra</p>
            </div>

            <div className="orders-container">
                {abandonedOrders.length === 0 ? (
                    <div className="stark-card" style={{ textAlign: 'center', padding: '3rem' }}>
                        <ShoppingCart size={32} color="#94a3b8" style={{ margin: '0 auto 12px' }} />
                        <p style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 600 }}>Nenhum cliente preencheu dados e abandonou neste período.</p>
                    </div>
                ) : (
                    <AbandonedOrdersList
                        abandonedOrders={abandonedOrders}
                        gridLayout={gridLayout}
                    />
                )}
            </div>
        </div>
    )
}
