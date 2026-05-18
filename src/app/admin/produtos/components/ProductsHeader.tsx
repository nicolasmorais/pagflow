'use client'

import React, { useState } from 'react'
import { Plus, Loader2 } from 'lucide-react'
import { createProduct } from '@/app/actions'

export default function ProductsHeader({ productCount }: { productCount: number }) {
    const [loading, setLoading] = useState(false)
    const [name, setName] = useState('')
    const [price, setPrice] = useState('')

    async function handleQuickCreate(e: React.FormEvent) {
        e.preventDefault()
        if (!name.trim() || !price.trim()) return
        setLoading(true)
        try {
            const formData = new FormData()
            formData.append('name', name.trim())
            formData.append('price', price.replace(',', '.'))
            formData.append('cost', '0')
            formData.append('imageUrl', '')
            await createProduct(formData)
            setName('')
            setPrice('')
            window.location.reload()
        } catch (err: any) {
            alert('Erro: ' + err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                    <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>Produtos</h1>
                    <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#94a3b8', fontWeight: 500 }}>{productCount} produtos cadastrados</p>
                </div>
            </div>

            {/* Quick Create Bar */}
            <form onSubmit={handleQuickCreate} style={{
                display: 'flex', gap: '10px', alignItems: 'center',
                background: '#fff', border: '1px solid #f1f5f9', borderRadius: '14px',
                padding: '10px 12px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}>
                <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Nome do produto"
                    required
                    style={{
                        flex: 2, padding: '10px 14px', borderRadius: '10px',
                        border: '1px solid #e2e8f0', background: '#f8fafc',
                        fontSize: '13px', color: '#0f172a', outline: 'none',
                        fontWeight: 500,
                    }}
                />
                <div style={{ position: 'relative', flex: 1 }}>
                    <span style={{
                        position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
                        fontSize: '13px', color: '#94a3b8', fontWeight: 700,
                    }}>R$</span>
                    <input
                        type="text"
                        value={price}
                        onChange={e => setPrice(e.target.value)}
                        placeholder="0,00"
                        required
                        style={{
                            width: '100%', padding: '10px 14px 10px 36px', borderRadius: '10px',
                            border: '1px solid #e2e8f0', background: '#f8fafc',
                            fontSize: '13px', color: '#0f172a', outline: 'none',
                            fontWeight: 600,
                        }}
                    />
                </div>
                <button
                    type="submit"
                    disabled={loading || !name.trim() || !price.trim()}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        padding: '10px 20px', borderRadius: '10px',
                        border: 'none', background: '#0f172a', color: '#fff',
                        fontSize: '13px', fontWeight: 700, cursor: loading ? 'wait' : 'pointer',
                        opacity: (!name.trim() || !price.trim()) ? 0.4 : 1,
                        transition: 'all 0.15s', whiteSpace: 'nowrap',
                    }}
                >
                    {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Plus size={16} />}
                    Criar
                </button>
            </form>

            <style jsx>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                input:focus { border-color: #0f172a !important; background: #fff !important; }
            `}</style>
        </div>
    )
}
