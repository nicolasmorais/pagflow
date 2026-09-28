require('dotenv/config');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const p = new PrismaClient({ adapter });

(async () => {
  const orders = await p.order.findMany({
    where: { paymentStatus: 'pago', deletedAt: null },
    select: { fullName: true, totalPrice: true, netReceived: true, paymentMethod: true, installments: true, createdAt: true },
    orderBy: { createdAt: 'desc' }
  });

  const byDate = {};
  for (const o of orders) {
    const date = new Date(o.createdAt).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    if (!byDate[date]) byDate[date] = { items: [], bruto: 0, liq: 0 };
    const liq = o.netReceived || 0;
    const bruto = o.totalPrice || 0;
    byDate[date].items.push({
      name: (o.fullName || 'Cliente').split(' ').slice(0, 2).join(' '),
      bruto, liq,
      taxa: bruto - liq,
      metodo: o.paymentMethod || 'pix',
      parcelas: o.installments || 1,
    });
    byDate[date].bruto += bruto;
    byDate[date].liq += liq;
  }

  for (const [date, data] of Object.entries(byDate)) {
    console.log('\n' + date + ' | Bruto: R$ ' + data.bruto.toFixed(2) + ' | Liquido: R$ ' + data.liq.toFixed(2) + ' | Taxa: R$ ' + (data.bruto - data.liq).toFixed(2));
    for (const i of data.items) {
      console.log('   ' + i.name + ' | R$ ' + i.bruto.toFixed(2) + ' -> R$ ' + i.liq.toFixed(2) + ' (' + i.metodo + (i.parcelas > 1 ? ' ' + i.parcelas + 'x' : '') + ')');
    }
  }

  const totalBruto = orders.reduce((s, o) => s + (o.totalPrice || 0), 0);
  const totalLiq = orders.reduce((s, o) => s + (o.netReceived || 0), 0);
  console.log('\nTOTAL: Bruto R$ ' + totalBruto.toFixed(2) + ' | Liquido R$ ' + totalLiq.toFixed(2) + ' | Taxa R$ ' + (totalBruto - totalLiq).toFixed(2) + ' (' + ((totalBruto - totalLiq) / totalBruto * 100).toFixed(1) + '%)');

  await p.$disconnect();
  await pool.end();
})();
