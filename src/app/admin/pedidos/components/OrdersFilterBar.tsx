'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { Search, Filter, X, ChevronDown, Calendar } from 'lucide-react'

const presets = [
    { value: 'today', label: 'Hoje' },
    { value: 'yesterday', label: 'Ontem' },
    { value: '7dias', label: '7 dias' },
    { value: '30dias', label: '30 dias' },
    { value: 'mes', label: 'Este mês' },
    { value: 'mes-anterior', label: 'Mês ant.' },
    { value: 'vida', label: 'Tudo' },
]

const paymentStatuses = [
    { key: 'todos', label: 'Todos', color: '#fff', bg: '#0f172a' },
    { key: 'pago', label: 'Pago', color: '#16a34a', bg: '#dcfce7' },
    { key: 'aguardando', label: 'Aguardando', color: '#d97706', bg: '#fef3c7' },
    { key: 'recusado', label: 'Recusado', color: '#dc2626', bg: '#fee2e2' },
]

const paymentMethods = [
    { key: 'todos', label: 'Todos' },
    { key: 'pix', label: 'PIX' },
    { key: 'credito', label: 'Cartão' },
]

const orderStatuses = [
    { key: 'todos', label: 'Todos' },
    { key: 'pendente', label: 'Pendente' },
    { key: 'processando', label: 'Processando' },
    { key: 'enviado', label: 'Enviado' },
    { key: 'entregue', label: 'Entregue' },
    { key: 'cancelado', label: 'Cancelado' },
]

export default function OrdersFilterBar({
    currentFilter,
    currentPaymentStatus,
    currentPaymentMethod,
    currentOrderStatus,
    currentSearch,
    fromDate,
    toDate,
}: {
    currentFilter: string
    currentPaymentStatus: string
    currentPaymentMethod: string
    currentOrderStatus: string
    currentSearch: string
    fromDate: string
    toDate: string
}) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [showCustom, setShowCustom] = useState(false)
    const [showAdvanced, setShowAdvanced] = useState(false)
    const [searchValue, setSearchValue] = useState(currentSearch)

    function updateParam(key: string, value: string | null) {
        const params = new URLSearchParams(searchParams.toString())
        if (value === null || value === '' || (key === 'status' && value === 'todos') || (key === 'method' && value === 'todos') || (key === 'orderStatus' && value === 'todos')) {
            params.delete(key)
        } else {
            params.set(key, value)
        }
        router.push(`?${params.toString()}`)
    }

    function handleSearch(e: React.FormEvent) {
        e.preventDefault()
        updateParam('q', searchValue || null)
    }

    function handlePresetChange(value: string) {
        const params = new URLSearchParams(searchParams.toString())
        params.set('filter', value)
        params.delete('from')
        params.delete('to')
        router.push(`?${params.toString()}`)
    }

    function handleCustomSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        const params = new URLSearchParams(searchParams.toString())
        params.set('filter', 'custom')
        params.set('from', formData.get('from') as string)
        params.set('to', formData.get('to') as string)
        router.push(`?${params.toString()}`)
    }

    function clearAllFilters() {
        router.push('?filter=7dias')
    }

    const hasActiveFilters = currentPaymentStatus !== 'todos' || currentPaymentMethod !== 'todos' || currentOrderStatus !== 'todos' || currentSearch

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Row 1: Search + Period */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                {/* Search */}
                <form onSubmit={handleSearch} style={{ display: 'flex', alignItems: 'center', gap: '0', flex: '1', minWidth: '200px', maxWidth: '340px' }}>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px 0 0 10px',
                        padding: '8px 12px', flex: 1,
                    }}>
                        <Search size={14} color="#94a3b8" />
                        <input
                            type="text"
                            placeholder="Buscar por nome, e-mail ou telefone..."
                            value={searchValue}
                            onChange={e => setSearchValue(e.target.value)}
                            style={{
                                border: 'none', outline: 'none', background: 'transparent',
                                fontSize: '13px', color: '#0f172a', width: '100%',
                                fontWeight: 500,
                            }}
                        />
                        {searchValue && (
                            <button
                                type="button"
                                onClick={() => { setSearchValue(''); updateParam('q', null) }}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}
                            >
                                <X size={14} color="#94a3b8" />
                            </button>
                        )}
                    </div>
                    <button type="submit" style={{
                        padding: '8px 14px', background: '#0f172a', color: '#fff',
                        border: 'none', borderRadius: '0 10px 10px 0',
                        fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                        whiteSpace: 'nowrap',
                    }}>
                        Buscar
                    </button>
                </form>

                {/* Period presets */}
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {presets.map(p => (
                        <button
                            key={p.value}
                            type="button"
                            onClick={() => handlePresetChange(p.value)}
                            style={{
                                padding: '7px 12px', borderRadius: '8px',
                                border: currentFilter === p.value ? 'none' : '1px solid #e2e8f0',
                                background: currentFilter === p.value ? '#0f172a' : '#fff',
                                color: currentFilter === p.value ? '#fff' : '#64748b',
                                fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                                transition: 'all 0.15s',
                            }}
                        >
                            {p.label}
                        </button>
                    ))}
                    <button
                        type="button"
                        onClick={() => setShowCustom(!showCustom)}
                        style={{
                            padding: '7px 12px', borderRadius: '8px',
                            border: currentFilter === 'custom' ? 'none' : '1px solid #e2e8f0',
                            background: currentFilter === 'custom' ? '#0f172a' : '#fff',
                            color: currentFilter === 'custom' ? '#fff' : '#64748b',
                            fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '4px',
                            transition: 'all 0.15s',
                        }}
                    >
                        <Calendar size={13} />
                        Personalizado
                        <ChevronDown size={12} style={{ transform: showCustom ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                    </button>
                </div>

                {/* Advanced toggle */}
                <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    style={{
                        padding: '7px 12px', borderRadius: '8px',
                        border: hasActiveFilters ? '1px solid #6366f1' : '1px solid #e2e8f0',
                        background: hasActiveFilters ? '#eef2ff' : '#fff',
                        color: hasActiveFilters ? '#6366f1' : '#64748b',
                        fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '4px',
                        transition: 'all 0.15s',
                    }}
                >
                    <Filter size={13} />
                    Filtros
                    {hasActiveFilters && (
                        <span style={{
                            width: '16px', height: '16px', borderRadius: '50%',
                            background: '#6366f1', color: '#fff', fontSize: '9px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 800,
                        }}>
                            {[currentPaymentStatus, currentPaymentMethod, currentOrderStatus, currentSearch].filter(v => v !== 'todos' && v !== '').length}
                        </span>
                    )}
                </button>
            </div>

            {/* Custom date range */}
            {showCustom && (
                <form onSubmit={handleCustomSubmit} style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px',
                    padding: '10px 14px',
                }}>
                    <Calendar size={14} color="#94a3b8" />
                    <input type="date" name="from" defaultValue={fromDate} style={{
                        border: '1px solid #e2e8f0', borderRadius: '8px', padding: '6px 10px',
                        fontSize: '13px', color: '#0f172a', fontWeight: 500,
                    }} />
                    <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>até</span>
                    <input type="date" name="to" defaultValue={toDate} style={{
                        border: '1px solid #e2e8f0', borderRadius: '8px', padding: '6px 10px',
                        fontSize: '13px', color: '#0f172a', fontWeight: 500,
                    }} />
                    <button type="submit" style={{
                        padding: '6px 14px', background: '#0f172a', color: '#fff',
                        border: 'none', borderRadius: '8px',
                        fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                    }}>
                        Filtrar
                    </button>
                </form>
            )}

            {/* Advanced filters panel */}
            {showAdvanced && (
                <div style={{
                    display: 'flex', alignItems: 'flex-end', gap: '16px', flexWrap: 'wrap',
                    background: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px',
                    padding: '14px 18px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                }}>
                    {/* Payment Status */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            Pagamento
                        </label>
                        <div style={{ display: 'flex', gap: '4px' }}>
                            {paymentStatuses.map(s => (
                                <button
                                    key={s.key}
                                    type="button"
                                    onClick={() => updateParam('status', s.key)}
                                    style={{
                                        padding: '6px 12px', borderRadius: '8px',
                                        border: 'none',
                                        background: currentPaymentStatus === s.key ? (s.key === 'todos' ? '#0f172a' : s.bg) : '#f1f5f9',
                                        color: currentPaymentStatus === s.key ? (s.key === 'todos' ? '#fff' : s.color) : '#64748b',
                                        fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                                        transition: 'all 0.15s',
                                    }}
                                >
                                    {s.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Payment Method */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            Método
                        </label>
                        <div style={{ display: 'flex', gap: '4px' }}>
                            {paymentMethods.map(m => (
                                <button
                                    key={m.key}
                                    type="button"
                                    onClick={() => updateParam('method', m.key)}
                                    style={{
                                        padding: '6px 12px', borderRadius: '8px',
                                        border: 'none',
                                        background: currentPaymentMethod === m.key ? (m.key === 'todos' ? '#0f172a' : '#eef2ff') : '#f1f5f9',
                                        color: currentPaymentMethod === m.key ? (m.key === 'todos' ? '#fff' : '#6366f1') : '#64748b',
                                        fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                                        transition: 'all 0.15s',
                                    }}
                                >
                                    {m.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Order Status */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            Status do Pedido
                        </label>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            {orderStatuses.map(o => (
                                <button
                                    key={o.key}
                                    type="button"
                                    onClick={() => updateParam('orderStatus', o.key)}
                                    style={{
                                        padding: '6px 12px', borderRadius: '8px',
                                        border: 'none',
                                        background: currentOrderStatus === o.key ? (o.key === 'todos' ? '#0f172a' : '#f0fdf4') : '#f1f5f9',
                                        color: currentOrderStatus === o.key ? (o.key === 'todos' ? '#fff' : '#16a34a') : '#64748b',
                                        fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                                        transition: 'all 0.15s',
                                    }}
                                >
                                    {o.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Clear all */}
                    {hasActiveFilters && (
                        <button
                            type="button"
                            onClick={clearAllFilters}
                            style={{
                                padding: '6px 12px', borderRadius: '8px',
                                border: '1px solid #fee2e2', background: '#fff',
                                color: '#dc2626', fontSize: '12px', fontWeight: 700,
                                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
                                marginLeft: 'auto',
                            }}
                        >
                            <X size={12} />
                            Limpar filtros
                        </button>
                    )}
                </div>
            )}
        </div>
    )
}
