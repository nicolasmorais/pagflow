import { prisma } from '@/lib/prisma'
import {
    ChevronLeft, Trash2, Package, Phone, Mail,
    MapPin, CreditCard, User, CheckCircle2, Clock, Truck, ReceiptText,
    DollarSign, Hash, ArrowUpRight, FileText
} from 'lucide-react'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { deleteOrder } from '@/app/actions'
import EmailSection from './EmailSection'
import TrackingManagement from './TrackingManagement'
import InlineCopyBtn from './InlineCopyBtn'

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

    const ps = order.paymentStatus || 'processando'
    const sc = getStatus(ps)
    const hasSent = !!(order.trackingCode || order.trackingUrl)
    const step2Color = sc.dot
    const step3Done = hasSent

    return (
        <div style={{ paddingBottom: '60px' }}>

            {/* ── Back link ── */}
            <Link href="/admin/pedidos" style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                color: '#64748b', fontSize: '13px', fontWeight: 700, textDecoration: 'none',
                padding: '8px 12px', borderRadius: '10px', marginBottom: '20px',
                transition: 'all 0.15s',
            }}>
                <ChevronLeft size={15} strokeWidth={2.5} />
                Voltar para pedidos
            </Link>

            {/* ── Header Card ── */}
            <div style={{
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                borderRadius: '20px', padding: '28px',
                marginBottom: '14px', position: 'relative', overflow: 'hidden',
                boxShadow: '0 8px 32px rgba(15, 23, 42, 0.25), inset 0 1px 0 rgba(255,255,255,0.05)',
            }}>
                {/* Ambient glow */}
                <div style={{
                    position: 'absolute', top: '-40px', right: '-40px',
                    width: '160px', height: '160px',
                    background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
                    borderRadius: '50%', pointerEvents: 'none',
                }} />
                <div style={{
                    position: 'absolute', bottom: '-30px', left: '20%',
                    width: '120px', height: '120px',
                    background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)',
                    borderRadius: '50%', pointerEvents: 'none',
                }} />

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{
                            width: '52px', height: '52px', borderRadius: '16px',
                            background: 'linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(139,92,246,0.15) 100%)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 2px 8px rgba(99,102,241,0.15)',
                        }}>
                            <ReceiptText size={24} color="#a5b4fc" strokeWidth={2} />
                        </div>
                        <div>
                            <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.03em' }}>
                                Pedido{' '}
                                <span style={{
                                    fontFamily: 'monospace', fontWeight: 700, color: '#a5b4fc', fontSize: '0.8em',
                                    background: 'rgba(99,102,241,0.15)', padding: '3px 12px', borderRadius: '8px',
                                }}>
                                    #{order.id.slice(0, 8).toUpperCase()}
                                </span>
                            </h1>
                            <p style={{ margin: '6px 0 0', fontSize: '13px', color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>
                                {new Date(order.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                                {' às '}
                                {new Date(order.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '6px',
                            background: sc.bg, color: sc.color, border: `1.5px solid ${sc.border}`,
                            padding: '7px 16px', borderRadius: '10px',
                            fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em',
                        }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: sc.dot }} />
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
                                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                                color: '#fca5a5', fontSize: '12px', fontWeight: 700,
                                cursor: 'pointer', transition: 'all 0.15s',
                            }}>
                                <Trash2 size={13} />
                                Excluir
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            {/* ── Quick Stats (KPI style) ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '14px' }}>
                <KpiStat icon={DollarSign} label="Valor Total" value={`R$ ${fmt(order.totalPrice || 0)}`} featured />
                <KpiStat icon={CreditCard} label="Pagamento" value={order.paymentMethod === 'pix' ? 'PIX' : order.cardBrand ? order.cardBrand.toUpperCase() : 'Cartão'} sub={order.installments ? `${order.installments}x de R$ ${fmt(order.installmentAmount || 0)}` : undefined} />
                <KpiStat icon={User} label="Cliente" value={order.fullName || 'Sem nome'} sub={order.email || undefined} />
                <KpiStat icon={Package} label="Produto" value={order.product?.name || 'Produto removido'} sub={`Qtd: 1`} />
            </div>

            {/* ── Content Grid ── */}
            <div className="pedido-content-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>

                {/* ── Left Column ── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

                    {/* Status Stepper */}
                    <SectionCard title="Status do Pedido" icon={Clock} iconColor="#6366f1">
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', gap: '0', padding: '8px 0' }}>
                            {/* Step 1: Criado */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <div style={{
                                    width: '48px', height: '48px', borderRadius: '50%',
                                    background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    boxShadow: '0 4px 16px rgba(15,23,42,0.3)',
                                }}>
                                    <CheckCircle2 size={22} color="#fff" />
                                </div>
                                <span style={{ fontSize: '11px', fontWeight: 700, color: '#0f172a', marginTop: '10px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Criado</span>
                            </div>

                            <div style={{ flex: 1, height: '3px', background: '#0f172a', borderRadius: '2px', marginTop: '22px', margin: '22px 8px 0' }} />

                            {/* Step 2: Pagamento */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <div style={{
                                    width: '48px', height: '48px', borderRadius: '50%',
                                    background: step2Color, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    boxShadow: `0 4px 16px ${step2Color}40`,
                                }}>
                                    {order.paymentStatus === 'recusado' || order.paymentStatus === 'cancelado'
                                        ? <span style={{ fontSize: '20px', color: 'white', fontWeight: 900 }}>✕</span>
                                        : order.paymentStatus === 'pago' || order.paymentStatus === 'atendido'
                                            ? <CheckCircle2 size={22} color="white" />
                                            : <span style={{ fontSize: '18px', color: 'white', fontWeight: 900 }}>···</span>
                                    }
                                </div>
                                <span style={{ fontSize: '11px', fontWeight: 700, color: step2Color, marginTop: '10px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                    {sc.label}
                                </span>
                            </div>

                            <div style={{ flex: 1, height: '3px', background: step3Done ? '#10b981' : '#e2e8f0', borderRadius: '2px', marginTop: '22px', margin: '22px 8px 0' }} />

                            {/* Step 3: Enviado */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <div style={{
                                    width: '48px', height: '48px', borderRadius: '50%',
                                    background: step3Done ? '#0f172a' : '#f8fafc',
                                    border: step3Done ? 'none' : '2px solid #e2e8f0',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    boxShadow: step3Done ? '0 4px 16px rgba(15,23,42,0.3)' : 'none',
                                }}>
                                    <Truck size={22} color={step3Done ? '#fff' : '#94a3b8'} />
                                </div>
                                <span style={{ fontSize: '11px', fontWeight: 700, color: step3Done ? '#0f172a' : '#94a3b8', marginTop: '10px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Enviado</span>
                            </div>
                        </div>
                    </SectionCard>

                    {/* Produto */}
                    <SectionCard title="Produto" icon={Package} iconColor="#a855f7" rightBadge="1 item">
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                            {order.product?.imageUrl && (
                                <div style={{
                                    width: '88px', height: '88px', borderRadius: '16px',
                                    border: '1px solid #e2e8f0', overflow: 'hidden', flexShrink: 0, background: '#f8fafc',
                                }}>
                                    <img src={order.product.imageUrl} alt={order.product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </div>
                            )}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ margin: '0 0 4px', fontWeight: 800, color: '#0f172a', fontSize: '16px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {order.product?.name || 'Produto removido'}
                                </p>
                                <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>
                                    SKU: {order.id.slice(0, 8).toUpperCase()}
                                </p>
                                <p style={{ margin: '8px 0 0', fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
                                    Qtd: 1
                                </p>
                            </div>
                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                <p style={{ margin: 0, fontWeight: 900, color: '#0f172a', fontSize: '28px', letterSpacing: '-0.04em', fontFamily: "'Space Grotesk', sans-serif" }}>
                                    R$ {fmt(order.totalPrice || 0)}
                                </p>
                            </div>
                        </div>
                    </SectionCard>

                    {/* Tracking & Email */}
                    <TrackingManagement orderId={order.id} initialUrl={order.trackingUrl} />
                    <EmailSection orderId={order.id} email={order.email || ''} />
                </div>

                {/* ── Right Column ── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

                    {/* Dados do Cliente (unificado) */}
                    <SectionCard title="Dados do Cliente" icon={User} iconColor="#3b82f6">
                        {/* Avatar + nome */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '18px' }}>
                            <div style={{
                                width: '52px', height: '52px', borderRadius: '16px',
                                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: '0 4px 12px rgba(15,23,42,0.2)',
                                color: '#a5b4fc', fontSize: '20px', fontWeight: 800,
                                fontFamily: "'Space Grotesk', sans-serif",
                            }}>
                                {order.fullName?.charAt(0).toUpperCase() || '?'}
                            </div>
                            <div style={{ flex: 1 }}>
                                <p style={{ margin: 0, fontWeight: 800, color: '#0f172a', fontSize: '16px', letterSpacing: '-0.01em' }}>
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
                        <div style={{ borderTop: '1px solid #f1f5f9', margin: '6px -4px 18px' }} />

                        {/* Endereço de Entrega */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                            <div style={{
                                width: '26px', height: '26px', borderRadius: '8px',
                                background: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                border: '1px solid #fed7aa',
                            }}>
                                <MapPin size={13} color="#f97316" strokeWidth={2} />
                            </div>
                            <span style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                Endereço de Entrega
                            </span>
                        </div>

                        <p style={{ margin: '0 0 12px', fontWeight: 700, color: '#0f172a', fontSize: '14px' }}>
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
                            <div style={{ marginTop: '10px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', padding: '10px 14px' }}>
                                <p style={{ margin: 0, fontSize: '12px', color: '#92400e', fontWeight: 600 }}>
                                    <span style={{ fontWeight: 800 }}>Ref:</span> {(order as any).referencia}
                                </p>
                            </div>
                        )}
                    </SectionCard>

                    {/* Pagamento */}
                    <SectionCard title="Pagamento" icon={CreditCard} iconColor="#10b981">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                            {order.paymentMethod === 'pix' ? (
                                <span style={{
                                    fontSize: '12px', fontWeight: 800, color: '#059669',
                                    background: '#ecfdf5', padding: '6px 14px', borderRadius: '10px',
                                    border: '1px solid #a7f3d0',
                                }}>
                                    PIX
                                </span>
                            ) : (
                                <span style={{
                                    fontSize: '12px', fontWeight: 800, color: '#3b82f6',
                                    background: '#eff6ff', padding: '6px 14px', borderRadius: '10px',
                                    border: '1px solid #bfdbfe',
                                }}>
                                    {order.cardBrand ? order.cardBrand.toUpperCase() : 'CARTÃO'}
                                </span>
                            )}
                            {order.installments && (
                                <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>
                                    {order.installments}x de R$ {fmt(order.installmentAmount || 0)}
                                </span>
                            )}
                        </div>

                        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '18px' }}>
                            <p style={{ margin: '0 0 4px', color: '#94a3b8', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Total</p>
                            <p style={{ margin: 0, fontSize: '36px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.04em', lineHeight: 1, fontFamily: "'Space Grotesk', sans-serif" }}>
                                R$ {fmt(order.totalPrice || 0)}
                            </p>
                        </div>

                        {order.paymentStatus === 'pago' && order.netReceived && (
                            <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{
                                    fontSize: '12px', color: '#059669', fontWeight: 700,
                                    background: '#ecfdf5', padding: '6px 12px', borderRadius: '8px',
                                    border: '1px solid #a7f3d0',
                                }}>
                                    Líquido: R$ {fmt(order.netReceived)}
                                </span>
                            </div>
                        )}

                        {order.mpPaymentId && (
                            <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Hash size={12} color="#94a3b8" />
                                <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>
                                    ID: {order.mpPaymentId}
                                </span>
                            </div>
                        )}
                    </SectionCard>

                </div>
            </div>
        </div>
    )
}

/* ── KpiStat — same pattern as dashboard KpiCard ── */
function KpiStat({ icon: Icon, label, value, sub, featured }: {
    icon: any; label: string; value: string; sub?: string; featured?: boolean
}) {
    return (
        <div style={{
            background: featured
                ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
                : 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
            border: featured ? 'none' : '1px solid rgba(241, 245, 249, 0.8)',
            borderRadius: '20px',
            padding: '22px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: featured
                ? '0 8px 32px rgba(15, 23, 42, 0.25), inset 0 1px 0 rgba(255,255,255,0.05)'
                : '0 1px 3px rgba(0,0,0,0.02), 0 4px 12px rgba(0,0,0,0.03), inset 0 1px 0 rgba(255,255,255,0.8)',
        }}>
            {featured && (
                <div style={{
                    position: 'absolute', top: '-30px', right: '-30px',
                    width: '120px', height: '120px',
                    background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
                    borderRadius: '50%', pointerEvents: 'none',
                }} />
            )}
            <div style={{
                width: '44px', height: '44px', borderRadius: '14px',
                background: featured
                    ? 'linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(139,92,246,0.15) 100%)'
                    : 'linear-gradient(135deg, #f0f4ff 0%, #e8ecf8 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: featured ? '0 2px 8px rgba(99,102,241,0.15)' : '0 1px 3px rgba(99,102,241,0.08)',
            }}>
                <Icon size={20} strokeWidth={2} color={featured ? '#a5b4fc' : '#6366f1'} />
            </div>
            <div>
                <p style={{
                    margin: '0 0 6px', fontSize: '11px', fontWeight: 600,
                    color: featured ? 'rgba(255,255,255,0.4)' : '#94a3b8',
                    textTransform: 'uppercase', letterSpacing: '0.08em',
                }}>{label}</p>
                <p style={{
                    margin: 0, fontSize: featured ? '28px' : '22px', fontWeight: 800,
                    color: featured ? '#fff' : '#0f172a',
                    letterSpacing: '-0.04em', lineHeight: 1,
                    fontFamily: "'Space Grotesk', sans-serif",
                }}>{value}</p>
                {sub && (
                    <p style={{ margin: '6px 0 0', fontSize: '12px', color: featured ? 'rgba(255,255,255,0.3)' : '#94a3b8', fontWeight: 500 }}>
                        {sub}
                    </p>
                )}
            </div>
        </div>
    )
}

/* ── SectionCard — same pattern as dashboard SectionCard ── */
function SectionCard({ title, icon: Icon, iconColor, rightBadge, children }: {
    title: string; icon: any; iconColor: string; rightBadge?: React.ReactNode; children: React.ReactNode
}) {
    return (
        <div style={{
            background: '#fff', border: '1px solid #f1f5f9',
            borderRadius: '18px', padding: '22px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <div style={{
                    width: '32px', height: '32px', borderRadius: '10px',
                    background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '1px solid #e2e8f0',
                }}>
                    <Icon size={15} color={iconColor} strokeWidth={2} />
                </div>
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.01em', flex: 1 }}>
                    {title}
                </h3>
                {rightBadge && (
                    typeof rightBadge === 'string' ? (
                        <span style={{
                            background: '#f1f5f9', padding: '4px 10px', borderRadius: '8px',
                            fontSize: '11px', fontWeight: 800, color: '#64748b',
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

/* ── CopyableRow — label + valor + botão de copiar ── */
function CopyableRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '10px 12px', background: '#f8fafc', borderRadius: '12px',
            border: '1px solid #e2e8f0', marginBottom: '8px',
        }}>
            <Icon size={14} color="#94a3b8" strokeWidth={2} />
            <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
                <p style={{ margin: '2px 0 0', color: '#475569', fontSize: '13px', fontWeight: 600, wordBreak: 'break-all' }}>{value}</p>
            </div>
            <InlineCopyBtn text={value} />
        </div>
    )
}
