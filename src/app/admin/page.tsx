export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import { getDateFilters, dateToBrazilDateStr, formatDateStr, getBrazilNow } from '@/lib/date-utils'
import { fetchAllTaboolaAccounts, attributeOrdersToAccounts, buildCampaignAccountMap } from '@/lib/taboola'
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
            fullName: true,
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
            productCost: true,
        }
    })

    const products = await prisma.product.findMany({ select: { id: true, name: true } })
    const productMap = new Map(products.map(p => [p.id, p.name]))

    // ── Fetch financial records (despesas) ─────────────────────────────
    const financialRecords = await prisma.financialRecord.findMany({
        where: {
            type: 'despesa',
            date: { gte: fromDateUTC, lte: toDateUTC },
        },
        select: { amount: true },
    })
    const totalDespesas = financialRecords.reduce((s, r) => s + r.amount, 0)

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
    const totalCost = paidOrders.reduce((s, o) => s + (o.productCost || 0), 0)

    const bumpOrders = allOrders.filter(o => o.hasBump)
    const bumpRate = allOrders.length > 0
        ? (bumpOrders.length / allOrders.length) * 100
        : 0

    // ── Previous period comparison ────────────────────────────────────────
    const periodMs = toDateUTC.getTime() - fromDateUTC.getTime()
    const prevFromUTC = new Date(fromDateUTC.getTime() - periodMs)
    const prevToUTC = new Date(fromDateUTC.getTime() - 1)

    const prevOrders = await prisma.order.findMany({
        where: { deletedAt: null, createdAt: { gte: prevFromUTC, lte: prevToUTC } },
        select: { paymentStatus: true, totalPrice: true }
    })
    const prevPaid = prevOrders.filter(o => o.paymentStatus === 'pago')
    const prevKpis = {
        totalRevenue: prevPaid.reduce((s, o) => s + (o.totalPrice || 0), 0),
        totalOrders: prevOrders.length,
        paidOrders: prevPaid.length,
        conversionRate: prevOrders.length > 0 ? (prevPaid.length / prevOrders.length) * 100 : 0,
        avgTicket: prevPaid.length > 0 ? prevPaid.reduce((s, o) => s + (o.totalPrice || 0), 0) / prevPaid.length : 0,
    }

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

    // ── Hourly distribution ───────────────────────────────────────────────
    const hourlyMap = new Map<string, number>()
    for (let h = 0; h < 24; h++) hourlyMap.set(String(h).padStart(2, '0'), 0)
    for (const o of allOrders) {
        const h = new Date(o.createdAt).toLocaleString('pt-BR', { hour: '2-digit', hour12: false, timeZone: 'America/Sao_Paulo' })
        hourlyMap.set(h, (hourlyMap.get(h) || 0) + 1)
    }
    const hourlyData = Array.from(hourlyMap.entries()).map(([hour, orders]) => ({ hour: `${hour}h`, orders }))

    // ── Hourly detail (paid/pending/rejected) + shift breakdown ────────────
    const hourlyDetailMap = new Map<string, { paid: number; pending: number; rejected: number; total: number; revenue: number }>()
    for (let h = 0; h < 24; h++) hourlyDetailMap.set(String(h).padStart(2, '0'), { paid: 0, pending: 0, rejected: 0, total: 0, revenue: 0 })

    const SHIFTS = [
        { key: 'madrugada', label: 'Madrugada', range: '00h–05h59', hours: [0, 1, 2, 3, 4, 5] },
        { key: 'manha', label: 'Manhã', range: '06h–11h59', hours: [6, 7, 8, 9, 10, 11] },
        { key: 'tarde', label: 'Tarde', range: '12h–17h59', hours: [12, 13, 14, 15, 16, 17] },
        { key: 'noite', label: 'Noite', range: '18h–23h59', hours: [18, 19, 20, 21, 22, 23] },
    ]
    const hourToShift = new Map<number, string>()
    for (const s of SHIFTS) for (const h of s.hours) hourToShift.set(h, s.key)

    const shiftStatsMap = new Map<string, { paid: number; pending: number; rejected: number; total: number; revenue: number }>()
    for (const s of SHIFTS) shiftStatsMap.set(s.key, { paid: 0, pending: 0, rejected: 0, total: 0, revenue: 0 })

    for (const o of allOrders) {
        const hStr = new Date(o.createdAt).toLocaleString('pt-BR', { hour: '2-digit', hour12: false, timeZone: 'America/Sao_Paulo' })
        const hourNum = parseInt(hStr, 10) % 24
        const hKey = String(hourNum).padStart(2, '0')
        const detail = hourlyDetailMap.get(hKey)!
        const isPaid = o.paymentStatus === 'pago'
        const isPending = ['aguardando', 'processando'].includes(o.paymentStatus || '')
        const isRejected = o.paymentStatus === 'recusado'
        detail.total += 1
        if (isPaid) { detail.paid += 1; detail.revenue += o.totalPrice || 0 }
        if (isPending) detail.pending += 1
        if (isRejected) detail.rejected += 1

        const shiftKey = hourToShift.get(hourNum)!
        const shiftStat = shiftStatsMap.get(shiftKey)!
        shiftStat.total += 1
        if (isPaid) { shiftStat.paid += 1; shiftStat.revenue += o.totalPrice || 0 }
        if (isPending) shiftStat.pending += 1
        if (isRejected) shiftStat.rejected += 1
    }

    const topHours = Array.from(hourlyDetailMap.entries())
        .map(([hour, d]) => ({ hour: `${hour}h`, ...d }))
        .sort((a, b) => b.paid - a.paid || b.total - a.total)
        .slice(0, 5)

    const shiftData = SHIFTS.map(s => ({ shift: s.key, label: s.label, range: s.range, ...shiftStatsMap.get(s.key)! }))
    const bestShift = shiftData.reduce((best, s) => (s.paid > best.paid ? s : best), shiftData[0])

    // ── Weekday distribution ──────────────────────────────────────────────
    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab']
    const weekdayMap = new Map<string, { revenue: number; orders: number }>()
    for (const d of dayNames) weekdayMap.set(d, { revenue: 0, orders: 0 })
    for (const o of allOrders) {
        const d = dayNames[new Date(o.createdAt).getDay()]
        const ex = weekdayMap.get(d)!
        weekdayMap.set(d, {
            revenue: ex.revenue + (o.paymentStatus === 'pago' ? (o.totalPrice || 0) : 0),
            orders: ex.orders + 1,
        })
    }
    const weekdayData = dayNames.map(d => ({ day: d, ...weekdayMap.get(d)! }))

    // ── Recent orders ────────────────────────────────────────────────────
    const recentOrders = allOrders
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 5)
        .map(o => ({
            id: o.id,
            fullName: o.fullName || 'Cliente',
            totalPrice: o.totalPrice || 0,
            paymentStatus: o.paymentStatus || 'pendente',
            paymentMethod: o.paymentMethod || 'pix',
            createdAt: o.createdAt.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' }),
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

    // ── Taboola Ads ───────────────────────────────────────────────────────
    const taboolaData = await fetchAllTaboolaAccounts(fromDate, toDate)
    const taboolaSpent = taboolaData.totalSpent

    // ── Profit (same formula as financeiro) ─────────────────────────────
    const profit = netRevenue - totalCost - totalDespesas - taboolaSpent
    const taboolaAccounts = taboolaData.accounts.map(a => ({
        accountId: a.accountId,
        label: a.label,
        totalSpent: a.totalSpent,
        totalImpressions: a.totalImpressions,
        totalClicks: a.totalClicks,
        totalConversions: a.totalConversions,
        cpc: a.cpc,
        ctr: a.ctr,
        cpa: a.cpa,
        error: a.error,
    }))

    const taboolaOrders = await prisma.order.findMany({
        where: {
            deletedAt: null,
            utmSource: { contains: 'taboola', mode: 'insensitive' },
            createdAt: { gte: fromDateUTC, lte: toDateUTC },
        },
        select: { totalPrice: true, paymentStatus: true, utmCampaign: true, utmSource: true, utmId: true },
    })
    const campaignMap = await buildCampaignAccountMap()
    const taboolaAttribution = attributeOrdersToAccounts(taboolaOrders, taboolaData.accounts, campaignMap)
    const taboolaRevenue = taboolaAccounts.map(a => {
        const attr = taboolaAttribution.byAccount.get(a.accountId)
        return {
            accountId: a.accountId,
            paidRevenue: attr?.paidRevenue || 0,
            unpaidRevenue: attr?.unpaidRevenue || 0,
            totalRevenue: attr?.totalRevenue || 0,
            paidOrders: attr?.paidOrders || 0,
            totalOrders: attr?.totalOrders || 0,
        }
    })

    // ── Taboola aggregated KPIs ────────────────────────────────────────────
    const connectedAccounts = taboolaAccounts.filter(a => !a.error)
    const taboolaTotalImpressions = connectedAccounts.reduce((s, a) => s + a.totalImpressions, 0)
    const taboolaTotalClicks = connectedAccounts.reduce((s, a) => s + a.totalClicks, 0)
    const taboolaTotalConversions = connectedAccounts.reduce((s, a) => s + a.totalConversions, 0)
    const taboolaPaidRevenue = taboolaRevenue.reduce((s, r) => s + r.paidRevenue, 0)
    const taboolaKpis = connectedAccounts.length > 0 ? {
        totalSpent: taboolaSpent || 0,
        totalConversions: taboolaTotalConversions,
        avgCpa: taboolaTotalConversions > 0 ? (taboolaSpent || 0) / taboolaTotalConversions : 0,
        roas: (taboolaSpent || 0) > 0 ? taboolaPaidRevenue / (taboolaSpent || 1) : 0,
        totalImpressions: taboolaTotalImpressions,
        totalClicks: taboolaTotalClicks,
        paidRevenue: taboolaPaidRevenue,
    } : undefined

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
            profit,
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
        hourlyData,
        weekdayData,
        topHours,
        shiftData,
        bestShift,
        recentOrders,
        prevKpis,
        taboolaAccounts,
        taboolaRevenue,
        taboolaSpent,
        taboolaKpis,
    }

    return (
        <div style={{ paddingBottom: '40px' }}>

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
                        <h1 style={{ fontSize: 'clamp(1.1rem, 4vw, 1.5rem)', fontWeight: 700, color: '#14151F', margin: 0, letterSpacing: '-0.01em', fontFamily: "'Fraunces', serif" }}>
                            Centro de Análise
                        </h1>
                        <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6E7180', fontWeight: 500 }}>
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
