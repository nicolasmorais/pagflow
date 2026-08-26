'use client'

import { useState } from 'react'
import TrackingTimeline from './TrackingTimeline'

interface OrderData {
  id: string
  status: string
  trackingCode: string | null
  trackingUrl: string | null
  fullName: string | null
  totalPrice: number
  createdAt: string
  paidAt: string | null
  shippedAt: string | null
  deliveredAt: string | null
  product: { name: string; price: number; imageUrl: string | null } | null
}

export default function TrackingSearch() {
  const [orderId, setOrderId] = useState('')
  const [identifier, setIdentifier] = useState('')
  const [idType, setIdType] = useState<'cpf' | 'phone'>('cpf')
  const [order, setOrder] = useState<OrderData | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setOrder(null)

    if (!orderId.trim() || !identifier.trim()) {
      setError('Preencha todos os campos')
      return
    }

    setLoading(true)
    try {
      const params = new URLSearchParams({ orderId: orderId.trim() })
      if (idType === 'cpf') params.set('cpf', identifier.trim())
      else params.set('phone', identifier.trim())

      const res = await fetch(`/api/rastrear?${params}`)
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Erro ao buscar pedido')
        return
      }

      setOrder(data.order)
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {!order ? (
        <form onSubmit={handleSearch} style={formStyle}>
          <div style={fieldGroupStyle}>
            <label style={labelStyle}>ID do Pedido</label>
            <input
              type="text"
              value={orderId}
              onChange={e => setOrderId(e.target.value)}
              placeholder="Cole o ID do pedido aqui"
              style={inputStyle}
            />
          </div>

          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Identificação</label>
            <div style={idRowStyle}>
              <select
                value={idType}
                onChange={e => setIdType(e.target.value as 'cpf' | 'phone')}
                style={selectStyle}
              >
                <option value="cpf">CPF</option>
                <option value="phone">Telefone</option>
              </select>
              <input
                type="text"
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                placeholder={idType === 'cpf' ? '000.000.000-00' : '(00) 00000-0000'}
                style={{ ...inputStyle, flex: 1 }}
              />
            </div>
          </div>

          {error && <div style={errorStyle}>{error}</div>}

          <button type="submit" disabled={loading} style={buttonStyle}>
            {loading ? 'Buscando...' : 'Rastrear Pedido'}
          </button>
        </form>
      ) : (
        <div>
          <button onClick={() => { setOrder(null); setError('') }} style={backBtnStyle}>
            ← Nova busca
          </button>
          <div style={orderHeaderStyle}>
            <div>
              <span style={orderNumStyle}>Pedido #{order.id.slice(0, 8).toUpperCase()}</span>
              <span style={customerNameStyle}>{order.fullName || 'Cliente'}</span>
            </div>
            <span style={totalStyle}>
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.totalPrice)}
            </span>
          </div>

          <TrackingTimeline
            status={order.status}
            createdAt={order.createdAt}
            paidAt={order.paidAt}
            shippedAt={order.shippedAt}
            deliveredAt={order.deliveredAt}
            trackingCode={order.trackingCode}
            trackingUrl={order.trackingUrl}
          />

          {order.product && (
            <div style={itemsCardStyle}>
              <h3 style={itemsTitleStyle}>Produto</h3>
              <div style={itemRowStyle}>
                <span style={itemNameStyle}>{order.product.name}</span>
                <span style={itemQtyStyle}>
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.product.price)}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const formStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
}

const fieldGroupStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
}

const labelStyle: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 600,
  color: '#374151',
}

const inputStyle: React.CSSProperties = {
  padding: '14px 16px',
  borderRadius: '12px',
  border: '2px solid #e5e7eb',
  fontSize: '16px',
  outline: 'none',
  transition: 'border-color 0.2s',
  backgroundColor: '#fff',
}

const selectStyle: React.CSSProperties = {
  padding: '14px 12px',
  borderRadius: '12px',
  border: '2px solid #e5e7eb',
  fontSize: '14px',
  outline: 'none',
  backgroundColor: '#fff',
  minWidth: '110px',
}

const idRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: '10px',
}

const buttonStyle: React.CSSProperties = {
  padding: '16px',
  borderRadius: '12px',
  border: 'none',
  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 700,
  cursor: 'pointer',
  transition: 'transform 0.2s, box-shadow 0.2s',
}

const errorStyle: React.CSSProperties = {
  padding: '12px 16px',
  borderRadius: '10px',
  background: '#fef2f2',
  color: '#dc2626',
  fontSize: '14px',
  fontWeight: 500,
}

const backBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: '#6366f1',
  fontSize: '15px',
  fontWeight: 600,
  cursor: 'pointer',
  marginBottom: '20px',
  padding: 0,
}

const orderHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '24px',
  padding: '20px',
  background: '#f9fafb',
  borderRadius: '14px',
}

const orderNumStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '20px',
  fontWeight: 800,
  color: '#111827',
}

const customerNameStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '14px',
  color: '#6b7280',
  marginTop: '4px',
}

const totalStyle: React.CSSProperties = {
  fontSize: '22px',
  fontWeight: 800,
  color: '#059669',
}

const itemsCardStyle: React.CSSProperties = {
  marginTop: '24px',
  padding: '20px',
  background: '#f9fafb',
  borderRadius: '14px',
}

const itemsTitleStyle: React.CSSProperties = {
  fontSize: '16px',
  fontWeight: 700,
  color: '#111827',
  marginBottom: '12px',
}

const itemRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  padding: '8px 0',
  borderBottom: '1px solid #e5e7eb',
}

const itemNameStyle: React.CSSProperties = {
  fontSize: '14px',
  color: '#374151',
}

const itemQtyStyle: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 600,
  color: '#6b7280',
}
