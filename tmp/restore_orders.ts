
import { prisma } from '../src/lib/prisma'

async function main() {
    const idsToRestore = ['cmo322hyy003201l946im127v', 'cmo49rept000b01qtsj6qm45i']
    console.log(`--- RESTORING ORDERS: ${idsToRestore.join(', ')} ---`)

    try {
        const result = await prisma.order.updateMany({
            where: {
                id: { in: idsToRestore }
            },
            data: {
                deletedAt: null
            }
        })

        console.log(`Successfully restored ${result.count} orders.`)
    } catch (err) {
        console.error('Database Error:', err)
    } finally {
        await (prisma as any).$disconnect?.()
    }
}

main()
