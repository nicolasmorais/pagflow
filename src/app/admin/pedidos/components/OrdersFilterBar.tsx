'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { Search, Filter, X, ChevronDown, Calendar } from 'lucide-react'

const presets = [
    { value: 'today', label: 'Hoje' },
    { value: 'yesterday', label: 'Ontem' },
    { value: '7dias', label: '7 dias' },
    { value: '30dias', label: '30 dias' },
    { value: 'mes', label: 'Este mês' },
    { value: 'mes-anterior', label: 'Mês passado' },
    { value: 'vida', label: 'Tudo' },
]

const paymentStatuses = [
    { key: 'todos', label: 'Todos' },
    { key: 'pago', label: 'Pago' },
    { key: 'aguardando', label: 'Aguardando' },
    { key: 'recusado', label: 'Recusado' },
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
    const [showDropdown, setShowDropdown] = useState(false)
    const [searchValue, setSearchValue] = useState(currentSearch)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const customRef = useRef<HTMLDivElement>(null)

    const activeCount = [currentPaymentStatus, currentPaymentMethod, currentOrderStatus].filter(v => v !== 'todos').length + (currentSearch ? 1 : 0)

    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setShowDropdown(false)
            }
            if (customRef.current && !customRef.current.contains(e.target as Node)) {
                setShowCustom(false)
            }
        }
        if (showDropdown || showCustom) document.addEventListener('mousedown', handleClick)
        return () => document.removeEventListener('mousedown', handleClick)
    }, [showDropdown, showCustom])

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

    return (
        <>
            <div style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                flexWrap: 'wrap',
            }}>
                {/* Left: Search */}
                <form onSubmit={handleSearch} style={{ display: 'flex', alignItems: 'center', gap: '0', minWidth: '200px', maxWidth: '280px' }}>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        background: '#fff', border: '1px solid #E5E7EF', borderRadius: '9px 0 0 9px',
                        padding: '9px 12px', flex: 1,
                    }}>
                        <Search size={14} color="#6E7180" />
                        <input
                            type="text"
                            placeholder="Buscar..."
                            value={searchValue}
                            onChange={e => setSearchValue(e.target.value)}
                            style={{
                                border: 'none', outline: 'none', background: 'transparent',
                                fontSize: '13px', color: '#14151F', width: '100%',
                                fontWeight: 500, fontFamily: 'inherit',
                            }}
                        />
                        {searchValue && (
                            <button
                                type="button"
                                onClick={() => { setSearchValue(''); updateParam('q', null) }}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}
                            >
                                <X size={14} color="#6E7180" />
                            </button>
                        )}
                    </div>
                    <button type="submit" style={{
                        padding: '9px 14px', background: '#14151F', color: '#fff',
                        border: 'none', borderRadius: '0 9px 9px 0',
                        fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                        whiteSpace: 'nowrap', fontFamily: 'inherit',
                    }}>
                        Buscar
                    </button>
                </form>

                {/* Spacer */}
                <div style={{ flex: 1 }} />

                {/* Right: Period presets */}
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {presets.map(p => (
                        <button
                            key={p.value}
                            type="button"
                            onClick={() => handlePresetChange(p.value)}
                            style={{
                                padding: '8px 12px', borderRadius: '8px',
                                border: currentFilter === p.value ? 'none' : '1px solid #E5E7EF',
                                background: currentFilter === p.value ? '#14151F' : '#fff',
                                color: currentFilter === p.value ? '#fff' : '#6E7180',
                                fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                                transition: 'all 0.15s', fontFamily: 'inherit',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            {p.label}
                        </button>
                    ))}
                    <div style={{ position: 'relative' }} ref={customRef}>
                        <button
                            type="button"
                            onClick={() => setShowCustom(!showCustom)}
                            style={{
                                padding: '8px 12px', borderRadius: '8px',
                                border: currentFilter === 'custom' ? 'none' : '1px solid #E5E7EF',
                                background: currentFilter === 'custom' ? '#14151F' : '#fff',
                                color: currentFilter === 'custom' ? '#fff' : '#6E7180',
                                fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: '4px',
                                transition: 'all 0.15s', fontFamily: 'inherit',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            <Calendar size={13} />
                            Personalizado
                            <ChevronDown size={12} style={{ transform: showCustom ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                        </button>
                        {showCustom && (
                            <form onSubmit={handleCustomSubmit} style={{
                                position: 'absolute', top: 'calc(100% + 6px)', right: 0,
                                display: 'flex', alignItems: 'center', gap: '8px',
                                background: '#fff', border: '1px solid #E5E7EF', borderRadius: '14px',
                                padding: '14px 16px',
                                boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
                                zIndex: 100, whiteSpace: 'nowrap',
                            }}>
                                <Calendar size={14} color="#6E7180" />
                                <input type="date" name="from" defaultValue={fromDate} style={{
                                    border: '1px solid #E5E7EF', borderRadius: '8px', padding: '6px 10px',
                                    fontSize: '13px', color: '#14151F', fontWeight: 500, fontFamily: 'inherit',
                                }} />
                                <span style={{ fontSize: '12px', color: '#6E7180', fontWeight: 600 }}>até</span>
                                <input type="date" name="to" defaultValue={toDate} style={{
                                    border: '1px solid #E5E7EF', borderRadius: '8px', padding: '6px 10px',
                                    fontSize: '13px', color: '#14151F', fontWeight: 500, fontFamily: 'inherit',
                                }} />
                                <button type="submit" style={{
                                    padding: '7px 14px', background: '#14151F', color: '#fff',
                                    border: 'none', borderRadius: '8px',
                                    fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                                }}>
                                    Filtrar
                                </button>
                            </form>
                        )}
                    </div>
                </div>

                {/* Filtros button */}
                <div style={{ position: 'relative' }} ref={dropdownRef}>
                    <button
                        type="button"
                        onClick={() => setShowDropdown(!showDropdown)}
                        style={{
                            padding: '8px 14px', borderRadius: '8px',
                            border: activeCount > 0 ? '1px solid #2C5C86' : '1px solid #E5E7EF',
                            background: activeCount > 0 ? '#E7F1F8' : '#fff',
                            color: activeCount > 0 ? '#2C5C86' : '#6E7180',
                            fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '6px',
                            transition: 'all 0.15s', fontFamily: 'inherit',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        <Filter size={13} />
                        Filtros
                        {activeCount > 0 && (
                            <span style={{
                                width: '16px', height: '16px', borderRadius: '50%',
                                background: '#2C5C86', color: '#fff', fontSize: '9px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontWeight: 800,
                            }}>
                                {activeCount}
                            </span>
                        )}
                    </button>

                    {showDropdown && (
                        <div style={{
                            position: 'absolute', top: 'calc(100% + 6px)', right: 0,
                            background: '#fff', border: '1px solid #E5E7EF',
                            borderRadius: '14px', padding: '18px',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
                            minWidth: '280px', zIndex: 100,
                        }}>
                            {/* Pagamento */}
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ fontSize: '10.5px', fontWeight: 700, color: '#6E7180', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '8px' }}>
                                    Status do pagamento
                                </label>
                                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                    {paymentStatuses.map(s => (
                                        <button
                                            key={s.key}
                                            type="button"
                                            onClick={() => updateParam('status', s.key)}
                                            style={{
                                                padding: '6px 12px', borderRadius: '8px',
                                                border: 'none',
                                                background: currentPaymentStatus === s.key ? '#14151F' : '#F5F6F9',
                                                color: currentPaymentStatus === s.key ? '#fff' : '#6E7180',
                                                fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                                                transition: 'all 0.15s', fontFamily: 'inherit',
                                            }}
                                        >
                                            {s.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Status da logística */}
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ fontSize: '10.5px', fontWeight: 700, color: '#6E7180', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '8px' }}>
                                    Status da logística
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
                                                background: currentOrderStatus === o.key ? '#14151F' : '#F5F6F9',
                                                color: currentOrderStatus === o.key ? '#fff' : '#6E7180',
                                                fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                                                transition: 'all 0.15s', fontFamily: 'inherit',
                                            }}
                                        >
                                            {o.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Método */}
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ fontSize: '10.5px', fontWeight: 700, color: '#6E7180', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '8px' }}>
                                    Método de pagamento
                                </label>
                                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                    {paymentMethods.map(m => (
                                        <button
                                            key={m.key}
                                            type="button"
                                            onClick={() => updateParam('method', m.key)}
                                            style={{
                                                padding: '6px 12px', borderRadius: '8px',
                                                border: 'none',
                                                background: currentPaymentMethod === m.key ? '#14151F' : '#F5F6F9',
                                                color: currentPaymentMethod === m.key ? '#fff' : '#6E7180',
                                                fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                                                transition: 'all 0.15s', fontFamily: 'inherit',
                                            }}
                                        >
                                            {m.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {activeCount > 0 && (
                                <button
                                    type="button"
                                    onClick={() => { clearAllFilters(); setShowDropdown(false) }}
                                    style={{
                                        width: '100%', padding: '8px 12px', borderRadius: '8px',
                                        border: '1px solid #FBEAE8', background: '#fff',
                                        color: '#B23B32', fontSize: '12px', fontWeight: 700,
                                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                                        fontFamily: 'inherit',
                                    }}
                                >
                                    <X size={12} />
                                    Limpar todos os filtros
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

        </>
    )
}
