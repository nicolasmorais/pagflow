'use client'

import React from 'react'
import { Package, CreditCard, Factory, Truck, Bike, CheckCircle2, XCircle } from 'lucide-react'

interface Step {
    key: string
    label: string
    icon: React.ElementType
    matchStatuses: string[]
}

const STEPS: Step[] = [
    { key: 'created', label: 'Pedido Realizado', icon: Package, matchStatuses: ['pendente'] },
    { key: 'paid', label: 'Pagamento Confirmado', icon: CreditCard, matchStatuses: ['processando', 'pago'] },
    { key: 'production', label: 'Em Separação', icon: Factory, matchStatuses: ['aguardando_envio'] },
    { key: 'shipped', label: 'Enviado', icon: Truck, matchStatuses: ['enviado', 'cl_shopee', 'rastreio_enviado'] },
    { key: 'transit', label: 'Saiu para Entrega', icon: Bike, matchStatuses: [] },
    { key: 'delivered', label: 'Entregue', icon: CheckCircle2, matchStatuses: ['entregue'] },
]

function getActiveIndex(status: string, paymentStatus?: string): number {
    const s = (status || '').toLowerCase()
    const ps = (paymentStatus || '').toLowerCase()

    // Check each step's matchStatuses in reverse to find highest match
    for (let i = STEPS.length - 1; i >= 0; i--) {
        if (STEPS[i].matchStatuses.includes(s)) return i
    }
    // If payment is confirmed but status is still pendente
    if (['pago', 'aprovado'].includes(ps) && s === 'pendente') return 1
    return 0
}

function getStepDate(index: number, createdAt: string, paidAt?: string | null, shippedAt?: string | null, deliveredAt?: string | null): string | null {
    const dates = [createdAt, paidAt, paidAt, shippedAt, shippedAt, deliveredAt]
    const d = dates[index]
    if (!d) return null
    return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

interface Props {
    status: string
    paymentStatus?: string
    createdAt: string
    paidAt?: string | null
    shippedAt?: string | null
    deliveredAt?: string | null
}

export default function AdminStatusTimeline({ status, paymentStatus, createdAt, paidAt, shippedAt, deliveredAt }: Props) {
    const activeIndex = getActiveIndex(status, paymentStatus)
    const isCancelled = ['cancelado', 'CANCELLED'].includes(status)

    if (isCancelled) {
        return (
            <div style={cancelledStyle}>
                <XCircle size={20} color="#B23B32" />
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#B23B32' }}>Pedido Cancelado</span>
            </div>
        )
    }

    return (
        <div style={containerStyle}>
            {STEPS.map((step, i) => {
                const isCompleted = i <= activeIndex
                const isCurrent = i === activeIndex
                const Icon = step.icon
                const date = getStepDate(i, createdAt, paidAt, shippedAt, deliveredAt)

                return (
                    <div key={step.key} style={stepStyle}>
                        {/* Connector line */}
                        {i < STEPS.length - 1 && (
                            <div style={{
                                ...connectorStyle,
                                background: isCompleted && i < activeIndex
                                    ? 'linear-gradient(90deg, #6366f1, #8b5cf6)'
                                    : '#E5E7EF',
                            }} />
                        )}

                        {/* Circle */}
                        <div style={{
                            ...circleStyle,
                            background: isCompleted
                                ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                                : '#F5F6F9',
                            border: isCompleted ? 'none' : '2px solid #E5E7EF',
                            boxShadow: isCurrent ? '0 0 0 3px rgba(99,102,241,0.2)' : 'none',
                            transform: isCurrent ? 'scale(1.1)' : 'scale(1)',
                        }}>
                            <Icon size={14} color={isCompleted ? '#fff' : '#9ca3af'} strokeWidth={2.2} />
                        </div>

                        {/* Label */}
                        <div style={labelContainerStyle}>
                            <span style={{
                                ...labelStyle,
                                color: isCompleted ? '#14151F' : '#9ca3af',
                                fontWeight: isCurrent ? 800 : 600,
                            }}>
                                {step.label}
                            </span>
                            {date && isCompleted && (
                                <span style={dateStyle}>{date}</span>
                            )}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '0',
    position: 'relative',
    padding: '4px 0',
}

const stepStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    position: 'relative',
    paddingBottom: '20px',
}

const connectorStyle: React.CSSProperties = {
    position: 'absolute',
    left: '15px',
    top: '32px',
    width: '2px',
    height: 'calc(100% - 32px)',
    borderRadius: '1px',
    zIndex: 0,
}

const circleStyle: React.CSSProperties = {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transition: 'all 0.3s ease',
    zIndex: 1,
}

const labelContainerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '1px',
}

const labelStyle: React.CSSProperties = {
    fontSize: '13px',
    transition: 'color 0.3s',
}

const dateStyle: React.CSSProperties = {
    fontSize: '11px',
    color: '#9ca3af',
    fontWeight: 500,
}

const cancelledStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '14px 16px',
    background: '#FEF2F2',
    borderRadius: '10px',
    border: '1px solid #FECACA',
}
