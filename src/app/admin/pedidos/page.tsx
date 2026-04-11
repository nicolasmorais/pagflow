export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma'
import { MapPin, Phone, CreditCard, CheckCircle2, XCircle, Clock, ExternalLink, RefreshCw, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { deleteOrder } from '../../actions'
import PaymentStatusSelect from './components/PaymentStatusSelect'
import OrderStatusSelect from './components/OrderStatusSelect'
import AnalyticsFilterForm from '../AnalyticsFilterForm'
import { MercadoPagoConfig, Payment } from 'mercadopago'
import { getDateFilters } from '@/lib/date-utils'

async function syncMercadoPagoOrders(orders: any[]) {
    // Only sync if MP token is available
    if (!process.env.MP_ACCESS_TOKEN) return orders;

    const pendingOrders = orders.filter(
        o => o.mpPaymentId && (o.paymentStatus === 'processando' || o.paymentStatus === 'aguardando')
    );

    if (pendingOrders.length === 0) return orders;

    const statusMap: Record<string, string> = {
        'approved': 'pago',
        'pending': 'aguardando',
        'authorized': 'aguardando',
        'in_process': 'aguardando',
        'rejected': 'recusado',
        'cancelled': 'recusado',
        'refunded': 'reembolsado'
    };

    try {
        const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
        const paymentClient = new Payment(client);

        for (const order of pendingOrders) {
            try {
                const mpResult = await paymentClient.get({ id: order.mpPaymentId });
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
                    const localOrder = orders.find(o => o.id === order.id);
                    if (localOrder) {
                        localOrder.paymentStatus = newStatus;
                        if (newStatus === 'pago') localOrder.status = 'processando';
                    }
                }
            } catch (e) {
                // Non-fatal: just skip this order sync
                console.error(`Error syncing order ${order.id}:`, e);
            }
        }
    } catch (e) {
        // Non-fatal: MP SDK not available or misconfigured
        console.error('Error initializing Mercado Pago for sync:', e);
    }

    return orders;
}

export default async function OrdersPage({
    searchParams,
}: {
    searchParams: Promise<{ from?: string; to?: string; filter?: string }>
}) {
    const params = await searchParams

    const { fromDate, toDate, fromDateUTC, toDateUTC } = getDateFilters(
        params.filter, params.from, params.to
    )

    let orders: any[] = [];

    try {
        orders = await prisma.order.findMany({
            where: {
                deletedAt: null,
                createdAt: {
                    gte: fromDateUTC,
                    lte: toDateUTC,
                }
            },
            orderBy: { createdAt: 'desc' },
            include: { product: true }
        });
    } catch (e) {
        console.error('Error fetching orders:', e);
        return (
            <div style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '40px', padding: '40px', textAlign: 'center' }}>
                <h2 style={{ color: '#ef4444' }}>Erro ao carregar pedidos</h2>
                <p style={{ color: '#64748b' }}>Tente recarregar a página. Se o problema persistir, verifique as configurações do banco de dados.</p>
            </div>
        )
    }

    // Sync MP status in background - errors are handled internally
    orders = await syncMercadoPagoOrders(orders);

    return (
        <div style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '40px' }}>

            {/* Header / Toolbar */}
            <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '20px' }}>
                <div>
                    <h1 style={{ fontSize: 'clamp(1.5rem, 5vw, 2.2rem)', fontWeight: 900, color: '#1e293b', margin: 0, letterSpacing: '-0.04em', fontFamily: "'Space Grotesk', sans-serif" }}>
                        Pedidos
                    </h1>
                    <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#64748b', fontWeight: 500 }}>
                        Gerencie suas vendas, envios e faturamento.
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <AnalyticsFilterForm
                        currentFilter={params.filter || 'today'}
                        fromDate={fromDate}
                        toDate={toDate}
                    />
                    <div style={{ position: 'relative' }}>
                        <input
                            type="text"
                            placeholder="Buscar pedido..."
                            style={{
                                padding: '10px 16px',
                                paddingLeft: '40px',
                                borderRadius: '14px',
                                border: '1px solid #e2e8f0',
                                fontSize: '14px',
                                width: '280px',
                                background: '#fff',
                                outline: 'none',
                                transition: 'all 0.2s',
                                fontFamily: "'Space Grotesk', sans-serif"
                            }}
                        />
                        <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                            <RefreshCw size={16} />
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {orders.length === 0 && (
                    <div className="glass-card" style={{ textAlign: 'center', padding: '5rem 2rem', borderRadius: '24px' }}>
                        <div style={{
                            width: '64px', height: '64px', background: '#f1f5f9', borderRadius: '20px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px'
                        }}>
                            <Clock size={32} color="#94a3b8" />
                        </div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b', marginBottom: '8px' }}>Nenhum pedido ainda</h2>
                        <p style={{ color: '#64748b', fontSize: '0.95rem' }}>Assim que as vendas começarem, elas aparecerão aqui em tempo real.</p>
                    </div>
                )}

                {orders.map((order: any) => (
                    <div key={order.id} className="analytics-card" style={{
                        padding: '0',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        cursor: 'default',
                        border: '1px solid var(--admin-border)',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
                    }}>
                        <div style={{
                            padding: '20px 24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '20px',
                            borderBottom: '1px solid #f1f5f9'
                        }}>
                            {/* Left: Primary Info */}
                            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                                <div style={{
                                    width: '56px', height: '56px', borderRadius: '16px',
                                    background: order.paymentStatus === 'pago' ? '#ecfdf5' : '#fef2f2',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    flexShrink: 0
                                }}>
                                    {order.paymentStatus === 'pago' ? (
                                        <CheckCircle2 size={24} color="#10b981" />
                                    ) : (
                                        <XCircle size={24} color="#ef4444" />
                                    )}
                                </div>
                                <div>
                                    <Link href={`/admin/pedidos/${order.id}`} style={{ textDecoration: 'none' }}>
                                        <h3 style={{
                                            fontSize: '1.2rem', fontWeight: 800, color: '#0d1117',
                                            margin: '0 0 4px 0', letterSpacing: '-0.02em',
                                            fontFamily: "'Space Grotesk', sans-serif",
                                            display: 'flex', alignItems: 'center', gap: '8px'
                                        }}>
                                            {order.fullName || 'Sem nome'}
                                            <ExternalLink size={14} color="#3b82f6" />
                                        </h3>
                                    </Link>
                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                        <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>{order.email}</span>
                                        <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#cbd5e1' }} />
                                        <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500 }}>
                                            {new Date(order.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Center: Value & Status Selectors */}
                            <div style={{ display: 'flex', gap: '32px', alignItems: 'center', flexWrap: 'wrap' }}>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>Valor Total</div>
                                    <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#10b981', fontFamily: "'Space Grotesk', sans-serif" }}>
                                        R$ {(order.totalPrice || 0).toFixed(2)}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <div>
                                        <div style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>Pagamento</div>
                                        <PaymentStatusSelect
                                            orderId={order.id}
                                            initialStatus={order.paymentStatus || 'processando'}
                                        />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>Logística</div>
                                        <OrderStatusSelect
                                            orderId={order.id}
                                            initialStatus={order.status || 'pendente'}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Bottom: Details Bar */}
                        <div style={{
                            padding: '16px 24px',
                            background: '#f8fafc',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '16px'
                        }}>
                            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                                {/* Product */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ width: '32px', height: '32px', background: '#fff', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0' }}>
                                        <CreditCard size={16} color="#6366f1" />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Produto</div>
                                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>
                                            {order.product?.name || 'Produto Removido'}
                                            {order.hasBump && <span style={{ marginLeft: '8px', fontSize: '10px', background: '#fef3c7', color: '#f59e0b', padding: '2px 6px', borderRadius: '4px' }}>+ BUMP</span>}
                                        </div>
                                    </div>
                                </div>

                                {/* Shipping */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ width: '32px', height: '32px', background: '#fff', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0' }}>
                                        <MapPin size={16} color="#f43f5e" />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Entrega</div>
                                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>
                                            {order.cidade}/{order.estado}
                                        </div>
                                    </div>
                                </div>

                                {/* Phone */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ width: '32px', height: '32px', background: '#fff', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0' }}>
                                        <Phone size={16} color="#10b981" />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Contato</div>
                                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>{order.phone}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <a
                                    href={`https://wa.me/${(order.phone || '').replace(/\D/g, '')}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{
                                        padding: '8px 16px',
                                        background: '#fff',
                                        borderRadius: '12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        color: '#10b981',
                                        border: '1px solid #d1f7de',
                                        textDecoration: 'none',
                                        fontSize: '13px',
                                        fontWeight: 700,
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <ExternalLink size={14} /> WhatsApp
                                </a>

                                <DeleteOrderButton orderId={order.id} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

async function DeleteOrderButton({ orderId }: { orderId: string }) {
    return (
        <form action={deleteOrder.bind(null, orderId)}>
            <button style={{
                width: '38px',
                height: '38px',
                background: '#fff',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#e11d48',
                border: '1px solid #ffe4e6',
                cursor: 'pointer',
                transition: 'all 0.2s'
            }}>
                <Trash2 size={16} />
            </button>
        </form>
    )
}
