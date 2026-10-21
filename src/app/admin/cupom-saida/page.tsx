export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import { getDateFilters, dateToBrazilDateStr } from '@/lib/date-utils'
import { EXIT_COUPON_CODE, EXIT_COUPON_PCT } from '@/lib/exit-coupon'
import AnalyticsFilterForm from '../AnalyticsFilterForm'
import CouponReport, { type CouponReportData } from './CouponReport'

const POPUP_STEPS = ['cupom_saida_exibido', 'cupom_saida_ativado', 'cupom_saida_recusado'] as const

export default async function CupomSaidaPage({
    searchParams,
}: {
    searchParams: Promise<{ from?: string; to?: string; filter?: string }>
}) {
    const params = await searchParams
    const { fromDateUTC, toDateUTC, fromDate, toDate } = getDateFilters(params.filter, params.from, params.to)
    const currentFilter = params.filter || '7dias'
    const range = { gte: fromDateUTC, lte: toDateUTC }

    const [events, pageViewVisitors, orders] = await Promise.all([
        prisma.checkoutEvent.findMany({
            where: { createdAt: range, step: { in: [...POPUP_STEPS] } },
            select: { visitorId: true, step: true, createdAt: true },
        }),
        prisma.checkoutEvent.findMany({
            where: { createdAt: range, step: 'page_view' },
            select: { visitorId: true },
            distinct: ['visitorId'],
        }),
        prisma.order.findMany({
            where: { createdAt: range, deletedAt: null, couponCode: { not: null } },
            select: {
                id: true, fullName: true, totalPrice: true, shippingPrice: true,
                paymentStatus: true, paymentMethod: true, createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
        }),
    ])

    // Visitantes únicos por evento do popup (o mesmo visitante pode reabrir o checkout)
    const visitorsBy: Record<string, Set<string>> = Object.fromEntries(POPUP_STEPS.map(s => [s, new Set<string>()]))
    for (const e of events) visitorsBy[e.step].add(e.visitorId)

    // O total já sai com desconto: subtotal × (1 − pct) + frete
    const keepRatio = 1 - EXIT_COUPON_PCT / 100
    const discountOf = (o: { totalPrice: number; shippingPrice: number }) =>
        Math.max(0, (o.totalPrice - o.shippingPrice) / keepRatio - (o.totalPrice - o.shippingPrice))

    const paid = orders.filter(o => o.paymentStatus === 'pago')

    const daily = new Map<string, { date: string; exibidos: number; ativados: number; pagos: number }>()
    const day = (d: string) => {
        if (!daily.has(d)) daily.set(d, { date: d, exibidos: 0, ativados: 0, pagos: 0 })
        return daily.get(d)!
    }
    const seen = new Set<string>()
    for (const e of events) {
        if (e.step === 'cupom_saida_recusado') continue
        const d = dateToBrazilDateStr(e.createdAt)
        const key = `${d}|${e.step}|${e.visitorId}`
        if (seen.has(key)) continue
        seen.add(key)
        if (e.step === 'cupom_saida_exibido') day(d).exibidos += 1
        else day(d).ativados += 1
    }
    for (const o of paid) day(dateToBrazilDateStr(o.createdAt)).pagos += 1

    const data: CouponReportData = {
        code: EXIT_COUPON_CODE,
        pct: EXIT_COUPON_PCT,
        visitors: pageViewVisitors.length,
        shown: visitorsBy.cupom_saida_exibido.size,
        claimed: visitorsBy.cupom_saida_ativado.size,
        dismissed: visitorsBy.cupom_saida_recusado.size,
        orders: orders.length,
        paid: paid.length,
        revenue: paid.reduce((s, o) => s + o.totalPrice, 0),
        discountGiven: paid.reduce((s, o) => s + discountOf(o), 0),
        daily: Array.from(daily.values()).sort((a, b) => a.date.localeCompare(b.date)),
        recentOrders: orders.slice(0, 30).map(o => ({
            id: o.id,
            fullName: o.fullName || 'Sem nome',
            createdAt: o.createdAt.toISOString(),
            paymentStatus: o.paymentStatus,
            paymentMethod: o.paymentMethod || '',
            total: o.totalPrice,
            discount: discountOf(o),
        })),
    }

    return (
        <div className="od">
            <div className="od-head">
                <div>
                    <h1>Cupom de saída</h1>
                    <p className="od-meta">
                        Popup de {EXIT_COUPON_PCT}% ({EXIT_COUPON_CODE}) para quem tenta sair do checkout.
                    </p>
                </div>
                <AnalyticsFilterForm currentFilter={currentFilter} fromDate={fromDate} toDate={toDate} />
            </div>
            <CouponReport data={data} />
        </div>
    )
}
