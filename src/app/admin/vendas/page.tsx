import { prisma } from '@/lib/prisma'
import { MapPin, Phone, CreditCard, CheckCircle2, XCircle, Clock, ExternalLink, RefreshCw, Trash2, ShoppingBag, TrendingUp, Users, DollarSign } from 'lucide-react'
import Link from 'next/link'
import { updateOrderStatus, deleteOrder } from '../../actions'
import PaymentStatusSelect from '../pedidos/components/PaymentStatusSelect'
import { MercadoPagoConfig, Payment } from 'mercadopago'

export default async function VendasPage() {
    // 1. Fetch orders from DB
    const orders = await prisma.order.findMany({
        where: {
            NOT: {
                paymentStatus: {
                    in: ['abandonado', 'processando']
                }
            }
        },
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

    // Calculate Stats
    const totalVendasValues = orders.filter(o => o.paymentStatus === 'pago').reduce((acc, curr) => acc + (curr.totalPrice || 0), 0);
    const totalOrdersCount = orders.length;
    const paidOrdersCount = orders.filter(o => o.paymentStatus === 'pago').length;
    const conversionRate = totalOrdersCount > 0 ? ((paidOrdersCount / totalOrdersCount) * 100).toFixed(1) : 0;

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'atendido': return '#10b981';
            case 'cancelado': return '#ef4444';
            default: return '#f59e0b';
        }
    }

    const gridLayout = 'minmax(180px, 1.2fr) minmax(130px, 0.8fr) minmax(100px, 0.6fr) minmax(130px, 0.8fr) 180px';

    return (
        <div style={{ width: '100%', padding: '24px' }}>
            {/* Stats Header */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '20px',
                marginBottom: '32px'
            }}>
                <StatCard icon={DollarSign} label="Total Faturado" value={`R$ ${totalVendasValues.toFixed(2)}`} color="#10b981" />
                <StatCard icon={ShoppingBag} label="Total Pedidos" value={totalOrdersCount.toString()} color="#3b82f6" />
                <StatCard icon={CheckCircle2} label="Pedidos Pagos" value={paidOrdersCount.toString()} color="#10b981" />
                <StatCard icon={TrendingUp} label="Taxa Conversão" value={`${conversionRate}%`} color="#f59e0b" />
            </div>

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
                                {order.fullName}
                            </h3>
                            <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-secondary)', marginBottom: '4px' }}>{order.email}</div>
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
                                <span style={{ color: 'var(--admin-text-secondary)', fontSize: '0.8rem' }}>Produto removido</span>
                            )}
                        </div>

                        {/* Col 3: Value */}
                        <div style={{ fontSize: '1rem', fontWeight: 800, color: '#10b981' }}>
                            R$ {(order.totalPrice || 0).toFixed(2)}
                        </div>

                        {/* Col 4: Payment */}
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '8px', color: 'var(--admin-text-secondary)', fontSize: '0.7rem', fontWeight: 700 }}>
                                {order.paymentMethod === 'pix' ? '❖ PIX' : '💳 CARTÃO'}
                            </div>
                            <div style={{
                                display: 'inline-flex',
                                padding: '4px 10px',
                                borderRadius: '20px',
                                fontSize: '0.65rem',
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                background: order.paymentStatus === 'pago' ? '#dcfce7' : order.paymentStatus === 'recusado' ? '#fee2e2' : '#fef3c7',
                                color: order.paymentStatus === 'pago' ? '#166534' : order.paymentStatus === 'recusado' ? '#991b1b' : '#92400e'
                            }}>
                                {order.paymentStatus || 'processando'}
                            </div>
                        </div>

                        {/* Col 5: Actions */}
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <Link
                                href={`/admin/pedidos/${order.id}`}
                                style={{
                                    height: '34px',
                                    padding: '0 12px',
                                    background: '#f8fafc',
                                    borderRadius: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#64748b',
                                    border: '1px solid #e2e8f0',
                                    textDecoration: 'none',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    gap: '6px'
                                }}
                            >
                                Detalhes <ExternalLink size={14} />
                            </Link>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

function StatCard({ icon: Icon, label, value, color }: any) {
    return (
        <div style={{
            background: 'var(--admin-card)',
            border: '1px solid var(--admin-border)',
            borderRadius: '20px',
            padding: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '20px'
        }}>
            <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: `${color}15`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: color
            }}>
                <Icon size={24} />
            </div>
            <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--admin-text-secondary)', marginBottom: '4px', fontWeight: 600 }}>{label}</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--admin-text-primary)' }}>{value}</div>
            </div>
        </div>
    )
}
