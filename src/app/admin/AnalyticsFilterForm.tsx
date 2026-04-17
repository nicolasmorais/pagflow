'use client'

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
            gap: '8px',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            overflowX: 'auto',
            paddingBottom: '4px',
            scrollbarWidth: 'none'
        }}>
            <select
                name="filter"
                defaultValue={currentFilter}
                onChange={handleSelectChange}
                style={{
                    padding: '8px 12px',
                    borderRadius: '10px',
                    border: '1px solid var(--admin-border)',
                    fontSize: '13px',
                    fontWeight: 700,
                    color: 'var(--admin-text-primary)',
                    background: '#fff',
                    outline: 'none',
                    cursor: 'pointer',
                    minWidth: '155px',
                    fontFamily: 'inherit',
                    flexShrink: 0
                }}
            >
                <option value="today">Hoje</option>
                <option value="yesterday">Ontem</option>
                <option value="7dias">Últimos 7 dias</option>
                <option value="30dias">Últimos 30 dias</option>
                <option value="mes">Este mês</option>
                <option value="mes-anterior">Mês anterior</option>
                <option value="vida">Todo o período</option>
            </select>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
                <div className="custom-dates-wrapper" style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <input
                        type="date"
                        name="from"
                        defaultValue={fromDate}
                        style={{ padding: '7px 10px', borderRadius: '10px', border: '1px solid var(--admin-border)', fontSize: '13px', background: '#fff', color: 'var(--admin-text-primary)', outline: 'none', fontFamily: 'inherit' }}
                    />
                    <span style={{ fontSize: '12px', color: 'var(--admin-text-muted)', fontWeight: 600 }}>–</span>
                    <input
                        type="date"
                        name="to"
                        defaultValue={toDate}
                        style={{ padding: '7px 10px', borderRadius: '10px', border: '1px solid var(--admin-border)', fontSize: '13px', background: '#fff', color: 'var(--admin-text-primary)', outline: 'none', fontFamily: 'inherit' }}
                    />
                </div>

                <button
                    type="submit"
                    className="filter-btn"
                    style={{ padding: '8px 18px', background: 'var(--admin-accent)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit', transition: 'opacity 0.2s' }}
                >
                    Filtrar dados
                </button>
            </div>
        </form>
    )
}
