export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma'
import { Trash2, Phone, Package, ExternalLink, Search, Filter, Calendar } from 'lucide-react'
import Link from 'next/link'
import PaymentStatusSelect from './components/PaymentStatusSelect'
import OrderStatusSelect from './components/OrderStatusSelect'
import DeleteOrderButton from './components/DeleteOrderButton'
import OrderRow from './components/OrderRow'
import R2VerifyAllButton from './components/R2VerifyAllButton'

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
                        <p style={{ color: '#64748b', fontSize: '13px', marginTop: '4px', fontWeight: 500 }}>
                            Gerencie suas vendas e acompanhe o status dos pedidos.
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <Link
                            href="/admin/pedidos/lixeira"
                            style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                padding: '9px 16px', background: '#fff', color: '#64748b',
                                borderRadius: '12px', textDecoration: 'none', border: '1px solid #e2e8f0',
                                fontSize: '13px', fontWeight: 600, transition: 'all 0.15s',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                            }}
                        >
                            <Trash2 size={14} />
                            Lixeira
                        </Link>
                        <R2VerifyAllButton orders={orders} />
                    </div>
                </div>

                {/* Summary Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '20px' }}>
                    <SummaryCard label="Total" value={`${orders.length}`} sub="pedidos" color="#6366f1" bg="#eef2ff" />
                    <SummaryCard label="Pagos" value={`${paidCount}`} sub="pedidos" color="#16a34a" bg="#f0fdf4" />
                    <SummaryCard label="Faturamento" value={`R$ ${fmt(totalValue)}`} sub="no período" color="#0f172a" bg="#f8fafc" border />
                </div>

                {/* Filters */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                    {/* Status pills - left */}
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <StatusPill label="Todos" active={status === 'todos'} />
                        <StatusPill label="Pago" active={status === 'pago'} color="#16a34a" bg="#dcfce7" />
                        <StatusPill label="Aguardando" active={status === 'aguardando'} color="#d97706" bg="#fef3c7" />
                        <StatusPill label="Recusado" active={status === 'recusado'} color="#dc2626" bg="#fee2e2" />
                    </div>

                    {/* Date filter - right */}
                    <AnalyticsFilterForm
                        currentFilter={filter}
                        fromDate={fromDate}
                        toDate={toDate}
                        showStatus={false}
                    />
                </div>
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
                                <tr>
                                    {['Cliente', 'Produto', 'Valor', 'Pagamento', 'Status', 'Data', 'Ações'].map((h, i) => (
                                        <th key={i} style={{
                                            padding: '14px 20px', fontSize: '11px', fontWeight: 700, color: '#94a3b8',
                                            textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: i === 6 ? 'right' : 'left',
                                            background: '#fafbfc', borderBottom: '1px solid #f1f5f9',
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
                                        border: '1px solid #f1f5f9',
                                        borderRadius: '16px',
                                        overflow: 'hidden',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                                    }}
                                >
                                    {/* Card Header */}
                                    <div style={{
                                        padding: '16px',
                                        display: 'flex', alignItems: 'center', gap: '12px',
                                        borderBottom: '1px solid #f1f5f9',
                                    }}>
                                        <div style={{
                                            width: '40px', height: '40px', borderRadius: '12px',
                                            background: '#f1f5f9', color: '#475569',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '15px', fontWeight: 800, flexShrink: 0,
                                        }}>
                                            {order.fullName?.charAt(0).toUpperCase() || '?'}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <p style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {order.fullName}
                                            </p>
                                            <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#94a3b8', fontWeight: 500 }}>
                                                {order.product?.name || 'Produto'} · {order.paymentMethod === 'pix' ? 'PIX' : 'Cartão'}
                                            </p>
                                        </div>
                                        <span style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', fontFamily: "'Space Grotesk', sans-serif", flexShrink: 0 }}>
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
                                            <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 500 }}>
                                                {date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '6px' }}>
                                            <a
                                                href={`https://wa.me/${(order.phone || '').replace(/\D/g, '')}`}
                                                target="_blank" rel="noreferrer"
                                                style={{
                                                    width: '32px', height: '32px', borderRadius: '10px',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    background: '#f0fdf4', color: '#16a34a', textDecoration: 'none',
                                                    border: '1px solid #dcfce7',
                                                }}
                                            >
                                                <Phone size={14} />
                                            </a>
                                            <Link
                                                href={`/admin/pedidos/${order.id}`}
                                                style={{
                                                    width: '32px', height: '32px', borderRadius: '10px',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    background: '#f1f5f9', color: '#64748b', textDecoration: 'none',
                                                    border: '1px solid #e2e8f0',
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
function SummaryCard({ label, value, sub, color, bg, border }: {
    label: string; value: string; sub: string; color: string; bg: string; border?: boolean
}) {
    return (
        <div style={{
            background: '#fff',
            border: '1px solid #f1f5f9',
            borderRadius: '14px',
            padding: '14px 16px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
        }}>
            <p style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {label}
            </p>
            <p style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.03em', fontFamily: "'Space Grotesk', sans-serif" }}>
                {value}
            </p>
            <p style={{ fontSize: '11px', color: '#94a3b8', margin: '2px 0 0', fontWeight: 500 }}>
                {sub}
            </p>
        </div>
    )
}

/* ── Status Pill ── */
function StatusPill({ label, active, color, bg }: {
    label: string; active: boolean; color?: string; bg?: string
}) {
    const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')
    const isActive = active

    return (
        <a
            href={`?filter=${params.get('filter') || '7dias'}${label === 'Todos' ? '' : `&status=${label.toLowerCase()}`}`}
            style={{
                padding: '7px 14px',
                borderRadius: '10px',
                border: isActive ? 'none' : '1px solid #e2e8f0',
                background: isActive ? (bg || '#0f172a') : '#fff',
                color: isActive ? (color || '#fff') : '#64748b',
                fontSize: '12px',
                fontWeight: 700,
                textDecoration: 'none',
                transition: 'all 0.15s',
                boxShadow: isActive ? '0 2px 8px rgba(0,0,0,0.08)' : '0 1px 3px rgba(0,0,0,0.02)',
            }}
        >
            {label}
        </a>
    )
}

