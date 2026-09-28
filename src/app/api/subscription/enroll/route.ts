import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSubscription } from "@/lib/woovi-subscription";
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
        const parcelasEscolhidas: number = Math.min(Math.max(Number(body.parcelas) || 4, 2), 4);

        const product = await prisma.product.findUnique({ where: { id: productId } });
        if (!product) return NextResponse.json({ success: false, error: 'Produto não encontrado.' }, { status: 404 });
        if (!product.subscriptionEnabled) return NextResponse.json({ success: false, error: 'Assinatura não disponível para este produto.' }, { status: 400 });

        // Parcela = preço do produto / parcelas escolhidas
        const totalPrice = product.price;
        const subscriptionPrice = totalPrice / parcelasEscolhidas;

        const email = (orderData.email || '').trim().toLowerCase();
        if (!email || !email.includes('@')) {
            return NextResponse.json({ success: false, error: 'E-mail inválido.' }, { status: 400 });
        }

        const fullName = orderData.nome || orderData.fullName || 'Cliente';
        const cpf = (orderData.cpf || '').replace(/\D/g, '');
        if (!cpf || cpf.length !== 11) return NextResponse.json({ success: false, error: 'CPF obrigatório (11 dígitos).' }, { status: 400 });
        const phone = (orderData.telefone || orderData.phone || '').replace(/\D/g, '') || '00000000000';

        // Cria assinatura Woovi — endDate = hoje + (parcelas-1)*7 dias
        const orderRef = orderId || `tmp-${Date.now()}`;
        const subscription = await createSubscription({
            correlationID: orderRef,
            value: Math.round(subscriptionPrice * 100), // Woovi usa centavos
            comment: `${parcelasEscolhidas}x ${product.name}`.substring(0, 30),
            totalParcelas: parcelasEscolhidas,
            customer: { name: fullName, email, taxID: cpf, phone: phone || undefined },
        });
        console.log(`[Subscription] Woovi criada:`, JSON.stringify(subscription));

        const globalID = subscription.globalID;
        if (!globalID) throw new Error(`[Woovi] Assinatura criada mas sem globalID. Resposta: ${JSON.stringify(subscription)}`);

        // QR EMV vem de subscription.pixRecurring.emv
        const qrCodeEmv: string = subscription.emv || '';
        const QRCode = await import('qrcode');
        const qrCodeBase64 = qrCodeEmv
            ? (await QRCode.toDataURL(qrCodeEmv)).replace('data:image/png;base64,', '')
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
            subscriptionMandateId: globalID,
            mpPaymentId: globalID,
            totalParcelas: parcelasEscolhidas,
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
            mandateId: globalID,
            mandateStatus: subscription.status,
            subscriptionToken: globalID,
            qrCodeBase64,
            emv: qrCodeEmv,
            resumed: false,
        });

    } catch (error: any) {
        console.error('[Subscription] Erro:', error);
        return NextResponse.json({ success: false, error: error.message || 'Erro ao criar assinatura.' }, { status: 500 });
    }
}
