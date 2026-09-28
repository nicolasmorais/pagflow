require('dotenv/config');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const p = new PrismaClient({ adapter });
const { MercadoPagoConfig, Payment } = require('mercadopago');
const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
const payment = new Payment(client);

(async () => {
  const orders = await p.order.findMany({
    where: { paymentStatus: 'pago', deletedAt: null, netReceived: null, mpPaymentId: { not: null } },
    select: { id: true, fullName: true, totalPrice: true, mpPaymentId: true, paymentMethod: true }
  });

  console.log('Orders with null netReceived:', orders.length);

  for (const o of orders) {
    try {
      const mp = await payment.get({ id: o.mpPaymentId });
      const netReceived = mp.transaction_details?.net_received_amount;
      if (netReceived !== undefined) {
        await p.order.update({ where: { id: o.id }, data: { netReceived } });
        const name = (o.fullName || 'N/A').split(' ').slice(0, 2).join(' ');
        const fee = o.totalPrice - netReceived;
        const pct = ((fee / o.totalPrice) * 100).toFixed(1);
        console.log('FIXED:', name, '| R$', o.totalPrice.toFixed(2), '-> R$', netReceived.toFixed(2), '(taxa R$', fee.toFixed(2), pct + '%)');
      }
    } catch (e) {
      console.log('ERROR:', o.fullName, e.message);
    }
  }

  await p.$disconnect();
  await pool.end();
})();
