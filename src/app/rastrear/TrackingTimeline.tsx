'use client'

interface TimelineStep {
  key: string
  label: string
  icon: string
  description: string
}

const STEPS: TimelineStep[] = [
  { key: 'created', label: 'Pedido Realizado', icon: '📦', description: 'Seu pedido foi recebido com sucesso' },
  { key: 'paid', label: 'Pagamento Confirmado', icon: '💳', description: 'Pagamento aprovado e processado' },
  { key: 'production', label: 'Em Separação', icon: '🏭', description: 'Seu pedido está sendo preparado' },
  { key: 'shipped', label: 'Enviado', icon: '🚚', description: 'Pedido despachado para entrega' },
  { key: 'delivery', label: 'Saiu para Entrega', icon: '🏍️', description: 'Pedido a caminho do endereço' },
  { key: 'delivered', label: 'Entregue', icon: '✅', description: 'Pedido entregue com sucesso' },
]

// Map PagFlow status to timeline step index
function getActiveStepIndex(status: string): number {
  const s = (status || '').toLowerCase()
  const map: Record<string, number> = {
    pendente: 0,
    processando: 1,
    pago: 1,
    aguardando_envio: 2,
    cl_shopee: 3,
    enviado: 3,
    rastreio_enviado: 4,
    entregue: 5,
    cancelado: -1,
  }
  return map[s] ?? 0
}

function detectCarrier(code: string): { name: string; color: string } | null {
  if (!code) return null
  const clean = code.replace(/\s/g, '').toUpperCase()
  // Correios: 2 letters + 9 digits + 2 letters (e.g., AB123456789BR)
  if (/^[A-Z]{2}\d{9}[A-Z]{2}$/.test(clean)) return { name: 'Correios', color: '#fbbf24' }
  // Jadlog
  if (/^\d{14}$/.test(clean)) return { name: 'Jadlog', color: '#3b82f6' }
  // Total Express
  if (/^TE\d+/.test(clean)) return { name: 'Total Express', color: '#10b981' }
  // Generic
  return { name: 'Transportadora', color: '#8b5cf6' }
}

interface Props {
  status: string
  createdAt: string
  paidAt: string | null
  shippedAt: string | null
  deliveredAt: string | null
  trackingCode: string | null
  trackingUrl: string | null
}

export default function TrackingTimeline({
  status,
  createdAt,
  paidAt,
  shippedAt,
  deliveredAt,
  trackingCode,
  trackingUrl,
}: Props) {
  const activeIndex = getActiveStepIndex(status)
  const carrier = trackingCode ? detectCarrier(trackingCode) : null
  const isCancelled = (status || '').toLowerCase() === 'cancelado'

  function getStepDate(key: string): string | null {
    const dateMap: Record<string, string | null> = {
      created: createdAt,
      paid: paidAt,
      production: paidAt,
      shipped: shippedAt,
      delivery: shippedAt,
      delivered: deliveredAt,
    }
    const d = dateMap[key]
    if (!d) return null
    return new Date(d).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (isCancelled) {
    return (
      <div style={cancelledCardStyle}>
        <span style={{ fontSize: '48px' }}>❌</span>
        <h3 style={{ margin: '12px 0 4px', color: '#dc2626', fontSize: '18px' }}>
          Pedido {status === 'CANCELLED' ? 'Cancelado' : 'Reembolsado'}
        </h3>
        <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>
          Entre em contato com o suporte para mais informações
        </p>
      </div>
    )
  }

  return (
    <div style={timelineContainerStyle}>
      {STEPS.map((step, i) => {
        const isCompleted = i <= activeIndex
        const isCurrent = i === activeIndex
        const date = getStepDate(step.key)

        return (
          <div key={step.key} style={stepRowStyle}>
            {/* Vertical line connector */}
            {i < STEPS.length - 1 && (
              <div
                style={{
                  ...connectorStyle,
                  background: isCompleted
                    ? 'linear-gradient(180deg, #6366f1, #8b5cf6)'
                    : '#e5e7eb',
                }}
              />
            )}

            {/* Circle icon */}
            <div
              style={{
                ...circleStyle,
                background: isCompleted
                  ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                  : '#f3f4f6',
                boxShadow: isCurrent ? '0 0 0 4px rgba(99,102,241,0.25)' : 'none',
                transform: isCurrent ? 'scale(1.15)' : 'scale(1)',
              }}
            >
              <span style={{ fontSize: '18px', filter: isCompleted ? 'none' : 'grayscale(1) opacity(0.4)' }}>
                {step.icon}
              </span>
            </div>

            {/* Content */}
            <div style={stepContentStyle}>
              <span
                style={{
                  ...stepLabelStyle,
                  color: isCompleted ? '#111827' : '#9ca3af',
                  fontWeight: isCurrent ? 800 : 600,
                }}
              >
                {step.label}
              </span>
              <span style={{ ...stepDescStyle, color: isCompleted ? '#6b7280' : '#d1d5db' }}>
                {step.description}
              </span>
              {date && isCompleted && (
                <span style={dateStyle}>{date}</span>
              )}
            </div>
          </div>
        )
      })}

      {/* Tracking code card */}
      {trackingCode && (
        <div style={trackingCardStyle}>
          <div style={trackingHeaderStyle}>
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#374151' }}>
              📋 Código de Rastreio
            </span>
            {carrier && (
              <span style={{ ...carrierBadgeStyle, background: carrier.color + '20', color: carrier.color }}>
                {carrier.name}
              </span>
            )}
          </div>
          <span style={trackingCodeStyle}>{trackingCode}</span>
          {trackingUrl && (
            <a href={trackingUrl} target="_blank" rel="noopener noreferrer" style={trackLinkStyle}>
              Rastrear no site da transportadora →
            </a>
          )}
        </div>
      )}
    </div>
  )
}

const timelineContainerStyle: React.CSSProperties = {
  position: 'relative',
  padding: '0 8px',
}

const stepRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '16px',
  position: 'relative',
  paddingBottom: '32px',
}

const connectorStyle: React.CSSProperties = {
  position: 'absolute',
  left: '23px',
  top: '48px',
  width: '3px',
  height: 'calc(100% - 48px)',
  borderRadius: '2px',
  zIndex: 0,
}

const circleStyle: React.CSSProperties = {
  width: '48px',
  height: '48px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  transition: 'all 0.3s ease',
  zIndex: 1,
}

const stepContentStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
  paddingTop: '4px',
}

const stepLabelStyle: React.CSSProperties = {
  fontSize: '15px',
  transition: 'color 0.3s',
}

const stepDescStyle: React.CSSProperties = {
  fontSize: '13px',
  transition: 'color 0.3s',
}

const dateStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#9ca3af',
  marginTop: '2px',
}

const cancelledCardStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '40px 20px',
  background: '#fef2f2',
  borderRadius: '16px',
  textAlign: 'center',
}

const trackingCardStyle: React.CSSProperties = {
  marginTop: '8px',
  padding: '20px',
  background: 'linear-gradient(135deg, #f0f0ff, #f5f3ff)',
  borderRadius: '14px',
  border: '1px solid #e0e7ff',
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
}

const trackingHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
}

const carrierBadgeStyle: React.CSSProperties = {
  padding: '4px 10px',
  borderRadius: '20px',
  fontSize: '12px',
  fontWeight: 700,
}

const trackingCodeStyle: React.CSSProperties = {
  fontSize: '18px',
  fontWeight: 800,
  color: '#111827',
  fontFamily: 'monospace',
  letterSpacing: '1px',
}

const trackLinkStyle: React.CSSProperties = {
  color: '#6366f1',
  fontSize: '14px',
  fontWeight: 600,
  textDecoration: 'none',
}
