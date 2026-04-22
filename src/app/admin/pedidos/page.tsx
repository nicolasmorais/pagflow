export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma'
import { MapPin, Phone, CreditCard, CheckCircle2, XCircle, Clock, ExternalLink, RefreshCw, Trash2 } from 'lucide-react'
import Link from 'next/link'
import PaymentStatusSelect from './components/PaymentStatusSelect'
import DeleteOrderButton from './components/DeleteOrderButton'
import OrderStatusSelect from './components/OrderStatusSelect'
import AnalyticsFilterForm from '../AnalyticsFilterForm'
import { MercadoPagoConfig, Payment } from 'mercadopago'
import { getDateFilters } from '@/lib/date-utils'

const headerStyle: React.CSSProperties = {
    padding: '14px 20px',
    fontSize: '10px',
    fontWeight: 900,
    color: 'var(--admin-text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.1em'
}

const cellStyle: React.CSSProperties = {
    padding: '18px 20px',
}

const labelStyle: React.CSSProperties = {
    fontSize: '10px',
    fontWeight: 800,
    color: '#94a3b8',
    textTransform: 'uppercase',
    marginBottom: '6px'
}

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
    searchParams: Promise<{ from?: string; to?: string; filter?: string; status?: string }>
}) {
    const params = await searchParams
    const filter = params.filter || '7dias'
    const status = params.status || 'todos'
    const { fromDate, toDate, fromDateUTC, toDateUTC } = getDateFilters(
        filter, params.from, params.to
    )

    let orders: any[] = [];

    try {
        const statusFilter = status === 'pago'
            ? 'pago'
            : status === 'aguardando'
                ? { in: ['aguardando', 'processando'] }
                : status === 'recusado'
                    ? 'recusado'
                    : { in: ['pago', 'aguardando', 'processando', 'recusado', 'reembolsado'] }; // Equivalent to ignoring 'abandonado'. Directly explicitly listing the valid statuses the user wants.

        orders = await prisma.order.findMany({
            where: {
                deletedAt: null,
                createdAt: {
                    gte: fromDateUTC,
                    lte: toDateUTC,
                },
                paymentStatus: statusFilter
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
            <div className="page-header">
                <div className="page-title-section">
                    <h1 style={{
                        fontSize: 'clamp(1.5rem, 4vw, 2rem)',
                        fontWeight: 900,
                        color: 'var(--admin-text-primary)',
                        margin: 0,
                        letterSpacing: '-0.03em',
                    }}>
                        Gestão de Pedidos
                    </h1>
                    <p style={{
                        color: 'var(--admin-text-secondary)',
                        fontSize: '14px',
                        margin: '8px 0 0 0',
                        fontWeight: 500
                    }}>
                        Acompanhe, gerencie e organize todos os seus pedidos em tempo real.
                    </p>
                </div>

                <div className="header-controls-container">
                    <div className="search-trash-row">
                        <div style={{ position: 'relative' }}>
                            <input
                                type="text"
                                placeholder="Pesquisar pedidos..."
                                className="search-input-field"
                                style={{
                                    padding: '10px 16px',
                                    paddingLeft: '40px',
                                    borderRadius: '12px',
                                    border: '1px solid var(--admin-border)',
                                    fontSize: '13px',
                                    width: '100%',
                                    height: '44px',
                                    background: 'white',
                                    outline: 'none',
                                    transition: 'all 0.2s',
                                    fontWeight: 500,
                                    color: 'var(--admin-text-primary)'
                                }}
                            />
                            <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--admin-text-muted)' }}>
                                <RefreshCw size={16} />
                            </div>
                        </div>
                        <Link
                            href="/admin/pedidos/lixeira"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                height: '44px',
                                background: '#f1f5f9',
                                color: '#64748b',
                                borderRadius: '12px',
                                textDecoration: 'none',
                                border: '1px solid var(--admin-border)',
                                transition: 'all 0.2s'
                            }}
                        >
                            <Trash2 size={16} />
                        </Link>
                    </div>
                    <AnalyticsFilterForm
                        currentFilter={filter}
                        currentStatus={status}
                        fromDate={fromDate}
                        toDate={toDate}
                        showStatus={true}
                    />
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
                        <div className="desktop-orders-table stark-card" style={{ padding: 0, overflow: 'hidden' }}>
                            <table style={{
                                width: '100%',
                                borderCollapse: 'collapse',
                            }}>
                                <thead>
                                    <tr style={{ background: '#F9FAFB', borderBottom: '1px solid var(--admin-border)' }}>
                                        <th style={headerStyle}>CLIENTE</th>
                                        <th style={headerStyle}>PRODUTO</th>
                                        <th style={headerStyle}>VALOR TOTAL</th>
                                        <th style={headerStyle}>ORIGEM</th>
                                        <th style={headerStyle}>PAGAMENTO</th>
                                        <th style={headerStyle}>LOGÍSTICA</th>
                                        <th style={{ ...headerStyle, textAlign: 'right' }}>DATA</th>
                                        <th style={{ ...headerStyle, textAlign: 'right' }}>AÇÕES</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.map((order: any) => (
                                        <tr key={order.id} style={{ borderBottom: '1px solid var(--admin-border)', transition: 'background 0.2s' }}>
                                            <td style={cellStyle}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <div style={{
                                                        width: '36px', height: '36px', borderRadius: '50%',
                                                        background: '#F1F5F9', color: '#64748B',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        fontSize: '12px', fontWeight: 800
                                                    }}>
                                                        {order.fullName?.charAt(0).toUpperCase() || '?'}
                                                    </div>
                                                    <div>
                                                        <Link
                                                            href={`/admin/pedidos/${order.id}`}
                                                            style={{ fontSize: '14px', fontWeight: 700, color: 'var(--admin-text-primary)', textDecoration: 'none' }}
                                                            className="hover:underline"
                                                        >
                                                            {order.fullName || 'Sem nome'}
                                                        </Link>
                                                        <div style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>{order.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={cellStyle}>
                                                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--admin-text-primary)' }}>
                                                    {order.product?.name || 'Produto'}
                                                </div>
                                                <div style={{ fontSize: '11px', color: 'var(--admin-text-muted)' }}>
                                                    {order.paymentMethod === 'pix' ? 'Pix' : 'Cartão'}
                                                </div>
                                            </td>
                                            <td style={cellStyle}>
                                                <div style={{ fontSize: '16px', fontWeight: 900, color: 'black', fontFamily: 'var(--font-space-grotesk)' }}>
                                                    R$ {(order.totalPrice || 0).toFixed(2)}
                                                </div>
                                            </td>
                                            <td style={cellStyle}>
                                                <div
                                                    style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, display: 'flex', flexDirection: 'column', gap: '2px' }}
                                                    title={`Medium: ${order.utmMedium || '-'}\nContent: ${order.utmContent || '-'}\nTerm: ${order.utmTerm || '-'}\nPlacement: ${order.utmPlacement || '-'}\nID: ${order.utmId || '-'}\nCreative: ${order.utmCreativeName || '-'}`}
                                                >
                                                    <span style={{ color: '#7c3aed', fontWeight: 800 }}>{order.utmSource || 'Direto'}</span>
                                                    <span style={{ fontSize: '10px', opacity: 0.8 }}>{order.utmCampaign || '-'}</span>
                                                </div>
                                            </td>
                                            <td style={cellStyle}>
                                                <PaymentStatusSelect orderId={order.id} initialStatus={order.paymentStatus || 'processando'} />
                                            </td>
                                            <td style={cellStyle}>
                                                <OrderStatusSelect orderId={order.id} initialStatus={order.status || 'pendente'} />
                                            </td>
                                            <td style={{ ...cellStyle, textAlign: 'right' }}>
                                                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--admin-text-primary)' }}>
                                                    {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                                                </div>
                                                <div style={{ fontSize: '11px', color: 'var(--admin-text-muted)' }}>
                                                    {new Date(order.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </td>
                                            <td style={{ ...cellStyle, textAlign: 'right' }}>
                                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                    <a
                                                        href={`https://wa.me/${(order.phone || '').replace(/\D/g, '')}`}
                                                        target="_blank" rel="noreferrer"
                                                        style={{
                                                            width: '32px', height: '32px', borderRadius: '8px',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            background: '#F1F5F9', color: '#64748B', textDecoration: 'none'
                                                        }}
                                                        title="WhatsApp"
                                                    >
                                                        <Phone size={14} />
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
                                <div key={order.id} className="stark-card" style={{ padding: '20px', marginBottom: '16px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', alignItems: 'flex-start' }}>
                                        <div>
                                            <Link
                                                href={`/admin/pedidos/${order.id}`}
                                                style={{ fontWeight: 900, fontSize: '15px', color: 'var(--admin-text-primary)', textDecoration: 'none' }}
                                            >
                                                {order.fullName}
                                            </Link>
                                            <div style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>{order.email}</div>
                                        </div>
                                        <div style={{ fontSize: '16px', fontWeight: 900, color: 'black', fontFamily: 'var(--font-space-grotesk)' }}>
                                            R$ {order.totalPrice.toFixed(2)}
                                        </div>
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

                                    <div style={{ marginBottom: '16px' }}>
                                        <div style={labelStyle}>ORIGEM</div>
                                        <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
                                            <span style={{ color: '#7c3aed', fontWeight: 800 }}>{order.utmSource || 'Direto'}</span>
                                            {order.utmCampaign && <span style={{ marginLeft: '8px', opacity: 0.8 }}>({order.utmCampaign})</span>}
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', borderTop: '1px solid var(--admin-border)', paddingTop: '12px', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ fontSize: '11px', color: 'var(--admin-text-muted)', fontWeight: 600 }}>
                                            {new Date(order.createdAt).toLocaleDateString('pt-BR')} às {new Date(order.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <a
                                                href={`https://wa.me/${(order.phone || '').replace(/\D/g, '')}`}
                                                target="_blank" rel="noreferrer"
                                                style={{
                                                    width: '32px', height: '32px', borderRadius: '8px',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    background: '#F1F5F9', color: '#64748B'
                                                }}
                                            >
                                                <Phone size={14} />
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


