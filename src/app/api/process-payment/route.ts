import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendConfirmationEmail, sendAdminNotification, sendPixEmail } from "@/app/actions";
import { checkRateLimit } from "@/lib/rate-limit";
import { createCharge, WOOVI_STATUS_MAP } from "@/lib/woovi";
import { createCardOrder, createPixOrder, mapPagarmeStatus } from "@/lib/pagarme";

async function logError(level: string, source: string, message: string, stack?: string, metadata?: Record<string, any>) {
    try {
        const { prisma: p } = await import("@/lib/prisma");
        await p.errorLog.create({ data: { level, source, message: message.substring(0, 2000), stack: stack?.substring(0, 5000) || null, metadata: metadata ? JSON.stringify(metadata).substring(0, 2000) : null } });
    } catch { }
}

export async function POST(req: NextRequest) {
    // ── Rate Limiting ──────────────────────────────────────────────────────
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
        || req.headers.get('x-real-ip')
        || 'unknown';
    const { limited } = checkRateLimit(`payment:${ip}`, 10, 60_000);
    if (limited) {
        return NextResponse.json(
            { success: false, error: 'Muitas tentativas. Aguarde 1 minuto e tente novamente.' },
            { status: 429 }
        );
    }

    try {
        const body = await req.json();
        const { method, cardData, orderData, brickData, pagarmeData, orderId } = body;

        // Reading selectedBumpIds from either orderData or body root
        const selectedBumpIds = orderData?.selectedBumpIds || body.selectedBumpIds || orderData?.selectedBumps || [];

        const fullName = orderData.nome || orderData.fullName || "Cliente PagFlow";
        const phone = orderData.telefone || orderData.phone || "";

        // 0. Buscar produto e configurações para recalcular o preço no servidor
        const [product, pixDiscountSetting] = await Promise.all([
            orderData.productId ? prisma.product.findUnique({
                where: { id: orderData.productId }
            }) : Promise.resolve(null),
            prisma.customization_settings.findUnique({
                where: { key: 'checkout_pix_discount' }
            })
        ]);

        // ── Validar e-mail no servidor ──
        const emailRaw = (orderData.email || '').trim().toLowerCase();
        if (!emailRaw) {
            return NextResponse.json({ success: false, error: 'E-mail é obrigatório.' }, { status: 400 });
        }
        const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
        if (!emailRegex.test(emailRaw)) {
            return NextResponse.json({ success: false, error: 'Formato de e-mail inválido.' }, { status: 400 });
        }
        const emailDomain = emailRaw.split('@')[1];
        if (!emailDomain || !emailDomain.includes('.')) {
            return NextResponse.json({ success: false, error: 'Domínio de e-mail inválido.' }, { status: 400 });
        }
        const emailTld = emailDomain.split('.').pop() || '';
        if (emailTld.length < 2) {
            return NextResponse.json({ success: false, error: 'Domínio de e-mail inválido — verifique o endereço.' }, { status: 400 });
        }
        orderData.email = emailRaw;

        const cpfToSave = (orderData.cpf || "").replace(/\D/g, '');

        // ── Buscar preços dos order bumps selecionados ──
        let bumpsTotal = 0;
        if (Array.isArray(selectedBumpIds) && selectedBumpIds.length > 0) {
            const bumps = await prisma.orderBump.findMany({
                where: { id: { in: selectedBumpIds }, isActive: true }
            });
            bumpsTotal = bumps.reduce((sum, b) => sum + (b.price || 0), 0);
        }

        // ── Recalcular preço no servidor (ignora preço enviado pelo cliente) ──
        const serverBasePrice = Number(product?.price) || 0;
        const pixDiscountPct = Number(pixDiscountSetting?.value || 0) / 100;
        const serverShippingPrice = Number(orderData.shippingPrice) || 0;
        const subtotalBeforeDiscount = serverBasePrice + bumpsTotal;
        const serverPrice = method === 'pix'
            ? Number((subtotalBeforeDiscount * (1 - pixDiscountPct) + serverShippingPrice).toFixed(2))
            : Number((subtotalBeforeDiscount + serverShippingPrice).toFixed(2));

        // 1. Preparar dados do pedido
        const orderDataToSave: any = {
            fullName: fullName || "Cliente PagFlow",
            recipient: orderData.destinatario || fullName || "Destinatário",
            email: orderData.email || "",
            phone: phone || "",
            cpf: cpfToSave,
            cep: (orderData.cep || "").replace(/\D/g, ''),
            rua: orderData.rua || "",
            numero: orderData.numero || "",
            complemento: orderData.complemento || "",
            bairro: orderData.bairro || "",
            cidade: orderData.cidade || "",
            estado: (orderData.estado || "").toUpperCase(),
            referencia: orderData.referencia || "",
            status: 'pendente',
            paymentStatus: 'processando',
            paymentMethod: method === 'pix' ? 'pix' : 'credito',
            totalPrice: serverPrice,
            shippingPrice: Number(orderData.shippingPrice) || 0,
            hasBump: Array.isArray(selectedBumpIds) && selectedBumpIds.length > 0,
            selectedBumps: Array.isArray(selectedBumpIds) ? selectedBumpIds : [],
            utmSource: orderData.utmSource || null,
            utmMedium: orderData.utmMedium || null,
            utmCampaign: orderData.utmCampaign || null,
            utmTerm: orderData.utmTerm || null,
            utmContent: orderData.utmContent || null,
            utmPlacement: orderData.utmPlacement || null,
            utmId: orderData.utmId || null,
            utmCreativeName: orderData.utmCreativeName || null,
            clickId: orderData.clickId || null,
            visitorId: orderData.visitorId || null,
            productCost: product?.cost || 0,
            product: (product && orderData.productId && orderData.productId !== 'default' && orderData.productId !== '') ? { connect: { id: orderData.productId } } : undefined,
        };

        let order;
        if (orderId) {
            // ── Update existing order if found and not yet paid ──────────────────
            // This prevents creating duplicate orphan records when the user's
            // orderId is already linked to a specific payment attempt.
            const existing = await prisma.order.findUnique({ where: { id: orderId } });

            if (existing && existing.paymentStatus !== 'pago') {
                // Update ANY non-paid order — not just 'abandonado' status
                // Fixes race condition where autosave could have changed status
                order = await prisma.order.update({
                    where: { id: orderId },
                    data: orderDataToSave
                });
            } else if (!existing) {
                // orderId was passed but not found in DB — create new
                order = await prisma.order.create({
                    data: orderDataToSave
                });
            } else {
                // existing.paymentStatus === 'pago' → already paid, create new order
                order = await prisma.order.create({
                    data: orderDataToSave
                });
            }
        } else {
            order = await prisma.order.create({
                data: orderDataToSave
            });
        }

        // Validar valor mínimo
        if (serverPrice <= 0) {
            return NextResponse.json({ success: false, error: "O valor do pedido deve ser maior que zero para processar o pagamento." }, { status: 400 });
        }

        // 2. Processar Pagamento
        const isCard = method === 'credit_card' || method === 'card';
        const isPix = method === 'pix';

        // ── Construct Base URL ────────────────────────────────────────────────
        const protocol = req.headers.get('x-forwarded-proto') || 'https';
        const host = req.headers.get('host');
        const baseUrl = `${protocol}://${host}`;
        const isLocal = host?.includes('localhost') || host?.includes('127.0.0.1');

        let finalStatus = 'recusado';
        let qrCode: string | null = null;
        let qrCodeBase64: string | null = null;
        let pixStatusForResponse = 'recusado';
        let transactionId: string | number | null = null;

        if (isPix) {
            // ── PIX via Pagar.me ──────────────────────────────────────────────
            const pixResult = await createPixOrder({
                orderId: order.id,
                amount: Math.round(serverPrice * 100),
                description: `Pedido ${order.id} - ${product?.name || 'Produto'}`,
                customer: {
                    name: fullName || 'Cliente PagFlow',
                    email: orderData.email || 'cliente@pagflow.com',
                    document: cpfToSave || undefined,
                    phone: (phone || '').replace(/\D/g, '') || undefined,
                },
                expiresIn: 3600,
            });

            console.log('[Pagar.me PIX] Order ID:', pixResult.id, 'Status:', pixResult.status);
            transactionId = pixResult.id;

            // Gerar QR code base64 a partir do qrCode EMV
            const QRCode = await import('qrcode');
            qrCode = pixResult.qrCode;
            qrCodeBase64 = (await QRCode.toDataURL(pixResult.qrCode)).replace('data:image/png;base64,', '');

            finalStatus = 'aguardando';
            pixStatusForResponse = 'aguardando';

            try {
                await prisma.order.update({
                    where: { id: order.id },
                    data: {
                        paymentStatus: 'aguardando',
                        status: 'pendente',
                        mpPaymentId: pixResult.id,
                    }
                });
            } catch (dbErr) {
                console.error('[Pagar.me PIX] Failed to update order:', dbErr);
            }

            // Enviar e-mail com QR Code PIX
            try {
                await sendPixEmail(order.id, qrCode, qrCodeBase64);
            } catch (pixEmailErr) {
                console.error('[Pagar.me PIX] Failed to send PIX email:', pixEmailErr);
            }

        } else if (isCard) {
            // ── Cartão via Pagar.me ───────────────────────────────────────────

            // Validate CPF
            if (!cpfToSave || cpfToSave.length !== 11) {
                return NextResponse.json({
                    success: false,
                    error: "CPF é obrigatório para pagamento com cartão de crédito."
                }, { status: 400 });
            }

            // Expect pagarmeData: { cardToken, installments, brand }
            if (!pagarmeData?.cardToken) {
                console.error("[Pagar.me] cardToken ausente. pagarmeData:", pagarmeData);
                return NextResponse.json({ success: false, error: "Dados do cartão incompletos. Token não recebido." }, { status: 400 });
            }

            const installments = Number(pagarmeData.installments) || 1;
            const description = `Pedido ${order.id} - ${product?.name || 'Produto'}${bumpsTotal > 0 ? ` + ${selectedBumpIds.length} oferta(s)` : ''}`;

            // Para parcelas com juros, o frontend calcula o total correto
            const chargeAmount = (pagarmeData.totalWithInterest && pagarmeData.totalWithInterest > serverPrice)
                ? Math.round(pagarmeData.totalWithInterest * 100)
                : Math.round(serverPrice * 100);

            // Monta endereço para antifraude
            const rua = orderData.rua || '';
            const numero = orderData.numero || 'S/N';
            const addressLine1 = rua ? `${rua}, ${numero}` : '';
            const billingAddress = addressLine1 ? {
                line_1: addressLine1,
                line_2: orderData.complemento || undefined,
                zip_code: (orderData.cep || '').replace(/\D/g, ''),
                city: orderData.cidade || '',
                state: orderData.estado || 'SP',
            } : undefined;

            const notificationUrl = isLocal ? undefined : `${baseUrl}/api/webhook/pagarme`;

            const pagarmeResult = await createCardOrder({
                orderId: order.id,
                amount: chargeAmount,
                installments,
                cardToken: pagarmeData.cardToken,
                description,
                statementDescriptor: product?.storeName || 'PAGFLOW',
                customer: {
                    name: fullName || 'Cliente PagFlow',
                    email: orderData.email || 'cliente@pagflow.com',
                    document: cpfToSave,
                    phone: (phone || '').replace(/\D/g, '') || undefined,
                    address: billingAddress,
                },
                billing: billingAddress ? {
                    name: fullName || 'Cliente PagFlow',
                    address: billingAddress,
                } : undefined,
            });

            console.log('[Pagar.me] Order ID:', pagarmeResult.id, 'Status:', pagarmeResult.status);
            transactionId = pagarmeResult.id;
            finalStatus = mapPagarmeStatus(pagarmeResult.status);

            const lastTxn = pagarmeResult.charges?.[0]?.last_transaction;
            const installmentAmount = lastTxn?.amount
                ? (lastTxn.amount / 100) / (lastTxn.installments || installments)
                : null;

            try {
                await prisma.order.update({
                    where: { id: order.id },
                    data: {
                        paymentStatus: finalStatus,
                        status: finalStatus === 'pago' ? 'processando' : 'pendente',
                        mpPaymentId: pagarmeResult.id,
                        installments: lastTxn?.installments || installments,
                        installmentAmount: installmentAmount || null,
                        cardBrand: pagarmeData.brand || null,
                        paidAt: finalStatus === 'pago' ? new Date() : null,
                    }
                });
                console.log('[Pagar.me] Order updated, status:', finalStatus);
            } catch (dbErr) {
                console.error('[Pagar.me] Failed to update order in DB:', dbErr);
            }
        } else {
            return NextResponse.json({ success: false, error: "Método de pagamento inválido." }, { status: 400 });
        }

        // ── R2 Backup ─────────────────────────────────────────────────────────
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
            console.error("Failed to trigger R2 backup:", r2Err);
        }

        // ── E-mails se aprovado (cartão) ──────────────────────────────────────
        if (finalStatus === 'pago') {
            try {
                await sendConfirmationEmail(order.id);
            } catch (emailError) {
                console.error("Failed to send confirmation email:", emailError);
            }
            try {
                await sendAdminNotification(order);
            } catch (notifyError) {
                console.error("Failed to send admin notification:", notifyError);
            }
        }

        return NextResponse.json({
            success: true,
            orderId: order.id,
            paymentStatus: isPix ? pixStatusForResponse : finalStatus,
            qrCode,
            qrCodeBase64,
            transactionId
        });

    } catch (error: any) {
        console.error("PAYMENT API ERROR DETAIL:", error);

        logError('error', 'payment', error.message || 'Payment error', error.stack);

        try {
            const { sendAdminPush } = await import("@/lib/push-service");
            await sendAdminPush(
                "❌ Erro no Pagamento",
                `Falha ao processar pagamento: ${(error.message || 'Erro desconhecido').substring(0, 100)}`,
                "/admin/errors"
            );
        } catch { }

        let apiError = error.message;
        if (error.errors && Array.isArray(error.errors) && error.errors[0]?.message) {
            apiError = error.errors[0].message;
        }

        let finalError = apiError || "Ocorreu um erro ao processar o pagamento.";

        return NextResponse.json({
            success: false,
            error: finalError
        }, { status: 500 });
    }
}
