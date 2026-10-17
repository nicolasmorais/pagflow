'use client'

import { useState } from 'react'
import { ExternalLink, Loader2 } from 'lucide-react'
import { updateOrderTracking } from '@/app/actions'
import InlineCopyBtn from './InlineCopyBtn'

export default function TrackingManagement({ orderId, initialUrl, initialTrackingCode }: {
    orderId: string
    initialUrl: string | null
    initialTrackingCode?: string | null
}) {
    const code = initialTrackingCode || null
    const publicLink = code ? `https://rastreio.elabela.store/?code=${encodeURIComponent(code)}` : ''

    const [savedUrl, setSavedUrl] = useState(initialUrl)
    const [isEditing, setIsEditing] = useState(!initialUrl)
    const [url, setUrl] = useState(initialUrl || publicLink)
    const [saving, setSaving] = useState(false)
    const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null)

    const handleSave = async () => {
        const value = url.trim()
        if (!value) return
        setSaving(true)
        setFeedback(null)
        try {
            await updateOrderTracking(orderId, undefined, value)
            setSavedUrl(value)
            setIsEditing(false)
            setFeedback({ ok: true, msg: 'Link salvo e e-mail de rastreio enviado ao cliente.' })
        } catch {
            setFeedback({ ok: false, msg: 'Não foi possível salvar o link. Tente novamente.' })
        } finally {
            setSaving(false)
        }
    }

    return (
        <section className="dash-card">
            <div className="od-card-head">
                <h2>Rastreio</h2>
                {savedUrl && !isEditing && (
                    <button type="button" className="od-btn is-small" onClick={() => { setIsEditing(true); setFeedback(null) }}>
                        Alterar link
                    </button>
                )}
            </div>

            {code ? (
                <div className="od-track-line">
                    <span className="od-code">{code}</span>
                    <InlineCopyBtn text={code} label="Copiar código de rastreio" />
                    <a href={publicLink} target="_blank" rel="noopener noreferrer" className="od-btn is-small">
                        <ExternalLink size={13} aria-hidden />
                        Ver rastreio
                    </a>
                </div>
            ) : (
                <p className="od-hint" style={{ marginTop: 0 }}>Ainda sem código de rastreio.</p>
            )}

            {!isEditing && savedUrl && (
                <a href={savedUrl} target="_blank" rel="noopener noreferrer" className="od-track-url" title={savedUrl}>
                    {savedUrl}
                </a>
            )}

            {isEditing && (
                <div style={{ marginTop: 14 }}>
                    <label htmlFor={`track-url-${orderId}`} className="od-address-label" style={{ display: 'block', marginTop: 0 }}>
                        Link de rastreio enviado ao cliente
                    </label>
                    <div className="od-form">
                        <input
                            id={`track-url-${orderId}`}
                            type="url"
                            className="od-input"
                            value={url}
                            onChange={e => setUrl(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') handleSave() }}
                            placeholder="https://..."
                        />
                        <button type="button" className="od-btn is-primary" onClick={handleSave} disabled={saving || !url.trim()}>
                            {saving && <Loader2 size={14} className="od-spin" aria-hidden />}
                            {saving ? 'Salvando…' : 'Salvar e enviar'}
                        </button>
                        {savedUrl && (
                            <button type="button" className="od-btn" onClick={() => { setIsEditing(false); setUrl(savedUrl) }} disabled={saving}>
                                Cancelar
                            </button>
                        )}
                    </div>
                    <p className="od-hint">Ao salvar, o cliente recebe um e-mail com o botão para rastrear o pedido.</p>
                </div>
            )}

            {feedback && <p className={`od-feedback ${feedback.ok ? 'is-ok' : 'is-err'}`} role="status">{feedback.msg}</p>}
        </section>
    )
}
