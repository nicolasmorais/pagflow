'use server'

import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { resend } from '@/lib/resend'
import { buildRefundNotice, CARD_METHODS, REFUND_NOTICE_TYPE, REFUND_PRODUCTS } from './template'

async function requireAdmin() {
    const cookieStore = await cookies()
    if (cookieStore.get('admin_auth')?.value !== 'authenticated') {
        throw new Error('Não autorizado')
    }
}

// Mesmo filtro da página: pago no cartão, ainda em processando, produto da lista
export async function findRefundOrders() {
    await requireAdmin()
    return prisma.order.findMany({
        where: {
            deletedAt: null,
            paymentStatus: 'pago',
            status: 'processando',
            paymentMethod: { in: CARD_METHODS },
            OR: REFUND_PRODUCTS.map(p => ({ product: { name: { contains: p, mode: 'insensitive' as const } } })),
        },
        select: {
            id: true,
            fullName: true,
            email: true,
            totalPrice: true,
            paymentMethod: true,
            createdAt: true,
            product: { select: { name: true } },
            emailLogs: { where: { type: REFUND_NOTICE_TYPE }, select: { status: true, sentAt: true }, orderBy: { sentAt: 'desc' } },
        },
        orderBy: { createdAt: 'desc' },
    })
}

const MAX_PER_CALL = 10

export async function sendRefundNotices(orderIds: string[], descriptor: string) {
    await requireAdmin()
    if (!Array.isArray(orderIds) || orderIds.length === 0) return { results: [] }
    if (orderIds.length > MAX_PER_CALL) throw new Error(`Envie no máximo ${MAX_PER_CALL} por vez`)

    // Revalida no servidor: só envia para pedidos que ainda batem com o filtro
    const eligible = new Map((await findRefundOrders()).map(o => [o.id, o]))
    const results: { orderId: string; status: 'sent' | 'skipped' | 'error'; error?: string }[] = []

    for (const orderId of orderIds) {
        const order = eligible.get(orderId)
        if (!order) {
            results.push({ orderId, status: 'skipped', error: 'Pedido fora do filtro (status ou pagamento mudou)' })
            continue
        }
        if (order.emailLogs.some(l => l.status === 'sent')) {
            results.push({ orderId, status: 'skipped', error: 'Já recebeu o comunicado' })
            continue
        }
        if (!order.email) {
            results.push({ orderId, status: 'skipped', error: 'Pedido sem e-mail' })
            continue
        }

        const { subject, html } = buildRefundNotice(order.fullName, descriptor)
        let error: string | null = null
        try {
            const res = await resend.emails.send({
                from: 'Elabela Store <noreply@elabela.store>',
                to: [order.email],
                subject,
                html,
            })
            if (res.error) error = JSON.stringify(res.error)
        } catch (e: any) {
            error = e?.message || 'Falha no envio'
        }

        try {
            await prisma.emailLog.create({
                data: { orderId, type: REFUND_NOTICE_TYPE, status: error ? 'error' : 'sent', error },
            })
        } catch (logErr) {
            console.error('[comunicado] Falha ao registrar log:', logErr)
        }

        results.push(error ? { orderId, status: 'error', error } : { orderId, status: 'sent' })
        // Respeita o limite de envio do Resend
        await new Promise(r => setTimeout(r, 600))
    }

    return { results }
}
