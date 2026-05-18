'use client'

import React, { useState } from 'react'
import { X, Loader2, Package, DollarSign, Image as ImageIcon, Globe } from 'lucide-react'
import { updateProduct } from '@/app/actions'

const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: '10px',
    border: '1px solid #e2e8f0', background: '#f8fafc',
    fontSize: '13px', color: '#0f172a', outline: 'none',
    transition: 'all 0.15s', fontWeight: 500,
}

const labelStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: '6px',
    fontSize: '11px', fontWeight: 700, color: '#64748b',
    marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em',
}

export default function EditProductModal({ product, onClose }: { product: any; onClose: () => void }) {
    const [loading, setLoading] = useState(false)
    const [isDigital, setIsDigital] = useState(product.isDigital)

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        const formData = new FormData(e.currentTarget)
        try {
            await updateProduct(formData)
            onClose()
            window.location.reload()
        } catch (err: any) {
            alert('Erro: ' + err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
        }}>
            <div style={{
                background: '#fff', borderRadius: '18px', width: '100%', maxWidth: '440px',
                boxShadow: '0 24px 48px rgba(0,0,0,0.15)',
            }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderBottom: '1px solid #f1f5f9' }}>
                    <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>Editar Produto</h2>
                    <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', width: '30px', height: '30px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', cursor: 'pointer' }}>
                        <X size={16} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ padding: '20px' }}>
                    <input type="hidden" name="id" defaultValue={String(product.id)} />

                    <div style={{ marginBottom: '14px' }}>
                        <label style={labelStyle}><Package size={12} /> Nome</label>
                        <input name="name" type="text" style={inputStyle} defaultValue={product.name} required
                            onFocus={e => { e.target.style.borderColor = '#0f172a'; e.target.style.background = '#fff' }}
                            onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc' }}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                        <div>
                            <label style={labelStyle}><DollarSign size={12} /> Preço (R$)</label>
                            <input name="price" type="number" step="0.01" style={inputStyle} defaultValue={product.price} required
                                onFocus={e => { e.target.style.borderColor = '#0f172a'; e.target.style.background = '#fff' }}
                                onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc' }}
                            />
                        </div>
                        <div>
                            <label style={labelStyle}><DollarSign size={12} /> Custo (R$)</label>
                            <input name="cost" type="number" step="0.01" style={inputStyle} defaultValue={product.cost || 0} required
                                onFocus={e => { e.target.style.borderColor = '#0f172a'; e.target.style.background = '#fff' }}
                                onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc' }}
                            />
                        </div>
                    </div>

                    <div style={{ marginBottom: '14px' }}>
                        <label style={labelStyle}><ImageIcon size={12} /> Imagem (URL)</label>
                        <input name="imageUrl" type="url" style={inputStyle} defaultValue={product.imageUrl || ''} placeholder="https://..."
                            onFocus={e => { e.target.style.borderColor = '#0f172a'; e.target.style.background = '#fff' }}
                            onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc' }}
                        />
                    </div>

                    {/* Digital Toggle */}
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '12px 14px', background: '#f8fafc', borderRadius: '12px',
                        border: '1px solid #f1f5f9', marginBottom: isDigital ? '14px' : '20px',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Globe size={16} color="#6366f1" />
                            <div>
                                <p style={{ margin: 0, fontSize: '12px', fontWeight: 700, color: '#1e293b' }}>Produto Digital</p>
                                <p style={{ margin: 0, fontSize: '10px', color: '#94a3b8' }}>Sem frete, envio por e-mail</p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsDigital(!isDigital)}
                            style={{
                                width: '40px', height: '22px', borderRadius: '22px', border: 'none', cursor: 'pointer',
                                background: isDigital ? '#6366f1' : '#cbd5e1', position: 'relative', transition: '0.2s',
                            }}
                        >
                            <span style={{
                                position: 'absolute', height: '16px', width: '16px',
                                left: isDigital ? '21px' : '3px', top: '3px',
                                background: '#fff', borderRadius: '50%', transition: '0.2s',
                            }} />
                        </button>
                    </div>

                    {isDigital && (
                        <div style={{ marginBottom: '20px' }}>
                            <label style={labelStyle}><Globe size={12} /> Link de Acesso</label>
                            <input name="accessLink" type="url" style={inputStyle} defaultValue={product.accessLink || ''} placeholder="https://drive.google.com/..."
                                onFocus={e => { e.target.style.borderColor = '#0f172a'; e.target.style.background = '#fff' }}
                                onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc' }}
                            />
                            <p style={{ margin: '4px 0 0', fontSize: '10px', color: '#94a3b8' }}>Enviado por e-mail após pagamento confirmado.</p>
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button type="button" onClick={onClose} style={{
                            flex: 1, padding: '11px', borderRadius: '10px', border: '1px solid #e2e8f0',
                            background: '#fff', color: '#475569', fontWeight: 700, fontSize: '13px', cursor: 'pointer',
                        }}>Cancelar</button>
                        <button type="submit" disabled={loading} style={{
                            flex: 1.5, padding: '11px', borderRadius: '10px', border: 'none',
                            background: '#0f172a', color: '#fff', fontWeight: 700, fontSize: '13px',
                            cursor: loading ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                        }}>
                            {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : null}
                            {loading ? 'Salvando...' : 'Salvar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
