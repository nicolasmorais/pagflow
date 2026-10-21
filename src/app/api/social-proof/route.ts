import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { getSocialProofConfig, getSocialProofItems } from "@/lib/social-proof";

// Compras reais recentes para as notificações do checkout
export async function GET(req: NextRequest) {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const { limited } = checkRateLimit(`social-proof:${ip}`, 20, 60_000);
    if (limited) return NextResponse.json({ enabled: false, items: [] }, { status: 429 });

    try {
        const config = await getSocialProofConfig();
        if (!config.enabled) return NextResponse.json({ enabled: false, items: [] });

        const productId = new URL(req.url).searchParams.get('p');
        const items = await getSocialProofItems(config, productId);
        return NextResponse.json({
            enabled: true,
            firstDelaySec: config.firstDelaySec,
            intervalSec: config.intervalSec,
            maxPerVisit: config.maxPerVisit,
            items,
        });
    } catch (err: any) {
        console.error('[SocialProof] Erro:', err?.message);
        return NextResponse.json({ enabled: false, items: [] });
    }
}
