import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        if (!id) {
            return NextResponse.json({ error: "ID obrigatório" }, { status: 400 });
        }

        const order = await prisma.order.findUnique({
            where: { id },
            select: {
                id: true,
                paymentStatus: true,
                status: true,
                mpPaymentId: true,
            }
        });

        if (!order) {
            return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
        }

        return NextResponse.json({
            id: order.id,
            paymentStatus: order.paymentStatus,
            status: order.status,
        });
    } catch (error: any) {
        return NextResponse.json({ error: "Erro interno" }, { status: 500 });
    }
}
