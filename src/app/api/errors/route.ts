import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
        || req.headers.get('x-real-ip')
        || 'unknown';

    const { limited } = checkRateLimit(`errorlog:${ip}`, 30, 60_000);
    if (limited) {
        return NextResponse.json({ ok: true });
    }

    try {
        const { level, source, message, stack, url, userId, metadata } = await req.json();

        if (!message || typeof message !== 'string') {
            return NextResponse.json({ ok: false }, { status: 400 });
        }

        await prisma.errorLog.create({
            data: {
                level: level || 'error',
                source: source || 'client',
                message: message.substring(0, 2000),
                stack: stack?.substring(0, 5000) || null,
                url: url?.substring(0, 500) || null,
                userId: userId || null,
                metadata: metadata ? JSON.stringify(metadata).substring(0, 2000) : null,
            },
        });

        return NextResponse.json({ ok: true });
    } catch (e) {
        return NextResponse.json({ ok: true });
    }
}

export async function GET(req: NextRequest) {
    const url = new URL(req.url);
    const level = url.searchParams.get('level');
    const source = url.searchParams.get('source');
    const limit = Math.min(Number(url.searchParams.get('limit') || '50'), 200);

    const where: any = {};
    if (level) where.level = level;
    if (source) where.source = source;

    const errors = await prisma.errorLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
    });

    return NextResponse.json(errors);
}
