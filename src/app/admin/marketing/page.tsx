'use client'

import React, { useState, useEffect } from 'react'
import { Save, Loader2, Megaphone, CheckCircle2, AlertCircle } from 'lucide-react'
import { updateCustomization, getCustomization } from '@/app/actions'

export const dynamic = 'force-dynamic';

export default function MarketingPage() {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null)

    // Pixels
    const [taboolaId, setTaboolaId] = useState('')
    const [facebookId, setFacebookId] = useState('')
    const [googleAdsId, setGoogleAdsId] = useState('')

    useEffect(() => {
        async function loadPixels() {
            try {
                const taboola = await getCustomization('marketing_taboola_id')
                const facebook = await getCustomization('marketing_facebook_id')
                const google = await getCustomization('marketing_google_id')

                setTaboolaId(taboola || '')
                setFacebookId(facebook || '')
                setGoogleAdsId(google || '')
            } catch (error) {
                console.error('Error loading pixels:', error)
            } finally {
                setLoading(false)
            }
        }
        loadPixels()
    }, [])

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        setStatus(null)

        try {
            await updateCustomization('marketing_taboola_id', taboolaId)
            await updateCustomization('marketing_facebook_id', facebookId)
            await updateCustomization('marketing_google_id', googleAdsId)

            setStatus({ type: 'success', message: 'Pixels de marketing atualizados com sucesso!' })
            setTimeout(() => setStatus(null), 3000)
        } catch (error: any) {
            setStatus({ type: 'error', message: error.message || 'Erro ao salvar pixels' })
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <Loader2 className="animate-spin" size={32} color="#4f46e5" />
            </div>
        )
    }

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px' }}>
            <div style={{
                background: '#fff',
                borderRadius: '24px',
                padding: '40px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)'
            }}>
                <header style={{ marginBottom: '40px' }}>
                    <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Megaphone size={26} color="#4f46e5" />
                        Marketing & Pixels
                    </h2>
                    <p style={{ color: '#64748b', fontSize: '15px', marginTop: '6px' }}>
                        Configure os seus pixels de rastreamento para medir conversões e otimizar anúncios.
                    </p>
                </header>

                <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                    {/* Taboola */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '14px', fontWeight: '700', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <img src="https://www.taboola.com/wp-content/uploads/2021/04/Taboola-favicon.png" width="16" height="16" alt="" />
                            Taboola Pixel ID
                        </label>
                        <input
                            type="text"
                            value={taboolaId}
                            onChange={(e) => setTaboolaId(e.target.value)}
                            placeholder="Ex: 1234567"
                            style={{
                                padding: '12px 16px',
                                borderRadius: '12px',
                                border: '1px solid #e2e8f0',
                                outline: 'none',
                                fontSize: '14px',
                                transition: 'all 0.2s'
                            }}
                        />
                    </div>

                    {/* Meta/Facebook */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '14px', fontWeight: '700', color: '#334155' }}>Facebook Pixel ID</label>
                        <input
                            type="text"
                            value={facebookId}
                            onChange={(e) => setFacebookId(e.target.value)}
                            placeholder="Ex: 9876543210"
                            style={{
                                padding: '12px 16px',
                                borderRadius: '12px',
                                border: '1px solid #e2e8f0',
                                outline: 'none',
                                fontSize: '14px'
                            }}
                        />
                    </div>

                    {/* Google Ads */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '14px', fontWeight: '700', color: '#334155' }}>Google Ads Pixel ID</label>
                        <input
                            type="text"
                            value={googleAdsId}
                            onChange={(e) => setGoogleAdsId(e.target.value)}
                            placeholder="Ex: AW-123456789"
                            style={{
                                padding: '12px 16px',
                                borderRadius: '12px',
                                border: '1px solid #e2e8f0',
                                outline: 'none',
                                fontSize: '14px'
                            }}
                        />
                    </div>

                    {status && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '12px 16px',
                            borderRadius: '12px',
                            background: status.type === 'success' ? '#f0fdf4' : '#fef2f2',
                            border: `1px solid ${status.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
                            color: status.type === 'success' ? '#15803d' : '#b91c1c',
                            fontSize: '14px',
                            fontWeight: '600'
                        }}>
                            {status.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                            {status.message}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={saving}
                        style={{
                            marginTop: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px',
                            background: '#4f46e5',
                            color: 'white',
                            border: 'none',
                            padding: '14px',
                            borderRadius: '14px',
                            fontSize: '16px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            opacity: saving ? 0.7 : 1,
                            transition: 'all 0.2s',
                            boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)'
                        }}
                    >
                        {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        Salvar Configurações
                    </button>
                </form>
            </div>
        </div>
    )
}\n