export default function AdminLoading() {
    return (
        <div style={{ paddingBottom: '40px' }}>
            <div style={{
                height: '32px',
                width: '220px',
                borderRadius: '8px',
                marginBottom: '32px',
                background: 'linear-gradient(90deg, #F0F0F3 25%, #F7F7F9 37%, #F0F0F3 63%)',
                backgroundSize: '400% 100%',
                animation: 'admin-skeleton-pulse 1.4s ease infinite',
            }} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} style={{
                        height: '96px',
                        borderRadius: '14px',
                        background: 'linear-gradient(90deg, #F0F0F3 25%, #F7F7F9 37%, #F0F0F3 63%)',
                        backgroundSize: '400% 100%',
                        animation: 'admin-skeleton-pulse 1.4s ease infinite',
                    }} />
                ))}
            </div>
            <div style={{
                height: '360px',
                borderRadius: '16px',
                background: 'linear-gradient(90deg, #F0F0F3 25%, #F7F7F9 37%, #F0F0F3 63%)',
                backgroundSize: '400% 100%',
                animation: 'admin-skeleton-pulse 1.4s ease infinite',
            }} />
            <style>{`
                @keyframes admin-skeleton-pulse {
                    0% { background-position: 100% 50%; }
                    100% { background-position: 0 50%; }
                }
            `}</style>
        </div>
    )
}
