export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import { getDateFilters, dateToBrazilDateStr } from '@/lib/date-utils'
import AnalyticsFilterForm from '../AnalyticsFilterForm'
import FunnelCharts from './FunnelCharts'

export default async function AnalyticsFunnelPage({
    searchParams,
}: {
    searchParams: Promise<{ from?: string; to?: string; filter?: string }>
}) {
    const params = await searchParams
    const { fromDateUTC, toDateUTC, fromDate, toDate } = getDateFilters(
        params.filter, params.from, params.to
    )
    const currentFilter = params.filter || '7dias'

    const events = await prisma.checkoutEvent.findMany({
        where: { createdAt: { gte: fromDateUTC, lte: toDateUTC } },
        select: {
            visitorId: true,
            step: true,
            clickId: true,
            utmSource: true,
            utmCampaign: true,
            createdAt: true,
        },
    })

    const orders = await prisma.order.findMany({
        where: { createdAt: { gte: fromDateUTC, lte: toDateUTC }, deletedAt: null },
        select: {
            id: true,
            visitorId: true,
            clickId: true,
            utmSource: true,
            utmCampaign: true,
            paymentStatus: true,
            totalPrice: true,
            createdAt: true,
        },
    })

    // ── Funil: contagem de visitantes únicos por etapa ──
    const stepOrder = ['page_view', 'dados_completo', 'entrega_completa', 'pagamento_iniciado', 'pedido_criado']
    const stepLabels: Record<string, string> = {
        page_view: 'Visitou o checkout',
        dados_completo: 'Preencheu dados',
        entrega_completa: 'Preencheu entrega',
        pagamento_iniciado: 'Iniciou pagamento',
        pedido_criado: 'Pedido criado',
    }
    const visitorsByStep: Record<string, Set<string>> = {}
    for (const step of stepOrder) visitorsByStep[step] = new Set()
    for (const e of events) {
        if (visitorsByStep[e.step]) visitorsByStep[e.step].add(e.visitorId)
    }
    const pagoVisitorIds = new Set(orders.filter(o => o.paymentStatus === 'pago' && o.visitorId).map(o => o.visitorId as string))

    const funnel = [
        ...stepOrder.map(step => ({ label: stepLabels[step], value: visitorsByStep[step].size })),
        { label: 'Pagamento confirmado', value: pagoVisitorIds.size },
    ]

    // ── Quebra por origem (clickId Taboola / utm_source / utm_campaign) ──
    type Bucket = { key: string; source: string; campaign: string; visits: Set<string>; checkoutsIniciados: Set<string>; pedidos: number; pagos: number; receita: number }
    const buckets = new Map<string, Bucket>()

    function bucketKey(clickId: string | null, source: string | null, campaign: string | null) {
        if (clickId) return `tblci:${clickId}`
        if (source) return `${source}${campaign ? ':' + campaign : ''}`
        return 'direto/sem-origem'
    }

    function getBucket(clickId: string | null, source: string | null, campaign: string | null) {
        const key = bucketKey(clickId, source, campaign)
        if (!buckets.has(key)) {
            buckets.set(key, {
                key,
                source: clickId ? 'taboola (click id)' : (source || 'direto'),
                campaign: clickId ? clickId : (campaign || '-'),
                visits: new Set(),
                checkoutsIniciados: new Set(),
                pedidos: 0,
                pagos: 0,
                receita: 0,
            })
        }
        return buckets.get(key)!
    }

    for (const e of events) {
        const b = getBucket(e.clickId, e.utmSource, e.utmCampaign)
        if (e.step === 'page_view') b.visits.add(e.visitorId)
        if (e.step === 'dados_completo') b.checkoutsIniciados.add(e.visitorId)
    }

    for (const o of orders) {
        const b = getBucket(o.clickId, o.utmSource, o.utmCampaign)
        b.pedidos += 1
        if (o.paymentStatus === 'pago') {
            b.pagos += 1
            b.receita += o.totalPrice || 0
        }
    }

    const breakdown = Array.from(buckets.values())
        .map(b => ({
            source: b.source,
            campaign: b.campaign,
            visits: b.visits.size,
            checkoutsIniciados: b.checkoutsIniciados.size,
            pedidos: b.pedidos,
            pagos: b.pagos,
            receita: b.receita,
            conversao: b.visits.size > 0 ? (b.pagos / b.visits.size) * 100 : 0,
        }))
        .sort((a, b) => b.visits - a.visits || b.pedidos - a.pedidos)

    const totalPageViews = visitorsByStep.page_view.size
    const totalPedidos = orders.length
    const totalPagos = orders.filter(o => o.paymentStatus === 'pago').length
    const receitaTotal = orders.filter(o => o.paymentStatus === 'pago').reduce((s, o) => s + (o.totalPrice || 0), 0)
    const kpis = {
        visitas: totalPageViews,
        iniciaramCheckout: visitorsByStep.dados_completo.size,
        pedidos: totalPedidos,
        pagos: totalPagos,
        pagosRastreados: pagoVisitorIds.size,
        conversao: totalPageViews > 0 ? (pagoVisitorIds.size / totalPageViews) * 100 : 0,
        receita: receitaTotal,
    }

    // ── Série diária: visitas x pedidos x pagos ──
    const dailyMap = new Map<string, { date: string; visitas: number; pedidos: number; pagos: number }>()
    function getDay(d: string) {
        if (!dailyMap.has(d)) dailyMap.set(d, { date: d, visitas: 0, pedidos: 0, pagos: 0 })
        return dailyMap.get(d)!
    }
    const seenVisitorPerDay = new Set<string>()
    for (const e of events) {
        if (e.step !== 'page_view') continue
        const d = dateToBrazilDateStr(e.createdAt)
        const dedupKey = `${d}|${e.visitorId}`
        if (seenVisitorPerDay.has(dedupKey)) continue
        seenVisitorPerDay.add(dedupKey)
        getDay(d).visitas += 1
    }
    for (const o of orders) {
        const d = dateToBrazilDateStr(o.createdAt)
        const day = getDay(d)
        day.pedidos += 1
        if (o.paymentStatus === 'pago') day.pagos += 1
    }
    const dailyData = Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date))

    // ── Web Vitals reais do checkout (performance de carregamento) ──
    const vitals = await prisma.webVital.findMany({
        where: { createdAt: { gte: fromDateUTC, lte: toDateUTC }, path: { startsWith: '/checkout' } },
        select: { name: true, value: true, rating: true },
    })
    const VITAL_ORDER = ['LCP', 'INP', 'CLS', 'FCP', 'TTFB']
    const vitalsByName = new Map<string, { values: number[]; good: number; needsImprovement: number; poor: number }>()
    for (const name of VITAL_ORDER) vitalsByName.set(name, { values: [], good: 0, needsImprovement: 0, poor: 0 })
    for (const v of vitals) {
        const bucket = vitalsByName.get(v.name)
        if (!bucket) continue
        bucket.values.push(v.value)
        if (v.rating === 'good') bucket.good += 1
        else if (v.rating === 'needs-improvement') bucket.needsImprovement += 1
        else if (v.rating === 'poor') bucket.poor += 1
    }
    function p75(values: number[]) {
        if (values.length === 0) return 0
        const sorted = [...values].sort((a, b) => a - b)
        return sorted[Math.floor(0.75 * (sorted.length - 1))]
    }
    const webVitals = VITAL_ORDER.map(name => {
        const b = vitalsByName.get(name)!
        const total = b.values.length
        return {
            name,
            p75: p75(b.values),
            total,
            good: b.good,
            needsImprovement: b.needsImprovement,
            poor: b.poor,
            goodPct: total > 0 ? (b.good / total) * 100 : 0,
            needsImprovementPct: total > 0 ? (b.needsImprovement / total) * 100 : 0,
            poorPct: total > 0 ? (b.poor / total) * 100 : 0,
        }
    })

    return (
        <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#14151F', fontFamily: "'Fraunces', serif" }}>
                    Analytics do Checkout
                </h1>
                <AnalyticsFilterForm currentFilter={currentFilter} fromDate={fromDate} toDate={toDate} />
            </div>

            <FunnelCharts funnel={funnel} breakdown={breakdown} totalPageViews={totalPageViews} kpis={kpis} dailyData={dailyData} webVitals={webVitals} />
        </div>
    )
}
