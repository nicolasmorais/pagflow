'use client'

export default function AntiFugaFilterForm({
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
        <form method="get" style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '24px' }}>
            <select
                name="filter"
                defaultValue={currentFilter}
                onChange={handleSelectChange}
                style={{
                    padding: '8px 12px',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    fontSize: '13px',
                    fontWeight: 700,
                    color: '#1e293b',
                    background: '#fff',
                    outline: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    minWidth: '155px',
                    fontFamily: 'inherit',
                }}
            >
                <option value="today">📅 Hoje</option>
                <option value="yesterday">📅 Ontem</option>
                <option value="7dias">📅 Últimos 7 dias</option>
                <option value="30dias">📅 Últimos 30 dias</option>
                <option value="mes">📅 Este mês</option>
                <option value="mes-anterior">📅 Mês anterior</option>
                <option value="vida">📅 Todo o período</option>
            </select>

            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <input
                    type="date"
                    name="from"
                    defaultValue={fromDate}
                    style={{ padding: '7px 10px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '13px', background: '#fff', color: '#374151', outline: 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', fontFamily: 'inherit' }}
                />
                <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>–</span>
                <input
                    type="date"
                    name="to"
                    defaultValue={toDate}
                    style={{ padding: '7px 10px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '13px', background: '#fff', color: '#374151', outline: 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', fontFamily: 'inherit' }}
                />
            </div>

            <button
                type="submit"
                style={{ padding: '8px 16px', background: 'linear-gradient(135deg, #ef4444, #b91c1c)', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', boxShadow: '0 4px 12px rgba(239,68,68,0.3)', fontFamily: 'inherit' }}
            >
                Filtrar
            </button>
        </form>
    )
}
