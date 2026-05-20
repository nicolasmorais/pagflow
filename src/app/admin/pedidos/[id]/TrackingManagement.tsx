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
                borderRadius: '18px', padding: '22px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                    <div style={{
                        width: '32px', height: '32px', borderRadius: '10px',
                        background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: '1px solid #e2e8f0',
                    }}>
                        <Truck size={15} color="#3b82f6" strokeWidth={2} />
                    </div>
                    <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.01em', flex: 1 }}>
                        Rastreamento
                    </h3>
                    {success && (
                        <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', background: '#ecfdf5', padding: '4px 10px', borderRadius: '8px' }}>
                            <CheckCircle2 size={12} /> Salvo!
                        </span>
                    )}
                    <button
                        onClick={() => setIsEditing(true)}
                        style={{
                            background: 'none', border: 'none', color: '#64748b', fontSize: '12px',
                            fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
                            padding: '4px 8px', borderRadius: '7px', transition: 'background 0.15s'
                        }}
                    >
                        <Edit3 size={13} /> Atualizar
                    </button>
                </div>

                <p style={{ margin: '0 0 8px', fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Link de Rastreio
                </p>
                <a
                    href={initialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                        display: 'inline-flex', alignItems: 'center', gap: '8px',
                        color: '#3b82f6', fontWeight: 700, textDecoration: 'none', fontSize: '13px',
                        background: '#eff6ff', padding: '12px 16px', borderRadius: '12px',
                        border: '1px solid #bfdbfe', maxWidth: '100%', wordBreak: 'break-all'
                    }}
                >
                    <LinkIcon size={14} style={{ flexShrink: 0 }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {initialUrl.length > 60 ? initialUrl.slice(0, 60) + '…' : initialUrl}
                    </span>
                    <ExternalLink size={13} style={{ flexShrink: 0 }} />
                </a>

                <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid #f1f5f9' }}>
                    <button
                        onClick={handleResend}
                        disabled={resendLoading}
                        style={{
                            background: '#f0fdf4', border: '1px solid #a7f3d0', color: '#059669',
                            padding: '10px 18px', borderRadius: '10px', fontSize: '13px', fontWeight: 700,
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                            opacity: resendLoading ? 0.6 : 1, transition: 'all 0.15s',
                        }}
                    >
                        <RotateCw size={14} style={{ animation: resendLoading ? 'spin 1s linear infinite' : 'none' }} />
                        {resendLoading ? 'Enviando...' : 'Reenviar E-mail de Rastreio'}
                    </button>
                    {resendResult && (
                        <p style={{ margin: '8px 0 0', fontSize: '12px', fontWeight: 700, color: resendResult.includes('!') ? '#059669' : '#dc2626' }}>
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
            borderRadius: '18px', padding: '22px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <div style={{
                    width: '32px', height: '32px', borderRadius: '10px',
                    background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '1px solid #e2e8f0',
                }}>
                    <Truck size={15} color="#3b82f6" strokeWidth={2} />
                </div>
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.01em', flex: 1 }}>
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

            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>
                Cole o Link de Rastreio
            </label>
            <div className="tracking-input-row">
                <div style={{ flex: 1, position: 'relative' }}>
                    <LinkIcon size={16} color="#94a3b8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                    <input
                        value={url}
                        onChange={e => setUrl(e.target.value)}
                        placeholder="https://rastreio.com/..."
                        style={{
                            width: '100%', padding: '14px 14px 14px 42px',
                            borderRadius: '12px', border: '1.5px solid #e2e8f0',
                            outline: 'none', fontWeight: 600, fontSize: '14px',
                            background: '#f8fafc', color: '#0f172a',
                            transition: 'border-color 0.15s',
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
                    }}
                >
                    {loading
                        ? 'Salvando...'
                        : success
                        ? <><CheckCircle2 size={16} /> Enviado!</>
                        : <><Save size={16} /> Salvar e Enviar</>
                    }
                </button>
            </div>
            <p style={{ marginTop: '12px', fontSize: '12px', color: '#94a3b8', lineHeight: 1.5, fontWeight: 500 }}>
                O cliente receberá um e-mail com o botão para rastrear o pedido.
            </p>
        </div>
    )
}
