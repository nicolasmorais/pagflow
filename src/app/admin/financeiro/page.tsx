export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import { formatDateStr, getBrazilNow } from '@/lib/date-utils'
import FinanceiroClient from './FinanceiroClient'

const TABOOLA_CLIENT_ID = '101768521273467f9b5b87c1a86c01f2'
const TABOOLA_CLIENT_SECRET = '43ae9bcc72054b3bb45843a20083b60b'
const TABOOLA_ACCOUNT_ID = 'taboolaaccount-admcasocastoregmailcom'

async function getTaboolaSpent(startDate: string, endDate: string): Promise<number> {
    try {
        const tokenRes = await fetch('https://backstage.taboola.com/backstage/oauth/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: TABOOLA_CLIENT_ID,
                client_secret: TABOOLA_CLIENT_SECRET,
                grant_type: 'client_credentials',
            }),
            cache: 'no-store',
        })
        if (!tokenRes.ok) return 0
        const { access_token } = await tokenRes.json()

        const reportRes = await fetch(
            `https://backstage.taboola.com/backstage/api/1.0/${TABOOLA_ACCOUNT_ID}/reports/marketing/day?start_date=${startDate}&end_date=${endDate}`,
            { headers: { Authorization: `Bearer ${access_token}`, Accept: 'application/json' }, cache: 'no-store' }
        )
        if (!reportRes.ok) return 0
        const data = await reportRes.json()
        return (data.results || []).reduce((s: number, r: any) => s + (r.spent || 0), 0)
    } catch {
        return 0
    }
}

const PERIOD_DAYS: Record<string, number | null> = {
    'today': 0,
    '7d': 7,
    '30d': 30,
    '90d': 90,
    'all': null,
}

export default async function FinanceiroPage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
    const { period: periodParam } = await searchParams
    const period = periodParam && PERIOD_DAYS[periodParam] !== undefined ? periodParam : '30d'
    const days = PERIOD_DAYS[period]

    const now = getBrazilNow()

    const whereDate = days !== null ? (() => {
        const from = new Date(now)
        if (days === 0) {
            from.setHours(0, 0, 0, 0)
        } else {
            from.setDate(from.getDate() - days)
        }
        return { gte: from }
    })() : undefined

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

    // Buscar gasto do Taboola no período
    const startDate = days !== null ? (() => {
        const from = new Date(now)
        if (days === 0) {
            from.setHours(0, 0, 0, 0)
        } else {
            from.setDate(from.getDate() - days)
        }
        return from.toISOString().split('T')[0]
    })() : new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
    const endDate = now.toISOString().split('T')[0]
    const taboolaSpent = await getTaboolaSpent(startDate, endDate)

    const kpis = {
        totalRevenue,
        netRevenue,
        totalCost,
        totalOrders: allOrders.length,
        paidOrders: paidOrders.length,
        taboolaSpent,
    }

    const chartDays = days !== null ? Math.max(days, 1) : 30
    const dailyMap = new Map<string, { receita: number; despesa: number; lucro: number }>()
    for (let i = chartDays - 1; i >= 0; i--) {
        const d = new Date(now)
        d.setDate(d.getDate() - i)
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
    }

    const serializedRecords = records.map(r => ({
        ...r,
        date: r.date.toISOString(),
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
    }))

    return <FinanceiroClient initialData={initialData} records={serializedRecords} kpis={kpis} />
}
