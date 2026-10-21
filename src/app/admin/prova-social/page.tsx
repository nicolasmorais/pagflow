export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import { getDateFilters, dateToBrazilDateStr } from '@/lib/date-utils'
import { getSocialProofConfig, getSocialProofItems, SOCIAL_PROOF_LIMITS } from '@/lib/social-proof'
import AnalyticsFilterForm from '../AnalyticsFilterForm'
import SocialProofSettings from './SocialProofSettings'
import SocialProofReport, { type SocialProofReportData } from './SocialProofReport'

export default async function ProvaSocialPage({
    searchParams,
}: {
    searchParams: Promise<{ from?: string; to?: string; filter?: string }>
}) {
    const params = await searchParams
    const { fromDateUTC, toDateUTC, fromDate, toDate } = getDateFilters(params.filter, params.from, params.to)
    const currentFilter = params.filter || '7dias'
    const range = { gte: fromDateUTC, lte: toDateUTC }

    const config = await getSocialProofConfig()
    const [events, pageViews, paidOrders, eligible] = await Promise.all([
        prisma.checkoutEvent.findMany({
            where: { createdAt: range, step: { in: ['prova_social_exibida', 'prova_social_fechada'] } },
            select: { visitorId: true, step: true, createdAt: true },
        }),
        prisma.checkoutEvent.findMany({
            where: { createdAt: range, step: 'page_view' },
            select: { visitorId: true },
            distinct: ['visitorId'],
        }),
        prisma.order.findMany({
            where: { createdAt: range, deletedAt: null, paymentStatus: 'pago', visitorId: { not: null } },
            select: { visitorId: true, createdAt: true },
        }),
        // O que está apto a aparecer agora, ignorando o liga/desliga
        getSocialProofItems({ ...config, scope: 'store' }, null, 12),
    ])

    const shownVisitors = new Set<string>()
    const closedVisitors = new Set<string>()
    let impressions = 0
    const daily = new Map<string, { date: string; exibicoes: number; visitantes: Set<string> }>()
    for (const e of events) {
        if (e.step === 'prova_social_fechada') { closedVisitors.add(e.visitorId); continue }
        impressions += 1
        shownVisitors.add(e.visitorId)
        const d = dateToBrazilDateStr(e.createdAt)
        if (!daily.has(d)) daily.set(d, { date: d, exibicoes: 0, visitantes: new Set() })
        const day = daily.get(d)!
        day.exibicoes += 1
        day.visitantes.add(e.visitorId)
    }

    // Conversão de quem viu x quem não viu (visitantes do checkout no período)
    const visitors = new Set(pageViews.map(v => v.visitorId))
    const paidVisitors = new Set(paidOrders.map(o => o.visitorId as string))
    let seenPaid = 0, unseen = 0, unseenPaid = 0
    for (const v of visitors) {
        if (shownVisitors.has(v)) {
            if (paidVisitors.has(v)) seenPaid += 1
        } else {
            unseen += 1
            if (paidVisitors.has(v)) unseenPaid += 1
        }
    }
    const seenInVisitors = [...shownVisitors].filter(v => visitors.has(v)).length

    const data: SocialProofReportData = {
        impressions,
        shownVisitors: shownVisitors.size,
        closedVisitors: closedVisitors.size,
        visitors: visitors.size,
        seen: seenInVisitors,
        seenPaid,
        unseen,
        unseenPaid,
        daily: Array.from(daily.values())
            .map(d => ({ date: d.date, exibicoes: d.exibicoes, visitantes: d.visitantes.size }))
            .sort((a, b) => a.date.localeCompare(b.date)),
    }

    return (
        <div className="od">
            <div className="od-head">
                <div>
                    <h1>Notificações de compra</h1>
                    <p className="od-meta">
                        Avisos no checkout com compras reais pagas: primeiro nome, cidade e produto.
                    </p>
                </div>
                <AnalyticsFilterForm currentFilter={currentFilter} fromDate={fromDate} toDate={toDate} />
            </div>
            <SocialProofSettings config={config} limits={SOCIAL_PROOF_LIMITS} eligible={eligible} />
            <SocialProofReport data={data} />
        </div>
    )
}
