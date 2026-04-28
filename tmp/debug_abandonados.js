const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const orders = await prisma.order.findMany({
        where: {
            paymentStatus: { in: ['abandonado', 'processando'] },
            createdAt: { gte: today }
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, fullName: true, email: true, paymentStatus: true, lastStepReached: true, createdAt: true, deletedAt: true }
    });
    console.log('ABANDONADOS HOJE:', JSON.stringify(orders, null, 2));

    const allCount = await prisma.order.count({
        where: { paymentStatus: { in: ['abandonado', 'processando'] } }
    });
    console.log('TOTAL ABANDONADOS ALL TIME:', allCount);

    // Check if there are ANY orders at all
    const totalOrders = await prisma.order.count();
    console.log('TOTAL ORDERS IN DB:', totalOrders);

    // Check most recent orders regardless of status
    const recent = await prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: { id: true, fullName: true, email: true, paymentStatus: true, createdAt: true, deletedAt: true }
    });
    console.log('RECENT ORDERS (any status):', JSON.stringify(recent, null, 2));
}
main()
    .catch(e => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
