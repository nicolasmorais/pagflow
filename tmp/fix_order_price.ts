import { PrismaClient } from '@prisma/client';

async function main() {
    const prisma = new PrismaClient();
    try {
        const order = await prisma.order.findMany({
            where: { id: { startsWith: 'cm04u2m9' } }
        });

        if (order.length > 0) {
            console.log('Found order:', order[0].id);
            const updated = await prisma.order.update({
                where: { id: order[0].id },
                data: {
                    totalPrice: 2.00
                }
            });
            console.log('Order updated to R$ 2,00');
        } else {
            console.log('Order not found with prefix CM04U2M9');
        }
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
