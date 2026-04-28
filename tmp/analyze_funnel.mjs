import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const connectionString = "postgresql://postgres:hfmhthppvm54t8rz@46.224.198.180:5445/postgres";
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log("--- ANALISANDO DADOS ---");

    // CheckoutAccess
    const accessTotal = await prisma.checkoutAccess.count();
    const leads = await prisma.checkoutAccess.count({ where: { step1Completed: true } });
    const salesAccess = await prisma.checkoutAccess.count({ where: { paymentCompleted: true } });

    console.log(`CheckoutAccess:`);
    console.log(`- Visualizações Totais: ${accessTotal}`);
    console.log(`- Leads (Informações preenchidas): ${leads}`);
    console.log(`- Vendas (via CheckoutAccess): ${salesAccess}`);

    // Order Table
    const orderStatuses = await prisma.order.groupBy({
        by: ['paymentStatus'],
        _count: { id: true }
    });

    console.log(`\nOrder Table Statuses:`);
    orderStatuses.forEach(s => {
        console.log(`- ${s.paymentStatus || 'null'}: ${s._count.id}`);
    });

    // Sales Table
    const salesTotal = await prisma.sales.count();
    const salesApproved = await prisma.sales.count({
        where: { status: { in: ['approved', 'pago', 'aprovado', 'paid'] } }
    });

    console.log(`\nSales Table:`);
    console.log(`- Total: ${salesTotal}`);
    console.log(`- Aprovados: ${salesApproved}`);

    // Calculation
    // We'll define "Abandoned Cart" as Order with paymentStatus = 'abandonado'
    // and "Sale" as Order with status that indicates success or paymentCompleted in CheckoutAccess.

    const abandonedOrders = await prisma.order.count({ where: { paymentStatus: 'abandonado' } });
    // Success statuses usually include 'approved', 'pago', 'authorized'
    const successfulOrders = await prisma.order.count({
        where: {
            paymentStatus: {
                in: ['approved', 'aprovado', 'pago', 'authorized', 'concluido']
            }
        }
    });

    console.log(`\n--- RESULTADO FINAL ---\n`);
    console.log(`Carrinhos Abandonados (Checkout iniciado mas não pago): ${abandonedOrders}`);
    console.log(`Vendas Concluídas: ${successfulOrders}`);

    if (successfulOrders > 0) {
        const ratio = abandonedOrders / successfulOrders;
        console.log(`Proporção: ${ratio.toFixed(2)} carrinhos abandonados para cada 1 venda.`);
    } else if (abandonedOrders > 0) {
        console.log(`Não há vendas registradas, mas existem ${abandonedOrders} carrinhos abandonados.`);
    } else {
        console.log(`Não há dados suficientes para calcular a proporção.`);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });
