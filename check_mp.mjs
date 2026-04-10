import { MercadoPagoConfig, Payment } from 'mercadopago';

const client = new MercadoPagoConfig({ accessToken: 'APP_USR-8853034966141812-012423-728dfc24a9b78263b75926853e9f7cb9-201109762' });
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
