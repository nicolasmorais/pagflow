'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function createOrder(formData: FormData) {
    const productId = formData.get('productId') as string
    const fullName = formData.get('fullName') as string
    const email = formData.get('email') as string
    const phone = formData.get('phone') as string
    const cpf = formData.get('cpf') as string

    // Address
    const cep = formData.get('cep') as string
    const rua = formData.get('rua') as string
    const numero = formData.get('numero') as string
    const complemento = formData.get('complemento') as string
    const bairro = formData.get('bairro') as string
    const cidade = formData.get('cidade') as string
    const estado = formData.get('estado') as string
    const referencia = formData.get('referencia') as string

    if (!fullName || !email || !phone || !cpf || !cep || !rua || !numero || !bairro || !cidade || !estado) {
        throw new Error('Preencha todos os campos obrigatórios')
    }

    try {
        await prisma.order.create({
            data: {
                productId: productId || null,
                fullName,
                email,
                phone,
                cpf,
                cep,
                rua,
                numero,
                complemento,
                bairro,
                cidade,
                estado,
                referencia,
                status: 'pendente'
            },
        })

        revalidatePath('/admin/pedidos')
        revalidatePath('/admin')
        return { success: true }
    } catch (error) {
        console.error('Database Error:', error)
        throw new Error('Falha ao salvar o pedido')
    }
}

export async function updateOrderStatus(orderId: string, status: string) {
    try {
        await prisma.order.update({
            where: { id: orderId },
            data: { status }
        })
        revalidatePath('/admin/pedidos')
        revalidatePath('/admin')
        return { success: true }
    } catch (error) {
        console.error('Update Status Error:', error)
    }
}

export async function updatePaymentStatus(orderId: string, paymentStatus: string) {
    try {
        await prisma.order.update({
            where: { id: orderId },
            data: { paymentStatus }
        })
        revalidatePath('/admin/pedidos')
        revalidatePath('/admin')
        return { success: true }
    } catch (error) {
        console.error('Update Payment Error:', error)
        throw new Error('Falha ao atualizar o pagamento')
    }
}

export async function updateOrderTracking(orderId: string, trackingCode: string) {
    try {
        await prisma.order.update({
            where: { id: orderId },
            data: { trackingCode }
        })
        revalidatePath('/admin/pedidos')
        return { success: true }
    } catch (error) {
        console.error('Update Tracking Error:', error)
        throw new Error('Falha ao atualizar o rastreio')
    }
}

// Product Actions
export async function createProduct(formData: FormData): Promise<void> {
    const name = formData.get('name') as string
    const priceValue = formData.get('price')
    const price = priceValue ? parseFloat(priceValue as string) : NaN
    const commissionValue = formData.get('commission')
    const commission = commissionValue ? parseFloat(commissionValue as string) : 0
    let imageUrl = formData.get('imageUrl') as string

    if (!imageUrl || imageUrl.trim() === '') {
        imageUrl = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1999&auto=format&fit=crop';
    }

    if (!name || isNaN(price)) {
        throw new Error('Preencha os campos obrigatórios (nome e preço)')
    }

    try {
        const productData = {
            name,
            price: isNaN(price) ? 0 : price,
            imageUrl: imageUrl || null,
            commission: isNaN(commission) ? 0 : commission
        }

        await prisma.product.create({
            data: productData
        })
        revalidatePath('/admin/produtos')
    } catch (error: any) {
        console.error('Create Product Error:', error)
        throw new Error(`Falha ao criar produto: ${error.message || 'Erro desconhecido'}`)
    }
}

export async function updateProduct(formData: FormData): Promise<void> {
    const id = formData.get('id') as string
    const name = formData.get('name') as string
    const priceValue = formData.get('price')
    const price = priceValue ? parseFloat(priceValue as string) : NaN
    const commissionValue = formData.get('commission')
    const commission = commissionValue ? parseFloat(commissionValue as string) : 0
    let imageUrl = formData.get('imageUrl') as string

    if (!id || !name || isNaN(price)) {
        throw new Error('Preencha os campos obrigatórios')
    }

    try {
        console.log('UPDATING PRODUCT:', { id, name, price, commission, imageUrl })

        if (isNaN(price)) {
            console.error('PRICE IS NaN')
            throw new Error('Preço inválido')
        }

        const data = {
            name,
            price: Number(price),
            imageUrl: imageUrl || null,
            commission: isNaN(commission) ? 0 : Number(commission)
        }

        const result = await prisma.product.update({
            where: { id },
            data
        })

        console.log('UPDATE SUCCESS:', result.id)
        revalidatePath('/admin/produtos')
    } catch (error: any) {
        console.error('Update Product Error Detail:', error)
        throw new Error(`Falha ao atualizar produto: ${error.message || 'Erro desconhecido'}`)
    }
}

export async function duplicateProduct(productId: string): Promise<void> {
    try {
        const product = await prisma.product.findUnique({ where: { id: productId } })
        if (!product) throw new Error('Produto não encontrado')

        await prisma.product.create({
            data: {
                name: `${product.name} (Cópia)`,
                price: product.price,
                imageUrl: product.imageUrl,
                commission: product.commission
            }
        })
        revalidatePath('/admin/produtos')
    } catch (error) {
        console.error('Duplicate Product Error:', error)
        throw new Error('Falha ao duplicar produto')
    }
}

export async function deleteProduct(productId: string): Promise<void> {
    try {
        await prisma.product.delete({ where: { id: productId } })
        revalidatePath('/admin/produtos')
    } catch (error) {
        console.error('Delete Product Error:', error)
        throw new Error('Falha ao excluir produto')
    }
}
export async function deleteOrder(orderId: string): Promise<void> {
    try {
        await prisma.order.delete({ where: { id: orderId } })
        revalidatePath('/admin/pedidos')
        revalidatePath('/admin')
    } catch (error) {
        console.error('Delete Order Error:', error)
        throw new Error('Falha ao excluir pedido')
    }
}
