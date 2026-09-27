import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSubscriptionDetails } from "@/lib/sync-subscription";

export async function POST(req: NextRequest) {
    try {
        const { orderId } = await req.json();
        if (!orderId) return NextResponse.json({ success: false, error: 'orderId obrigatório' }, { status: 400 });

        const order = await prisma.order.findUnique({ where: { id: orderId } });
        if (!order) return NextResponse.json({ success: false, error: 'Pedido não encontrado' }, { status: 404 });

        const subscriptionToken = order.mpPaymentId;
        if (!subscriptionToken) return NextResponse.json({ success: false, error: 'Sem subscription_token neste pedido' }, { status: 400 });

        const details = await getSubscriptionDetails(subscriptionToken);
        console.log('[SyncStatus] Resposta Sync:', JSON.stringify(details));

        // Tenta extrair número de cobranças pagas de campos possíveis
        const parcelasPagas: number =
            details.paid_charges_count ??
            details.charges_paid ??
            details.payments_count ??
            details.charges?.filter((c: any) => c.status === 'paid' || c.status === 'pago').length ??
            order.parcelasPagas;

        const syncStatus: string =
            details.status ?? details.mandate_status ?? order.paymentStatus;

        // Atualiza o pedido com os dados reais da Sync
        const updated = await prisma.order.update({
            where: { id: orderId },
            data: { parcelasPagas },
        });

        return NextResponse.json({
            success: true,
            parcelasPagas: updated.parcelasPagas,
            totalParcelas: updated.totalParcelas,
            syncStatus,
            raw: details,
        });

    } catch (error: any) {
        console.error('[SyncStatus] Erro:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
