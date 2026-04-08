import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { prisma } from "@/lib/prisma";
import { sendConfirmationEmail, sendAdminNotification } from "@/app/actions";

export async function POST(req: NextRequest) {
    try {
        const url = new URL(req.url);
        const topic = url.searchParams.get("topic") || url.searchParams.get("type");
        const id = url.searchParams.get("data.id") || url.searchParams.get("id");

        let paymentId = id;

        // Tentar ler do body se não vier na URL
        if (!paymentId) {
            try {
                const body = await req.json();
                if (body.type === 'payment' && body.data?.id) {
                    paymentId = body.data.id;
                } else if (body.topic === 'payment' && body.resource) {
                    // O resource vem como /collections/notifications/... ou algo assim, extrair ID
                    const parts = body.resource.split('/');
                    paymentId = parts[parts.length - 1];
                } else if (body.action?.startsWith('payment.') && body.data?.id) {
                    paymentId = body.data.id;
                }
            } catch (e) {
                // Ignore json parse error
            }
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
