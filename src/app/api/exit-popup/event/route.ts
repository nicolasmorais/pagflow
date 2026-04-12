import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { event, productId } = body

        const validEvents = ['shown', 'accepted', 'declined', 'expired']
        if (!event || !validEvents.includes(event)) {
            return NextResponse.json({ error: 'Invalid event type' }, { status: 400 })
        }

        const p: any = prisma
        await p.exitPopupEvent.create({
            data: {
                event,
                productId: productId || null,
            }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('ExitPopup event POST error:', error)
        return NextResponse.json({ error: 'Failed to record event' }, { status: 500 })
    }
}
