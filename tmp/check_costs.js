require('dotenv/config');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const p = new PrismaClient({ adapter });

(async () => {
  const products = await p.product.findMany({ select: { id: true, name: true, cost: true, price: true } });
  console.log('=== Produtos ===');
  for (const pr of products) {
    console.log(pr.name, '| price:', pr.price, '| cost:', pr.cost);
  }

  const paidOrders = await p.order.findMany({
    where: { paymentStatus: 'pago', deletedAt: null },
    select: { id: true, productId: true, totalPrice: true }
  });

  const productMap = new Map(products.map(p => [p.id, p]));
  let totalCost = 0;
  for (const o of paidOrders) {
    const prod = o.productId ? productMap.get(o.productId) : null;
    const cost = prod?.cost || 0;
    totalCost += cost;
    if (cost > 0) console.log('Order:', o.id, 'Product:', prod?.name, 'Cost:', cost);
  }
  console.log('\nTotal cost:', totalCost);

  await p.$disconnect();
  await pool.end();
})();
