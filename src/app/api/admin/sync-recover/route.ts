import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSyncTransaction, SYNC_STATUS_MAP } from "@/lib/sync";
import { sendConfirmationEmail, sendAdminNotification } from "@/app/actions";

async function recover(password: string | null) {
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (adminPassword && password !== adminPassword) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Busca todos os pedidos PIX pendentes que têm identifier da Sync
    const pendingOrders = await prisma.order.findMany({
        where: {
            paymentMethod: 'pix',
            paymentStatus: { in: ['aguardando', 'processando', 'pendente'] },
            mpPaymentId: { not: null },
            deletedAt: null,
        },
        select: { id: true, mpPaymentId: true, paymentStatus: true, fullName: true, email: true }
    });

    const results: any[] = [];

    for (const order of pendingOrders) {
        try {
            const tx = await getSyncTransaction(order.mpPaymentId!);
            const newStatus = SYNC_STATUS_MAP[tx.status] || 'aguardando';

            if (newStatus !== order.paymentStatus) {
                await prisma.order.update({
                    where: { id: order.id },
                    data: {
                        paymentStatus: newStatus,
                        status: newStatus === 'pago' ? 'processando' : undefined,
                    }
                });

                if (newStatus === 'pago') {
                    try { await sendConfirmationEmail(order.id); } catch { }
                    const full = await prisma.order.findUnique({ where: { id: order.id } });
                    if (full) try { await sendAdminNotification(full); } catch { }
                }

                results.push({ orderId: order.id, de: order.paymentStatus, para: newStatus, syncStatus: tx.status });
            } else {
                results.push({ orderId: order.id, status: newStatus, unchanged: true });
            }
        } catch (err: any) {
            results.push({ orderId: order.id, erro: err.message });
        }
    }

    return NextResponse.json({
        total: pendingOrders.length,
        atualizados: results.filter(r => !r.unchanged && !r.erro).length,
        resultados: results,
    });
}

export async function GET(req: NextRequest) {
    const password = new URL(req.url).searchParams.get('password');
    return recover(password);
}

export async function POST(req: NextRequest) {
    const password = req.headers.get('x-admin-password');
    return recover(password);
}
