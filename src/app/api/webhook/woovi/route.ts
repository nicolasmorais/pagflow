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

// PIX_AUTOMATIC_APPROVED — cliente autorizou + pagou P1 (Jornada 3)
async function handleApproved(body: any) {
    const globalID: string = body.globalID || body.subscriptionGlobalID;
    const correlationID: string = body.correlationID;

    const order = await prisma.order.findFirst({
        where: {
            OR: [
                { mpPaymentId: globalID },
                { id: correlationID },
            ],
        },
    });
    if (!order) {
        console.log(`[Webhook Woovi] APPROVED — assinatura ${globalID} não encontrada`);
        return;
    }

    await prisma.order.update({
        where: { id: order.id },
        data: { paymentStatus: 'pago', status: 'processando', parcelasPagas: 1, mpPaymentId: globalID },
    });

    try { await sendConfirmationEmail(order.id); } catch { }
    try { await sendAdminNotification(order); } catch { }

    console.log(`[Webhook Woovi] APPROVED — pedido ${order.id}, parcelasPagas=1`);
}

// PIX_AUTOMATIC_COBR_COMPLETED — parcela P2, P3... paga
async function handleCobrCompleted(body: any) {
    const globalID: string = body.globalID || body.subscriptionGlobalID;
    const installmentNumber: number = body.installmentNumber ?? 0;

    const order = await prisma.order.findFirst({ where: { mpPaymentId: globalID } });
    if (!order) {
        console.log(`[Webhook Woovi] COBR_COMPLETED — assinatura ${globalID} não encontrada`);
        return;
    }

    const parcelasPagas = Math.max(order.parcelasPagas ?? 0, installmentNumber);
    const totalParcelas = order.totalParcelas ?? 4;

    await prisma.order.update({
        where: { id: order.id },
        data: { parcelasPagas },
    });

    // Auto-cancela se terminou
    if (parcelasPagas >= totalParcelas) {
        try {
            const { cancelSubscription } = await import('@/lib/woovi-subscription');
            await cancelSubscription(globalID);
            console.log(`[Webhook Woovi] Assinatura ${globalID} concluída após ${parcelasPagas} parcelas.`);
        } catch (err) {
            console.error('[Webhook Woovi] Erro ao cancelar assinatura concluída:', err);
        }
    }

    console.log(`[Webhook Woovi] COBR_COMPLETED — pedido ${order.id}, parcela ${installmentNumber}, total pago=${parcelasPagas}/${totalParcelas}`);
}

// PIX_AUTOMATIC_COBR_REJECTED — parcela rejeitada (sem saldo)
async function handleCobrRejected(body: any) {
    const globalID: string = body.globalID || body.subscriptionGlobalID;
    const installmentNumber: number = body.installmentNumber ?? 0;
    console.log(`[Webhook Woovi] COBR_REJECTED — assinatura ${globalID}, parcela ${installmentNumber}`);
    // Apenas log; sem ação crítica por parcela rejeitada isolada
}

// PIX_AUTOMATIC_REJECTED — cliente cancelou no banco (assinatura toda)
async function handleRejected(body: any) {
    const globalID: string = body.globalID || body.subscriptionGlobalID;
    const correlationID: string = body.correlationID;

    const order = await prisma.order.findFirst({
        where: {
            OR: [
                { mpPaymentId: globalID },
                { id: correlationID },
            ],
        },
    });
    if (!order) {
        console.log(`[Webhook Woovi] REJECTED — assinatura ${globalID} não encontrada`);
        return;
    }

    await prisma.order.update({
        where: { id: order.id },
        data: { paymentStatus: 'recusado' },
    });

    console.log(`[Webhook Woovi] REJECTED — pedido ${order.id} marcado como recusado`);
}

// OPENPIX:CHARGE_COMPLETED — PIX normal (não assinatura)
async function handlePixCharge(charge: any) {
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
    console.log(`[Webhook Woovi] event: ${event}`, JSON.stringify(body).substring(0, 300));

    // Responde 200 imediatamente — processa em background
    switch (event) {
        case 'PIX_AUTOMATIC_APPROVED':
            handleApproved(body).catch(err => {
                console.error('[Webhook Woovi] Erro APPROVED:', err);
                logError('error', 'webhook-woovi', err?.message || 'Erro', err?.stack);
            });
            break;

        case 'PIX_AUTOMATIC_COBR_COMPLETED':
            handleCobrCompleted(body).catch(err => {
                console.error('[Webhook Woovi] Erro COBR_COMPLETED:', err);
                logError('error', 'webhook-woovi', err?.message || 'Erro', err?.stack);
            });
            break;

        case 'PIX_AUTOMATIC_COBR_REJECTED':
            handleCobrRejected(body).catch(err => {
                console.error('[Webhook Woovi] Erro COBR_REJECTED:', err);
            });
            break;

        case 'PIX_AUTOMATIC_REJECTED':
            handleRejected(body).catch(err => {
                console.error('[Webhook Woovi] Erro REJECTED:', err);
                logError('error', 'webhook-woovi', err?.message || 'Erro', err?.stack);
            });
            break;

        case 'OPENPIX:CHARGE_COMPLETED': {
            const charge = body.charge || {};
            if (!charge.subscription) {
                handlePixCharge(charge).catch(err => {
                    console.error('[Webhook Woovi] Erro PIX:', err);
                    logError('error', 'webhook-woovi', err?.message || 'Erro', err?.stack);
                });
            }
            break;
        }

        default:
            console.log(`[Webhook Woovi] Evento ignorado: ${event}`);
    }

    return NextResponse.json({ success: true });
}
