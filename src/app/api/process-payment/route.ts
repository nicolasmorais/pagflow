import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Payment, CardToken } from "mercadopago";
import { prisma } from "@/lib/prisma";
import { sendConfirmationEmail } from "@/app/actions";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { method, cardData, orderData, brickData, orderId } = body;

        // Reading selectedBumpIds from either orderData or body root
        const selectedBumpIds = orderData?.selectedBumpIds || body.selectedBumpIds || orderData?.selectedBumps || [];

        const fullName = orderData.nome || orderData.fullName;
        const phone = orderData.telefone || orderData.phone;
        const price = Number(orderData.price) || 0;

        // 0. Buscar produto para ter o nome
        const product = orderData.productId ? await prisma.product.findUnique({
            where: { id: orderData.productId }
        }) : null;

        // 1. Preparar dados do pedido
        const orderDataToSave: any = {
            fullName: fullName || "Cliente PagFlow",
            recipient: orderData.destinatario || fullName || "Destinatário",
            email: orderData.email || "",
            phone: phone || "",
            cpf: (orderData.cpf || "").replace(/\D/g, ''),
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
            product: (product && orderData.productId && orderData.productId !== 'default' && orderData.productId !== '') ? { connect: { id: orderData.productId } } : undefined
        };
        let order;
        if (orderId) {
            order = await prisma.order.update({
                where: { id: orderId },
                data: orderDataToSave
            });
        } else {
            order = await prisma.order.create({
                data: orderDataToSave
            });
        }

        // 2. Processar Pagamento Mercado Pago
        const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN || '' });

        let mpPayload: any = {
            transaction_amount: price,
            description: `Pedido ${order.id} - ${product?.name || 'Produto'}`,
            payment_method_id: method === 'pix' ? 'pix' : undefined,
            payer: {
                email: orderData.email || 'test@test.com',
                first_name: fullName.split(' ')[0] || "Cliente",
                last_name: fullName.split(' ').slice(1).join(' ') || "PagFlow",
                identification: {
                    type: 'CPF',
                    number: orderData.cpf.replace(/\D/g, '')
                }
            },
        };

        if (method === 'credit_card') {
            if (brickData) {
                // Se vier do Brick, já temos o token e outros dados
                mpPayload.token = brickData.token;
                mpPayload.installments = Number(brickData.installments);
                mpPayload.payment_method_id = brickData.payment_method_id;
                mpPayload.issuer_id = brickData.issuer_id;
            } else {
                // Fallback manual (opcional, mantido para compatibilidade)
                const cleanCard = (cardData.cardNumber || "").replace(/\D/g, '');
                let pmi = "master";
                if (cleanCard.startsWith("4")) pmi = "visa";
                else if (cleanCard.startsWith("3")) pmi = "amex";
                else if (cleanCard.startsWith("6")) pmi = "elo";
                else if (cleanCard.startsWith("5")) pmi = "master";
                mpPayload.payment_method_id = pmi;

                const expMonth = parseInt((cardData.expiration || "12/29").split('/')[0]);
                let expYear = parseInt((cardData.expiration || "12/29").split('/')[1]);
                if (expYear < 100) expYear += 2000;

                try {
                    const cardTokenConfig = new CardToken(client);
                    const tokenRes = await cardTokenConfig.create({
                        body: {
                            card_number: cleanCard,
                            expiration_month: String(expMonth),
                            expiration_year: String(expYear),
                            security_code: cardData.cvv,
                            cardholder: {
                                name: cardData.cardName,
                                identification: { type: 'CPF', number: orderData.cpf.replace(/\D/g, '') }
                            }
                        } as any
                    });
                    mpPayload.token = tokenRes.id;
                    mpPayload.installments = Number(cardData.installments) || 1;
                } catch (tokenError: any) {
                    console.error("Tokenization Error:", tokenError);
                    return NextResponse.json({ success: false, error: "Dados do cartão inválidos ou não aceitos." }, { status: 400 });
                }
            }
        }

        const payment = new Payment(client);
        console.log("Creating Payment with payload:", JSON.stringify(mpPayload, null, 2));

        const mpResult = await payment.create({ body: mpPayload });
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

        // Return detailed error for debugging if it's an invocation error
        let finalError = error.message || "Ocorreu um erro ao processar o pagamento.";
        if (finalError.includes("invocation")) {
            finalError = `${finalError} - Verifique se todos os campos obrigatórios estão preenchidos corretamente.`;
        }

        return NextResponse.json({
            success: false,
            error: finalError
        }, { status: 500 });
    }
}
