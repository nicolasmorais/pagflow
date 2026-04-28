
import { prisma } from '../src/lib/prisma'

async function main() {
    console.log('--- RECENTLY DELETED ORDERS ---')
    try {
        const deletedOrders = await prisma.order.findMany({
            where: {
                deletedAt: { not: null }
            },
            orderBy: {
                deletedAt: 'desc'
            },
            take: 5
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
    } catch (err) {
        console.error('Database Error:', err)
    } finally {
        await (prisma as any).$disconnect?.()
    }
}

main()
