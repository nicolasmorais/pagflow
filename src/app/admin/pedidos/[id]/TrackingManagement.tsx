'use client'

import React, { useState } from 'react'
import { Truck, ExternalLink, Save, CheckCircle2, Link as LinkIcon, Edit3 } from 'lucide-react'
import { updateOrderTracking } from '@/app/actions'

export default function TrackingManagement({
    orderId,
    initialCode,
    initialUrl
}: {
    orderId: string
    initialCode: string | null
    initialUrl: string | null
}) {
    const [isEditing, setIsEditing] = useState(!initialUrl)
    const [code, setCode] = useState(initialCode || 'SPX-BR')
    const [url, setUrl] = useState(initialUrl || '')
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)

    const handleSave = async () => {
        setLoading(true)
        setSuccess(false)
        try {
            await updateOrderTracking(orderId, code || 'SPX-BR', url)
            setSuccess(true)
            setIsEditing(false)
            setTimeout(() => setSuccess(false), 3000)
        } catch {
            alert('Erro ao atualizar rastreio')
        } finally {
            setLoading(false)
        }
    }

    /* ── View mode ── */
    if (!isEditing && initialUrl) {
        return (
            <div className="pedido-card" style={{ marginBottom: '16px' }}>
                <div className="pedido-card-header">
                    <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Truck size={14} color="#0075ff" />
                    </div>
                    <span className="pedido-card-title">Rastreamento</span>
                    {success && (
                        <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#10b981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', background: '#ecfdf5', padding: '3px 9px', borderRadius: '8px' }}>
                            <CheckCircle2 size={12} /> Salvo!
                        </span>
                    )}
                    <button
                        onClick={() => setIsEditing(true)}
                        style={{
                            marginLeft: success ? '8px' : 'auto',
                            background: 'none', border: 'none', color: '#64748b', fontSize: '12px',
                            fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
                            padding: '4px 8px', borderRadius: '7px', transition: 'background 0.15s'
                        }}
                    >
                        <Edit3 size={13} /> Atualizar
                    </button>
                </div>
                <div className="pedido-card-body">
                    <p style={{ margin: '0 0 8px', fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        Link de Acompanhamento
                    </p>
                    <a
                        href={initialUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            display: 'inline-flex', alignItems: 'center', gap: '6px',
                            color: '#0075ff', fontWeight: 700, textDecoration: 'none', fontSize: '13px',
                            background: '#eff6ff', padding: '8px 14px', borderRadius: '10px',
                            border: '1px solid #bfdbfe', maxWidth: '100%', wordBreak: 'break-all'
                        }}
                    >
                        <LinkIcon size={14} style={{ flexShrink: 0 }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {initialUrl.length > 55 ? initialUrl.slice(0, 55) + '…' : initialUrl}
                        </span>
                        <ExternalLink size={13} style={{ flexShrink: 0 }} />
                    </a>
                </div>
            </div>
        )
    }

    /* ── Edit mode ── */
    return (
        <div className="pedido-card" style={{ marginBottom: '16px' }}>
            <div className="pedido-card-header">
                <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Truck size={14} color="#0075ff" />
                </div>
                <span className="pedido-card-title">Enviar Link de Rastreio</span>
                {initialUrl && (
                    <button
                        onClick={() => setIsEditing(false)}
                        style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#94a3b8', fontSize: '12px', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
                    >
                        Cancelar
                    </button>
                )}
            </div>
            <div className="pedido-card-body">
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
                    Cole o Link de Rastreio (URL)
                </label>
                <div className="tracking-input-row">
                    <div style={{ flex: 1, position: 'relative' }}>
                        <LinkIcon size={16} color="#94a3b8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                        <input
                            value={url}
                            onChange={e => setUrl(e.target.value)}
                            placeholder="https://track.spx.br/..."
                            style={{
                                width: '100%', padding: '13px 14px 13px 42px',
                                borderRadius: '12px', border: '1.5px solid #e2e8f0',
                                outline: 'none', fontWeight: 600, fontSize: '14px',
                                background: '#f8fafc', color: '#1e293b',
                                transition: 'border-color 0.15s',
                                minHeight: '48px'
                            }}
                            onFocus={e => (e.target.style.borderColor = '#3b82f6')}
                            onBlur={e => (e.target.style.borderColor = '#e2e8f0')}
                        />
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={loading || !url.trim()}
                        className="tracking-save-btn"
                        style={{
                            background: loading || !url.trim() ? '#94a3b8' : '#111827',
                            opacity: 1,
                            cursor: loading || !url.trim() ? 'not-allowed' : 'pointer',
                        }}
                    >
                        {loading
                            ? 'Salvando...'
                            : success
                            ? <><CheckCircle2 size={16} /> Enviado!</>
                            : <><Save size={16} /> Enviar Link</>
                        }
                    </button>
                </div>
                <p style={{ marginTop: '12px', fontSize: '12px', color: '#94a3b8', lineHeight: 1.5 }}>
                    💡 O cliente receberá um e-mail com o botão direto para o link de rastreio.
                </p>
            </div>
        </div>
    )
}
