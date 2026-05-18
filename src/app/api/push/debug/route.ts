import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

export async function GET() {
    const cookieStore = await cookies();
    if (cookieStore.get('admin_auth')?.value !== 'authenticated') {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    const subs = await prisma.pushSubscription.findMany({
        select: { id: true, auth: true, p256dh: true, endpoint: true, createdAt: true }
    });

    const result = subs.map(s => ({
        id: s.id,
        type: s.auth === 'capacitor' ? '🤖 NATIVE FCM' : '🌐 WEB PUSH',
        auth: s.auth,
        p256dh: s.p256dh,
        endpointPrefix: s.endpoint.slice(0, 50) + '...',
        createdAt: s.createdAt,
    }));

    return NextResponse.json({ total: subs.length, subscriptions: result });
}
