require('dotenv/config');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const p = new PrismaClient({ adapter });

(async () => {
  const records = await p.financialRecord.findMany({ orderBy: { createdAt: 'desc' } });
  console.log('=== Financial Records ===');
  for (const r of records) {
    console.log(r.type, '|', r.category, '|', r.description, '| R$', r.amount, '|', r.date);
  }
  console.log('\nTotal records:', records.length);

  const products = await p.product.findMany({ select: { id: true, name: true, cost: true } });
  console.log('\n=== Product costs ===');
  for (const pr of products) {
    console.log(pr.name, '| cost:', pr.cost);
  }

  await p.$disconnect();
  await pool.end();
})();
