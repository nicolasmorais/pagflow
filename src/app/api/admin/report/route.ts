import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const counts = await prisma.order.groupBy({
            by: ['paymentStatus'],
            _count: true
        });
        const salesCount = await prisma.sales.count();
        return NextResponse.json({ counts, salesCount });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
