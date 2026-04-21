'use client'

import { useEffect, useRef, useCallback, useState } from 'react'

interface ExitPopupProps {
    productName: string
    originalPrice: number
    discountPct: number
    installments: number
    timerSeconds: number
    productId?: string
    isEnabled: boolean
    canIntercept?: boolean
    onAccept: (discountedPrice: number) => void
    onDecline: () => void
}

const SESSION_KEY = 'afShown'
const BLOCKED_PATHS = ['/pix', '/obrigado', '/sucesso', '/confirmacao', '/success', '/thank']

function trackEvent(event: string, productId?: string) {
    fetch('/api/exit-popup/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event, productId }),
    }).catch(() => { }) // non-fatal
}

function fmt(v: number) {
    return 'R$ ' + v.toFixed(2).replace('.', ',')
}

export default function ExitPopup({
    productName,
    originalPrice,
    discountPct,
    installments,
    timerSeconds,
    productId,
    isEnabled,
    onAccept,
    onDecline,
    canIntercept = true,
}: ExitPopupProps) {
    const shownRef = useRef(false)
    const [isReady, setIsReady] = useState(false)
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const remainingRef = useRef(timerSeconds)
    const overlayRef = useRef<HTMLDivElement>(null)
    const timerElRef = useRef<HTMLDivElement>(null)

    // Live values - fetched fresh from DB when popup is triggered
    const [liveDiscountPct, setLiveDiscountPct] = useState(discountPct)
    const [liveTimerSeconds, setLiveTimerSeconds] = useState(timerSeconds)
    const liveDiscountRef = useRef(discountPct)
    const liveTimerRef = useRef(timerSeconds)

    const discounted = originalPrice * (1 - liveDiscountPct / 100)
    const installValue = discounted / installments

    const isBlockedPage = useCallback(() => {
        const path = window.location.pathname.toLowerCase()
        return BLOCKED_PATHS.some(p => path.includes(p))
    }, [])

    const alreadyShown = useCallback(() => {
        return !!sessionStorage.getItem(SESSION_KEY)
    }, [])

    const updateTimer = useCallback(() => {
        const el = timerElRef.current
        if (!el) return
        const m = Math.floor(remainingRef.current / 60)
        const s = remainingRef.current % 60
        el.textContent = String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0')
        if (remainingRef.current <= 30) {
            el.style.animation = 'afPulse 0.7s ease-in-out infinite'
        }
    }, [])

    const isTestMode = useCallback(() => {
        if (typeof window === 'undefined') return false;
        return window.location.search.includes('test_af=1');
    }, []);

    const hide = useCallback(() => {
        const overlay = overlayRef.current
        if (!overlay) return
        overlay.style.opacity = '0'
        overlay.style.transition = 'opacity 0.25s ease'
        setTimeout(() => {
            overlay.style.display = 'none'
            if (isTestMode()) {
                shownRef.current = false
            }
        }, 250)
        if (timerRef.current) clearInterval(timerRef.current)
    }, [isTestMode])

    const show = useCallback(async () => {
        if (!isReady || !canIntercept) return // Still in grace period or cannot intercept (wrong step)
        const test = isTestMode();
        if ((shownRef.current || alreadyShown()) && !test) return
        if (isBlockedPage()) return

        // ALWAYS fetch LIVE config from DB before showing - this is the source of truth
        try {
            const res = await fetch('/api/exit-popup/config')
            if (res.ok) {
                const cfg = await res.json()
                // Hard stop if disabled in DB (even if prop says enabled)
                if (cfg.isEnabled === false) return
                if (cfg.discountPct) {
                    liveDiscountRef.current = cfg.discountPct
                    setLiveDiscountPct(cfg.discountPct)
                }
                if (cfg.timerSeconds) {
                    liveTimerRef.current = cfg.timerSeconds
                    setLiveTimerSeconds(cfg.timerSeconds)
                }
            } else {
                // If we can't verify config, don't show the popup
                return
            }
        } catch (_) {
            // If we can't reach the API, don't show the popup
            return
        }

        shownRef.current = true
        if (!test) sessionStorage.setItem(SESSION_KEY, '1')

        const overlay = overlayRef.current
        if (!overlay) return
        overlay.style.display = 'flex'
        void overlay.offsetHeight
        overlay.style.opacity = '1'

        if (!test) trackEvent('shown', productId)

        // Start countdown with live timer value
        remainingRef.current = liveTimerRef.current
        updateTimer()
        timerRef.current = setInterval(() => {
            remainingRef.current -= 1
            updateTimer()
            if (remainingRef.current <= 0) {
                if (timerRef.current) clearInterval(timerRef.current)
                if (!test) trackEvent('expired', productId)
                hide()
            }
        }, 1000)
    }, [alreadyShown, isBlockedPage, productId, updateTimer, hide, isTestMode, isReady])

    const handleAccept = useCallback(() => {
        if (!isTestMode()) trackEvent('accepted', productId)
        hide()
        onAccept(originalPrice * (1 - liveDiscountRef.current / 100))
    }, [hide, isTestMode, onAccept, originalPrice, productId])

    const handleDecline = useCallback(() => {
        if (!isTestMode()) trackEvent('declined', productId)
        hide()
        onDecline()
    }, [hide, isTestMode, onDecline, productId])

    useEffect(() => {
        if (!isEnabled) return

        // 5s Grace period
        const timerReady = setTimeout(() => setIsReady(true), 5000)

        const isMobile = () => /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)

        let isEngaged = false

        const setEngaged = () => {
            if (!isEngaged) isEngaged = true
        }

        // ── 1. Desktop: mouse sai pelo topo da janela ──────────────────────
        const onMouseMove = (e: MouseEvent) => {
            if (e.clientY <= 5) show()
        }

        // ── 2. Mobile: botão voltar / swipe voltar interceptado ────────────
        // Only push state IF we can intercept, otherwise just let them leave
        if (canIntercept) {
            history.pushState({ exitPopupGuard: true }, '', location.href)
        }

        const onPopState = (e: PopStateEvent) => {
            const test = isTestMode();
            if (!canIntercept) return;

            if ((!shownRef.current && !alreadyShown() && !isBlockedPage()) || test) {
                history.pushState({ exitPopupGuard: true }, '', location.href)
                if (isEngaged || !isMobile() || test) show()
            }
        }

        // ── 3. Comportamento de Scroll (Mobile e Desktop) ──────────────────
        const onScroll = () => {
            if (window.scrollY > 150) setEngaged()
        }

        // ── 4. Mobile: pull-down no topo (intenção de sair) ───────────────
        let touchStartY = 0
        let touchStartX = 0
        const onTouchStart = (e: TouchEvent) => {
            touchStartY = e.touches[0].clientY
            touchStartX = e.touches[0].clientX
        }
        const onTouchMove = (e: TouchEvent) => {
            const dy = e.touches[0].clientY - touchStartY
            const dx = Math.abs(e.touches[0].clientX - touchStartX)
            const atTop = window.scrollY <= 0 && touchStartY < 60
            // Increased dy threshold to 120px for mobile
            if (atTop && dy > 120 && dx < 40 && isEngaged) show()
        }

        // ── 5. Outros gatilhos ─────────────────────────────────────────────
        const onVisibilityChange = () => {
            if (document.visibilityState === 'hidden' && (isEngaged || !isMobile())) show()
        }
        const onInteraction = () => {
            setEngaged()
        }

        document.addEventListener('mousemove', onMouseMove, { capture: true })
        window.addEventListener('popstate', onPopState)
        window.addEventListener('scroll', onScroll, { passive: true })
        document.addEventListener('visibilitychange', onVisibilityChange)
        document.addEventListener('mousedown', onInteraction, { passive: true })

        if (isMobile()) {
            document.addEventListener('touchstart', onTouchStart, { passive: true })
            document.addEventListener('touchmove', onTouchMove, { passive: true })
        }

        return () => {
            clearTimeout(timerReady)
            document.removeEventListener('mousemove', onMouseMove, { capture: true })
            window.removeEventListener('popstate', onPopState)
            window.removeEventListener('scroll', onScroll)
            document.removeEventListener('visibilitychange', onVisibilityChange)
            document.removeEventListener('mousedown', onInteraction)
            if (isMobile()) {
                document.removeEventListener('touchstart', onTouchStart)
                document.removeEventListener('touchmove', onTouchMove)
            }
            if (timerRef.current) clearInterval(timerRef.current)
        }
    }, [isEnabled, show, alreadyShown, isBlockedPage, canIntercept])

    if (!isEnabled) {
        return null;
    }

    return (
        <>
            <style>{`
                #afOverlay {
                    display: none;
                    position: fixed;
                    inset: 0;
                    background: rgba(0,0,0,0.82);
                    z-index: 99999;
                    align-items: center;
                    justify-content: center;
                    padding: 16px;
                    opacity: 0;
                }
                #afOverlay.ready { display: flex; }
                .af-popup {
                    background: #fff;
                    border-radius: 20px;
                    width: 100%;
                    max-width: 380px;
                    overflow: hidden;
                    animation: afPopIn 0.35s cubic-bezier(0.175,0.885,0.32,1.275) forwards;
                    font-family: 'Segoe UI', sans-serif;
                }
                @keyframes afPopIn {
                    from { transform: scale(0.85); opacity: 0; }
                    to   { transform: scale(1);    opacity: 1; }
                }
                @keyframes afPulse {
                    0%,100% { transform: scale(1); }
                    50%      { transform: scale(1.08); }
                }
                .af-top { background: #c0392b; padding: 14px 20px; text-align: center; }
                .af-eyebrow { font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: rgba(255,255,255,0.75); margin-bottom: 4px; }
                .af-headline { font-size: 19px; font-weight: 900; color: #fff; line-height: 1.3; }
                .af-body { padding: 22px 22px 8px; text-align: center; }
                .af-intro { font-size: 15px; color: #6b6860; line-height: 1.55; margin-bottom: 20px; }
                .af-intro strong { color: #1a1a18; }
                .af-price-box { background: #f5f2ed; border-radius: 14px; padding: 18px 16px; margin-bottom: 18px; border: 1.5px solid #e2ddd6; }
                .af-product-name { font-size: 13px; font-weight: 700; color: #6b6860; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 12px; }
                .af-price-row { display: flex; align-items: center; justify-content: center; gap: 14px; margin-bottom: 6px; }
                .af-price-old { font-size: 18px; color: #aaa; text-decoration: line-through; font-weight: 600; }
                .af-price-new { font-size: 34px; font-weight: 900; color: #0d6e4a; line-height: 1; }
                .af-installment { font-size: 13px; color: #6b6860; margin-top: 4px; }
                .af-frete { display: inline-flex; align-items: center; gap: 5px; background: #e6f4ef; color: #0d6e4a; font-size: 12px; font-weight: 700; padding: 5px 12px; border-radius: 20px; margin-top: 10px; }
                .af-pix-note { font-size: 12px; color: #6b6860; margin-top: 6px; }
                .af-pix-note span { color: #0d6e4a; font-weight: 700; }
                .af-timer-wrap { display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 20px; }
                .af-timer-label { font-size: 13px; color: #6b6860; }
                .af-timer-count { font-size: 20px; font-weight: 900; color: #c0392b; background: #fdecea; border-radius: 8px; padding: 4px 12px; min-width: 72px; text-align: center; }
                .af-btn-yes { display: block; width: 100%; background: #0d6e4a; color: #fff; border: none; border-radius: 12px; padding: 17px; font-size: 17px; font-weight: 700; font-family: inherit; cursor: pointer; margin-bottom: 10px; transition: background 0.15s, transform 0.1s; line-height: 1.3; }
                .af-btn-yes:hover { background: #0a5438; }
                .af-btn-yes:active { transform: scale(0.98); }
                .af-btn-yes small { display: block; font-size: 12px; font-weight: 400; opacity: 0.8; margin-top: 2px; }
                .af-footer { text-align: center; padding: 0 22px 20px; }
                .af-btn-no { display: block; width: 100%; background: none; border: none; color: #bbb; font-size: 13px; font-family: inherit; cursor: pointer; padding: 10px; text-decoration: underline; transition: color 0.15s; }
                .af-btn-no:hover { color: #888; }
                .af-never { font-size: 13px; color: #aaa; line-height: 1.5; margin-top: 4px; }
            `}</style>

            <div
                id="afOverlay"
                ref={overlayRef}
                className="ready"
                style={{ display: 'none', position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.82)', zIndex: 99999, alignItems: 'center', justifyContent: 'center', padding: '16px', opacity: 0 }}
                onClick={(e) => { if (e.target === e.currentTarget) handleDecline() }}
            >
                <div className="af-popup">
                    <div className="af-top">
                        <div className="af-eyebrow">Oferta exclusiva — só agora</div>
                        <div className="af-headline">Espera! Antes de você ir... 😮</div>
                    </div>

                    <div className="af-body">
                        <p className="af-intro">
                            Não queremos que você perca essa transformação por causa do preço.<br />
                            Criamos uma condição especial <strong>só para você, só agora:</strong>
                        </p>

                        <div className="af-price-box">
                            <div className="af-product-name">{productName}</div>
                            <div className="af-price-row">
                                <div className="af-price-old">{fmt(originalPrice)}</div>
                                <div className="af-price-new">{fmt(discounted)}</div>
                            </div>
                            <div className="af-installment">
                                ou {installments}x de {fmt(installValue)} no cartão
                            </div>
                            <div className="af-frete">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="#0d6e4a">
                                    <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
                                </svg>
                                Frete grátis incluído
                            </div>
                            <div className="af-pix-note">Pagando no <span>Pix</span> — aprovação imediata</div>
                        </div>

                        <div className="af-timer-wrap">
                            <div className="af-timer-label">Oferta expira em:</div>
                            <div className="af-timer-count" ref={timerElRef}>
                                {String(Math.floor(timerSeconds / 60)).padStart(2, '0')}:{String(timerSeconds % 60).padStart(2, '0')}
                            </div>
                        </div>

                        <button className="af-btn-yes" onClick={handleAccept}>
                            Sim! Quero aproveitar no Pix
                            <small>Garantir por {fmt(discounted)} + frete grátis</small>
                        </button>
                    </div>

                    <div className="af-footer">
                        <button className="af-btn-no" onClick={handleDecline}>
                            Não, prefiro perder essa oferta
                        </button>
                        <p className="af-never">Você nunca mais verá essa condição 😢</p>
                    </div>
                </div>
            </div>
        </>
    )
}
