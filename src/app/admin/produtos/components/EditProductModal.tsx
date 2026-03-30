'use client'

import React from 'react'
import { X } from 'lucide-react'
import { updateProduct } from '../../../actions'

interface EditProductModalProps {
    product: any
    onClose: () => void
}

export default function EditProductModal({ product, onClose }: EditProductModalProps) {
    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(4px)'
        }}>
            <div className="glass-card" style={{ width: '100%', maxWidth: '500px', margin: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Editar Produto</h2>
                    <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--admin-text-secondary)' }}>
                        <X size={24} />
                    </button>
                </div>

                <form action={async (formData) => {
                    await updateProduct(formData)
                    onClose()
                }} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <input type="hidden" name="id" value={product.id} />

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--admin-text-secondary)' }}>NOME DO PRODUTO</label>
                        <input
                            name="name"
                            type="text"
                            className="input-field"
                            defaultValue={product.name}
                            style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#000' }}
                            required
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--admin-text-secondary)' }}>PREÇO (R$)</label>
                            <input
                                name="price"
                                type="number"
                                step="0.01"
                                className="input-field"
                                defaultValue={product.price}
                                style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#000' }}
                                required
                            />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--admin-text-secondary)' }}>COMISSÃO (R$)</label>
                            <input
                                name="commission"
                                type="number"
                                step="0.01"
                                className="input-field"
                                defaultValue={product.commission || 0}
                                style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#000' }}
                                required
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--admin-text-secondary)' }}>URL DA FOTO</label>
                        <input
                            name="imageUrl"
                            type="url"
                            className="input-field"
                            defaultValue={product.imageUrl || ''}
                            style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#000' }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                        <button type="button" onClick={onClose} className="btn-secondary" style={{ flex: 1 }}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn-primary" style={{ flex: 1, background: '#3b82f6' }}>
                            Salvar Alterações
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
