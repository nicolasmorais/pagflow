'use client'

import React, { useState } from 'react'
import { Truck, ExternalLink, Save, CheckCircle2, Link as LinkIcon, Edit3 } from 'lucide-react'
import { updateOrderTracking } from '@/app/actions'

export default function TrackingManagement({
    orderId,
    initialCode,
    initialUrl
}: {
    orderId: string,
    initialCode: string | null,
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
        } catch (error) {
            alert('Erro ao atualizar rastreio')
        } finally {
            setLoading(false)
        }
    }

    if (!isEditing && initialUrl) {
        return (
            <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', marginTop: '24px' }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Truck size={18} color="#0075ff" />
                        <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>Rastreamento do Pedido</h3>
                    </div>
                    <button
                        onClick={() => setIsEditing(true)}
                        style={{ background: 'transparent', border: 'none', color: '#64748b', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                        <Edit3 size={14} /> Atualizar Link
                    </button>
                </div>
                <div style={{ padding: '24px', display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px' }}>Link de Acompanhamento</p>
                        <a
                            href={initialUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0075ff', fontWeight: 700, textDecoration: 'none', fontSize: '1.1rem' }}
                        >
                            <LinkIcon size={18} /> {initialUrl.length > 50 ? initialUrl.slice(0, 50) + '...' : initialUrl} <ExternalLink size={16} />
                        </a>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', marginTop: '24px' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Truck size={18} color="#0075ff" />
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>Enviar Link de Rastreio</h3>
                </div>
            </div>
            <div style={{ padding: '24px' }}>
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '10px' }}>Cole o Link de Rastreio (URL)</label>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <div style={{ flex: 1, position: 'relative' }}>
                            <LinkIcon size={18} color="#94a3b8" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                            <input
                                value={url}
                                onChange={e => setUrl(e.target.value)}
                                placeholder="https://track.spx.br/..."
                                style={{ width: '100%', padding: '16px 16px 16px 48px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', fontWeight: 600, fontSize: '0.95rem', background: '#f8fafc' }}
                            />
                        </div>
                        <button
                            onClick={handleSave}
                            disabled={loading || !url}
                            style={{
                                background: '#111827',
                                color: 'white',
                                border: 'none',
                                borderRadius: '12px',
                                padding: '0 32px',
                                cursor: 'pointer',
                                fontWeight: 800,
                                fontSize: '0.9rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                transition: 'all 0.3s',
                                opacity: loading || !url ? 0.7 : 1
                            }}
                        >
                            {loading ? 'Processando...' : success ? <><CheckCircle2 size={18} /> Enviado!</> : <><Save size={18} /> Enviar Link</>}
                        </button>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        💡 O cliente receberá o e-mail da <strong>Elabela Store</strong> com o botão direto para o link acima.
                    </span>
                    {initialUrl && isEditing && (
                        <button onClick={() => setIsEditing(false)} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.75rem', textDecoration: 'underline', cursor: 'pointer' }}>Cancelar</button>
                    )}
                </div>
            </div>
        </div>
    )
}
