'use client'

import { useState, useTransition } from 'react'
import { SocialProofCard, type SocialProofItem } from '@/app/checkout/SocialProofToast'
import type { SocialProofConfig } from '@/lib/social-proof'
import { saveSocialProofConfig } from './actions'

type Limits = Record<'windowHours' | 'firstDelaySec' | 'intervalSec' | 'maxPerVisit', readonly [number, number]>

const SAMPLE: SocialProofItem = { name: 'Maria', place: 'Goiânia/GO', product: 'Nome do produto', paidAt: new Date(Date.now() - 12 * 60000).toISOString() }

function NumberField({ id, label, suffix, value, limits, onChange }: {
    id: string; label: string; suffix: string; value: number; limits: readonly [number, number]; onChange: (v: number) => void
}) {
    return (
        <div className="sp-adm-field">
            <label htmlFor={id} className="sp-adm-label">{label}</label>
            <div className="sp-adm-num">
                <input
                    id={id}
                    className="od-input"
                    type="number"
                    inputMode="numeric"
                    min={limits[0]}
                    max={limits[1]}
                    value={Number.isNaN(value) ? '' : value}
                    onChange={e => onChange(e.target.valueAsNumber)}
                />
                <span>{suffix}</span>
            </div>
            <p className="sp-adm-range">de {limits[0]} a {limits[1]}</p>
        </div>
    )
}

export default function SocialProofSettings({ config, limits, eligible }: { config: SocialProofConfig; limits: Limits; eligible: SocialProofItem[] }) {
    const [form, setForm] = useState(config)
    const [saved, setSaved] = useState(config)
    const [status, setStatus] = useState<'idle' | 'saved' | 'error'>('idle')
    const [pending, startTransition] = useTransition()

    const set = <K extends keyof SocialProofConfig>(key: K, value: SocialProofConfig[K]) => {
        setForm(f => ({ ...f, [key]: value }))
        setStatus('idle')
    }
    const inRange = (k: keyof Limits) => Number.isInteger(form[k]) && form[k] >= limits[k][0] && form[k] <= limits[k][1]
    const valid = (['windowHours', 'firstDelaySec', 'intervalSec', 'maxPerVisit'] as const).every(inRange)
    const dirty = JSON.stringify(form) !== JSON.stringify(saved)

    const save = () => startTransition(async () => {
        try {
            const res = await saveSocialProofConfig(form)
            setForm(res.config)
            setSaved(res.config)
            setStatus('saved')
        } catch {
            setStatus('error')
        }
    })

    const previewItem = eligible[0]
        ? { ...eligible[0], product: form.showProduct ? (eligible[0].product ?? 'Nome do produto') : null }
        : { ...SAMPLE, product: form.showProduct ? SAMPLE.product : null }

    return (
        <section className="dash-card" aria-labelledby="sp-adm-title">
            <div className="sp-adm-head">
                <div>
                    <h2 id="sp-adm-title" className="dash-card-title">Controle</h2>
                    <p className="dash-card-sub" style={{ marginBottom: 0 }}>
                        {saved.enabled ? 'Ligado: aparece no checkout para todos os visitantes.' : 'Desligado: nenhuma notificação aparece no checkout.'}
                    </p>
                </div>
                <label className="sp-adm-switch">
                    <input type="checkbox" role="switch" checked={form.enabled} onChange={e => set('enabled', e.target.checked)} />
                    <span className="sp-adm-switch-track" aria-hidden="true"><span /></span>
                    <span className="sp-adm-switch-text">{form.enabled ? 'Ligado' : 'Desligado'}</span>
                </label>
            </div>

            <div className="sp-adm-grid">
                <form className="sp-adm-form" onSubmit={e => { e.preventDefault(); if (valid && dirty) save() }}>
                    <fieldset className="sp-adm-field">
                        <legend className="sp-adm-label">Quais compras mostrar</legend>
                        <div className="sp-adm-seg">
                            <label className={form.scope === 'store' ? 'is-on' : ''}>
                                <input type="radio" name="scope" checked={form.scope === 'store'} onChange={() => set('scope', 'store')} />
                                Qualquer produto da loja
                            </label>
                            <label className={form.scope === 'product' ? 'is-on' : ''}>
                                <input type="radio" name="scope" checked={form.scope === 'product'} onChange={() => set('scope', 'product')} />
                                Só o produto do checkout
                            </label>
                        </div>
                    </fieldset>

                    <div className="sp-adm-row">
                        <NumberField id="sp-window" label="Compras das últimas" suffix="horas" value={form.windowHours} limits={limits.windowHours} onChange={v => set('windowHours', v)} />
                        <NumberField id="sp-max" label="Máximo por visita" suffix="avisos" value={form.maxPerVisit} limits={limits.maxPerVisit} onChange={v => set('maxPerVisit', v)} />
                        <NumberField id="sp-first" label="Primeiro aviso após" suffix="seg" value={form.firstDelaySec} limits={limits.firstDelaySec} onChange={v => set('firstDelaySec', v)} />
                        <NumberField id="sp-interval" label="Intervalo entre avisos" suffix="seg" value={form.intervalSec} limits={limits.intervalSec} onChange={v => set('intervalSec', v)} />
                    </div>

                    <label className="sp-adm-check">
                        <input type="checkbox" checked={form.showProduct} onChange={e => set('showProduct', e.target.checked)} />
                        Mostrar o nome do produto comprado
                    </label>

                    <div className="sp-adm-actions">
                        <button type="submit" className={`od-btn ${status === 'saved' && !dirty ? 'is-done' : 'is-primary'}`} disabled={!valid || !dirty || pending}>
                            {pending ? 'Salvando…' : status === 'saved' && !dirty ? 'Salvo' : 'Salvar alterações'}
                        </button>
                        {dirty && !pending && (
                            <button type="button" className="od-btn" onClick={() => { setForm(saved); setStatus('idle') }}>Descartar</button>
                        )}
                        {status === 'error' && <span className="sp-adm-error" role="alert">Não foi possível salvar. Tente de novo.</span>}
                        {!valid && <span className="sp-adm-error" role="alert">Confira os campos fora do limite.</span>}
                    </div>
                </form>

                <div className="sp-adm-side">
                    <p className="sp-adm-label">Prévia</p>
                    <div className={`sp-adm-preview${form.enabled ? '' : ' is-off'}`}>
                        <SocialProofCard item={previewItem} />
                    </div>
                    {!eligible[0] && <p className="od-hint">Exemplo ilustrativo. Sem compras pagas no período, nada aparece no checkout.</p>}

                    <p className="sp-adm-label" style={{ marginTop: 18 }}>
                        Na fila agora · {eligible.length} {eligible.length === 1 ? 'compra' : 'compras'}
                    </p>
                    {eligible.length > 0 ? (
                        <ul className="sp-adm-queue">
                            {eligible.slice(0, 6).map((i, idx) => (
                                <li key={idx}>
                                    <span><strong>{i.name}</strong>, {i.place}</span>
                                    <span className="sp-adm-queue-time">{new Date(i.paidAt).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="od-hint" style={{ marginTop: 4 }}>Nenhuma compra paga nas últimas {saved.windowHours} horas.</p>
                    )}
                    <p className="od-hint">Compras pagas de todos os produtos, conforme o período salvo. Só primeiro nome e cidade; nunca sobrenome, e-mail ou endereço.</p>
                </div>
            </div>
        </section>
    )
}
