'use client'

import React, { useState, useEffect } from 'react'
import { Loader2, Check, Target, ExternalLink } from 'lucide-react'
import { updateCustomization, getCustomization } from '@/app/actions'

const PIXELS = [
    {
        key: 'marketing_taboola_id',
        label: 'Taboola',
        placeholder: 'Ex: 1234567',
        hint: 'Taboola Pixel ID',
        color: '#0091ff',
        icon: '🔵',
    },
    {
        key: 'marketing_facebook_id',
        label: 'Facebook (Meta)',
        placeholder: 'Ex: 9876543210',
        hint: 'Facebook Pixel ID',
        color: '#1877f2',
        icon: '🔷',
    },
    {
        key: 'marketing_google_id',
        label: 'Google Ads',
        placeholder: 'Ex: AW-123456789',
        hint: 'ID de conversão (AW-)',
        color: '#4285f4',
        icon: '🟢',
    },
    {
        key: 'marketing_ga_id',
        label: 'Google Analytics (GA4)',
        placeholder: 'Ex: G-XXXXXXXXXX',
        hint: 'ID de medição (G-)',
        color: '#f59e0b',
        icon: '🟡',
    },
    {
        key: 'marketing_google_conv_label',
        label: 'Google Ads Conversion Label',
        placeholder: 'Ex: AbCdEfGhIjKlMnO',
        hint: 'Label de conversão de compra',
        color: '#34a853',
        icon: '🟢',
    },
]

export default function MarketingPage() {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [values, setValues] = useState<Record<string, string>>({})

    useEffect(() => {
        async function load() {
            try {
                const entries = await Promise.all(
                    PIXELS.map(async p => [p.key, (await getCustomization(p.key)) || ''])
                )
                setValues(Object.fromEntries(entries))
            } catch (e) { console.error(e) }
            finally { setLoading(false) }
        }
        load()
    }, [])

    async function handleSave(e: React.FormEvent) {
        e.preventDefault()
        setSaving(true)
        try {
            await Promise.all(
                PIXELS.map(p => updateCustomization(p.key, values[p.key] || ''))
            )
            setSaved(true)
            setTimeout(() => setSaved(false), 2500)
        } catch (err: any) { alert(err.message) }
        finally { setSaving(false) }
    }

    function update(key: string, val: string) {
        setValues(prev => ({ ...prev, [key]: val }))
    }

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '40vh' }}>
                <Loader2 size={28} color="#0f172a" style={{ animation: 'spin 1s linear infinite' }} />
            </div>
        )
    }

    return (
        <div style={{ width: '100%', maxWidth: '700px', paddingBottom: '60px' }}>
            <style jsx>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

            {/* Header */}
            <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>Pixels de Marketing</h1>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#94a3b8', fontWeight: 500 }}>Configure os pixels de rastreamento para medir conversões.</p>
            </div>

            <form onSubmit={handleSave}>
                {/* Pixel Cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                    {PIXELS.map(pixel => {
                        const hasValue = values[pixel.key]?.trim()
                        return (
                            <div key={pixel.key} style={{
                                background: '#fff', border: '1px solid #f1f5f9', borderRadius: '14px',
                                padding: '16px', transition: 'all 0.15s',
                            }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = '#e2e8f0' }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = '#f1f5f9' }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                                    <div style={{
                                        width: '32px', height: '32px', borderRadius: '8px',
                                        background: hasValue ? pixel.color + '15' : '#f8fafc',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                        fontSize: '14px',
                                    }}>
                                        {hasValue ? <Check size={16} color={pixel.color} strokeWidth={3} /> : pixel.icon}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{pixel.label}</p>
                                        <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8', fontWeight: 500 }}>{pixel.hint}</p>
                                    </div>
                                    {hasValue && (
                                        <span style={{
                                            fontSize: '9px', fontWeight: 800, color: '#059669', background: '#d1fae5',
                                            padding: '2px 7px', borderRadius: '6px', textTransform: 'uppercase', letterSpacing: '0.06em',
                                            border: '1px solid #6ee7b7',
                                        }}>Ativo</span>
                                    )}
                                </div>
                                <input
                                    type="text"
                                    value={values[pixel.key] || ''}
                                    onChange={e => update(pixel.key, e.target.value)}
                                    placeholder={pixel.placeholder}
                                    style={{
                                        width: '100%', padding: '10px 14px', borderRadius: '10px',
                                        border: '1px solid #e2e8f0', background: '#f8fafc',
                                        fontSize: '13px', color: '#0f172a', outline: 'none', fontWeight: 500,
                                    }}
                                    onFocus={e => { e.target.style.borderColor = '#0f172a'; e.target.style.background = '#fff' }}
                                    onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc' }}
                                />
                            </div>
                        )
                    })}
                </div>

                {/* Save Button */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button type="submit" disabled={saving} style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '12px 28px', borderRadius: '10px', border: 'none',
                        background: saved ? '#059669' : '#0f172a', color: '#fff',
                        fontSize: '13px', fontWeight: 700,
                        cursor: saving ? 'wait' : 'pointer',
                        transition: 'all 0.2s',
                    }}>
                        {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : saved ? <Check size={16} /> : null}
                        {saving ? 'Salvando...' : saved ? 'Salvo!' : 'Salvar Pixels'}
                    </button>

                    <a
                        href="https://business.facebook.com/events_manager"
                        target="_blank" rel="noreferrer"
                        style={{
                            display: 'flex', alignItems: 'center', gap: '5px',
                            fontSize: '12px', color: '#64748b', textDecoration: 'none', fontWeight: 600,
                        }}
                    >
                        <ExternalLink size={12} /> Meta Events Manager
                    </a>
                </div>
            </form>
        </div>
    )
}
