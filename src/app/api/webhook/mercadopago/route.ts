import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendConfirmationEmail, sendAdminNotification } from "@/app/actions";
import { checkRateLimit } from "@/lib/rate-limit";
import { createMpClient } from "@/lib/mercadopago";
import { Payment } from "mercadopago";
import crypto from "crypto";

function validateMpSignature(rawBody: string, req: NextRequest): boolean {
    const secret = process.env.MP_WEBHOOK_SECRET;
    if (!secret) return true;

    const xSignature = req.headers.get("x-signature");
    const xRequestId = req.headers.get("x-request-id");

    if (!xSignature || !xRequestId) {
        console.warn("[Webhook MP] Missing x-signature or x-request-id headers");
        return false;
    }

    const parts = Object.fromEntries(
        xSignature.split(",").map((part) => {
            const [key, ...rest] = part.split("=");
            return [key.trim(), rest.join("=").trim()] as [string, string];
        })
    );
    const ts = parts["ts"];
    const v1 = parts["v1"];
    if (!ts || !v1) {
        console.warn("[Webhook MP] Could not parse ts/v1 from x-signature");
        return false;
    }

    const manifest = `id:${req.headers.get("x-id") ?? ""};request-id:${xRequestId};ts:${ts};`;
    const expectedHash = crypto
        .createHmac("sha256", secret)
        .update(manifest)
        .digest("hex");

    try {
        return crypto.timingSafeEqual(
            Buffer.from(expectedHash, "hex"),
            Buffer.from(v1, "hex")
        );
    } catch {
        return false;
    }
}

export async function POST(req: NextRequest) {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
        || req.headers.get('x-real-ip')
        || 'unknown';
    const { limited } = checkRateLimit(`webhook:${ip}`, 60, 60_000);
    if (limited) {
        return NextResponse.json({ success: false, message: 'Rate limit exceeded' }, { status: 429 });
    }

    try {
        const rawBody = await req.text();

        if (!validateMpSignature(rawBody, req)) {
            console.warn("[Webhook MP] Invalid signature from IP:", ip);
            return NextResponse.json({ success: false, message: 'Invalid signature' }, { status: 401 });
        }

        let body: any;
        try {
            body = JSON.parse(rawBody);
        } catch {
            return NextResponse.json({ success: false, message: 'Invalid JSON' }, { status: 400 });
        }

        const url = new URL(req.url);
        const topic = url.searchParams.get("topic") || url.searchParams.get("type") || body.type;
        const idFromQuery = url.searchParams.get("data.id") || url.searchParams.get("id");
        console.log(`[Webhook MP] Topic: ${topic}, ID: ${idFromQuery}`);

        let paymentId = idFromQuery;

        if (!paymentId) {
            if (body.type === 'payment' && body.data?.id) {
                paymentId = body.data.id;
            } else if (body.topic === 'payment' && body.resource) {
                const parts = body.resource.split('/');
                paymentId = parts[parts.length - 1];
            } else if (body.action?.startsWith('payment.') && body.data?.id) {
                paymentId = body.data.id;
            }
        }

        if (!paymentId) {
            return NextResponse.json({ success: false, message: 'No payment id found' }, { status: 400 });
        }

        const client = createMpClient();
        const payment = new Payment(client);

        let mpResult: any = null;
        const MAX_RETRIES = 3;
        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                mpResult = await payment.get({ id: paymentId });
                break;
            } catch (mpErr: any) {
                const isRetryable = mpErr?.message?.includes('Premature close') ||
                    mpErr?.message?.includes('socket hang up') ||
                    mpErr?.message?.includes('ECONNRESET') ||
                    mpErr?.message?.includes('ETIMEDOUT');
                if (isRetryable && attempt < MAX_RETRIES) {
                    console.warn(`[Webhook MP] Attempt ${attempt} failed (${mpErr.message}), retrying...`);
                    await new Promise(r => setTimeout(r, attempt * 1000));
                    continue;
                }
                throw mpErr;
            }
        }

        if (!mpResult) {
            return NextResponse.json({ success: false, message: 'Payment not found in MP' }, { status: 404 });
        }

        const statusMap: Record<string, string> = {
            'approved': 'pago',
            'pending': 'aguardando',
            'in_process': 'aguardando',
            'authorized': 'aguardando',
            'in_mediation': 'aguardando',
            'rejected': 'recusado',
            'cancelled': 'recusado',
            'refunded': 'recusado',
            'charged_back': 'recusado'
        };

        const finalStatus = statusMap[mpResult.status || ''] || 'recusado';

        const order = await prisma.order.findFirst({
            where: {
                OR: [
                    { mpPaymentId: String(paymentId) },
                    { id: mpResult.external_reference || undefined }
                ]
            }
        });

        console.log(`[Webhook MP] Order ${order?.id || 'NOT FOUND'} for paymentId: ${paymentId} → ${finalStatus}`);

        if (order && order.paymentStatus !== finalStatus) {
            await prisma.order.update({
                where: { id: order.id },
                data: {
                    paymentStatus: finalStatus,
                    status: finalStatus === 'pago' ? 'processando' : order.status,
                    totalPrice: mpResult.transaction_amount ? Number(mpResult.transaction_amount) : undefined,
                    installments: mpResult.installments || null,
                    installmentAmount: (mpResult as any).transaction_details?.installment_amount || null,
                    cardBrand: mpResult.payment_method_id || null,
                    netReceived: (mpResult as any).transaction_details?.net_received_amount || null
                }
            });

            if (finalStatus === 'pago' && order.paymentStatus !== 'pago') {
                try { await sendConfirmationEmail(order.id); } catch (e) { }
                try { await sendAdminNotification('sale', order); } catch (e) { }
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[Webhook MP] Error:", error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
