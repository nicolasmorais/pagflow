import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkData() {
    console.log('--- DATA CHECK ---');
    const totalAccess = await prisma.checkoutAccess.count();
    console.log('Total CheckoutAccess:', totalAccess);

    const totalOrders = await prisma.order.count();
    console.log('Total Orders:', totalOrders);

    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    const recentAccess = await prisma.checkoutAccess.findMany({
        where: {
            createdAt: {
                gte: thirtyDaysAgo
            }
        },
        take: 10,
        orderBy: { createdAt: 'desc' }
    });

    console.log('Recent 10 Accesses:', recentAccess.length);
    recentAccess.forEach(a => {
        console.log(`[${a.createdAt.toISOString()}] ID: ${a.id.slice(0, 8)}... Source: ${a.source}`);
    });

    process.exit(0);
}

checkData();
