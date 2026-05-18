'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Trash2, Edit2, Check, X, Loader2, Truck, Clock, Package } from 'lucide-react'
import { getShippingRules, createShippingRule, updateShippingRule, deleteShippingRule, setupInitialShipping } from '@/app/actions'

export default function EcommercePage() {
    const [rules, setRules] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)

    // Quick create
    const [qName, setQName] = useState('')
    const [qPrice, setQPrice] = useState('')
    const [qTime, setQTime] = useState('')

    // Edit form
    const [eName, setEName] = useState('')
    const [ePrice, setEPrice] = useState('')
    const [eTime, setETime] = useState('')

    useEffect(() => { loadRules() }, [])

    async function loadRules() {
        setLoading(true)
        try {
            let data = await getShippingRules()
            if (data.length === 0) {
                await setupInitialShipping()
                data = await getShippingRules()
            }
            setRules(data)
        } catch (e) { console.error(e) }
        finally { setLoading(false) }
    }

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault()
        if (!qName.trim() || !qPrice.trim()) return
        setSaving(true)
        try {
            await createShippingRule({ name: qName.trim(), price: parseFloat(qPrice.replace(',', '.')), delivery_time: qTime.trim() || 'A definir' })
            setQName(''); setQPrice(''); setQTime('')
            await loadRules()
        } catch (err: any) { alert(err.message) }
        finally { setSaving(false) }
    }

    function startEdit(rule: any) {
        setEditingId(rule.id)
        setEName(rule.name)
        setEPrice(rule.price.toString())
        setETime(rule.delivery_time || '')
    }

    async function handleUpdate() {
        if (!editingId || !eName.trim()) return
        setSaving(true)
        try {
            await updateShippingRule(editingId, { name: eName.trim(), price: parseFloat(ePrice.replace(',', '.')), delivery_time: eTime.trim(), is_active: true })
            setEditingId(null)
            await loadRules()
        } catch (err: any) { alert(err.message) }
        finally { setSaving(false) }
    }

    async function handleDelete(id: string) {
        if (!confirm('Excluir esta opção de frete?')) return
        try { await deleteShippingRule(id); await loadRules() } catch (err: any) { alert(err.message) }
    }

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '40vh' }}>
                <Loader2 size={28} color="#0f172a" style={{ animation: 'spin 1s linear infinite' }} />
            </div>
        )
    }

    return (
        <div style={{ width: '100%', paddingBottom: '60px' }}>
            <style jsx>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

            {/* Header */}
            <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                        <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>Frete</h1>
                        <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#94a3b8', fontWeight: 500 }}>{rules.length} opções configuradas</p>
                    </div>
                </div>

                {/* Quick Create */}
                <form onSubmit={handleCreate} style={{
                    display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap',
                    background: '#fff', border: '1px solid #f1f5f9', borderRadius: '14px',
                    padding: '10px 12px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                }}>
                    <input value={qName} onChange={e => setQName(e.target.value)} placeholder="Nome do frete" required
                        style={{ flex: '1 1 160px', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '13px', color: '#0f172a', outline: 'none', fontWeight: 500 }} />
                    <div style={{ position: 'relative', flex: '0 1 120px' }}>
                        <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px', color: '#94a3b8', fontWeight: 700 }}>R$</span>
                        <input value={qPrice} onChange={e => setQPrice(e.target.value)} placeholder="0,00" required
                            style={{ width: '100%', padding: '10px 14px 10px 36px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '13px', color: '#0f172a', outline: 'none', fontWeight: 600 }} />
                    </div>
                    <input value={qTime} onChange={e => setQTime(e.target.value)} placeholder="Prazo (ex: 5 dias)"
                        style={{ flex: '1 1 140px', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '13px', color: '#0f172a', outline: 'none', fontWeight: 500 }} />
                    <button type="submit" disabled={saving || !qName.trim() || !qPrice.trim()}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            padding: '10px 20px', borderRadius: '10px', border: 'none',
                            background: '#0f172a', color: '#fff', fontSize: '13px', fontWeight: 700,
                            cursor: saving ? 'wait' : 'pointer', opacity: (!qName.trim() || !qPrice.trim()) ? 0.4 : 1,
                            whiteSpace: 'nowrap', transition: 'all 0.15s',
                        }}>
                        {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Plus size={16} />}
                        Criar
                    </button>
                </form>
            </div>

            {/* List */}
            {rules.length === 0 ? (
                <div style={{
                    background: '#fff', border: '1px solid #f1f5f9', borderRadius: '18px',
                    padding: '60px 40px', textAlign: 'center',
                }}>
                    <div style={{ width: '64px', height: '64px', background: '#f8fafc', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                        <Package size={28} color="#cbd5e1" />
                    </div>
                    <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1e293b', margin: '0 0 8px' }}>Nenhum frete configurado</h3>
                    <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>Use o campo acima para criar sua primeira opção.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {rules.map(rule => {
                        const isEditing = editingId === rule.id
                        return (
                            <div key={rule.id} style={{
                                background: '#fff', border: isEditing ? '1px solid #0f172a' : '1px solid #f1f5f9',
                                borderRadius: '14px', padding: isEditing ? '16px' : '14px 16px',
                                transition: 'all 0.15s',
                            }}>
                                {isEditing ? (
                                    /* Edit Mode */
                                    <div>
                                        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
                                            <input value={eName} onChange={e => setEName(e.target.value)} placeholder="Nome"
                                                style={{ flex: '1 1 160px', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '13px', color: '#0f172a', outline: 'none', fontWeight: 500 }} />
                                            <div style={{ position: 'relative', flex: '0 1 120px' }}>
                                                <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px', color: '#94a3b8', fontWeight: 700 }}>R$</span>
                                                <input value={ePrice} onChange={e => setEPrice(e.target.value)} placeholder="0,00"
                                                    style={{ width: '100%', padding: '10px 14px 10px 36px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '13px', color: '#0f172a', outline: 'none', fontWeight: 600 }} />
                                            </div>
                                            <input value={eTime} onChange={e => setETime(e.target.value)} placeholder="Prazo"
                                                style={{ flex: '1 1 140px', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '13px', color: '#0f172a', outline: 'none', fontWeight: 500 }} />
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                            <button onClick={() => setEditingId(null)} style={{
                                                padding: '8px 16px', borderRadius: '8px', border: '1px solid #e2e8f0',
                                                background: '#fff', color: '#475569', fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                                            }}>Cancelar</button>
                                            <button onClick={handleUpdate} disabled={saving} style={{
                                                padding: '8px 16px', borderRadius: '8px', border: 'none',
                                                background: '#0f172a', color: '#fff', fontSize: '12px', fontWeight: 700,
                                                cursor: saving ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: '5px',
                                            }}>
                                                {saving ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={14} />}
                                                Salvar
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    /* View Mode */
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
                                            <div style={{
                                                width: '38px', height: '38px', borderRadius: '10px',
                                                background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                            }}>
                                                <Truck size={18} color="#64748b" />
                                            </div>
                                            <div style={{ minWidth: 0 }}>
                                                <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{rule.name}</h4>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '2px' }}>
                                                    <span style={{ fontSize: '12px', fontWeight: 800, color: parseFloat(rule.price) === 0 ? '#059669' : '#0f172a' }}>
                                                        {parseFloat(rule.price) === 0 ? 'Grátis' : `R$ ${parseFloat(rule.price).toFixed(2).replace('.', ',')}`}
                                                    </span>
                                                    {rule.delivery_time && (
                                                        <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
                                                            <Clock size={11} /> {rule.delivery_time}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                                            <button onClick={() => startEdit(rule)} style={{
                                                width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #e2e8f0',
                                                background: '#fff', color: '#64748b', cursor: 'pointer', display: 'flex',
                                                alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s',
                                            }}
                                                onMouseEnter={e => { e.currentTarget.style.borderColor = '#0f172a'; e.currentTarget.style.color = '#0f172a' }}
                                                onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#64748b' }}
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                            <button onClick={() => handleDelete(rule.id)} style={{
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
                                )}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
