import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendConfirmationEmail, sendAdminNotification } from "@/app/actions";
import { checkRateLimit } from "@/lib/rate-limit";
import { WOOVI_STATUS_MAP } from "@/lib/woovi";

async function logError(level: string, source: string, message: string, stack?: string) {
    try {
        await prisma.errorLog.create({ data: { level, source, message: message.substring(0, 2000), stack: stack?.substring(0, 5000) || null, metadata: null } });
    } catch { }
}

async function processSubscriptionCharge(charge: any) {
    // charge.subscription = globalID da assinatura
    const globalID: string = charge.subscription;
    if (!globalID) return;

    const order = await prisma.order.findFirst({
        where: { mpPaymentId: globalID },
    });
    if (!order) {
        console.log(`[Webhook Woovi] Assinatura ${globalID} não encontrada`);
        return;
    }

    const parcelasPagas = (order.parcelasPagas ?? 0) + 1;
    const totalParcelas = order.totalParcelas ?? 4;
    const shouldCancel = parcelasPagas >= totalParcelas;

    await prisma.order.update({
        where: { id: order.id },
        data: { paymentStatus: 'pago', status: 'processando', parcelasPagas },
    });

    const isFirstCharge = (order.parcelasPagas ?? 0) === 0;
    if (isFirstCharge && order.paymentStatus !== 'pago') {
        try { await sendConfirmationEmail(order.id); } catch { }
        try { await sendAdminNotification(order); } catch { }
    }

    if (shouldCancel) {
        try {
            const { cancelSubscription } = await import('@/lib/woovi-subscription');
            await cancelSubscription(globalID);
            console.log(`[Webhook Woovi] Assinatura ${globalID} cancelada após ${parcelasPagas} parcelas.`);
        } catch (err) {
            console.error('[Webhook Woovi] Erro ao cancelar assinatura:', err);
        }
    }
}

async function processPixCharge(charge: any) {
    // Para PIX normal: correlationID = orderId
    const correlationID: string = charge.correlationID;
    const chargeStatus: string = charge.status;
    if (!correlationID) return;

    const finalStatus = WOOVI_STATUS_MAP[chargeStatus] || 'aguardando';
    const order = await prisma.order.findFirst({ where: { mpPaymentId: correlationID } });

    console.log(`[Webhook Woovi] PIX correlationID: ${correlationID}, status: ${chargeStatus} → ${finalStatus}`);

    if (!order || order.paymentStatus === finalStatus) return;

    await prisma.order.update({
        where: { id: order.id },
        data: {
            paymentStatus: finalStatus,
            status: finalStatus === 'pago' ? 'processando' : order.status,
        }
    });

    try {
        const fullOrder = await prisma.order.findUnique({ where: { id: order.id }, include: { product: true } });
        if (fullOrder) {
            const { uploadOrderBackup } = await import("@/lib/r2");
            await uploadOrderBackup(fullOrder);
        }
    } catch { }

    if (finalStatus === 'pago') {
        try { await sendConfirmationEmail(order.id); } catch { }
        try { await sendAdminNotification(order); } catch { }
    }
}

export async function POST(req: NextRequest) {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const { limited } = checkRateLimit(`webhook-woovi:${ip}`, 60, 60_000);
    if (limited) {
        return NextResponse.json({ success: false, message: 'Rate limit exceeded' }, { status: 429 });
    }

    let body: any;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ success: false, message: 'Invalid JSON' }, { status: 400 });
    }

    const event: string = body.event || '';
    const charge = body.charge || {};
    console.log(`[Webhook Woovi] event: ${event}, correlationID: ${charge.correlationID}, subscription: ${charge.subscription}`);

    // Responde 200 imediatamente — processa em background
    if (event === 'OPENPIX:CHARGE_COMPLETED') {
        const isSubscriptionCharge = !!charge.subscription;
        if (isSubscriptionCharge) {
            processSubscriptionCharge(charge).catch(err => {
                console.error('[Webhook Woovi] Erro ao processar parcela:', err);
                logError('error', 'webhook-woovi', err?.message || 'Erro', err?.stack);
            });
        } else {
            processPixCharge(charge).catch(err => {
                console.error('[Webhook Woovi] Erro ao processar PIX:', err);
                logError('error', 'webhook-woovi', err?.message || 'Erro', err?.stack);
            });
        }
    }

    return NextResponse.json({ success: true });
}
