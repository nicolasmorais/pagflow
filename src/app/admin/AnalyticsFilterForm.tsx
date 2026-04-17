'use client'

import { Filter } from 'lucide-react'

export default function AnalyticsFilterForm({
    currentFilter,
    fromDate,
    toDate,
}: {
    currentFilter: string
    fromDate: string
    toDate: string
}) {
    function handleSelectChange(e: React.ChangeEvent<HTMLSelectElement>) {
        const form = e.currentTarget.closest('form') as HTMLFormElement
        if (form) form.submit()
    }

    return (
        <form method="get" className="filter-form" style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'stretch',
            gap: '8px',
            width: '100%',
        }}>
            <select
                name="filter"
                defaultValue={currentFilter}
                onChange={handleSelectChange}
                style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#334155',
                    background: '#f8fafc',
                    outline: 'none',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                }}
            >
                <option value="today">Hoje</option>
                <option value="yesterday">Ontem</option>
                <option value="7dias">Últimos 7 dias</option>
                <option value="30dias">Últimos 30 dias</option>
                <option value="mes">Este mês</option>
                <option value="mes-anterior">Mês anterior</option>
                <option value="vida">Todo período</option>
            </select>

            <div style={{
                display: 'flex',
                gap: '6px',
                alignItems: 'center',
                width: '100%',
                background: '#fff',
                padding: '4px 6px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
            }}>
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flex: 1, minWidth: 0 }}>
                    <input
                        type="date"
                        name="from"
                        defaultValue={fromDate}
                        className="minimal-date"
                        style={{ width: '100%', padding: '4px 2px', border: 'none', fontSize: '12px', background: 'transparent', color: '#475569', outline: 'none', fontFamily: 'inherit', fontWeight: 500 }}
                    />
                    <span style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: 600 }}>/</span>
                    <input
                        type="date"
                        name="to"
                        defaultValue={toDate}
                        className="minimal-date"
                        style={{ width: '100%', padding: '4px 2px', border: 'none', fontSize: '12px', background: 'transparent', color: '#475569', outline: 'none', fontFamily: 'inherit', fontWeight: 500 }}
                    />
                </div>

                <div style={{ width: '1px', height: '16px', background: '#e2e8f0', margin: '0 4px' }} />

                <button
                    type="submit"
                    style={{
                        padding: '6px 12px',
                        background: '#f1f5f9',
                        color: '#475569',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        fontFamily: 'inherit',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        transition: 'all 0.2s',
                        flexShrink: 0
                    }}
                    onMouseOver={e => { e.currentTarget.style.background = '#e2e8f0'; e.currentTarget.style.color = '#0f172a' }}
                    onMouseOut={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#475569' }}
                >
                    <Filter size={12} />
                    Filtrar
                </button>
            </div>
        </form>
    )
}
