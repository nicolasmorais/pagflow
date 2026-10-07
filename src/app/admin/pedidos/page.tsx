export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma'
import { Trash2, Phone, Package, ExternalLink, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import Link from 'next/link'
import DeleteOrderButton from './components/DeleteOrderButton'
import OrderRow from './components/OrderRow'
import R2VerifyAllButton from './components/R2VerifyAllButton'
import R2BackupAllButton from './components/R2BackupAllButton'

const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
import OrdersFilterBar from './components/OrdersFilterBar'
import { Payment } from 'mercadopago'
import { createMpClient } from '@/lib/mercadopago'
import { getDateFilters, startOfDayBR, endOfDayBR, formatDateStr, getBrazilNow } from '@/lib/date-utils'

async function syncMercadoPagoOrders(orders: any[]) {
    if (!process.env.MP_ACCESS_TOKEN) return orders;
    const pendingOrders = orders.filter(
        o => o.mpPaymentId && o.paymentMethod !== 'pix_automatico' && (o.paymentStatus === 'processando' || o.paymentStatus === 'aguardando')
    );
    if (pendingOrders.length === 0) return orders;
    const statusMap: Record<string, string> = {
        'approved': 'pago', 'pending': 'aguardando', 'authorized': 'aguardando',
        'in_process': 'aguardando', 'rejected': 'recusado', 'cancelled': 'recusado', 'refunded': 'reembolsado'
    };
    try {
        const client = createMpClient();
        const paymentClient = new Payment(client);
        await Promise.all(pendingOrders.map(async (order) => {
            try {
                let mpResult: any = null;
                for (let attempt = 1; attempt <= 2; attempt++) {
                    try {
                        mpResult = await paymentClient.get({ id: order.mpPaymentId });
                        break;
                    } catch (mpErr: any) {
                        const isRetryable = mpErr?.message?.includes('Premature close') ||
                            mpErr?.message?.includes('socket hang up') ||
                            mpErr?.message?.includes('ECONNRESET');
                        if (isRetryable && attempt < 2) {
                            await new Promise(r => setTimeout(r, 500));
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
        }));
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

    const statusFilter = status === 'pago' ? 'pago'
        : status === 'aguardando' ? { in: ['aguardando', 'processando'] }
        : status === 'recusado' ? 'recusado'
        : { in: ['pago', 'aguardando', 'processando', 'recusado', 'reembolsado'] };

    let orders: any[] = [];
    try {
        const methodFilter = method === 'pix' ? 'pix' : method === 'credito' ? 'credito' : method === 'pix_automatico' ? 'pix_automatico' : undefined;
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
                <h2 style={{ color: '#B23B32', fontWeight: 700 }}>Erro ao carregar pedidos</h2>
                <p style={{ color: '#6E7180' }}>Tente recarregar a página.</p>
            </div>
        )
    }

    orders = await syncMercadoPagoOrders(orders);

    const paidCount = orders.filter(o => o.paymentStatus === 'pago').length

    // ── Vendas período atual ──
    const currentSalesCount = orders.length
    const currentSalesRevenue = orders.reduce((s, o) => s + (o.totalPrice || 0), 0)

    // ── Calcular período anterior equivalente ──
    const nowBR = getBrazilNow()
    let prevFromDate: string
    let prevToDate: string
    let comparisonLabel: string

    switch (filter) {
        case 'today': {
            const prev = new Date(nowBR)
            prev.setDate(prev.getDate() - 1)
            prevFromDate = formatDateStr(prev)
            prevToDate = prevFromDate
            comparisonLabel = 'vs ontem'
            break
        }
        case 'yesterday': {
            const prev = new Date(nowBR)
            prev.setDate(prev.getDate() - 2)
            prevFromDate = formatDateStr(prev)
            prevToDate = prevFromDate
            comparisonLabel = 'vs anteontem'
            break
        }
        case '7dias': {
            const from = new Date(nowBR)
            from.setDate(from.getDate() - 14)
            const to = new Date(nowBR)
            to.setDate(to.getDate() - 8)
            prevFromDate = formatDateStr(from)
            prevToDate = formatDateStr(to)
            comparisonLabel = 'vs os 7 dias anteriores'
            break
        }
        case '30dias': {
            const from = new Date(nowBR)
            from.setDate(from.getDate() - 60)
            const to = new Date(nowBR)
            to.setDate(to.getDate() - 31)
            prevFromDate = formatDateStr(from)
            prevToDate = formatDateStr(to)
            comparisonLabel = 'vs os 30 dias anteriores'
            break
        }
        case 'mes': {
            const firstDayThisMonth = new Date(nowBR.getFullYear(), nowBR.getMonth(), 1)
            const lastDayLastMonth = new Date(nowBR.getFullYear(), nowBR.getMonth(), 0)
            const firstDayLastMonth = new Date(nowBR.getFullYear(), nowBR.getMonth() - 1, 1)
            // Comparar com os mesmos dias do mês passado (ex: dia 1-7 atual vs dia 1-7 passado)
            const currentDay = nowBR.getDate()
            const lastMonthSameDayEnd = new Date(nowBR.getFullYear(), nowBR.getMonth() - 1, currentDay)
            prevFromDate = formatDateStr(firstDayLastMonth)
            prevToDate = formatDateStr(lastMonthSameDayEnd > lastDayLastMonth ? lastDayLastMonth : lastMonthSameDayEnd)
            comparisonLabel = 'vs mesmo período mês passado'
            break
        }
        case 'mes-anterior': {
            const firstDayMonthBefore = new Date(nowBR.getFullYear(), nowBR.getMonth() - 2, 1)
            const lastDayMonthBefore = new Date(nowBR.getFullYear(), nowBR.getMonth() - 1, 0)
            prevFromDate = formatDateStr(firstDayMonthBefore)
            prevToDate = formatDateStr(lastDayMonthBefore)
            comparisonLabel = 'vs mês retrasado'
            break
        }
        case 'vida': {
            // Sem comparação para "Tudo"
            prevFromDate = fromDate
            prevToDate = fromDate
            comparisonLabel = 'desde o início'
            break
        }
        default: {
            // Custom: comparar com mesma duração antes do período
            const fromD = startOfDayBR(fromDate)
            const toD = endOfDayBR(toDate)
            const duration = toD.getTime() - fromD.getTime()
            const prevTo = new Date(fromD.getTime() - 1)
            const prevFrom = new Date(prevTo.getTime() - duration)
            prevFromDate = formatDateStr(prevFrom)
            prevToDate = formatDateStr(prevTo)
            comparisonLabel = 'vs período anterior'
            break
        }
    }

    // Buscar pedidos do período anterior
    let previousOrders: any[] = []
    if (filter !== 'vida') {
        try {
            previousOrders = await prisma.order.findMany({
                where: {
                    deletedAt: null,
                    createdAt: { gte: startOfDayBR(prevFromDate), lte: endOfDayBR(prevToDate) },
                    paymentStatus: statusFilter,
                },
            })
        } catch (e) { }
    }
    const previousSalesCount = previousOrders.length

    // ── Métricas ──
    // "Faturamento" conta só pedidos pagos, como na dashboard. Antes somava
    // também recusados e aguardando, e não batia com a dashboard.
    const paidRevenue = orders.filter(o => o.paymentStatus === 'pago').reduce((s, o) => s + (o.totalPrice || 0), 0)
    const pendingCount = orders.filter(o => ['aguardando', 'processando'].includes(o.paymentStatus)).length
    const rejectedCount = orders.filter(o => o.paymentStatus === 'recusado').length
    const previousPaid = previousOrders.filter(o => o.paymentStatus === 'pago')
    const previousPaidCount = previousPaid.length
    const previousPaidRevenue = previousPaid.reduce((s, o) => s + (o.totalPrice || 0), 0)
    const hasComparison = filter !== 'vida'
    const conversionRate = currentSalesCount > 0 ? (paidCount / currentSalesCount) * 100 : 0

    // ── Agrupamento por dia (horário de Brasília) ──
    const dayKey = (d: Date) => d.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
    const todayKey = dayKey(new Date())
    const yesterdayKey = dayKey(new Date(Date.now() - 86_400_000))
    const dayGroups: { key: string; label: string; orders: any[]; paidRevenue: number }[] = []
    for (const o of orders) {
        const key = dayKey(new Date(o.createdAt))
        let group = dayGroups[dayGroups.length - 1]
        if (!group || group.key !== key) {
            const long = new Date(o.createdAt).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'America/Sao_Paulo' })
            const label = key === todayKey ? `Hoje, ${long.split(', ')[1] || long}`
                : key === yesterdayKey ? `Ontem, ${long.split(', ')[1] || long}`
                : long.charAt(0).toUpperCase() + long.slice(1)
            group = { key, label, orders: [], paidRevenue: 0 }
            dayGroups.push(group)
        }
        group.orders.push(o)
        if (o.paymentStatus === 'pago') group.paidRevenue += o.totalPrice || 0
    }

    const methodLabel = (m: string) => m === 'pix' ? 'PIX' : m === 'pix_automatico' ? 'PIX Parcelado' : 'Cartão'
    const timeBR = (d: Date) => d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })

    return (
        <div className="orders-page">
            {/* Cabeçalho */}
            <header className="orders-head">
                <div>
                    <h1>Pedidos</h1>
                    <p>
                        {currentSalesCount === 1 ? '1 pedido' : `${currentSalesCount.toLocaleString('pt-BR')} pedidos`} no período
                        {search && <> para “{search}”</>}
                    </p>
                </div>
                <div className="orders-head-actions">
                    <Link href="/admin/pedidos/lixeira" className="orders-btn-ghost">
                        <Trash2 size={14} aria-hidden />
                        Lixeira
                    </Link>
                    <R2VerifyAllButton orders={orders} />
                    <R2BackupAllButton />
                </div>
            </header>

            {/* Resumo */}
            <section className="dash-card orders-summary">
                <div className="dash-stats orders-stats">
                    <SummaryStat
                        label="Faturamento pago"
                        value={`R$ ${fmt(paidRevenue)}`}
                        change={hasComparison ? growth(paidRevenue, previousPaidRevenue) : null}
                        hint={currentSalesCount > 0 ? `de R$ ${fmt(currentSalesRevenue)} em pedidos` : undefined}
                        large
                    />
                    <SummaryStat
                        label="Pedidos"
                        value={currentSalesCount.toLocaleString('pt-BR')}
                        change={hasComparison ? growth(currentSalesCount, previousSalesCount) : null}
                    />
                    <SummaryStat
                        label="Pagos"
                        value={paidCount.toLocaleString('pt-BR')}
                        change={hasComparison ? growth(paidCount, previousPaidCount) : null}
                        hint={`${conversionRate.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}% de conversão`}
                    />
                    <SummaryStat label="Aguardando" value={pendingCount.toLocaleString('pt-BR')} tone={pendingCount > 0 ? 'warning' : undefined} />
                    <SummaryStat label="Recusados" value={rejectedCount.toLocaleString('pt-BR')} tone={rejectedCount > 0 ? 'negative' : undefined} />
                </div>
                {hasComparison && <p className="orders-summary-note">Variações {comparisonLabel}</p>}
            </section>

            {/* Filtros */}
            <OrdersFilterBar
                currentFilter={filter}
                currentPaymentStatus={status}
                currentPaymentMethod={method}
                currentOrderStatus={orderStatus}
                currentSearch={search}
                fromDate={fromDate}
                toDate={toDate}
            />

            {/* Lista */}
            {orders.length === 0 ? (
                <div className="dash-card orders-empty">
                    <div className="orders-empty-icon"><Package size={22} color="#6E7180" aria-hidden /></div>
                    <h3>Nenhum pedido encontrado</h3>
                    <p>Ajuste o período ou os filtros, ou aguarde novas vendas.</p>
                </div>
            ) : (
                <>
                    {/* Desktop */}
                    <div className="desktop-orders-table dash-card orders-table-card">
                        <table className="orders-table">
                            <thead>
                                <tr>
                                    <th style={{ width: '64px' }}>Hora</th>
                                    <th>Cliente</th>
                                    <th>Produto</th>
                                    <th className="num">Valor</th>
                                    <th>Pagamento</th>
                                    <th>Logística</th>
                                    <th className="num">Ações</th>
                                </tr>
                            </thead>
                            {dayGroups.map(g => (
                                <tbody key={g.key}>
                                    <tr className="orders-day-row">
                                        <td colSpan={7}>
                                            <span className="orders-day-label">{g.label}</span>
                                            <span className="orders-day-meta">
                                                {g.orders.length === 1 ? '1 pedido' : `${g.orders.length} pedidos`}
                                                {g.paidRevenue > 0 && <> · <strong>R$ {fmt(g.paidRevenue)}</strong> pagos</>}
                                            </span>
                                        </td>
                                    </tr>
                                    {g.orders.map((order: any) => <OrderRow key={order.id} order={order} />)}
                                </tbody>
                            ))}
                        </table>
                    </div>

                    {/* Mobile */}
                    <div className="mobile-orders-grid">
                        {dayGroups.map(g => (
                            <section key={g.key} className="orders-m-group">
                                <div className="orders-m-day">
                                    <span className="orders-day-label">{g.label}</span>
                                    <span className="orders-day-meta">
                                        {g.orders.length === 1 ? '1 pedido' : `${g.orders.length} pedidos`}
                                        {g.paidRevenue > 0 && <> · R$ {fmt(g.paidRevenue)}</>}
                                    </span>
                                </div>
                                {g.orders.map((order: any) => {
                                    const pStatus = statusConfig[order.paymentStatus] || statusConfig.aguardando
                                    return (
                                        <div key={order.id} className="orders-m-card">
                                            <Link href={`/admin/pedidos/${order.id}`} className="orders-m-main">
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <p className="orders-m-name">{order.fullName || 'Sem nome'}</p>
                                                    <p className="orders-m-sub">{order.product?.name || 'Produto'} · {methodLabel(order.paymentMethod)}</p>
                                                </div>
                                                <span className="orders-m-value">R$ {fmt(order.totalPrice || 0)}</span>
                                            </Link>
                                            <div className="orders-m-foot">
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span className="dash-badge" style={{ background: pStatus.bg, color: pStatus.color }}>{pStatus.label}</span>
                                                    <span className="orders-m-time">{timeBR(new Date(order.createdAt))}</span>
                                                </div>
                                                <div style={{ display: 'flex', gap: '6px' }}>
                                                    <a
                                                        href={`https://wa.me/${(order.phone || '').replace(/\D/g, '')}`}
                                                        target="_blank" rel="noreferrer"
                                                        className="orders-icon-btn is-whatsapp"
                                                        aria-label={`WhatsApp de ${order.fullName || 'cliente'}`}
                                                    >
                                                        <Phone size={15} aria-hidden />
                                                    </a>
                                                    <Link href={`/admin/pedidos/${order.id}`} className="orders-icon-btn" aria-label="Ver detalhes do pedido">
                                                        <ExternalLink size={15} aria-hidden />
                                                    </Link>
                                                    <DeleteOrderButton orderId={order.id} />
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </section>
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}

function growth(current: number, previous: number): { value: string; positive: boolean } | null {
    if (previous === 0 && current === 0) return null
    if (previous === 0) return { value: 'novo', positive: true }
    const p = ((current - previous) / previous) * 100
    return { value: `${Math.abs(p).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}%`, positive: p >= 0 }
}

/* ── Número do resumo ── */
function SummaryStat({ label, value, change, hint, tone, large }: {
    label: string; value: string; hint?: string; large?: boolean
    change?: { value: string; positive: boolean } | null
    tone?: 'warning' | 'negative'
}) {
    const Arrow = change?.positive ? ArrowUpRight : ArrowDownRight
    return (
        <div className="dash-stat">
            <p className="dash-stat-label">{label}</p>
            <p
                className="dash-stat-value"
                style={{
                    fontSize: large ? '28px' : undefined,
                    color: tone === 'warning' ? '#92400E' : tone === 'negative' ? '#B23B32' : '#14151F',
                }}
            >
                {value}
            </p>
            {(change || hint) && (
                <div className="dash-stat-foot">
                    {change && (
                        <span
                            className="dash-delta"
                            style={{
                                color: change.positive ? '#1E7A52' : '#B23B32',
                                background: change.positive ? '#E3F4EA' : '#FBEAE8',
                                fontSize: '11px',
                            }}
                        >
                            <Arrow size={12} aria-hidden />
                            {change.value}
                        </span>
                    )}
                    {hint && <span>{hint}</span>}
                </div>
            )}
        </div>
    )
}
