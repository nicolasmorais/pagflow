import { prisma } from '@/lib/prisma'
import CheckoutForm from './CheckoutForm'

export default async function CheckoutPage({
    searchParams
}: {
    searchParams: Promise<{ p?: string }>
}) {
    const params = await searchParams
    const productId = params.p

    let product = null

    if (productId) {
        product = await prisma.product.findUnique({
            where: { id: productId }
        })
    }

    // Default product if none found or no ID provided
    if (!product) {
        product = {
            id: '',
            name: 'Produto Padrão',
            price: 0,
            imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1999&auto=format&fit=crop'
        }
    }

    return <CheckoutForm product={product} />
}
