'use client'

import React, { useState } from 'react'
import { X, Edit, Package, DollarSign, Image as ImageIcon, Percent, Loader2, Save } from 'lucide-react'
import { updateProduct } from '../../../actions'

interface EditProductModalProps {
    product: any
    onClose: () => void
}

export default function EditProductModal({ product, onClose }: EditProductModalProps) {
    const [loading, setLoading] = useState(false)

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        setLoading(true)
        const formData = new FormData(e.currentTarget)
        try {
            await updateProduct(formData)
            alert('Produto atualizado!')
            window.location.reload()
            onClose()
        } catch (error: any) {
            alert('Erro ao editar: ' + error.message)
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
        }}>
            <div style={{
                background: '#fff',
                borderRadius: '24px',
                width: '100%',
                maxWidth: '500px',
                padding: '32px',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                position: 'relative',
                animation: 'modalSlideUp 0.3s ease-out'
            }}>
                <style jsx>{`
                    @keyframes modalSlideUp {
                        from { transform: translateY(20px); opacity: 0; }
                        to { transform: translateY(0); opacity: 1; }
                    }
                    .form-group {
                        margin-bottom: 20px;
                    }
                    .form-label {
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        font-size: 13px;
                        font-weight: 700;
                        color: #475569;
                        margin-bottom: 8px;
                    }
                    .form-input {
                        width: 100%;
                        padding: 12px 16px;
                        border-radius: 12px;
                        border: 1px solid #e2e8f0;
                        background: #f8fafc;
                        font-size: 14px;
                        color: #1e293b;
                        transition: all 0.2s;
                        outline: none;
                    }
                    .form-input:focus {
                        border-color: #3b82f6;
                        background: #fff;
                        box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
                    }
                `}</style>

                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '24px',
                        right: '24px',
                        background: '#f1f5f9',
                        border: 'none',
                        borderRadius: '50%',
                        width: '32px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#64748b',
                        cursor: 'pointer'
                    }}
                >
                    <X size={18} />
                </button>

                <header style={{ marginBottom: '32px' }}>
                    <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '14px',
                        background: '#eff6ff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#3b82f6',
                        marginBottom: '16px'
                    }}>
                        <Edit size={24} />
                    </div>
                    <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#1e293b', margin: 0 }}>Editar Produto</h2>
                    <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>
                        Atualize as informações do produto selecionado.
                    </p>
                </header>

                <form onSubmit={handleSubmit}>
                    <input type="hidden" name="id" defaultValue={String(product.id)} />


                    <div className="form-group">
                        <label className="form-label">
                            <Package size={14} /> Nome do Produto
                        </label>
                        <input
                            name="name"
                            type="text"
                            className="form-input"
                            defaultValue={product.name}
                            required
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div className="form-group">
                            <label className="form-label">
                                <DollarSign size={14} /> Preço (R$)
                            </label>
                            <input
                                name="price"
                                type="number"
                                step="0.01"
                                className="form-input"
                                defaultValue={product.price}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">
                                <DollarSign size={14} /> Custo unitário (R$)
                            </label>
                            <input
                                name="cost"
                                type="number"
                                step="0.01"
                                className="form-input"
                                defaultValue={product.cost || 0}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">
                            <ImageIcon size={14} /> URL da Imagem
                        </label>
                        <input
                            name="imageUrl"
                            type="url"
                            className="form-input"
                            defaultValue={product.imageUrl || ''}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                flex: 1,
                                padding: '14px',
                                borderRadius: '14px',
                                border: '1px solid #e2e8f0',
                                background: '#fff',
                                color: '#475569',
                                fontWeight: 700,
                                cursor: 'pointer'
                            }}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                flex: 1.5,
                                padding: '14px',
                                borderRadius: '14px',
                                border: 'none',
                                background: '#3b82f6',
                                color: '#fff',
                                fontWeight: 700,
                                cursor: loading ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.2)'
                            }}
                        >
                            {loading ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                            {loading ? 'Salvando...' : 'Salvar Alterações'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
