'use client'

import React, { useState } from 'react'
import { Copy, Trash2, ExternalLink, Edit2, Check, DollarSign, Link2, Eye } from 'lucide-react'
import Link from 'next/link'
import { duplicateProduct, deleteProduct } from '@/app/actions'
import EditProductModal from './EditProductModal'

export default function ProductCard({ product }: { product: any }) {
    const [isEditing, setIsEditing] = useState(false)
    const [copied, setCopied] = useState(false)
    const [deleting, setDeleting] = useState(false)

    const checkoutUrl = `/checkout?p=${product.id}`
    const margin = product.price - (product.cost || 0)
    const marginPct = product.price > 0 ? ((margin / product.price) * 100).toFixed(0) : '0'

    async function handleCopy() {
        await navigator.clipboard.writeText(`${window.location.origin}${checkoutUrl}`)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    async function handleDelete() {
        if (!confirm('Excluir este produto?')) return
        setDeleting(true)
        try { await deleteProduct(product.id) } catch { setDeleting(false) }
    }

    return (
        <>
            <div style={{
                background: '#fff',
                border: '1px solid #f1f5f9',
                borderRadius: '16px',
                overflow: 'hidden',
                transition: 'all 0.2s',
            }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.06)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#f1f5f9'; e.currentTarget.style.boxShadow = 'none' }}
            >
                {/* Image */}
                <div style={{
                    height: '140px', background: '#f8fafc', overflow: 'hidden', position: 'relative',
                }}>
                    <img
                        src={product.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=400&auto=format&fit=crop'}
                        alt={product.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    {product.isDigital && (
                        <span style={{
                            position: 'absolute', top: '10px', right: '10px',
                            fontSize: '9px', fontWeight: 800, color: '#7c3aed', background: '#ede9fe',
                            padding: '3px 8px', borderRadius: '6px', textTransform: 'uppercase', letterSpacing: '0.06em',
                        }}>Digital</span>
                    )}
                </div>

                {/* Content */}
                <div style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                        <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                            {product.name}
                        </h3>
                        <Link
                            href={checkoutUrl}
                            target="_blank"
                            style={{
                                width: '24px', height: '24px', borderRadius: '6px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: '#f1f5f9', color: '#64748b', textDecoration: 'none',
                                flexShrink: 0, transition: 'all 0.15s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#0f172a'; e.currentTarget.style.color = '#fff' }}
                            onMouseLeave={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#64748b' }}
                            title="Abrir checkout"
                        >
                            <Eye size={12} />
                        </Link>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '10px' }}>
                        <span style={{ fontSize: '20px', fontWeight: 900, color: '#0f172a' }}>
                            R$ {product.price.toFixed(2)}
                        </span>
                        {product.cost > 0 && (
                            <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>
                                {marginPct}% margem
                            </span>
                        )}
                    </div>

                    {/* Checkout Link */}
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: '10px',
                        padding: '8px 10px', marginBottom: '12px',
                    }}>
                        <Link2 size={12} color="#94a3b8" />
                        <input
                            readOnly
                            value={checkoutUrl}
                            style={{
                                flex: 1, border: 'none', background: 'transparent',
                                fontSize: '11px', color: '#64748b', fontWeight: 600, outline: 'none',
                            }}
                            onClick={e => (e.target as HTMLInputElement).select()}
                        />
                        <button
                            onClick={handleCopy}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '4px',
                                padding: '4px 8px', borderRadius: '6px',
                                border: 'none', background: copied ? '#d1fae5' : '#fff',
                                color: copied ? '#059669' : '#64748b',
                                fontSize: '10px', fontWeight: 700, cursor: 'pointer',
                                transition: 'all 0.15s',
                            }}
                        >
                            {copied ? <Check size={11} /> : <Copy size={11} />}
                            {copied ? 'Copiado' : 'Copiar'}
                        </button>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                            onClick={() => setIsEditing(true)}
                            style={{
                                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                                padding: '8px', borderRadius: '10px',
                                border: '1px solid #e2e8f0', background: '#fff',
                                color: '#475569', fontSize: '11px', fontWeight: 700, cursor: 'pointer',
                                transition: 'all 0.15s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = '#0f172a'; e.currentTarget.style.color = '#0f172a' }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#475569' }}
                        >
                            <Edit2 size={13} /> Editar
                        </button>
                        <button
                            onClick={async () => { await duplicateProduct(product.id); window.location.reload() }}
                            style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                width: '36px', height: '36px', borderRadius: '10px',
                                border: '1px solid #e2e8f0', background: '#fff',
                                color: '#64748b', cursor: 'pointer', transition: 'all 0.15s',
                            }}
                            title="Duplicar"
                            onMouseEnter={e => { e.currentTarget.style.borderColor = '#6366f1'; e.currentTarget.style.color = '#6366f1' }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#64748b' }}
                        >
                            <Copy size={14} />
                        </button>
                        <button
                            onClick={handleDelete}
                            disabled={deleting}
                            style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                width: '36px', height: '36px', borderRadius: '10px',
                                border: '1px solid #fee2e2', background: '#fff',
                                color: '#ef4444', cursor: deleting ? 'wait' : 'pointer', transition: 'all 0.15s',
                            }}
                            title="Excluir"
                            onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2' }}
                            onMouseLeave={e => { e.currentTarget.style.background = '#fff' }}
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                </div>
            </div>

            {isEditing && <EditProductModal product={product} onClose={() => setIsEditing(false)} />}
        </>
    )
}
