'use client'

export default function ConversionCard({ rate, paidCount, totalCount }: {
    rate: number
    paidCount: number
    totalCount: number
}) {
    return (
        <div style={{
            background: '#fff',
            border: '1px solid #E5E7EF',
            borderRadius: '14px',
            padding: '16px 18px',
        }}>
            <p style={{ fontSize: '10.5px', fontWeight: 700, color: '#6E7180', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Conversão
            </p>
            <p style={{ fontSize: '22px', fontWeight: 700, color: '#14151F', margin: 0, letterSpacing: '-0.03em', fontFamily: "'Fraunces', serif" }}>
                {rate.toFixed(0)}%
            </p>
            <p style={{ fontSize: '11px', color: '#6E7180', margin: '4px 0 0', fontWeight: 500 }}>
                {paidCount} pagos de {totalCount} pedidos
            </p>
        </div>
    )
}
