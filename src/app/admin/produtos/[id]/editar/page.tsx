import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import EditProductForm from './EditProductForm'

export default async function EditarProdutoPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const product = await prisma.product.findUnique({ where: { id } })
    if (!product) notFound()
    return <EditProductForm product={product} />
}
