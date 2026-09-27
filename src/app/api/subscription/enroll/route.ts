import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { enrollSubscription, createSubscriptionPlan } from "@/lib/sync-subscription";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const { limited } = checkRateLimit(`subscription:${ip}`, 5, 60_000);
    if (limited) {
        return NextResponse.json({ success: false, error: 'Muitas tentativas.' }, { status: 429 });
    }

    try {
        const body = await req.json();
        const { productId, orderData, orderId } = body;

        // Buscar produto e verificar se assinatura está ativa
        const product = await prisma.product.findUnique({ where: { id: productId } });
        if (!product) return NextResponse.json({ success: false, error: 'Produto não encontrado.' }, { status: 404 });
        if (!product.subscriptionEnabled) return NextResponse.json({ success: false, error: 'Assinatura não disponível para este produto.' }, { status: 400 });

        const subscriptionPrice = product.subscriptionPrice || product.price;

        // Criar (ou recriar) plano na Sync
        const createPlan = async () => {
            const plan = await createSubscriptionPlan({
                name: `${product.name} — Semanal`,
                description: `Assinatura semanal de ${product.name}`,
                amount: subscriptionPrice.toFixed(2),
                periodicity_days: 7,
                billing_method: 'pix_automatico',
                billing_advance_days: 1,
                grace_period_days: 3,
                max_retry_attempts: 3,
            });
            console.log(`[Subscription] Resposta criação plano:`, JSON.stringify(plan));
            // Sync pode retornar token em diferentes campos
            const token = plan.token || (plan as any).id || (plan as any).plan_token;
            if (!token) throw new Error(`[Sync] Plano criado mas sem token. Resposta: ${JSON.stringify(plan)}`);
            await prisma.product.update({
                where: { id: productId },
                data: { subscriptionPlanToken: token },
            });
            console.log(`[Subscription] Plano criado: ${token}`);
            return token;
        };

        let planToken = product.subscriptionPlanToken;
        if (!planToken) {
            planToken = await createPlan();
        }

        // Validar email
        const email = (orderData.email || '').trim().toLowerCase();
        if (!email || !email.includes('@')) {
            return NextResponse.json({ success: false, error: 'E-mail inválido.' }, { status: 400 });
        }

        const fullName = orderData.nome || orderData.fullName || 'Cliente';
        const cpf = (orderData.cpf || '').replace(/\D/g, '') || '19119119100';
        const phone = (orderData.telefone || orderData.phone || '').replace(/\D/g, '') || '00000000000';

        // Enrolar assinante — se 404 (plano não existe na Sync), recria e tenta de novo
        let enrollment;
        try {
            enrollment = await enrollSubscription(planToken, { name: fullName, email, document: cpf, phone });
        } catch (enrollErr: any) {
            if (enrollErr.message?.includes('404')) {
                console.log(`[Subscription] Plano ${planToken} não encontrado na Sync, recriando...`);
                planToken = await createPlan();
                enrollment = await enrollSubscription(planToken, { name: fullName, email, document: cpf, phone });
            } else {
                throw enrollErr;
            }
        }

        // Gerar QR base64
        console.log('[Subscription] Enrollment response:', JSON.stringify(enrollment));
        const pixCode = enrollment.qr_code
            || (enrollment as any).pix_code
            || (enrollment as any).qr_code_url
            || (enrollment as any).mandate_qr_code
            || (enrollment as any).payment_code;
        if (!pixCode) throw new Error(`[Sync] QR code não encontrado na resposta: ${JSON.stringify(enrollment)}`);
        const QRCode = await import('qrcode');
        const qrCodeBase64 = (await QRCode.toDataURL(pixCode)).replace('data:image/png;base64,', '');

        // Salvar ou atualizar pedido
        const orderDataToSave: any = {
            fullName,
            email,
            phone: orderData.telefone || orderData.phone || '',
            cpf,
            status: 'pendente',
            paymentStatus: 'aguardando',
            paymentMethod: 'pix_automatico',
            totalPrice: subscriptionPrice,
            subscriptionMandateId: enrollment.mandate_id,
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
            mandateId: enrollment.mandate_id,
            mandateStatus: enrollment.mandate_status,
            qrCode: enrollment.qr_code,
            qrCodeBase64,
        });

    } catch (error: any) {
        console.error('[Subscription] Erro:', error);
        return NextResponse.json({ success: false, error: error.message || 'Erro ao criar assinatura.' }, { status: 500 });
    }
}
