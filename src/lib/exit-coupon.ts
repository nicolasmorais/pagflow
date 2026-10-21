import { createHmac, timingSafeEqual } from 'crypto';
import { prisma } from '@/lib/prisma';

// Cupom de recuperação oferecido quando o cliente tenta sair do checkout.
// Não existe tabela de cupons: o servidor emite um token assinado com o percentual e o prazo,
// e o process-payment só aplica o desconto se a assinatura e o prazo baterem.
export const EXIT_COUPON_PCT_KEY = 'exit_coupon_pct';
export const EXIT_COUPON_DEFAULT_PCT = 20;
export const EXIT_COUPON_MIN_PCT = 1;
export const EXIT_COUPON_MAX_PCT = 90;
export const EXIT_COUPON_TTL_MS = 15 * 60 * 1000;
// Folga para quem gerou o pagamento no último segundo do timer
const GRACE_MS = 2 * 60 * 1000;

export interface ExitCouponGrant {
    code: string;
    pct: number;
    expiresAt: number;
    token: string;
}

export const exitCouponCode = (pct: number) => `PRIMEIRA${pct}`;

/** Percentual a partir do código salvo no pedido (PRIMEIRA20 → 20). */
export function pctFromCouponCode(code: string | null | undefined): number | null {
    const m = code?.match(/^PRIMEIRA(\d{1,2})$/);
    return m ? Number(m[1]) : null;
}

export function isValidExitCouponPct(pct: number): boolean {
    return Number.isInteger(pct) && pct >= EXIT_COUPON_MIN_PCT && pct <= EXIT_COUPON_MAX_PCT;
}

export async function getExitCouponPct(): Promise<number> {
    const setting = await prisma.customization_settings.findUnique({ where: { key: EXIT_COUPON_PCT_KEY } });
    const pct = Number(setting?.value);
    return isValidExitCouponPct(pct) ? pct : EXIT_COUPON_DEFAULT_PCT;
}

function getSecret(): string {
    const secret = process.env.COUPON_SECRET || process.env.PAGARME_SECRET_KEY;
    if (!secret) throw new Error('[ExitCoupon] COUPON_SECRET não configurado');
    return secret;
}

function sign(pct: number, expiresAt: number): string {
    return createHmac('sha256', getSecret())
        .update(`${exitCouponCode(pct)}.${pct}.${expiresAt}`)
        .digest('base64url');
}

export function issueExitCoupon(pct: number): ExitCouponGrant {
    const expiresAt = Date.now() + EXIT_COUPON_TTL_MS;
    return { code: exitCouponCode(pct), pct, expiresAt, token: sign(pct, expiresAt) };
}

/** Retorna o percentual (0–1) se o cupom é válido, ou null se não é. */
export function verifyExitCoupon(coupon: unknown): number | null {
    if (!coupon || typeof coupon !== 'object') return null;
    // Cupons emitidos antes do percentual configurável não enviam pct: eram de 20%
    const { expiresAt, token, pct = EXIT_COUPON_DEFAULT_PCT } = coupon as { expiresAt?: unknown; token?: unknown; pct?: unknown };
    if (typeof expiresAt !== 'number' || typeof token !== 'string') return null;
    if (typeof pct !== 'number' || !isValidExitCouponPct(pct)) return null;
    if (Date.now() > expiresAt + GRACE_MS) return null;

    const expected = Buffer.from(sign(pct, expiresAt));
    const received = Buffer.from(token);
    if (expected.length !== received.length || !timingSafeEqual(expected, received)) return null;

    return pct / 100;
}
