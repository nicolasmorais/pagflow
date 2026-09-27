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

    // Validação do segredo: Authorization: Bearer <secret>
    const secret = process.env.SYNC_WEBHOOK_SECRET;
    if (secret) {
        const auth = req.headers.get('authorization')?.replace('Bearer ', '').trim();
        if (auth !== secret) {
            console.warn('[Webhook Sync] Segredo inválido, IP:', ip);
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }
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

        // Sync payload (flat): { id, status, amount (BRL), final_amount, pix_code, ... }
        const identifier = body.id;
        const rawStatus = body.status;
        const amount = body.amount;

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

            // Backup R2
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
