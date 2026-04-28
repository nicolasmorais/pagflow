import pkg from '@prisma/client';
const { PrismaClient } = pkg;
const prisma = new PrismaClient();

async function main() {
    const statuses = await prisma.order.groupBy({
        by: ['paymentStatus'],
        _count: { id: true }
    });
    console.log('Order summary by paymentStatus:');
    console.log(JSON.stringify(statuses, null, 2));

    const totalOrders = await prisma.order.count();
    console.log('Total Orders:', totalOrders);
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
