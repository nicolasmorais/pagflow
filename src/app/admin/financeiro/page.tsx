export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import { formatDateStr, getBrazilNow } from '@/lib/date-utils'
import FinanceiroClient from './FinanceiroClient'

export default async function FinanceiroPage() {
    const now = getBrazilNow()

    const thirtyDaysAgo = new Date(now)
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const allOrders = await prisma.order.findMany({
        where: {
            deletedAt: null,
            createdAt: { gte: thirtyDaysAgo },
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
        orderBy: { date: 'desc' },
    })

    const totalDespesas = records.filter(r => r.type === 'despesa').reduce((s, r) => s + r.amount, 0)

    const kpis = {
        totalRevenue,
        netRevenue,
        totalCost,
        totalOrders: allOrders.length,
        paidOrders: paidOrders.length,
    }

    const dailyMap = new Map<string, { receita: number; despesa: number; lucro: number }>()
    for (let i = 29; i >= 0; i--) {
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

    const initialData = {
        receitaBruta: totalRevenue,
        receitaLiquida: netRevenue,
        custoProduto: totalCost,
        gastosMarketing: expenseRecords.filter(r => r.category === 'marketing').reduce((s, r) => s + r.amount, 0),
        gastosOperacionais: expenseRecords.filter(r => r.category === 'operacional').reduce((s, r) => s + r.amount, 0),
        lucroOperacional: netRevenue - totalCost - totalDespesas,
        margemLucro: totalRevenue > 0 ? ((netRevenue - totalCost - totalDespesas) / totalRevenue) * 100 : 0,
        roi: (totalCost + totalDespesas) > 0 ? ((netRevenue - totalCost - totalDespesas) / (totalCost + totalDespesas)) * 100 : 0,
        dailyRevenue,
        categoryBreakdown,
        totalCost,
    }

    const serializedRecords = records.map(r => ({
        ...r,
        date: r.date.toISOString(),
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
    }))

    return <FinanceiroClient initialData={initialData} records={serializedRecords} kpis={kpis} />
}
