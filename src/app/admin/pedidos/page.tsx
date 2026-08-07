export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma'
import { Trash2, Phone, Package, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import PaymentStatusSelect from './components/PaymentStatusSelect'
import OrderStatusSelect from './components/OrderStatusSelect'
import DeleteOrderButton from './components/DeleteOrderButton'
import OrderRow from './components/OrderRow'
import R2VerifyAllButton from './components/R2VerifyAllButton'

const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
import OrdersFilterBar from './components/OrdersFilterBar'
import { Payment } from 'mercadopago'
import { createMpClient } from '@/lib/mercadopago'
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
        const client = createMpClient();
        const paymentClient = new Payment(client);
        for (const order of pendingOrders) {
            try {
                let mpResult: any = null;
                for (let attempt = 1; attempt <= 3; attempt++) {
                    try {
                        mpResult = await paymentClient.get({ id: order.mpPaymentId });
                        break;
                    } catch (mpErr: any) {
                        const isRetryable = mpErr?.message?.includes('Premature close') ||
                            mpErr?.message?.includes('socket hang up') ||
                            mpErr?.message?.includes('ECONNRESET');
                        if (isRetryable && attempt < 3) {
                            await new Promise(r => setTimeout(r, attempt * 1000));
                            continue;
                        }
                        throw mpErr;
                    }
                }
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
    pago: { label: 'Pago', bg: '#E3F4EA', color: '#1E7A52' },
    aguardando: { label: 'Aguardando', bg: '#FEF3C7', color: '#92400E' },
    processando: { label: 'Processando', bg: '#FEF3C7', color: '#92400E' },
    recusado: { label: 'Recusado', bg: '#FBEAE8', color: '#B23B32' },
    reembolsado: { label: 'Reembolsado', bg: '#E7F1F8', color: '#2C5C86' },
}

export default async function OrdersPage({
    searchParams,
}: {
    searchParams: Promise<{ from?: string; to?: string; filter?: string; status?: string; method?: string; orderStatus?: string; q?: string }>
}) {
    const params = await searchParams
    const filter = params.filter || '7dias'
    const status = params.status || 'todos'
    const method = params.method || 'todos'
    const orderStatus = params.orderStatus || 'todos'
    const search = params.q || ''
    const { fromDate, toDate, fromDateUTC, toDateUTC } = getDateFilters(filter, params.from, params.to)

    let orders: any[] = [];
    try {
        const statusFilter = status === 'pago' ? 'pago'
            : status === 'aguardando' ? { in: ['aguardando', 'processando'] }
            : status === 'recusado' ? 'recusado'
            : { in: ['pago', 'aguardando', 'processando', 'recusado', 'reembolsado'] };

        const methodFilter = method === 'pix' ? 'pix' : method === 'credito' ? 'credito' : undefined;
        const orderStatusFilter = orderStatus !== 'todos' ? orderStatus : undefined;

        const where: any = {
            deletedAt: null,
            createdAt: { gte: fromDateUTC, lte: toDateUTC },
            paymentStatus: statusFilter,
        };
        if (methodFilter) where.paymentMethod = methodFilter;
        if (orderStatusFilter) where.status = orderStatusFilter;
        if (search) {
            where.OR = [
                { fullName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search } },
            ];
        }

        orders = await prisma.order.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: { product: true }
        });
    } catch (e) {
        return (
            <div style={{ padding: '60px', textAlign: 'center' }}>
                <h2 style={{ color: '#B23B32', fontWeight: 700, fontFamily: "'Fraunces', serif" }}>Erro ao carregar pedidos</h2>
                <p style={{ color: '#6E7180' }}>Tente recarregar a página.</p>
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
                        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#14151F', margin: 0, fontFamily: "'Fraunces', serif", letterSpacing: '-0.01em' }}>Pedidos</h1>
                        <p style={{ color: '#6E7180', fontSize: '13px', marginTop: '4px', fontWeight: 500 }}>
                            Gerencie suas vendas e acompanhe o status dos pedidos.
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <Link
                            href="/admin/pedidos/lixeira"
                            style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                padding: '9px 16px', background: '#fff', color: '#6E7180',
                                borderRadius: '9px', textDecoration: 'none', border: '1px solid #E5E7EF',
                                fontSize: '13px', fontWeight: 600, transition: 'all 0.15s',
                            }}
                        >
                            <Trash2 size={14} />
                            Lixeira
                        </Link>
                        <R2VerifyAllButton orders={orders} />
                    </div>
                </div>

                {/* Summary Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '14px', marginBottom: '20px' }}>
                    <SummaryCard label="Total" value={`${orders.length}`} sub="pedidos" />
                    <SummaryCard label="Pagos" value={`${paidCount}`} sub="pedidos" />
                    <SummaryCard label="Faturamento" value={`R$ ${fmt(totalValue)}`} sub="no período" />
                </div>

                {/* Filters */}
                <OrdersFilterBar
                    currentFilter={filter}
                    currentPaymentStatus={status}
                    currentPaymentMethod={method}
                    currentOrderStatus={orderStatus}
                    currentSearch={search}
                    fromDate={fromDate}
                    toDate={toDate}
                />
            </header>

            {/* Orders */}
            {orders.length === 0 ? (
                <div style={{
                    background: '#fff', border: '1px solid #E5E7EF', borderRadius: '14px',
                    padding: '60px 40px', textAlign: 'center',
                }}>
                    <div style={{
                        width: '56px', height: '56px', background: '#F5F6F9', borderRadius: '14px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
                        border: '1px solid #E5E7EF',
                    }}>
                        <Package size={24} color="#6E7180" />
                    </div>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#14151F', margin: '0 0 8px', fontFamily: "'Fraunces', serif" }}>Nenhum pedido encontrado</h3>
                    <p style={{ color: '#6E7180', fontSize: '13px', margin: 0 }}>Ajuste os filtros ou aguarde novas vendas.</p>
                </div>
            ) : (
                <>
                    {/* Desktop Table */}
                    <div className="desktop-orders-table" style={{
                        background: '#fff', border: '1px solid #E5E7EF',
                        borderRadius: '14px', overflow: 'visible',
                    }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>
                                    {['Cliente', 'Produto', 'Valor', 'Pagamento', 'Status', 'Data', 'Ações'].map((h, i) => (
                                        <th key={i} style={{
                                            padding: '14px 20px', fontSize: '10.5px', fontWeight: 700, color: '#6E7180',
                                            textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: i === 6 ? 'right' : 'left',
                                            background: '#F5F6F9', borderBottom: '1px solid #E5E7EF',
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
                                <div
                                    key={order.id}
                                    style={{
                                        background: '#fff',
                                        border: '1px solid #E5E7EF',
                                        borderRadius: '14px',
                                        overflow: 'hidden',
                                    }}
                                >
                                    {/* Card Header */}
                                    <div style={{
                                        padding: '16px',
                                        display: 'flex', alignItems: 'center', gap: '12px',
                                        borderBottom: '1px solid #E5E7EF',
                                    }}>
                                        <div style={{
                                            width: '40px', height: '40px', borderRadius: '10px',
                                            background: '#F8F0DB', color: '#A9832C',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '15px', fontWeight: 700, flexShrink: 0,
                                            fontFamily: "'Fraunces', serif",
                                        }}>
                                            {order.fullName?.charAt(0).toUpperCase() || '?'}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <p style={{ fontSize: '14px', fontWeight: 700, color: '#14151F', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {order.fullName}
                                            </p>
                                            <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#6E7180', fontWeight: 500 }}>
                                                {order.product?.name || 'Produto'} · {order.paymentMethod === 'pix' ? 'PIX' : 'Cartão'}
                                            </p>
                                        </div>
                                        <span style={{ fontSize: '16px', fontWeight: 700, color: '#14151F', fontFamily: "'Fraunces', serif", flexShrink: 0 }}>
                                            R$ {fmt(order.totalPrice || 0)}
                                        </span>
                                    </div>

                                    {/* Card Body */}
                                    <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{
                                                fontSize: '11px', fontWeight: 700,
                                                background: pStatus.bg, color: pStatus.color,
                                                padding: '4px 10px', borderRadius: '8px',
                                            }}>
                                                {pStatus.label}
                                            </span>
                                            <span style={{ fontSize: '11px', color: '#6E7180', fontWeight: 500 }}>
                                                {date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '6px' }}>
                                            <a
                                                href={`https://wa.me/${(order.phone || '').replace(/\D/g, '')}`}
                                                target="_blank" rel="noreferrer"
                                                style={{
                                                    width: '32px', height: '32px', borderRadius: '9px',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    background: '#E3F4EA', color: '#1E7A52', textDecoration: 'none',
                                                    border: '1px solid #C3E8D4',
                                                }}
                                            >
                                                <Phone size={14} />
                                            </a>
                                            <Link
                                                href={`/admin/pedidos/${order.id}`}
                                                style={{
                                                    width: '32px', height: '32px', borderRadius: '9px',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    background: '#F5F6F9', color: '#6E7180', textDecoration: 'none',
                                                    border: '1px solid #E5E7EF',
                                                }}
                                            >
                                                <ExternalLink size={14} />
                                            </Link>
                                            <DeleteOrderButton orderId={order.id} />
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </>
            )}
        </div>
    )
}

/* ── Summary Card ── */
function SummaryCard({ label, value, sub }: {
    label: string; value: string; sub: string
}) {
    return (
        <div style={{
            background: '#fff',
            border: '1px solid #E5E7EF',
            borderRadius: '14px',
            padding: '16px 18px',
        }}>
            <p style={{ fontSize: '10.5px', fontWeight: 700, color: '#6E7180', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {label}
            </p>
            <p style={{ fontSize: '22px', fontWeight: 700, color: '#14151F', margin: 0, letterSpacing: '-0.03em', fontFamily: "'Fraunces', serif" }}>
                {value}
            </p>
            <p style={{ fontSize: '11px', color: '#6E7180', margin: '4px 0 0', fontWeight: 500 }}>
                {sub}
            </p>
        </div>
    )
}
