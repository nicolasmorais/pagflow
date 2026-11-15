import { prisma } from '@/lib/prisma';

// Funil server-side da Taboola: o PagFlow avisa o ControlPages (servidor → servidor) quando o
// checkout começa e quando o pedido é pago. O ControlPages grava em funnel_events e manda o
// postback S2S para a Taboola, com trava: o mesmo click (start_checkout) ou o mesmo pedido
// (make_purchase) nunca conta duas vezes, mesmo com webhook repetido ou reprocessamento.
//
// .env: CONTROLPAGES_URL (ex.: https://controlpages...) e CONTROLPAGES_INTERNAL_KEY
// (o mesmo valor de INTERNAL_API_KEY no ControlPages). Sem isso, nada é enviado.

const CP_URL = (process.env.CONTROLPAGES_URL || '').replace(/\/+$/, '');
const CP_KEY = process.env.CONTROLPAGES_INTERNAL_KEY || '';

export const CLICK_PARAM = 'tblci';
export const CLICK_COOKIE = 'tb_clid';
export const ACCOUNT_PARAM = 'tb_acc';
export const ACCOUNT_COOKIE = 'tb_acc';

export function cleanClickId(v: unknown): string | null {
    const s = String(v ?? '').trim();
    return s && s.length <= 512 && !/[{}\s]/.test(s) ? s : null;
}
export function cleanAccount(v: unknown): string | null {
    const s = String(v ?? '').trim();
    return /^\d{4,12}$/.test(s) ? s : null;
}

type FunnelPayload = {
    step: 'start_checkout' | 'make_purchase';
    eventName?: string | null;
    clickId: string | null;
    account?: string | null;
    orderId?: string | null;
    revenue?: number | null;
    currency?: string;
    productId?: string | null;
    utmCampaign?: string | null;
    utmTerm?: string | null;
    utmContent?: string | null;
    ip?: string | null;
    userAgent?: string | null;
};

export async function reportFunnel(p: FunnelPayload): Promise<{ ok: boolean; body?: any; error?: string }> {
    const clickId = cleanClickId(p.clickId);
    if (!clickId) return { ok: false, error: 'sem click_id' };
    if (!CP_URL || !CP_KEY) {
        console.warn('[s2s] CONTROLPAGES_URL / CONTROLPAGES_INTERNAL_KEY não configurados — etapa não enviada');
        return { ok: false, error: 'não configurado' };
    }
    try {
        const r = await fetch(`${CP_URL}/api/funnel/event`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-internal-key': CP_KEY },
            body: JSON.stringify({ ...p, clickId, account: cleanAccount(p.account) }),
            signal: AbortSignal.timeout(10000),
            cache: 'no-store',
        });
        const body = await r.json().catch(() => null);
        if (!r.ok) return { ok: false, body, error: `ControlPages ${r.status}` };
        return { ok: true, body };
    } catch (e: any) {
        console.error('[s2s] falha ao avisar o ControlPages:', e?.message || e);
        return { ok: false, error: String(e?.message || e) };
    }
}

// Pedido pago → make_purchase. Só envia se o pedido estiver pago e tiver click_id (venda que não
// veio da Taboola não manda nada). Valor = total do pedido; orderid = ID do pedido no PagFlow.
export async function reportPaidOrder(orderId: string): Promise<void> {
    try {
        const order = await prisma.order.findUnique({ where: { id: orderId }, include: { product: true } });
        if (!order || order.paymentStatus !== 'pago' || order.deletedAt) return;
        if (!cleanClickId(order.clickId)) return;
        const res = await reportFunnel({
            step: 'make_purchase',
            eventName: (order.product as any)?.purchaseEventName || 'make_purchase',
            clickId: order.clickId,
            orderId: order.id,
            revenue: Math.round((Number(order.totalPrice) || 0) * 100) / 100,
            currency: 'BRL',
            productId: order.productId,
            utmCampaign: order.utmCampaign, utmTerm: order.utmTerm, utmContent: order.utmContent,
        });
        console.log(`[s2s] make_purchase pedido ${order.id}: ${res.ok ? JSON.stringify(res.body) : res.error}`);
    } catch (e: any) {
        console.error('[s2s] reportPaidOrder:', e?.message || e);
    }
}
