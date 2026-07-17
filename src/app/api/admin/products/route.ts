import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

async function requireAdmin() {
    const cookieStore = await cookies()
    if (cookieStore.get('admin_auth')?.value !== 'authenticated') {
        throw new Error('Não autorizado')
    }
}

export async function GET() {
    await requireAdmin()
    try {
        const products = await prisma.products.findMany({
            select: { id: true, name: true },
            orderBy: { name: 'asc' }
        })
        return NextResponse.json({ products })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
