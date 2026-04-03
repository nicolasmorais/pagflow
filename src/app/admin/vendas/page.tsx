export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma'
import { MapPin, Phone, CreditCard, CheckCircle2, XCircle, Clock, ExternalLink, RefreshCw, Trash2, ShoppingBag, TrendingUp, Users, DollarSign, ShoppingCart, Package } from 'lucide-react'
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

                if (newStatus !== order.paymentStatus || !order.installments) {
                    await prisma.order.update({
                        where: { id: order.id },
                        data: {
                            paymentStatus: newStatus,
                            status: newStatus === 'pago' ? 'processando' : order.status,
                            installments: mpResult.installments || null,
                            installmentAmount: (mpResult as any).transaction_details?.installment_amount || null,
                            cardBrand: mpResult.payment_method_id || null,
                            netReceived: (mpResult as any).transaction_details?.net_received_amount || null
                        }
                    });
                    // Update local object for this render
                    order.paymentStatus = newStatus;
                    if (newStatus === 'pago') order.status = 'processando';
                    (order as any).installments = mpResult.installments;
                    (order as any).installmentAmount = (mpResult as any).transaction_details?.installment_amount;
                    (order as any).cardBrand = mpResult.payment_method_id;
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

    const gridLayout = 'minmax(250px, 1.5fr) minmax(150px, 1fr) minmax(120px, 0.8fr) minmax(150px, 1fr) 180px';

    return (
        <div style={{ width: '100%', padding: '24px 0' }}>
            <header style={{ marginBottom: '32px' }}>
                <h1 style={{
                    fontSize: '26px',
                    fontWeight: 900,
                    color: 'var(--admin-text-primary)',
                    margin: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    letterSpacing: '-0.02em'
                }}>
                    <ShoppingCart size={28} color="#3b82f6" />
                    Todas as Vendas
                </h1>
                <p style={{
                    color: 'var(--admin-text-secondary)',
                    fontSize: '14px',
                    marginTop: '4px',
                    fontWeight: 500
                }}>
                    Acompanhe o desempenho e gerencie os pedidos da sua loja.
                </p>
            </header>

            {/* Stats Header */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '24px',
                marginBottom: '40px'
            }}>
                <StatCard
                    icon={DollarSign}
                    label="Total Faturado"
                    value={`R$ ${totalVendasValues.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                    color="#059669"
                    bg="#ecfdf5"
                />
                <StatCard
                    icon={ShoppingBag}
                    label="Total Pedidos"
                    value={totalOrdersCount.toString()}
                    color="#3b82f6"
                    bg="#eff6ff"
                />
                <StatCard
                    icon={CheckCircle2}
                    label="Pedidos Pagos"
                    value={paidOrdersCount.toString()}
                    color="#10b981"
                    bg="#f0fdf4"
                />
                <StatCard
                    icon={TrendingUp}
                    label="Taxa Conversão"
                    value={`${conversionRate}%`}
                    color="#f59e0b"
                    bg="#fffbeb"
                />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {orders.length > 0 && (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: gridLayout,
                        padding: '0 24px 12px 24px',
                        color: 'var(--admin-text-secondary)',
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        opacity: 0.6
                    }}>
                        <div>Cliente</div>
                        <div>Produto</div>
                        <div>Valor</div>
                        <div>Pagamento</div>
                        <div style={{ textAlign: 'right' }}>Ações</div>
                    </div>
                )}

                {orders.length === 0 ? (
                    <div className="glass-card" style={{ textAlign: 'center', padding: '5rem', borderRadius: '32px' }}>
                        <div style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '30px',
                            background: '#f1f5f9',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 24px',
                            color: '#94a3b8'
                        }}>
                            <ShoppingCart size={38} />
                        </div>
                        <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1e293b', marginBottom: '8px' }}>Nenhuma venda ainda</h3>
                        <p style={{ color: '#64748b', fontSize: '14px', maxWidth: '300px', margin: '0 auto' }}>
                            Assim que as primeiras vendas começarem a cair, elas aparecerão listadas aqui com todos os detalhes.
                        </p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {orders.map((order: any) => (
                            <div key={order.id} className="sales-row-new" style={{
                                background: 'var(--admin-card)',
                                border: '1px solid var(--admin-border)',
                                borderRadius: '20px',
                                padding: '16px 24px',
                                display: 'grid',
                                gridTemplateColumns: gridLayout,
                                alignItems: 'center',
                                gap: '16px',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                            }}>

                                {/* Col 1: Customer */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <div style={{
                                        width: '44px',
                                        height: '44px',
                                        borderRadius: '12px',
                                        background: '#f1f5f9',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '14px',
                                        fontWeight: 800,
                                        color: '#3b82f6',
                                        flexShrink: 0
                                    }}>
                                        {order.fullName.charAt(0).toUpperCase()}
                                    </div>
                                    <div style={{ overflow: 'hidden' }}>
                                        <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#1e293b', margin: '0 0 2px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {order.fullName}
                                        </h3>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{order.email}</div>
                                        <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px', fontWeight: 700 }}>
                                            {new Date(order.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </div>

                                {/* Col 2: Product */}
                                <div>
                                    {order.product ? (
                                        <div style={{
                                            fontSize: '0.75rem',
                                            fontWeight: 700,
                                            color: '#3b82f6',
                                            background: '#eff6ff',
                                            padding: '4px 10px',
                                            borderRadius: '8px',
                                            border: '1px solid #dbeafe',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '6px'
                                        }}>
                                            <Package size={12} />
                                            {order.product.name}
                                        </div>
                                    ) : (
                                        <span style={{ color: '#94a3b8', fontSize: '0.75rem', fontStyle: 'italic' }}>Produto removido</span>
                                    )}
                                </div>

                                {/* Col 3: Value */}
                                <div style={{ fontSize: '1rem', fontWeight: 800, color: '#059669' }}>
                                    <span style={{ fontSize: '0.75rem', opacity: 0.7, marginRight: '2px' }}>R$</span>
                                    {(order.totalPrice || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </div>

                                {/* Col 4: Payment */}
                                <div>
                                    <div style={{ marginBottom: '6px' }}>
                                        {order.paymentMethod === 'pix' ? (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: 800, color: '#059669', background: '#ecfdf5', padding: '2px 8px', borderRadius: '6px', width: 'fit-content' }}>
                                                ❖ PIX
                                            </div>
                                        ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: 800, color: '#3b82f6', background: '#eff6ff', padding: '2px 8px', borderRadius: '6px', width: 'fit-content' }}>
                                                    💳 {order.cardBrand ? order.cardBrand.toUpperCase() : 'CARTÃO'}
                                                </div>
                                                {order.installments && (
                                                    <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 700, marginLeft: '4px' }}>
                                                        {order.installments}x de R$ {order.installmentAmount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <div style={{
                                        display: 'inline-flex',
                                        padding: '4px 12px',
                                        borderRadius: '10px',
                                        fontSize: '10px',
                                        fontWeight: 800,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.02em',
                                        background: order.paymentStatus === 'pago' ? '#dcfce7' : order.paymentStatus === 'recusado' ? '#fee2e2' : '#fef3c7',
                                        color: order.paymentStatus === 'pago' ? '#166534' : order.paymentStatus === 'recusado' ? '#991b1b' : '#92400e',
                                        border: '1.5px solid',
                                        borderColor: order.paymentStatus === 'pago' ? '#bbf7d0' : order.paymentStatus === 'recusado' ? '#fecaca' : '#fde68a'
                                    }}>
                                        {order.paymentStatus || 'processando'}
                                    </div>
                                </div>

                                {/* Col 5: Actions */}
                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                    <Link
                                        href={`/admin/pedidos/${order.id}`}
                                        style={{
                                            height: '40px',
                                            padding: '0 16px',
                                            background: '#fff',
                                            borderRadius: '12px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: '#64748b',
                                            border: '1px solid #e2e8f0',
                                            textDecoration: 'none',
                                            fontSize: '13px',
                                            fontWeight: 700,
                                            gap: '8px',
                                            transition: 'all 0.2s',
                                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                        }}
                                    >
                                        Detalhes <ExternalLink size={14} />
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

function StatCard({ icon: Icon, label, value, color, bg }: any) {
    return (
        <div style={{
            background: 'var(--admin-card)',
            border: '1px solid var(--admin-border)',
            borderRadius: '24px',
            padding: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            transition: 'all 0.2s ease',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
        }}>
            <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                background: bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: color,
                boxShadow: `0 4px 12px ${color}15`
            }}>
                <Icon size={26} />
            </div>
            <div>
                <div style={{ fontSize: '13px', color: 'var(--admin-text-secondary)', marginBottom: '4px', fontWeight: 600 }}>{label}</div>
                <div style={{ fontSize: '20px', fontWeight: 900, color: 'var(--admin-text-primary)', letterSpacing: '-0.02em' }}>{value}</div>
            </div>
        </div>
    )
}
