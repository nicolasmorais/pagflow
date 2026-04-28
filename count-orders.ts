import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    const count = await prisma.order.count({
        where: { paymentStatus: 'pago' }
    })
    console.log('TOTAL_PAID_ORDERS:' + count)

    const statusCounts = await prisma.order.groupBy({
        by: ['paymentStatus'],
        _count: true
    })
    console.log('STATUS_COUNTS:', JSON.stringify(statusCounts))
}

main().catch(console.error).finally(() => prisma.$disconnect())
