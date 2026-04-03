'use client'

import React, { useState } from 'react'
import { Plus, Package, LayoutGrid, Search } from 'lucide-react'
import NewProductModal from './NewProductModal'

export default function ProductsHeader() {
    const [isShowingModal, setIsShowingModal] = useState(false)

    return (
        <div style={{ marginBottom: '32px' }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '24px'
            }}>
                <div>
                    <h1 style={{
                        fontSize: '26px',
                        fontWeight: 900,
                        color: 'var(--admin-text-primary)',
                        margin: 0,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        letterSpacing: '-0.02em'
                    }}>
                        <Package size={28} color="#3b82f6" />
                        Produtos
                    </h1>
                    <p style={{
                        color: 'var(--admin-text-secondary)',
                        fontSize: '14px',
                        marginTop: '4px',
                        fontWeight: 500
                    }}>
                        Gerencie seus produtos e links de checkout.
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        minWidth: '240px'
                    }}>
                        <Search
                            size={16}
                            style={{ position: 'absolute', left: '16px', color: '#94a3b8' }}
                        />
                        <input
                            type="text"
                            placeholder="Buscar produto..."
                            style={{
                                width: '100%',
                                padding: '12px 16px 12px 42px',
                                borderRadius: '14px',
                                border: '1px solid var(--admin-border)',
                                background: 'var(--admin-card)',
                                fontSize: '14px',
                                color: 'var(--admin-text-primary)',
                                outline: 'none',
                                transition: 'all 0.2s'
                            }}
                        />
                    </div>

                    <button
                        onClick={() => setIsShowingModal(true)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            background: '#3b82f6',
                            color: '#fff',
                            padding: '12px 24px',
                            borderRadius: '14px',
                            border: 'none',
                            fontWeight: 800,
                            fontSize: '14px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.2)',
                            height: '100%'
                        }}
                    >
                        <Plus size={18} />
                        Novo Produto
                    </button>
                </div>
            </div>

            {isShowingModal && (
                <NewProductModal onClose={() => setIsShowingModal(false)} />
            )}
        </div>
    )
}
