import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

async function requireAdmin() {
    const cookieStore = await cookies()
    if (cookieStore.get('admin_auth')?.value !== 'authenticated') {
        throw new Error('Não autorizado')
    }
}

// GET - Listar todos os pixels com produtos associados
export async function GET() {
    await requireAdmin()
    try {
        const pixels = await prisma.marketing_pixels.findMany({
            include: {
                product_pixels: {
                    include: {
                        product: {
                            select: { id: true, name: true }
                        }
                    }
                }
            },
            orderBy: { created_at: 'desc' }
        })

        const formatted = pixels.map(p => ({
            id: p.id,
            name: p.name,
            type: p.type,
            pixelId: p.pixel_id,
            createdAt: p.created_at,
            products: p.product_pixels
                .filter(pp => pp.product)
                .map(pp => ({
                    id: pp.product!.id,
                    name: pp.product!.name
                }))
        }))

        return NextResponse.json({ pixels: formatted })
    } catch (error: any) {
        console.error('Error fetching pixels:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// POST - Criar novo pixel
export async function POST(request: NextRequest) {
    await requireAdmin()
    try {
        const body = await request.json()
        const { name, type, pixelId, productIds } = body

        if (!name || !type || !pixelId) {
            return NextResponse.json({ error: 'Nome, tipo e ID do pixel são obrigatórios' }, { status: 400 })
        }

        const pixel = await prisma.marketing_pixels.create({
            data: {
                name,
                type,
                pixel_id: pixelId,
                product_pixels: productIds?.length > 0 ? {
                    create: productIds.map((pid: string) => ({
                        productId: pid
                    }))
                } : undefined
            },
            include: {
                product_pixels: {
                    include: {
                        product: { select: { id: true, name: true } }
                    }
                }
            }
        })

        return NextResponse.json({
            pixel: {
                id: pixel.id,
                name: pixel.name,
                type: pixel.type,
                pixelId: pixel.pixel_id,
                createdAt: pixel.created_at,
                products: pixel.product_pixels
                    .filter(pp => pp.product)
                    .map(pp => ({
                        id: pp.product!.id,
                        name: pp.product!.name
                    }))
            }
        })
    } catch (error: any) {
        console.error('Error creating pixel:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// PUT - Atualizar pixel (nome, tipo, pixelId, produtos)
export async function PUT(request: NextRequest) {
    await requireAdmin()
    try {
        const body = await request.json()
        const { id, name, type, pixelId, productIds } = body

        if (!id) {
            return NextResponse.json({ error: 'ID do pixel é obrigatório' }, { status: 400 })
        }

        // Atualizar o pixel
        const pixel = await prisma.marketing_pixels.update({
            where: { id },
            data: {
                name,
                type,
                pixel_id: pixelId,
            }
        })

        // Se productIds foi fornecido, atualizar associações
        if (productIds !== undefined) {
            // Remover associações existentes
            await prisma.product_pixels.deleteMany({
                where: { pixel_id: id }
            })

            // Criar novas associações
            if (productIds.length > 0) {
                await prisma.product_pixels.createMany({
                    data: productIds.map((pid: string) => ({
                        productId: pid,
                        pixel_id: id
                    }))
                })
            }
        }

        // Buscar pixel atualizado com produtos
        const updated = await prisma.marketing_pixels.findUnique({
            where: { id },
            include: {
                product_pixels: {
                    include: {
                        product: { select: { id: true, name: true } }
                    }
                }
            }
        })

        return NextResponse.json({
            pixel: {
                id: updated!.id,
                name: updated!.name,
                type: updated!.type,
                pixelId: updated!.pixel_id,
                createdAt: updated!.created_at,
                products: updated!.product_pixels
                    .filter(pp => pp.product)
                    .map(pp => ({
                        id: pp.product!.id,
                        name: pp.product!.name
                    }))
            }
        })
    } catch (error: any) {
        console.error('Error updating pixel:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// DELETE - Deletar pixel
export async function DELETE(request: NextRequest) {
    await requireAdmin()
    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json({ error: 'ID do pixel é obrigatório' }, { status: 400 })
        }

        await prisma.marketing_pixels.delete({
            where: { id }
        })

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Error deleting pixel:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
