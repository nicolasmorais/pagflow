'use client'

import { useState, useTransition } from 'react'
import { saveExitCouponPct } from './actions'

export default function CouponSettings({ pct, min, max }: { pct: number; min: number; max: number }) {
    const [value, setValue] = useState(String(pct))
    const [saved, setSaved] = useState(pct)
    const [error, setError] = useState<string | null>(null)
    const [justSaved, setJustSaved] = useState(false)
    const [pending, startTransition] = useTransition()

    const n = Number(value)
    const valid = Number.isInteger(n) && n >= min && n <= max
    const dirty = valid && n !== saved

    const save = () => {
        if (!dirty) return
        setError(null)
        startTransition(async () => {
            try {
                const res = await saveExitCouponPct(n)
                if (!res.success) { setError(res.error || 'Não foi possível salvar.'); return }
                setSaved(n)
                setJustSaved(true)
                setTimeout(() => setJustSaved(false), 2500)
            } catch {
                setError('Não foi possível salvar. Tente de novo.')
            }
        })
    }

    return (
        <section className="dash-card" aria-labelledby="xc-settings-title">
            <h2 id="xc-settings-title" className="dash-card-title">Desconto oferecido</h2>
            <p className="dash-card-sub">Percentual que o popup oferece a quem tenta sair do checkout.</p>
            <form className="xc-settings" onSubmit={e => { e.preventDefault(); save() }}>
                <label className="xc-settings-field">
                    <span className="xc-sr-only">Percentual de desconto</span>
                    <input
                        className="od-input xc-settings-input"
                        type="number"
                        inputMode="numeric"
                        min={min}
                        max={max}
                        step={1}
                        value={value}
                        onChange={e => { setValue(e.target.value); setError(null); setJustSaved(false) }}
                        aria-invalid={!valid}
                        aria-describedby="xc-settings-hint"
                    />
                    <span className="xc-settings-suffix" aria-hidden="true">%</span>
                </label>
                <button type="submit" className={`od-btn ${justSaved ? 'is-done' : 'is-primary'}`} disabled={!dirty || pending}>
                    {pending ? 'Salvando…' : justSaved ? 'Salvo' : 'Salvar'}
                </button>
                <span className="xc-settings-code">
                    Cupom <strong>{valid ? `PRIMEIRA${n}` : '—'}</strong>
                </span>
            </form>
            {error || !valid ? (
                <p className="od-hint" role="alert" style={{ color: 'var(--negative)' }}>
                    {error || `Use um número inteiro entre ${min} e ${max}.`}
                </p>
            ) : (
                <p id="xc-settings-hint" className="od-hint">
                    Vale para os próximos popups. Quem já ativou o cupom mantém o desconto que recebeu até o timer acabar.
                </p>
            )}
        </section>
    )
}
