'use client'

import React, { useState } from 'react'
import { Plus, X, Trash2, Package, Tag, Loader2, Zap, DollarSign, ShoppingBag } from 'lucide-react'
import { createOrderBump, deleteOrderBump, toggleOrderBump } from '@/app/actions'

export default function OrdemClient({ products, bumps }: { products: any[], bumps: any[] }) {
    const [showModal, setShowModal] = useState(false)
    const [saving, setSaving] = useState(false)
    const [toggling, setToggling] = useState<string | null>(null)

    async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setSaving(true)
        try {
            await createOrderBump(new FormData(e.currentTarget))
            setShowModal(false)
            window.location.reload()
        } catch (err: any) { alert(err.message) }
        finally { setSaving(false) }
    }

    async function handleToggle(id: string, isActive: boolean) {
        setToggling(id)
        try { await toggleOrderBump(id, isActive) } catch {}
        finally { setToggling(null) }
    }

    async function handleDelete(id: string) {
        if (!confirm('Excluir este order bump?')) return
        try { await deleteOrderBump(id); window.location.reload() } catch (err: any) { alert(err.message) }
    }

    return (
        <div style={{ width: '100%', paddingBottom: '60px' }}>
            {/* Header */}
            <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                        <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>Order Bumps</h1>
                        <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#94a3b8', fontWeight: 500 }}>{bumps.length} bumps cadastrados</p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            padding: '10px 20px', borderRadius: '10px', border: 'none',
                            background: '#0f172a', color: '#fff', fontSize: '13px', fontWeight: 700,
                            cursor: 'pointer', transition: 'all 0.15s',
                        }}
                    >
                        <Plus size={16} /> Novo Bump
                    </button>
                </div>
            </div>

            {/* Bumps Grid */}
            {bumps.length === 0 ? (
                <div style={{
                    background: '#fff', border: '1px solid #f1f5f9', borderRadius: '18px',
                    padding: '80px 40px', textAlign: 'center',
                }}>
                    <div style={{ width: '72px', height: '72px', background: '#f8fafc', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                        <Zap size={32} color="#cbd5e1" />
                    </div>
                    <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1e293b', margin: '0 0 8px' }}>Nenhum order bump</h3>
                    <p style={{ color: '#94a3b8', fontSize: '14px', margin: '0 0 20px' }}>Crie ofertas rápidas para aumentar o ticket médio.</p>
                    <button onClick={() => setShowModal(true)} style={{
                        padding: '10px 24px', borderRadius: '10px', border: 'none',
                        background: '#0f172a', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer',
                    }}>
                        <Plus size={16} style={{ display: 'inline', verticalAlign: '-3px', marginRight: '6px' }} />
                        Criar primeiro bump
                    </button>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '12px' }}>
                    {bumps.map((bump: any) => (
                        <div key={bump.id} style={{
                            background: '#fff', border: '1px solid #f1f5f9', borderRadius: '14px',
                            overflow: 'hidden', transition: 'all 0.2s', opacity: bump.isActive ? 1 : 0.6,
                        }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.06)' }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = '#f1f5f9'; e.currentTarget.style.boxShadow = 'none' }}
                        >
                            {/* Image */}
                            <div style={{ height: '120px', background: '#f8fafc', overflow: 'hidden', position: 'relative' }}>
                                {bump.imageUrl ? (
                                    <img src={bump.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Package size={32} color="#e2e8f0" />
                                    </div>
                                )}
                                {/* Badge */}
                                <span style={{
                                    position: 'absolute', top: '10px', right: '10px',
                                    fontSize: '10px', fontWeight: 800, padding: '3px 8px', borderRadius: '6px',
                                    background: bump.isActive ? '#d1fae5' : '#f1f5f9',
                                    color: bump.isActive ? '#065f46' : '#64748b',
                                    border: `1px solid ${bump.isActive ? '#6ee7b7' : '#e2e8f0'}`,
                                }}>
                                    {bump.isActive ? 'Ativo' : 'Pausado'}
                                </span>
                            </div>

                            {/* Content */}
                            <div style={{ padding: '14px 16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                                    <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, marginRight: '10px' }}>
                                        {bump.name}
                                    </h4>
                                    <span style={{ fontSize: '16px', fontWeight: 900, color: '#0f172a', flexShrink: 0 }}>
                                        R$ {bump.price.toFixed(2)}
                                    </span>
                                </div>

                                <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 10px', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {bump.description}
                                </p>

                                {/* Linked Product */}
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: '6px',
                                    background: '#f8fafc', borderRadius: '8px', padding: '8px 10px', marginBottom: '12px',
                                }}>
                                    <Tag size={12} color="#94a3b8" />
                                    <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {bump.product ? bump.product.name : 'Global (Todos)'}
                                    </span>
                                </div>

                                {/* Actions */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {/* Toggle */}
                                    <button
                                        onClick={() => handleToggle(bump.id, !bump.isActive)}
                                        disabled={toggling === bump.id}
                                        style={{
                                            width: '40px', height: '22px', borderRadius: '22px', border: 'none', cursor: 'pointer',
                                            background: bump.isActive ? '#10b981' : '#cbd5e1', position: 'relative', transition: '0.2s',
                                            opacity: toggling === bump.id ? 0.5 : 1,
                                        }}
                                    >
                                        <span style={{
                                            position: 'absolute', height: '16px', width: '16px',
                                            left: bump.isActive ? '21px' : '3px', top: '3px',
                                            background: '#fff', borderRadius: '50%', transition: '0.2s',
                                        }} />
                                    </button>

                                    <span style={{ flex: 1 }} />

                                    <button onClick={() => handleDelete(bump.id)} style={{
                                        width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #fee2e2',
                                        background: '#fff', color: '#ef4444', cursor: 'pointer', display: 'flex',
                                        alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s',
                                    }}
                                        onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2' }}
                                        onMouseLeave={e => { e.currentTarget.style.background = '#fff' }}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 1000,
                    background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(6px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
                }} onClick={() => setShowModal(false)}>
                    <div style={{
                        background: '#fff', borderRadius: '18px', width: '100%', maxWidth: '440px',
                        boxShadow: '0 24px 48px rgba(0,0,0,0.15)',
                    }} onClick={e => e.stopPropagation()}>
                        {/* Header */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderBottom: '1px solid #f1f5f9' }}>
                            <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>Novo Order Bump</h2>
                            <button onClick={() => setShowModal(false)} style={{ background: '#f1f5f9', border: 'none', width: '30px', height: '30px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', cursor: 'pointer' }}>
                                <X size={16} />
                            </button>
                        </div>

                        <form onSubmit={handleCreate} style={{ padding: '20px' }}>
                            <div style={{ marginBottom: '14px' }}>
                                <label style={lbl}><Zap size={12} /> Nome da Oferta</label>
                                <input name="name" type="text" style={inp} placeholder="Ex: Leve +1 com 50% OFF" required />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                                <div>
                                    <label style={lbl}><DollarSign size={12} /> Preço (R$)</label>
                                    <input name="price" type="number" step="0.01" style={inp} placeholder="0.00" required />
                                </div>
                                <div>
                                    <label style={lbl}><ShoppingBag size={12} /> Produto</label>
                                    <select name="productId" style={inp}>
                                        <option value="global">Todos (Global)</option>
                                        {products.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div style={{ marginBottom: '14px' }}>
                                <label style={lbl}>Descrição</label>
                                <input name="description" type="text" style={inp} placeholder="Frase de impacto" required />
                            </div>

                            <div style={{ marginBottom: '20px' }}>
                                <label style={lbl}>Imagem (URL)</label>
                                <input name="imageUrl" type="url" style={inp} placeholder="https://..." />
                            </div>

                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button type="button" onClick={() => setShowModal(false)} style={{
                                    flex: 1, padding: '11px', borderRadius: '10px', border: '1px solid #e2e8f0',
                                    background: '#fff', color: '#475569', fontWeight: 700, fontSize: '13px', cursor: 'pointer',
                                }}>Cancelar</button>
                                <button type="submit" disabled={saving} style={{
                                    flex: 1.5, padding: '11px', borderRadius: '10px', border: 'none',
                                    background: '#0f172a', color: '#fff', fontWeight: 700, fontSize: '13px',
                                    cursor: saving ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                }}>
                                    {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Plus size={16} />}
                                    {saving ? 'Criando...' : 'Criar Bump'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style jsx>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                input:focus, select:focus { border-color: #0f172a !important; background: #fff !important; }
            `}</style>
        </div>
    )
}

const inp: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: '10px',
    border: '1px solid #e2e8f0', background: '#f8fafc',
    fontSize: '13px', color: '#0f172a', outline: 'none', fontWeight: 500,
}

const lbl: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: '6px',
    fontSize: '11px', fontWeight: 700, color: '#64748b',
    marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em',
}
