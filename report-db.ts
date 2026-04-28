import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    const ordersCount = await prisma.order.count()
    const paidCount = await prisma.order.count({ where: { paymentStatus: 'pago' } })
    const abandonedCount = await prisma.order.count({ where: { paymentStatus: 'abandonado' } })
    const salesCount = await prisma.sales.count()

    console.log('--- DB REPORT ---')
    console.log('Total Orders (Model Order):', ordersCount)
    console.log('Paid Orders (Model Order):', paidCount)
    console.log('Abandoned Orders (Model Order):', abandonedCount)
    console.log('Total Sales (Model sales):', salesCount)
    console.log('-----------------')
}

main().catch(console.error).finally(() => prisma.$disconnect())
