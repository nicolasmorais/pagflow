'use client'

import { useEffect, useRef, useState } from 'react'
import './social-proof.css'

export interface SocialProofItem {
    name: string;
    place: string;
    product: string | null;
    paidAt: string;
}

const SHOW_MS = 6000;
const COUNT_KEY = 'pf_sp_count';

/** Cartão visual — usado no checkout e na prévia do admin */
export function SocialProofCard({ item, onClose, leaving }: { item: SocialProofItem; onClose?: () => void; leaving?: boolean }) {
    return (
        <div className={`sp-card${leaving ? ' is-leaving' : ''}`}>
            <span className="sp-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
            </span>
            <div className="sp-body">
                <p className="sp-title"><strong>{item.name}</strong>, de {item.place}</p>
                <p className="sp-text">{item.product ? <>comprou <strong>{item.product}</strong></> : 'fez uma compra'}</p>
            </div>
            {onClose && (
                <button type="button" className="sp-close" onClick={onClose} aria-label="Fechar notificação">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M7 7l10 10M17 7L7 17" /></svg>
                </button>
            )}
        </div>
    )
}

interface Props {
    productId?: string;
    /** Pausa enquanto o cliente vê o PIX, o popup de saída etc. */
    paused: boolean;
    onEvent?: (event: 'prova_social_exibida' | 'prova_social_fechada') => void;
}

export default function SocialProofToast({ productId, paused, onEvent }: Props) {
    const [current, setCurrent] = useState<SocialProofItem | null>(null)
    const [leaving, setLeaving] = useState(false)
    const pausedRef = useRef(paused)
    pausedRef.current = paused
    const onEventRef = useRef(onEvent)
    onEventRef.current = onEvent
    const stoppedRef = useRef(false)

    useEffect(() => {
        let cancelled = false
        const timers: ReturnType<typeof setTimeout>[] = []
        const later = (fn: () => void, ms: number) => { timers.push(setTimeout(fn, ms)) }

        ;(async () => {
            let data: any
            try {
                const res = await fetch(`/api/social-proof${productId ? `?p=${encodeURIComponent(productId)}` : ''}`)
                data = await res.json()
            } catch { return }
            if (cancelled || !data?.enabled || !data.items?.length) return

            const items: SocialProofItem[] = data.items
            let shown = 0
            try { shown = Number(sessionStorage.getItem(COUNT_KEY)) || 0 } catch { }
            const max = Math.min(data.maxPerVisit, items.length)

            const next = () => {
                if (cancelled || stoppedRef.current || shown >= max) return
                // Não disputa atenção: espera se a aba está oculta, o checkout pausou ou o popup de saída está aberto
                if (pausedRef.current || document.hidden || document.querySelector('.xc-backdrop')) {
                    later(next, 3000)
                    return
                }
                const item = items[shown % items.length]
                shown += 1
                try { sessionStorage.setItem(COUNT_KEY, String(shown)) } catch { }
                setLeaving(false)
                setCurrent(item)
                onEventRef.current?.('prova_social_exibida')
                later(() => setLeaving(true), SHOW_MS)
                later(() => setCurrent(null), SHOW_MS + 300)
                later(next, data.intervalSec * 1000)
            }
            later(next, data.firstDelaySec * 1000)
        })()

        return () => { cancelled = true; timers.forEach(clearTimeout) }
    }, [productId])

    if (!current) return null

    const close = () => {
        // Quem fecha uma não vê mais nenhuma nesta visita
        stoppedRef.current = true
        try { sessionStorage.setItem(COUNT_KEY, '999') } catch { }
        onEventRef.current?.('prova_social_fechada')
        setLeaving(true)
        setTimeout(() => setCurrent(null), 300)
    }

    return (
        <div className="sp-region" role="status" aria-live="polite">
            <SocialProofCard item={current} onClose={close} leaving={leaving} />
        </div>
    )
}
