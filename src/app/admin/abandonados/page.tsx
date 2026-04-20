export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma'
import { Phone, ExternalLink, Trash2, ShoppingCart, Users, Eye, UserCheck, CreditCard, CheckCircle2 } from 'lucide-react'
import { deleteOrder } from '../../actions'
import AnalyticsFilterForm from '../AnalyticsFilterForm'
import { getDateFilters } from '@/lib/date-utils'

export default async function AbandonadosPage({
    searchParams,
}: {
    searchParams: Promise<{ from?: string; to?: string; filter?: string }>
}) {
    const params = await searchParams

    const { fromDate, toDate, fromDateUTC, toDateUTC } = getDateFilters(
        params.filter, params.from, params.to
    )

    // Busca pedidos abandonados (quem preencheu dados mas não pagou)
    const abandonedOrders = await prisma.order.findMany({
        where: {
            deletedAt: null,
            createdAt: {
                gte: fromDateUTC,
                lte: toDateUTC,
            },
            paymentStatus: {
                in: ['abandonado', 'processando']
            }
        },
        orderBy: { createdAt: 'desc' },
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

    const gridLayout = 'minmax(180px, 1.2fr) minmax(130px, 0.8fr) minmax(150px, 1fr) minmax(100px, 0.6fr) minmax(120px, 0.7fr) 180px';

    const getStepLabel = (step: number | null) => {
        switch (step) {
            case 1: return { label: 'Dados', color: '#3b82f6', bg: '#eff6ff' };
            case 2: return { label: 'Entrega', color: '#0ea5e9', bg: '#f0f9ff' };
            case 3: return { label: 'Pagamento', color: '#f59e0b', bg: '#fffbeb' };
            default: return { label: 'Início', color: '#6366f1', bg: '#eef2ff' };
        }
    }

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
                    <>
                        {/* Desktop Grid View */}
                        <div className="desktop-orders-table" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: gridLayout,
                                padding: '0 24px 12px 24px',
                                color: 'var(--admin-text-secondary)',
                                fontSize: '0.7rem',
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em'
                            }}>
                                <div>Cliente</div>
                                <div>Produto</div>
                                <div>Contato</div>
                                <div>Valor Potencial</div>
                                <div>Última Etapa</div>
                                <div style={{ textAlign: 'right' }}>Ações</div>
                            </div>

                            {abandonedOrders.map((order: any) => (
                                <div key={order.id} className="dashboard-order-row" style={{
                                    background: 'var(--admin-card)',
                                    border: '1px solid var(--admin-border)',
                                    borderRadius: '16px',
                                    padding: '16px 24px',
                                    display: 'grid',
                                    gridTemplateColumns: gridLayout,
                                    alignItems: 'center',
                                    gap: '16px',
                                    transition: 'all 0.2s ease',
                                }}>
                                    <div>
                                        <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--admin-text-primary)', margin: '0 0 2px 0' }}>
                                            {order.fullName || 'Sem nome'}
                                        </h3>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-secondary)', marginBottom: '4px' }}>{order.email || 'Sem e-mail'}</div>
                                        <div style={{ fontSize: '0.65rem', color: 'var(--admin-text-secondary)' }}>
                                            {new Date(order.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        {order.product ? (
                                            <div style={{
                                                fontSize: '0.8rem',
                                                fontWeight: 700,
                                                color: '#3b82f6',
                                                background: '#eff6ff',
                                                padding: '3px 8px',
                                                borderRadius: '5px',
                                                border: '1px solid #dbeafe',
                                                display: 'inline-block',
                                                width: 'fit-content'
                                            }}>
                                                {order.product.name}
                                            </div>
                                        ) : (
                                            <span style={{ color: 'var(--admin-text-secondary)', fontSize: '0.8rem' }}>Interesse em produto</span>
                                        )}
                                    </div>

                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--admin-text-primary)' }}>
                                            <Phone size={14} color="#10b981" />
                                            {order.phone || 'Sem telefone'}
                                        </div>
                                        <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '4px' }}>
                                            CPF: {order.cpf || 'Não preenchido'}
                                        </div>
                                    </div>

                                    <div style={{ fontSize: '1rem', fontWeight: 800, color: '#f59e0b' }}>
                                        R$ {(order.totalPrice || 0).toFixed(2)}
                                    </div>

                                    <div>
                                        <div style={{
                                            ...getStepLabel(order.lastStepReached),
                                            fontSize: '0.7rem',
                                            fontWeight: 800,
                                            padding: '4px 10px',
                                            borderRadius: '6px',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            textTransform: 'uppercase'
                                        }}>
                                            {getStepLabel(order.lastStepReached).label}
                                        </div>
                                        {order.paymentMethod && (
                                            <div style={{ fontSize: '0.65rem', color: 'var(--admin-text-muted)', marginTop: '4px', fontWeight: 600 }}>
                                                💳 {order.paymentMethod.toUpperCase()}
                                            </div>
                                        )}
                                    </div>

                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                        <a
                                            href={`https://wa.me/${(order.phone || '').replace(/\D/g, '')}?text=Olá ${(order.fullName || 'Cliente').split(' ')[0]}, vimos que você iniciou a compra do ${order.product?.name || 'nosso produto'} mas não finalizou. Podemos te ajudar?`}
                                            target="_blank"
                                            rel="noreferrer"
                                            style={{
                                                height: '34px',
                                                padding: '0 12px',
                                                background: '#e1fae9',
                                                borderRadius: '8px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: '#10b981',
                                                border: '1px solid #d1f7de',
                                                textDecoration: 'none',
                                                fontSize: '0.75rem',
                                                fontWeight: 700,
                                                gap: '6px'
                                            }}
                                        >
                                            Recuperar <ExternalLink size={14} />
                                        </a>

                                        <form action={async () => {
                                            'use server'
                                            await deleteOrder(order.id)
                                        }}>
                                            <button style={{
                                                width: '34px',
                                                height: '34px',
                                                background: '#fff1f2',
                                                borderRadius: '8px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: '#e11d48',
                                                border: '1px solid #ffe4e6',
                                                cursor: 'pointer'
                                            }}>
                                                <Trash2 size={14} />
                                            </button>
                                        </form>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Mobile List View */}
                        <div className="mobile-orders-grid">
                            {abandonedOrders.map((order: any) => (
                                <div key={order.id} className="mobile-order-card" style={{ padding: '20px', background: '#fff', borderRadius: '16px', border: '1px solid var(--admin-border)', marginBottom: '12px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                        <div>
                                            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--admin-text-primary)', margin: 0 }}>
                                                {order.fullName || 'Sem nome'}
                                            </h3>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--admin-text-secondary)', marginTop: '2px' }}>{order.email}</div>
                                        </div>
                                        <div style={{ fontSize: '1rem', fontWeight: 900, color: '#f59e0b' }}>
                                            R$ {order.totalPrice.toFixed(2)}
                                        </div>
                                    </div>

                                    <div style={{ marginBottom: '12px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        <div style={{
                                            ...getStepLabel(order.lastStepReached),
                                            fontSize: '0.65rem',
                                            fontWeight: 900,
                                            padding: '3px 8px',
                                            borderRadius: '5px',
                                            textTransform: 'uppercase'
                                        }}>
                                            {getStepLabel(order.lastStepReached).label}
                                        </div>
                                        {order.paymentMethod && (
                                            <span style={{ fontSize: '0.7rem', color: 'var(--admin-text-muted)', fontWeight: 700 }}>
                                                • {order.paymentMethod.toUpperCase()}
                                            </span>
                                        )}
                                    </div>

                                    <div style={{ marginBottom: '16px' }}>
                                        {order.product ? (
                                            <div style={{
                                                fontSize: '0.75rem',
                                                fontWeight: 700,
                                                color: '#3b82f6',
                                                background: '#eff6ff',
                                                padding: '4px 10px',
                                                borderRadius: '6px',
                                                border: '1px solid #dbeafe',
                                                display: 'inline-block'
                                            }}>
                                                {order.product.name}
                                            </div>
                                        ) : (
                                            <div style={{ fontSize: '0.8rem', color: 'var(--admin-text-secondary)' }}>Interesse em produto</div>
                                        )}
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--admin-text-primary)' }}>
                                                <Phone size={14} color="#10b981" />
                                                {order.phone || 'Sem telefone'}
                                            </div>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--admin-text-muted)' }}>
                                                {new Date(order.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <a
                                                href={`https://wa.me/${(order.phone || '').replace(/\D/g, '')}?text=Olá ${(order.fullName || 'Cliente').split(' ')[0]}, vimos que você iniciou a compra do ${order.product?.name || 'nosso produto'} mas não finalizou. Podemos te ajudar?`}
                                                target="_blank"
                                                rel="noreferrer"
                                                style={{
                                                    height: '38px',
                                                    padding: '0 14px',
                                                    background: '#10b981',
                                                    borderRadius: '10px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    color: '#fff',
                                                    textDecoration: 'none',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 700,
                                                    gap: '6px'
                                                }}
                                            >
                                                Recuperar
                                            </a>
                                            <form action={async () => {
                                                'use server'
                                                await deleteOrder(order.id)
                                            }}>
                                                <button style={{
                                                    width: '38px',
                                                    height: '38px',
                                                    background: '#fff1f2',
                                                    borderRadius: '10px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: '#e11d48',
                                                    border: '1px solid #ffe4e6'
                                                }}>
                                                    <Trash2 size={16} />
                                                </button>
                                            </form>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
