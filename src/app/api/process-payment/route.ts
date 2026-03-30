import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Payment, CardToken } from "mercadopago";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { method, cardData, orderData, brickData } = body;

        const fullName = orderData.nome || orderData.fullName;
        const phone = orderData.telefone || orderData.phone;
        const price = Number(orderData.price);

        // 0. Buscar produto para ter o nome
        const product = await prisma.product.findUnique({
            where: { id: orderData.productId }
        });

        // 1. Criar pedido no Banco de Dados
        const orderDataToCreate: any = {
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
            hasBump: !!orderData.hasBump,
            product: (product && orderData.productId) ? { connect: { id: orderData.productId } } : undefined
        };

        const order = await (prisma.order as any).create({
            data: orderDataToCreate
        });

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
                mpPaymentId: String(mpResult.id)
            }
        });

        let qrCode = null;
        let qrCodeBase64 = null;

        if (method === 'pix' && mpResult.point_of_interaction?.transaction_data) {
            qrCode = mpResult.point_of_interaction.transaction_data.qr_code;
            qrCodeBase64 = mpResult.point_of_interaction.transaction_data.qr_code_base64;
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
        console.error("Payment API Error:", error);
        return NextResponse.json({
            success: false,
            error: error.message || 'Falha ao processar pagamento',
            cause: error.cause || null
        }, { status: 500 });
    }
}
