export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import AntiFugaClient from './AntiFugaClient'

export default async function AntiFugaPage() {
    // Load config
    let config: any = await prisma.exitPopupConfig.findFirst()
    if (!config) {
        config = await prisma.exitPopupConfig.create({
            data: { isEnabled: true, discountPct: 50, timerSeconds: 480 }
        })
    }

    // Analytics: aggregate events
    const [shown, accepted, declined, expired] = await Promise.all([
        prisma.exitPopupEvent.count({ where: { event: 'shown' } }),
        prisma.exitPopupEvent.count({ where: { event: 'accepted' } }),
        prisma.exitPopupEvent.count({ where: { event: 'declined' } }),
        prisma.exitPopupEvent.count({ where: { event: 'expired' } }),
    ])

    // Last 7 days breakdown
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const recentEvents = await prisma.exitPopupEvent.findMany({
        where: { createdAt: { gte: sevenDaysAgo } },
        orderBy: { createdAt: 'asc' },
    })

    // Build daily map
    const dailyMap: Record<string, { shown: number; accepted: number }> = {}
    for (let i = 6; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        const key = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'America/Sao_Paulo' })
        dailyMap[key] = { shown: 0, accepted: 0 }
    }

    for (const ev of recentEvents) {
        const key = ev.createdAt.toLocaleDateString('pt-BR', {
            day: '2-digit', month: '2-digit', timeZone: 'America/Sao_Paulo'
        })
        if (!dailyMap[key]) dailyMap[key] = { shown: 0, accepted: 0 }
        if (ev.event === 'shown') dailyMap[key].shown++
        if (ev.event === 'accepted') dailyMap[key].accepted++
    }

    const chartData = Object.entries(dailyMap).map(([date, d]) => ({ date, ...d }))

    return (
        <AntiFugaClient
            config={config}
            stats={{ shown, accepted, declined, expired }}
            chartData={chartData}
        />
    )
}
