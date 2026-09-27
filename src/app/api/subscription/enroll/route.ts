import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { enrollSubscription, createSubscriptionPlan } from "@/lib/sync-subscription";
import { checkRateLimit } from "@/lib/rate-limit";

const TOTAL_PARCELAS = 4;

export async function POST(req: NextRequest) {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const { limited } = checkRateLimit(`subscription:${ip}`, 5, 60_000);
    if (limited) {
        return NextResponse.json({ success: false, error: 'Muitas tentativas.' }, { status: 429 });
    }

    try {
        const body = await req.json();
        const { productId, orderData, orderId } = body;

        const product = await prisma.product.findUnique({ where: { id: productId } });
        if (!product) return NextResponse.json({ success: false, error: 'Produto não encontrado.' }, { status: 404 });
        if (!product.subscriptionEnabled) return NextResponse.json({ success: false, error: 'Assinatura não disponível para este produto.' }, { status: 400 });

        const subscriptionPrice = product.subscriptionPrice || product.price;

        const email = (orderData.email || '').trim().toLowerCase();
        if (!email || !email.includes('@')) {
            return NextResponse.json({ success: false, error: 'E-mail inválido.' }, { status: 400 });
        }

        const fullName = orderData.nome || orderData.fullName || 'Cliente';
        const cpf = (orderData.cpf || '').replace(/\D/g, '');
        if (!cpf || cpf.length !== 11) return NextResponse.json({ success: false, error: 'CPF obrigatório (11 dígitos).' }, { status: 400 });
        const phone = (orderData.telefone || orderData.phone || '').replace(/\D/g, '') || '00000000000';

        // Cria um plano exclusivo para este pedido (não reutiliza plano do produto)
        const orderRef = orderId || `tmp-${Date.now()}`;
        const plan = await createSubscriptionPlan({
            name: `${product.name} — Pedido #${orderRef}`,
            description: `${TOTAL_PARCELAS}x R$ ${subscriptionPrice.toFixed(2)} semanal`,
            amount: subscriptionPrice.toFixed(2),
            periodicity_days: 7,
            billing_method: 'pix_automatico',
            billing_advance_days: 1,
            grace_period_days: 3,
            max_retry_attempts: 3,
        });
        console.log(`[Subscription] Plano criado:`, JSON.stringify(plan));
        const planToken = plan.token || (plan as any).id || (plan as any).plan_token;
        if (!planToken) throw new Error(`[Sync] Plano criado mas sem token. Resposta: ${JSON.stringify(plan)}`);

        // Enrola o cliente
        const enrollment = await enrollSubscription(planToken, { name: fullName, email, document: cpf, phone });
        console.log('[Subscription] Enrollment response:', JSON.stringify(enrollment));

        const mandateId = (enrollment as any).payment?.mandate_id
            || (enrollment as any).mandate_id
            || enrollment.mandate_id;
        const mandateStatus = (enrollment as any).payment?.status
            || (enrollment as any).status
            || enrollment.mandate_status
            || 'pending_authorization';
        const subscriptionToken = (enrollment as any).subscription_token || '';

        // QR code a partir da URL de checkout
        const checkoutUrl = `https://app.syncpayments.com.br/subscription/${subscriptionToken}`;
        const QRCode = await import('qrcode');
        const qrCodeBase64 = subscriptionToken
            ? (await QRCode.toDataURL(checkoutUrl)).replace('data:image/png;base64,', '')
            : '';

        const orderDataToSave: any = {
            fullName,
            email,
            phone: orderData.telefone || orderData.phone || '',
            cpf,
            status: 'pendente',
            paymentStatus: 'aguardando',
            paymentMethod: 'pix_automatico',
            totalPrice: subscriptionPrice,
            subscriptionMandateId: mandateId || null,
            mpPaymentId: subscriptionToken || null,
            totalParcelas: TOTAL_PARCELAS,
            parcelasPagas: 0,
            product: productId ? { connect: { id: productId } } : undefined,
            utmSource: orderData.utmSource || null,
            utmMedium: orderData.utmMedium || null,
            utmCampaign: orderData.utmCampaign || null,
            clickId: orderData.clickId || null,
            visitorId: orderData.visitorId || null,
        };

        let order;
        if (orderId) {
            const existing = await prisma.order.findUnique({ where: { id: orderId } });
            if (existing && existing.paymentStatus !== 'pago') {
                order = await prisma.order.update({ where: { id: orderId }, data: orderDataToSave });
            } else {
                order = await prisma.order.create({ data: orderDataToSave });
            }
        } else {
            order = await prisma.order.create({ data: orderDataToSave });
        }

        return NextResponse.json({
            success: true,
            orderId: order.id,
            mandateId,
            mandateStatus,
            subscriptionToken,
            checkoutUrl,
            qrCodeBase64,
        });

    } catch (error: any) {
        console.error('[Subscription] Erro:', error);
        return NextResponse.json({ success: false, error: error.message || 'Erro ao criar assinatura.' }, { status: 500 });
    }
}
