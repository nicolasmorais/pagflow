import { prisma } from '@/lib/prisma'
import {
    ChevronLeft, Trash2, Package, Phone, Mail,
    MapPin, CreditCard, User, CheckCircle2, Clock, Truck, ReceiptText,
    DollarSign, Hash, ArrowUpRight, FileText, Gift, Globe, TruckIcon, Zap
} from 'lucide-react'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { deleteOrder } from '@/app/actions'
import EmailSection from './EmailSection'
import TrackingManagement from './TrackingManagement'
import InlineCopyBtn from './InlineCopyBtn'
import ResendPixButton from './ResendPixButton'

const STATUS_CONFIG: Record<string, { bg: string; color: string; dot: string; border: string; label: string }> = {
    pago: { bg: '#ecfdf5', color: '#059669', dot: '#10b981', border: '#a7f3d0', label: 'Pago' },
    recusado: { bg: '#fef2f2', color: '#dc2626', dot: '#ef4444', border: '#fecaca', label: 'Recusado' },
    reembolsado: { bg: '#eff6ff', color: '#2563eb', dot: '#3b82f6', border: '#bfdbfe', label: 'Reembolsado' },
    aguardando: { bg: '#fffbeb', color: '#d97706', dot: '#f59e0b', border: '#fde68a', label: 'Aguardando' },
    processando: { bg: '#fffbeb', color: '#d97706', dot: '#f59e0b', border: '#fde68a', label: 'Aguardando' },
    atendido: { bg: '#ecfdf5', color: '#059669', dot: '#10b981', border: '#a7f3d0', label: 'Atendido' },
    cancelado: { bg: '#fef2f2', color: '#dc2626', dot: '#ef4444', border: '#fecaca', label: 'Cancelado' },
}
const getStatus = (s: string) => STATUS_CONFIG[s?.toLowerCase()] ?? STATUS_CONFIG.processando

const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const order = await prisma.order.findUnique({ where: { id }, include: { product: true } })
    if (!order) notFound()

    // Buscar detalhes dos order bumps selecionados
    const bumpIds = Array.isArray(order.selectedBumps) ? order.selectedBumps as string[] : []
    const orderBumps = bumpIds.length > 0
        ? await prisma.orderBump.findMany({ where: { id: { in: bumpIds } } })
        : []
    const bumpsTotal = orderBumps.reduce((sum, b) => sum + (b.price || 0), 0)

    // Parse UTM data
    const utmFields = [
        { key: 'utmSource', label: 'Source' },
        { key: 'utmMedium', label: 'Medium' },
        { key: 'utmCampaign', label: 'Campaign' },
        { key: 'utmTerm', label: 'Term' },
        { key: 'utmContent', label: 'Content' },
        { key: 'utmPlacement', label: 'Placement' },
        { key: 'utmId', label: 'ID' },
        { key: 'utmCreativeName', label: 'Creative' },
    ] as const
    const utmData = utmFields
        .map(f => ({ label: f.label, value: (order as any)[f.key] }))
        .filter(u => u.value)

    const ps = order.paymentStatus || 'processando'
    const sc = getStatus(ps)
    const hasSent = !!(order.trackingCode || order.trackingUrl)
    const step2Color = sc.dot
    const step3Done = hasSent

    return (
        <div style={{ paddingBottom: '80px' }}>

            {/* ── Back link ── */}
            <Link href="/admin/pedidos" style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                color: '#8b95a5', fontSize: '13px', fontWeight: 600, textDecoration: 'none',
                padding: '8px 14px', borderRadius: '10px', marginBottom: '24px',
                transition: 'all 0.2s ease',
            }}>
                <ChevronLeft size={15} strokeWidth={2} />
                Voltar para pedidos
            </Link>

            {/* ── Header Card ── */}
            <div style={{
                background: 'linear-gradient(145deg, #0f172a 0%, #1e293b 100%)',
                borderRadius: '24px', padding: '32px',
                marginBottom: '20px', position: 'relative', overflow: 'hidden',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03), 0 8px 32px rgba(15, 23, 42, 0.18), inset 0 1px 0 rgba(255,255,255,0.04)',
            }}>
                {/* Ambient glow */}
                <div style={{
                    position: 'absolute', top: '-60px', right: '-40px',
                    width: '200px', height: '200px',
                    background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
                    borderRadius: '50%', pointerEvents: 'none',
                }} />
                <div style={{
                    position: 'absolute', bottom: '-40px', left: '25%',
                    width: '160px', height: '160px',
                    background: 'radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)',
                    borderRadius: '50%', pointerEvents: 'none',
                }} />

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px', position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
                        <div style={{
                            width: '56px', height: '56px', borderRadius: '18px',
                            background: 'linear-gradient(135deg, rgba(99,102,241,0.18) 0%, rgba(139,92,246,0.12) 100%)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 2px 12px rgba(99,102,241,0.1)',
                            border: '1px solid rgba(99,102,241,0.08)',
                        }}>
                            <ReceiptText size={24} color="#a5b4fc" strokeWidth={1.8} />
                        </div>
                        <div>
                            <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.04em' }}>
                                Pedido{' '}
                                <span style={{
                                    fontFamily: "'Space Grotesk', monospace", fontWeight: 600, color: '#a5b4fc', fontSize: '0.75em',
                                    background: 'rgba(99,102,241,0.12)', padding: '4px 14px', borderRadius: '8px',
                                    border: '1px solid rgba(99,102,241,0.06)',
                                    letterSpacing: '0.04em',
                                }}>
                                    #{order.id.slice(0, 8).toUpperCase()}
                                </span>
                            </h1>
                            <p style={{ margin: '8px 0 0', fontSize: '13px', color: 'rgba(255,255,255,0.35)', fontWeight: 500 }}>
                                {new Date(order.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                                {' · '}
                                {new Date(order.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '7px',
                            background: sc.bg, color: sc.color, border: `1.5px solid ${sc.border}`,
                            padding: '8px 18px', borderRadius: '10px',
                            fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
                        }}>
                            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: sc.dot, boxShadow: `0 0 8px ${sc.dot}50` }} />
                            {sc.label}
                        </span>
                        <form action={async () => {
                            'use server'
                            await deleteOrder(id)
                            redirect('/admin/pedidos')
                        }}>
                            <button type="submit" style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                padding: '9px 18px', borderRadius: '10px',
                                background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)',
                                color: '#fca5a5', fontSize: '12px', fontWeight: 600,
                                cursor: 'pointer', transition: 'all 0.2s ease',
                            }}>
                                <Trash2 size={13} strokeWidth={2} />
                                Excluir
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            {/* ── Quick Stats (KPI style) ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '20px' }}>
                <KpiStat icon={DollarSign} label="Valor Total" value={`R$ ${fmt(order.totalPrice || 0)}`} featured />
                <KpiStat icon={CreditCard} label="Pagamento" value={order.paymentMethod === 'pix' ? 'PIX' : order.cardBrand ? order.cardBrand.toUpperCase() : 'Cartão'} sub={order.installments ? `${order.installments}x de R$ ${fmt(order.installmentAmount || 0)}` : undefined} />
                <KpiStat icon={User} label="Cliente" value={order.fullName || 'Sem nome'} sub={order.email || undefined} />
                <KpiStat icon={Package} label="Produto" value={order.product?.name || 'Produto removido'} sub={orderBumps.length > 0 ? `1 produto + ${orderBumps.length} bump${orderBumps.length > 1 ? 's' : ''}` : 'Qtd: 1'} />
            </div>

            {/* ── Content Grid ── */}
            <div className="pedido-content-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

                {/* ── Left Column ── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    {/* Status Stepper */}
                    <SectionCard title="Status do Pedido" icon={Clock} iconColor="#6366f1">
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', gap: '0', padding: '12px 0 4px' }}>
                            {/* Step 1: Criado */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <div style={{
                                    width: '48px', height: '48px', borderRadius: '50%',
                                    background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    boxShadow: '0 4px 16px rgba(15,23,42,0.2)',
                                }}>
                                    <CheckCircle2 size={22} color="#fff" strokeWidth={1.8} />
                                </div>
                                <span style={{ fontSize: '11px', fontWeight: 600, color: '#0f172a', marginTop: '12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Criado</span>
                            </div>

                            <div style={{ flex: 1, height: '2px', background: '#0f172a', borderRadius: '2px', marginTop: '24px', margin: '24px 10px 0' }} />

                            {/* Step 2: Pagamento */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <div style={{
                                    width: '48px', height: '48px', borderRadius: '50%',
                                    background: step2Color, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    boxShadow: `0 4px 16px ${step2Color}30`,
                                }}>
                                    {order.paymentStatus === 'recusado' || order.paymentStatus === 'cancelado'
                                        ? <span style={{ fontSize: '20px', color: 'white', fontWeight: 900 }}>✕</span>
                                        : order.paymentStatus === 'pago' || order.paymentStatus === 'atendido'
                                            ? <CheckCircle2 size={22} color="white" strokeWidth={1.8} />
                                            : <span style={{ fontSize: '18px', color: 'white', fontWeight: 900 }}>···</span>
                                    }
                                </div>
                                <span style={{ fontSize: '11px', fontWeight: 600, color: step2Color, marginTop: '12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                    {sc.label}
                                </span>
                            </div>

                            <div style={{ flex: 1, height: '2px', background: step3Done ? '#10b981' : '#e2e8f0', borderRadius: '2px', marginTop: '24px', margin: '24px 10px 0' }} />

                            {/* Step 3: Enviado */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <div style={{
                                    width: '48px', height: '48px', borderRadius: '50%',
                                    background: step3Done ? '#0f172a' : '#f8fafc',
                                    border: step3Done ? 'none' : '2px solid #e2e8f0',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    boxShadow: step3Done ? '0 4px 16px rgba(15,23,42,0.2)' : 'none',
                                }}>
                                    <Truck size={22} color={step3Done ? '#fff' : '#94a3b8'} strokeWidth={1.8} />
                                </div>
                                <span style={{ fontSize: '11px', fontWeight: 600, color: step3Done ? '#0f172a' : '#94a3b8', marginTop: '12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Enviado</span>
                            </div>
                        </div>
                    </SectionCard>

                    {/* Produto */}
                    <SectionCard title="Produto" icon={Package} iconColor="#8b5cf6" rightBadge={`${1 + orderBumps.length} item${orderBumps.length > 0 ? 's' : ''}`}>
                        <div style={{ display: 'flex', gap: '18px', alignItems: 'center' }}>
                            {order.product?.imageUrl && (
                                <div style={{
                                    width: '88px', height: '88px', borderRadius: '16px',
                                    border: '1px solid #f1f5f9', overflow: 'hidden', flexShrink: 0, background: '#f8fafc',
                                }}>
                                    <img src={order.product.imageUrl} alt={order.product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </div>
                            )}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ margin: '0 0 4px', fontWeight: 700, color: '#0f172a', fontSize: '16px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '-0.01em' }}>
                                    {order.product?.name || 'Produto removido'}
                                </p>
                                <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8', fontWeight: 500 }}>
                                    SKU: {order.id.slice(0, 8).toUpperCase()}
                                </p>
                                <p style={{ margin: '8px 0 0', fontSize: '12px', color: '#64748b', fontWeight: 500 }}>
                                    Qtd: 1
                                </p>
                            </div>
                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                <p style={{ margin: 0, fontWeight: 700, color: '#0f172a', fontSize: '18px', fontFamily: "'Space Grotesk', sans-serif" }}>
                                    R$ {fmt(order.product?.price || 0)}
                                </p>
                            </div>
                        </div>

                        {/* Order Bumps */}
                        {orderBumps.length > 0 && (
                            <div style={{ marginTop: '18px', borderTop: '1px solid #f1f5f9', paddingTop: '18px' }}>
                                {orderBumps.map((bump) => (
                                    <div key={bump.id} style={{ display: 'flex', gap: '14px', alignItems: 'center', marginBottom: '14px' }}>
                                        {bump.imageUrl ? (
                                            <div style={{
                                                width: '52px', height: '52px', borderRadius: '12px',
                                                border: '1px solid #f1f5f9', overflow: 'hidden', flexShrink: 0, background: '#f8fafc',
                                            }}>
                                                <img src={bump.imageUrl} alt={bump.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            </div>
                                        ) : (
                                            <div style={{
                                                width: '52px', height: '52px', borderRadius: '12px',
                                                background: '#faf5ff', border: '1px solid #ede9fe',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                            }}>
                                                <Gift size={20} color="#8b5cf6" strokeWidth={1.8} />
                                            </div>
                                        )}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <p style={{ margin: 0, fontWeight: 600, color: '#0f172a', fontSize: '14px' }}>{bump.name}</p>
                                            <p style={{ margin: '3px 0 0', fontSize: '11px', color: '#8b5cf6', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Order Bump</p>
                                        </div>
                                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                            <p style={{ margin: 0, fontWeight: 700, color: '#0f172a', fontSize: '15px', fontFamily: "'Space Grotesk', sans-serif" }}>
                                                R$ {fmt(bump.price || 0)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Resumo: Custo + Frete + Total */}
                        <div style={{ marginTop: '18px', borderTop: '1px solid #f1f5f9', paddingTop: '18px' }}>
                            {(order.productCost ?? 0) > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                    <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <DollarSign size={14} color="#94a3b8" strokeWidth={1.8} />
                                        Custo do Produto
                                    </span>
                                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#dc2626' }}>
                                        R$ {fmt(order.productCost ?? 0)}
                                    </span>
                                </div>
                            )}
                            {order.shippingPrice > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                    <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <TruckIcon size={14} color="#94a3b8" strokeWidth={1.8} />
                                        Frete
                                    </span>
                                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>
                                        R$ {fmt(order.shippingPrice)}
                                    </span>
                                </div>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '4px' }}>
                                <span style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>Total</span>
                                <span style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.04em', fontFamily: "'Space Grotesk', sans-serif" }}>
                                    R$ {fmt(order.totalPrice || 0)}
                                </span>
                            </div>
                        </div>
                    </SectionCard>

                    {/* Tracking & Email */}
                    <TrackingManagement orderId={order.id} initialUrl={order.trackingUrl} />
                    <EmailSection orderId={order.id} email={order.email || ''} />
                </div>

                {/* ── Right Column ── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    {/* Dados do Cliente (unificado) */}
                    <SectionCard title="Dados do Cliente" icon={User} iconColor="#3b82f6">
                        {/* Avatar + nome */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '22px' }}>
                            <div style={{
                                width: '54px', height: '54px', borderRadius: '16px',
                                background: 'linear-gradient(145deg, #0f172a 0%, #1e293b 100%)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: '0 4px 12px rgba(15,23,42,0.15)',
                                color: '#a5b4fc', fontSize: '20px', fontWeight: 700,
                                fontFamily: "'Space Grotesk', sans-serif",
                            }}>
                                {order.fullName?.charAt(0).toUpperCase() || '?'}
                            </div>
                            <div style={{ flex: 1 }}>
                                <p style={{ margin: 0, fontWeight: 700, color: '#0f172a', fontSize: '16px', letterSpacing: '-0.02em' }}>
                                    {order.fullName || 'Cliente sem nome'}
                                </p>
                            </div>
                            {order.fullName && <InlineCopyBtn text={order.fullName} />}
                        </div>

                        {/* CPF */}
                        <CopyableRow icon={FileText} label="CPF" value={order.cpf || '—'} />

                        {/* E-mail */}
                        <CopyableRow icon={Mail} label="E-mail" value={order.email || 'Sem e-mail'} />

                        {/* Telefone */}
                        <CopyableRow icon={Phone} label="Telefone" value={order.phone || 'Sem telefone'} />

                        {/* Separador */}
                        <div style={{ borderTop: '1px solid #f1f5f9', margin: '8px -4px 22px' }} />

                        {/* Endereço de Entrega */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                            <div style={{
                                width: '28px', height: '28px', borderRadius: '8px',
                                background: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                border: '1px solid #ffedd5',
                            }}>
                                <MapPin size={14} color="#f97316" strokeWidth={2} />
                            </div>
                            <span style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                Endereço de Entrega
                            </span>
                        </div>

                        <p style={{ margin: '0 0 14px', fontWeight: 600, color: '#0f172a', fontSize: '14px' }}>
                            {order.recipient || order.fullName}
                        </p>

                        {/* Rua + Número + Complemento */}
                        <CopyableRow icon={MapPin} label="Rua" value={order.rua || '—'} />
                        <CopyableRow icon={Hash} label="Número" value={order.numero || '—'} />
                        <CopyableRow icon={MapPin} label="Complemento" value={order.complemento || '—'} />

                        {/* Bairro */}
                        <CopyableRow icon={MapPin} label="Bairro" value={order.bairro || '—'} />

                        {/* Cidade / Estado */}
                        <CopyableRow icon={MapPin} label="Cidade" value={
                            order.cidade && order.estado ? `${order.cidade} / ${order.estado}` : '—'
                        } />

                        {/* CEP */}
                        <CopyableRow icon={Hash} label="CEP" value={order.cep || '—'} />

                        {(order as any).referencia && (
                            <div style={{ marginTop: '12px', background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '12px', padding: '12px 16px' }}>
                                <p style={{ margin: 0, fontSize: '12px', color: '#92400e', fontWeight: 500 }}>
                                    <span style={{ fontWeight: 700 }}>Ref:</span> {(order as any).referencia}
                                </p>
                            </div>
                        )}
                    </SectionCard>

                    {/* Pagamento */}
                    <SectionCard title="Pagamento" icon={CreditCard} iconColor="#10b981">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '22px' }}>
                            {order.paymentMethod === 'pix' ? (
                                <span style={{
                                    fontSize: '12px', fontWeight: 700, color: '#059669',
                                    background: '#ecfdf5', padding: '6px 16px', borderRadius: '10px',
                                    border: '1px solid #d1fae5',
                                }}>
                                    PIX
                                </span>
                            ) : (
                                <span style={{
                                    fontSize: '12px', fontWeight: 700, color: '#3b82f6',
                                    background: '#eff6ff', padding: '6px 16px', borderRadius: '10px',
                                    border: '1px solid #dbeafe',
                                }}>
                                    {order.cardBrand ? order.cardBrand.toUpperCase() : 'CARTÃO'}
                                </span>
                            )}
                            {order.installments && (
                                <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>
                                    {order.installments}x de R$ {fmt(order.installmentAmount || 0)}
                                </span>
                            )}
                        </div>

                        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '20px' }}>
                            <p style={{ margin: '0 0 6px', color: '#94a3b8', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Total</p>
                            <p style={{ margin: 0, fontSize: '36px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.04em', lineHeight: 1, fontFamily: "'Space Grotesk', sans-serif" }}>
                                R$ {fmt(order.totalPrice || 0)}
                            </p>
                        </div>

                        {order.paymentStatus === 'pago' && order.netReceived && (
                            <div style={{ marginTop: '16px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
                                <span style={{
                                    fontSize: '12px', color: '#059669', fontWeight: 600,
                                    background: '#ecfdf5', padding: '6px 14px', borderRadius: '8px',
                                    border: '1px solid #d1fae5',
                                }}>
                                    Líquido: R$ {fmt(order.netReceived)}
                                </span>
                                {(order.productCost ?? 0) > 0 && (
                                    <span style={{
                                        fontSize: '12px', color: '#dc2626', fontWeight: 600,
                                        background: '#fef2f2', padding: '6px 14px', borderRadius: '8px',
                                        border: '1px solid #fecaca',
                                    }}>
                                        Custo: R$ {fmt(order.productCost ?? 0)}
                                    </span>
                                )}
                                {(order.productCost ?? 0) > 0 && order.netReceived && (
                                    <span style={{
                                        fontSize: '12px', color: (order.netReceived - (order.productCost ?? 0)) >= 0 ? '#059669' : '#dc2626', fontWeight: 600,
                                        background: (order.netReceived - (order.productCost ?? 0)) >= 0 ? '#ecfdf5' : '#fef2f2', padding: '6px 14px', borderRadius: '8px',
                                        border: `1px solid ${(order.netReceived - (order.productCost ?? 0)) >= 0 ? '#d1fae5' : '#fecaca'}`,
                                    }}>
                                        Lucro: R$ {fmt(order.netReceived - (order.productCost ?? 0))}
                                    </span>
                                )}
                            </div>
                        )}

                        {order.mpPaymentId && (
                            <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Hash size={12} color="#94a3b8" strokeWidth={1.8} />
                                <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 500 }}>
                                    ID: {order.mpPaymentId}
                                </span>
                            </div>
                        )}

                        {order.paymentMethod === 'pix' && (order.paymentStatus === 'aguardando' || order.paymentStatus === 'processando') && (
                            <div style={{ marginTop: '18px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
                                <ResendPixButton orderId={order.id} />
                            </div>
                        )}
                    </SectionCard>

                    {/* Order Bumps */}
                    {orderBumps.length > 0 && (
                        <SectionCard title="Order Bumps" icon={Zap} iconColor="#f59e0b">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {orderBumps.map((bump) => (
                                    <div key={bump.id} style={{
                                        display: 'flex', alignItems: 'center', gap: '14px',
                                        background: '#f8fafc', borderRadius: '12px', padding: '12px 16px',
                                        border: '1px solid #f1f5f9',
                                    }}>
                                        {bump.imageUrl ? (
                                            <img src={bump.imageUrl} alt="" style={{ width: '42px', height: '42px', borderRadius: '10px', objectFit: 'cover' }} />
                                        ) : (
                                            <div style={{
                                                width: '42px', height: '42px', borderRadius: '10px',
                                                background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                border: '1px solid #fef3c7', flexShrink: 0,
                                            }}>
                                                <Zap size={18} color="#f59e0b" strokeWidth={1.8} />
                                            </div>
                                        )}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {bump.name}
                                            </p>
                                            <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#94a3b8', fontWeight: 500 }}>
                                                {bump.description}
                                            </p>
                                        </div>
                                        <span style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', flexShrink: 0, fontFamily: "'Space Grotesk', sans-serif" }}>
                                            R$ {fmt(bump.price)}
                                        </span>
                                    </div>
                                ))}
                                <div style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    paddingTop: '10px', marginTop: '6px', borderTop: '1px solid #f1f5f9',
                                }}>
                                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Total Bumps</span>
                                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#f59e0b', fontFamily: "'Space Grotesk', sans-serif" }}>+ R$ {fmt(bumpsTotal)}</span>
                                </div>
                            </div>
                        </SectionCard>
                    )}

                    {/* UTM Data */}
                    {utmData.length > 0 && (
                        <SectionCard title="UTM / Rastreamento" icon={Globe} iconColor="#f59e0b">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {utmData.map((utm) => (
                                    <CopyableRow key={utm.label} icon={Globe} label={utm.label} value={utm.value} />
                                ))}
                            </div>
                        </SectionCard>
                    )}

                </div>
            </div>
        </div>
    )
}

/* ── KpiStat — refined premium style ── */
function KpiStat({ icon: Icon, label, value, sub, featured }: {
    icon: any; label: string; value: string; sub?: string; featured?: boolean
}) {
    return (
        <div style={{
            background: featured
                ? 'linear-gradient(145deg, #0f172a 0%, #1e293b 100%)'
                : '#ffffff',
            border: featured ? 'none' : '1px solid #f1f5f9',
            borderRadius: '20px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: featured
                ? '0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(15, 23, 42, 0.15), inset 0 1px 0 rgba(255,255,255,0.04)'
                : '0 1px 3px rgba(0,0,0,0.02), 0 2px 8px rgba(0,0,0,0.02), inset 0 1px 0 rgba(255,255,255,0.9)',
        }}>
            {featured && (
                <div style={{
                    position: 'absolute', top: '-40px', right: '-30px',
                    width: '140px', height: '140px',
                    background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
                    borderRadius: '50%', pointerEvents: 'none',
                }} />
            )}
            <div style={{
                width: '44px', height: '44px', borderRadius: '14px',
                background: featured
                    ? 'linear-gradient(135deg, rgba(99,102,241,0.18) 0%, rgba(139,92,246,0.12) 100%)'
                    : '#f8fafc',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: featured ? '1px solid rgba(99,102,241,0.08)' : '1px solid #e2e8f0',
            }}>
                <Icon size={20} strokeWidth={1.8} color={featured ? '#a5b4fc' : '#6366f1'} />
            </div>
            <div>
                <p style={{
                    margin: '0 0 6px', fontSize: '11px', fontWeight: 600,
                    color: featured ? 'rgba(255,255,255,0.35)' : '#94a3b8',
                    textTransform: 'uppercase', letterSpacing: '0.08em',
                }}>{label}</p>
                <p style={{
                    margin: 0, fontSize: featured ? '28px' : '22px', fontWeight: 700,
                    color: featured ? '#fff' : '#0f172a',
                    letterSpacing: '-0.04em', lineHeight: 1,
                    fontFamily: "'Space Grotesk', sans-serif",
                }}>{value}</p>
                {sub && (
                    <p style={{ margin: '6px 0 0', fontSize: '12px', color: featured ? 'rgba(255,255,255,0.28)' : '#94a3b8', fontWeight: 500 }}>
                        {sub}
                    </p>
                )}
            </div>
        </div>
    )
}

/* ── SectionCard — refined white card ── */
function SectionCard({ title, icon: Icon, iconColor, rightBadge, children }: {
    title: string; icon: any; iconColor: string; rightBadge?: React.ReactNode; children: React.ReactNode
}) {
    return (
        <div style={{
            background: '#fff', border: '1px solid #f1f5f9',
            borderRadius: '20px', padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02), 0 2px 8px rgba(0,0,0,0.02)',
            transition: 'box-shadow 0.3s ease',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '22px' }}>
                <div style={{
                    width: '34px', height: '34px', borderRadius: '10px',
                    background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '1px solid #e2e8f0',
                }}>
                    <Icon size={16} color={iconColor} strokeWidth={1.8} />
                </div>
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.01em', flex: 1 }}>
                    {title}
                </h3>
                {rightBadge && (
                    typeof rightBadge === 'string' ? (
                        <span style={{
                            background: '#f1f5f9', padding: '4px 12px', borderRadius: '8px',
                            fontSize: '11px', fontWeight: 700, color: '#64748b',
                        }}>
                            {rightBadge}
                        </span>
                    ) : rightBadge
                )}
            </div>
            {children}
        </div>
    )
}

/* ── CopyableRow — refined label + valor + botão de copiar ── */
function CopyableRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '11px 14px', background: '#f8fafc', borderRadius: '12px',
            border: '1px solid #f1f5f9', marginBottom: '8px',
            transition: 'border-color 0.2s ease',
        }}>
            <Icon size={14} color="#94a3b8" strokeWidth={1.8} />
            <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: '10px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
                <p style={{ margin: '2px 0 0', color: '#475569', fontSize: '13px', fontWeight: 500, wordBreak: 'break-all' }}>{value}</p>
            </div>
            <InlineCopyBtn text={value} />
        </div>
    )
}
