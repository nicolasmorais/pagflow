export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma'
import { Trash2, Phone, Package } from 'lucide-react'
import Link from 'next/link'
import PaymentStatusSelect from './components/PaymentStatusSelect'
import OrderStatusSelect from './components/OrderStatusSelect'
import DeleteOrderButton from './components/DeleteOrderButton'
import OrderRow from './components/OrderRow'

const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
import AnalyticsFilterForm from '../AnalyticsFilterForm'
import { MercadoPagoConfig, Payment } from 'mercadopago'
import { getDateFilters } from '@/lib/date-utils'

async function syncMercadoPagoOrders(orders: any[]) {
    if (!process.env.MP_ACCESS_TOKEN) return orders;
    const pendingOrders = orders.filter(
        o => o.mpPaymentId && (o.paymentStatus === 'processando' || o.paymentStatus === 'aguardando')
    );
    if (pendingOrders.length === 0) return orders;
    const statusMap: Record<string, string> = {
        'approved': 'pago', 'pending': 'aguardando', 'authorized': 'aguardando',
        'in_process': 'aguardando', 'rejected': 'recusado', 'cancelled': 'recusado', 'refunded': 'reembolsado'
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
                        data: { paymentStatus: newStatus, status: newStatus === 'pago' ? 'processando' : order.status }
                    });
                    const localOrder = orders.find(o => o.id === order.id);
                    if (localOrder) {
                        localOrder.paymentStatus = newStatus;
                        if (newStatus === 'pago') localOrder.status = 'processando';
                    }
                }
            } catch (e) { }
        }
    } catch (e) { }
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
    const { fromDate, toDate, fromDateUTC, toDateUTC } = getDateFilters(filter, params.from, params.to)

    let orders: any[] = [];
    try {
        const statusFilter = status === 'pago' ? 'pago'
            : status === 'aguardando' ? { in: ['aguardando', 'processando'] }
            : status === 'recusado' ? 'recusado'
            : { in: ['pago', 'aguardando', 'processando', 'recusado', 'reembolsado'] };

        orders = await prisma.order.findMany({
            where: { deletedAt: null, createdAt: { gte: fromDateUTC, lte: toDateUTC }, paymentStatus: statusFilter },
            orderBy: { createdAt: 'desc' },
            include: { product: true }
        });
    } catch (e) {
        return (
            <div style={{ padding: '60px', textAlign: 'center' }}>
                <h2 style={{ color: '#ef4444', fontWeight: 800 }}>Erro ao carregar pedidos</h2>
                <p style={{ color: '#64748b' }}>Tente recarregar a página.</p>
            </div>
        )
    }

    orders = await syncMercadoPagoOrders(orders);

    return (
        <div style={{ width: '100%', paddingBottom: '60px' }}>
            {/* Header */}
            <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                        <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>Pedidos</h1>
                        <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#94a3b8', fontWeight: 500 }}>{orders.length} pedidos no período</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Link
                            href="/admin/pedidos/lixeira"
                            style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                padding: '8px 14px', background: '#f8fafc', color: '#64748b',
                                borderRadius: '10px', textDecoration: 'none', border: '1px solid #f1f5f9',
                                fontSize: '12px', fontWeight: 600,
                            }}
                        >
                            <Trash2 size={14} />
                            Lixeira
                        </Link>
                    </div>
                </div>

                {/* Filters */}
                <AnalyticsFilterForm
                    currentFilter={filter}
                    currentStatus={status}
                    fromDate={fromDate}
                    toDate={toDate}
                    showStatus={true}
                />
            </div>

            {/* Orders Table */}
            {orders.length === 0 ? (
                <div style={{
                    background: '#fff', border: '1px solid #f1f5f9', borderRadius: '18px',
                    padding: '60px 40px', textAlign: 'center',
                }}>
                    <div style={{
                        width: '64px', height: '64px', background: '#f8fafc', borderRadius: '16px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
                    }}>
                        <Package size={28} color="#cbd5e1" />
                    </div>
                    <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1e293b', margin: '0 0 8px' }}>Nenhum pedido encontrado</h3>
                    <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>Ajuste os filtros ou aguarde novas vendas.</p>
                </div>
            ) : (
                <>
                    {/* Desktop Table */}
                    <div className="desktop-orders-table" style={{ background: '#fff', border: '1px solid #f1f5f9', borderRadius: '16px', overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    {['CLIENTE', 'PRODUTO', 'VALOR', 'PAGAMENTO', 'STATUS', 'DATA', ''].map((h, i) => (
                                        <th key={i} style={{
                                            padding: '12px 16px', fontSize: '10px', fontWeight: 800, color: '#94a3b8',
                                            textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: i === 6 ? 'right' : 'left',
                                        }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map((order: any) => <OrderRow key={order.id} order={order} />)}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Cards */}
                    <div className="mobile-orders-grid">
                        {orders.map((order: any) => (
                            <div key={order.id} style={{
                                background: '#fff', border: '1px solid #f1f5f9', borderRadius: '14px', padding: '16px', marginBottom: '10px',
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                    <div style={{ minWidth: 0, flex: 1 }}>
                                        <Link href={`/admin/pedidos/${order.id}`} style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', textDecoration: 'none' }}>
                                            {order.fullName}
                                        </Link>
                                        <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#94a3b8' }}>{order.product?.name || 'Produto'}</p>
                                    </div>
                                    <span style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', flexShrink: 0 }}>R$ {fmt(order.totalPrice || 0)}</span>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                                    <div>
                                        <p style={{ fontSize: '9px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 4px' }}>Pagamento</p>
                                        <PaymentStatusSelect orderId={order.id} initialStatus={order.paymentStatus || 'processando'} />
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '9px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 4px' }}>Status</p>
                                        <OrderStatusSelect orderId={order.id} initialStatus={order.status || 'pendente'} />
                                    </div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
                                    <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>
                                        {new Date(order.createdAt).toLocaleDateString('pt-BR')} {new Date(order.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    <div style={{ display: 'flex', gap: '6px' }}>
                                        <a href={`https://wa.me/${(order.phone || '').replace(/\D/g, '')}`} target="_blank" rel="noreferrer"
                                            style={{ width: '28px', height: '28px', borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0fdf4', color: '#16a34a' }}>
                                            <Phone size={12} />
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
    )
}
