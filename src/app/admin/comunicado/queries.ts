import { prisma } from '@/lib/prisma'
import { CARD_METHODS, REFUND_NOTICE_TYPE, REFUND_PRODUCTS } from './notice'

// Pago no cartão, ainda em processando, produto da lista
export function findRefundOrders() {
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
