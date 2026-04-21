import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { prisma } from "@/lib/prisma";
import { sendConfirmationEmail, sendAdminNotification } from "@/app/actions";
import { checkRateLimit } from "@/lib/rate-limit";
import crypto from "crypto";

/**
 * Validates the Mercado Pago webhook signature.
 * Docs: https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks#editor_13
 *
 * Only validates when MP_WEBHOOK_SECRET is set. If not set, skips validation
 * (backwards-compatible safe default).
 */
function validateMpSignature(req: NextRequest, rawDataId: string | null): boolean {
    const secret = process.env.MP_WEBHOOK_SECRET;
    if (!secret) return true; // Skip if secret not configured

    const xSignature = req.headers.get("x-signature");
    const xRequestId = req.headers.get("x-request-id");

    if (!xSignature || !xRequestId) return false;

    // Parse x-signature: "ts=<timestamp>,v1=<hash>"
    const parts = Object.fromEntries(
        xSignature.split(",").map((part) => part.split("=").map((s) => s.trim()) as [string, string])
    );
    const ts = parts["ts"];
    const v1 = parts["v1"];
    if (!ts || !v1) return false;

    // Build manifest
    const manifest = `id:${rawDataId ?? ""};request-id:${xRequestId};ts:${ts};`;

    // Compute HMAC-SHA256
    const expectedHash = crypto
        .createHmac("sha256", secret)
        .update(manifest)
        .digest("hex");

    return crypto.timingSafeEqual(
        Buffer.from(expectedHash, "hex"),
        Buffer.from(v1, "hex")
    );
}

export async function POST(req: NextRequest) {
    // ── Rate Limiting ─────────────────────────────────────────────────────
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
        || req.headers.get('x-real-ip')
        || 'unknown';
    const { limited } = checkRateLimit(`webhook:${ip}`, 60, 60_000);
    if (limited) {
        return NextResponse.json({ success: false, message: 'Rate limit exceeded' }, { status: 429 });
    }

    try {
        const url = new URL(req.url);
        const topic = url.searchParams.get("topic") || url.searchParams.get("type");
        const id = url.searchParams.get("data.id") || url.searchParams.get("id");
        console.log(`[Webhook MP] Topic: ${topic}, ID: ${id}`);

        let paymentId = id;

        // Tentar ler do body se não vier na URL
        let bodyForValidation: any = null;
        if (!paymentId) {
            try {
                bodyForValidation = await req.json();
                const body = bodyForValidation;
                if (body.type === 'payment' && body.data?.id) {
                    paymentId = body.data.id;
                } else if (body.topic === 'payment' && body.resource) {
                    const parts = body.resource.split('/');
                    paymentId = parts[parts.length - 1];
                } else if (body.action?.startsWith('payment.') && body.data?.id) {
                    paymentId = body.data.id;
                }
            } catch (e) {
                // Ignore json parse error
            }
        }

        // ── Signature Validation ────────────────────────────────────────────
        if (!validateMpSignature(req, paymentId)) {
            console.warn("Webhook signature validation failed for IP:", ip);
            return NextResponse.json({ success: false, message: 'Invalid signature' }, { status: 401 });
        }

        if (!paymentId) {
            return NextResponse.json({ success: false, message: 'No payment id found' }, { status: 400 });
        }

        const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN || '' });
        const payment = new Payment(client);

        try {
            const mpResult = await payment.get({ id: paymentId });

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

            // Find order
            const order = await prisma.order.findFirst({
                where: {
                    OR: [
                        { mpPaymentId: String(paymentId) },
                        { id: mpResult.external_reference || undefined }
                    ]
                }
            });

            console.log(`[Webhook MP] Find Order result - ID: ${order?.id || 'NOT FOUND'} for paymentId: ${paymentId}`);

            if (order) {
                if (order.paymentStatus !== finalStatus) {
                    await prisma.order.update({
                        where: { id: order.id },
                        data: {
                            paymentStatus: finalStatus,
                            status: finalStatus === 'pago' ? 'processando' : order.status,
                            installments: mpResult.installments || null,
                            installmentAmount: (mpResult as any).transaction_details?.installment_amount || null,
                            cardBrand: mpResult.payment_method_id || null,
                            netReceived: (mpResult as any).transaction_details?.net_received_amount || null
                        }
                    });

                    // Trigger emails if approved
                    if (finalStatus === 'pago' && order.paymentStatus !== 'pago') {
                        try {
                            await sendConfirmationEmail(order.id);
                        } catch (e) { }

                        try {
                            await sendAdminNotification('sale', order);
                        } catch (e) { }
                    }
                }
            }

            return NextResponse.json({ success: true });
        } catch (error) {
            console.error("Error fetching payment from MP:", error);
            return NextResponse.json({ success: false, error: 'Failed to fetch payment' }, { status: 500 });
        }
    } catch (e) {
        console.error("Webhook error:", e);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
