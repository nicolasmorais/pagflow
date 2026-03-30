import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    try {
        const products = await prisma.product.findMany({ take: 1 })
        console.log('Product schema check:', JSON.stringify(products[0] || 'No products', null, 2))

        const orders = await prisma.order.findMany({ take: 1 })
        console.log('Order schema check:', JSON.stringify(orders[0] || 'No orders', null, 2))
    } catch (err: any) {
        console.error('Prisma Runtime Error:', err.message)
    } finally {
        await prisma.$disconnect()
    }
}

main()
