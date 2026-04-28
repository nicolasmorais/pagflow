
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('--- RECENTLY DELETED ORDERS ---')
    const deletedOrders = await prisma.order.findMany({
        where: {
            deletedAt: { not: null }
        },
        orderBy: {
            deletedAt: 'desc'
        },
        take: 5,
        select: {
            id: true,
            fullName: true,
            email: true,
            totalPrice: true,
            deletedAt: true,
            paymentStatus: true
        }
    })

    if (deletedOrders.length === 0) {
        console.log('No deleted orders found.')
    } else {
        deletedOrders.forEach(order => {
            console.log(`ID: ${order.id}`)
            console.log(`Name: ${order.fullName}`)
            console.log(`Email: ${order.email}`)
            console.log(`Total: R$ ${order.totalPrice}`)
            console.log(`Status: ${order.paymentStatus}`)
            console.log(`Deleted At: ${order.deletedAt}`)
            console.log('---------------------------')
        })
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
