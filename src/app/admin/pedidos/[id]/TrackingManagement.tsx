'use client'

import React, { useState } from 'react'
import { Truck, ExternalLink, Save, CheckCircle2, Link as LinkIcon, Edit3, RotateCw } from 'lucide-react'
import { updateOrderTracking, resendTrackingEmail } from '@/app/actions'

const cardStyle: React.CSSProperties = {
    background: '#FFFFFF', border: '1px solid #E5E7EF', borderRadius: '14px', padding: '24px',
}

export default function TrackingManagement({ orderId, initialUrl }: { orderId: string; initialUrl: string | null }) {
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
            <div style={cardStyle}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '11px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '9px', background: '#F5F6F9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid #E5E7EF' }}>
                            <Truck size={15} color="#14151F" strokeWidth={1.9} />
                        </div>
                        <div style={{ fontFamily: "'Fraunces', serif", fontSize: '17.5px', fontWeight: 600, letterSpacing: '-0.005em', color: '#14151F' }}>Rastreamento</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {success && (
                            <span style={{ fontSize: '11px', color: '#1E7A52', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', background: '#E3F4EA', padding: '4px 10px', borderRadius: '999px' }}>
                                <CheckCircle2 size={12} /> Salvo!
                            </span>
                        )}
                        <button onClick={() => setIsEditing(true)} style={{ background: 'none', border: 'none', color: '#6E7180', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 8px', borderRadius: '7px', fontFamily: 'inherit' }}>
                            <Edit3 size={13} strokeWidth={1.8} /> Atualizar
                        </button>
                    </div>
                </div>

                <div style={{ fontSize: '10.5px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#6E7180', marginBottom: '8px' }}>Link de rastreio</div>
                <a href={initialUrl} target="_blank" rel="noopener noreferrer" style={{
                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                    color: '#2C5C86', fontWeight: 600, textDecoration: 'none', fontSize: '13px',
                    background: '#E7F1F8', padding: '10px 16px', borderRadius: '9px',
                    border: '1px solid #C5DDEF', maxWidth: '100%', wordBreak: 'break-all',
                }}>
                    <LinkIcon size={14} style={{ flexShrink: 0 }} strokeWidth={1.8} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {initialUrl.length > 60 ? initialUrl.slice(0, 60) + '…' : initialUrl}
                    </span>
                    <ExternalLink size={13} style={{ flexShrink: 0 }} strokeWidth={1.8} />
                </a>

                <div style={{ marginTop: '18px', paddingTop: '16px', borderTop: '1px solid #E5E7EF' }}>
                    <button onClick={handleResend} disabled={resendLoading} style={{
                        background: '#E3F4EA', border: '1px solid #C3E8D4', color: '#1E7A52',
                        padding: '10px 18px', borderRadius: '9px', fontSize: '13px', fontWeight: 600,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                        opacity: resendLoading ? 0.6 : 1, fontFamily: 'inherit',
                    }}>
                        <RotateCw size={14} style={{ animation: resendLoading ? 'spin 1s linear infinite' : 'none' }} strokeWidth={1.8} />
                        {resendLoading ? 'Enviando...' : 'Reenviar e-mail de rastreio'}
                    </button>
                    {resendResult && (
                        <p style={{ margin: '10px 0 0', fontSize: '12px', fontWeight: 600, color: resendResult.includes('!') ? '#1E7A52' : '#B23B32' }}>{resendResult}</p>
                    )}
                </div>
            </div>
        )
    }

    /* ── Edit mode ── */
    return (
        <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '11px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '9px', background: '#F5F6F9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid #E5E7EF' }}>
                        <Truck size={15} color="#14151F" strokeWidth={1.9} />
                    </div>
                    <div style={{ fontFamily: "'Fraunces', serif", fontSize: '17.5px', fontWeight: 600, letterSpacing: '-0.005em', color: '#14151F' }}>Enviar link de rastreio</div>
                </div>
                {initialUrl && (
                    <button onClick={() => setIsEditing(false)} style={{ background: 'none', border: 'none', color: '#6E7180', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
                )}
            </div>

            <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#6E7180', marginBottom: '8px' }}>Cole o link de rastreio</div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '180px', border: '1px solid #E5E7EF', borderRadius: '9px', padding: '11px 13px', fontSize: '13.5px', background: '#F5F6F9', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <LinkIcon size={14} color="#6E7180" strokeWidth={2} style={{ flexShrink: 0 }} />
                    <input
                        value={url}
                        onChange={e => setUrl(e.target.value)}
                        placeholder="https://rastreio.com/..."
                        style={{ border: 'none', outline: 'none', background: 'transparent', flex: 1, fontSize: '13.5px', fontFamily: 'inherit', color: '#14151F', fontWeight: 500, minWidth: 0 }}
                    />
                </div>
                <button
                    onClick={handleSave}
                    disabled={loading || !url.trim()}
                    style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
                        background: loading || !url.trim() ? '#6E7180' : '#14151F', color: '#fff', border: 'none', borderRadius: '9px',
                        padding: '11px 18px', fontSize: '13.5px', fontWeight: 600, whiteSpace: 'nowrap',
                        cursor: loading || !url.trim() ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                    }}
                >
                    {loading ? 'Salvando...' : success ? <><CheckCircle2 size={14} strokeWidth={2} /> Enviado!</> : <><Save size={14} strokeWidth={2} /> Salvar e enviar</>}
                </button>
            </div>
            <div style={{ fontSize: '12px', color: '#6E7180', marginTop: '10px', lineHeight: 1.55 }}>
                O cliente receberá um e-mail com o botão para rastrear o pedido.
            </div>
        </div>
    )
}
