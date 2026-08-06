'use client'

import React, { useState } from 'react'
import { Truck, ExternalLink, Save, CheckCircle2, Link as LinkIcon, Edit3, RotateCw } from 'lucide-react'
import { updateOrderTracking, resendTrackingEmail } from '@/app/actions'

export default function TrackingManagement({
    orderId,
    initialUrl
}: {
    orderId: string
    initialUrl: string | null
}) {
    const [isEditing, setIsEditing] = useState(!initialUrl)
    const [url, setUrl] = useState(initialUrl || '')
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [resendLoading, setResendLoading] = useState(false)
    const [resendResult, setResendResult] = useState<string | null>(null)

    const handleSave = async () => {
        setLoading(true)
        setSuccess(false)
        try {
            await updateOrderTracking(orderId, '', url)
            setSuccess(true)
            setIsEditing(false)
            setTimeout(() => setSuccess(false), 3000)
        } catch {
            alert('Erro ao atualizar rastreio')
        } finally {
            setLoading(false)
        }
    }

    const handleResend = async () => {
        setResendLoading(true)
        setResendResult(null)
        try {
            const res = await resendTrackingEmail(orderId)
            setResendResult(res.success ? 'E-mail enviado!' : `Erro: ${res.error}`)
        } catch {
            setResendResult('Erro ao enviar e-mail.')
        } finally {
            setResendLoading(false)
        }
    }

    /* ── View mode ── */
    if (!isEditing && initialUrl) {
        return (
            <div style={{
                background: '#fff', border: '1px solid #f1f5f9',
                borderRadius: '20px', padding: '24px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02), 0 2px 8px rgba(0,0,0,0.02)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '22px' }}>
                    <div style={{
                        width: '34px', height: '34px', borderRadius: '10px',
                        background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: '1px solid #e2e8f0',
                    }}>
                        <Truck size={16} color="#3b82f6" strokeWidth={1.8} />
                    </div>
                    <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.01em', flex: 1 }}>
                        Rastreamento
                    </h3>
                    {success && (
                        <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', background: '#ecfdf5', padding: '4px 12px', borderRadius: '8px', border: '1px solid #d1fae5' }}>
                            <CheckCircle2 size={12} /> Salvo!
                        </span>
                    )}
                    <button
                        onClick={() => setIsEditing(true)}
                        style={{
                            background: 'none', border: 'none', color: '#8b95a5', fontSize: '12px',
                            fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
                            padding: '6px 10px', borderRadius: '8px', transition: 'all 0.2s ease'
                        }}
                    >
                        <Edit3 size={13} strokeWidth={1.8} /> Atualizar
                    </button>
                </div>

                <p style={{ margin: '0 0 10px', fontSize: '10px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Link de Rastreio
                </p>
                <a
                    href={initialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                        display: 'inline-flex', alignItems: 'center', gap: '8px',
                        color: '#3b82f6', fontWeight: 600, textDecoration: 'none', fontSize: '13px',
                        background: '#f0f7ff', padding: '12px 18px', borderRadius: '12px',
                        border: '1px solid #dbeafe', maxWidth: '100%', wordBreak: 'break-all',
                        transition: 'all 0.2s ease',
                    }}
                >
                    <LinkIcon size={14} style={{ flexShrink: 0 }} strokeWidth={1.8} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {initialUrl.length > 60 ? initialUrl.slice(0, 60) + '…' : initialUrl}
                    </span>
                    <ExternalLink size={13} style={{ flexShrink: 0 }} strokeWidth={1.8} />
                </a>

                <div style={{ marginTop: '18px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
                    <button
                        onClick={handleResend}
                        disabled={resendLoading}
                        style={{
                            background: '#f0fdf4', border: '1px solid #d1fae5', color: '#059669',
                            padding: '11px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: 600,
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                            opacity: resendLoading ? 0.6 : 1, transition: 'all 0.2s ease',
                        }}
                    >
                        <RotateCw size={14} style={{ animation: resendLoading ? 'spin 1s linear infinite' : 'none' }} strokeWidth={1.8} />
                        {resendLoading ? 'Enviando...' : 'Reenviar E-mail de Rastreio'}
                    </button>
                    {resendResult && (
                        <p style={{ margin: '10px 0 0', fontSize: '12px', fontWeight: 600, color: resendResult.includes('!') ? '#059669' : '#dc2626' }}>
                            {resendResult}
                        </p>
                    )}
                </div>
            </div>
        )
    }

    /* ── Edit mode ── */
    return (
        <div style={{
            background: '#fff', border: '1px solid #f1f5f9',
            borderRadius: '20px', padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02), 0 2px 8px rgba(0,0,0,0.02)',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '22px' }}>
                <div style={{
                    width: '34px', height: '34px', borderRadius: '10px',
                    background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '1px solid #e2e8f0',
                }}>
                    <Truck size={16} color="#3b82f6" strokeWidth={1.8} />
                </div>
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.01em', flex: 1 }}>
                    Enviar Link de Rastreio
                </h3>
                {initialUrl && (
                    <button
                        onClick={() => setIsEditing(false)}
                        style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '12px', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
                    >
                        Cancelar
                    </button>
                )}
            </div>

            <label style={{ display: 'block', fontSize: '10px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>
                Cole o Link de Rastreio
            </label>
            <div className="tracking-input-row">
                <div style={{ flex: 1, position: 'relative' }}>
                    <LinkIcon size={16} color="#94a3b8" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} strokeWidth={1.8} />
                    <input
                        value={url}
                        onChange={e => setUrl(e.target.value)}
                        placeholder="https://rastreio.com/..."
                        style={{
                            width: '100%', padding: '14px 16px 14px 44px',
                            borderRadius: '12px', border: '1.5px solid #e2e8f0',
                            outline: 'none', fontWeight: 500, fontSize: '14px',
                            background: '#f8fafc', color: '#0f172a',
                            transition: 'border-color 0.2s ease',
                        }}
                        onFocus={e => (e.target.style.borderColor = '#6366f1')}
                        onBlur={e => (e.target.style.borderColor = '#e2e8f0')}
                    />
                </div>
                <button
                    onClick={handleSave}
                    disabled={loading || !url.trim()}
                    className="tracking-save-btn"
                    style={{
                        background: loading || !url.trim() ? '#94a3b8' : '#0f172a',
                        opacity: 1,
                        cursor: loading || !url.trim() ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s ease',
                    }}
                >
                    {loading
                        ? 'Salvando...'
                        : success
                        ? <><CheckCircle2 size={16} strokeWidth={1.8} /> Enviado!</>
                        : <><Save size={16} strokeWidth={1.8} /> Salvar e Enviar</>
                    }
                </button>
            </div>
            <p style={{ marginTop: '14px', fontSize: '12px', color: '#94a3b8', lineHeight: 1.6, fontWeight: 500 }}>
                O cliente receberá um e-mail com o botão para rastrear o pedido.
            </p>
        </div>
    )
}
