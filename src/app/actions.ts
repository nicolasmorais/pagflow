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

export async function saveOrderProgress(data: any) {
    try {
        const { id, ...payload } = data;

        if (id) {
            const updated = await prisma.order.update({
                where: { id },
                data: payload,
            });
            return { success: true, id: updated.id };
        } else {
            const created = await prisma.order.create({
                data: {
                    ...payload,
                    paymentStatus: 'abandonado'
                },
            });
            revalidatePath('/admin/abandonados');
            revalidatePath('/admin');
            return { success: true, id: created.id };
        }
    } catch (error) {
        console.error('Save Progress Error:', error);
        return { success: false };
    }
}
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

// Customization Actions
export async function updateCustomization(key: string, value: string) {
    try {
        await (prisma as any).customization_settings.upsert({
            where: { key },
            update: { value, updated_at: new Date() },
            create: { key, value }
        })
        revalidatePath('/checkout')
        revalidatePath('/admin/personalizacao')
        return { success: true }
    } catch (error) {
        console.error('Update Customization Error:', error)
        throw new Error('Falha ao atualizar personalização')
    }
}

export async function getCustomization(key: string) {
    try {
        const setting = await (prisma as any).customization_settings.findUnique({
            where: { key }
        })
        return setting?.value || ''
    } catch (error) {
        console.error('Get Customization Error:', error)
        return ''
    }
}

// Shipping Actions
export async function getShippingRules() {
    try {
        return await (prisma as any).shipping_rules.findMany({
            orderBy: { price: 'asc' }
        })
    } catch (error) {
        console.error('Get Shipping Rules Error:', error)
        return []
    }
}

export async function createShippingRule(data: { name: string, price: number, delivery_time: string }) {
    try {
        await (prisma as any).shipping_rules.create({
            data: {
                name: data.name,
                price: data.price,
                delivery_time: data.delivery_time,
                is_active: true
            }
        })
        revalidatePath('/checkout')
        revalidatePath('/admin/ecommerce')
        return { success: true }
    } catch (error) {
        console.error('Create Shipping Rule Error:', error)
        throw new Error('Falha ao criar frete')
    }
}

export async function updateShippingRule(id: string, data: { name: string, price: number, delivery_time: string, is_active: boolean }) {
    try {
        await (prisma as any).shipping_rules.update({
            where: { id },
            data: {
                name: data.name,
                price: data.price,
                delivery_time: data.delivery_time,
                is_active: data.is_active
            }
        })
        revalidatePath('/checkout')
        revalidatePath('/admin/ecommerce')
        return { success: true }
    } catch (error) {
        console.error('Update Shipping Rule Error:', error)
        throw new Error('Falha ao atualizar frete')
    }
}

export async function deleteShippingRule(id: string) {
    try {
        await (prisma as any).shipping_rules.delete({ where: { id } })
        revalidatePath('/checkout')
        revalidatePath('/admin/ecommerce')
        return { success: true }
    } catch (error) {
        console.error('Delete Shipping Rule Error:', error)
        throw new Error('Falha ao excluir frete')
    }
}

export async function setupInitialShipping() {
    try {
        const count = await (prisma as any).shipping_rules.count()
        if (count === 0) {
            await (prisma as any).shipping_rules.createMany({
                data: [
                    { name: 'Entrega Econômica', price: 0, delivery_time: 'Chega em até 7 dias úteis' },
                    { name: 'Entrega Rápida Prioritária', price: 12.90, delivery_time: 'Chega em até 3 dias úteis' }
                ]
            })
            revalidatePath('/admin/ecommerce')
            return { success: true, message: 'Fretes iniciais criados' }
        }
        return { success: true, message: 'Fretes já configurados' }
    } catch (error) {
        console.error('Setup Shipping Error:', error)
        return { success: false }
    }
}

export async function createOrderBump(formData: FormData) {
    const name = formData.get('name') as string
    const price = Number(formData.get('price'))
    const description = formData.get('description') as string
    const productId = formData.get('productId') as string
    const imageUrl = formData.get('imageUrl') as string

    const p = prisma as any;
    await (p.orderBump || p.OrderBump).create({
        data: {
            name,
            price,
            description,
            productId: (productId && productId !== 'global') ? productId : null,
            imageUrl
        }
    })

    revalidatePath('/admin/ordem')
}

export async function deleteOrderBump(id: string) {
    const p = prisma as any;
    await (p.orderBump || p.OrderBump).delete({
        where: { id }
    })
    revalidatePath('/admin/ordem')
}
