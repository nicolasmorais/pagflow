import { prisma } from '@/lib/prisma'
import {
    ChevronLeft, Trash2, Package, Phone, Mail,
    MapPin, CreditCard, User, CheckCircle2, Clock, Truck, ReceiptText,
    DollarSign, Hash, FileText, Gift, Globe, TruckIcon, Zap
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

    const bumpIds = Array.isArray(order.selectedBumps) ? order.selectedBumps as string[] : []
    const orderBumps = bumpIds.length > 0
        ? await prisma.orderBump.findMany({ where: { id: { in: bumpIds } } })
        : []
    const bumpsTotal = orderBumps.reduce((sum, b) => sum + (b.price || 0), 0)

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

    const profit = order.netReceived && (order.productCost ?? 0) > 0
        ? order.netReceived - (order.productCost ?? 0)
        : null

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
                borderRadius: '24px', padding: '28px 32px',
                marginBottom: '24px', position: 'relative', overflow: 'hidden',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03), 0 8px 32px rgba(15, 23, 42, 0.18)',
            }}>
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

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{
                            width: '52px', height: '52px', borderRadius: '16px',
                            background: 'linear-gradient(135deg, rgba(99,102,241,0.18) 0%, rgba(139,92,246,0.12) 100%)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            border: '1px solid rgba(99,102,241,0.08)',
                        }}>
                            <ReceiptText size={22} color="#a5b4fc" strokeWidth={1.8} />
                        </div>
                        <div>
                            <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.04em' }}>
                                Pedido{' '}
                                <span style={{
                                    fontFamily: "'Space Grotesk', monospace", fontWeight: 600, color: '#a5b4fc', fontSize: '0.8em',
                                    background: 'rgba(99,102,241,0.12)', padding: '4px 12px', borderRadius: '8px',
                                    border: '1px solid rgba(99,102,241,0.06)',
                                }}>
                                    #{order.id.slice(0, 8).toUpperCase()}
                                </span>
                            </h1>
                            <p style={{ margin: '6px 0 0', fontSize: '13px', color: 'rgba(255,255,255,0.35)', fontWeight: 500 }}>
                                {new Date(order.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                                {' · '}
                                {new Date(order.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '7px',
                            background: sc.bg, color: sc.color, border: `1.5px solid ${sc.border}`,
                            padding: '8px 16px', borderRadius: '10px',
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
                                padding: '8px 16px', borderRadius: '10px',
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

                {/* ── Status Stepper inside header ── */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0', marginTop: '28px', position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{
                            width: '40px', height: '40px', borderRadius: '50%',
                            background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            border: '1px solid rgba(255,255,255,0.1)',
                        }}>
                            <CheckCircle2 size={18} color="#fff" strokeWidth={2} />
                        </div>
                        <span style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginTop: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Criado</span>
                    </div>

                    <div style={{ flex: 1, height: '2px', background: 'rgba(255,255,255,0.15)', borderRadius: '1px', margin: '0 8px' }} />

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{
                            width: '40px', height: '40px', borderRadius: '50%',
                            background: order.paymentStatus === 'pago' || order.paymentStatus === 'atendido'
                                ? 'rgba(16,185,129,0.25)' : order.paymentStatus === 'recusado' || order.paymentStatus === 'cancelado'
                                    ? 'rgba(239,68,68,0.25)' : 'rgba(255,255,255,0.1)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            border: `1px solid ${order.paymentStatus === 'pago' || order.paymentStatus === 'atendido'
                                ? 'rgba(16,185,129,0.3)' : order.paymentStatus === 'recusado' || order.paymentStatus === 'cancelado'
                                    ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.1)'}`,
                        }}>
                            {order.paymentStatus === 'recusado' || order.paymentStatus === 'cancelado'
                                ? <span style={{ fontSize: '16px', color: '#fca5a5', fontWeight: 900 }}>✕</span>
                                : order.paymentStatus === 'pago' || order.paymentStatus === 'atendido'
                                    ? <CheckCircle2 size={18} color="#6ee7b7" strokeWidth={2} />
                                    : <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', fontWeight: 900 }}>···</span>
                            }
                        </div>
                        <span style={{
                            fontSize: '10px', fontWeight: 600, marginTop: '8px', textTransform: 'uppercase', letterSpacing: '0.06em',
                            color: order.paymentStatus === 'pago' || order.paymentStatus === 'atendido'
                                ? '#6ee7b7' : order.paymentStatus === 'recusado' || order.paymentStatus === 'cancelado'
                                    ? '#fca5a5' : 'rgba(255,255,255,0.5)',
                        }}>
                            {sc.label}
                        </span>
                    </div>

                    <div style={{ flex: 1, height: '2px', background: step3Done ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.1)', borderRadius: '1px', margin: '0 8px' }} />

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{
                            width: '40px', height: '40px', borderRadius: '50%',
                            background: step3Done ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            border: step3Done ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,255,255,0.06)',
                        }}>
                            <Truck size={18} color={step3Done ? '#fff' : 'rgba(255,255,255,0.3)'} strokeWidth={1.8} />
                        </div>
                        <span style={{ fontSize: '10px', fontWeight: 600, color: step3Done ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.3)', marginTop: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Enviado</span>
                    </div>
                </div>
            </div>

            {/* ── KPI Row ── */}
            <div className="pedido-kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
                <KpiCard icon={DollarSign} label="Valor Total" value={`R$ ${fmt(order.totalPrice || 0)}`} accent />
                <KpiCard icon={CreditCard} label="Pagamento"
                    value={order.paymentMethod === 'pix' ? 'PIX' : order.cardBrand ? order.cardBrand.toUpperCase() : 'Cartão'}
                    sub={order.installments ? `${order.installments}x de R$ ${fmt(order.installmentAmount || 0)}` : undefined} />
                <KpiCard icon={User} label="Cliente" value={order.fullName || 'Sem nome'} sub={order.email || undefined} />
                <KpiCard icon={Package} label="Produto" value={order.product?.name || 'Produto removido'}
                    sub={orderBumps.length > 0 ? `+${orderBumps.length} bump${orderBumps.length > 1 ? 's' : ''}` : 'Qtd: 1'} />
            </div>

            {/* ── Cards Grid ── */}
            <div className="pedido-content-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

                {/* ═══════════════════ COLUNA ESQUERDA ═══════════════════ */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    {/* ── Card: Produto ── */}
                    <Card title="Produto" icon={Package} iconColor="#8b5cf6" badge={`${1 + orderBumps.length} item${orderBumps.length > 0 ? 's' : ''}`}>
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                            {order.product?.imageUrl && (
                                <div style={{
                                    width: '72px', height: '72px', borderRadius: '14px',
                                    border: '1px solid #f1f5f9', overflow: 'hidden', flexShrink: 0, background: '#f8fafc',
                                }}>
                                    <img src={order.product.imageUrl} alt={order.product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </div>
                            )}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ margin: 0, fontWeight: 700, color: '#0f172a', fontSize: '15px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '-0.01em' }}>
                                    {order.product?.name || 'Produto removido'}
                                </p>
                                <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#94a3b8', fontWeight: 500 }}>
                                    SKU: {order.id.slice(0, 8).toUpperCase()} · Qtd: 1
                                </p>
                            </div>
                            <p style={{ margin: 0, fontWeight: 700, color: '#0f172a', fontSize: '16px', flexShrink: 0 }}>
                                R$ {fmt(order.product?.price || 0)}
                            </p>
                        </div>

                        {/* Order Bumps inline */}
                        {orderBumps.length > 0 && (
                            <div style={{ marginTop: '16px', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
                                {orderBumps.map((bump) => (
                                    <div key={bump.id} style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
                                        {bump.imageUrl ? (
                                            <div style={{ width: '44px', height: '44px', borderRadius: '10px', border: '1px solid #f1f5f9', overflow: 'hidden', flexShrink: 0, background: '#f8fafc' }}>
                                                <img src={bump.imageUrl} alt={bump.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            </div>
                                        ) : (
                                            <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#faf5ff', border: '1px solid #ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                <Gift size={16} color="#8b5cf6" strokeWidth={2} />
                                            </div>
                                        )}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <p style={{ margin: 0, fontWeight: 600, color: '#0f172a', fontSize: '13px' }}>{bump.name}</p>
                                            <p style={{ margin: '2px 0 0', fontSize: '10px', color: '#8b5cf6', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Order Bump</p>
                                        </div>
                                        <p style={{ margin: 0, fontWeight: 700, color: '#0f172a', fontSize: '13px', flexShrink: 0 }}>
                                            R$ {fmt(bump.price || 0)}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Resumo financeiro */}
                        <div style={{ marginTop: '16px', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
                            {(order.productCost ?? 0) > 0 && (
                                <FinRow label="Custo do Produto" value={`R$ ${fmt(order.productCost ?? 0)}`} color="#dc2626" icon={DollarSign} />
                            )}
                            {order.shippingPrice > 0 && (
                                <FinRow label="Frete" value={`R$ ${fmt(order.shippingPrice)}`} icon={TruckIcon} />
                            )}
                            {bumpsTotal > 0 && (
                                <FinRow label="Order Bumps" value={`+ R$ ${fmt(bumpsTotal)}`} color="#8b5cf6" icon={Zap} />
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', marginTop: '4px', borderTop: '1px solid #f1f5f9' }}>
                                <span style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>Total</span>
                                <span style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.04em' }}>
                                    R$ {fmt(order.totalPrice || 0)}
                                </span>
                            </div>
                        </div>
                    </Card>

                    {/* ── Card: Rastreamento ── */}
                    <TrackingManagement orderId={order.id} initialUrl={order.trackingUrl} />

                    {/* ── Card: E-mail ── */}
                    <EmailSection orderId={order.id} email={order.email || ''} />
                </div>

                {/* ═══════════════════ COLUNA DIREITA ═══════════════════ */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    {/* ── Card: Dados do Cliente ── */}
                    <Card title="Dados do Cliente" icon={User} iconColor="#3b82f6">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
                            <div style={{
                                width: '48px', height: '48px', borderRadius: '14px',
                                background: 'linear-gradient(145deg, #0f172a 0%, #1e293b 100%)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: '#a5b4fc', fontSize: '18px', fontWeight: 700,
                            }}>
                                {order.fullName?.charAt(0).toUpperCase() || '?'}
                            </div>
                            <div style={{ flex: 1 }}>
                                <p style={{ margin: 0, fontWeight: 700, color: '#0f172a', fontSize: '15px', letterSpacing: '-0.01em' }}>
                                    {order.fullName || 'Cliente sem nome'}
                                </p>
                            </div>
                            {order.fullName && <InlineCopyBtn text={order.fullName} />}
                        </div>

                        <DataRow icon={FileText} label="CPF" value={order.cpf || '—'} />
                        <DataRow icon={Mail} label="E-mail" value={order.email || 'Sem e-mail'} />
                        <DataRow icon={Phone} label="Telefone" value={order.phone || 'Sem telefone'} />
                    </Card>

                    {/* ── Card: Endereço de Entrega ── */}
                    <Card title="Endereço de Entrega" icon={MapPin} iconColor="#f97316">
                        <p style={{ margin: '0 0 14px', fontWeight: 600, color: '#0f172a', fontSize: '14px' }}>
                            {order.recipient || order.fullName}
                        </p>
                        <DataRow icon={MapPin} label="Rua" value={order.rua || '—'} />
                        <DataRow icon={Hash} label="Número" value={order.numero || '—'} />
                        <DataRow icon={MapPin} label="Complemento" value={order.complemento || '—'} />
                        <DataRow icon={MapPin} label="Bairro" value={order.bairro || '—'} />
                        <DataRow icon={MapPin} label="Cidade" value={order.cidade && order.estado ? `${order.cidade} / ${order.estado}` : '—'} />
                        <DataRow icon={Hash} label="CEP" value={order.cep || '—'} />
                        {(order as any).referencia && (
                            <div style={{ marginTop: '12px', background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '10px', padding: '12px 14px' }}>
                                <p style={{ margin: 0, fontSize: '12px', color: '#92400e', fontWeight: 500 }}>
                                    <span style={{ fontWeight: 700 }}>Ref:</span> {(order as any).referencia}
                                </p>
                            </div>
                        )}
                    </Card>

                    {/* ── Card: Pagamento ── */}
                    <Card title="Pagamento" icon={CreditCard} iconColor="#10b981">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                            {order.paymentMethod === 'pix' ? (
                                <span style={{ fontSize: '11px', fontWeight: 700, color: '#059669', background: '#ecfdf5', padding: '5px 14px', borderRadius: '8px', border: '1px solid #d1fae5' }}>PIX</span>
                            ) : (
                                <span style={{ fontSize: '11px', fontWeight: 700, color: '#3b82f6', background: '#eff6ff', padding: '5px 14px', borderRadius: '8px', border: '1px solid #dbeafe' }}>
                                    {order.cardBrand ? order.cardBrand.toUpperCase() : 'CARTÃO'}
                                </span>
                            )}
                            {order.installments && (
                                <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>
                                    {order.installments}x de R$ {fmt(order.installmentAmount || 0)}
                                </span>
                            )}
                        </div>

                        <div style={{ background: '#f8fafc', borderRadius: '14px', padding: '18px', border: '1px solid #f1f5f9' }}>
                            <p style={{ margin: '0 0 4px', color: '#94a3b8', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Total Pago</p>
                            <p style={{ margin: 0, fontSize: '32px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.04em', lineHeight: 1 }}>
                                R$ {fmt(order.totalPrice || 0)}
                            </p>
                        </div>

                        {order.paymentStatus === 'pago' && order.netReceived && (
                            <div style={{ marginTop: '14px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                <MiniBadge label="Líquido" value={`R$ ${fmt(order.netReceived)}`} color="#059669" bg="#ecfdf5" border="#d1fae5" />
                                {(order.productCost ?? 0) > 0 && (
                                    <MiniBadge label="Custo" value={`R$ ${fmt(order.productCost ?? 0)}`} color="#dc2626" bg="#fef2f2" border="#fecaca" />
                                )}
                                {profit !== null && (
                                    <MiniBadge label="Lucro" value={`R$ ${fmt(profit)}`} color={profit >= 0 ? '#059669' : '#dc2626'} bg={profit >= 0 ? '#ecfdf5' : '#fef2f2'} border={profit >= 0 ? '#d1fae5' : '#fecaca'} />
                                )}
                            </div>
                        )}

                        {order.mpPaymentId && (
                            <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Hash size={11} color="#94a3b8" strokeWidth={2} />
                                <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 500 }}>ID: {order.mpPaymentId}</span>
                            </div>
                        )}

                        {order.paymentMethod === 'pix' && (order.paymentStatus === 'aguardando' || order.paymentStatus === 'processando') && (
                            <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid #f1f5f9' }}>
                                <ResendPixButton orderId={order.id} />
                            </div>
                        )}
                    </Card>

                    {/* ── Card: UTM ── */}
                    {utmData.length > 0 && (
                        <Card title="UTM / Rastreamento" icon={Globe} iconColor="#f59e0b">
                            {utmData.map((utm) => (
                                <DataRow key={utm.label} icon={Globe} label={utm.label} value={utm.value} />
                            ))}
                        </Card>
                    )}
                </div>
            </div>
        </div>
    )
}

/* ═══════════════════ COMPONENTES ═══════════════════ */

function KpiCard({ icon: Icon, label, value, sub, accent }: {
    icon: any; label: string; value: string; sub?: string; accent?: boolean
}) {
    return (
        <div style={{
            background: accent ? '#0f172a' : '#fff',
            border: accent ? 'none' : '1px solid #f1f5f9',
            borderRadius: '16px', padding: '18px 20px',
            display: 'flex', flexDirection: 'column', gap: '12px',
            position: 'relative', overflow: 'hidden',
            boxShadow: accent ? '0 4px 20px rgba(15,23,42,0.12)' : '0 1px 3px rgba(0,0,0,0.02)',
        }}>
            {accent && (
                <div style={{
                    position: 'absolute', top: '-30px', right: '-20px', width: '100px', height: '100px',
                    background: 'radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)',
                    borderRadius: '50%', pointerEvents: 'none',
                }} />
            )}
            <div style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: accent ? 'rgba(99,102,241,0.15)' : '#f8fafc',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: accent ? '1px solid rgba(99,102,241,0.1)' : '1px solid #e2e8f0',
            }}>
                <Icon size={16} strokeWidth={2} color={accent ? '#a5b4fc' : '#6366f1'} />
            </div>
            <div>
                <p style={{ margin: '0 0 4px', fontSize: '10px', fontWeight: 600, color: accent ? 'rgba(255,255,255,0.35)' : '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</p>
                <p style={{ margin: 0, fontSize: accent ? '22px' : '18px', fontWeight: 700, color: accent ? '#fff' : '#0f172a', letterSpacing: '-0.03em', lineHeight: 1.1 }}>{value}</p>
                {sub && <p style={{ margin: '4px 0 0', fontSize: '11px', color: accent ? 'rgba(255,255,255,0.3)' : '#94a3b8', fontWeight: 500 }}>{sub}</p>}
            </div>
        </div>
    )
}

function Card({ title, icon: Icon, iconColor, badge, children }: {
    title: string; icon: any; iconColor: string; badge?: string; children: React.ReactNode
}) {
    return (
        <div style={{
            background: '#fff', border: '1px solid #f1f5f9',
            borderRadius: '18px', padding: '22px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                <div style={{
                    width: '32px', height: '32px', borderRadius: '9px',
                    background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '1px solid #e2e8f0',
                }}>
                    <Icon size={15} color={iconColor} strokeWidth={2} />
                </div>
                <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.01em', flex: 1 }}>{title}</h3>
                {badge && (
                    <span style={{ background: '#f1f5f9', padding: '3px 10px', borderRadius: '7px', fontSize: '11px', fontWeight: 700, color: '#64748b' }}>{badge}</span>
                )}
            </div>
            {children}
        </div>
    )
}

function DataRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '10px 12px', background: '#f8fafc', borderRadius: '10px',
            border: '1px solid #f1f5f9', marginBottom: '6px',
        }}>
            <Icon size={13} color="#94a3b8" strokeWidth={2} />
            <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: '10px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
                <p style={{ margin: '1px 0 0', color: '#374151', fontSize: '13px', fontWeight: 500, wordBreak: 'break-all' }}>{value}</p>
            </div>
            <InlineCopyBtn text={value} />
        </div>
    )
}

function FinRow({ label, value, color, icon: Icon }: { label: string; value: string; color?: string; icon: any }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Icon size={13} color="#94a3b8" strokeWidth={2} />
                {label}
            </span>
            <span style={{ fontSize: '13px', fontWeight: 600, color: color || '#0f172a' }}>{value}</span>
        </div>
    )
}

function MiniBadge({ label, value, color, bg, border }: { label: string; value: string; color: string; bg: string; border: string }) {
    return (
        <span style={{
            fontSize: '11px', color, fontWeight: 600,
            background: bg, padding: '5px 12px', borderRadius: '8px',
            border: `1px solid ${border}`,
        }}>
            {label}: {value}
        </span>
    )
}
