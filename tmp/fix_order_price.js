const { PrismaClient } = require('@prisma/client');

async function main() {
    const prisma = new PrismaClient();
    try {
        const orders = await prisma.order.findMany({
            where: { id: { startsWith: 'cm04u2m9' } }
        });

        if (orders.length > 0) {
            console.log('Found order:', orders[0].id);
            await prisma.order.update({
                where: { id: orders[0].id },
                data: {
                    totalPrice: 2.00
                }
            });
            console.log('Order updated to R$ 2,00');
        } else {
            console.log('Order not found with prefix cm04u2m9');
        }
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
