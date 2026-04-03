export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma'
import OrdemClient from './OrdemClient'

export default async function OrderBumpsPage() {
    const p = prisma as any
    const bumps = (p.orderBump || p.OrderBump) ? await (p.orderBump || p.OrderBump).findMany({
        include: { product: true },
        orderBy: { createdAt: 'desc' }
    }) : []

    const products = await prisma.product.findMany({
        orderBy: { name: 'asc' }
    })

    return <OrdemClient products={products} bumps={bumps} />
}
