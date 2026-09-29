import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendConfirmationEmail, sendAdminNotification } from '@/app/actions';

const PAGARME_STATUS_MAP: Record<string, string> = {
    paid: 'pago',
    pending: 'aguardando',
    failed: 'recusado',
    canceled: 'recusado',
    payment_failed: 'recusado',
};

export async function POST(req: NextRequest) {
    let body: any;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const eventType: string = body?.type || '';
    const data = body?.data || {};

    console.log('[Pagar.me Webhook] event:', eventType, 'order:', data?.id);

    // order.paid, order.payment_failed, charge.paid, charge.payment_failed
    const isOrderEvent = eventType.startsWith('order.');
    const isChargeEvent = eventType.startsWith('charge.');

    if (!isOrderEvent && !isChargeEvent) {
        return NextResponse.json({ received: true });
    }

    // Extract internal order code: we set data.code = orderId when creating the order
    const pagarmeOrderId: string = data?.id || '';
    const orderCode: string = data?.code || ''; // our orderId
    const rawStatus: string = data?.status || '';

    const newPaymentStatus = PAGARME_STATUS_MAP[rawStatus] || null;

    // Find order in DB
    const order = orderCode
        ? await prisma.order.findUnique({ where: { id: orderCode } })
        : await prisma.order.findFirst({ where: { mpPaymentId: pagarmeOrderId } });

    if (!order) {
        console.warn('[Pagar.me Webhook] order not found for code:', orderCode, 'pagarmeId:', pagarmeOrderId);
        return NextResponse.json({ received: true });
    }

    // Idempotency: skip if already paid
    if (order.paymentStatus === 'pago') {
        return NextResponse.json({ received: true });
    }

    if (!newPaymentStatus) {
        return NextResponse.json({ received: true });
    }

    const charges = data?.charges || [];
    const lastTxn = charges?.[0]?.last_transaction;
    const installments: number | null = lastTxn?.installments || null;
    const installmentAmount: number | null = lastTxn?.amount
        ? lastTxn.amount / 100 / (installments || 1)
        : null;

    await prisma.order.update({
        where: { id: order.id },
        data: {
            paymentStatus: newPaymentStatus,
            status: newPaymentStatus === 'pago' ? 'processando' : undefined,
            mpPaymentId: pagarmeOrderId || order.mpPaymentId,
            installments: installments ?? undefined,
            installmentAmount: installmentAmount ?? undefined,
            paidAt: newPaymentStatus === 'pago' ? new Date() : undefined,
        },
    });

    if (newPaymentStatus === 'pago') {
        try { await sendConfirmationEmail(order.id); } catch (e) { console.error('[Pagar.me Webhook] email error', e); }
        try { await sendAdminNotification(order); } catch (e) { console.error('[Pagar.me Webhook] admin notify error', e); }

        try {
            const fullOrder = await prisma.order.findUnique({ where: { id: order.id }, include: { product: true } });
            if (fullOrder) {
                const { uploadOrderBackup } = await import('@/lib/r2');
                await uploadOrderBackup(fullOrder);
            }
        } catch (e) { console.error('[Pagar.me Webhook] R2 backup error', e); }
    }

    return NextResponse.json({ received: true });
}
