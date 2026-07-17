'use client'

import React, { useState, useEffect } from 'react'
import { Loader2, Check, Target, ExternalLink, Plus, Trash2, X, ChevronDown, ChevronUp, Edit2, Package, Save } from 'lucide-react'
import { updateCustomization, getCustomization } from '@/app/actions'

type PixelProduct = { id: string; name: string }
type Pixel = {
    id: string
    name: string
    type: string
    pixelId: string
    products: PixelProduct[]
}

const PIXEL_TYPES = [
    { value: 'taboola', label: 'Taboola', color: '#0091ff', icon: '🔵' },
    { value: 'facebook', label: 'Facebook (Meta)', color: '#1877f2', icon: '🔷' },
    { value: 'google', label: 'Google Ads', color: '#4285f4', icon: '🟢' },
    { value: 'ga', label: 'Google Analytics (GA4)', color: '#f59e0b', icon: '🟡' },
    { value: 'google_conv', label: 'Google Ads Conversion', color: '#34a853', icon: '🟢' },
]

const GLOBAL_KEYS: Record<string, string> = {
    taboola: 'marketing_taboola_id',
    facebook: 'marketing_facebook_id',
    google: 'marketing_google_id',
    ga: 'marketing_ga_id',
    google_conv: 'marketing_google_conv_label',
}

export default function MarketingPage() {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [globalValues, setGlobalValues] = useState<Record<string, string>>({})
    const [pixels, setPixels] = useState<Pixel[]>([])
    const [products, setProducts] = useState<{ id: string; name: string }[]>([])
    const [showForm, setShowForm] = useState(false)
    const [editingPixel, setEditingPixel] = useState<Pixel | null>(null)
    const [form, setForm] = useState({ name: '', type: 'taboola', pixelId: '', productIds: [] as string[] })
    const [showProducts, setShowProducts] = useState(false)
    const [expandedPixel, setExpandedPixel] = useState<string | null>(null)

    useEffect(() => {
        loadAll()
    }, [])

    async function loadAll() {
        try {
            // Carregar pixels globais
            const entries = await Promise.all(
                Object.values(GLOBAL_KEYS).map(async key => [key, (await getCustomization(key)) || ''])
            )
            setGlobalValues(Object.fromEntries(entries))

            // Carregar pixels por produto
            const res = await fetch('/api/admin/pixels')
            const data = await res.json()
            if (data.pixels) setPixels(data.pixels)

            // Carregar lista de produtos
            const prodRes = await fetch('/api/admin/products')
            const prodData = await prodRes.json()
            if (prodData.products) setProducts(prodData.products)
        } catch (e) { console.error(e) }
        finally { setLoading(false) }
    }

    async function handleSaveGlobal(e: React.FormEvent) {
        e.preventDefault()
        setSaving(true)
        try {
            await Promise.all(
                Object.entries(GLOBAL_KEYS).map(([type, key]) =>
                    updateCustomization(key, globalValues[key] || '')
                )
            )
            setSaved(true)
            setTimeout(() => setSaved(false), 2500)
        } catch (err: any) { alert(err.message) }
        finally { setSaving(false) }
    }

    function openCreateForm() {
        setEditingPixel(null)
        setForm({ name: '', type: 'taboola', pixelId: '', productIds: [] })
        setShowForm(true)
    }

    function openEditForm(pixel: Pixel) {
        setEditingPixel(pixel)
        setForm({
            name: pixel.name,
            type: pixel.type,
            pixelId: pixel.pixelId,
            productIds: pixel.products.map(p => p.id)
        })
        setShowForm(true)
    }

    async function handleSavePixel(e: React.FormEvent) {
        e.preventDefault()
        if (!form.name || !form.pixelId) {
            alert('Preencha o nome e o ID do pixel')
            return
        }

        setSaving(true)
        try {
            const url = '/api/admin/pixels'
            const method = editingPixel ? 'PUT' : 'POST'
            const body = editingPixel
                ? { id: editingPixel.id, ...form }
                : form

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            })

            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || 'Erro ao salvar pixel')
            }

            await loadAll()
            setShowForm(false)
            setEditingPixel(null)
        } catch (err: any) { alert(err.message) }
        finally { setSaving(false) }
    }

    async function handleDeletePixel(id: string) {
        if (!confirm('Tem certeza que deseja excluir este pixel?')) return

        try {
            const res = await fetch(`/api/admin/pixels?id=${id}`, { method: 'DELETE' })
            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || 'Erro ao deletar pixel')
            }
            setPixels(prev => prev.filter(p => p.id !== id))
        } catch (err: any) { alert(err.message) }
    }

    function toggleProduct(productId: string) {
        setForm(prev => ({
            ...prev,
            productIds: prev.productIds.includes(productId)
                ? prev.productIds.filter(id => id !== productId)
                : [...prev.productIds, productId]
        }))
    }

    function getTypeInfo(type: string) {
        return PIXEL_TYPES.find(t => t.value === type) || PIXEL_TYPES[0]
    }

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '40vh' }}>
                <Loader2 size={28} color="#0f172a" style={{ animation: 'spin 1s linear infinite' }} />
            </div>
        )
    }

    return (
        <div style={{ width: '100%', maxWidth: '900px', paddingBottom: '60px' }}>
            <style jsx>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

            {/* Header */}
            <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
                    Pixels de Marketing
                </h1>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#94a3b8', fontWeight: 500 }}>
                    Configure pixels globais ou por produto para rastrear conversões.
                </p>
            </div>

            {/* ── Pixels Globais ── */}
            <form onSubmit={handleSaveGlobal}>
                <div style={{
                    background: '#fff', borderRadius: '18px', border: '1px solid #f1f5f9',
                    padding: '24px', marginBottom: '24px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.02), 0 4px 12px rgba(0,0,0,0.03)',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                        <div style={{
                            width: '36px', height: '36px', borderRadius: '10px',
                            background: 'linear-gradient(135deg, #f0f4ff 0%, #e8ecf8 100%)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#6366f1',
                        }}>
                            <Target size={18} />
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>Pixels Globais</h3>
                            <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>Aplicados a TODOS os produtos (fallback)</p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                        {PIXELS.map(pixel => {
                            const key = GLOBAL_KEYS[pixel.value]
                            const hasValue = globalValues[key]?.trim()
                            return (
                                <div key={pixel.value} style={{
                                    background: '#fff', border: '1px solid #f1f5f9', borderRadius: '12px',
                                    padding: '14px',
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                        <div style={{
                                            width: '30px', height: '30px', borderRadius: '8px',
                                            background: hasValue ? pixel.color + '15' : '#f8fafc',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                            fontSize: '13px',
                                        }}>
                                            {hasValue ? <Check size={14} color={pixel.color} strokeWidth={3} /> : pixel.icon}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <p style={{ margin: 0, fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>{pixel.label}</p>
                                        </div>
                                        {hasValue && (
                                            <span style={{
                                                fontSize: '9px', fontWeight: 800, color: '#059669', background: '#d1fae5',
                                                padding: '2px 7px', borderRadius: '6px', textTransform: 'uppercase',
                                            }}>Ativo</span>
                                        )}
                                    </div>
                                    <input
                                        type="text"
                                        value={globalValues[key] || ''}
                                        onChange={e => setGlobalValues(prev => ({ ...prev, [key]: e.target.value }))}
                                        placeholder={pixel.placeholder}
                                        style={{
                                            width: '100%', padding: '9px 12px', borderRadius: '8px',
                                            border: '1px solid #e2e8f0', background: '#f8fafc',
                                            fontSize: '12px', color: '#0f172a', outline: 'none', fontWeight: 500,
                                        }}
                                        onFocus={e => { e.target.style.borderColor = '#0f172a'; e.target.style.background = '#fff' }}
                                        onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc' }}
                                    />
                                </div>
                            )
                        })}
                    </div>

                    <button type="submit" disabled={saving} style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '10px 20px', borderRadius: '10px', border: 'none',
                        background: saved ? '#059669' : '#0f172a', color: '#fff',
                        fontSize: '12px', fontWeight: 700,
                        cursor: saving ? 'wait' : 'pointer',
                    }}>
                        {saving ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : saved ? <Check size={14} /> : null}
                        {saving ? 'Salvando...' : saved ? 'Salvo!' : 'Salvar Globais'}
                    </button>
                </div>
            </form>

            {/* ── Pixels por Produto ── */}
            <div style={{
                background: '#fff', borderRadius: '18px', border: '1px solid #f1f5f9',
                padding: '24px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02), 0 4px 12px rgba(0,0,0,0.03)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                            width: '36px', height: '36px', borderRadius: '10px',
                            background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#d97706',
                        }}>
                            <Package size={18} />
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>Pixels por Produto</h3>
                            <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>Pixels específicos que só ativam em produtos escolhidos</p>
                        </div>
                    </div>
                    <button
                        onClick={openCreateForm}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            padding: '8px 16px', borderRadius: '10px', border: 'none',
                            background: '#6366f1', color: '#fff',
                            fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                        }}
                    >
                        <Plus size={14} /> Novo Pixel
                    </button>
                </div>

                {/* Lista de pixels por produto */}
                {pixels.length === 0 ? (
                    <div style={{
                        padding: '32px', textAlign: 'center',
                        background: '#f8fafc', borderRadius: '12px',
                        border: '1px dashed #e2e8f0',
                    }}>
                        <Target size={32} color="#cbd5e1" style={{ margin: '0 auto 12px' }} />
                        <p style={{ fontSize: '13px', fontWeight: 600, color: '#94a3b8', margin: '0 0 4px' }}>
                            Nenhum pixel por produto configurado
                        </p>
                        <p style={{ fontSize: '11px', color: '#cbd5e1', margin: 0 }}>
                            Crie um pixel e associe aos produtos desejados
                        </p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {pixels.map(pixel => {
                            const typeInfo = getTypeInfo(pixel.type)
                            const isExpanded = expandedPixel === pixel.id
                            return (
                                <div key={pixel.id} style={{
                                    background: '#fff', border: '1px solid #f1f5f9',
                                    borderRadius: '12px', overflow: 'hidden',
                                }}>
                                    <div style={{
                                        display: 'flex', alignItems: 'center', gap: '10px',
                                        padding: '14px 16px', cursor: 'pointer',
                                    }}
                                        onClick={() => setExpandedPixel(isExpanded ? null : pixel.id)}
                                    >
                                        <div style={{
                                            width: '32px', height: '32px', borderRadius: '8px',
                                            background: typeInfo.color + '15',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '14px', flexShrink: 0,
                                        }}>
                                            {typeInfo.icon}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                                                {pixel.name}
                                            </p>
                                            <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8', fontWeight: 500 }}>
                                                {typeInfo.label} · ID: {pixel.pixelId}
                                            </p>
                                        </div>
                                        <span style={{
                                            fontSize: '10px', fontWeight: 700, color: '#6366f1', background: '#eef2ff',
                                            padding: '3px 8px', borderRadius: '6px',
                                        }}>
                                            {pixel.products.length} produto{pixel.products.length !== 1 ? 's' : ''}
                                        </span>
                                        <div style={{ display: 'flex', gap: '4px' }}>
                                            <button
                                                onClick={e => { e.stopPropagation(); openEditForm(pixel) }}
                                                style={{
                                                    background: '#f1f5f9', border: 'none', width: '28px', height: '28px',
                                                    borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    color: '#64748b', cursor: 'pointer',
                                                }}
                                            >
                                                <Edit2 size={13} />
                                            </button>
                                            <button
                                                onClick={e => { e.stopPropagation(); handleDeletePixel(pixel.id) }}
                                                style={{
                                                    background: '#fef2f2', border: 'none', width: '28px', height: '28px',
                                                    borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    color: '#ef4444', cursor: 'pointer',
                                                }}
                                            >
                                                <Trash2 size={13} />
                                            </button>
                                        </div>
                                        {isExpanded ? <ChevronUp size={16} color="#94a3b8" /> : <ChevronDown size={16} color="#94a3b8" />}
                                    </div>

                                    {isExpanded && (
                                        <div style={{
                                            padding: '0 16px 14px',
                                            borderTop: '1px solid #f1f5f9',
                                        }}>
                                            <p style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', margin: '10px 0 8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                                Produtos associados
                                            </p>
                                            {pixel.products.length === 0 ? (
                                                <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0 }}>
                                                    Nenhum produto associado (pixel não será disparado)
                                                </p>
                                            ) : (
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                                    {pixel.products.map(p => (
                                                        <span key={p.id} style={{
                                                            fontSize: '11px', fontWeight: 600, color: '#475569', background: '#f1f5f9',
                                                            padding: '4px 10px', borderRadius: '6px',
                                                        }}>
                                                            {p.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* ── Modal de Criar/Editar Pixel ── */}
            {showForm && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 1000,
                    background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(6px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
                }}>
                    <div style={{
                        background: '#fff', borderRadius: '18px', width: '100%', maxWidth: '480px',
                        boxShadow: '0 24px 48px rgba(0,0,0,0.15)',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderBottom: '1px solid #f1f5f9' }}>
                            <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                                {editingPixel ? 'Editar Pixel' : 'Novo Pixel'}
                            </h2>
                            <button onClick={() => { setShowForm(false); setEditingPixel(null) }} style={{
                                background: '#f1f5f9', border: 'none', width: '30px', height: '30px',
                                borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: '#64748b', cursor: 'pointer',
                            }}>
                                <X size={16} />
                            </button>
                        </div>

                        <form onSubmit={handleSavePixel} style={{ padding: '20px' }}>
                            <div style={{ marginBottom: '14px' }}>
                                <label style={labelStyle}>Nome do Pixel</label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="Ex: Taboola Produto X"
                                    style={inputStyle}
                                    required
                                />
                            </div>

                            <div style={{ marginBottom: '14px' }}>
                                <label style={labelStyle}>Tipo</label>
                                <select
                                    value={form.type}
                                    onChange={e => setForm(prev => ({ ...prev, type: e.target.value }))}
                                    style={inputStyle}
                                >
                                    {PIXELS.map(t => (
                                        <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ marginBottom: '14px' }}>
                                <label style={labelStyle}>ID do Pixel</label>
                                <input
                                    type="text"
                                    value={form.pixelId}
                                    onChange={e => setForm(prev => ({ ...prev, pixelId: e.target.value }))}
                                    placeholder="Ex: 1234567"
                                    style={inputStyle}
                                    required
                                />
                            </div>

                            <div style={{ marginBottom: '20px' }}>
                                <label style={labelStyle}>Produtos</label>
                                <p style={{ fontSize: '11px', color: '#94a3b8', margin: '0 0 8px' }}>
                                    Selecione os produtos onde este pixel será ativado
                                </p>
                                <div style={{
                                    border: '1px solid #e2e8f0', borderRadius: '10px',
                                    maxHeight: '200px', overflow: 'auto',
                                }}>
                                    {products.length === 0 ? (
                                        <p style={{ padding: '12px', fontSize: '12px', color: '#94a3b8', textAlign: 'center' }}>
                                            Nenhum produto encontrado
                                        </p>
                                    ) : (
                                        products.map(p => (
                                            <label
                                                key={p.id}
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: '10px',
                                                    padding: '10px 14px', cursor: 'pointer',
                                                    borderBottom: '1px solid #f1f5f9',
                                                    background: form.productIds.includes(p.id) ? '#f0f4ff' : 'transparent',
                                                }}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={form.productIds.includes(p.id)}
                                                    onChange={() => toggleProduct(p.id)}
                                                    style={{ width: '16px', height: '16px', accentColor: '#6366f1' }}
                                                />
                                                <span style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a' }}>
                                                    {p.name}
                                                </span>
                                            </label>
                                        ))
                                    )}
                                </div>
                                {form.productIds.length > 0 && (
                                    <p style={{ fontSize: '11px', color: '#6366f1', margin: '6px 0 0', fontWeight: 600 }}>
                                        {form.productIds.length} produto{form.productIds.length !== 1 ? 's' : ''} selecionado{form.productIds.length !== 1 ? 's' : ''}
                                    </p>
                                )}
                            </div>

                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button type="button" onClick={() => { setShowForm(false); setEditingPixel(null) }} style={{
                                    flex: 1, padding: '11px', borderRadius: '10px', border: '1px solid #e2e8f0',
                                    background: '#fff', color: '#475569', fontWeight: 700, fontSize: '13px', cursor: 'pointer',
                                }}>Cancelar</button>
                                <button type="submit" disabled={saving} style={{
                                    flex: 1.5, padding: '11px', borderRadius: '10px', border: 'none',
                                    background: '#0f172a', color: '#fff', fontWeight: 700, fontSize: '13px',
                                    cursor: saving ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                }}>
                                    {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : null}
                                    {saving ? 'Salvando...' : editingPixel ? 'Atualizar' : 'Criar Pixel'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

const PIXELS = [
    { value: 'taboola', label: 'Taboola', placeholder: 'Ex: 1234567', color: '#0091ff', icon: '🔵' },
    { value: 'facebook', label: 'Facebook (Meta)', placeholder: 'Ex: 9876543210', color: '#1877f2', icon: '🔷' },
    { value: 'google', label: 'Google Ads', placeholder: 'Ex: AW-123456789', color: '#4285f4', icon: '🟢' },
    { value: 'ga', label: 'Google Analytics (GA4)', placeholder: 'Ex: G-XXXXXXXXXX', color: '#f59e0b', icon: '🟡' },
    { value: 'google_conv', label: 'Google Ads Conversion', placeholder: 'Ex: AbCdEfGhIjKlMnO', color: '#34a853', icon: '🟢' },
]

const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: '10px',
    border: '1px solid #e2e8f0', background: '#f8fafc',
    fontSize: '13px', color: '#0f172a', outline: 'none', fontWeight: 500,
}

const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '11px', fontWeight: 700, color: '#64748b',
    marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em',
}
