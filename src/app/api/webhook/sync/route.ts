import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendConfirmationEmail, sendAdminNotification } from "@/app/actions";
import { checkRateLimit } from "@/lib/rate-limit";
import { SYNC_STATUS_MAP } from "@/lib/sync";

async function logError(level: string, source: string, message: string, stack?: string, metadata?: Record<string, any>) {
    try {
        const { prisma: p } = await import("@/lib/prisma");
        await p.errorLog.create({ data: { level, source, message: message.substring(0, 2000), stack: stack?.substring(0, 5000) || null, metadata: metadata ? JSON.stringify(metadata).substring(0, 2000) : null } });
    } catch { }
}

export async function POST(req: NextRequest) {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
        || req.headers.get('x-real-ip')
        || 'unknown';
    const { limited } = checkRateLimit(`webhook-sync:${ip}`, 60, 60_000);
    if (limited) {
        return NextResponse.json({ success: false, message: 'Rate limit exceeded' }, { status: 429 });
    }

    try {
        let body: any;
        try {
            body = await req.json();
        } catch {
            return NextResponse.json({ success: false, message: 'Invalid JSON' }, { status: 400 });
        }

        // Payload de teste da Sync — responde 200 sem processar
        if (body.test === true) {
            console.log('[Webhook Sync] Payload de teste recebido, ignorando.');
            return NextResponse.json({ success: true });
        }

        const event = body.event as string || '';
        console.log(`[Webhook Sync] event: ${event}`);

        // ── Eventos de ASSINATURA ────────────────────────────────────────────
        if (event.startsWith('assinatura') || event.startsWith('cobranca')) {
            const mandateId = body.mandate_id || body.subscription?.mandate_id;
            const subscriptionToken = body.subscription_token || body.subscription?.subscription_token;
            const subscriptionEvent = event;

            console.log(`[Webhook Sync] Subscription event: ${subscriptionEvent}, mandateId: ${mandateId}`);

            if (mandateId) {
                const order = await prisma.order.findFirst({
                    where: { subscriptionMandateId: mandateId }
                });

                if (order) {
                    let newPaymentStatus = order.paymentStatus;
                    let newStatus = order.status;
                    let parcelasPagas = order.parcelasPagas ?? 0;
                    let shouldCancel = false;

                    if (subscriptionEvent === 'cobranca_paga') {
                        parcelasPagas += 1;
                        newPaymentStatus = 'pago';
                        newStatus = 'processando';
                        const total = order.totalParcelas ?? 4;
                        if (parcelasPagas >= total) {
                            shouldCancel = true;
                        }
                    } else if (subscriptionEvent === 'assinatura_ativada') {
                        newPaymentStatus = 'pago';
                        newStatus = 'processando';
                    } else if (subscriptionEvent === 'assinatura_cancelada') {
                        newPaymentStatus = 'recusado';
                    } else if (subscriptionEvent === 'assinatura_em_atraso') {
                        newPaymentStatus = 'aguardando';
                    }

                    const wasAlreadyPaid = order.paymentStatus === 'pago';
                    await prisma.order.update({
                        where: { id: order.id },
                        data: { paymentStatus: newPaymentStatus, status: newStatus, parcelasPagas }
                    });

                    if (subscriptionEvent === 'cobranca_paga' && !wasAlreadyPaid) {
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
                            } catch (cancelErr) {
                                console.error('[Webhook Sync] Erro ao cancelar assinatura:', cancelErr);
                            }
                        }
                    }
                }
            }
            return NextResponse.json({ success: true });
        }

        // ── Eventos de TRANSAÇÃO PIX normal ─────────────────────────────────
        const identifier = body.transaction?.reference_id;
        const rawStatus = body.transaction?.status;
        const amount = body.transaction?.amount;

        console.log(`[Webhook Sync] id: ${identifier}, status: ${rawStatus}`);

        if (!identifier) {
            return NextResponse.json({ success: false, message: 'No identifier found' }, { status: 400 });
        }

        const finalStatus = SYNC_STATUS_MAP[rawStatus] || 'aguardando';

        const order = await prisma.order.findFirst({
            where: { mpPaymentId: identifier }
        });

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
                const fullOrder = await prisma.order.findUnique({
                    where: { id: order.id },
                    include: { product: true }
                });
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

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[Webhook Sync] Error:", error);
        logError('error', 'webhook-sync', error instanceof Error ? error.message : 'Webhook Sync error', error instanceof Error ? error.stack : undefined);

        try {
            const { sendAdminPush } = await import("@/lib/push-service");
            await sendAdminPush(
                "❌ Erro no Webhook Sync",
                `Webhook Sync falhou: ${(error instanceof Error ? error.message : 'Erro desconhecido').substring(0, 100)}`,
                "/admin/errors"
            );
        } catch { }

        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
