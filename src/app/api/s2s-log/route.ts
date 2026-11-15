import { NextResponse } from 'next/server';
import { recentS2SLog } from '@/lib/funnel-s2s';

// Últimos postbacks S2S enviados à Taboola (evento, click, conta, pedido, resposta), para depurar.
// Header x-s2s-key = S2S_LOG_KEY (ou, se não houver, CONTROLPAGES_INTERNAL_KEY).
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const key = process.env.S2S_LOG_KEY || process.env.CONTROLPAGES_INTERNAL_KEY;
    if (!key || req.headers.get('x-s2s-key') !== key) return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
    const limit = Number(new URL(req.url).searchParams.get('limit')) || 50;
    try {
        const rows = await recentS2SLog(limit);
        return NextResponse.json(JSON.parse(JSON.stringify(rows, (_, v) => (typeof v === 'bigint' ? String(v) : v))));
    } catch (e: any) {
        return NextResponse.json({ message: e?.message || 'erro' }, { status: 500 });
    }
}
