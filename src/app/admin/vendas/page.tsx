export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma'
import {
    ExternalLink,
    ShoppingBag,
    TrendingUp,
    DollarSign,
    ShoppingCart,
    Package,
    CheckCircle2,
    ArrowUpRight,
    Wallet,
} from 'lucide-react'
import Link from 'next/link'
import OrderStatusSelect from '../pedidos/components/OrderStatusSelect'
import { MercadoPagoConfig, Payment } from 'mercadopago'

// ─── Helpers ────────────────────────────────────────────────────────────────

const AVATAR_PALETTES = [
    { gradient: 'linear-gradient(135deg, #3b82f6, #6366f1)' },
    { gradient: 'linear-gradient(135deg, #10b981, #059669)' },
    { gradient: 'linear-gradient(135deg, #a855f7, #6366f1)' },
    { gradient: 'linear-gradient(135deg, #f97316, #ea580c)' },
    { gradient: 'linear-gradient(135deg, #0ea5e9, #2563eb)' },
    { gradient: 'linear-gradient(135deg, #ec4899, #db2777)' },
];
const getAvatarGradient = (name: string) =>
    AVATAR_PALETTES[name.charCodeAt(0) % AVATAR_PALETTES.length].gradient;

const STATUS_CONFIG: Record<string, { bg: string; color: string; dot: string; border: string; label: string }> = {
    pago: { bg: '#dcfce7', color: '#15803d', dot: '#16a34a', border: '#bbf7d0', label: 'Pago' },
    recusado: { bg: '#fee2e2', color: '#b91c1c', dot: '#dc2626', border: '#fecaca', label: 'Recusado' },
    reembolsado: { bg: '#eff6ff', color: '#1d4ed8', dot: '#2563eb', border: '#bfdbfe', label: 'Reembolsado' },
    aguardando: { bg: '#fef3c7', color: '#92400e', dot: '#d97706', border: '#fde68a', label: 'Aguardando' },
    processando: { bg: '#fef3c7', color: '#92400e', dot: '#d97706', border: '#fde68a', label: 'Aguardando' },
};
const getStatus = (s: string) => STATUS_CONFIG[s] ?? STATUS_CONFIG.processando;

const formatBRL = (v: number) =>
    v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const gridLayout = 'minmax(210px, 1.3fr) minmax(130px, 0.8fr) minmax(120px, 0.8fr) minmax(150px, 1fr) minmax(140px, 0.9fr) 110px';

// ─── Page ───────────────────────────────────────────────────────────────────

export default async function VendasPage() {
    const orders = await prisma.order.findMany({
        where: {
            deletedAt: null,
            NOT: { paymentStatus: { in: ['abandonado', 'processando'] } }
        },
        orderBy: { createdAt: 'desc' },
        include: { product: true }
    });

    // Auto-sync pending payments with Mercado Pago
    const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN || '' });
    const payment = new Payment(client);

    const statusMap: Record<string, string> = {
        'approved': 'pago', 'pending': 'aguardando', 'authorized': 'aguardando',
        'in_process': 'aguardando', 'rejected': 'recusado', 'cancelled': 'recusado',
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

    // Stats
    const paidOrders = orders.filter(o => o.paymentStatus === 'pago');
    const totalRevenue = paidOrders.reduce((acc, o) => acc + (o.totalPrice || 0), 0);
    const totalNetReceived = paidOrders.reduce((acc, o) => acc + ((o as any).netReceived || 0), 0);
    const totalOrdersCount = orders.length;
    const paidOrdersCount = paidOrders.length;
    const conversionRate = totalOrdersCount > 0 ? ((paidOrdersCount / totalOrdersCount) * 100).toFixed(1) : '0.0';

    return (
        <div style={{ width: '100%', paddingBottom: '32px' }}>

            {/* ── Header ── */}
            <header style={{ marginBottom: '28px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                        <div style={{
                            width: '40px', height: '40px', borderRadius: '12px',
                            background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 4px 14px rgba(99,102,241,0.3)', flexShrink: 0
                        }}>
                            <ShoppingCart size={18} color="white" />
                        </div>
                        <h1 style={{ fontSize: '22px', fontWeight: 900, color: 'var(--admin-text-primary)', margin: 0, letterSpacing: '-0.03em' }}>
                            Todas as Vendas
                        </h1>
                    </div>
                    <p style={{ color: 'var(--admin-text-secondary)', fontSize: '13px', margin: 0, paddingLeft: '52px', fontWeight: 500 }}>
                        Acompanhe o desempenho e gerencie os pedidos da sua loja.
                    </p>
                </div>
                <div style={{
                    background: '#f1f5f9', borderRadius: '10px',
                    padding: '6px 14px', fontSize: '12px', fontWeight: 700,
                    color: 'var(--admin-text-secondary)', border: '1px solid var(--admin-border)',
                    alignSelf: 'flex-start', whiteSpace: 'nowrap'
                }}>
                    {totalOrdersCount} {totalOrdersCount === 1 ? 'pedido' : 'pedidos'}
                </div>
            </header>

            {/* ── Stats Grid ── */}
            <div className="vendas-stats-grid">
                <StatCard
                    icon={DollarSign}
                    label="Receita Total"
                    value={`R$ ${formatBRL(totalRevenue)}`}
                    gradient="linear-gradient(135deg, #10b981, #059669)"
                    shadow="rgba(16,185,129,0.25)"
                    sub={totalNetReceived > 0 ? `Líquido: R$ ${formatBRL(totalNetReceived)}` : undefined}
                />
                <StatCard
                    icon={ShoppingBag}
                    label="Total de Pedidos"
                    value={String(totalOrdersCount)}
                    gradient="linear-gradient(135deg, #3b82f6, #2563eb)"
                    shadow="rgba(59,130,246,0.25)"
                />
                <StatCard
                    icon={CheckCircle2}
                    label="Pedidos Pagos"
                    value={String(paidOrdersCount)}
                    gradient="linear-gradient(135deg, #6366f1, #4f46e5)"
                    shadow="rgba(99,102,241,0.25)"
                />
                <StatCard
                    icon={TrendingUp}
                    label="Taxa de Conversão"
                    value={`${conversionRate}%`}
                    gradient="linear-gradient(135deg, #f59e0b, #d97706)"
                    shadow="rgba(245,158,11,0.25)"
                />
            </div>

            {/* ── Orders List ── */}
            {orders.length === 0 ? (
                <EmptyState />
            ) : (
                <>
                    {/* ── MOBILE CARDS ── */}
                    <div className="orders-mobile">
                        {orders.map((order: any) => {
                            const sc = getStatus(order.paymentStatus);
                            return (
                                <Link key={order.id} href={`/admin/pedidos/${order.id}`} style={{ textDecoration: 'none', display: 'block', marginBottom: '10px' }}>
                                    <div className="vendas-mobile-card" style={{ borderLeftColor: sc.dot }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            {/* Avatar */}
                                            <div style={{
                                                width: '42px', height: '42px', minWidth: '42px',
                                                borderRadius: '12px',
                                                background: getAvatarGradient(order.fullName || 'C'),
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: '15px', fontWeight: 800, color: '#fff',
                                                boxShadow: '0 2px 8px rgba(0,0,0,0.12)'
                                            }}>
                                                {(order.fullName || 'C').charAt(0).toUpperCase()}
                                            </div>
                                            {/* Info */}
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                                                    <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                        {(order.fullName || '').split(' ').slice(0, 2).join(' ')}
                                                    </p>
                                                    <p style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#059669', whiteSpace: 'nowrap' }}>
                                                        R$ {formatBRL(order.totalPrice || 0)}
                                                    </p>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '5px', gap: '8px' }}>
                                                    <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>
                                                        {new Date(order.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                                        {order.product && <span style={{ marginLeft: '6px', opacity: 0.8 }}>· {order.product.name}</span>}
                                                    </p>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <span style={{
                                                            fontSize: '10px', fontWeight: 800, textTransform: 'uppercase',
                                                            padding: '2px 9px', borderRadius: '7px',
                                                            background: sc.bg, color: sc.color, border: `1.5px solid ${sc.border}`,
                                                            display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap'
                                                        }}>
                                                            <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: sc.dot, display: 'inline-block', flexShrink: 0 }} />
                                                            {sc.label}
                                                        </span>
                                                        <span style={{
                                                            fontSize: '9px', fontWeight: 800, textTransform: 'uppercase',
                                                            padding: '2px 8px', borderRadius: '6px',
                                                            background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0',
                                                            display: 'flex', alignItems: 'center', gap: '3px', whiteSpace: 'nowrap'
                                                        }}>
                                                            {order.status || 'Pendente'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>

                    {/* ── DESKTOP TABLE ── */}
                    <div className="orders-desktop" style={{ overflowX: 'auto', paddingBottom: '20px' }}>
                        <div style={{ minWidth: '900px' }}>

                            {/* Column Headers */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: gridLayout,
                                padding: '0 20px 10px 72px',
                                color: 'var(--admin-text-muted)',
                                fontSize: '10px',
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                letterSpacing: '0.07em',
                            }}>
                                <div>Cliente</div>
                                <div>Produto</div>
                                <div>Valor</div>
                                <div>Pagamento</div>
                                <div>Status Pedido</div>
                                <div style={{ textAlign: 'right' }}>Ações</div>
                            </div>

                            {/* Rows */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {orders.map((order: any) => {
                                    const sc = getStatus(order.paymentStatus);
                                    const isPaid = order.paymentStatus === 'pago';
                                    return (
                                        <div key={order.id} className="vendas-row" style={{ borderLeftColor: sc.dot }}>
                                            <div style={{
                                                display: 'grid',
                                                gridTemplateColumns: gridLayout,
                                                alignItems: 'center',
                                                gap: '16px',
                                                padding: '14px 20px',
                                            }}>
                                                {/* Col 1: Customer */}
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                                    <div style={{
                                                        width: '42px', height: '42px',
                                                        borderRadius: '12px',
                                                        background: getAvatarGradient(order.fullName || 'C'),
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        fontSize: '14px', fontWeight: 800, color: '#fff',
                                                        flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.12)'
                                                    }}>
                                                        {(order.fullName || 'C').charAt(0).toUpperCase()}
                                                    </div>
                                                    <div style={{ overflow: 'hidden' }}>
                                                        <p style={{ margin: 0, fontSize: '13px', fontWeight: 800, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                            {order.fullName || 'Cliente'}
                                                        </p>
                                                        <p style={{ margin: '1px 0 0', fontSize: '11px', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                            {order.email}
                                                        </p>
                                                        <p style={{ margin: '3px 0 0', fontSize: '10px', color: '#94a3b8', fontWeight: 700 }}>
                                                            {new Date(order.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Col 2: Product */}
                                                <div>
                                                    {order.product ? (
                                                        <span style={{
                                                            fontSize: '11px', fontWeight: 700, color: '#3b82f6',
                                                            background: '#eff6ff', padding: '4px 10px', borderRadius: '8px',
                                                            border: '1px solid #dbeafe', display: 'inline-flex', alignItems: 'center', gap: '5px',
                                                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%'
                                                        }}>
                                                            <Package size={11} />
                                                            {order.product.name}
                                                        </span>
                                                    ) : (
                                                        <span style={{ color: '#94a3b8', fontSize: '11px', fontStyle: 'italic' }}>Produto removido</span>
                                                    )}
                                                </div>

                                                {/* Col 3: Value */}
                                                <div>
                                                    <p style={{ margin: 0, fontSize: '15px', fontWeight: 900, color: '#059669', letterSpacing: '-0.02em' }}>
                                                        <span style={{ fontSize: '10px', opacity: 0.7, marginRight: '1px', fontWeight: 700 }}>R$</span>
                                                        {formatBRL(order.totalPrice || 0)}
                                                    </p>
                                                    {isPaid && (order as any).netReceived > 0 && (
                                                        <p style={{ margin: '3px 0 0', fontSize: '10px', color: '#10b981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px' }}>
                                                            <Wallet size={9} />
                                                            Líq. R$ {formatBRL((order as any).netReceived)}
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Col 4: Payment */}
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                    {/* Method badge */}
                                                    {order.paymentMethod === 'pix' ? (
                                                        <span style={{
                                                            fontSize: '10px', fontWeight: 800, color: '#059669',
                                                            background: '#ecfdf5', padding: '3px 9px', borderRadius: '7px',
                                                            border: '1px solid #a7f3d0', width: 'fit-content',
                                                            display: 'flex', alignItems: 'center', gap: '4px'
                                                        }}>
                                                            ❖ PIX
                                                        </span>
                                                    ) : (
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                            <span style={{
                                                                fontSize: '10px', fontWeight: 800, color: '#3b82f6',
                                                                background: '#eff6ff', padding: '3px 9px', borderRadius: '7px',
                                                                border: '1px solid #bfdbfe', width: 'fit-content',
                                                                display: 'flex', alignItems: 'center', gap: '4px'
                                                            }}>
                                                                💳 {order.cardBrand ? order.cardBrand.toUpperCase() : 'CARTÃO'}
                                                            </span>
                                                            {order.installments && (
                                                                <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 700, marginLeft: '2px' }}>
                                                                    {order.installments}x R$ {formatBRL(order.installmentAmount || 0)}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                    {/* Status badge */}
                                                    <span style={{
                                                        display: 'inline-flex', alignItems: 'center', gap: '5px',
                                                        padding: '3px 9px', borderRadius: '7px', width: 'fit-content',
                                                        fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em',
                                                        background: sc.bg, color: sc.color, border: `1.5px solid ${sc.border}`
                                                    }}>
                                                        <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: sc.dot, display: 'inline-block', flexShrink: 0 }} />
                                                        {sc.label}
                                                    </span>
                                                </div>

                                                {/* Col 5: Order Status */}
                                                <div>
                                                    <OrderStatusSelect
                                                        orderId={order.id}
                                                        initialStatus={order.status || 'pendente'}
                                                    />
                                                </div>

                                                {/* Col 6: Actions */}
                                                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                                    <Link href={`/admin/pedidos/${order.id}`} className="vendas-detail-btn">
                                                        Detalhes <ExternalLink size={12} />
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </>
            )
            }
        </div >
    );
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, gradient, shadow, sub }: {
    icon: any; label: string; value: string;
    gradient: string; shadow: string; sub?: string;
}) {
    return (
        <div className="vendas-stat-card">
            <div style={{
                width: '44px', height: '44px', borderRadius: '13px',
                background: gradient, display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, boxShadow: `0 6px 16px ${shadow}`
            }}>
                <Icon size={20} color="white" strokeWidth={2.2} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: '0 0 2px', fontSize: '11px', color: 'var(--admin-text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {label}
                </p>
                <p style={{ margin: 0, fontSize: '20px', fontWeight: 900, color: 'var(--admin-text-primary)', letterSpacing: '-0.03em', lineHeight: 1 }}>
                    {value}
                </p>
                {sub && (
                    <p style={{ margin: '4px 0 0', fontSize: '10px', color: '#10b981', fontWeight: 700 }}>
                        {sub}
                    </p>
                )}
            </div>
        </div>
    );
}

function EmptyState() {
    return (
        <div style={{
            background: 'var(--admin-card)', border: '1px solid var(--admin-border)',
            borderRadius: '24px', padding: '64px 24px', textAlign: 'center',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}>
            <div style={{
                width: '72px', height: '72px', borderRadius: '22px',
                background: 'linear-gradient(135deg, #eff6ff, #e0e7ff)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px', boxShadow: '0 4px 14px rgba(99,102,241,0.12)'
            }}>
                <ShoppingCart size={32} color="#6366f1" />
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#1e293b', marginBottom: '8px' }}>
                Nenhuma venda ainda
            </h3>
            <p style={{ color: '#64748b', fontSize: '13px', maxWidth: '320px', margin: '0 auto', lineHeight: 1.6 }}>
                Assim que as primeiras vendas começarem a cair, elas aparecerão listadas aqui com todos os detalhes.
            </p>
        </div>
    );
}
