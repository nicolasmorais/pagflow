import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getDateFilters } from '@/lib/date-utils';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get('filter') || 'today';
    const from = searchParams.get('from') || undefined;
    const to = searchParams.get('to') || undefined;

    const { fromDateUTC, toDateUTC } = getDateFilters(filter, from, to);

    const orders = await prisma.order.findMany({
        where: {
            deletedAt: null,
            updatedAt: { gte: fromDateUTC, lte: toDateUTC },
            paymentStatus: { in: ['abandonado', 'processando'] },
        },
        orderBy: { updatedAt: 'desc' },
        select: { id: true, fullName: true, email: true, paymentStatus: true, lastStepReached: true, createdAt: true, updatedAt: true }
    });

    return NextResponse.json({
        filter,
        fromDateUTC,
        toDateUTC,
        count: orders.length,
        orders,
    });
}
