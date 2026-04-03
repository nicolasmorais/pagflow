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
            <div className="product-row-new" style={{
                background: 'var(--admin-card)',
                border: '1px solid var(--admin-border)',
                borderRadius: '20px',
                padding: '16px 24px',
                display: 'grid',
                gridTemplateColumns: gridLayout,
                alignItems: 'center',
                gap: '16px',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
            }}>
                <style jsx>{`
                    .product-row-new:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 12px 20px -10px rgba(0,0,0,0.04);
                        border-color: #3b82f640;
                    }
                    .checkout-link-container:focus-within {
                        border-color: #3b82f6 !important;
                        background: #fff !important;
                    }
                `}</style>
                {/* Col 1: Product Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '14px',
                        overflow: 'hidden',
                        flexShrink: 0,
                        border: '1.5px solid #f1f5f9',
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
                    }}>
                        <img
                            src={product.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1999&auto=format&fit=crop'}
                            alt={product.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                    </div>
                    <div>
                        <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>{product.name}</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                            <span style={{
                                fontSize: '10px',
                                background: '#f1f5f9',
                                color: '#64748b',
                                padding: '2px 8px',
                                borderRadius: '6px',
                                fontWeight: 700
                            }}>
                                ID: {product.id.substring(0, 8)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Col 2: Price */}
                <div style={{ fontSize: '1rem', fontWeight: 800, color: '#1e293b' }}>
                    <span style={{ fontSize: '0.8rem', color: '#64748b', marginRight: '2px' }}>R$</span>
                    {product.price.toFixed(2)}
                </div>

                {/* Col 3: Commission */}
                <div>
                    <span style={{
                        fontSize: '0.8rem',
                        fontWeight: 800,
                        color: '#059669',
                        background: '#ecfdf5',
                        padding: '6px 12px',
                        borderRadius: '10px',
                        border: '1.5px solid #d1f7de'
                    }}>
                        + R$ {product.commission?.toFixed(2) || '0.00'}
                    </span>
                </div>

                {/* Col 4: Checkout Link */}
                <div className="checkout-link-container" style={{
                    display: 'flex',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '8px 12px',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s'
                }}>
                    <input
                        readOnly
                        value={`/checkout?p=${product.id}`}
                        style={{ border: 'none', background: 'transparent', fontSize: '12px', color: '#64748b', width: '100%', fontWeight: 600, outline: 'none' }}
                        onClick={(e) => (e.target as HTMLInputElement).select()}
                    />
                    <Link
                        href={`/checkout?p=${product.id}`}
                        target="_blank"
                        style={{
                            color: '#3b82f6',
                            display: 'flex',
                            padding: '4px',
                            borderRadius: '6px',
                            background: '#fff',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                        }}
                        title="Abrir Checkout"
                    >
                        <ExternalLink size={14} />
                    </Link>
                </div>

                {/* Col 5: Actions */}
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button
                        onClick={() => setIsEditing(true)}
                        title="Editar"
                        style={{
                            width: '40px',
                            height: '40px',
                            background: '#fff',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#3b82f6',
                            border: '1px solid #e2e8f0',
                            cursor: 'pointer',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                            transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => (e.currentTarget.style.borderColor = '#3b82f6')}
                        onMouseOut={(e) => (e.currentTarget.style.borderColor = '#e2e8f0')}
                    >
                        <Edit2 size={18} />
                    </button>

                    <button
                        onClick={async () => await duplicateProduct(product.id)}
                        title="Duplicar"
                        style={{
                            width: '40px',
                            height: '40px',
                            background: '#fff',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#475569',
                            border: '1px solid #e2e8f0',
                            cursor: 'pointer',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                            transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => (e.currentTarget.style.borderColor = '#475569')}
                        onMouseOut={(e) => (e.currentTarget.style.borderColor = '#e2e8f0')}
                    >
                        <Copy size={18} />
                    </button>

                    <button
                        onClick={async () => {
                            if (confirm('Tem certeza que deseja excluir este produto?')) {
                                await deleteProduct(product.id)
                            }
                        }}
                        title="Excluir"
                        style={{
                            width: '40px',
                            height: '40px',
                            background: '#fff',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#ef4444',
                            border: '1px solid #fee2e2',
                            cursor: 'pointer',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                            transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => (e.currentTarget.style.background = '#fef2f2')}
                        onMouseOut={(e) => (e.currentTarget.style.background = '#fff')}
                    >
                        <Trash2 size={18} />
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
