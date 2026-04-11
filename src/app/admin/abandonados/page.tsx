export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma'
import { MapPin, Phone, CreditCard, CheckCircle2, XCircle, Clock, ExternalLink, RefreshCw, Trash2, ShoppingBag, ShoppingCart, UserX } from 'lucide-react'
import Link from 'next/link'
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

    const gridLayout = 'minmax(180px, 1.2fr) minmax(130px, 0.8fr) minmax(150px, 1fr) minmax(100px, 0.6fr) 180px';

    return (
        <div style={{ width: '100%', padding: '24px' }}>
            <div style={{ marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ background: '#fee2e2', padding: '10px', borderRadius: '12px', color: '#ef4444' }}>
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {abandonedOrders.length === 0 && (
                    <div className="glass-card" style={{ textAlign: 'center', padding: '4rem' }}>
                        <p className="subtitle">Nenhum carrinho abandonado encontrado. Bom sinal!</p>
                    </div>
                )}

                {abandonedOrders.length > 0 && (
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
                        <div style={{ textAlign: 'right' }}>Ações</div>
                    </div>
                )}

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
                        {/* Col 1: Customer */}
                        <div>
                            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--admin-text-primary)', margin: '0 0 2px 0' }}>
                                {order.fullName || 'Sem nome'}
                            </h3>
                            <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-secondary)', marginBottom: '4px' }}>{order.email || 'Sem e-mail'}</div>
                            <div style={{ fontSize: '0.65rem', color: 'var(--admin-text-secondary)' }}>
                                {new Date(order.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>

                        {/* Col 2: Product */}
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

                        {/* Col 3: Contact */}
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--admin-text-primary)' }}>
                                <Phone size={14} color="#10b981" />
                                {order.phone || 'Sem telefone'}
                            </div>
                            <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '4px' }}>
                                CPF: {order.cpf || 'Não preenchido'}
                            </div>
                        </div>

                        {/* Col 4: Value */}
                        <div style={{ fontSize: '1rem', fontWeight: 800, color: '#f59e0b' }}>
                            R$ {(order.totalPrice || 0).toFixed(2)}
                        </div>

                        {/* Col 5: Actions */}
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
        </div>
    )
}
