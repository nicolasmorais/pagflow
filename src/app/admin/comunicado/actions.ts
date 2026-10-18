'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { resend } from '@/lib/resend'
import { findRefundOrders } from './queries'
import { buildRefundNotice, fixEmail, REFUND_NOTICE_TYPE } from './notice'

async function requireAdmin() {
    const cookieStore = await cookies()
    if (cookieStore.get('admin_auth')?.value !== 'authenticated') {
        throw new Error('Não autorizado')
    }
}

const MAX_PER_CALL = 10

// Pagamento do pedido vira "reembolsado" depois que o cliente recebe o comunicado
async function markRefunded(orderId: string) {
    const updated = await prisma.order.update({
        where: { id: orderId },
        data: { paymentStatus: 'reembolsado' },
        include: { product: true },
    })
    try {
        const { uploadOrderBackup } = await import('@/lib/r2')
        await uploadOrderBackup(updated)
    } catch (r2Err) {
        console.error('[comunicado] Erro no backup R2:', r2Err)
    }
}

// Para quem recebeu o comunicado antes dessa regra existir
export async function markSentAsRefunded() {
    await requireAdmin()
    const pending = (await findRefundOrders()).filter(
        o => o.paymentStatus === 'pago' && o.emailLogs.some(l => l.status === 'sent')
    )
    let updated = 0
    for (const o of pending) {
        try {
            await markRefunded(o.id)
            updated++
        } catch (e) {
            console.error('[comunicado] Falha ao marcar reembolsado:', o.id, e)
        }
    }
    revalidatePath('/admin/comunicado')
    revalidatePath('/admin/pedidos')
    return { updated, total: pending.length }
}

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
                to: [fixEmail(order.email)],
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

        if (!error) {
            try {
                await markRefunded(orderId)
            } catch (e) {
                console.error('[comunicado] E-mail enviado, mas falhou ao marcar reembolsado:', orderId, e)
            }
        }

        results.push(error ? { orderId, status: 'error', error } : { orderId, status: 'sent' })
        // Respeita o limite de envio do Resend
        await new Promise(r => setTimeout(r, 600))
    }

    revalidatePath('/admin/pedidos')
    return { results }
}
