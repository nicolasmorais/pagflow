import { prisma } from '@/lib/prisma';

// Funil Taboola server-side direto do PagFlow (sem passar pelo ControlPages):
//   start_checkout → quando o checkout abre com click ID (checkout/page.tsx)
//   make_purchase  → quando o pedido vira pago (todos os caminhos de pagamento)
// Postback: GET https://trc.taboola.com/actions-handler/log/{conta}/s2s-action?click-id=…&name=…
//
// Trava contra venda duplicada: o próprio pedido é marcado ("s2sPurchaseAt") antes do envio, numa
// atualização atômica — webhook repetido ou reprocessamento não mandam a venda de novo.
// Log: cada envio fica em "TaboolaS2SLog" (evento, click, conta, URL, resposta da Taboola).
//
// As colunas de controle no Order e a tabela de log são criadas aqui com SQL idempotente
// (IF NOT EXISTS) e ficam fora do schema.prisma de propósito: o deploy não roda migrations, e
// campo novo no schema quebraria toda leitura de pedido até alguém criar a coluna à mão.

// Conta padrão: Do Milhão. tb_acc da URL/cookie tem prioridade quando vier (start_checkout).
const DEFAULT_ACCOUNT = /^\d{4,12}$/.test(process.env.TABOOLA_S2S_DEFAULT_ACCOUNT || '') ? process.env.TABOOLA_S2S_DEFAULT_ACCOUNT! : '2138833';

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

// Pré-visualização de link, robôs de busca/SEO e navegadores automatizados não são visita.
const BOT_UA = /bot\b|bot\/|crawl|spider|slurp|preview|facebookexternalhit|facebookcatalog|meta-externalagent|whatsapp|telegram|twitterbot|slackbot|discord|linkedin|pinterest|skype|vkshare|embedly|quora link|outbrain|taboolabot|google-?inspectiontool|googleother|adsbot|mediapartners|lighthouse|pagespeed|gtmetrix|pingdom|uptime|headless|phantom|puppeteer|playwright|selenium|python-|python\/|curl\/|wget|httpclient|okhttp|axios|node-fetch|go-http|java\/|libwww|scrapy|ahrefs|semrush|mj12|dotbot|petal|yandex|baidu|bytespider|amazonbot|applebot|gptbot|claudebot|ccbot|perplexity/i;
export function isBot(userAgent: string | null | undefined): boolean {
    const ua = String(userAgent || '').trim();
    return ua.length < 20 || BOT_UA.test(ua);
}

export function postbackUrl(account: string, clickId: string, name: string, extra?: { revenue?: number | null; currency?: string | null; orderId?: string | null }): string {
    const q = new URLSearchParams({ 'click-id': clickId, name });
    if (extra?.revenue != null && Number.isFinite(extra.revenue)) q.set('revenue', Number(extra.revenue).toFixed(2));
    if (extra?.currency) q.set('currency', extra.currency);
    if (extra?.orderId) q.set('orderid', extra.orderId);
    return `https://trc.taboola.com/actions-handler/log/${encodeURIComponent(account)}/s2s-action?${q}`;
}

let ready: Promise<void> | null = null;
function ensureTables(): Promise<void> {
    if (!ready) {
        ready = (async () => {
            await prisma.$executeRawUnsafe(`ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "s2sPurchaseAt" TIMESTAMP(3)`);
            await prisma.$executeRawUnsafe(`ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "s2sPurchaseStatus" INTEGER`);
            await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "TaboolaS2SLog" (
                "id" BIGSERIAL PRIMARY KEY,
                "dedupeKey" TEXT NOT NULL UNIQUE,
                "event" TEXT NOT NULL,
                "clickId" TEXT NOT NULL,
                "account" TEXT NOT NULL,
                "orderId" TEXT,
                "productId" TEXT,
                "revenue" NUMERIC(12,2),
                "url" TEXT,
                "status" INTEGER,
                "response" TEXT,
                "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "sentAt" TIMESTAMP(3)
            )`);
            await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "TaboolaS2SLog_createdAt_idx" ON "TaboolaS2SLog" ("createdAt")`);
        })().catch(e => { ready = null; throw e; });
    }
    return ready;
}

// Grava a linha do log (uma por evento e chave) e manda o postback. false = já tinha sido enviado.
async function sendOnce(o: { dedupeKey: string; event: string; name: string; clickId: string; account: string; orderId?: string | null; productId?: string | null; revenue?: number | null }): Promise<{ sent: boolean; status: number | null; error?: string }> {
    await ensureTables();
    const ins: Array<{ id: bigint }> = await prisma.$queryRawUnsafe(
        `INSERT INTO "TaboolaS2SLog" ("dedupeKey","event","clickId","account","orderId","productId","revenue")
         VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT ("dedupeKey") DO NOTHING RETURNING "id"`,
        o.dedupeKey, o.name, o.clickId, o.account, o.orderId ?? null, o.productId ?? null, o.revenue ?? null);
    if (!ins.length) return { sent: false, status: null, error: 'já enviado' };
    const id = ins[0].id;
    const url = postbackUrl(o.account, o.clickId, o.name, o.event === 'make_purchase' ? { revenue: o.revenue, currency: 'BRL', orderId: o.orderId } : undefined);
    let status: number | null = null, error: string | undefined, body = '';
    try {
        const r = await fetch(url, { method: 'GET', signal: AbortSignal.timeout(8000), cache: 'no-store' });
        status = r.status;
        body = (await r.text().catch(() => '')).slice(0, 500);
        if (!r.ok) error = body || `HTTP ${r.status}`;
    } catch (e: any) {
        error = String(e?.message || e).slice(0, 300);
    }
    await prisma.$executeRawUnsafe(`UPDATE "TaboolaS2SLog" SET "url"=$2, "status"=$3, "response"=$4, "sentAt"=NOW() WHERE "id"=$1`, id, url, status, error ? error : body || null);
    // Falha de rede (sem resposta da Taboola): libera a chave para uma nova tentativa.
    if (status == null) await prisma.$executeRawUnsafe(`DELETE FROM "TaboolaS2SLog" WHERE "id"=$1`, id);
    console.log(`[s2s] ${o.name} click=${o.clickId} conta=${o.account}${o.orderId ? ' pedido=' + o.orderId : ''} → ${status ?? 'sem resposta'}${error ? ' ' + error.slice(0, 160) : ''}`);
    return { sent: true, status, error };
}

// Checkout aberto com click ID → start_checkout (uma vez por click).
export async function reportStartCheckout(p: { clickId: string | null; account?: string | null; eventName?: string | null; productId?: string | null; userAgent?: string | null }): Promise<void> {
    try {
        const clickId = cleanClickId(p.clickId);
        if (!clickId || isBot(p.userAgent)) return;
        const account = cleanAccount(p.account) || DEFAULT_ACCOUNT;
        await sendOnce({ dedupeKey: `start_checkout:${clickId}`, event: 'start_checkout', name: p.eventName || 'start_checkout', clickId, account, productId: p.productId });
    } catch (e: any) {
        console.error('[s2s] start_checkout:', e?.message || e);
    }
}

// Pedido pago → make_purchase. Só envia se o pedido estiver pago e tiver click ID (venda que não
// veio da Taboola não manda nada). Marca o pedido antes de enviar: o mesmo pedido nunca vai duas vezes.
export async function reportPaidOrder(orderId: string): Promise<void> {
    try {
        await ensureTables();
        const claimed: Array<{ id: string; clickId: string; totalPrice: number; productId: string | null }> = await prisma.$queryRawUnsafe(
            `UPDATE "Order" SET "s2sPurchaseAt" = NOW()
              WHERE "id" = $1 AND "s2sPurchaseAt" IS NULL AND "paymentStatus" = 'pago' AND "deletedAt" IS NULL
                AND "clickId" IS NOT NULL AND "clickId" <> ''
              RETURNING "id", "clickId", "totalPrice", "productId"`, orderId);
        const o = claimed[0];
        if (!o) return;
        const clickId = cleanClickId(o.clickId);
        if (!clickId) return;
        const product = o.productId ? await prisma.product.findUnique({ where: { id: o.productId }, select: { purchaseEventName: true } }).catch(() => null) : null;
        const res = await sendOnce({
            dedupeKey: `make_purchase:${o.id}`, event: 'make_purchase', name: product?.purchaseEventName || 'make_purchase',
            clickId, account: DEFAULT_ACCOUNT, orderId: o.id, productId: o.productId,
            revenue: Math.round((Number(o.totalPrice) || 0) * 100) / 100,
        });
        if (res.status == null && res.error !== 'já enviado') {
            // sem resposta da Taboola: desmarca para o próximo aviso de pagamento tentar de novo
            await prisma.$executeRawUnsafe(`UPDATE "Order" SET "s2sPurchaseAt" = NULL WHERE "id" = $1`, o.id);
        } else {
            await prisma.$executeRawUnsafe(`UPDATE "Order" SET "s2sPurchaseStatus" = $2 WHERE "id" = $1`, o.id, res.status);
        }
    } catch (e: any) {
        console.error('[s2s] make_purchase:', e?.message || e);
    }
}

// Últimos envios, para conferir sem abrir o banco (rota /api/s2s-log).
export async function recentS2SLog(limit = 50) {
    await ensureTables();
    return prisma.$queryRawUnsafe(
        `SELECT "event","clickId","account","orderId","revenue","status","response","createdAt","sentAt" FROM "TaboolaS2SLog" ORDER BY "id" DESC LIMIT $1`,
        Math.min(200, Math.max(1, limit)));
}
