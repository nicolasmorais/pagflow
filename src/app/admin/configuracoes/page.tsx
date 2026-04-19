'use client'

import React, { useState, useEffect } from 'react'
import { Save, Bell, Mail, Loader2, Info, Database } from 'lucide-react'
import { updateCustomization, getCustomization } from '@/app/actions'

export const dynamic = 'force-dynamic';

export default function ConfiguracoesPage() {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null)

    const [adminEmail, setAdminEmail] = useState('')
    const [webhookUrl, setWebhookUrl] = useState('')
    const [notifySales, setNotifySales] = useState(false)
    const [notifyAbandoned, setNotifyAbandoned] = useState(false)

    useEffect(() => {
        async function loadSettings() {
            try {
                const email = await getCustomization('notify_admin_email')
                const webhook = await getCustomization('webhook_url')
                const sales = await getCustomization('notify_sales_enabled')
                const abandoned = await getCustomization('notify_abandoned_enabled')

                if (email) setAdminEmail(email)
                if (webhook) setWebhookUrl(webhook)
                setNotifySales(sales === 'true')
                setNotifyAbandoned(abandoned === 'true')
            } catch (error) {
                console.error("Failed to load settings:", error)
            } finally {
                setLoading(false)
            }
        }
        loadSettings()
    }, [])

    const handleSave = async () => {
        setSaving(true)
        setStatus(null)
        try {
            await updateCustomization('notify_admin_email', adminEmail)
            await updateCustomization('webhook_url', webhookUrl)
            await updateCustomization('notify_sales_enabled', notifySales ? 'true' : 'false')
            await updateCustomization('notify_abandoned_enabled', notifyAbandoned ? 'true' : 'false')

            setStatus({ type: 'success', message: 'Configurações salvas com sucesso!' })
            setTimeout(() => setStatus(null), 3000)
        } catch (error) {
            setStatus({ type: 'error', message: 'Erro ao salvar configurações' })
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        )
    }

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '60px' }}>
            <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>
                    Configurações do Sistema
                </h1>
                <p style={{ color: '#64748b' }}>Configure alertas e notificações para sua loja.</p>
            </div>

            {status && (
                <div style={{
                    padding: '16px',
                    borderRadius: '12px',
                    marginBottom: '24px',
                    backgroundColor: status.type === 'success' ? '#f0fdf4' : '#fef2f2',
                    border: `1px solid ${status.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
                    color: status.type === 'success' ? '#166534' : '#991b1b',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                }}>
                    {status.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                    {status.message}
                </div>
            )}

            <div style={{
                background: '#fff',
                borderRadius: '24px',
                padding: '32px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                border: '1px solid rgba(0,0,0,0.05)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ padding: '10px', background: '#eff6ff', borderRadius: '12px', color: '#3b82f6' }}>
                        <Bell size={24} />
                    </div>
                    <div>
                        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#1e293b' }}>Alertas do Administrador</h2>
                        <p style={{ fontSize: '13px', color: '#64748b' }}>Receba atualizações importantes diretamente no seu e-mail.</p>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>
                            E-mail para Notificações
                        </label>
                        <div style={{ position: 'relative' }}>
                            <Mail size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                            <input
                                type="email"
                                value={adminEmail}
                                onChange={(e) => setAdminEmail(e.target.value)}
                                placeholder="E.g., seuemail@dominio.com"
                                style={{
                                    width: '100%',
                                    padding: '14px 16px 14px 44px',
                                    borderRadius: '12px',
                                    border: '1px solid #e2e8f0',
                                    fontSize: '15px',
                                    background: '#f8fafc',
                                    outline: 'none',
                                    transition: 'all 0.2s'
                                }}
                            />
                        </div>
                        <p style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>Onde você deseja receber os avisos sobre vendas e abandonos.</p>
                    </div>

                    <div style={{ padding: '20px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                                <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#1e293b' }}>Notificação de Nova Venda</h3>
                                <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>Ser avisado quando um pedido for Pago.</p>
                            </div>
                            <label style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
                                <input type="checkbox" className="sr-only peer" checked={notifySales} onChange={(e) => setNotifySales(e.target.checked)} />
                                <div style={{
                                    width: '44px', height: '24px', backgroundColor: notifySales ? '#10b981' : '#cbd5e1',
                                    position: 'relative', transition: 'background-color 0.2s', borderRadius: '999px'
                                }}>
                                    <div style={{
                                        position: 'absolute', top: '2px', left: notifySales ? '22px' : '2px',
                                        width: '20px', height: '20px', backgroundColor: '#fff', borderRadius: '50%',
                                        transition: 'left 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                    }}></div>
                                </div>
                            </label>
                        </div>
                        <div style={{ height: '1px', background: '#e2e8f0', margin: '16px 0' }}></div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                                <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#1e293b' }}>Carrinhos Abandonados</h3>
                                <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>Ser avisado quando um cliente não concluir a compra.</p>
                            </div>
                            <label style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
                                <input type="checkbox" className="sr-only peer" checked={notifyAbandoned} onChange={(e) => setNotifyAbandoned(e.target.checked)} />
                                <div style={{
                                    width: '44px', height: '24px', backgroundColor: notifyAbandoned ? '#10b981' : '#cbd5e1',
                                    position: 'relative', transition: 'background-color 0.2s', borderRadius: '999px'
                                }}>
                                    <div style={{
                                        position: 'absolute', top: '2px', left: notifyAbandoned ? '22px' : '2px',
                                        width: '20px', height: '20px', backgroundColor: '#fff', borderRadius: '50%',
                                        transition: 'left 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                    }}></div>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>

                <div style={{ padding: '24px', background: '#f8fafc', borderRadius: '24px', border: '1px solid #e2e8f0', marginTop: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                        <div style={{ padding: '8px', background: '#f0f9ff', borderRadius: '10px', color: '#0ea5e9' }}>
                            <Database size={20} />
                        </div>
                        <div>
                            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1e293b' }}>Integração Google Sheets / Webhook</h3>
                            <p style={{ fontSize: '13px', color: '#64748b' }}>Envie dados dos pedidos para planilhas ou sistemas externos.</p>
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>
                            URL do Webhook
                        </label>
                        <input
                            type="url"
                            value={webhookUrl}
                            onChange={(e) => setWebhookUrl(e.target.value)}
                            placeholder="https://script.google.com/macros/s/..."
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                borderRadius: '10px',
                                border: '1px solid #e2e8f0',
                                fontSize: '14px',
                                background: '#fff',
                                outline: 'none'
                            }}
                        />
                        <div style={{ marginTop: '10px', padding: '12px', background: '#fff', borderRadius: '8px', border: '1px solid #e0f2fe', display: 'flex', gap: '10px' }}>
                            <Info size={16} style={{ color: '#0ea5e9', flexShrink: 0, marginTop: '2px' }} />
                            <p style={{ fontSize: '12px', color: '#0369a1', lineHeight: '1.5' }}>
                                Cole aqui a URL do seu Google App Script para salvar os pedidos automaticamente em sua planilha.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    style={{
                        background: '#10b981', color: '#fff', padding: '14px 28px',
                        borderRadius: '12px', fontSize: '15px', fontWeight: 600,
                        display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer',
                        opacity: saving ? 0.7 : 1, transition: 'all 0.2s', border: 'none'
                    }}
                >
                    {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    {saving ? 'Salvando...' : 'Salvar Configurações'}
                </button>
            </div>
        </div>
    )
}

function CheckCircle2(props: any) {
    return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
}

function AlertCircle(props: any) {
    return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
}
