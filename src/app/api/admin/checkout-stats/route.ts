import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { startOfDay, endOfDay, subHours } from 'date-fns'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const now = new Date()
        const startOfToday = startOfDay(now)
        const endOfToday = endOfDay(now)
        const last24h = subHours(now, 24)

        // 1. Funnel Stats (CheckoutAccess)
        const accessStats = await prisma.checkoutAccess.findMany({
            where: { createdAt: { gte: startOfToday } }
        })

        const funnel = {
            visits: accessStats.length,
            step1: accessStats.filter(a => a.step1Completed).length,
            step2: accessStats.filter(a => a.step2Completed).length,
            step3: accessStats.filter(a => a.step3Completed).length,
            completed: accessStats.filter(a => a.paymentCompleted).length
        }

        // 2. Orders Stats (Abandoned vs Paid)
        const todayOrders = await prisma.order.findMany({
            where: { createdAt: { gte: startOfToday } }
        })

        const orders = {
            total: todayOrders.length,
            paid: todayOrders.filter(o => o.status === 'pago').length,
            abandoned: todayOrders.filter(o => o.paymentStatus === 'abandonado').length,
            pending: todayOrders.filter(o => o.status === 'pendente' && o.paymentStatus !== 'abandonado').length
        }

        // 3. Exit Popup Stats
        const popupEvents = await prisma.exitPopupEvent.findMany({
            where: { createdAt: { gte: startOfToday } }
        })

        const antifuga = {
            shown: popupEvents.filter(e => e.event === 'shown').length,
            accepted: popupEvents.filter(e => e.event === 'accepted').length,
            declined: popupEvents.filter(e => e.event === 'declined').length,
            expired: popupEvents.filter(e => e.event === 'expired').length
        }

        // 4. Recent Feed
        const recentAccess = await prisma.checkoutAccess.findMany({
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: {
                // Se houvesse relação com produto, traríamos aqui
            }
        })

        // Fake/Simplified activity log based on available data
        const activities = [
            ...recentAccess.map(a => ({
                id: a.id,
                type: 'access',
                step: a.paymentCompleted ? 'Finalizado' : a.step3Completed ? 'Pagamento' : a.step2Completed ? 'Entrega' : a.step1Completed ? 'Dados Pessoais' : 'Entrou',
                time: a.createdAt,
            })),
            ...popupEvents.slice(0, 5).map(e => ({
                id: e.id,
                type: 'antifuga',
                event: e.event,
                time: e.createdAt,
            }))
        ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 15)

        return NextResponse.json({
            funnel,
            orders,
            antifuga,
            activities,
            lastUpdate: now.toISOString()
        })
    } catch (error) {
        console.error('Monitor API Error:', error)
        return NextResponse.json({ error: 'Failed to fetch monitor stats' }, { status: 500 })
    }
}
