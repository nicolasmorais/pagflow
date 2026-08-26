import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')?.trim()

  if (!code) {
    return NextResponse.json(
      { error: 'Informe o código de rastreio' },
      { status: 400 }
    )
  }

  const order = await prisma.order.findFirst({
    where: {
      trackingCode: code,
      deletedAt: null,
    },
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
      { error: 'Código de rastreio não encontrado. Verifique e tente novamente.' },
      { status: 404 }
    )
  }

  return NextResponse.json({ order })
}
