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

        // Conta parcelas pagas pelo array charges
        const charges: any[] = details.charges ?? [];
        const parcelasPagas = charges.filter((c: any) => c.status === 'paid').length;

        // Atualiza o banco com o estado real
        const updated = await prisma.order.update({
            where: { id: orderId },
            data: { parcelasPagas },
        });

        return NextResponse.json({
            success: true,
            parcelasPagas: updated.parcelasPagas,
            totalParcelas: updated.totalParcelas,
            status: details.status,
            nextChargeAt: details.next_charge_at,
            overdueSince: details.overdue_since,
            retryCount: details.retry_count ?? 0,
            charges: charges.map((c: any) => ({
                cycle: c.cycle_number,
                status: c.status,
                amount: c.amount,
                dueDate: c.due_date,
                paidAt: c.paid_at,
            })),
        });

    } catch (error: any) {
        console.error('[SyncStatus] Erro:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
