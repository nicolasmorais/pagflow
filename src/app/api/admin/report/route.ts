import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

export async function GET() {
    const cookieStore = await cookies();
    if (cookieStore.get('admin_auth')?.value !== 'authenticated') {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
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
