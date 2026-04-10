import { MercadoPagoConfig, Payment } from "mercadopago";
import * as dotenv from "dotenv";
dotenv.config();

async function testMP() {
    const token = process.env.MP_ACCESS_TOKEN;
    console.log("Testing with token:", token?.slice(0, 10) + "...");

    const client = new MercadoPagoConfig({ accessToken: token || '' });
    const payment = new Payment(client);

    try {
        const res = await payment.create({
            body: {
                transaction_amount: 1,
                description: "Test",
                payment_method_id: "pix",
                payer: {
                    email: "test@test.com"
                }
            }
        });
        console.log("Success! ID:", res.id);
    } catch (err: any) {
        console.error("Error Details:", JSON.stringify(err, null, 2));
    }
}

testMP();
