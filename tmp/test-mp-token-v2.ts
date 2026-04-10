import { MercadoPagoConfig, Payment } from "mercadopago";
import * as dotenv from "dotenv";
dotenv.config();

async function testMP() {
    const token = process.env.MP_ACCESS_TOKEN;
    const client = new MercadoPagoConfig({ accessToken: token || '' });
    const payment = new Payment(client);

    try {
        const res = await payment.create({
            body: {
                transaction_amount: 5.00,
                description: "Venda Teste",
                payment_method_id: "pix",
                notification_url: "https://mysite.com/api/webhooks",
                payer: {
                    email: "test_user_1234@testuser.com",
                    first_name: "Test",
                    last_name: "User",
                    identification: {
                        type: "CPF",
                        number: "19119119100"
                    }
                }
            }
        });
        console.log("Success! ID:", res.id);
    } catch (err: any) {
        console.log("Status:", err.status);
        console.log("Message:", err.message);
        console.log("Cause:", JSON.stringify(err.cause, null, 2));
    }
}

testMP();
