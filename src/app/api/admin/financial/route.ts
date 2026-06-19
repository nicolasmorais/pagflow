export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    const where: any = {}
    if (from || to) {
        where.date = {}
        if (from) where.date.gte = new Date(from)
        if (to) where.date.lte = new Date(to + 'T23:59:59')
    }

    const records = await prisma.financialRecord.findMany({
        where,
        orderBy: { date: 'desc' },
    })

    return NextResponse.json(records)
}

export async function POST(req: NextRequest) {
    const body = await req.json()
    const { type, category, description, amount, date } = body

    if (!type || !category || !description || amount === undefined) {
        return NextResponse.json({ error: 'Campos obrigatórios não preenchidos' }, { status: 400 })
    }

    const record = await prisma.financialRecord.create({
        data: {
            type,
            category,
            description,
            amount: parseFloat(amount),
            date: date ? new Date(date) : new Date(),
        },
    })

    return NextResponse.json(record)
}

export async function DELETE(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
        return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })
    }

    await prisma.financialRecord.delete({ where: { id } })

    return NextResponse.json({ ok: true })
}
