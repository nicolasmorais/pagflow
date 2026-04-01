export const dynamic = 'force-dynamic';
'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Trash2, Edit2, CheckCircle2, AlertCircle, Loader2, Truck, DollarSign, Clock } from 'lucide-react'
import { getShippingRules, createShippingRule, updateShippingRule, deleteShippingRule, setupInitialShipping } from '@/app/actions'

export default function EcommercePage() {
    const [rules, setRules] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [isEditing, setIsEditing] = useState<string | null>(null)
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null)

    // Form states
    const [name, setName] = useState('')
    const [price, setPrice] = useState('0')
    const [deliveryTime, setDeliveryTime] = useState('')

    useEffect(() => {
        loadRules()
    }, [])

    async function loadRules() {
        setLoading(true)
        try {
            const data = await getShippingRules()
            if (data.length === 0) {
                // If no rules, try to setup initial ones
                await setupInitialShipping()
                const seeded = await getShippingRules()
                setRules(seeded)
            } else {
                setRules(data)
            }
        } catch (error) {
            console.error('Error loading rules:', error)
        } finally {
            setLoading(false)
        }
    }

    const resetForm = () => {
        setName('')
        setPrice('0')
        setDeliveryTime('')
        setIsEditing(null)
    }

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        setStatus(null)

        try {
            if (isEditing) {
                await updateShippingRule(isEditing, {
                    name,
                    price: parseFloat(price),
                    delivery_time: deliveryTime,
                    is_active: true
                })
                setStatus({ type: 'success', message: 'Frete atualizado com sucesso!' })
            } else {
                await createShippingRule({
                    name,
                    price: parseFloat(price),
                    delivery_time: deliveryTime
                })
                setStatus({ type: 'success', message: 'Novo frete criado com sucesso!' })
            }
            resetForm()
            await loadRules()
            setTimeout(() => setStatus(null), 3000)
        } catch (error: any) {
            setStatus({ type: 'error', message: error.message || 'Erro ao salvar frete' })
        } finally {
            setSaving(false)
        }
    }

    const handleEdit = (rule: any) => {
        setIsEditing(rule.id)
        setName(rule.name)
        setPrice(rule.price.toString())
        setDeliveryTime(rule.delivery_time || '')
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir esta opção de frete?')) return

        try {
            await deleteShippingRule(id)
            setStatus({ type: 'success', message: 'Frete excluído com sucesso!' })
            await loadRules()
        } catch (error: any) {
            setStatus({ type: 'error', message: error.message || 'Erro ao excluir frete' })
        }
    }

    if (loading && rules.length === 0) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <Loader2 className="animate-spin" size={32} color="#4f46e5" />
            </div>
        )
    }

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px 0' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '32px' }}>

                {/* Form Section */}
                <div>
                    <div style={{
                        background: '#fff',
                        borderRadius: '20px',
                        padding: '32px',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                        position: 'sticky',
                        top: '20px'
                    }}>
                        <header style={{ marginBottom: '24px' }}>
                            <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Trash2 size={20} color="#4f46e5" />
                                {isEditing ? 'Editar Frete' : 'Novo Frete'}
                            </h2>
                        </header>

                        <form onSubmit={handleSave}>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Nome do Frete *</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Ex: Entrega Expressa"
                                    required
                                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none' }}
                                />
                            </div>

                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Preço (R$) *</label>
                                <div style={{ position: 'relative' }}>
                                    <div style={{ position: 'absolute', left: '12px', top: '12px', color: '#94a3b8' }}>R$</div>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={price}
                                        onChange={(e) => setPrice(e.target.value)}
                                        required
                                        style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none' }}
                                    />
                                </div>
                            </div>

                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Tempo Estimado</label>
                                <input
                                    type="text"
                                    value={deliveryTime}
                                    onChange={(e) => setDeliveryTime(e.target.value)}
                                    placeholder="Ex: 2 a 5 dias úteis"
                                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none' }}
                                />
                            </div>

                            {status && (
                                <div style={{
                                    padding: '12px',
                                    borderRadius: '10px',
                                    marginBottom: '20px',
                                    fontSize: '13px',
                                    background: status.type === 'success' ? '#f0fdf4' : '#fef2f2',
                                    color: status.type === 'success' ? '#16a34a' : '#dc2626',
                                    border: `1px solid ${status.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}>
                                    {status.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                                    {status.message}
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    style={{
                                        flex: 2,
                                        padding: '12px',
                                        background: '#4f46e5',
                                        color: '#fff',
                                        borderRadius: '10px',
                                        border: 'none',
                                        fontWeight: '600',
                                        cursor: saving ? 'not-allowed' : 'pointer',
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        gap: '8px'
                                    }}
                                >
                                    {saving ? <Loader2 className="animate-spin" size={18} /> : isEditing ? 'Atualizar' : 'Salvar Frete'}
                                </button>
                                {isEditing && (
                                    <button
                                        type="button"
                                        onClick={resetForm}
                                        style={{
                                            flex: 1,
                                            padding: '12px',
                                            background: '#f1f5f9',
                                            color: '#475569',
                                            borderRadius: '10px',
                                            border: 'none',
                                            fontWeight: '600',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Cancelar
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>

                {/* List Section */}
                <div>
                    <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        Opções de Frete Ativas
                        <span style={{ fontSize: '12px', fontWeight: '500', padding: '2px 8px', background: '#e0e7ff', color: '#4338ca', borderRadius: '12px' }}>{rules.length}</span>
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {rules.map((rule) => (
                            <div key={rule.id} style={{
                                background: '#fff',
                                padding: '20px',
                                borderRadius: '16px',
                                border: '1px solid #e2e8f0',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                transition: 'all 0.2s'
                            }}>
                                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Truck size={20} color="#64748b" />
                                    </div>
                                    <div>
                                        <h4 style={{ fontSize: '15px', fontWeight: '600', color: '#1e293b', margin: 0 }}>{rule.name}</h4>
                                        <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
                                            <span style={{ fontSize: '13px', color: '#22c55e', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <DollarSign size={14} />
                                                {parseFloat(rule.price) === 0 ? 'Grátis' : `R$ ${parseFloat(rule.price).toFixed(2).replace('.', ',')}`}
                                            </span>
                                            <span style={{ fontSize: '13px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Clock size={14} />
                                                {rule.delivery_time}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                        onClick={() => handleEdit(rule)}
                                        style={{ padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', color: '#64748b' }}
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(rule.id)}
                                        style={{ padding: '8px', borderRadius: '8px', border: '1px solid #fecaca', background: '#fff', cursor: 'pointer', color: '#ef4444' }}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}

                        {rules.length === 0 && !loading && (
                            <div style={{ padding: '40px', textAlign: 'center', background: '#f8fafc', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
                                <Truck size={32} color="#94a3b8" style={{ margin: '0 auto 12px' }} />
                                <p style={{ color: '#64748b', fontSize: '14px' }}>Nenhuma regra de frete configurada.</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    )
}
