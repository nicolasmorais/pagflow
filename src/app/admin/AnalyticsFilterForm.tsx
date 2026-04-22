'use client'

import { Filter } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'

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

    function handleSelectChange(e: React.ChangeEvent<HTMLSelectElement>) {
        const params = new URLSearchParams(searchParams.toString())
        params.set('filter', e.target.value)
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

    return (
        <form method="get" className="filter-form responsive-filter-row">
            <div className="status-fixed-group">
                {showStatus && (
                    <>
                        <div
                            onClick={() => handleStatusClick('pago')}
                            className="status-btn pago-btn"
                            style={{
                                height: '44px',
                                padding: '0 16px',
                                borderRadius: '12px',
                                background: currentStatus === 'pago' ? '#22c55e' : '#f8fafc',
                                color: currentStatus === 'pago' ? 'white' : '#166534',
                                border: '1px solid ' + (currentStatus === 'pago' ? '#22c55e' : '#e2e8f0'),
                                fontSize: '11px',
                                fontWeight: 800,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                minWidth: '70px',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            Pago
                        </div>

                        <div
                            onClick={() => handleStatusClick('aguardando')}
                            className="status-btn aguardando-btn"
                            style={{
                                height: '44px',
                                padding: '0 16px',
                                borderRadius: '12px',
                                background: currentStatus === 'aguardando' ? '#d97706' : '#f8fafc',
                                color: currentStatus === 'aguardando' ? 'white' : '#b45309',
                                border: '1px solid ' + (currentStatus === 'aguardando' ? '#d97706' : '#e2e8f0'),
                                fontSize: '11px',
                                fontWeight: 800,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                minWidth: '85px',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            Aguardando
                        </div>

                        <div
                            onClick={() => handleStatusClick('recusado')}
                            className="status-btn recusado-btn"
                            style={{
                                height: '44px',
                                padding: '0 16px',
                                borderRadius: '12px',
                                background: currentStatus === 'recusado' ? '#dc2626' : '#f8fafc',
                                color: currentStatus === 'recusado' ? 'white' : '#991b1b',
                                border: '1px solid ' + (currentStatus === 'recusado' ? '#dc2626' : '#e2e8f0'),
                                fontSize: '11px',
                                fontWeight: 800,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                minWidth: '85px',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            Recusado
                        </div>
                    </>
                )}

                <select
                    name="filter"
                    defaultValue={currentFilter}
                    onChange={handleSelectChange}
                    className="fixed-dates-select"
                    style={{
                        height: '44px',
                        padding: '0 10px',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        fontSize: '13px',
                        fontWeight: 600,
                        color: '#334155',
                        background: '#f8fafc',
                        outline: 'none',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                        minWidth: '130px'
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
            </div>

            <div className="custom-date-container" style={{
                display: 'flex',
                gap: '6px',
                alignItems: 'center',
                height: '44px',
                background: '#fff',
                padding: '0 10px',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                minWidth: '220px'
            }}>
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flex: 1, minWidth: 0 }}>
                    <input
                        type="date"
                        name="from"
                        defaultValue={fromDate}
                        className="minimal-date"
                        style={{ width: '100%', padding: '4px 2px', border: 'none', fontSize: '13px', background: 'transparent', color: '#475569', outline: 'none', fontFamily: 'inherit', fontWeight: 600 }}
                    />
                    <span style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: 600 }}>/</span>
                    <input
                        type="date"
                        name="to"
                        defaultValue={toDate}
                        className="minimal-date"
                        style={{ width: '100%', padding: '4px 2px', border: 'none', fontSize: '13px', background: 'transparent', color: '#475569', outline: 'none', fontFamily: 'inherit', fontWeight: 600 }}
                    />
                </div>

                <div style={{ width: '1px', height: '16px', background: '#e2e8f0', margin: '0 4px' }} />

                <button
                    type="submit"
                    className="filter-submit-btn"
                    style={{
                        padding: '8px 12px',
                        background: '#f1f5f9',
                        color: '#475569',
                        border: 'none',
                        borderRadius: '8px',
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
                    <Filter size={14} />
                    Filtrar
                </button>
            </div>
        </form>
    )
}
