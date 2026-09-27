import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET — busca config de assinatura de um produto
export async function GET(req: NextRequest) {
    const productId = new URL(req.url).searchParams.get('productId');
    if (!productId) return NextResponse.json({ error: 'productId obrigatório' }, { status: 400 });

    const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { subscriptionEnabled: true, subscriptionPrice: true, subscriptionPlanToken: true },
    });
    if (!product) return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
    return NextResponse.json(product);
}

// PATCH — atualiza config de assinatura
export async function PATCH(req: NextRequest) {
    const body = await req.json();
    const { productId, subscriptionEnabled, subscriptionPrice } = body;
    if (!productId) return NextResponse.json({ error: 'productId obrigatório' }, { status: 400 });

    const data: any = {};
    if (typeof subscriptionEnabled === 'boolean') data.subscriptionEnabled = subscriptionEnabled;
    if (subscriptionPrice !== undefined) data.subscriptionPrice = subscriptionPrice ? Number(subscriptionPrice) : null;

    // Se desativando, limpa o token do plano para forçar recriação quando reativar
    if (subscriptionEnabled === false) data.subscriptionPlanToken = null;

    const product = await prisma.product.update({ where: { id: productId }, data });
    return NextResponse.json({ success: true, product });
}
