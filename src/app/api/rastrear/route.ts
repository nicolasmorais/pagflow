import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const orderId = req.nextUrl.searchParams.get('orderId')?.trim()
  const cpf = req.nextUrl.searchParams.get('cpf')?.trim()
  const phone = req.nextUrl.searchParams.get('phone')?.trim()

  if (!orderId || (!cpf && !phone)) {
    return NextResponse.json(
      { error: 'Informe o ID do pedido e CPF ou telefone' },
      { status: 400 }
    )
  }

  // Build where clause — match id + (cpf OR phone)
  const where: Record<string, unknown> = { id: orderId }

  if (cpf) {
    const cleanCpf = cpf.replace(/\D/g, '')
    where.cpf = cleanCpf
  } else if (phone) {
    const cleanPhone = phone.replace(/\D/g, '')
    where.phone = { contains: cleanPhone }
  }

  const order = await prisma.order.findFirst({
    where,
    select: {
      id: true,
      status: true,
      trackingCode: true,
      trackingUrl: true,
      fullName: true,
      totalPrice: true,
      createdAt: true,
      paidAt: true,
      shippedAt: true,
      deliveredAt: true,
      product: {
        select: {
          name: true,
          price: true,
          imageUrl: true,
        },
      },
    },
  })

  if (!order) {
    return NextResponse.json(
      { error: 'Pedido não encontrado. Verifique os dados e tente novamente.' },
      { status: 404 }
    )
  }

  return NextResponse.json({ order })
}
