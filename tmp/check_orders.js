const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log("Checking last 10 orders...");
    const orders = await prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            fullName: true,
            paymentStatus: true,
            mpPaymentId: true,
            createdAt: true
        }
    });

    console.table(orders);

    const processandoCount = await prisma.order.count({
        where: { paymentStatus: 'processando' }
    });
    console.log(`Total orders with 'processando' status: ${processandoCount}`);

    const abandonedCount = await prisma.order.count({
        where: { paymentStatus: 'abandonado' }
    });
    console.log(`Total orders with 'abandonado' status: ${abandonedCount}`);

    const pagoCount = await prisma.order.count({
        where: { paymentStatus: 'pago' }
    });
    console.log(`Total orders with 'pago' status: ${pagoCount}`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
