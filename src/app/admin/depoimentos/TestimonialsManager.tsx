'use client'

import { useState, useTransition } from 'react'
import { ArrowDown, ArrowUp, Eye, EyeOff, Pencil, Plus, Trash2 } from 'lucide-react'
import CheckoutTestimonials from '@/app/checkout/CheckoutTestimonials'
import type { Testimonial, TestimonialsConfig } from '@/lib/testimonials'
import { saveTestimonials } from './actions'

type Limits = { maxShown: readonly [number, number]; name: number; location: number; text: number; title: number; items: number }
type Draft = Omit<Testimonial, 'id' | 'active'> & { id: string | null }

const EMPTY: Draft = { id: null, name: '', location: '', text: '', rating: 5, photoUrl: '' }
const newId = () => Math.random().toString(36).slice(2, 10)
const isHttps = (v: string) => !v || /^https:\/\/[^\s"'<>]+$/i.test(v.trim())

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
    return (
        <div className="tm-stars" role="radiogroup" aria-label="Nota">
            {[1, 2, 3, 4, 5].map(n => (
                <button
                    key={n}
                    type="button"
                    role="radio"
                    aria-checked={value === n}
                    aria-label={`${n} ${n === 1 ? 'estrela' : 'estrelas'}`}
                    className={n <= value ? 'is-on' : ''}
                    onClick={() => onChange(n)}
                >
                    <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 1.6l2.6 5.3 5.8.8-4.2 4.1 1 5.8L10 14.9l-5.2 2.7 1-5.8L1.6 7.7l5.8-.8z" /></svg>
                </button>
            ))}
        </div>
    )
}

export default function TestimonialsManager({ initial, limits }: { initial: TestimonialsConfig; limits: Limits }) {
    const [config, setConfig] = useState(initial)
    const [saved, setSaved] = useState(initial)
    const [draft, setDraft] = useState<Draft | null>(initial.items.length === 0 ? EMPTY : null)
    const [draftError, setDraftError] = useState<string | null>(null)
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
    const [status, setStatus] = useState<'idle' | 'saved' | 'error'>('idle')
    const [pending, startTransition] = useTransition()

    const dirty = JSON.stringify(config) !== JSON.stringify(saved)
    const update = (patch: Partial<TestimonialsConfig>) => { setConfig(c => ({ ...c, ...patch })); setStatus('idle') }
    const setItems = (fn: (items: Testimonial[]) => Testimonial[]) => update({ items: fn(config.items) })

    // Quais aparecem no checkout: os primeiros ativos, até o limite
    const shownIds = new Set(config.items.filter(i => i.active).slice(0, config.maxShown).map(i => i.id))
    const preview = config.items.filter(i => shownIds.has(i.id))

    const commitDraft = () => {
        if (!draft) return
        if (!draft.name.trim()) return setDraftError('Informe o nome de quem deu o depoimento.')
        if (!draft.text.trim()) return setDraftError('Escreva o depoimento.')
        if (!isHttps(draft.photoUrl)) return setDraftError('A foto precisa ser um link que começa com https://')
        const clean = { name: draft.name.trim(), location: draft.location.trim(), text: draft.text.trim(), rating: draft.rating, photoUrl: draft.photoUrl.trim() }
        if (draft.id) setItems(items => items.map(i => i.id === draft.id ? { ...i, ...clean } : i))
        else setItems(items => [...items, { id: newId(), active: true, ...clean }])
        setDraft(null)
        setDraftError(null)
    }

    const move = (idx: number, dir: -1 | 1) => setItems(items => {
        const next = [...items]
        const [it] = next.splice(idx, 1)
        next.splice(idx + dir, 0, it)
        return next
    })

    const save = () => startTransition(async () => {
        try {
            const res = await saveTestimonials(config)
            setConfig(res.config)
            setSaved(res.config)
            setStatus('saved')
            setTimeout(() => setStatus(st => st === 'saved' ? 'idle' : st), 3500)
        } catch {
            setStatus('error')
        }
    })

    const maxShownValid = Number.isInteger(config.maxShown) && config.maxShown >= limits.maxShown[0] && config.maxShown <= limits.maxShown[1]

    return (
        <>
            <div className="tm-grid">
                <div className="dash-stack">
                    {/* ── Exibição ── */}
                    <section className="dash-card" aria-labelledby="tm-display">
                        <div className="sp-adm-head">
                            <div>
                                <h2 id="tm-display" className="dash-card-title">Exibição</h2>
                                <p className="dash-card-sub" style={{ marginBottom: 0 }}>
                                    {saved.enabled ? 'Ligado: aparece no checkout.' : 'Desligado: o checkout não mostra depoimentos.'}
                                </p>
                            </div>
                            <label className="sp-adm-switch">
                                <input type="checkbox" role="switch" checked={config.enabled} onChange={e => update({ enabled: e.target.checked })} />
                                <span className="sp-adm-switch-track" aria-hidden="true"><span /></span>
                                <span className="sp-adm-switch-text">{config.enabled ? 'Ligado' : 'Desligado'}</span>
                            </label>
                        </div>
                        <div className="tm-row">
                            <div className="tm-field tm-grow">
                                <label htmlFor="tm-title" className="sp-adm-label">Título da seção</label>
                                <input id="tm-title" className="od-input" maxLength={limits.title} value={config.title} onChange={e => update({ title: e.target.value })} />
                            </div>
                            <div className="tm-field">
                                <label htmlFor="tm-max" className="sp-adm-label">Mostrar até</label>
                                <div className="sp-adm-num">
                                    <input id="tm-max" className="od-input" type="number" inputMode="numeric" min={limits.maxShown[0]} max={limits.maxShown[1]}
                                        value={Number.isNaN(config.maxShown) ? '' : config.maxShown}
                                        onChange={e => update({ maxShown: e.target.valueAsNumber })} />
                                    <span>depoimentos</span>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* ── Lista ── */}
                    <section className="dash-card" aria-labelledby="tm-list">
                        <div className="tm-list-head">
                            <div>
                                <h2 id="tm-list" className="dash-card-title">Depoimentos · {config.items.length}</h2>
                                <p className="dash-card-sub" style={{ marginBottom: 0 }}>
                                    Os {config.maxShown || '—'} primeiros ativos aparecem no checkout. Use as setas para mudar a ordem.
                                </p>
                            </div>
                            {!draft && config.items.length < limits.items && (
                                <button type="button" className="od-btn is-primary" onClick={() => { setDraft(EMPTY); setDraftError(null) }}>
                                    <Plus size={15} aria-hidden /> Novo depoimento
                                </button>
                            )}
                        </div>

                        {draft && (
                            <form className="tm-editor" onSubmit={e => { e.preventDefault(); commitDraft() }}>
                                <p className="tm-editor-title">{draft.id ? 'Editar depoimento' : 'Novo depoimento'}</p>
                                <div className="tm-row">
                                    <div className="tm-field tm-grow">
                                        <label htmlFor="tm-name" className="sp-adm-label">Nome *</label>
                                        <input id="tm-name" className="od-input" maxLength={limits.name} placeholder="Ex.: Maria Aparecida Souza" value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} autoFocus />
                                    </div>
                                    <div className="tm-field tm-grow">
                                        <label htmlFor="tm-loc" className="sp-adm-label">Cidade</label>
                                        <input id="tm-loc" className="od-input" maxLength={limits.location} placeholder="Ex.: Campinas/SP" value={draft.location} onChange={e => setDraft({ ...draft, location: e.target.value })} />
                                    </div>
                                </div>
                                <div className="tm-field">
                                    <span className="sp-adm-label">Nota</span>
                                    <StarPicker value={draft.rating} onChange={rating => setDraft({ ...draft, rating })} />
                                </div>
                                <div className="tm-field">
                                    <label htmlFor="tm-text" className="sp-adm-label">Depoimento *</label>
                                    <textarea id="tm-text" className="od-input tm-textarea" maxLength={limits.text} rows={4} value={draft.text} onChange={e => setDraft({ ...draft, text: e.target.value })} />
                                    <p className="sp-adm-range">{draft.text.length}/{limits.text} · universal: sem citar um produto específico</p>
                                </div>
                                <div className="tm-field">
                                    <label htmlFor="tm-photo" className="sp-adm-label">Foto (opcional)</label>
                                    <input id="tm-photo" className="od-input" inputMode="url" placeholder="https://…" value={draft.photoUrl} onChange={e => setDraft({ ...draft, photoUrl: e.target.value })} />
                                    <p className="sp-adm-range">Link https da imagem. Sem foto, mostramos as iniciais do nome.</p>
                                </div>
                                {draftError && <p className="sp-adm-error" role="alert">{draftError}</p>}
                                <div className="sp-adm-actions">
                                    <button type="submit" className="od-btn is-primary">{draft.id ? 'Aplicar edição' : 'Adicionar à lista'}</button>
                                    {(config.items.length > 0 || draft.id) && (
                                        <button type="button" className="od-btn" onClick={() => { setDraft(null); setDraftError(null) }}>Cancelar</button>
                                    )}
                                </div>
                            </form>
                        )}

                        {config.items.length > 0 ? (
                            <ul className="tm-items">
                                {config.items.map((t, idx) => (
                                    <li key={t.id} className={`tm-item${t.active ? '' : ' is-hidden'}`}>
                                        <div className="tm-item-main">
                                            <div className="tm-item-top">
                                                <strong>{t.name}</strong>
                                                {t.location && <span className="tm-muted">{t.location}</span>}
                                                <span className="tm-rating" aria-label={`${t.rating} de 5 estrelas`}>{'★'.repeat(t.rating)}<span className="tm-muted">{'★'.repeat(5 - t.rating)}</span></span>
                                                {shownIds.has(t.id)
                                                    ? <span className="dash-badge" style={{ color: 'var(--positive)', background: 'var(--positive-soft)' }}>No checkout</span>
                                                    : !t.active && <span className="dash-badge" style={{ color: 'var(--ink-muted)', background: 'var(--surface-sunken)' }}>Oculto</span>}
                                            </div>
                                            <p className="tm-item-text">{t.text}</p>
                                        </div>
                                        {confirmDelete === t.id ? (
                                            <div className="tm-item-actions">
                                                <span className="tm-muted">Excluir?</span>
                                                <button type="button" className="od-btn is-danger is-small" onClick={() => { setItems(items => items.filter(i => i.id !== t.id)); setConfirmDelete(null) }}>Excluir</button>
                                                <button type="button" className="od-btn is-small" onClick={() => setConfirmDelete(null)}>Manter</button>
                                            </div>
                                        ) : (
                                            <div className="tm-item-actions">
                                                <button type="button" className="tm-icon-btn" onClick={() => move(idx, -1)} disabled={idx === 0} aria-label={`Subir ${t.name}`}><ArrowUp size={16} /></button>
                                                <button type="button" className="tm-icon-btn" onClick={() => move(idx, 1)} disabled={idx === config.items.length - 1} aria-label={`Descer ${t.name}`}><ArrowDown size={16} /></button>
                                                <button type="button" className="tm-icon-btn" onClick={() => setItems(items => items.map(i => i.id === t.id ? { ...i, active: !i.active } : i))} aria-label={t.active ? `Ocultar ${t.name}` : `Mostrar ${t.name}`}>
                                                    {t.active ? <EyeOff size={16} /> : <Eye size={16} />}
                                                </button>
                                                <button type="button" className="tm-icon-btn" onClick={() => { setDraft({ id: t.id, name: t.name, location: t.location, text: t.text, rating: t.rating, photoUrl: t.photoUrl }); setDraftError(null) }} aria-label={`Editar ${t.name}`}><Pencil size={16} /></button>
                                                <button type="button" className="tm-icon-btn is-danger" onClick={() => setConfirmDelete(t.id)} aria-label={`Excluir ${t.name}`}><Trash2 size={16} /></button>
                                            </div>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        ) : !draft && (
                            <p className="dash-empty">Nenhum depoimento cadastrado ainda.</p>
                        )}
                    </section>
                </div>

                {/* ── Prévia ── */}
                <aside className="tm-preview-col" aria-label="Prévia no checkout">
                    <p className="sp-adm-label">Prévia no checkout</p>
                    <div className={`tm-preview${config.enabled ? '' : ' is-off'}`}>
                        {preview.length > 0
                            ? <CheckoutTestimonials title={config.title || 'O que dizem nossos clientes'} items={preview} />
                            : <p className="dash-empty" style={{ padding: '20px 0' }}>Adicione um depoimento ativo para ver a prévia.</p>}
                    </div>
                    <p className="od-hint">Use depoimentos reais de clientes, com autorização. Depoimento inventado é propaganda enganosa (CDC, art. 37).</p>
                </aside>
            </div>

            {(dirty || status !== 'idle') && (
                <div className="tm-savebar" role="region" aria-label="Salvar alterações">
                    <span>
                        {pending ? 'Salvando…'
                            : status === 'saved' && !dirty ? 'Alterações salvas. O checkout já mostra a nova versão.'
                                : status === 'error' ? 'Não foi possível salvar. Tente de novo.'
                                    : !maxShownValid ? `"Mostrar até" precisa ficar entre ${limits.maxShown[0]} e ${limits.maxShown[1]}.`
                                        : 'Há alterações não salvas.'}
                    </span>
                    {dirty && (
                        <>
                            <button type="button" className="od-btn" onClick={() => { setConfig(saved); setDraft(null); setStatus('idle') }} disabled={pending}>Descartar</button>
                            <button type="button" className="od-btn is-primary" onClick={save} disabled={pending || !maxShownValid || !!draft}>
                                {draft ? 'Termine a edição' : 'Salvar alterações'}
                            </button>
                        </>
                    )}
                </div>
            )}
        </>
    )
}
