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
        <div style={{ width: '100%', paddingBottom: '60px' }}>

            {/* Header / Toolbar - Full Width */}
            <div style={{
                marginBottom: '32px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '24px',
                padding: '0 8px'
            }}>
                <div>
                    <h1 style={{
                        fontSize: 'clamp(1.8rem, 4vw, 2.4rem)',
                        fontWeight: 800,
                        color: 'var(--admin-text-primary)',
                        margin: 0,
                        letterSpacing: '-0.04em',
                        fontFamily: "'Space Grotesk', sans-serif"
                    }}>
                        Pedidos de Venda
                    </h1>
                    <p style={{ margin: '8px 0 0', fontSize: '15px', color: 'var(--admin-text-secondary)', fontWeight: 500 }}>
                        Acompanhe o fluxo de vendas e logísticas em tempo real.
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <AnalyticsFilterForm
                        currentFilter={params.filter || 'today'}
                        fromDate={fromDate}
                        toDate={toDate}
                    />
                    <div style={{ position: 'relative' }}>
                        <input
                            type="text"
                            placeholder="Buscar por cliente ou ID..."
                            className="search-input-field"
                            style={{
                                padding: '12px 16px',
                                paddingLeft: '44px',
                                borderRadius: '14px',
                                border: '1px solid #e2e8f0',
                                fontSize: '14px',
                                width: '300px',
                                background: '#fff',
                                outline: 'none',
                                transition: 'all 0.2s',
                                fontFamily: "'Space Grotesk', sans-serif",
                                boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                            }}
                        />
                        <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                            <RefreshCw size={18} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="orders-container">
                {orders.length === 0 ? (
                    <div className="analytics-card" style={{ textAlign: 'center', padding: '6rem 2rem', borderRadius: '24px' }}>
                        <div style={{
                            width: '80px', height: '80px', background: '#f8fafc', borderRadius: '24px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px'
                        }}>
                            <Clock size={40} color="#cbd5e1" />
                        </div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--admin-text-primary)', marginBottom: '12px' }}>Aguardando primeira venda</h2>
                        <p style={{ color: 'var(--admin-text-secondary)', fontSize: '1rem', maxWidth: '400px', margin: '0 auto' }}>Fique tranquilo, assim que um cliente finalizar a compra, os dados aparecerão aqui instantaneamente.</p>
                    </div>
                ) : (
                    <>
                        {/* Desktop Table View */}
                        <div className="desktop-orders-table">
                            <table style={{
                                width: '100%',
                                borderCollapse: 'separate',
                                borderSpacing: '0 12px',
                                marginTop: '-12px'
                            }}>
                                <thead>
                                    <tr style={{ textAlign: 'left' }}>
                                        <th style={headerStyle}>CLIENTE</th>
                                        <th style={headerStyle}>DATA / HORA</th>
                                        <th style={headerStyle}>PRODUTO</th>
                                        <th style={headerStyle}>VALOR TOTAL</th>
                                        <th style={headerStyle}>PAGAMENTO</th>
                                        <th style={headerStyle}>LOGÍSTICA</th>
                                        <th style={{ ...headerStyle, textAlign: 'right' }}>AÇÕES</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.map((order: any) => (
                                        <tr key={order.id} className="order-row-matte">
                                            <td style={cellStyle}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                                    <div style={{
                                                        width: '42px', height: '42px', borderRadius: '12px',
                                                        background: order.paymentStatus === 'pago' ? '#ecfdf5' : '#fef2f2',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                    }}>
                                                        {order.paymentStatus === 'pago' ? <CheckCircle2 size={20} color="#10b981" /> : <XCircle size={20} color="#ef4444" />}
                                                    </div>
                                                    <div>
                                                        <Link href={`/admin/pedidos/${order.id}`} className="order-customer-link">
                                                            {order.fullName || 'Sem nome'}
                                                            <ExternalLink size={12} style={{ marginLeft: '6px' }} />
                                                        </Link>
                                                        <div style={{ fontSize: '12px', color: '#64748b' }}>{order.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={cellStyle}>
                                                <div style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>
                                                    {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                                                </div>
                                                <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                                                    {new Date(order.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </td>
                                            <td style={cellStyle}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>
                                                        {order.product?.name || 'Produto'}
                                                    </span>
                                                    {order.hasBump && <span className="bump-badge">BUMP</span>}
                                                </div>
                                                <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>
                                                    {order.paymentMethod === 'pix' ? '💠 PIX' : '💳 CARTÃO'}
                                                </div>
                                            </td>
                                            <td style={cellStyle}>
                                                <div style={{ fontSize: '15px', fontWeight: 800, color: '#10b981', fontFamily: '"Space Grotesk", sans-serif' }}>
                                                    R$ {(order.totalPrice || 0).toFixed(2)}
                                                </div>
                                            </td>
                                            <td style={cellStyle}>
                                                <PaymentStatusSelect orderId={order.id} initialStatus={order.paymentStatus || 'processando'} />
                                            </td>
                                            <td style={cellStyle}>
                                                <OrderStatusSelect orderId={order.id} initialStatus={order.status || 'pendente'} />
                                            </td>
                                            <td style={{ ...cellStyle, textAlign: 'right' }}>
                                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                    <a
                                                        href={`https://wa.me/${(order.phone || '').replace(/\D/g, '')}`}
                                                        target="_blank" rel="noreferrer"
                                                        className="action-btn-matte whatsapp"
                                                        title="Chamar no WhatsApp"
                                                    >
                                                        <Phone size={16} />
                                                    </a>
                                                    <DeleteOrderButton orderId={order.id} />
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Card View */}
                        <div className="mobile-orders-grid">
                            {orders.map((order: any) => (
                                <div key={order.id} className="mobile-order-card">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                            <div className="status-dot" style={{ background: order.paymentStatus === 'pago' ? '#10b981' : '#ef4444' }} />
                                            <span style={{ fontWeight: 800, fontSize: '15px' }}>{order.fullName}</span>
                                        </div>
                                        <span style={{ fontSize: '14px', fontWeight: 800, color: '#10b981' }}>R$ {order.totalPrice.toFixed(2)}</span>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                                        <div>
                                            <div style={labelStyle}>PAGAMENTO</div>
                                            <PaymentStatusSelect orderId={order.id} initialStatus={order.paymentStatus || 'processando'} />
                                        </div>
                                        <div>
                                            <div style={labelStyle}>LOGÍSTICA</div>
                                            <OrderStatusSelect orderId={order.id} initialStatus={order.status || 'pendente'} />
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', borderTop: '1px solid #f1f5f9', paddingTop: '12px', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                                            {new Date(order.createdAt).toLocaleDateString('pt-BR')}  às {new Date(order.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <a href={`https://wa.me/${(order.phone || '').replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="mobile-action-btn whatsapp">
                                                <Phone size={16} />
                                            </a>
                                            <DeleteOrderButton orderId={order.id} />
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

const headerStyle: React.CSSProperties = {
    padding: '12px 20px',
    fontSize: '11px',
    fontWeight: 800,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.08em'
}

const cellStyle: React.CSSProperties = {
    padding: '16px 20px',
    borderBottom: '1px solid #f8fafc',
    borderTop: '1px solid #f8fafc'
}

const labelStyle: React.CSSProperties = {
    fontSize: '10px',
    fontWeight: 800,
    color: '#94a3b8',
    textTransform: 'uppercase',
    marginBottom: '6px'
}

async function DeleteOrderButton({ orderId }: { orderId: string }) {
    return (
        <form action={deleteOrder.bind(null, orderId)}>
            <button className="del-btn-matte" style={{
                width: '36px',
                height: '36px',
                background: '#fff',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ef4444',
                border: '1px solid #fee2e2',
                cursor: 'pointer',
                transition: 'all 0.2s'
            }}>
                <Trash2 size={16} />
            </button>
        </form>
    )
}
