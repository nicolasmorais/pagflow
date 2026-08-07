export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import { formatDateStr, getBrazilNow } from '@/lib/date-utils'
import { fetchAllTaboolaAccounts, attributeOrdersToAccounts, buildCampaignAccountMap } from '@/lib/taboola'
import FinanceiroClient from './FinanceiroClient'

const PERIOD_DAYS: Record<string, number | null> = {
    'today': 0,
    '7d': 7,
    '30d': 30,
    '90d': 90,
    'all': null,
}

const isMonthPeriod = (p: string) => p === 'this_month' || p === 'last_month'

function getMonthRange(period: string, now: Date): { from: Date; to: Date } {
    if (period === 'this_month') {
        const from = new Date(now.getFullYear(), now.getMonth(), 1)
        from.setHours(0, 0, 0, 0)
        const to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
        return { from, to }
    }
    // last_month
    const from = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    from.setHours(0, 0, 0, 0)
    const to = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
    return { from, to }
}

export default async function FinanceiroPage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
    const { period: periodParam } = await searchParams
    const period = periodParam && (PERIOD_DAYS[periodParam] !== undefined || isMonthPeriod(periodParam)) ? periodParam : '30d'
    const days = PERIOD_DAYS[period] ?? null

    const now = getBrazilNow()

    const whereDate = (() => {
        if (isMonthPeriod(period)) {
            const { from, to } = getMonthRange(period, now)
            return { gte: from, lte: to }
        }
        if (days !== null) {
            const from = new Date(now)
            if (days === 0) {
                from.setHours(0, 0, 0, 0)
            } else {
                from.setDate(from.getDate() - days)
            }
            return { gte: from }
        }
        return undefined
    })()

    const allOrders = await prisma.order.findMany({
        where: {
            deletedAt: null,
            ...(whereDate ? { createdAt: whereDate } : {}),
        },
        select: {
            id: true,
            paymentStatus: true,
            totalPrice: true,
            netReceived: true,
            hasBump: true,
            createdAt: true,
            productId: true,
        },
    })

    const paidOrders = allOrders.filter(o => o.paymentStatus === 'pago')
    const totalRevenue = paidOrders.reduce((s, o) => s + (o.totalPrice || 0), 0)
    const netRevenue = paidOrders.reduce((s, o) => s + (o.netReceived || 0), 0)

    const products = await prisma.product.findMany({ select: { id: true, cost: true, commission: true } })
    const productMap = new Map(products.map(p => [p.id, p]))
    const totalCost = paidOrders.reduce((s, o) => {
        const p = o.productId ? productMap.get(o.productId) : null
        return s + (p?.cost || 0)
    }, 0)

    const records = await prisma.financialRecord.findMany({
        where: whereDate ? { date: whereDate } : undefined,
        orderBy: { date: 'desc' },
    })

    const totalDespesas = records.filter(r => r.type === 'despesa').reduce((s, r) => s + r.amount, 0)

    // Buscar gasto do Taboola no período (mesma lógica de data do whereDate)
    const startDate = (() => {
        if (isMonthPeriod(period)) {
            return formatDateStr(getMonthRange(period, now).from)
        }
        if (days !== null) {
            const from = new Date(now)
            if (days === 0) {
                from.setHours(0, 0, 0, 0)
            } else {
                from.setDate(from.getDate() - days)
            }
            return formatDateStr(from)
        }
        return formatDateStr(new Date(now.getFullYear(), now.getMonth(), 1))
    })()
    const endDate = isMonthPeriod(period)
        ? formatDateStr(getMonthRange(period, now).to)
        : formatDateStr(now)
    const taboolaData = await fetchAllTaboolaAccounts(startDate, endDate)
    const taboolaSpent = taboolaData.totalSpent
    const taboolaByDate = taboolaData.byDate
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

    // Buscar vendas atribuídas ao Taboola via UTM
    const [taboolaOrders, campaignMap] = await Promise.all([
        prisma.order.findMany({
            where: {
                deletedAt: null,
                utmSource: { contains: 'taboola', mode: 'insensitive' },
                ...(whereDate ? { createdAt: whereDate } : {}),
            },
            select: { totalPrice: true, paymentStatus: true, utmCampaign: true, utmSource: true, utmId: true },
        }),
        buildCampaignAccountMap(),
    ])
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

    const kpis = {
        totalRevenue,
        netRevenue,
        totalCost,
        totalOrders: allOrders.length,
        paidOrders: paidOrders.length,
        taboolaSpent,
    }

    const chartDays = (() => {
        if (isMonthPeriod(period)) {
            const { from, to } = getMonthRange(period, now)
            return Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) + 1
        }
        return days !== null ? Math.max(days, 1) : 30
    })()
    const chartStart = (() => {
        if (isMonthPeriod(period)) {
            return getMonthRange(period, now).from
        }
        const from = new Date(now)
        if (days === 0) {
            from.setHours(0, 0, 0, 0)
        } else if (days !== null) {
            from.setDate(from.getDate() - (days - 1))
        } else {
            from.setDate(from.getDate() - 29)
        }
        return from
    })()
    const dailyMap = new Map<string, { receita: number; despesa: number; lucro: number }>()
    for (let i = 0; i < chartDays; i++) {
        const d = new Date(chartStart)
        d.setDate(d.getDate() + i)
        const key = formatDateStr(d)
        dailyMap.set(key, { receita: 0, despesa: 0, lucro: 0 })
    }

    for (const order of paidOrders) {
        const key = formatDateStr(order.createdAt)
        if (!dailyMap.has(key)) continue
        const ex = dailyMap.get(key)!
        dailyMap.set(key, { ...ex, receita: ex.receita + (order.totalPrice || 0) })
    }

    const expenseRecords = records.filter(r => r.type === 'despesa')
    for (const rec of expenseRecords) {
        const key = formatDateStr(rec.date)
        if (!dailyMap.has(key)) continue
        const ex = dailyMap.get(key)!
        dailyMap.set(key, { ...ex, despesa: ex.despesa + rec.amount })
    }

    // Somar gasto Taboola diário ao despesa de cada dia
    for (const [dateKey, spent] of taboolaByDate.entries()) {
        if (dailyMap.has(dateKey)) {
            const ex = dailyMap.get(dateKey)!
            dailyMap.set(dateKey, { ...ex, despesa: ex.despesa + spent })
        }
    }

    for (const [key, val] of dailyMap.entries()) {
        dailyMap.set(key, { ...val, lucro: val.receita - val.despesa })
    }

    const dailyRevenue = Array.from(dailyMap.entries()).map(([date, data]) => ({
        date: new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        ...data,
    }))

    const categoryBreakdown = [
        { name: 'Marketing', value: expenseRecords.filter(r => r.category === 'marketing').reduce((s, r) => s + r.amount, 0), color: '#f97316' },
        { name: 'Operacional', value: expenseRecords.filter(r => r.category === 'operacional').reduce((s, r) => s + r.amount, 0), color: '#6366f1' },
        { name: 'Frete', value: expenseRecords.filter(r => r.category === 'frete').reduce((s, r) => s + r.amount, 0), color: '#0ea5e9' },
        { name: 'Taxas', value: expenseRecords.filter(r => r.category === 'taxa').reduce((s, r) => s + r.amount, 0), color: '#ec4899' },
        { name: 'Outros', value: expenseRecords.filter(r => r.category === 'outros').reduce((s, r) => s + r.amount, 0), color: '#64748b' },
    ].filter(c => c.value > 0)

    const manualMarketing = expenseRecords.filter(r => r.category === 'marketing').reduce((s, r) => s + r.amount, 0)

    const initialData = {
        receitaBruta: totalRevenue,
        receitaLiquida: netRevenue,
        custoProduto: totalCost,
        gastosMarketing: manualMarketing + taboolaSpent,
        gastosOperacionais: expenseRecords.filter(r => r.category === 'operacional').reduce((s, r) => s + r.amount, 0),
        taboolaSpent,
        lucroOperacional: netRevenue - totalCost - totalDespesas - taboolaSpent,
        margemLucro: totalRevenue > 0 ? ((netRevenue - totalCost - totalDespesas - taboolaSpent) / totalRevenue) * 100 : 0,
        roi: (totalCost + totalDespesas + taboolaSpent) > 0 ? ((netRevenue - totalCost - totalDespesas - taboolaSpent) / (totalCost + totalDespesas + taboolaSpent)) * 100 : 0,
        dailyRevenue,
        categoryBreakdown,
        totalCost,
        period,
        taboolaAccounts,
        taboolaRevenue,
    }

    const serializedRecords = records.map(r => ({
        ...r,
        date: r.date.toISOString(),
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
    }))

    return <FinanceiroClient initialData={initialData} records={serializedRecords} kpis={kpis} />
}
