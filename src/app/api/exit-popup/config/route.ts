import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

async function getOrCreateConfig() {
    const p: any = prisma
    const model = p.exitPopupConfig

    if (!model) {
        throw new Error("Prisma client stale. Please restart server.")
    }

    let config = await model.findFirst()
    if (!config) {
        config = await model.create({
            data: { isEnabled: true, discountPct: 50, timerSeconds: 480 }
        })
    }
    return config
}

export async function GET() {
    try {
        const config = await getOrCreateConfig()
        return NextResponse.json(config)
    } catch (error) {
        console.error('ExitPopup config GET error:', error)
        return NextResponse.json({ error: 'Failed to fetch config' }, { status: 500 })
    }
}

export async function PUT(req: NextRequest) {
    try {
        const body = await req.json()
        const config = await getOrCreateConfig()
        const updated = await prisma.exitPopupConfig.update({
            where: { id: config.id },
            data: {
                isEnabled: body.isEnabled ?? config.isEnabled,
                discountPct: body.discountPct ?? config.discountPct,
                timerSeconds: body.timerSeconds ?? config.timerSeconds,
            }
        })
        return NextResponse.json(updated)
    } catch (error) {
        console.error('ExitPopup config PUT error:', error)
        return NextResponse.json({ error: 'Failed to update config' }, { status: 500 })
    }
}
