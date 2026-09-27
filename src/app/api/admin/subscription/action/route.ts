import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cancelSubscription, suspendSubscription, resumeSubscription } from "@/lib/sync-subscription";

export async function POST(req: NextRequest) {
    try {
        const { orderId, action } = await req.json();
        if (!orderId || !action) return NextResponse.json({ success: false, error: 'orderId e action obrigatórios' }, { status: 400 });

        const order = await prisma.order.findUnique({ where: { id: orderId } });
        if (!order) return NextResponse.json({ success: false, error: 'Pedido não encontrado' }, { status: 404 });

        const token = order.mpPaymentId;
        if (!token) return NextResponse.json({ success: false, error: 'Sem subscription_token' }, { status: 400 });

        if (action === 'cancel') {
            await cancelSubscription(token);
            await prisma.order.update({ where: { id: orderId }, data: { paymentStatus: 'recusado' } });
        } else if (action === 'suspend') {
            await suspendSubscription(token);
            await prisma.order.update({ where: { id: orderId }, data: { paymentStatus: 'aguardando' } });
        } else if (action === 'resume') {
            await resumeSubscription(token);
            await prisma.order.update({ where: { id: orderId }, data: { paymentStatus: 'pago' } });
        } else {
            return NextResponse.json({ success: false, error: 'Ação inválida' }, { status: 400 });
        }

        return NextResponse.json({ success: true, action });
    } catch (error: any) {
        console.error('[SubscriptionAction] Erro:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
