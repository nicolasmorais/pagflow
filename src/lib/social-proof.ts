import { prisma } from '@/lib/prisma';

// Notificações de compra no checkout ("Maria, de Goiânia/GO, comprou DoriZen").
// Só usa pedidos reais pagos: sem compra no período, nada aparece.
export const SOCIAL_PROOF_KEY = 'social_proof_config';

export interface SocialProofConfig {
    enabled: boolean;
    /** Só compras do mesmo produto do checkout, ou de qualquer produto da loja */
    scope: 'product' | 'store';
    /** Mostra compras pagas nas últimas N horas */
    windowHours: number;
    /** Segundos até a primeira notificação */
    firstDelaySec: number;
    /** Segundos entre uma notificação e a próxima */
    intervalSec: number;
    /** Máximo de notificações por visita */
    maxPerVisit: number;
    showProduct: boolean;
}

export const SOCIAL_PROOF_DEFAULTS: SocialProofConfig = {
    enabled: true,
    scope: 'store',
    windowHours: 48,
    firstDelaySec: 8,
    intervalSec: 25,
    maxPerVisit: 4,
    showProduct: true,
};

export const SOCIAL_PROOF_LIMITS = {
    windowHours: [1, 168],
    firstDelaySec: [2, 120],
    intervalSec: [8, 300],
    maxPerVisit: [1, 20],
} as const;

const clampInt = (v: unknown, [min, max]: readonly [number, number], fallback: number) => {
    const n = Math.round(Number(v));
    return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
};

export function normalizeSocialProofConfig(raw: unknown): SocialProofConfig {
    const r = (raw && typeof raw === 'object' ? raw : {}) as Partial<Record<keyof SocialProofConfig, unknown>>;
    const d = SOCIAL_PROOF_DEFAULTS;
    return {
        enabled: typeof r.enabled === 'boolean' ? r.enabled : d.enabled,
        scope: r.scope === 'product' ? 'product' : r.scope === 'store' ? 'store' : d.scope,
        windowHours: clampInt(r.windowHours, SOCIAL_PROOF_LIMITS.windowHours, d.windowHours),
        firstDelaySec: clampInt(r.firstDelaySec, SOCIAL_PROOF_LIMITS.firstDelaySec, d.firstDelaySec),
        intervalSec: clampInt(r.intervalSec, SOCIAL_PROOF_LIMITS.intervalSec, d.intervalSec),
        maxPerVisit: clampInt(r.maxPerVisit, SOCIAL_PROOF_LIMITS.maxPerVisit, d.maxPerVisit),
        showProduct: typeof r.showProduct === 'boolean' ? r.showProduct : d.showProduct,
    };
}

export async function getSocialProofConfig(): Promise<SocialProofConfig> {
    const setting = await prisma.customization_settings.findUnique({ where: { key: SOCIAL_PROOF_KEY } });
    try {
        return normalizeSocialProofConfig(setting?.value ? JSON.parse(setting.value) : null);
    } catch {
        return SOCIAL_PROOF_DEFAULTS;
    }
}

export interface SocialProofItem {
    name: string;
    place: string;
    product: string | null;
    paidAt: string;
}

const LOWER_WORDS = new Set(['de', 'da', 'do', 'das', 'dos', 'e']);
const titleCase = (s: string) => s
    .toLocaleLowerCase('pt-BR')
    .split(/\s+/)
    .map((w, i) => i > 0 && LOWER_WORDS.has(w) ? w : w.charAt(0).toLocaleUpperCase('pt-BR') + w.slice(1))
    .join(' ');

/** Primeiro nome apenas — nunca expõe sobrenome, e-mail ou endereço */
function firstName(fullName: string | null): string | null {
    const first = (fullName || '').trim().split(/\s+/)[0] || '';
    if (first.length < 2 || !/^\p{L}+$/u.test(first)) return null;
    return titleCase(first);
}

/** Nome do produto sem a variação ("ZenPatch™ | 100 Und" → "ZenPatch™") e sem "(Cópia)" */
export function cleanProductName(name: string | null | undefined): string | null {
    if (!name) return null;
    const base = name.split('|')[0].replace(/\(c[óo]pia\)/gi, '').trim();
    return base || null;
}

export async function getSocialProofItems(config: SocialProofConfig, productId?: string | null, limit = 20): Promise<SocialProofItem[]> {
    const since = new Date(Date.now() - config.windowHours * 3600_000);
    const orders = await prisma.order.findMany({
        where: {
            paymentStatus: 'pago',
            deletedAt: null,
            OR: [{ paidAt: { gte: since } }, { paidAt: null, createdAt: { gte: since } }],
            ...(config.scope === 'product' && productId ? { productId } : {}),
        },
        select: { fullName: true, cidade: true, estado: true, paidAt: true, createdAt: true, product: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        take: limit * 3,
    });

    const seen = new Set<string>();
    const items: SocialProofItem[] = [];
    for (const o of orders) {
        // Pedidos de teste da própria loja não viram notificação
        if (/teste/i.test(o.product?.name || '')) continue;
        const name = firstName(o.fullName);
        const city = o.cidade?.trim();
        if (!name || !city) continue;
        const uf = (o.estado || '').trim().toUpperCase();
        const place = uf ? `${titleCase(city)}/${uf}` : titleCase(city);
        // Mesmo nome na mesma cidade conta uma vez (cliente que comprou dois itens)
        const key = `${name}|${place}`;
        if (seen.has(key)) continue;
        seen.add(key);
        items.push({
            name,
            place,
            product: config.showProduct ? cleanProductName(o.product?.name) : null,
            paidAt: (o.paidAt || o.createdAt).toISOString(),
        });
        if (items.length >= limit) break;
    }
    return items;
}
