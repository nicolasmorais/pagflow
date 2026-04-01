'use client'

import React, { useState, useEffect } from 'react'
import { Save, Image as ImageIcon, FileText, CheckCircle2, AlertCircle, Loader2, Palette, Megaphone } from 'lucide-react'
import { updateCustomization, getCustomization } from '@/app/actions'

export const dynamic = 'force-dynamic';

export default function PersonalizacaoPage() {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null)

    const [checkoutLogo, setCheckoutLogo] = useState('')
    const [checkoutFooter, setCheckoutFooter] = useState('')
    const [primaryColor, setPrimaryColor] = useState('#10b981')
    const [buttonColor, setButtonColor] = useState('#10b981')
    const [bgColor, setBgColor] = useState('#f0f9ff')
    const [disableCpf, setDisableCpf] = useState(false)

    // Alert Bar States
    const [alertText, setAlertText] = useState('')
    const [alertBg, setAlertBg] = useState('#e64a19')

    // PIX Badge States
    const [pixBadgeText, setPixBadgeText] = useState('')
    const [pixBadgeColor, setPixBadgeColor] = useState('#ffffff')
    const [pixBadgeBg, setPixBadgeBg] = useState('#10b981')

    useEffect(() => {
        async function loadSettings() {
            try {
                const logo = await getCustomization('checkout_logo')
                const footer = await getCustomization('checkout_footer_text')
                const primary = await getCustomization('checkout_primary_color')
                const button = await getCustomization('checkout_button_color')
                const bg = await getCustomization('checkout_bg_color')
                const alertTxt = await getCustomization('checkout_alert_text')
                const alertB = await getCustomization('checkout_alert_bg_color')
                const pText = await getCustomization('checkout_pix_badge_text')
                const pColor = await getCustomization('checkout_pix_badge_color')
                const pBg = await getCustomization('checkout_pix_badge_bg')
                const dCpf = await getCustomization('checkout_disable_cpf')

                setCheckoutLogo(logo)
                setCheckoutFooter(footer)
                if (primary) setPrimaryColor(primary)
                if (button) setButtonColor(button)
                if (bg) setBgColor(bg)
                if (alertTxt) setAlertText(alertTxt)
                if (alertB) setAlertBg(alertB)
                if (pText) setPixBadgeText(pText)
                if (pColor) setPixBadgeColor(pColor)
                if (pBg) setPixBadgeBg(pBg)
                setDisableCpf(dCpf === 'true')
            } catch (error) {
                console.error('Error loading settings:', error)
            } finally {
                setLoading(false)
            }
        }
        loadSettings()
    }, [])

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        setStatus(null)

        try {
            await updateCustomization('checkout_logo', checkoutLogo)
            await updateCustomization('checkout_footer_text', checkoutFooter)
            await updateCustomization('checkout_primary_color', primaryColor)
            await updateCustomization('checkout_button_color', buttonColor)
            await updateCustomization('checkout_bg_color', bgColor)
            await updateCustomization('checkout_alert_text', alertText)
            await updateCustomization('checkout_alert_bg_color', alertBg)
            await updateCustomization('checkout_pix_badge_text', pixBadgeText)
            await updateCustomization('checkout_pix_badge_color', pixBadgeColor)
            await updateCustomization('checkout_pix_badge_bg', pixBadgeBg)
            await updateCustomization('checkout_disable_cpf', disableCpf ? 'true' : 'false')

            setStatus({ type: 'success', message: 'Configurações salvas com sucesso!' })

            // Clear status after 3 seconds
            setTimeout(() => setStatus(null), 3000)
        } catch (error: any) {
            setStatus({ type: 'error', message: error.message || 'Erro ao salvar configurações' })
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
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px 0' }}>
            <div style={{
                background: '#fff',
                borderRadius: '20px',
                padding: '32px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
            }}>
                <header style={{ marginBottom: '32px' }}>
                    <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Palette size={22} color="#4f46e5" />
                        Customização Visual
                    </h2>
                    <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>
                        Personalize as cores, marca e anúncios do seu checkout.
                    </p>
                </header>

                <form onSubmit={handleSave}>
                    {/* Checkout Logo */}
                    <div style={{ marginBottom: '32px' }}>
                        <label style={{ fontSize: '14px', fontWeight: '600', color: '#475569', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <ImageIcon size={16} />
                            Logo do Checkout (URL)
                        </label>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <input
                                type="text"
                                value={checkoutLogo}
                                onChange={(e) => setCheckoutLogo(e.target.value)}
                                placeholder="https://url-da-sua-logo.png"
                                style={{
                                    flex: 1,
                                    padding: '12px 16px',
                                    borderRadius: '12px',
                                    border: '1px solid #e2e8f0',
                                    fontSize: '14px',
                                    outline: 'none',
                                    transition: 'border-color 0.2s',
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#4f46e5'}
                                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                            />
                        </div>
                        {checkoutLogo && (
                            <div style={{
                                marginTop: '12px',
                                padding: '12px',
                                background: '#f8fafc',
                                borderRadius: '12px',
                                border: '1px dashed #e2e8f0',
                                textAlign: 'center'
                            }}>
                                <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '8px' }}>Pré-visualização da Logo:</span>
                                <img src={checkoutLogo} alt="Preview" style={{ maxHeight: '40px', maxWidth: '100%', objectFit: 'contain' }} />
                            </div>
                        )}
                    </div>

                    {/* Alert Bar Tracking */}
                    <div style={{ marginBottom: '32px', padding: '24px', background: '#fff7ed', borderRadius: '16px', border: '1px solid #ffedd5' }}>
                        <label style={{ fontSize: '14px', fontWeight: '700', color: '#9a3412', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Megaphone size={18} />
                            Barra de Avisos (Topo)
                        </label>
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#c2410c', marginBottom: '6px' }}>Texto de Aviso</label>
                            <input
                                type="text"
                                value={alertText}
                                onChange={(e) => setAlertText(e.target.value)}
                                placeholder="Ex: Parabéns! Você ganhou frete grátis..."
                                style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #fed7aa', fontSize: '14px', outline: 'none' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#c2410c', marginBottom: '6px' }}>Cor de Fundo da Barra</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <input
                                    type="color"
                                    value={alertBg}
                                    onChange={(e) => setAlertBg(e.target.value)}
                                    style={{ width: '40px', height: '40px', padding: '0', border: 'none', borderRadius: '8px', cursor: 'pointer', background: 'none' }}
                                />
                                <input
                                    type="text"
                                    value={alertBg}
                                    onChange={(e) => setAlertBg(e.target.value)}
                                    style={{ flex: 1, padding: '10px 12px', border: '1px solid #fed7aa', borderRadius: '10px', fontSize: '13px' }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* PIX Reward Badge Customization */}
                    <div style={{ marginBottom: '32px', padding: '24px', background: '#f0fdf4', borderRadius: '16px', border: '1px solid #bbf7d0' }}>
                        <label style={{ fontSize: '14px', fontWeight: '700', color: '#166534', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <CheckCircle2 size={18} />
                            Destaque de Recompensa PIX (Checkout)
                        </label>
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#15803d', marginBottom: '6px' }}>Texto da Recompensa</label>
                            <input
                                type="text"
                                value={pixBadgeText}
                                onChange={(e) => setPixBadgeText(e.target.value)}
                                placeholder="Ex: 😲 35% de desconto + envio prioritário"
                                style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #86efac', fontSize: '14px', outline: 'none' }}
                            />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#15803d', marginBottom: '6px' }}>Cor do Texto</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <input
                                        type="color"
                                        value={pixBadgeColor}
                                        onChange={(e) => setPixBadgeColor(e.target.value)}
                                        style={{ width: '40px', height: '40px', padding: '0', border: 'none', borderRadius: '8px', cursor: 'pointer', background: 'none' }}
                                    />
                                    <input
                                        type="text"
                                        value={pixBadgeColor}
                                        onChange={(e) => setPixBadgeColor(e.target.value)}
                                        style={{ flex: 1, padding: '10px 12px', border: '1px solid #86efac', borderRadius: '10px', fontSize: '13px' }}
                                    />
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#15803d', marginBottom: '6px' }}>Cor de Fundo</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <input
                                        type="color"
                                        value={pixBadgeBg}
                                        onChange={(e) => setPixBadgeBg(e.target.value)}
                                        style={{ width: '40px', height: '40px', padding: '0', border: 'none', borderRadius: '8px', cursor: 'pointer', background: 'none' }}
                                    />
                                    <input
                                        type="text"
                                        value={pixBadgeBg}
                                        onChange={(e) => setPixBadgeBg(e.target.value)}
                                        style={{ flex: 1, padding: '10px 12px', border: '1px solid #86efac', borderRadius: '10px', fontSize: '13px' }}
                                    />
                                </div>
                            </div>
                        </div>

                        <div style={{ marginTop: '16px', padding: '12px', background: '#fff', borderRadius: '10px', border: '1px dashed #86efac', textAlign: 'center' }}>
                            <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '8px' }}>Pré-visualização no Checkout:</span>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                                <span style={{ fontWeight: 700, color: '#1e293b', fontSize: '14px' }}>PIX</span>
                                <span style={{
                                    background: pixBadgeBg,
                                    color: pixBadgeColor,
                                    padding: '4px 10px',
                                    borderRadius: '20px',
                                    fontSize: '11px',
                                    fontWeight: 800
                                }}>
                                    {pixBadgeText || "Seu texto aqui"}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Colors Header */}
                    <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b', marginBottom: '16px', marginTop: '32px' }}>Cores Principais</h3>

                    {/* Colors Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px', padding: '24px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                        <div>
                            <label style={{ fontSize: '14px', fontWeight: '600', color: '#475569', marginBottom: '12px', display: 'block' }}>
                                Cor Predominante
                            </label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <input
                                    type="color"
                                    value={primaryColor}
                                    onChange={(e) => setPrimaryColor(e.target.value)}
                                    style={{ width: '48px', height: '48px', padding: '0', border: 'none', borderRadius: '8px', cursor: 'pointer', background: 'none' }}
                                />
                                <input
                                    type="text"
                                    value={primaryColor}
                                    onChange={(e) => setPrimaryColor(e.target.value)}
                                    style={{ flex: 1, padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', textTransform: 'uppercase' }}
                                />
                            </div>
                        </div>

                        <div>
                            <label style={{ fontSize: '14px', fontWeight: '600', color: '#475569', marginBottom: '12px', display: 'block' }}>
                                Cor dos Botões
                            </label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <input
                                    type="color"
                                    value={buttonColor}
                                    onChange={(e) => setButtonColor(e.target.value)}
                                    style={{ width: '48px', height: '48px', padding: '0', border: 'none', borderRadius: '8px', cursor: 'pointer', background: 'none' }}
                                />
                                <input
                                    type="text"
                                    value={buttonColor}
                                    onChange={(e) => setButtonColor(e.target.value)}
                                    style={{ flex: 1, padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', textTransform: 'uppercase' }}
                                />
                            </div>
                        </div>

                        <div>
                            <label style={{ fontSize: '14px', fontWeight: '600', color: '#475569', marginBottom: '12px', display: 'block' }}>
                                Cor do Fundo
                            </label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <input
                                    type="color"
                                    value={bgColor}
                                    onChange={(e) => setBgColor(e.target.value)}
                                    style={{ width: '48px', height: '48px', padding: '0', border: 'none', borderRadius: '8px', cursor: 'pointer', background: 'none' }}
                                />
                                <input
                                    type="text"
                                    value={bgColor}
                                    onChange={(e) => setBgColor(e.target.value)}
                                    style={{ flex: 1, padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', textTransform: 'uppercase' }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* CPF Toggle */}
                    <div style={{ marginBottom: '32px', padding: '20px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <label style={{ fontSize: '14px', fontWeight: '600', color: '#475569', display: 'block' }}>
                                Desativar Campo de CPF
                            </label>
                            <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                                Se ativado, o campo CPF não será solicitado nem obrigatório no checkout.
                            </p>
                        </div>
                        <label style={{ position: 'relative', display: 'inline-block', width: '50px', height: '26px', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={disableCpf}
                                onChange={(e) => setDisableCpf(e.target.checked)}
                                style={{ opacity: 0, width: 0, height: 0 }}
                            />
                            <span style={{
                                position: 'absolute',
                                top: 0, left: 0, right: 0, bottom: 0,
                                backgroundColor: disableCpf ? '#4f46e5' : '#ccc',
                                transition: '.4s',
                                borderRadius: '34px'
                            }}>
                                <span style={{
                                    position: 'absolute',
                                    content: '""',
                                    height: '18px',
                                    width: '18px',
                                    left: disableCpf ? '28px' : '4px',
                                    bottom: '4px',
                                    backgroundColor: 'white',
                                    transition: '.4s',
                                    borderRadius: '50%'
                                }}></span>
                            </span>
                        </label>
                    </div>

                    {/* Footer Text */}
                    <div style={{ marginBottom: '32px' }}>
                        <label style={{ fontSize: '14px', fontWeight: '600', color: '#475569', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <FileText size={16} />
                            Textos do Rodapé
                        </label>
                        <textarea
                            value={checkoutFooter}
                            onChange={(e) => setCheckoutFooter(e.target.value)}
                            placeholder="Insira as informações de direitos autorais, CNPJ e contato que aparecerão no rodapé."
                            style={{
                                width: '100%',
                                minHeight: '120px',
                                padding: '16px',
                                borderRadius: '12px',
                                border: '1px solid #e2e8f0',
                                fontSize: '14px',
                                outline: 'none',
                                transition: 'border-color 0.2s',
                                resize: 'vertical',
                                lineHeight: '1.6'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#4f46e5'}
                            onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                        />
                    </div>

                    {/* Feedback Status */}
                    {status && (
                        <div style={{
                            padding: '12px 16px',
                            borderRadius: '12px',
                            marginBottom: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            fontSize: '14px',
                            background: status.type === 'success' ? '#f0fdf4' : '#fef2f2',
                            color: status.type === 'success' ? '#16a34a' : '#dc2626',
                            border: `1px solid ${status.type === 'success' ? '#bbf7d0' : '#fecaca'}`
                        }}>
                            {status.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                            {status.message}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={saving}
                        style={{
                            width: '100%',
                            padding: '14px',
                            background: '#4f46e5',
                            color: '#fff',
                            borderRadius: '12px',
                            border: 'none',
                            fontWeight: '600',
                            fontSize: '16px',
                            cursor: saving ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: '10px',
                            transition: 'background 0.2s, transform 0.1s',
                            boxShadow: '0 4px 10px rgba(79, 70, 229, 0.2)'
                        }}
                    >
                        {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                        {saving ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                </form>
            </div>
        </div>
    )
}
