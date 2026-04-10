export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma'
import OrdemClient from './OrdemClient'

export default async function OrderBumpsPage() {
    const bumps = await prisma.orderBump.findMany({
        include: { product: true },
        orderBy: { createdAt: 'desc' }
    });

    const products = await prisma.product.findMany({
        orderBy: { name: 'asc' }
    })

    return <OrdemClient products={products} bumps={bumps} />
}
