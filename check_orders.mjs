import pkg from '@prisma/client';
const { PrismaClient } = pkg;

const prisma = new PrismaClient()

async function main() {
    const orders = await prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10
    })
    console.log(JSON.stringify(orders, null, 2))
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect()
    })
