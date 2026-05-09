export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import { getDateFilters, dateToBrazilDateStr, formatDateStr, getBrazilNow } from '@/lib/date-utils'
import { BarChart3 } from 'lucide-react'
import AnalyticsCharts from './AnalyticsCharts'
import AnalyticsFilterForm from './AnalyticsFilterForm'
import type { AnalyticsData } from './types'


export default async function AdminPage({
    searchParams,
}: {
    searchParams: Promise<{ from?: string; to?: string; filter?: string }>
}) {
    const params = await searchParams

    const { now, todayStr, fromDate, toDate, fromDateUTC, toDateUTC } = getDateFilters(
        params.filter, params.from, params.to
    )

    // ── Fetch all orders ──────────────────────────────────────────────────
    const allOrders = await prisma.order.findMany({
        where: {
            deletedAt: null,
            createdAt: {
                gte: fromDateUTC,
                lte: toDateUTC,
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
    const pendingOrders = allOrders.filter(o => ['aguardando', 'processando'].includes(o.paymentStatus || ''))
    const rejectedOrders = allOrders.filter(o => o.paymentStatus === 'recusado')

    // ── KPIs ─────────────────────────────────────────────────────────────
    const totalRevenue = paidOrders.reduce((s, o) => s + (o.totalPrice || 0), 0)
    const netRevenue = paidOrders.reduce((s, o) => s + (o.netReceived || 0), 0)
    const conversionRate = allOrders.length > 0
        ? (paidOrders.length / allOrders.length) * 100
        : 0
    const avgTicket = paidOrders.length > 0 ? totalRevenue / paidOrders.length : 0
    const bumpOrders = allOrders.filter(o => o.hasBump)
    const bumpRate = allOrders.length > 0
        ? (bumpOrders.length / allOrders.length) * 100
        : 0

    // ── Daily data (last 30 days) ─────────────────────────────────────────
    const thirtyDaysAgo = new Date(now)
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const dailyMap = new Map<string, { revenue: number; orders: number; paidOrders: number }>()
    for (let i = 29; i >= 0; i--) {
        const d = new Date(now)
        d.setDate(d.getDate() - i)
        const key = formatDateStr(d)
        dailyMap.set(key, { revenue: 0, orders: 0, paidOrders: 0 })
    }
    for (const order of allOrders) {
        if (order.createdAt < thirtyDaysAgo) continue
        const key = dateToBrazilDateStr(order.createdAt)
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

    // ── Final data object ─────────────────────────────────────────────────
    const data: AnalyticsData = {
        kpis: {
            totalRevenue,
            netRevenue,
            totalOrders: allOrders.length,
            paidOrders: paidOrders.length,
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
    }

    return (
        <div style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '40px' }}>

            {/* Header */}
            <header className="page-header" style={{
                marginBottom: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '20px'
            }}>
                <div className="page-title-section" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div className="page-title-text">
                        <h1 style={{ fontSize: 'clamp(1.1rem, 4vw, 1.5rem)', fontWeight: 900, color: '#1e293b', margin: 0, letterSpacing: '-0.03em' }}>
                            Centro de Análise
                        </h1>
                        <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b', fontWeight: 500 }}>
                            Receita, conversão, métodos e origem do tráfego.
                        </p>
                    </div>
                </div>

                {/* Date Filter */}
                <AnalyticsFilterForm
                    currentFilter={params.filter || 'today'}
                    fromDate={fromDate}
                    toDate={toDate}
                />
            </header>



            <AnalyticsCharts data={data} />
        </div>
    )
}
