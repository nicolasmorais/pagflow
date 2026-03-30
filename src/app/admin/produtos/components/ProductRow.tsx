'use client'

import React from 'react'
import { Copy, Trash2, ExternalLink, Edit2, ShoppingBag } from 'lucide-react'
import Link from 'next/link'
import { duplicateProduct, deleteProduct } from '../../../actions'
import EditProductModal from './EditProductModal'

interface ProductRowProps {
    product: any
}

export default function ProductRow({ product }: ProductRowProps) {
    const [isEditing, setIsEditing] = React.useState(false)

    const gridLayout = 'minmax(300px, 1.5fr) minmax(120px, 1fr) minmax(120px, 1fr) minmax(200px, 1.2fr) 180px';

    return (
        <>
            <div className="dashboard-order-row" style={{
                background: 'var(--admin-card)',
                border: '1px solid var(--admin-border)',
                borderRadius: '16px',
                padding: '12px 24px',
                display: 'grid',
                gridTemplateColumns: gridLayout,
                alignItems: 'center',
                gap: '16px',
                transition: 'all 0.2s ease',
                boxShadow: '0 1px 2px rgba(0,0,0,0.01)'
            }}>
                {/* Col 1: Product Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, border: '1px solid #e2e8f0' }}>
                        <img
                            src={product.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1999&auto=format&fit=crop'}
                            alt={product.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                    </div>
                    <div>
                        <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--admin-text-primary)', margin: 0 }}>{product.name}</h3>
                        <span style={{ fontSize: '0.65rem', color: 'var(--admin-text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <ShoppingBag size={10} /> ID: {product.id.substring(0, 8)}...
                        </span>
                    </div>
                </div>

                {/* Col 2: Price */}
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--admin-text-primary)' }}>
                    R$ {product.price.toFixed(2)}
                </div>

                {/* Col 3: Commission */}
                <div>
                    <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: '#10b981',
                        background: '#ecfdf5',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        border: '1px solid #d1f7de'
                    }}>
                        R$ {product.commission?.toFixed(2) || '0.00'}
                    </span>
                </div>

                {/* Col 4: Checkout Link */}
                <div style={{
                    display: 'flex',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '6px 10px',
                    alignItems: 'center',
                    gap: '8px',
                    maxWidth: '100%'
                }}>
                    <input
                        readOnly
                        value={`/checkout?p=${product.id}`}
                        style={{ border: 'none', background: 'transparent', fontSize: '11px', color: '#64748b', width: '100%', fontWeight: 600, outline: 'none' }}
                    />
                    <Link
                        href={`/checkout?p=${product.id}`}
                        target="_blank"
                        style={{ color: '#3b82f6', display: 'flex' }}
                        title="Abrir Checkout"
                    >
                        <ExternalLink size={14} />
                    </Link>
                </div>

                {/* Col 5: Actions */}
                <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                    <button
                        onClick={() => setIsEditing(true)}
                        title="Editar"
                        style={{
                            width: '34px',
                            height: '34px',
                            background: '#eff6ff',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#3b82f6',
                            border: '1px solid #dbeafe',
                            cursor: 'pointer'
                        }}
                    >
                        <Edit2 size={16} />
                    </button>

                    <button
                        onClick={async () => await duplicateProduct(product.id)}
                        title="Duplicar"
                        style={{
                            width: '34px',
                            height: '34px',
                            background: '#f8fafc',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#475569',
                            border: '1px solid #e2e8f0',
                            cursor: 'pointer'
                        }}
                    >
                        <Copy size={16} />
                    </button>

                    <button
                        onClick={async () => {
                            if (confirm('Tem certeza que deseja excluir este produto?')) {
                                await deleteProduct(product.id)
                            }
                        }}
                        title="Excluir"
                        style={{
                            width: '34px',
                            height: '34px',
                            background: '#fef2f2',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#ef4444',
                            border: '1px solid #fee2e2',
                            cursor: 'pointer'
                        }}
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>

            {isEditing && (
                <EditProductModal
                    product={product}
                    onClose={() => setIsEditing(false)}
                />
            )}
        </>
    )
}
