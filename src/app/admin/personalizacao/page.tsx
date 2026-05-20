'use client'

import React, { useState, useEffect } from 'react'
import { Save, Image as ImageIcon, FileText, CheckCircle2, AlertCircle, Loader2, Palette, Megaphone, TrendingUp, Store, Type, Percent, Shield, ArrowLeft, MessageCircle, Webhook, Eye } from 'lucide-react'
import { updateCustomization, getCustomization } from '@/app/actions'

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
    const [pixDiscount, setPixDiscount] = useState('0')
    const [cardDiscount, setCardDiscount] = useState('0')
    const [checkoutStoreName, setCheckoutStoreName] = useState('')
    const [disableBack, setDisableBack] = useState(false)
    const [disableWa, setDisableWa] = useState(false)
    const [webhookUrl, setWebhookUrl] = useState('')

    // Alert Bar States
    const [alertText, setAlertText] = useState('')
    const [alertBg, setAlertBg] = useState('#e64a19')
    const [alertColor, setAlertColor] = useState('#111111')

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
                const alertC = await getCustomization('checkout_alert_color')
                const pText = await getCustomization('checkout_pix_badge_text')
                const pColor = await getCustomization('checkout_pix_badge_color')
                const pBg = await getCustomization('checkout_pix_badge_bg')
                const dCpf = await getCustomization('checkout_disable_cpf')
                const pDisc = await getCustomization('checkout_pix_discount')
                const cDisc = await getCustomization('checkout_card_discount')
                const sName = await getCustomization('checkout_store_name')
                const dBack = await getCustomization('checkout_disable_back')
                const dWa = await getCustomization('checkout_disable_wa')

                setCheckoutLogo(logo)
                setCheckoutFooter(footer)
                if (primary) setPrimaryColor(primary)
                if (button) setButtonColor(button)
                if (bg) setBgColor(bg)
                if (alertTxt) setAlertText(alertTxt)
                if (alertB) setAlertBg(alertB)
                if (alertC) setAlertColor(alertC)
                if (pText) setPixBadgeText(pText)
                if (pColor) setPixBadgeColor(pColor)
                if (pBg) setPixBadgeBg(pBg)
                setDisableCpf(dCpf === 'true')
                setPixDiscount(pDisc || '0')
                setCardDiscount(cDisc || '0')
                setCheckoutStoreName(sName || '')
                setDisableBack(dBack === 'true')
                setDisableWa(dWa === 'true')

                const wUrl = await getCustomization('webhook_url')
                setWebhookUrl(wUrl || '')
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
            await updateCustomization('checkout_alert_color', alertColor)
            await updateCustomization('checkout_pix_badge_text', pixBadgeText)
            await updateCustomization('checkout_pix_badge_color', pixBadgeColor)
            await updateCustomization('checkout_pix_badge_bg', pixBadgeBg)
            await updateCustomization('checkout_disable_cpf', disableCpf ? 'true' : 'false')
            await updateCustomization('checkout_pix_discount', pixDiscount)
            await updateCustomization('checkout_card_discount', cardDiscount)
            await updateCustomization('checkout_store_name', checkoutStoreName)
            await updateCustomization('checkout_disable_back', disableBack ? 'true' : 'false')
            await updateCustomization('checkout_disable_wa', disableWa ? 'true' : 'false')
            await updateCustomization('webhook_url', webhookUrl)

            setStatus({ type: 'success', message: 'Configurações salvas com sucesso!' })
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
                <Loader2 className="animate-spin" size={32} color="#6366f1" />
            </div>
        )
    }

    return (
        <div style={{ maxWidth: '860px', paddingBottom: '40px' }}>
            {/* Header */}
            <header style={{ marginBottom: '28px' }}>
                <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.03em' }}>
                    Personalização
                </h1>
                <p style={{ color: '#64748b', fontSize: '14px', marginTop: '6px', fontWeight: 500 }}>
                    Configure a aparência, comportamento e integrações do checkout.
                </p>
            </header>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                {/* ── Marca ── */}
                <Section icon={Store} title="Marca" description="Nome e logo exibidos no checkout.">
                    <Field label="Nome da Loja" hint="Aparece na aba do navegador durante o checkout.">
                        <input
                            type="text"
                            value={checkoutStoreName}
                            onChange={(e) => setCheckoutStoreName(e.target.value)}
                            placeholder="Minha Loja"
                            className="pi-input"
                        />
                    </Field>
                    <Field label="Logo do Checkout" hint="URL da imagem da sua logo.">
                        <input
                            type="text"
                            value={checkoutLogo}
                            onChange={(e) => setCheckoutLogo(e.target.value)}
                            placeholder="https://url-da-sua-logo.png"
                            className="pi-input"
                        />
                        {checkoutLogo && (
                            <div style={{
                                marginTop: '10px', padding: '16px', background: '#f8fafc',
                                borderRadius: '12px', border: '1px dashed #e2e8f0', textAlign: 'center'
                            }}>
                                <img src={checkoutLogo} alt="Preview" style={{ maxHeight: '40px', maxWidth: '100%', objectFit: 'contain' }} />
                            </div>
                        )}
                    </Field>
                </Section>

                {/* ── Cores ── */}
                <Section icon={Palette} title="Cores" description="Defina as cores principais do checkout.">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                        <ColorField label="Cor Principal" value={primaryColor} onChange={setPrimaryColor} />
                        <ColorField label="Cor dos Botões" value={buttonColor} onChange={setButtonColor} />
                        <ColorField label="Cor de Fundo" value={bgColor} onChange={setBgColor} />
                    </div>
                </Section>

                {/* ── Barra de Avisos ── */}
                <Section icon={Megaphone} title="Barra de Avisos" description="Banner no topo do checkout para mensagens promocionais.">
                    <Field label="Texto do Aviso">
                        <input
                            type="text"
                            value={alertText}
                            onChange={(e) => setAlertText(e.target.value)}
                            placeholder="Frete grátis para todo o Brasil!"
                            className="pi-input"
                        />
                    </Field>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <ColorField label="Cor do Texto" value={alertColor} onChange={setAlertColor} />
                        <ColorField label="Cor de Fundo" value={alertBg} onChange={setAlertBg} />
                    </div>
                    {alertText && (
                        <div style={{
                            marginTop: '8px', padding: '10px 16px', borderRadius: '10px',
                            background: alertBg, color: alertColor,
                            fontSize: '13px', fontWeight: 700, textAlign: 'center'
                        }}>
                            {alertText}
                        </div>
                    )}
                </Section>

                {/* ── Destaque PIX ── */}
                <Section icon={CheckCircle2} title="Destaque PIX" description="Badge de recompensa ao lado da opção PIX no checkout.">
                    <Field label="Texto do Destaque">
                        <input
                            type="text"
                            value={pixBadgeText}
                            onChange={(e) => setPixBadgeText(e.target.value)}
                            placeholder="35% de desconto!"
                            className="pi-input"
                        />
                    </Field>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <ColorField label="Cor do Texto" value={pixBadgeColor} onChange={setPixBadgeColor} />
                        <ColorField label="Cor de Fundo" value={pixBadgeBg} onChange={setPixBadgeBg} />
                    </div>
                    {pixBadgeText && (
                        <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                            <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '14px' }}>PIX</span>
                            <span style={{
                                background: pixBadgeBg, color: pixBadgeColor,
                                padding: '4px 12px', borderRadius: '20px',
                                fontSize: '11px', fontWeight: 800
                            }}>
                                {pixBadgeText}
                            </span>
                        </div>
                    )}
                </Section>

                {/* ── Descontos ── */}
                <Section icon={Percent} title="Descontos" description="Percentuais aplicados por método de pagamento.">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <Field label="Desconto no PIX (%)">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <input
                                    type="number"
                                    value={pixDiscount}
                                    onChange={(e) => setPixDiscount(e.target.value)}
                                    placeholder="0"
                                    className="pi-input"
                                    style={{ flex: 1 }}
                                />
                                <span style={{ fontSize: '15px', fontWeight: 700, color: '#94a3b8' }}>%</span>
                            </div>
                        </Field>
                        <Field label="Desconto no Cartão (%)">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <input
                                    type="number"
                                    value={cardDiscount}
                                    onChange={(e) => setCardDiscount(e.target.value)}
                                    placeholder="0"
                                    className="pi-input"
                                    style={{ flex: 1 }}
                                />
                                <span style={{ fontSize: '15px', fontWeight: 700, color: '#94a3b8' }}>%</span>
                            </div>
                        </Field>
                    </div>
                </Section>

                {/* ── Comportamento ── */}
                <Section icon={Shield} title="Comportamento" description="Controle campos e botões do checkout.">
                    <ToggleRow
                        label="Desativar Campo de CPF"
                        description="O CPF não será solicitado no checkout."
                        checked={disableCpf}
                        onChange={setDisableCpf}
                    />
                    <ToggleRow
                        label="Desativar Botão Voltar"
                        description="Impede que o cliente volte à etapa anterior."
                        checked={disableBack}
                        onChange={setDisableBack}
                    />
                    <ToggleRow
                        label="Desativar WhatsApp Flutuante"
                        description="Oculta o botão de WhatsApp no checkout."
                        checked={disableWa}
                        onChange={setDisableWa}
                    />
                </Section>

                {/* ── Rodapé ── */}
                <Section icon={FileText} title="Rodapé" description="Texto exibido no rodapé do checkout.">
                    <textarea
                        value={checkoutFooter}
                        onChange={(e) => setCheckoutFooter(e.target.value)}
                        placeholder="CNPJ, direitos autorais, informações de contato..."
                        className="pi-input"
                        style={{ minHeight: '100px', resize: 'vertical', lineHeight: 1.6 }}
                    />
                </Section>

                {/* ── Webhook ── */}
                <Section icon={Webhook} title="Webhook" description="Envie dados de vendas para Zapier, Make, n8n ou CRM.">
                    <Field label="URL do Webhook" hint="Disparado no evento: Venda Confirmada.">
                        <input
                            type="url"
                            value={webhookUrl}
                            onChange={(e) => setWebhookUrl(e.target.value)}
                            placeholder="https://seu-endpoint.com/webhook"
                            className="pi-input"
                        />
                    </Field>
                </Section>

                {/* Status */}
                {status && (
                    <div style={{
                        padding: '14px 18px', borderRadius: '14px',
                        display: 'flex', alignItems: 'center', gap: '10px',
                        fontSize: '14px', fontWeight: 600,
                        background: status.type === 'success' ? '#f0fdf4' : '#fef2f2',
                        color: status.type === 'success' ? '#16a34a' : '#dc2626',
                        border: `1px solid ${status.type === 'success' ? '#bbf7d0' : '#fecaca'}`
                    }}>
                        {status.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                        {status.message}
                    </div>
                )}

                {/* Save Button */}
                <button
                    type="submit"
                    disabled={saving}
                    style={{
                        width: '100%', padding: '15px',
                        background: saving ? '#e2e8f0' : '#0f172a',
                        color: saving ? '#94a3b8' : '#fff',
                        borderRadius: '14px', border: 'none',
                        fontWeight: 700, fontSize: '15px',
                        cursor: saving ? 'not-allowed' : 'pointer',
                        display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px',
                        transition: 'all 0.2s',
                        boxShadow: saving ? 'none' : '0 4px 16px rgba(15, 23, 42, 0.15)',
                        letterSpacing: '-0.01em',
                    }}
                >
                    {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    {saving ? 'Salvando...' : 'Salvar Alterações'}
                </button>
            </form>

            <style>{`
                .pi-input {
                    width: 100%;
                    padding: 12px 14px;
                    border-radius: 12px;
                    border: 1.5px solid #e2e8f0;
                    font-size: 14px;
                    font-weight: 500;
                    outline: none;
                    transition: border-color 0.2s, box-shadow 0.2s;
                    font-family: inherit;
                    color: #0f172a;
                    background: #fff;
                    box-sizing: border-box;
                }
                .pi-input:focus {
                    border-color: #6366f1;
                    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.08);
                }
                .pi-input::placeholder {
                    color: #cbd5e1;
                }
            `}</style>
        </div>
    )
}

/* ── Section Component ── */
function Section({ icon: Icon, title, description, children }: {
    icon: any; title: string; description: string; children: React.ReactNode
}) {
    return (
        <div style={{
            background: '#fff',
            borderRadius: '20px',
            border: '1px solid #f1f5f9',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02), 0 4px 12px rgba(0,0,0,0.03)',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <div style={{
                    width: '38px', height: '38px', borderRadius: '12px',
                    background: 'linear-gradient(135deg, #f0f4ff 0%, #e8ecf8 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#6366f1',
                }}>
                    <Icon size={18} strokeWidth={2} />
                </div>
                <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                        {title}
                    </h3>
                    <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0, fontWeight: 500 }}>
                        {description}
                    </p>
                </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {children}
            </div>
        </div>
    )
}

/* ── Field Component ── */
function Field({ label, hint, children }: {
    label: string; hint?: string; children: React.ReactNode
}) {
    return (
        <div>
            <label style={{
                display: 'block', fontSize: '13px', fontWeight: 600,
                color: '#475569', marginBottom: '8px'
            }}>
                {label}
            </label>
            {children}
            {hint && (
                <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px', fontWeight: 500 }}>
                    {hint}
                </p>
            )}
        </div>
    )
}

/* ── ColorField Component ── */
function ColorField({ label, value, onChange }: {
    label: string; value: string; onChange: (v: string) => void
}) {
    return (
        <div>
            <label style={{
                display: 'block', fontSize: '13px', fontWeight: 600,
                color: '#475569', marginBottom: '8px'
            }}>
                {label}
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                    width: '40px', height: '40px', borderRadius: '10px',
                    background: value, border: '2px solid #e2e8f0',
                    cursor: 'pointer', position: 'relative', overflow: 'hidden',
                    flexShrink: 0,
                }}>
                    <input
                        type="color"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        style={{
                            position: 'absolute', top: '-4px', left: '-4px',
                            width: '48px', height: '48px', border: 'none',
                            cursor: 'pointer', opacity: 0,
                        }}
                    />
                </div>
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="pi-input"
                    style={{ flex: 1, textTransform: 'uppercase', fontSize: '13px', fontWeight: 600 }}
                />
            </div>
        </div>
    )
}

/* ── ToggleRow Component ── */
function ToggleRow({ label, description, checked, onChange }: {
    label: string; description: string; checked: boolean; onChange: (v: boolean) => void
}) {
    return (
        <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 0',
            borderBottom: '1px solid #f1f5f9',
        }}>
            <div style={{ flex: 1, paddingRight: '16px' }}>
                <p style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', margin: 0 }}>
                    {label}
                </p>
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: '3px 0 0', fontWeight: 500 }}>
                    {description}
                </p>
            </div>
            <button
                type="button"
                onClick={() => onChange(!checked)}
                style={{
                    width: '48px', height: '26px', borderRadius: '13px',
                    background: checked
                        ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                        : '#e2e8f0',
                    border: 'none', cursor: 'pointer',
                    position: 'relative', transition: 'all 0.25s',
                    flexShrink: 0,
                    boxShadow: checked ? '0 2px 8px rgba(99,102,241,0.3)' : 'none',
                }}
            >
                <span style={{
                    position: 'absolute',
                    top: '3px',
                    left: checked ? '25px' : '3px',
                    width: '20px', height: '20px',
                    borderRadius: '50%',
                    background: '#fff',
                    transition: 'left 0.25s',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
                }} />
            </button>
        </div>
    )
}
