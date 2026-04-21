import { prisma } from '@/lib/prisma'
import {
    ChevronLeft, Trash2, Package, Phone, Mail,
    MapPin, CreditCard, User, CheckCircle2, Clock, Truck, ReceiptText, Target
} from 'lucide-react'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { deleteOrder } from '../../../actions'
import EmailSection from './EmailSection'
import TrackingManagement from './TrackingManagement'

const STATUS_CONFIG: Record<string, { bg: string; color: string; dot: string; border: string; label: string }> = {
    pago: { bg: '#dcfce7', color: '#15803d', dot: '#16a34a', border: '#bbf7d0', label: 'Pago' },
    recusado: { bg: '#fee2e2', color: '#b91c1c', dot: '#dc2626', border: '#fecaca', label: 'Recusado' },
    reembolsado: { bg: '#eff6ff', color: '#1d4ed8', dot: '#2563eb', border: '#bfdbfe', label: 'Reembolsado' },
    aguardando: { bg: '#fef3c7', color: '#92400e', dot: '#d97706', border: '#fde68a', label: 'Aguardando' },
    processando: { bg: '#fef3c7', color: '#92400e', dot: '#d97706', border: '#fde68a', label: 'Aguardando' },
    atendido: { bg: '#dcfce7', color: '#15803d', dot: '#16a34a', border: '#bbf7d0', label: 'Atendido' },
    cancelado: { bg: '#fee2e2', color: '#b91c1c', dot: '#dc2626', border: '#fecaca', label: 'Cancelado' },
}
const getStatus = (s: string) => STATUS_CONFIG[s?.toLowerCase()] ?? STATUS_CONFIG.processando

const formatBRL = (v: number) =>
    v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const order = await prisma.order.findUnique({ where: { id }, include: { product: true } })
    if (!order) notFound()

    const ps = order.paymentStatus || 'processando'
    const sc = getStatus(ps)
    const hasSent = !!(order.trackingCode || order.trackingUrl)

    // Stepper steps
    const step2Color = sc.dot
    const step3Color = hasSent ? '#16a34a' : '#cbd5e1'
    const step3Bg = hasSent ? '#dcfce7' : '#f1f5f9'
    const step3Text = hasSent ? '#15803d' : '#94a3b8'
    const line2Bg = hasSent ? '#16a34a' : '#e2e8f0'

    return (
        <div className="pedido-page">

            {/* ── Back link ── */}
            <Link href="/admin/pedidos" className="pedido-back-link">
                <ChevronLeft size={15} strokeWidth={2.5} />
                Voltar para pedidos
            </Link>

            {/* ── Header ── */}
            <div className="pedido-header-card">
                <div className="pedido-header-left">
                    <div style={{
                        width: '44px', height: '44px', borderRadius: '13px',
                        background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0, boxShadow: '0 4px 14px rgba(99,102,241,0.3)'
                    }}>
                        <ReceiptText size={20} color="white" strokeWidth={2} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: 'clamp(1rem, 4vw, 1.3rem)', fontWeight: 900, color: '#1e293b', margin: 0, letterSpacing: '-0.02em' }}>
                            Pedido{' '}
                            <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#6366f1', fontSize: '0.9em', background: '#eef2ff', padding: '2px 8px', borderRadius: '6px' }}>
                                #{order.id.slice(0, 8).toUpperCase()}
                            </span>
                        </h1>
                        <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>
                            {new Date(order.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                            {' às '}
                            {new Date(order.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                    </div>
                </div>
                <div className="pedido-header-right">
                    <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                        background: sc.bg, color: sc.color, border: `1.5px solid ${sc.border}`,
                        padding: '5px 13px', borderRadius: '10px',
                        fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap'
                    }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: sc.dot, flexShrink: 0 }} />
                        {sc.label}
                    </span>
                    <form action={async () => {
                        'use server'
                        await deleteOrder(id)
                        redirect('/admin/pedidos')
                    }}>
                        <button type="submit" className="pedido-delete-btn">
                            <Trash2 size={14} />
                            <span>Excluir</span>
                        </button>
                    </form>
                </div>
            </div>

            {/* ── Info Grid ── */}
            <div className="pedido-info-grid">

                {/* Cliente */}
                <div className="pedido-card">
                    <div className="pedido-card-header">
                        <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <User size={14} color="#3b82f6" />
                        </div>
                        <span className="pedido-card-title">Cliente</span>
                    </div>
                    <div className="pedido-card-body">
                        <p style={{ margin: '0 0 6px', fontWeight: 800, color: '#1e293b', fontSize: '15px' }}>{order.fullName || 'Cliente sem nome'}</p>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', marginBottom: '5px' }}>
                            <Mail size={12} color="#94a3b8" style={{ marginTop: '2px', flexShrink: 0 }} />
                            <span style={{ color: '#64748b', fontSize: '13px', wordBreak: 'break-all' }}>{order.email}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '5px' }}>
                            <Phone size={12} color="#94a3b8" />
                            <span style={{ color: '#64748b', fontSize: '13px' }}>{order.phone || 'Sem telefone'}</span>
                        </div>
                        {order.cpf && (
                            <div style={{ marginTop: '8px', display: 'inline-block', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '7px', padding: '3px 9px' }}>
                                <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700 }}>CPF: </span>
                                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>{order.cpf}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Pagamento */}
                <div className="pedido-card">
                    <div className="pedido-card-header">
                        <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <CreditCard size={14} color="#10b981" />
                        </div>
                        <span className="pedido-card-title">Pagamento</span>
                    </div>
                    <div className="pedido-card-body">
                        {/* Method */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                            {order.paymentMethod === 'pix' ? (
                                <span style={{ fontSize: '11px', fontWeight: 800, color: '#059669', background: '#ecfdf5', padding: '4px 10px', borderRadius: '8px', border: '1px solid #a7f3d0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    ❖ PIX
                                </span>
                            ) : (
                                <span style={{ fontSize: '11px', fontWeight: 800, color: '#3b82f6', background: '#eff6ff', padding: '4px 10px', borderRadius: '8px', border: '1px solid #bfdbfe', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    💳 {order.cardBrand ? order.cardBrand.toUpperCase() : 'CARTÃO'}
                                </span>
                            )}
                        </div>
                        {order.installments && (
                            <p style={{ margin: '0 0 10px', color: '#64748b', fontSize: '12px', fontWeight: 600 }}>
                                {order.installments}x de R$ {formatBRL(order.installmentAmount || 0)}
                            </p>
                        )}
                        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                            <p style={{ margin: '0 0 2px', color: '#94a3b8', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total</p>
                            <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#059669', letterSpacing: '-0.03em' }}>
                                R$ {formatBRL(order.totalPrice || 0)}
                            </p>
                        </div>
                        {order.paymentStatus === 'pago' && order.netReceived && (
                            <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 800, background: '#f0fdf4', padding: '3px 9px', borderRadius: '7px', border: '1px solid #a7f3d0' }}>
                                    Líq. R$ {formatBRL(order.netReceived)}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Entrega */}
                <div className="pedido-card">
                    <div className="pedido-card-header">
                        <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <MapPin size={14} color="#f97316" />
                        </div>
                        <span className="pedido-card-title">Entrega</span>
                    </div>
                    <div className="pedido-card-body">
                        <p style={{ margin: '0 0 8px', fontWeight: 800, color: '#1e293b', fontSize: '14px' }}>
                            {order.recipient || order.fullName}
                        </p>
                        <p style={{ margin: 0, color: '#64748b', fontSize: '13px', lineHeight: 1.75 }}>
                            {order.rua}, {order.numero}
                            {order.complemento && ` — ${order.complemento}`}<br />
                            {order.bairro}<br />
                            {order.cidade} / {order.estado}<br />
                            <span style={{ fontWeight: 700, color: '#94a3b8' }}>CEP: </span>{order.cep}
                        </p>
                        {(order as any).referencia && (
                            <p style={{ margin: '8px 0 0', fontSize: '12px', color: '#94a3b8', fontStyle: 'italic', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '7px', padding: '5px 9px' }}>
                                Ref: {(order as any).referencia}
                            </p>
                        )}
                    </div>
                </div>

                {/* Origem do Pedido (UTMs) */}
                <div className="pedido-card">
                    <div className="pedido-card-header">
                        <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Target size={14} color="#7c3aed" />
                        </div>
                        <span className="pedido-card-title">Origem do Pedido</span>
                    </div>
                    <div className="pedido-card-body">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <UtmItem label="Source" value={order.utmSource} color="#7c3aed" />
                            <UtmItem label="Medium" value={order.utmMedium} color="#8b5cf6" />
                            <UtmItem label="Campaign" value={order.utmCampaign} color="#a78bfa" />
                            <UtmItem label="Content" value={order.utmContent} color="#c4b5fd" />
                            <UtmItem label="Term" value={order.utmTerm} color="#ddd6fe" />
                            <UtmItem label="Placement" value={order.utmPlacement} color="#7c3aed" />
                            <UtmItem label="Campaign ID/Name" value={order.utmId} color="#8b5cf6" />
                            <UtmItem label="Creative" value={order.utmCreativeName} color="#a78bfa" />
                            {!order.utmSource && !order.utmMedium && (
                                <p style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic', margin: 0 }}>
                                    Nenhum dado de rastreamento disponível.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Status Stepper ── */}
            <div className="pedido-card" style={{ marginBottom: '16px' }}>
                <div className="pedido-card-header">
                    <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Clock size={14} color="#6366f1" />
                    </div>
                    <span className="pedido-card-title">Status do Pedido</span>
                </div>
                <div className="pedido-card-body">
                    <div className="pedido-stepper">
                        {/* Step 1: Criado */}
                        <div className="pedido-step">
                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 3px 10px rgba(22,163,74,0.3)' }}>
                                <CheckCircle2 size={18} color="white" />
                            </div>
                            <span style={{ fontSize: '11px', fontWeight: 700, color: '#16a34a', marginTop: '6px', textAlign: 'center' }}>Criado</span>
                        </div>

                        <div className="pedido-step-line" style={{ background: '#16a34a' }} />

                        {/* Step 2: Pagamento */}
                        <div className="pedido-step">
                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: step2Color, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 3px 10px ${step2Color}40` }}>
                                {order.paymentStatus === 'recusado' || order.paymentStatus === 'cancelado'
                                    ? <span style={{ fontSize: '16px', color: 'white', fontWeight: 900 }}>✕</span>
                                    : order.paymentStatus === 'pago' || order.paymentStatus === 'atendido'
                                        ? <CheckCircle2 size={18} color="white" />
                                        : <span style={{ fontSize: '14px', color: 'white', fontWeight: 900 }}>···</span>
                                }
                            </div>
                            <span style={{ fontSize: '11px', fontWeight: 700, color: step2Color, marginTop: '6px', textAlign: 'center', textTransform: 'uppercase' }}>
                                {sc.label}
                            </span>
                        </div>

                        <div className="pedido-step-line" style={{ background: line2Bg }} />

                        {/* Step 3: Enviado */}
                        <div className="pedido-step">
                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: step3Bg, border: `2px solid ${step3Color}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Truck size={17} color={step3Text} />
                            </div>
                            <span style={{ fontSize: '11px', fontWeight: 700, color: step3Text, marginTop: '6px', textAlign: 'center' }}>Enviado</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Product ── */}
            <div className="pedido-card" style={{ marginBottom: '16px' }}>
                <div className="pedido-card-header">
                    <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#fdf4ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Package size={14} color="#a855f7" />
                    </div>
                    <span className="pedido-card-title">Produto</span>
                    <span style={{ marginLeft: 'auto', background: '#f1f5f9', padding: '2px 9px', borderRadius: '8px', fontSize: '11px', fontWeight: 800, color: '#64748b' }}>
                        1 item
                    </span>
                </div>
                <div className="pedido-card-body">
                    <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                        {order.product?.imageUrl && (
                            <div style={{ width: '58px', height: '58px', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', flexShrink: 0, background: '#f8fafc' }}>
                                <img src={order.product.imageUrl} alt={order.product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ margin: '0 0 3px', fontWeight: 800, color: '#1e293b', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {order.product?.name || 'Produto removido'}
                            </p>
                            <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>
                                SKU: {order.id.slice(0, 8).toUpperCase()}
                            </p>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <p style={{ margin: '0 0 2px', fontWeight: 900, color: '#059669', fontSize: '16px', letterSpacing: '-0.02em' }}>
                                R$ {formatBRL(order.totalPrice || 0)}
                            </p>
                            <p style={{ margin: 0, color: '#94a3b8', fontSize: '11px', fontWeight: 600 }}>Qtd: 1</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Tracking & Email ── */}
            <TrackingManagement orderId={order.id} initialCode={order.trackingCode} initialUrl={order.trackingUrl} />
            <EmailSection orderId={order.id} email={order.email || ''} />

        </div>
    )
}

function UtmItem({ label, value, color }: { label: string; value?: string | null; color: string }) {
    if (!value) return null;
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '4px', borderBottom: '1px solid #f8fafc' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>{label}</span>
            <span style={{
                fontSize: '11px', fontWeight: 800, color: color,
                background: `${color}10`, padding: '2px 8px', borderRadius: '6px',
                maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
            }}>
                {value}
            </span>
        </div>
    )
}
