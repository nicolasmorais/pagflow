import { MercadoPagoConfig, Payment } from 'mercadopago';

const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
const payment = new Payment(client);

async function run() {
    try {
        const mpResult = await payment.get({ id: '153205477832' });
        console.log("Status:", mpResult.status);
        console.log("Status Detail:", mpResult.status_detail);
    } catch (error) {
        console.error("Error:", error);
    }
}

run();
