const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

interface SalesCardProps {
    currentCount: number
    currentRevenue: number
    previousCount: number
    previousRevenue: number
    comparisonLabel: string
}

export default function SalesCard({
    currentCount,
    currentRevenue,
    previousCount,
    previousRevenue,
    comparisonLabel,
}: SalesCardProps) {
    const growth = previousCount > 0
        ? ((currentCount - previousCount) / previousCount) * 100
        : currentCount > 0 ? 100 : 0

    const hasGrowth = previousCount > 0 || currentCount > 0

    return (
        <div style={{
            background: '#fff',
            border: '1px solid #E5E7EF',
            borderRadius: '14px',
            padding: '16px 18px',
        }}>
            <p style={{ fontSize: '10.5px', fontWeight: 700, color: '#6E7180', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Vendas
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <p style={{ fontSize: '22px', fontWeight: 700, color: '#14151F', margin: 0, letterSpacing: '-0.03em', fontFamily: "'Fraunces', serif" }}>
                    {currentCount}
                </p>
                {hasGrowth && previousCount > 0 && (
                    <span style={{
                        fontSize: '11px', fontWeight: 700,
                        color: growth >= 0 ? '#1E7A52' : '#B23B32',
                        background: growth >= 0 ? '#E3F4EA' : '#FBEAE8',
                        padding: '3px 8px', borderRadius: '7px',
                    }}>
                        {growth >= 0 ? '+' : ''}{growth.toFixed(0)}%
                    </span>
                )}
                {previousCount === 0 && currentCount > 0 && (
                    <span style={{
                        fontSize: '11px', fontWeight: 700,
                        color: '#1E7A52',
                        background: '#E3F4EA',
                        padding: '3px 8px', borderRadius: '7px',
                    }}>
                        Novo
                    </span>
                )}
            </div>
            {currentCount > 0 && (
                <p style={{ fontSize: '11px', color: '#6E7180', margin: '4px 0 0', fontWeight: 500 }}>
                    R$ {fmt(currentRevenue)}
                </p>
            )}
            <p style={{ fontSize: '11px', color: '#9CA0AE', margin: '2px 0 0', fontWeight: 500 }}>
                {currentCount} vs {previousCount} vendas
            </p>
            <p style={{ fontSize: '11px', color: '#6E7180', margin: '2px 0 0', fontWeight: 500 }}>
                {comparisonLabel}
            </p>
        </div>
    )
}
