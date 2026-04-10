export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import { BarChart3 } from 'lucide-react'
import AnalyticsCharts from './AnalyticsCharts'
import type { AnalyticsData, CheckoutAccessData } from './types'

export default async function AdminPage({
    searchParams,
}: {
    searchParams: Promise<{ from?: string; to?: string; filter?: string }>
}) {
    const params = await searchParams
    const p = prisma as any

    const today = new Date()
    today.setHours(23, 59, 59, 999)
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    yesterday.setHours(0, 0, 0, 0)
    const yesterdayEnd = new Date(yesterday)
    yesterdayEnd.setHours(23, 59, 59, 999)
    const last7Days = new Date(today)
    last7Days.setDate(last7Days.getDate() - 7)
    const last30Days = new Date(today)
    last30Days.setDate(last30Days.getDate() - 30)
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    const firstDayLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    const lastDayLastMonth = new Date(today.getFullYear(), today.getMonth(), 0)

    let fromDate: string
    let toDate: string

    switch (params.filter) {
        case 'today':
            fromDate = today.toISOString().slice(0, 10)
            toDate = fromDate
            break
        case 'yesterday':
            fromDate = yesterday.toISOString().slice(0, 10)
            toDate = fromDate
            break
        case '7dias':
            fromDate = last7Days.toISOString().slice(0, 10)
            toDate = today.toISOString().slice(0, 10)
            break
        case '30dias':
            fromDate = last30Days.toISOString().slice(0, 10)
            toDate = today.toISOString().slice(0, 10)
            break
        case 'mes':
            fromDate = firstDayOfMonth.toISOString().slice(0, 10)
            toDate = today.toISOString().slice(0, 10)
            break
        case 'mes-anterior':
            fromDate = firstDayLastMonth.toISOString().slice(0, 10)
            toDate = lastDayLastMonth.toISOString().slice(0, 10)
            break
        case 'vida':
            fromDate = '2020-01-01'
            toDate = today.toISOString().slice(0, 10)
            break
        default:
            fromDate = params.from || last30Days.toISOString().slice(0, 10)
            toDate = params.to || today.toISOString().slice(0, 10)
    }

    // ── Fetch checkout accesses ─────────────────────────────────────────────
    let accesses: any[] = []
    try {
        const result = await p.$queryRaw`
            SELECT id, "productId", source, medium, campaign, term, content, "createdAt", "step1Completed", "step2Completed", "step3Completed", "paymentCompleted" 
            FROM "CheckoutAccess" 
            WHERE "createdAt" >= ${fromDate + 'T00:00:00'} AND "createdAt" <= ${toDate + 'T23:59:59'}
            ORDER BY "createdAt" DESC LIMIT 500
        `;
        accesses = result as any[];
    } catch (e) {
        console.error('CheckoutAccess query error:', e)
    }

    // ── Calculate funnel stats ─────────────────────────────────────────────
    const totalAccesses = accesses.length;
    const step1Count = accesses.filter((a: any) => a.step1Completed).length;
    const step2Count = accesses.filter((a: any) => a.step2Completed).length;
    const step3Count = accesses.filter((a: any) => a.step3Completed).length;
    const paymentCount = accesses.filter((a: any) => a.paymentCompleted).length;

    // ── Fetch all orders ──────────────────────────────────────────────────
    const allOrders = await p.order.findMany({
        where: {
            createdAt: {
                gte: new Date(fromDate + 'T00:00:00'),
                lte: new Date(toDate + 'T23:59:59'),
            },
        },
        select: {
            id: true,
            paymentStatus: true,
            paymentMethod: true,
            totalPrice: true,
            netReceived: true,
            cardBrand: true,
            installments: true,
            hasBump: true,
            estado: true,
            createdAt: true,
            productId: true,
        }
    })

    const products = await prisma.product.findMany({ select: { id: true, name: true } })
    const productMap = new Map(products.map(p => [p.id, p.name]))

    // ── Segments ─────────────────────────────────────────────────────────
    const paidOrders = allOrders.filter(o => o.paymentStatus === 'pago')
    const abandonedOrders = allOrders.filter(o => o.paymentStatus === 'abandonado')
    const pendingOrders = allOrders.filter(o => o.paymentStatus === 'aguardando' || o.paymentStatus === 'processando')
    const rejectedOrders = allOrders.filter(o => o.paymentStatus === 'recusado')
    const nonAbandonedOrders = allOrders.filter(o => o.paymentStatus !== 'abandonado')

    // ── KPIs ─────────────────────────────────────────────────────────────
    const totalRevenue = paidOrders.reduce((s, o) => s + (o.totalPrice || 0), 0)
    const netRevenue = paidOrders.reduce((s, o) => s + (o.netReceived || 0), 0)
    const conversionRate = nonAbandonedOrders.length > 0
        ? (paidOrders.length / nonAbandonedOrders.length) * 100
        : 0
    const avgTicket = paidOrders.length > 0 ? totalRevenue / paidOrders.length : 0
    const bumpOrders = allOrders.filter(o => o.hasBump)
    const bumpRate = nonAbandonedOrders.length > 0
        ? (bumpOrders.length / nonAbandonedOrders.length) * 100
        : 0

    // ── Daily data (last 30 days) ─────────────────────────────────────────
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const dailyMap = new Map<string, { revenue: number; orders: number; paidOrders: number }>()
    for (let i = 29; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        const key = d.toISOString().slice(0, 10)
        dailyMap.set(key, { revenue: 0, orders: 0, paidOrders: 0 })
    }
    for (const order of allOrders) {
        if (order.createdAt < thirtyDaysAgo) continue
        const key = order.createdAt.toISOString().slice(0, 10)
        if (!dailyMap.has(key)) continue
        const ex = dailyMap.get(key)!
        dailyMap.set(key, {
            revenue: ex.revenue + (order.paymentStatus === 'pago' ? (order.totalPrice || 0) : 0),
            orders: ex.orders + 1,
            paidOrders: ex.paidOrders + (order.paymentStatus === 'pago' ? 1 : 0),
        })
    }
    const dailyData = Array.from(dailyMap.entries()).map(([date, data]) => ({
        date: new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        ...data,
    }))

    // ── Payment methods ───────────────────────────────────────────────────
    const pixCount = paidOrders.filter(o => o.paymentMethod === 'pix').length
    const cardCount = paidOrders.filter(o => o.paymentMethod !== 'pix').length
    const pixRevenue = paidOrders.filter(o => o.paymentMethod === 'pix').reduce((s, o) => s + (o.totalPrice || 0), 0)
    const cardRevenue = paidOrders.filter(o => o.paymentMethod !== 'pix').reduce((s, o) => s + (o.totalPrice || 0), 0)
    const total = pixCount + cardCount || 1
    const paymentMethods = [
        { method: 'pix', label: 'PIX', count: pixCount, revenue: pixRevenue, percentage: Math.round((pixCount / total) * 100) },
        { method: 'card', label: 'Cartão', count: cardCount, revenue: cardRevenue, percentage: Math.round((cardCount / total) * 100) },
    ]

    // ── Installments ──────────────────────────────────────────────────────
    const installmentMap = new Map<string, { count: number; revenue: number }>()
    for (const o of paidOrders) {
        const key = o.installments ? `${o.installments}x` : '1x'
        const ex = installmentMap.get(key) || { count: 0, revenue: 0 }
        installmentMap.set(key, { count: ex.count + 1, revenue: ex.revenue + (o.totalPrice || 0) })
    }
    const installments = Array.from(installmentMap.entries())
        .map(([label, data]) => ({ label, ...data }))
        .sort((a, b) => parseInt(a.label) - parseInt(b.label))

    // ── Card brands ───────────────────────────────────────────────────────
    const cardBrandMap = new Map<string, number>()
    for (const o of paidOrders.filter(o => o.paymentMethod !== 'pix')) {
        const brand = o.cardBrand?.toUpperCase() || 'OUTRO'
        cardBrandMap.set(brand, (cardBrandMap.get(brand) || 0) + 1)
    }
    const cardBrands = Array.from(cardBrandMap.entries())
        .map(([brand, count]) => ({ brand, count }))
        .sort((a, b) => b.count - a.count)

    // ── Top products ──────────────────────────────────────────────────────
    const productRevMap = new Map<string, { count: number; revenue: number; name: string }>()
    for (const o of paidOrders) {
        const key = o.productId || '__none'
        const name = o.productId ? (productMap.get(o.productId) || 'Produto removido') : 'Sem produto'
        const ex = productRevMap.get(key) || { count: 0, revenue: 0, name }
        productRevMap.set(key, { count: ex.count + 1, revenue: ex.revenue + (o.totalPrice || 0), name })
    }
    const topProducts = Array.from(productRevMap.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 6)

    // ── Top states ────────────────────────────────────────────────────────
    const stateMap = new Map<string, { count: number; revenue: number }>()
    for (const o of paidOrders) {
        if (!o.estado) continue
        const ex = stateMap.get(o.estado) || { count: 0, revenue: 0 }
        stateMap.set(o.estado, { count: ex.count + 1, revenue: ex.revenue + (o.totalPrice || 0) })
    }
    const topStates = Array.from(stateMap.entries())
        .map(([state, data]) => ({ state, ...data }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 8)

    // ── Status breakdown ──────────────────────────────────────────────────
    const totalAll = allOrders.length || 1
    const statusBreakdown = [
        { status: 'pago', label: 'Pago', count: paidOrders.length, percentage: Math.round((paidOrders.length / totalAll) * 100), color: '#16a34a', bg: '#dcfce7' },
        { status: 'aguardando', label: 'Aguardando', count: pendingOrders.length, percentage: Math.round((pendingOrders.length / totalAll) * 100), color: '#d97706', bg: '#fef3c7' },
        { status: 'recusado', label: 'Recusado', count: rejectedOrders.length, percentage: Math.round((rejectedOrders.length / totalAll) * 100), color: '#dc2626', bg: '#fee2e2' },
        { status: 'abandonado', label: 'Abandonado', count: abandonedOrders.length, percentage: Math.round((abandonedOrders.length / totalAll) * 100), color: '#94a3b8', bg: '#f1f5f9' },
    ]

    // ── Bump stats ────────────────────────────────────────────────────────
    const paidWithBump = paidOrders.filter(o => o.hasBump)
    const paidWithoutBump = paidOrders.filter(o => !o.hasBump)
    const bumpRevenue = paidWithBump.reduce((s, o) => s + (o.totalPrice || 0), 0)
    const nonBumpRevenue = paidWithoutBump.reduce((s, o) => s + (o.totalPrice || 0), 0)
    const bumpStats = {
        withBump: paidWithBump.length,
        withoutBump: paidWithoutBump.length,
        bumpRevenue,
        nonBumpRevenue,
        bumpAvgTicket: paidWithBump.length > 0 ? bumpRevenue / paidWithBump.length : 0,
        nonBumpAvgTicket: paidWithoutBump.length > 0 ? nonBumpRevenue / paidWithoutBump.length : 0,
    }

    // ── Checkout Access Stats ────────────────────────────────────────────
    const productMapWithNull = new Map<string | null, string>(products.map(p => [p.id, p.name]))
    productMapWithNull.set(null, 'Sem produto')
    productMapWithNull.set('', 'Sem produto')

    const accessTotal = accesses.length
    const accessBySourceMap = new Map<string, number>()
    const accessByCampaignMap = new Map<string, number>()
    const accessByProductMap = new Map<string | null, number>()

    for (const access of accesses) {
        const src = access.source || '(direct)'
        accessBySourceMap.set(src, (accessBySourceMap.get(src) || 0) + 1)

        const camp = access.campaign || '(none)'
        accessByCampaignMap.set(camp, (accessByCampaignMap.get(camp) || 0) + 1)

        const prod = access.productId || null
        accessByProductMap.set(prod, (accessByProductMap.get(prod) || 0) + 1)
    }

    const accessDailyMap = new Map<string, number>()
    for (let i = 29; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        accessDailyMap.set(d.toISOString().slice(0, 10), 0)
    }
    for (const access of accesses) {
        if (access.createdAt < thirtyDaysAgo) continue
        const key = access.createdAt.toISOString().slice(0, 10)
        if (accessDailyMap.has(key)) {
            accessDailyMap.set(key, accessDailyMap.get(key)! + 1)
        }
    }

    const bySource = Array.from(accessBySourceMap.entries())
        .map(([source, count]) => ({ source, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)

    const byCampaign = Array.from(accessByCampaignMap.entries())
        .map(([campaign, count]) => ({ campaign, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)

    const byProduct = Array.from(accessByProductMap.entries())
        .map(([productId, count]) => ({
            productId,
            productName: productMapWithNull.get(productId as string) || 'Produto removido',
            count
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)

    const dailyAccess = Array.from(accessDailyMap.entries())
        .map(([date, count]) => ({ date: new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }), count }))
        .sort((a, b) => a.date.localeCompare(b.date))

    const accessConversionRate = accessTotal > 0 ? (paidOrders.length / accessTotal) * 100 : 0

    const checkoutAccess: CheckoutAccessData = {
        total: accessTotal,
        uniqueVisitors: accessTotal,
        bySource,
        byCampaign,
        byProduct,
        dailyAccess,
        conversionRate: accessConversionRate,
        funnel: {
            step1: step1Count,
            step2: step2Count,
            step3: step3Count,
            payment: paymentCount,
        },
        recentAccessIds: [],
    }

    // ── Final data object ─────────────────────────────────────────────────
    const data: AnalyticsData = {
        kpis: {
            totalRevenue,
            netRevenue,
            totalOrders: nonAbandonedOrders.length,
            paidOrders: paidOrders.length,
            abandonedOrders: abandonedOrders.length,
            pendingOrders: pendingOrders.length,
            rejectedOrders: rejectedOrders.length,
            conversionRate,
            avgTicket,
            bumpRate,
        },
        dailyData,
        paymentMethods,
        installments,
        cardBrands,
        topProducts,
        topStates,
        statusBreakdown,
        bumpStats,
        checkoutAccess,
    }

    return (
        <div style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '40px' }}>

            {/* Header */}
            <header style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                    <div style={{
                        width: '44px', height: '44px', borderRadius: '13px', flexShrink: 0,
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 4px 14px rgba(99,102,241,0.3)'
                    }}>
                        <BarChart3 size={22} color="white" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: 'clamp(1.1rem, 4vw, 1.5rem)', fontWeight: 900, color: '#1e293b', margin: 0, letterSpacing: '-0.03em' }}>
                            Centro de Análise
                        </h1>
                        <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b', fontWeight: 500 }}>
                            Dados completos do checkout — receita, conversão, métodos e geografia.
                        </p>
                    </div>
                </div>

                {/* Date Filter */}
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    {[
                        { value: 'today', label: 'Hoje' },
                        { value: 'yesterday', label: 'Ontem' },
                        { value: '7dias', label: '7 dias' },
                        { value: '30dias', label: '30 dias' },
                        { value: 'mes', label: 'Esse mês' },
                        { value: 'mes-anterior', label: 'Mês ant.' },
                        { value: 'vida', label: 'Vida' },
                    ].map((btn) => (
                        <a
                            key={btn.value}
                            href={`?filter=${btn.value}`}
                            style={{
                                padding: '4px 8px',
                                fontSize: '11px',
                                fontWeight: 600,
                                color: params.filter === btn.value ? '#fff' : '#475569',
                                background: params.filter === btn.value ? '#1e293b' : '#f1f5f9',
                                borderRadius: '4px',
                                textDecoration: 'none',
                            }}
                        >
                            {btn.label}
                        </a>
                    ))}
                    <form method="get" style={{ display: 'flex', gap: '4px', alignItems: 'center', marginLeft: '8px' }}>
                        <input
                            type="date"
                            name="from"
                            defaultValue={fromDate}
                            style={{ padding: '3px 6px', borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '11px', background: '#fff', width: '110px' }}
                        />
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>até</span>
                        <input
                            type="date"
                            name="to"
                            defaultValue={toDate}
                            style={{ padding: '3px 6px', borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '11px', background: '#fff', width: '110px' }}
                        />
                        <button
                            type="submit"
                            style={{ padding: '3px 8px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                        >
                            OK
                        </button>
                    </form>
                </div>
            </header>

            <AnalyticsCharts data={data} />
        </div>
    )
}
