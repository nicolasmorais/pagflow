import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Payment, CardToken } from "mercadopago";
import { prisma } from "@/lib/prisma";
import { sendConfirmationEmail, sendAdminNotification } from "@/app/actions";
import { checkRateLimit } from "@/lib/rate-limit";

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
        const { method, cardData, orderData, brickData, orderId } = body;

        // Reading selectedBumpIds from either orderData or body root
        const selectedBumpIds = orderData?.selectedBumpIds || body.selectedBumpIds || orderData?.selectedBumps || [];

        const fullName = orderData.nome || orderData.fullName || "Cliente PagFlow";
        const phone = orderData.telefone || orderData.phone || "";
        const price = Number(Number(orderData.price).toFixed(2)) || 0;

        // 0. Buscar produto para ter o nome
        const product = orderData.productId ? await prisma.product.findUnique({
            where: { id: orderData.productId }
        }) : null;

        const cpfInput = (orderData.cpf || "").replace(/\D/g, '');
        const cpfToSave = cpfInput || "19119119100"; // Fallback CPF for checkouts without CPF field

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
            totalPrice: price,
            hasBump: Array.isArray(selectedBumpIds) && selectedBumpIds.length > 0,
            selectedBumps: Array.isArray(selectedBumpIds) ? selectedBumpIds : [],
            product: (product && orderData.productId && orderData.productId !== 'default' && orderData.productId !== '') ? { connect: { id: orderData.productId } } : undefined,
            utmSource: orderData.utmSource || null,
            utmMedium: orderData.utmMedium || null,
            utmCampaign: orderData.utmCampaign || null,
            utmTerm: orderData.utmTerm || null,
            utmContent: orderData.utmContent || null,
        };

        let order;
        if (orderId) {
            // ── Security: only allow updating orders still in "abandonado" state ──
            // This prevents someone from hijacking a paid order via a leaked orderId
            const existing = await prisma.order.findUnique({ where: { id: orderId } });

            if (existing && existing.paymentStatus === 'abandonado') {
                order = await prisma.order.update({
                    where: { id: orderId },
                    data: orderDataToSave
                });
            } else {
                // Order doesn't exist or is already past abandoned state → create new
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
        if (price <= 0) {
            return NextResponse.json({ success: false, error: "O valor do pedido deve ser maior que zero para processar o pagamento." }, { status: 400 });
        }

        // 2. Processar Pagamento Mercado Pago
        const { deviceId, idempotencyKey } = body;
        const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN || '' });

        const protocol = req.headers.get('x-forwarded-proto') || 'http';
        const host = req.headers.get('host');
        const baseUrl = `${protocol}://${host}`;
        const notificationUrl = (host?.includes('localhost') || !protocol.includes('https')) ? undefined : `${baseUrl}/api/webhook/mercadopago`;

        let mpPayload: any = {
            transaction_amount: price,
            description: `Pedido ${order.id} - ${product?.name || 'Produto'}`,
            external_reference: order.id,
            statement_descriptor: "PAGFLOW*PRODUTO", // Nome na fatura do cartão
            binary_mode: true, // Aprovação instantânea (ideal para produtos digitais/físicos com estoque)
            payment_method_id: method === 'pix' ? 'pix' : undefined,
            notification_url: notificationUrl,
            payer: {
                email: orderData.email || 'cliente@pagflow.com',
                first_name: fullName.split(' ')[0] || "Cliente",
                last_name: fullName.split(' ').slice(1).join(' ') || "PagFlow",
                identification: {
                    type: 'CPF',
                    number: cpfToSave || '12345678909'
                },
                address: {
                    zip_code: orderData.cep?.replace(/\D/g, '') || '',
                    street_name: orderData.rua || '',
                    street_number: orderData.numero || '',
                    neighborhood: orderData.bairro || '',
                    city: orderData.cidade || '',
                    federal_unit: (orderData.estado || '').toUpperCase()
                }
            },
            additional_info: {
                items: [
                    {
                        id: product?.id || 'default',
                        title: product?.name || 'Produto Digital',
                        quantity: 1,
                        unit_price: price,
                        category_id: 'others',
                        description: `Compra realizada no PagFlow - ID ${order.id}`
                    }
                ]
            }
        };

        if (method === 'credit_card' || method === 'card') {
            // O Card Payment Brick do MP pode enviar dados diretamente ou aninhados em formData
            const brick = brickData?.formData || brickData;
            const card = cardData?.formData || cardData;

            if (process.env.NODE_ENV !== 'production') {
                console.log("🔹 [DEBUG] brickData recebido:", JSON.stringify(brickData, null, 2));
                console.log("🔹 [DEBUG] cardData recebido:", JSON.stringify(cardData, null, 2));
            }

            if (brick && brick.token) {
                mpPayload.token = brick.token;
                mpPayload.installments = Number(brick.installments);
                mpPayload.payment_method_id = brick.payment_method_id;
                mpPayload.issuer_id = brick.issuer_id;
            } else if (card && card.token) {
                mpPayload.token = card.token;
                mpPayload.installments = Number(card.installments) || 1;
                mpPayload.payment_method_id = card.payment_method_id;
            } else {
                console.error("❌ Token do cartão ausente. brickData:", brickData, "cardData:", cardData);
                return NextResponse.json({ success: false, error: "Dados do cartão incompletos. Token não recebido." }, { status: 400 });
            }
        }

        const payment = new Payment(client);
        if (process.env.NODE_ENV !== 'production') {
            console.log("Creating Payment with payload:", JSON.stringify(mpPayload, null, 2));
        }

        // Usamos 'as any' para passar os cabeçalhos customizados que não estão no Type oficial do SDK v2
        const mpResult = await payment.create({
            body: mpPayload,
            requestOptions: {
                idempotencyKey: idempotencyKey || crypto.randomUUID(),
                // @ts-ignore - customHeaders é necessário para o Device ID aumentar a nota de qualidade
                customHeaders: {
                    'X-Id-Device': deviceId || ''
                }
            }
        });
        console.log("MP Result ID:", mpResult.id);

        // 3. Update DB com status final
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

        await prisma.order.update({
            where: { id: order.id },
            data: {
                paymentStatus: finalStatus,
                status: finalStatus === 'pago' ? 'processando' : 'pendente',
                mpPaymentId: String(mpResult.id),
                installments: mpResult.installments || null,
                installmentAmount: (mpResult as any).transaction_details?.installment_amount || null,
                cardBrand: mpResult.payment_method_id || null,
                netReceived: (mpResult as any).transaction_details?.net_received_amount || null
            }
        });

        // 4. Enviar E-mail se aprovado
        if (finalStatus === 'pago') {
            try {
                await sendConfirmationEmail(order.id);
            } catch (emailError) {
                console.error("Failed to send confirmation email:", emailError);
            }

            // Notify Admin
            try {
                await sendAdminNotification('sale', order);
            } catch (notifyError) {
                console.error("Failed to send admin notification:", notifyError);
            }
        }

        let qrCode: string | null = null;
        let qrCodeBase64: string | null = null;

        if (method === 'pix' && mpResult.point_of_interaction?.transaction_data) {
            qrCode = mpResult.point_of_interaction.transaction_data.qr_code || null;
            qrCodeBase64 = mpResult.point_of_interaction.transaction_data.qr_code_base64 || null;
        }

        return NextResponse.json({
            success: true,
            orderId: order.id,
            paymentStatus: finalStatus,
            qrCode,
            qrCodeBase64,
            statusDetail: mpResult.status_detail,
            transactionId: mpResult.id
        });

    } catch (error: any) {
        console.error("PAYMENT API ERROR DETAIL:", error);

        // Tentar capturar a mensagem de erro do Mercado Pago se existir
        let apiError = error.message;
        if (error.cause && Array.isArray(error.cause) && error.cause[0]?.description) {
            apiError = error.cause[0].description;
        } else if (error.errors && Array.isArray(error.errors) && error.errors[0]?.message) {
            apiError = error.errors[0].message;
        }

        let finalError = apiError || "Ocorreu um erro ao processar o pagamento.";

        // Traduzir erro genérico do Mercado Pago para algo mais útil
        if (finalError === "internal_error") {
            finalError = "Erro no Mercado Pago (internal_error). Verifique suas credenciais (Access Token) ou se o Pix está ativo na conta.";
        }

        if (finalError.includes("invocation")) {
            finalError = `${finalError} - Verifique se todos os campos obrigatórios estão preenchidos corretamente.`;
        }

        return NextResponse.json({
            success: false,
            error: finalError
        }, { status: 500 });
    }
}
