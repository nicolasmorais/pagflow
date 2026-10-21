'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

export interface ExitCoupon {
    code: string;
    pct: number;
    expiresAt: number;
    token: string;
}

const STORAGE_KEY = 'pf_exit_coupon';
const SHOWN_KEY = 'pf_exit_coupon_shown';
// Não dispara nos primeiros segundos: mouse saindo da aba logo ao carregar não é intenção de sair
const ARM_DELAY_MS = 4000;

const brl = (v: number) => `R$ ${v.toFixed(2).replace('.', ',')}`;
const mmss = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

function readStored(): ExitCoupon | null {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const c = JSON.parse(raw) as ExitCoupon;
        return c.expiresAt > Date.now() ? c : null;
    } catch {
        return null;
    }
}

/** Cupom ativo (persistido no navegador até expirar) e segundos restantes. */
export function useExitCoupon() {
    const [coupon, setCouponState] = useState<ExitCoupon | null>(null);
    const [secondsLeft, setSecondsLeft] = useState(0);

    useEffect(() => { setCouponState(readStored()); }, []);

    const setCoupon = useCallback((c: ExitCoupon | null) => {
        setCouponState(c);
        try {
            if (c) localStorage.setItem(STORAGE_KEY, JSON.stringify(c));
            else localStorage.removeItem(STORAGE_KEY);
        } catch { }
    }, []);

    useEffect(() => {
        if (!coupon) return;
        const tick = () => {
            const left = Math.max(0, Math.round((coupon.expiresAt - Date.now()) / 1000));
            setSecondsLeft(left);
            if (left === 0) setCoupon(null);
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [coupon, setCoupon]);

    return { coupon, setCoupon, secondsLeft };
}

interface Props {
    /** Produto + ofertas, sem frete */
    subtotal: number;
    /** Não oferecer (pagamento já gerado, cupom já ativo etc.) */
    disabled: boolean;
    onClaim: (coupon: ExitCoupon) => void;
    onEvent?: (event: 'cupom_saida_exibido' | 'cupom_saida_ativado' | 'cupom_saida_recusado') => void;
}

export default function ExitIntentCoupon({ subtotal, disabled, onClaim, onEvent }: Props) {
    const [grant, setGrant] = useState<ExitCoupon | null>(null);
    const [secondsLeft, setSecondsLeft] = useState(0);
    const triggeredRef = useRef(false);
    const ctaRef = useRef<HTMLButtonElement>(null);
    const disabledRef = useRef(disabled);
    disabledRef.current = disabled;
    // Ref para que um callback novo a cada render não reinstale os gatilhos
    const onEventRef = useRef(onEvent);
    onEventRef.current = onEvent;

    const trigger = useCallback(async () => {
        if (triggeredRef.current || disabledRef.current) return;
        try { if (sessionStorage.getItem(SHOWN_KEY)) return; } catch { }
        triggeredRef.current = true;
        try {
            const res = await fetch('/api/exit-coupon', { method: 'POST' });
            const data = await res.json();
            if (!data.success || disabledRef.current) return;
            try { sessionStorage.setItem(SHOWN_KEY, '1'); } catch { }
            setGrant(data.coupon);
            onEventRef.current?.('cupom_saida_exibido');
        } catch { }
    }, []);

    // Gatilhos: mouse saindo pelo topo (desktop) e botão voltar (celular)
    useEffect(() => {
        let armed = false;
        let guardPushed = false;
        const armTimer = setTimeout(() => {
            armed = true;
            try {
                if (!disabledRef.current && !sessionStorage.getItem(SHOWN_KEY)) {
                    // Copia o estado do Next para que voltar a esta entrada não recarregue a página
                    history.pushState({ ...history.state, pfExitGuard: true }, '', location.href);
                    guardPushed = true;
                }
            } catch { }
        }, ARM_DELAY_MS);

        const onMouseOut = (e: MouseEvent) => {
            if (!armed || e.relatedTarget || e.clientY > 0) return;
            trigger();
        };
        const onPopState = () => {
            if (!guardPushed) return;
            guardPushed = false;
            // Se não há mais o que oferecer, o voltar segue normalmente
            if (disabledRef.current) { history.back(); return; }
            trigger();
        };

        document.addEventListener('mouseout', onMouseOut);
        window.addEventListener('popstate', onPopState);
        return () => {
            clearTimeout(armTimer);
            document.removeEventListener('mouseout', onMouseOut);
            window.removeEventListener('popstate', onPopState);
        };
    }, [trigger]);

    useEffect(() => {
        if (!grant) return;
        const tick = () => setSecondsLeft(Math.max(0, Math.round((grant.expiresAt - Date.now()) / 1000)));
        tick();
        const id = setInterval(tick, 1000);
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        ctaRef.current?.focus();
        return () => {
            clearInterval(id);
            document.body.style.overflow = prevOverflow;
        };
    }, [grant]);

    const close = useCallback(() => {
        setGrant(null);
        onEventRef.current?.('cupom_saida_recusado');
    }, []);

    useEffect(() => {
        if (!grant) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [grant, close]);

    if (!grant) return null;

    const claim = () => {
        onClaim(grant);
        onEventRef.current?.('cupom_saida_ativado');
        setGrant(null);
    };

    const discounted = subtotal * (1 - grant.pct / 100);

    return (
        <div className="xc-backdrop" onClick={close}>
            <div
                className="xc-dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby="xc-title"
                aria-describedby="xc-desc"
                onClick={e => e.stopPropagation()}
            >
                <button type="button" className="xc-close" onClick={close} aria-label="Fechar">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
                </button>

                <p className="xc-eyebrow">Espere, antes de sair</p>
                <h2 id="xc-title" className="xc-title">
                    <span className="xc-pct">{grant.pct}% OFF</span>
                    na sua primeira compra
                </h2>
                <p id="xc-desc" className="xc-desc">
                    Reservamos este desconto para você. Ele entra direto no total, sem precisar digitar nada.
                </p>

                {subtotal > 0 && (
                    <div className="xc-price">
                        <span className="xc-price-old">{brl(subtotal)}</span>
                        <span className="xc-price-new">{brl(discounted)}</span>
                    </div>
                )}

                <div className="xc-ticket">
                    <div>
                        <span className="xc-ticket-label">Cupom</span>
                        <span className="xc-ticket-code">{grant.code}</span>
                    </div>
                    <div className="xc-ticket-timer" role="timer" aria-label={`Expira em ${mmss(secondsLeft)}`}>
                        <span className="xc-ticket-label">Expira em</span>
                        <span className="xc-ticket-time">{mmss(secondsLeft)}</span>
                    </div>
                </div>

                <button ref={ctaRef} type="button" className="cta-btn xc-cta" onClick={claim}>
                    Ativar meus {grant.pct}% de desconto
                </button>
                <button type="button" className="xc-skip" onClick={close}>
                    Continuar sem desconto
                </button>
            </div>
        </div>
    );
}

/** Faixa fixa no topo enquanto o cupom está ativo */
export function ExitCouponBar({ coupon, secondsLeft }: { coupon: ExitCoupon; secondsLeft: number }) {
    return (
        <div className="xc-bar" role="status">
            <span>
                Cupom <strong>{coupon.code}</strong> ativo: {coupon.pct}% OFF
            </span>
            <span className="xc-bar-timer">
                expira em <strong>{mmss(secondsLeft)}</strong>
            </span>
        </div>
    );
}
