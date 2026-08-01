import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPixFollowupEmail } from "@/app/actions";
import { createMpClient } from "@/lib/mercadopago";
import { Payment } from "mercadopago";

// Cron job: envia e-mails de follow-up para PIX pendente
// Follow-up 1: 2 horas após criação
// Follow-up 2: 8 horas após criação
// Protegido por CRON_SECRET

export async function GET(req: NextRequest) {
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const now = new Date();
        const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
        const eightHoursAgo = new Date(now.getTime() - 8 * 60 * 60 * 1000);
        const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        // Buscar pedidos PIX pendentes (não pagos, não cancelados, criados nas últimas 24h)
        const pendingOrders = await prisma.order.findMany({
            where: {
                paymentMethod: 'pix',
                paymentStatus: { in: ['aguardando', 'processando'] },
                createdAt: { gte: twentyFourHoursAgo },
                deletedAt: null,
            },
            include: {
                emailLogs: {
                    where: { type: { in: ['pix_followup_1', 'pix_followup_2'] } },
                    select: { type: true },
                },
            },
        });

        if (pendingOrders.length === 0) {
            return NextResponse.json({ success: true, message: 'Nenhum PIX pendente', processed: 0 });
        }

        // Buscar QR codes do MP para os pedidos
        const client = createMpClient();
        const payment = new Payment(client);

        let sent1 = 0;
        let sent2 = 0;
        let errors = 0;

        for (const order of pendingOrders) {
            const sentTypes = order.emailLogs.map(l => l.type);
            const createdAt = new Date(order.createdAt);
            const ageMs = now.getTime() - createdAt.getTime();

            // Follow-up 1: entre 2h e 8h
            const needsFollowup1 = ageMs >= 2 * 60 * 60 * 1000 &&
                ageMs < 8 * 60 * 60 * 1000 &&
                !sentTypes.includes('pix_followup_1');

            // Follow-up 2: após 8h
            const needsFollowup2 = ageMs >= 8 * 60 * 60 * 1000 &&
                !sentTypes.includes('pix_followup_2');

            if (!needsFollowup1 && !needsFollowup2) continue;
            if (!order.mpPaymentId) continue;

            try {
                const mpResult = await payment.get({ id: order.mpPaymentId });
                const qrCode = mpResult.point_of_interaction?.transaction_data?.qr_code || null;
                const qrCodeBase64 = mpResult.point_of_interaction?.transaction_data?.qr_code_base64 || null;

                if (!qrCode || !qrCodeBase64) continue;

                // Verificar se MP já aprovou (dupla checagem)
                if (mpResult.status === 'approved') {
                    await prisma.order.update({
                        where: { id: order.id },
                        data: { paymentStatus: 'pago', status: 'processando' },
                    });
                    continue;
                }

                if (needsFollowup1) {
                    const result = await sendPixFollowupEmail(order.id, qrCode, qrCodeBase64, 1);
                    if (result.success) sent1++;
                    else errors++;
                } else if (needsFollowup2) {
                    const result = await sendPixFollowupEmail(order.id, qrCode, qrCodeBase64, 2);
                    if (result.success) sent2++;
                    else errors++;
                }
            } catch (err) {
                console.error(`[pix-followup] Error for order ${order.id}:`, err);
                errors++;
            }
        }

        return NextResponse.json({
            success: true,
            processed: pendingOrders.length,
            followup1_sent: sent1,
            followup2_sent: sent2,
            errors,
        });
    } catch (err) {
        console.error('[pix-followup] Fatal error:', err);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
