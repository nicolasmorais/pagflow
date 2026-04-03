export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma'
import { MapPin, Phone, CreditCard, CheckCircle2, XCircle, Clock, ExternalLink, RefreshCw, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { updateOrderStatus, deleteOrder } from '../../actions'
import PaymentStatusSelect from './components/PaymentStatusSelect'
import { MercadoPagoConfig, Payment } from 'mercadopago'

export default async function OrdersPage() {
    // 1. Fetch orders from DB
    const orders = await prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
        include: { product: true }
    })

    // 2. Auto-sync pending payments with Mercado Pago
    const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN || '' });
    const payment = new Payment(client);

    const statusMap: Record<string, string> = {
        'approved': 'pago',
        'pending': 'aguardando',
        'authorized': 'aguardando',
        'in_process': 'aguardando',
        'rejected': 'recusado',
        'cancelled': 'recusado',
        'refunded': 'reembolsado'
    };

    for (const order of orders) {
        if (order.mpPaymentId && (order.paymentStatus === 'processando' || order.paymentStatus === 'aguardando')) {
            try {
                const mpResult = await payment.get({ id: order.mpPaymentId });
                const newStatus = statusMap[mpResult.status || ''] || order.paymentStatus;

                if (newStatus !== order.paymentStatus) {
                    await prisma.order.update({
                        where: { id: order.id },
                        data: {
                            paymentStatus: newStatus,
                            status: newStatus === 'pago' ? 'processando' : order.status
                        }
                    });
                    // Update local object for this render
                    order.paymentStatus = newStatus;
                    if (newStatus === 'pago') order.status = 'processando';
                }
            } catch (e) {
                console.error(`Error syncing order ${order.id}:`, e);
            }
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'atendido': return '#10b981';
            case 'cancelado': return '#ef4444';
            default: return '#f59e0b';
        }
    }

    const gridLayout = 'minmax(180px, 1fr) minmax(130px, 0.8fr) minmax(250px, 1.5fr) minmax(130px, 0.8fr) minmax(100px, 0.6fr) minmax(130px, 0.8fr) 180px';

    return (
        <div style={{ width: '100%' }}>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {orders.length === 0 && (
                    <div className="glass-card" style={{ textAlign: 'center', padding: '4rem' }}>
                        <p className="subtitle">Nenhum pedido recebido ainda. Divulgue seu link de checkout!</p>
                    </div>
                )}

                {orders.length > 0 && (
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
                        <div>Local de Entrega</div>
                        <div>Contato / Doc</div>
                        <div>Valor</div>
                        <div>Pagamento</div>
                        <div style={{ textAlign: 'right' }}>Ações</div>
                    </div>
                )}

                {orders.map((order: any) => (
                    <div key={order.id} className="dashboard-order-row" style={{
                        background: 'var(--admin-card)',
                        border: '1px solid var(--admin-border)',
                        borderRadius: '16px',
                        padding: '12px 24px',
                        display: 'grid',
                        gridTemplateColumns: gridLayout,
                        alignItems: 'center',
                        gap: '16px',
                        position: 'relative',
                        overflow: 'hidden',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.01)'
                    }}>
                        <div className="status-indicator" style={{ background: getStatusColor(order.status), width: '4px', height: '100%', position: 'absolute', left: 0, top: 0 }} />

                        {/* Col 1: Customer */}
                        <div>
                            <Link href={`/admin/pedidos/${order.id}`} style={{ textDecoration: 'none' }}>
                                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#3b82f6', margin: '0 0 2px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    {order.fullName || 'Sem nome'}
                                    <ExternalLink size={12} style={{ opacity: 0.5 }} />
                                </h3>
                            </Link>
                            <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-secondary)', marginBottom: '4px' }}>{order.email || ''}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '3px', color: getStatusColor(order.status), fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase' }}>
                                    {order.status === 'atendido' ? <CheckCircle2 size={11} /> : order.status === 'cancelado' ? <XCircle size={11} /> : <Clock size={11} />}
                                    {order.status}
                                </div>
                                <span style={{ fontSize: '0.65rem', color: 'var(--admin-text-secondary)' }}>
                                    {new Date(order.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </span>
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
                                    maxWidth: '100%',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                }}>
                                    {order.product.name}
                                </div>
                            ) : (
                                <span style={{ color: 'var(--admin-text-secondary)', fontSize: '0.8rem' }}>Produto removido</span>
                            )}
                            {order.hasBump && (
                                <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#f59e0b', background: '#fffbeb', border: '1px solid #fef3c7', padding: '2px 6px', borderRadius: '4px', display: 'inline-block', width: 'fit-content' }}>
                                    📦 + OFERTA EXTRA
                                </div>
                            )}
                        </div>

                        {/* Col 3: Address */}
                        <div style={{ fontSize: '0.8rem', color: 'var(--admin-text-primary)', lineHeight: '1.4' }}>
                            <div style={{ fontWeight: 700 }}>{order.rua || ''}, {order.numero || ''}</div>
                            <div style={{ color: 'var(--admin-text-secondary)', fontSize: '0.75rem' }}>
                                {order.bairro || ''} — {order.cidade || ''}/{order.estado || ''}
                                {order.complemento && ` — ${order.complemento} `}
                            </div>
                            {order.referencia && (
                                <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                    <MapPin size={10} />
                                    {order.referencia}
                                </div>
                            )}
                        </div>

                        {/* Col 4: Contact */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 600 }}>
                                <Phone size={13} color="#10b981" />
                                {order.phone || 'Sem telefone'}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--admin-text-secondary)' }}>
                                <CreditCard size={13} />
                                {order.cpf || 'Sem CPF'}
                            </div>
                        </div>

                        {/* Col 5: Value */}
                        <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#10b981' }}>
                            R$ {(order.totalPrice || 0).toFixed(2)}
                        </div>

                        {/* Col 6: Payment */}
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '8px', color: 'var(--admin-text-secondary)', fontSize: '0.7rem', fontWeight: 700 }}>
                                {order.paymentMethod === 'pix' ? '❖ PIX' : '💳 CARTÃO'}
                            </div>
                            <PaymentStatusSelect
                                orderId={order.id}
                                initialStatus={order.paymentStatus || 'processando'}
                            />
                        </div>


                        {/* Col 7: Actions */}
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                            <a
                                href={`https://wa.me/${(order.phone || '').replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                    width: '34px',
                                    height: '34px',
                                    background: '#e1fae9',
                                    borderRadius: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#10b981',
                                    border: '1px solid #d1f7de',
                                    transition: 'all 0.2s'
                                }}
                                title="WhatsApp"
                            >
                                <ExternalLink size={16} />
                            </a >

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
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }} title="Excluir Pedido">
                                    <Trash2 size={16} />
                                </button>
                            </form>
                        </div >
                    </div >
                ))}
            </div >
        </div >
    )
}
