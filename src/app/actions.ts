'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { resend } from '@/lib/resend'
import { sendWebhook } from '@/lib/webhook-service'
import { uploadOrderBackup } from '@/lib/r2'

export async function sendConfirmationEmail(orderId: string) {
    try {
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: { product: true }
        });

        if (!order || !order.email) return { success: false, error: 'Pedido ou e-mail não encontrado' };

        // 1. Get Dynamic Template
        const template = await prisma.emailTemplate.findFirst({
            where: { slug: 'confirmation', isActive: true }
        });

        let subject = `Pedido Confirmado! #${order.id.slice(0, 8).toUpperCase()}`;
        let htmlContent = "";

        const replacePlaceholders = (text: string) => {
            return text
                .replace(/{{orderId}}/g, order.id.slice(0, 8).toUpperCase())
                .replace(/{{fullName}}/g, order.fullName || '')
                .replace(/{{firstName}}/g, (order.fullName || '').split(' ')[0])
                .replace(/{{productName}}/g, order.product?.name || 'Produto')
                .replace(/{{totalPrice}}/g, `R$ ${(order.totalPrice || 0).toFixed(2)}`)
                .replace(/{{paymentMethod}}/g, order.paymentMethod === 'pix' ? 'PIX' : 'Cartão de Crédito')
                .replace(/{{fullAddress}}/g, `${order.rua || ''}, ${order.numero || ''}${order.complemento ? ' - ' + order.complemento : ''}, ${order.bairro || ''}, ${order.cidade || ''}/${order.estado || ''}`)
                .replace(/{{rua}}/g, order.rua || '')
                .replace(/{{numero}}/g, order.numero || '')
                .replace(/{{bairro}}/g, order.bairro || '')
                .replace(/{{cidade}}/g, order.cidade || '')
                .replace(/{{estado}}/g, order.estado || '')
                .replace(/{{cep}}/g, order.cep || '');
        };

        if (template) {
            subject = replacePlaceholders(template.subject);
            htmlContent = replacePlaceholders(template.content);
        } else {
            // Fallback hardcoded template
            htmlContent = `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
                    <div style="background: #10b981; padding: 40px 20px; text-align: center; color: white;">
                        <h1 style="margin: 0; font-size: 28px;">Pedido Confirmado!</h1>
                        <p style="opacity: 0.9; margin-top: 10px;">Olá, ${(order.fullName || '').split(' ')[0]}. Sua compra foi processada com sucesso!</p>
                    </div>
                    <div style="padding: 30px;">
                        <h2 style="font-size: 16px; color: #64748b; text-transform: uppercase; margin-bottom: 20px; letter-spacing: 0.05em;">Detalhes da sua compra:</h2>
                        <div style="margin-bottom: 20px;">
                            <p style="font-size: 18px; font-weight: 800; margin: 0; color: #1e293b;">${order.product?.name || 'Produto'}</p>
                            <p style="font-size: 14px; color: #64748b; margin: 4px 0;">ID do Pedido: #${order.id.slice(0, 8).toUpperCase()}</p>
                        </div>
                        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #f1f5f9;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                                <span>Subtotal:</span>
                                <strong>R$ ${(order.totalPrice || 0).toFixed(2)}</strong>
                            </div>
                            <div style="display: flex; justify-content: space-between; border-top: 1px solid #e2e8f0; padding-top: 10px;">
                                <strong>Total Pago:</strong>
                                <strong style="color: #10b981; font-size: 20px;">R$ ${(order.totalPrice || 0).toFixed(2)}</strong>
                            </div>
                        </div>
                    </div>
                    <div style="background: #f1f5f9; padding: 20px; text-align: center; color: #94a3b8; font-size: 12px;">
                        <p>© ${new Date().getFullYear()} PagFlow.</p>
                    </div>
                </div>
            `;
        }

        const { data, error } = await resend.emails.send({
            from: 'Elabela Store <noreply@elabela.store>',
            to: [order.email],
            subject: subject,
            html: htmlContent
        });

        // Record Log
        try {
            console.log('RECORDING EMAIL LOG FOR ORDER:', order.id);
            await prisma.emailLog.create({
                data: {
                    orderId: order.id,
                    type: 'confirmation',
                    status: error ? 'error' : 'sent',
                    error: error ? JSON.stringify(error) : null
                }
            });
            console.log('LOG RECORDED SUCCESSFULLY');
        } catch (logErr) {
            console.error('FAILED TO RECORD EMAIL LOG:', logErr);
        }

        if (error) {
            console.error('RESEND API ERROR:', JSON.stringify(error, null, 2));
            return { success: false, error: error.message || 'Falha na API de Email' };
        }

        return { success: true, data };
    } catch (err) {
        console.error('EMAIL ACTION ERROR:', err);
        return { success: false, error: err };
    }
}

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
        const updated = await prisma.order.update({
            where: { id: orderId },
            data: { status },
            include: { product: true }
        })

        // Backup update
        uploadOrderBackup(updated).catch(e => console.error("R2 Backup Error:", e));

        revalidatePath('/admin/pedidos')
        revalidatePath('/admin')
        return { success: true }
    } catch (error) {
        console.error('Update Status Error:', error)
    }
}

export async function updatePaymentStatus(orderId: string, paymentStatus: string) {
    try {
        const updated = await prisma.order.update({
            where: { id: orderId },
            data: { paymentStatus },
            include: { product: true }
        })

        // Backup update
        uploadOrderBackup(updated).catch(e => console.error("R2 Backup Error:", e));

        revalidatePath('/admin/pedidos')
        revalidatePath('/admin')
        return { success: true }
    } catch (error) {
        console.error('Update Payment Error:', error)
        throw new Error('Falha ao atualizar o pagamento')
    }
}

export async function sendTrackingEmail(orderId: string) {
    try {
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: { product: true }
        });

        if (!order || !order.email || (!(order as any).trackingCode && !(order as any).trackingUrl)) return { success: false, error: 'Dados insuficientes' };

        const template = await prisma.emailTemplate.findFirst({
            where: { slug: 'tracking', isActive: true }
        });

        let subject = `Código de Rastreio: ${order.trackingCode}`;
        let htmlContent = "";

        const replacePlaceholders = (text: string) => {
            return text
                .replace(/{{orderId}}/g, order.id.slice(0, 8).toUpperCase())
                .replace(/{{fullName}}/g, order.fullName || '')
                .replace(/{{firstName}}/g, (order.fullName || '').split(' ')[0])
                .replace(/{{productName}}/g, order.product?.name || 'Produto')
                .replace(/{{totalPrice}}/g, `R$ ${(order.totalPrice || 0).toFixed(2)}`)
                .replace(/{{paymentMethod}}/g, order.paymentMethod === 'pix' ? 'PIX' : 'Cartão de Crédito')
                .replace(/{{trackingCode}}/g, order.trackingCode || '')
                .replace(/{{trackingUrl}}/g, (order as any).trackingUrl || `https://www.linkcorreios.com.br/${order.trackingCode}`)
                .replace(/{{estimatedDate}}/g, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR'))
                .replace(/{{fullAddress}}/g, `${order.rua || ''}, ${order.numero || ''}${order.complemento ? ' - ' + order.complemento : ''}, ${order.bairro || ''}, ${order.cidade || ''}/${order.estado || ''}`)
                .replace(/{{rua}}/g, order.rua || '')
                .replace(/{{numero}}/g, order.numero || '')
                .replace(/{{bairro}}/g, order.bairro || '')
                .replace(/{{cidade}}/g, order.cidade || '')
                .replace(/{{estado}}/g, order.estado || '')
                .replace(/{{cep}}/g, order.cep || '');
        };

        if (template) {
            subject = replacePlaceholders(template.subject);
            htmlContent = replacePlaceholders(template.content);
        } else {
            const trackLink = (order as any).trackingUrl || `https://www.linkcorreios.com.br/${order.trackingCode}`;
            htmlContent = `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
                    <div style="background: #3b82f6; padding: 40px 20px; text-align: center; color: white;">
                        <h1 style="margin: 0; font-size: 24px;">Seu pedido foi enviado!</h1>
                    </div>
                    <div style="padding: 30px; text-align: center;">
                        <p>Olá, ${(order.fullName || '').split(' ')[0]}! Temos boas notícias: seu pedido já está a caminho.</p>
                        <div style="background: #f8fafc; padding: 20px; border-radius: 12px; margin: 24px 0; border: 1px solid #f1f5f9;">
                            <p style="font-size: 14px; color: #64748b; text-transform: uppercase; font-weight: 800; margin-bottom: 8px;">Código de Rastreio</p>
                            <p style="font-size: 24px; font-weight: 800; color: #1e293b; margin: 0; letter-spacing: 2px;">${order.trackingCode || ''}</p>
                        </div>
                        <a href="${trackLink}" style="display: inline-block; background: #3b82f6; color: white; padding: 16px 32px; border-radius: 10px; text-decoration: none; font-weight: 800; font-size: 16px; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);">Acompanhar Entrega</a>
                    </div>
                </div>
            `;
        }


        const { error } = await resend.emails.send({
            from: 'Elabela Store <noreply@elabela.store>',
            to: [order.email],
            subject: subject,
            html: htmlContent,
        });

        // Record Log
        try {
            await prisma.emailLog.create({
                data: {
                    orderId: order.id,
                    type: 'tracking',
                    status: error ? 'error' : 'sent',
                    error: error ? JSON.stringify(error) : null
                }
            });
        } catch (logErr) {
            console.error('FAILED TO RECORD TRACKING LOG:', logErr);
        }

        if (error) throw error;

        // Automate status update to "enviado"
        await prisma.order.update({
            where: { id: orderId },
            data: { status: 'enviado' }
        });
        revalidatePath('/admin/vendas');
        revalidatePath('/admin/pedidos');
        revalidatePath(`/admin/pedidos/${orderId}`);

        return { success: true };
    } catch (error) {
        console.error('Send Tracking Email Error:', error);
        return { success: false };
    }
}

export async function getEmailLogs(orderId: string) {
    try {
        console.log('FETCHING LOGS FOR ORDER:', orderId);
        const logs = await prisma.emailLog.findMany({
            where: { orderId },
            orderBy: { sentAt: 'desc' }
        });
        console.log(`FOUND ${logs.length} LOGS`);
        return logs;
    } catch (error: any) {
        console.error('Get Email Logs Error:', error);
        return [];
    }
}

export async function updateOrderTracking(orderId: string, trackingCode: string, trackingUrl?: string) {
    try {
        await prisma.order.update({
            where: { id: orderId },
            data: {
                trackingCode,
                trackingUrl: trackingUrl || null
            }
        })

        // Enviar e-mail de rastreio (não bloqueia o salvamento)
        if ((trackingCode && trackingCode.trim() !== '') || (trackingUrl && trackingUrl.trim() !== '')) {
            try {
                await sendTrackingEmail(orderId);
            } catch (emailErr) {
                console.error('Failed to send tracking email:', emailErr);
            }
        }

        revalidatePath('/admin/pedidos')
        revalidatePath(`/admin/pedidos/${orderId}`)
        return { success: true }
    } catch (error) {
        console.error('Update Tracking Error:', error)
        throw new Error('Falha no banco de dados ao salvar o rastreio')
    }
}

export async function saveOrderProgress(data: any) {
    try {
        const { id, lastStepReached, ...payload } = data;

        if (id) {
            const existing = await prisma.order.findUnique({ where: { id } });
            if (existing) {
                const updatedStatus = payload.paymentStatus || 'abandonado';
                const finalStatus = (existing.paymentStatus === 'pago' && updatedStatus !== 'pago')
                    ? 'pago'
                    : updatedStatus;

                const updated = await prisma.order.update({
                    where: { id },
                    data: {
                        ...payload,
                        lastStepReached: lastStepReached || (existing.lastStepReached ? Math.max(existing.lastStepReached, 1) : 1),
                        paymentStatus: finalStatus
                    },
                    include: { product: true }
                });

                // Backup update
                uploadOrderBackup(updated).catch(e => console.error("R2 Backup Error:", e));

                revalidatePath('/admin/abandonados');
                revalidatePath('/admin');
                return { success: true, id: updated.id };
            }
        }

        // Caso não tenha id ou o id não exista no banco, cria um novo
        const created = await prisma.order.create({
            data: {
                ...payload,
                lastStepReached: lastStepReached || 1,
                paymentStatus: 'abandonado'
            },
            include: { product: true }
        });

        // Backup creation
        uploadOrderBackup(created).catch(e => console.error("R2 Backup Error:", e));

        revalidatePath('/admin/abandonados');
        revalidatePath('/admin');

        // Notify Admin
        await sendAdminNotification('abandoned', { ...payload, id: created.id }).catch(e => console.error(e));

        return { success: true, id: created.id };
    } catch (error) {
        console.error('Save Progress Error:', error);
        return { success: false };
    }
}
export async function createProduct(formData: FormData): Promise<void> {
    const name = formData.get('name') as string
    const priceValue = formData.get('price')
    const price = priceValue ? parseFloat(priceValue as string) : NaN
    const costValue = formData.get('cost')
    const cost = costValue ? parseFloat(costValue as string) : 0
    let imageUrl = formData.get('imageUrl') as string
    const isDigital = formData.get('isDigital') === 'true'

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
            cost: isNaN(cost) ? 0 : cost,
            isDigital
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
    const costValue = formData.get('cost')
    const cost = costValue ? parseFloat(costValue as string) : 0
    let imageUrl = formData.get('imageUrl') as string
    const isDigital = formData.get('isDigital') === 'true'

    if (!id || !name || isNaN(price)) {
        throw new Error('Preencha os campos obrigatórios')
    }

    try {
        console.log('UPDATING PRODUCT:', { id, name, price, cost, imageUrl, isDigital })

        if (isNaN(price)) {
            console.error('PRICE IS NaN')
            throw new Error('Preço inválido')
        }

        const data = {
            name,
            price: Number(price),
            imageUrl: imageUrl || null,
            cost: isNaN(cost) ? 0 : Number(cost),
            isDigital
        }

        const existingProduct = await prisma.product.findUnique({ where: { id } })
        if (!existingProduct) {
            throw new Error(`Produto com ID ${id} não encontrado no banco de dados.`)
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
                commission: product.commission,
                isDigital: product.isDigital
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
        await prisma.order.update({ where: { id: orderId }, data: { deletedAt: new Date() } })
        revalidatePath('/admin/pedidos')
        revalidatePath('/admin/pedidos/lixeira')
        revalidatePath('/admin')
    } catch (error) {
        console.error('Delete Order Error:', error)
        throw new Error('Falha ao excluir pedido')
    }
}

export async function restoreOrder(orderId: string): Promise<void> {
    try {
        await prisma.order.update({ where: { id: orderId }, data: { deletedAt: null } })
        revalidatePath('/admin/pedidos')
        revalidatePath('/admin/pedidos/lixeira')
        revalidatePath('/admin')
    } catch (error) {
        console.error('Restore Order Error:', error)
        throw new Error('Falha ao restaurar pedido')
    }
}

export async function permanentDeleteOrder(orderId: string): Promise<void> {
    try {
        await prisma.order.delete({ where: { id: orderId } })
        revalidatePath('/admin/pedidos/lixeira')
    } catch (error) {
        console.error('Permanent Delete Error:', error)
        throw new Error('Falha ao excluir permanentemente')
    }
}

// Customization Actions
export async function updateCustomization(key: string, value: string) {
    try {
        await prisma.customization_settings.upsert({
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
        const setting = await prisma.customization_settings.findUnique({
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
        const rules = await prisma.shipping_rules.findMany({
            orderBy: { price: 'asc' }
        })

        // Convert Decimal objects to plain numbers for Next.js serialization
        return rules.map((rule: any) => ({
            ...rule,
            price: Number(rule.price || 0)
        }));
    } catch (error) {
        console.error('Get Shipping Rules Error:', error)
        return []
    }
}

export async function createShippingRule(data: { name: string, price: number, delivery_time: string }) {
    try {
        await prisma.shipping_rules.create({
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
        await prisma.shipping_rules.update({
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
        await prisma.shipping_rules.delete({ where: { id } })
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
        const count = await prisma.shipping_rules.count()
        if (count === 0) {
            await prisma.shipping_rules.createMany({
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

    await prisma.orderBump.create({
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
    await prisma.orderBump.delete({
        where: { id }
    })
    revalidatePath('/admin/ordem')
}

export async function toggleOrderBump(id: string, isActive: boolean) {
    await prisma.orderBump.update({
        where: { id },
        data: { isActive }
    })
    revalidatePath('/admin/ordem')
}
// Email Template Actions
export async function getEmailTemplates() {
    try {
        return await prisma.emailTemplate.findMany({
            orderBy: { name: 'asc' }
        });
    } catch (error) {
        console.error('Get Email Templates Error:', error);
        return [];
    }
}

export async function createEmailTemplate(data: { name: string, slug: string, subject: string, content: string }) {
    try {
        const template = await prisma.emailTemplate.create({
            data
        });
        revalidatePath('/admin/emails');
        return { success: true, data: template };
    } catch (error) {
        console.error('Create Email Template Error:', error);
        throw new Error('Falha ao criar template');
    }
}

export async function updateEmailTemplate(id: string, data: { name?: string, slug?: string, subject?: string, content?: string, isActive?: boolean }) {
    try {
        const template = await prisma.emailTemplate.update({
            where: { id },
            data: { ...data, updatedAt: new Date() }
        });
        revalidatePath('/admin/emails');
        return { success: true, data: template };
    } catch (error) {
        console.error('Update Email Template Error:', error);
        throw new Error('Falha ao atualizar template');
    }
}

export async function deleteEmailTemplate(id: string) {
    try {
        await prisma.emailTemplate.delete({
            where: { id }
        });
        revalidatePath('/admin/emails');
        return { success: true };
    } catch (error) {
        console.error('Delete Email Template Error:', error);
        throw new Error('Falha ao excluir template');
    }
}

import { sendAdminPush } from "@/lib/push-service";

export async function sendAdminNotification(type: 'sale' | 'abandoned' | 'pix_pending', order: any) {
    try {
        const email = await getCustomization('notify_admin_email');

        // Determina título do Push
        let pushTitle = '';
        let pushBody = '';

        if (type === 'sale') {
            const method = order.paymentMethod === 'pix' ? 'PIX' : 'CARTÃO';
            pushTitle = `✅ Compra realizada - ${method}`;
            pushBody = `Valor: R$ ${order.totalPrice?.toFixed(2) || '0.00'}`;
        } else if (type === 'abandoned') {
            pushTitle = `🚨 Carrinho Abandonado`;
            pushBody = `Cliente: ${order.fullName || 'Sem nome'}`;
        } else if (type === 'pix_pending') {
            pushTitle = `⏳ PIX Gerado (Pendente)`;
            pushBody = `Valor: R$ ${order.totalPrice?.toFixed(2) || '0.00'}`;
        }

        // Tenta enviar o Web Push independentemente da configuração de e-mail
        if (pushTitle) {
            await sendAdminPush(pushTitle, pushBody, '/admin/vendas').catch(e => console.error("Erro no envio do Push:", e));
        }

        // --- WEBHOOK TRIGGER ---
        if (type === 'sale') {
            await sendWebhook('SALE_CONFIRMED', order).catch(e => console.error("Webhook Sale Error:", e));
        } else if (type === 'abandoned') {
            await sendWebhook('CART_ABANDONED', order).catch(e => console.error("Webhook Abandoned Error:", e));
        }
        // -----------------------

        if (!email) return;

        const isSalesNotify = await getCustomization('notify_sales_enabled');
        const isAbandonedNotify = await getCustomization('notify_abandoned_enabled');

        if (type === 'sale' && isSalesNotify !== 'true') return;
        if (type === 'abandoned' && isAbandonedNotify !== 'true') return;

        let subject = '';
        let htmlContent = '';

        if (type === 'sale') {
            subject = `💰 Nova Venda Recebida: R$ ${order.totalPrice?.toFixed(2) || '0.00'}`;
            htmlContent = `
                <h2>Nova venda confirmada! 🎉</h2>
                <p><strong>Pedido:</strong> ${order.id}</p>
                <p><strong>Cliente:</strong> ${order.fullName}</p>
                <p><strong>Valor:</strong> R$ ${order.totalPrice?.toFixed(2) || '0.00'}</p>
                <p>Acesse o painel para processar a venda.</p>
            `;
        } else if (type === 'abandoned') {
            subject = `🛒 Carrinho Abandonado: ${order.fullName || 'Sem nome'}`;
            htmlContent = `
                <h2>Um cliente abandonou o carrinho</h2>
                <p><strong>Cliente:</strong> ${order.fullName || 'Sem nome'}</p>
                <p><strong>Telefone/WhatsApp:</strong> ${order.phone || 'Não informado'}</p>
                <p><strong>E-mail:</strong> ${order.email || 'Não informado'}</p>
                <p>Acesse o painel para entrar em contato com o cliente.</p>
            `;
        }

        if (subject && htmlContent) {
            await resend.emails.send({
                from: 'Elabela Store <noreply@elabela.store>',
                to: [email],
                subject: subject,
                html: htmlContent
            });
        }
    } catch (error) {
        console.error('Admin Notification Error:', error);
    }
}

export async function getTotalRevenue() {
    try {
        const paidOrders = await prisma.order.findMany({
            where: {
                paymentStatus: 'pago',
                deletedAt: null
            },
            select: { totalPrice: true }
        });
        return paidOrders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
    } catch (error) {
        console.error("Error fetching total revenue:", error);
        return 0;
    }
}


export async function testPushNotificationAction() {
    try {
        await sendAdminPush('🔔 Teste de Notificação', 'Sua integração de push está funcionando perfeitamente!', '/admin/notificacoes');
        return { success: true };
    } catch (error) {
        console.error('Test push err:', error);
        return { success: false, error: 'Erro ao enviar push' };
    }
}

export async function clearAllSubscriptionsAction() {
    try {
        await prisma.pushSubscription.deleteMany();
        revalidatePath('/admin/notificacoes');
        return { success: true };
    } catch (error) {
        console.error('Clear subscriptions error:', error);
        return { success: false };
    }
}

export async function backupAllPaidOrders() {
    try {
        const { prisma } = await import('@/lib/prisma');
        const { uploadOrderBackup } = await import('@/lib/r2');

        const paidOrders = await prisma.order.findMany({
            where: { paymentStatus: 'pago' },
            include: { product: true }
        });

        console.log(`🚀 [Bulk Backup] Starting for ${paidOrders.length} paid orders...`);

        let successCount = 0;
        for (const order of paidOrders) {
            const result = await uploadOrderBackup(order);
            if (result && (result as any).success) successCount++;
        }

        console.log(`✅ [Bulk Backup] Finished. ${successCount}/${paidOrders.length} backed up.`);
        return { success: true, count: successCount, total: paidOrders.length };
    } catch (error) {
        console.error("❌ [Bulk Backup] Error:", error);
        return { success: false, error };
    }
}
