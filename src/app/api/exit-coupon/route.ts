import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { issueExitCoupon } from "@/lib/exit-coupon";

// Emite o cupom de saída do checkout com prazo de 15 minutos
export async function POST(req: NextRequest) {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const { limited } = checkRateLimit(`exit-coupon:${ip}`, 10, 60_000);
    if (limited) {
        return NextResponse.json({ success: false, error: 'Muitas tentativas.' }, { status: 429 });
    }

    try {
        return NextResponse.json({ success: true, coupon: issueExitCoupon() });
    } catch (err: any) {
        console.error('[ExitCoupon] Erro ao emitir:', err?.message);
        return NextResponse.json({ success: false, error: 'Cupom indisponível.' }, { status: 500 });
    }
}
