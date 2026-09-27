import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendConfirmationEmail, sendAdminNotification } from "@/app/actions";
import { checkRateLimit } from "@/lib/rate-limit";
import { SYNC_STATUS_MAP } from "@/lib/sync";

async function logError(level: string, source: string, message: string, stack?: string, metadata?: Record<string, any>) {
    try {
        await prisma.errorLog.create({ data: { level, source, message: message.substring(0, 2000), stack: stack?.substring(0, 5000) || null, metadata: metadata ? JSON.stringify(metadata).substring(0, 2000) : null } });
    } catch { }
}

async function processSubscriptionEvent(body: any) {
    const event = body.event as string;
    const eventId = body.event_id as string | undefined;

    // Idempotência — ignora evento já processado
    if (eventId) {
        try {
            await prisma.webhookEvent.create({ data: { eventId, event } });
        } catch {
            console.log(`[Webhook Sync] Evento ${eventId} já processado, ignorando.`);
            return;
        }
    }

    const mandateId = body.mandate_id || body.subscription?.mandate_id;
    const subscriptionToken = body.subscription_token || body.subscription?.subscription_token;

    console.log(`[Webhook Sync] Subscription event: ${event}, mandateId: ${mandateId}, subscriptionToken: ${subscriptionToken}`);

    // Busca pedido por subscription_token (mpPaymentId) OU mandate_id
    let order = subscriptionToken
        ? await prisma.order.findFirst({ where: { mpPaymentId: subscriptionToken } })
        : null;
    if (!order && mandateId) {
        order = await prisma.order.findFirst({ where: { subscriptionMandateId: mandateId } });
    }

    if (!order) {
        console.log(`[Webhook Sync] Pedido não encontrado para evento ${event}`);
        return;
    }

    let newPaymentStatus = order.paymentStatus;
    let newStatus = order.status;
    let parcelasPagas = order.parcelasPagas ?? 0;
    let shouldCancel = false;
    let sendEmail = false;

    switch (event) {
        case 'assinatura_ativada':
            newPaymentStatus = 'pago';
            newStatus = 'processando';
            sendEmail = order.paymentStatus !== 'pago';
            break;

        case 'cobranca_paga':
        case 'assinatura_renovada':
            parcelasPagas += 1;
            newPaymentStatus = 'pago';
            newStatus = 'processando';
            sendEmail = event === 'cobranca_paga' && order.paymentStatus !== 'pago';
            if (parcelasPagas >= (order.totalParcelas ?? 4)) {
                shouldCancel = true;
            }
            break;

        case 'assinatura_em_atraso':
            newPaymentStatus = 'aguardando';
            break;

        case 'assinatura_cancelada':
            newPaymentStatus = 'recusado';
            break;
    }

    await prisma.order.update({
        where: { id: order.id },
        data: { paymentStatus: newPaymentStatus, status: newStatus, parcelasPagas }
    });

    if (sendEmail) {
        try { await sendConfirmationEmail(order.id); } catch { }
        try { await sendAdminNotification(order); } catch { }
    }

    if (shouldCancel) {
        const token = subscriptionToken || order.mpPaymentId;
        if (token) {
            try {
                const { cancelSubscription } = await import('@/lib/sync-subscription');
                await cancelSubscription(token);
                console.log(`[Webhook Sync] Assinatura ${token} cancelada após ${parcelasPagas} parcelas.`);
            } catch (err) {
                console.error('[Webhook Sync] Erro ao cancelar assinatura:', err);
            }
        }
    }
}

async function processPixEvent(body: any) {
    const identifier = body.transaction?.reference_id;
    const rawStatus = body.transaction?.status;
    const amount = body.transaction?.amount;

    console.log(`[Webhook Sync] PIX id: ${identifier}, status: ${rawStatus}`);

    if (!identifier) return;

    const finalStatus = SYNC_STATUS_MAP[rawStatus] || 'aguardando';
    const order = await prisma.order.findFirst({ where: { mpPaymentId: identifier } });

    console.log(`[Webhook Sync] Order ${order?.id || 'NOT FOUND'} → ${finalStatus}`);

    if (order && order.paymentStatus !== finalStatus) {
        await prisma.order.update({
            where: { id: order.id },
            data: {
                paymentStatus: finalStatus,
                status: finalStatus === 'pago' ? 'processando' : order.status,
                totalPrice: amount ? Number(amount) : undefined,
            }
        });

        try {
            const fullOrder = await prisma.order.findUnique({ where: { id: order.id }, include: { product: true } });
            if (fullOrder) {
                const { uploadOrderBackup } = await import("@/lib/r2");
                await uploadOrderBackup(fullOrder);
            }
        } catch (r2Err) {
            console.error("[Webhook Sync] Erro no backup R2:", r2Err);
        }

        if (finalStatus === 'pago' && order.paymentStatus !== 'pago') {
            try { await sendConfirmationEmail(order.id); } catch { }
            try { await sendAdminNotification(order); } catch { }
        }
    }
}

export async function POST(req: NextRequest) {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
        || req.headers.get('x-real-ip')
        || 'unknown';
    const { limited } = checkRateLimit(`webhook-sync:${ip}`, 60, 60_000);
    if (limited) {
        return NextResponse.json({ success: false, message: 'Rate limit exceeded' }, { status: 429 });
    }

    let body: any;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ success: false, message: 'Invalid JSON' }, { status: 400 });
    }

    if (body.test === true) {
        console.log('[Webhook Sync] Payload de teste recebido, ignorando.');
        return NextResponse.json({ success: true });
    }

    const event = body.event as string || '';
    console.log(`[Webhook Sync] event: ${event}`);

    // Responde 200 imediatamente — Sync tem timeout de 5s
    // Processa em background (fire and forget)
    if (event.startsWith('assinatura') || event.startsWith('cobranca')) {
        processSubscriptionEvent(body).catch(err => {
            console.error('[Webhook Sync] Erro ao processar subscription event:', err);
            logError('error', 'webhook-sync', err?.message || 'Erro', err?.stack);
        });
    } else {
        processPixEvent(body).catch(err => {
            console.error('[Webhook Sync] Erro ao processar PIX event:', err);
            logError('error', 'webhook-sync', err?.message || 'Erro', err?.stack);
        });
    }

    return NextResponse.json({ success: true });
}
