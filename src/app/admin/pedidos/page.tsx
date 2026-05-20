export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma'
import { Trash2, Phone, Package, ExternalLink } from 'lucide-react'
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

const statusConfig: Record<string, { label: string; bg: string; color: string }> = {
    pago: { label: 'Pago', bg: '#dcfce7', color: '#16a34a' },
    aguardando: { label: 'Aguardando', bg: '#fef3c7', color: '#d97706' },
    processando: { label: 'Processando', bg: '#fef3c7', color: '#d97706' },
    recusado: { label: 'Recusado', bg: '#fee2e2', color: '#dc2626' },
    reembolsado: { label: 'Reembolsado', bg: '#e0e7ff', color: '#6366f1' },
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

    const totalValue = orders.reduce((sum, o) => sum + (o.totalPrice || 0), 0)
    const paidCount = orders.filter(o => o.paymentStatus === 'pago').length

    return (
        <div style={{ width: '100%', paddingBottom: '60px' }}>
            {/* Header */}
            <header style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                        <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.03em' }}>Pedidos</h1>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px', flexWrap: 'wrap' }}>
                            <span style={{
                                fontSize: '12px', fontWeight: 700, color: '#6366f1',
                                background: '#eef2ff', padding: '4px 10px', borderRadius: '8px',
                            }}>
                                {orders.length} pedidos
                            </span>
                            <span style={{
                                fontSize: '12px', fontWeight: 700, color: '#16a34a',
                                background: '#f0fdf4', padding: '4px 10px', borderRadius: '8px',
                            }}>
                                {paidCount} pagos
                            </span>
                            <span style={{
                                fontSize: '12px', fontWeight: 700, color: '#0f172a',
                                background: '#f8fafc', padding: '4px 10px', borderRadius: '8px',
                                border: '1px solid #e2e8f0',
                            }}>
                                R$ {fmt(totalValue)}
                            </span>
                        </div>
                    </div>
                    <Link
                        href="/admin/pedidos/lixeira"
                        style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            padding: '9px 16px', background: '#fff', color: '#64748b',
                            borderRadius: '12px', textDecoration: 'none', border: '1px solid #e2e8f0',
                            fontSize: '13px', fontWeight: 600, transition: 'all 0.15s',
                        }}
                    >
                        <Trash2 size={14} />
                        Lixeira
                    </Link>
                </div>

                {/* Filters */}
                <AnalyticsFilterForm
                    currentFilter={filter}
                    currentStatus={status}
                    fromDate={fromDate}
                    toDate={toDate}
                    showStatus={true}
                />
            </header>

            {/* Orders */}
            {orders.length === 0 ? (
                <div style={{
                    background: '#fff', border: '1px solid #f1f5f9', borderRadius: '20px',
                    padding: '60px 40px', textAlign: 'center',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                }}>
                    <div style={{
                        width: '64px', height: '64px', background: '#f8fafc', borderRadius: '18px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
                    }}>
                        <Package size={28} color="#cbd5e1" />
                    </div>
                    <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>Nenhum pedido encontrado</h3>
                    <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>Ajuste os filtros ou aguarde novas vendas.</p>
                </div>
            ) : (
                <>
                    {/* Desktop Table */}
                    <div className="desktop-orders-table" style={{
                        background: '#fff', border: '1px solid #f1f5f9',
                        borderRadius: '20px', overflow: 'hidden',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.02), 0 4px 12px rgba(0,0,0,0.03)',
                    }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    {['Cliente', 'Produto', 'Valor', 'Pagamento', 'Status', 'Data', ''].map((h, i) => (
                                        <th key={i} style={{
                                            padding: '14px 20px', fontSize: '11px', fontWeight: 700, color: '#94a3b8',
                                            textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: i === 6 ? 'right' : 'left',
                                            background: '#fafbfc',
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
                        {orders.map((order: any) => {
                            const pStatus = statusConfig[order.paymentStatus] || statusConfig.aguardando
                            const date = new Date(order.createdAt)
                            return (
                                <Link
                                    key={order.id}
                                    href={`/admin/pedidos/${order.id}`}
                                    style={{
                                        display: 'block',
                                        background: '#fff',
                                        border: '1px solid #f1f5f9',
                                        borderRadius: '16px',
                                        padding: '16px',
                                        marginBottom: '10px',
                                        textDecoration: 'none',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                                        transition: 'all 0.15s',
                                    }}
                                >
                                    {/* Top: Name + Value */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                                            <div style={{
                                                width: '36px', height: '36px', borderRadius: '10px',
                                                background: '#f1f5f9', color: '#475569',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: '13px', fontWeight: 800, flexShrink: 0,
                                            }}>
                                                {order.fullName?.charAt(0).toUpperCase() || '?'}
                                            </div>
                                            <div style={{ minWidth: 0 }}>
                                                <p style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {order.fullName}
                                                </p>
                                                <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#94a3b8', fontWeight: 500 }}>
                                                    {order.product?.name || 'Produto'}
                                                </p>
                                            </div>
                                        </div>
                                        <span style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', flexShrink: 0, marginLeft: '12px' }}>
                                            R$ {fmt(order.totalPrice || 0)}
                                        </span>
                                    </div>

                                    {/* Bottom: Status + Date + Actions */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{
                                                fontSize: '11px', fontWeight: 700,
                                                background: pStatus.bg, color: pStatus.color,
                                                padding: '4px 10px', borderRadius: '8px',
                                            }}>
                                                {pStatus.label}
                                            </span>
                                            <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 500 }}>
                                                {date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '6px' }} onClick={e => e.preventDefault()}>
                                            <a
                                                href={`https://wa.me/${(order.phone || '').replace(/\D/g, '')}`}
                                                target="_blank" rel="noreferrer"
                                                style={{
                                                    width: '30px', height: '30px', borderRadius: '8px',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    background: '#f0fdf4', color: '#16a34a', textDecoration: 'none',
                                                }}
                                            >
                                                <Phone size={13} />
                                            </a>
                                            <DeleteOrderButton orderId={order.id} />
                                        </div>
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                </>
            )}
        </div>
    )
}
