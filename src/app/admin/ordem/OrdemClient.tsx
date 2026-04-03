'use client'

import React, { useState } from 'react'
import { Plus, X, Tag, Package, Trash2, ShoppingCart, Info } from 'lucide-react'
import { createOrderBump, deleteOrderBump, toggleOrderBump } from '@/app/actions'

export default function OrdemClient({ products, bumps }: { products: any[], bumps: any[] }) {
    const [isModalOpen, setIsModalOpen] = useState(false)

    return (
        <div style={{ width: '100%' }}>
            {/* Header section with Create Button */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '2.5rem',
                gap: '1.5rem',
                width: '100%'
            }}>
                <div>
                    <h2 className="title" style={{ fontSize: '1.85rem', marginBottom: '8px', color: '#060b26' }}>Order Bumps</h2>
                    <p className="subtitle" style={{ fontSize: '0.95rem', color: '#64748b' }}>Aumente o ticket médio do seu checkout com ofertas rápidas e irresistíveis.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="btn-primary"
                    style={{
                        background: '#0075ff',
                        color: 'white',
                        border: 'none',
                        padding: '14px 28px',
                        borderRadius: '16px',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        cursor: 'pointer',
                        boxShadow: '0 8px 16px rgba(0, 117, 255, 0.15)',
                        transition: 'transform 0.2s',
                        whiteSpace: 'nowrap',
                        width: 'fit-content'
                    }}
                >
                    <Plus size={20} strokeWidth={3} />
                    Novo Order Bump
                </button>
            </div>

            {/* Bumps List */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                {bumps.length === 0 ? (
                    <div className="glass-card" style={{
                        gridColumn: '1 / -1',
                        textAlign: 'center',
                        padding: '4rem 2rem',
                        background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
                        border: '1px dashed #e2e8f0 !important',
                        maxWidth: '600px',
                        margin: '0 auto'
                    }}>
                        <div style={{
                            width: '64px',
                            height: '64px',
                            background: '#eff6ff',
                            borderRadius: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 1.5rem'
                        }}>
                            <ShoppingCart size={28} color="#0075ff" />
                        </div>
                        <h3 style={{ fontWeight: 800, color: '#1e293b', marginBottom: '10px', fontSize: '1.1rem' }}>Sua lista de bumps está vazia</h3>
                        <p style={{ color: '#64748b', fontSize: '0.9rem', maxWidth: '350px', margin: '0 auto 1.75rem', lineHeight: '1.6' }}>
                            Comece a criar ofertas agora e veja seu faturamento aumentar automaticamente no checkout.
                        </p>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="btn-primary"
                            style={{
                                background: '#0075ff',
                                color: 'white',
                                border: 'none',
                                padding: '12px 24px',
                                borderRadius: '14px',
                                fontWeight: 800,
                                cursor: 'pointer',
                                fontSize: '0.875rem'
                            }}
                        >
                            Criar meu primeiro bump
                        </button>
                    </div>
                ) : (
                    bumps.map((bump: any) => (
                        <div key={bump.id} className="glass-card bump-card" style={{
                            padding: '1.5rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1rem',
                            position: 'relative',
                            transition: 'all 0.3s ease',
                            cursor: 'default',
                            opacity: bump.isActive ? 1 : 0.7,
                            filter: bump.isActive ? 'none' : 'grayscale(0.5)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                                <div style={{
                                    width: '70px',
                                    height: '70px',
                                    borderRadius: '16px',
                                    overflow: 'hidden',
                                    background: '#f1f5f9',
                                    flexShrink: 0
                                }}>
                                    {bump.imageUrl ? (
                                        <img src={bump.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Package size={24} color="#cbd5e1" />
                                        </div>
                                    )}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <h4 style={{ fontWeight: 800, color: '#1e293b', fontSize: '1rem', lineHeight: '1.2' }}>{bump.name}</h4>
                                                <div style={{
                                                    padding: '2px 8px',
                                                    borderRadius: '6px',
                                                    fontSize: '0.65rem',
                                                    fontWeight: 900,
                                                    textTransform: 'uppercase',
                                                    background: bump.isActive ? '#dcfce7' : '#f1f5f9',
                                                    color: bump.isActive ? '#166534' : '#64748b'
                                                }}>
                                                    {bump.isActive ? 'Ativo' : 'Pausado'}
                                                </div>
                                            </div>
                                            <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '2px', lineHeight: '1.4' }}>{bump.description}</p>
                                        </div>
                                        <span style={{
                                            background: 'var(--admin-accent-light)',
                                            color: 'var(--admin-accent)',
                                            padding: '4px 10px',
                                            borderRadius: '8px',
                                            fontSize: '0.75rem',
                                            fontWeight: 800
                                        }}>
                                            R$ {bump.price.toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div style={{
                                background: '#f8fafc',
                                padding: '12px',
                                borderRadius: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Tag size={14} color="var(--admin-accent)" />
                                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>
                                            Vínculo: {bump.product ? bump.product.name : 'Global (Todos)'}
                                        </span>
                                    </div>

                                    <div style={{ width: '1px', height: '14px', background: '#e2e8f0' }}></div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>Status:</span>
                                        <button
                                            onClick={() => toggleOrderBump(bump.id, !bump.isActive)}
                                            style={{
                                                width: '36px',
                                                height: '20px',
                                                borderRadius: '20px',
                                                background: bump.isActive ? '#10b981' : '#cbd5e1',
                                                padding: '2px',
                                                border: 'none',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                transition: 'all 0.3s'
                                            }}
                                        >
                                            <div style={{
                                                width: '16px',
                                                height: '16px',
                                                borderRadius: '50%',
                                                background: 'white',
                                                transform: bump.isActive ? 'translateX(16px)' : 'translateX(0)',
                                                transition: 'transform 0.3s'
                                            }} />
                                        </button>
                                    </div>
                                </div>

                                <form action={async (formData) => {
                                    if (confirm('Tem certeza que deseja excluir este bump?')) {
                                        await deleteOrderBump(bump.id)
                                    }
                                }}>
                                    <button
                                        type="submit"
                                        style={{
                                            background: 'white',
                                            color: '#ef4444',
                                            border: '1px solid #fee2e2',
                                            padding: '8px',
                                            borderRadius: '10px',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                        title="Excluir"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </form>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Popup Modal */}
            {isModalOpen && (
                <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div className="modal-container" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">Novo Order Bump</h2>
                            <button className="modal-close" onClick={() => setIsModalOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        <form action={async (formData) => {
                            await createOrderBump(formData)
                            setIsModalOpen(false)
                        }}>
                            <div className="input-group">
                                <label className="input-label">Nome da Oferta</label>
                                <input
                                    name="name"
                                    type="text"
                                    className="input-field"
                                    placeholder="Ex: Leve +1 com 50% OFF"
                                    required
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="input-group">
                                    <label className="input-label">Preço do Bump (R$)</label>
                                    <input
                                        name="price"
                                        type="number"
                                        step="0.01"
                                        className="input-field"
                                        placeholder="0.00"
                                        required
                                    />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Produto Vinculado</label>
                                    <select name="productId" className="input-field">
                                        <option value="global">Todos (Global)</option>
                                        {products.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="input-group">
                                <label className="input-label">Descrição Curta</label>
                                <input
                                    name="description"
                                    type="text"
                                    className="input-field"
                                    placeholder="Frase de impacto para o checkout"
                                    required
                                />
                            </div>

                            <div className="input-group">
                                <label className="input-label">URL da Imagem</label>
                                <input
                                    name="imageUrl"
                                    type="url"
                                    className="input-field"
                                    placeholder="https://..."
                                />
                            </div>

                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                background: '#eff6ff',
                                padding: '12px',
                                borderRadius: '12px',
                                marginBottom: '1.5rem'
                            }}>
                                <Info size={16} color="var(--admin-accent)" />
                                <p style={{ fontSize: '0.75rem', color: 'var(--admin-accent)', fontWeight: 600 }}>
                                    Este item será exibido logo acima do botão de finalizar compra.
                                </p>
                            </div>

                            <button
                                type="submit"
                                className="btn-primary"
                                style={{
                                    width: '100%',
                                    background: 'var(--admin-accent)',
                                    color: 'white',
                                    border: 'none',
                                    padding: '14px',
                                    borderRadius: '14px',
                                    fontWeight: 800,
                                    cursor: 'pointer'
                                }}
                            >
                                Criar Order Bump
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
