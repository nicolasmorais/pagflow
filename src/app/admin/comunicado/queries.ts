import { prisma } from '@/lib/prisma'
import { CARD_METHODS, REFUND_NOTICE_TYPE, REFUND_PRODUCTS } from './notice'

// Pago no cartão, ainda em processando, produto da lista.
// Também traz os que já viraram "reembolsado" depois de receber o comunicado.
export function findRefundOrders() {
    return prisma.order.findMany({
        where: {
            deletedAt: null,
            status: 'processando',
            paymentMethod: { in: CARD_METHODS },
            AND: [
                { OR: REFUND_PRODUCTS.map(p => ({ product: { name: { contains: p, mode: 'insensitive' as const } } })) },
                {
                    OR: [
                        { paymentStatus: 'pago' },
                        { paymentStatus: 'reembolsado', emailLogs: { some: { type: REFUND_NOTICE_TYPE, status: 'sent' } } },
                    ],
                },
            ],
        },
        select: {
            id: true,
            fullName: true,
            email: true,
            totalPrice: true,
            paymentMethod: true,
            paymentStatus: true,
            createdAt: true,
            product: { select: { name: true } },
            emailLogs: { where: { type: REFUND_NOTICE_TYPE }, select: { status: true, sentAt: true }, orderBy: { sentAt: 'desc' } },
        },
        orderBy: { createdAt: 'desc' },
    })
}
