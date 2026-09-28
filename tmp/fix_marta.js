require('dotenv/config');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const p = new PrismaClient({ adapter });
(async () => {
  const o = await p.order.findFirst({ where: { fullName: { contains: 'Marta' } }, orderBy: { createdAt: 'desc' } });
  console.log('ID:', o.id);
  console.log('totalPrice:', o.totalPrice);
  console.log('netReceived:', o.netReceived);
  console.log('mpPaymentId:', o.mpPaymentId);
  console.log('paymentMethod:', o.paymentMethod);
  console.log('paymentStatus:', o.paymentStatus);

  if (o.mpPaymentId) {
    const { MercadoPagoConfig, Payment } = require('mercadopago');
    const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
    const payment = new Payment(client);
    try {
      const mp = await payment.get({ id: o.mpPaymentId });
      console.log('\n--- MP Response ---');
      console.log('status:', mp.status);
      console.log('transaction_details:', JSON.stringify(mp.transaction_details, null, 2));
      console.log('fee_details:', JSON.stringify(mp.fee_details, null, 2));

      const netReceived = mp.transaction_details?.net_received_amount;
      const totalPaid = mp.transaction_details?.total_paid_amount;
      console.log('total_paid_amount:', totalPaid);
      console.log('net_received_amount:', netReceived);

      if (netReceived !== undefined && netReceived !== o.netReceived) {
        await p.order.update({ where: { id: o.id }, data: { netReceived } });
        console.log('\nUPDATED netReceived to:', netReceived);
      }
    } catch (e) {
      console.log('MP Error:', e.message);
    }
  }

  await p.$disconnect();
  await pool.end();
})();
