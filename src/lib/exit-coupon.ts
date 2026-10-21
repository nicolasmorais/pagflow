import { createHmac, timingSafeEqual } from 'crypto';

// Cupom de recuperação oferecido quando o cliente tenta sair do checkout.
// Não existe tabela de cupons: o servidor emite um token assinado com o prazo,
// e o process-payment só aplica o desconto se a assinatura e o prazo baterem.
export const EXIT_COUPON_CODE = 'PRIMEIRA20';
export const EXIT_COUPON_PCT = 20;
export const EXIT_COUPON_TTL_MS = 15 * 60 * 1000;
// Folga para quem gerou o pagamento no último segundo do timer
const GRACE_MS = 2 * 60 * 1000;

export interface ExitCouponGrant {
    code: string;
    pct: number;
    expiresAt: number;
    token: string;
}

function getSecret(): string {
    const secret = process.env.COUPON_SECRET || process.env.PAGARME_SECRET_KEY;
    if (!secret) throw new Error('[ExitCoupon] COUPON_SECRET não configurado');
    return secret;
}

function sign(expiresAt: number): string {
    return createHmac('sha256', getSecret())
        .update(`${EXIT_COUPON_CODE}.${EXIT_COUPON_PCT}.${expiresAt}`)
        .digest('base64url');
}

export function issueExitCoupon(): ExitCouponGrant {
    const expiresAt = Date.now() + EXIT_COUPON_TTL_MS;
    return { code: EXIT_COUPON_CODE, pct: EXIT_COUPON_PCT, expiresAt, token: sign(expiresAt) };
}

/** Retorna o percentual (0–1) se o cupom é válido, ou null se não é. */
export function verifyExitCoupon(coupon: unknown): number | null {
    if (!coupon || typeof coupon !== 'object') return null;
    const { expiresAt, token } = coupon as { expiresAt?: unknown; token?: unknown };
    if (typeof expiresAt !== 'number' || typeof token !== 'string') return null;
    if (Date.now() > expiresAt + GRACE_MS) return null;

    const expected = Buffer.from(sign(expiresAt));
    const received = Buffer.from(token);
    if (expected.length !== received.length || !timingSafeEqual(expected, received)) return null;

    return EXIT_COUPON_PCT / 100;
}
