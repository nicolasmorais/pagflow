import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkData() {
    try {
        console.log('--- DATA CHECK ---');
        const totalAccess = await prisma.checkoutAccess.count();
        console.log('Total CheckoutAccess:', totalAccess);

        const totalOrders = await prisma.order.count();
        console.log('Total Orders:', totalOrders);

        const lastAccess = await prisma.checkoutAccess.findFirst({
            orderBy: { createdAt: 'desc' }
        });
        console.log('Last Access:', lastAccess ? `ID: ${lastAccess.id} Source: ${lastAccess.source}` : 'None');

    } catch (e) {
        console.error('Error fetching data:', e);
    } finally {
        await prisma.$disconnect();
    }
}

checkData();
