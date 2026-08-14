import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

async function requireAdmin() {
    const cookieStore = await cookies()
    if (cookieStore.get('admin_auth')?.value !== 'authenticated') {
        throw new Error('Não autorizado')
    }
}

const ALLOWED_STATUSES = ['pendente', 'processando', 'aguardando_envio', 'cl_shopee', 'enviado', 'entregue', 'cancelado']

export async function GET() {
    try {
        await requireAdmin()
    } catch {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    try {
        const orders = await prisma.order.findMany({
            where: {
                paymentStatus: 'pago',
                status: 'processando',
                deletedAt: null,
            },
            select: {
                id: true,
                fullName: true,
                email: true,
                phone: true,
                cpf: true,
                cep: true,
                rua: true,
                numero: true,
                complemento: true,
                bairro: true,
                cidade: true,
                estado: true,
                recipient: true,
                referencia: true,
                paymentStatus: true,
                status: true,
                totalPrice: true,
                createdAt: true,
                product: { select: { name: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: 100,
        })

        return NextResponse.json({ orders })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function PATCH(request: Request) {
    try {
        await requireAdmin()
    } catch {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    try {
        const body = await request.json()
        const { orderId, status } = body

        if (!orderId || !status) {
            return NextResponse.json({ error: 'orderId e status são obrigatórios' }, { status: 400 })
        }

        if (!ALLOWED_STATUSES.includes(status)) {
            return NextResponse.json({ error: `Status inválido. Permitidos: ${ALLOWED_STATUSES.join(', ')}` }, { status: 400 })
        }

        await prisma.order.update({
            where: { id: orderId },
            data: { status },
        })

        return NextResponse.json({ success: true })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
