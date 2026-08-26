import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

async function requireAdmin() {
    const cookieStore = await cookies()
    if (cookieStore.get('admin_auth')?.value !== 'authenticated') {
        throw new Error('Não autorizado')
    }
}

const ALLOWED_STATUSES = ['pendente', 'processando', 'aguardando_envio', 'cl_shopee', 'enviado', 'entregue', 'cancelado', 'rastreio_enviado']

export async function GET(request: Request) {
    try {
        await requireAdmin()
    } catch {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    try {
        const { searchParams } = new URL(request.url)
        const from = searchParams.get('from')
        const to = searchParams.get('to')

        const statusFilter = searchParams.get('status') || 'processando'

        const where: any = {
            status: statusFilter,
            deletedAt: null,
        }

        if (from || to) {
            where.createdAt = {}
            if (from) {
                where.createdAt.gte = new Date(from + 'T00:00:00')
            }
            if (to) {
                where.createdAt.lte = new Date(to + 'T23:59:59')
            }
        }

        const orders = await prisma.order.findMany({
            where,
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
                trackingCode: true,
                trackingUrl: true,
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

        const updated = await prisma.order.update({
            where: { id: orderId },
            data: { status },
            include: { product: true },
        })

        // Backup R2
        try {
            const { uploadOrderBackup } = await import("@/lib/r2")
            await uploadOrderBackup(updated)
        } catch (r2Err) {
            console.error("[extension-orders] Erro no backup R2:", r2Err)
        }

        return NextResponse.json({ success: true })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function PUT(request: Request) {
    try {
        await requireAdmin()
    } catch {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    try {
        const body = await request.json()
        const { orderId, trackingCode, trackingUrl } = body

        if (!orderId) {
            return NextResponse.json({ error: 'orderId é obrigatório' }, { status: 400 })
        }

        const updateData: any = {}
        if (trackingCode !== undefined) updateData.trackingCode = trackingCode
        if (trackingUrl !== undefined) updateData.trackingUrl = trackingUrl
        // Ao enviar rastreio pela extensao, atualiza status automaticamente
        if (trackingCode && trackingCode.trim() !== '') {
            updateData.status = 'rastreio_enviado'
        }

        const updated = await prisma.order.update({
            where: { id: orderId },
            data: updateData,
            include: { product: true },
        })

        // Backup R2
        try {
            const { uploadOrderBackup } = await import("@/lib/r2")
            await uploadOrderBackup(updated)
        } catch (r2Err) {
            console.error("[extension-orders] Erro no backup R2:", r2Err)
        }

        return NextResponse.json({ success: true })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
