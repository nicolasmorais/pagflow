'use client'

import { Filter, Calendar, ChevronDown } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'

const presets = [
    { value: 'today', label: 'Hoje' },
    { value: 'yesterday', label: 'Ontem' },
    { value: '7dias', label: '7 dias' },
    { value: '30dias', label: '30 dias' },
    { value: 'mes', label: 'Este mês' },
    { value: 'mes-anterior', label: 'Mês ant.' },
    { value: 'vida', label: 'Tudo' },
]

export default function AnalyticsFilterForm({
    currentFilter,
    currentStatus = 'todos',
    fromDate,
    toDate,
    showStatus = false,
}: {
    currentFilter: string
    currentStatus?: string
    fromDate: string
    toDate: string
    showStatus?: boolean
}) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [showCustom, setShowCustom] = useState(false)

    function handlePresetChange(value: string) {
        const params = new URLSearchParams(searchParams.toString())
        params.set('filter', value)
        params.delete('from')
        params.delete('to')
        router.push(`?${params.toString()}`)
    }

    function handleStatusClick(status: string) {
        const params = new URLSearchParams(searchParams.toString())
        if (params.get('status') === status) {
            params.delete('status')
        } else {
            params.set('status', status)
        }
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

    const isCustom = currentFilter === 'custom'

    return (
        <div className="filter-wrapper">
            {/* Status buttons */}
            {showStatus && (
                <div className="status-pills">
                    {[
                        { key: 'pago', label: 'Pago', color: '#16a34a', bg: '#dcfce7', activeBg: '#16a34a' },
                        { key: 'aguardando', label: 'Aguardando', color: '#d97706', bg: '#fef3c7', activeBg: '#d97706' },
                        { key: 'recusado', label: 'Recusado', color: '#dc2626', bg: '#fee2e2', activeBg: '#dc2626' },
                    ].map(s => (
                        <button
                            key={s.key}
                            type="button"
                            onClick={() => handleStatusClick(s.key)}
                            style={{
                                padding: '6px 14px',
                                borderRadius: '8px',
                                background: currentStatus === s.key ? s.activeBg : s.bg,
                                color: currentStatus === s.key ? '#fff' : s.color,
                                border: 'none',
                                fontSize: '11px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'all 0.15s',
                                letterSpacing: '0.02em',
                            }}
                        >
                            {s.label}
                        </button>
                    ))}
                </div>
            )}

            {/* Period presets */}
            <div className="filter-presets">
                {presets.map(p => (
                    <button
                        key={p.value}
                        type="button"
                        onClick={() => handlePresetChange(p.value)}
                        className={`filter-preset-btn ${currentFilter === p.value && !isCustom ? 'active' : ''}`}
                    >
                        {p.label}
                    </button>
                ))}
                <button
                    type="button"
                    onClick={() => setShowCustom(!showCustom)}
                    className={`filter-preset-btn custom-toggle ${isCustom ? 'active' : ''}`}
                >
                    <Calendar size={13} />
                    Personalizado
                    <ChevronDown size={12} style={{ transform: showCustom ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                </button>
            </div>

            {/* Custom date range */}
            {showCustom && (
                <form onSubmit={handleCustomSubmit} className="custom-date-row">
                    <div className="custom-date-inputs">
                        <input
                            type="date"
                            name="from"
                            defaultValue={fromDate}
                            className="custom-date-input"
                        />
                        <span className="custom-date-sep">ate</span>
                        <input
                            type="date"
                            name="to"
                            defaultValue={toDate}
                            className="custom-date-input"
                        />
                    </div>
                    <button type="submit" className="custom-date-submit">
                        <Filter size={13} />
                        Filtrar
                    </button>
                </form>
            )}
        </div>
    )
}
