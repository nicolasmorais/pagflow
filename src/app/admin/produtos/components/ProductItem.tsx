'use client'

import React from 'react'
import { Copy, Trash2, ExternalLink, Edit2 } from 'lucide-react'
import Link from 'next/link'
import { duplicateProduct, deleteProduct } from '../../../actions'
import EditProductModal from './EditProductModal'

interface ProductItemProps {
    product: any
}

export default function ProductItem({ product }: ProductItemProps) {
    const [isEditing, setIsEditing] = React.useState(false)

    return (
        <div className="dashboard-order-card" style={{ padding: '0', overflow: 'hidden' }}>
            <div style={{ height: '160px', width: '100%', position: 'relative' }}>
                <img
                    src={product.imageUrl || ''}
                    alt={product.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    background: '#fff',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '14px',
                    fontWeight: 800,
                    color: '#3b82f6',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}>
                    R$ {product.price.toFixed(2)}
                </div>
            </div>

            <div style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>{product.name}</h3>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#10b981', background: '#ecfdf5', padding: '2px 6px', borderRadius: '4px' }}>
                        Comissão: R$ {product.commission?.toFixed(2) || '0.00'}
                    </span>
                </div>

                <div style={{ marginBottom: '1.25rem' }}>
                    <label style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--admin-text-secondary)', display: 'block', marginBottom: '4px' }}>Link de Checkout</label>
                    <div style={{
                        display: 'flex',
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        padding: '8px',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <input
                            readOnly
                            value={`/checkout?p=${product.id}`}
                            style={{ border: 'none', background: 'transparent', fontSize: '12px', color: '#64748b', width: '100%', fontWeight: 600 }}
                        />
                        <Link
                            href={`/checkout?p=${product.id}`}
                            target="_blank"
                            style={{ color: '#3b82f6' }}
                            title="Abrir Checkout"
                        >
                            <ExternalLink size={14} />
                        </Link>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                        onClick={() => setIsEditing(true)}
                        className="btn-primary"
                        style={{
                            flex: 1,
                            background: '#f1f5f9',
                            color: '#3b82f6',
                            fontSize: '0.8rem',
                            padding: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            border: '1px solid #dbeafe'
                        }}
                    >
                        <Edit2 size={14} /> Editar
                    </button>

                    <form action={async () => {
                        await duplicateProduct(product.id)
                    }} style={{ flex: 1 }}>
                        <button
                            className="btn-primary"
                            style={{
                                width: '100%',
                                background: '#f1f5f9',
                                color: '#475569',
                                fontSize: '0.8rem',
                                padding: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                                border: '1px solid #e2e8f0'
                            }}
                        >
                            <Copy size={14} /> Copiar
                        </button>
                    </form>

                    <form action={async () => {
                        if (confirm('Tem certeza?')) {
                            await deleteProduct(product.id)
                        }
                    }} style={{ flex: 0.4 }}>
                        <button
                            className="btn-primary"
                            style={{
                                width: '100%',
                                background: '#fef2f2',
                                color: '#ef4444',
                                border: '1px solid #fee2e2',
                                fontSize: '0.8rem',
                                padding: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            <Trash2 size={14} />
                        </button>
                    </form>
                </div>
            </div>

            {isEditing && (
                <EditProductModal
                    product={product}
                    onClose={() => setIsEditing(false)}
                />
            )}
        </div>
    )
}
