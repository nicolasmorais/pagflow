import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cancelSubscription, refundInstallment } from "@/lib/woovi-subscription";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { orderId, action } = body;
        if (!orderId || !action) return NextResponse.json({ success: false, error: 'orderId e action obrigatórios' }, { status: 400 });

        const order = await prisma.order.findUnique({ where: { id: orderId } });
        if (!order) return NextResponse.json({ success: false, error: 'Pedido não encontrado' }, { status: 404 });

        const globalID = order.mpPaymentId;
        if (!globalID) return NextResponse.json({ success: false, error: 'Sem globalID Woovi' }, { status: 400 });

        if (action === 'cancel') {
            await cancelSubscription(globalID);
            await prisma.order.update({ where: { id: orderId }, data: { paymentStatus: 'recusado' } });
        } else if (action === 'refund') {
            const { chargeCorrelationID, value } = body;
            if (!chargeCorrelationID) return NextResponse.json({ success: false, error: 'chargeCorrelationID obrigatório' }, { status: 400 });
            await refundInstallment(chargeCorrelationID, value ? Number(value) : undefined);
        } else {
            return NextResponse.json({ success: false, error: 'Ação não suportada. Use: cancel, refund' }, { status: 400 });
        }

        return NextResponse.json({ success: true, action });
    } catch (error: any) {
        console.error('[WooviAction] Erro:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
