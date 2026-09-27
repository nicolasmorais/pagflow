import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSubscription, listInstallments } from "@/lib/woovi-subscription";

export async function POST(req: NextRequest) {
    try {
        const { orderId } = await req.json();
        if (!orderId) return NextResponse.json({ success: false, error: 'orderId obrigatório' }, { status: 400 });

        const order = await prisma.order.findUnique({ where: { id: orderId } });
        if (!order) return NextResponse.json({ success: false, error: 'Pedido não encontrado' }, { status: 404 });

        const globalID = order.mpPaymentId;
        if (!globalID) return NextResponse.json({ success: false, error: 'Sem globalID Woovi neste pedido' }, { status: 400 });

        const [details, installments] = await Promise.all([
            getSubscription(globalID),
            listInstallments(globalID),
        ]);

        const parcelasPagas = installments.filter((c: any) =>
            c.status === 'COMPLETED' || c.status === 'paid' || c.status === 'PAID'
        ).length;

        const updated = await prisma.order.update({
            where: { id: orderId },
            data: { parcelasPagas },
        });

        return NextResponse.json({
            success: true,
            parcelasPagas: updated.parcelasPagas,
            totalParcelas: updated.totalParcelas,
            status: details.status,
            nextChargeAt: details.nextChargeAt ?? details.next_charge_at ?? null,
            overdueSince: null,
            retryCount: 0,
            charges: installments.map((c: any, i: number) => ({
                cycle: c.number ?? c.cycle_number ?? (i + 1),
                status: c.status,
                amount: c.value ?? c.amount,
                dueDate: c.dueDate ?? c.due_date ?? null,
                paidAt: c.paidAt ?? c.paid_at ?? null,
            })),
        });

    } catch (error: any) {
        console.error('[WooviStatus] Erro:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
