import type { Metadata } from 'next'
import TrackingSearch from './TrackingSearch'

export const metadata: Metadata = {
  title: 'Rastrear Pedido',
  description: 'Acompanhe o status do seu pedido em tempo real',
}

export default function RastrearPage() {
  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        <div style={headerStyle}>
          <div style={logoStyle}>📦</div>
          <h1 style={titleStyle}>Rastrear Pedido</h1>
          <p style={subtitleStyle}>
            Acompanhe o status do seu pedido em tempo real
          </p>
        </div>

        <div style={cardStyle}>
          <TrackingSearch />
        </div>

        <p style={footerTextStyle}>
          Não encontrou seu pedido? Verifique se o código de rastreio está correto.
        </p>
      </div>
    </div>
  )
}

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  background: 'linear-gradient(135deg, #f8fafc 0%, #eef2ff 50%, #f0f0ff 100%)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '40px 20px',
  fontFamily: "'Inter', 'Segoe UI', sans-serif",
}

const containerStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '520px',
}

const headerStyle: React.CSSProperties = {
  textAlign: 'center',
  marginBottom: '32px',
}

const logoStyle: React.CSSProperties = {
  fontSize: '48px',
  marginBottom: '12px',
}

const titleStyle: React.CSSProperties = {
  fontSize: '28px',
  fontWeight: 800,
  color: '#111827',
  margin: '0 0 8px',
}

const subtitleStyle: React.CSSProperties = {
  fontSize: '15px',
  color: '#6b7280',
  margin: 0,
}

const cardStyle: React.CSSProperties = {
  background: '#fff',
  borderRadius: '20px',
  padding: '32px',
  boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
  border: '1px solid #e5e7eb',
}

const footerTextStyle: React.CSSProperties = {
  textAlign: 'center',
  fontSize: '13px',
  color: '#9ca3af',
  marginTop: '20px',
}
