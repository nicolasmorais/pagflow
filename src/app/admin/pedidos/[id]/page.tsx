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
    pago: { bg: '#E3F4EA', color: '#1E7A52', dot: '#1E7A52', border: '#C3E8D4', label: 'Pago' },
    recusado: { bg: '#FBEAE8', color: '#B23B32', dot: '#B23B32', border: '#F5CDC9', label: 'Recusado' },
    reembolsado: { bg: '#E7F1F8', color: '#2C5C86', dot: '#2C5C86', border: '#C5DDEF', label: 'Reembolsado' },
    aguardando: { bg: '#FEF3C7', color: '#92400E', dot: '#92400E', border: '#FDE68A', label: 'Aguardando' },
    processando: { bg: '#FEF3C7', color: '#92400E', dot: '#92400E', border: '#FDE68A', label: 'Aguardando' },
    atendido: { bg: '#E3F4EA', color: '#1E7A52', dot: '#1E7A52', border: '#C3E8D4', label: 'Atendido' },
    cancelado: { bg: '#FBEAE8', color: '#B23B32', dot: '#B23B32', border: '#F5CDC9', label: 'Cancelado' },
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
    const profit = order.netReceived && (order.productCost ?? 0) > 0
        ? order.netReceived - (order.productCost ?? 0) : null

    return (
        <div style={{ paddingBottom: '80px' }}>

            {/* ── Breadcrumb ── */}
            <Link href="/admin/pedidos" style={{
                display: 'inline-flex', alignItems: 'center', gap: '5px',
                fontSize: '13px', fontWeight: 600, color: '#6E7180', textDecoration: 'none',
                margin: '22px 0 20px', transition: 'color 0.15s',
            }}>
                <ChevronLeft size={13} strokeWidth={2.3} />
                Voltar para pedidos
            </Link>

            {/* ── Page Header ── */}
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', paddingBottom: '22px' }}>
                <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', color: '#6E7180', marginBottom: '6px', textTransform: 'uppercase' }}>
                        Pedido
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                        <h1 style={{ fontSize: 'clamp(26px, 4vw, 32px)', fontWeight: 600, letterSpacing: '-0.01em', margin: 0, fontFamily: "'IBM Plex Mono', monospace", fontVariantNumeric: 'tabular-nums' }}>
                            #{order.id.slice(0, 8).toUpperCase()}
                        </h1>
                        <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '6px',
                            fontSize: '12px', fontWeight: 700, padding: '5px 12px', borderRadius: '999px',
                            background: sc.bg, color: sc.color,
                        }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor' }} />
                            {sc.label}
                        </span>
                    </div>
                    <div style={{ fontSize: '13px', color: '#6E7180', marginTop: '7px' }}>
                        {new Date(order.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                        {' · '}
                        {new Date(order.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                </div>
                <form action={async () => {
                    'use server'
                    await deleteOrder(id)
                    redirect('/admin/pedidos')
                }}>
                    <button type="submit" style={{
                        display: 'inline-flex', alignItems: 'center', gap: '7px',
                        background: 'transparent', border: '1px solid #E5E7EF', color: '#6E7180',
                        fontSize: '13px', fontWeight: 600, padding: '9px 15px', borderRadius: '9px',
                        cursor: 'pointer', transition: 'border-color 0.15s, color 0.15s, background 0.15s',
                        fontFamily: 'inherit',
                    }}>
                        <Trash2 size={14} strokeWidth={2} />
                        Excluir pedido
                    </button>
                </form>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid #E5E7EF', margin: '0 0 30px' }} />

            {/* ── Stepper ── */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '32px' }}>
                <Step done label="Criado" />
                <div style={{ flex: 1, height: '1px', background: '#14151F', margin: '0 14px', minWidth: '24px' }} />
                <Step
                    done={order.paymentStatus === 'pago' || order.paymentStatus === 'atendido'}
                    current={order.paymentStatus === 'pago' || order.paymentStatus === 'atendido'}
                    failed={order.paymentStatus === 'recusado' || order.paymentStatus === 'cancelado'}
                    label={sc.label}
                />
                <div style={{ flex: 1, height: '1px', background: hasSent ? '#14151F' : '#E5E7EF', margin: '0 14px', minWidth: '24px' }} />
                <Step done={hasSent} label="Enviado" />
            </div>

            {/* ── Content Grid ── */}
            <div className="pedido-content-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', alignItems: 'stretch' }}>

                {/* ═══════════════ COL 1: Informacoes do Pedido ═══════════════ */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', minWidth: 0, height: '100%' }}>

                    {/* ── Informações do Pedido ── */}
                    <div style={cardStyle}>
                        <CardHead icon={ReceiptText} title="Informações do pedido" />

                        {/* Produto inline */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', paddingBottom: '16px', borderBottom: '1px solid #E5E7EF', marginBottom: '14px' }}>
                            {order.product?.imageUrl ? (
                                <div style={{ width: '48px', height: '48px', borderRadius: '10px', flexShrink: 0, border: '1px solid #E5E7EF', overflow: 'hidden', background: '#F5F6F9' }}>
                                    <img src={order.product.imageUrl} alt={order.product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </div>
                            ) : (
                                <div style={{ width: '48px', height: '48px', borderRadius: '10px', flexShrink: 0, background: '#F5F6F9', border: '1px solid #E5E7EF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Package size={20} color="#6E7180" strokeWidth={2} />
                                </div>
                            )}
                            <div style={{ minWidth: 0, flex: 1 }}>
                                <div style={{ fontSize: '14.5px', fontWeight: 700 }}>{order.product?.name || 'Produto removido'}</div>
                                <div style={{ fontSize: '12px', color: '#6E7180', marginTop: '2px', fontFamily: "'IBM Plex Mono', monospace" }}>SKU: {order.id.slice(0, 8).toUpperCase()} · Qtd: 1</div>
                            </div>
                            <div style={{ fontSize: '14.5px', fontWeight: 700, whiteSpace: 'nowrap' }}>R$ {fmt(order.product?.price || 0)}</div>
                        </div>

                        {/* Order Bumps inline */}
                        {orderBumps.map((bump) => (
                            <div key={bump.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '12px', marginBottom: '12px', borderBottom: '1px solid #E5E7EF' }}>
                                {bump.imageUrl ? (
                                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', flexShrink: 0, border: '1px solid #E5E7EF', overflow: 'hidden', background: '#F5F6F9' }}>
                                        <img src={bump.imageUrl} alt={bump.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </div>
                                ) : (
                                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', flexShrink: 0, background: '#FEF3C7', border: '1px solid #FDE68A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Zap size={14} color="#92400E" strokeWidth={2} />
                                    </div>
                                )}
                                <div style={{ minWidth: 0, flex: 1 }}>
                                    <div style={{ fontSize: '13px', fontWeight: 700 }}>{bump.name}</div>
                                    <div style={{ fontSize: '10px', color: '#6E7180', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: '2px' }}>Order Bump</div>
                                </div>
                                <div style={{ fontSize: '13px', fontWeight: 700, whiteSpace: 'nowrap' }}>R$ {fmt(bump.price || 0)}</div>
                            </div>
                        ))}

                        {/* Metodo + Parcelas */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                            {order.paymentMethod === 'pix' ? (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#E7F1F8', color: '#2C5C86', fontSize: '11.5px', fontWeight: 700, padding: '5px 11px', borderRadius: '7px', letterSpacing: '0.02em' }}>PIX</span>
                            ) : (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#E7F1F8', color: '#2C5C86', fontSize: '11.5px', fontWeight: 700, padding: '5px 11px', borderRadius: '7px', letterSpacing: '0.02em' }}>
                                    {order.cardBrand ? order.cardBrand.toUpperCase() : 'CARTÃO'}
                                </span>
                            )}
                            {order.installments && (
                                <span style={{ fontSize: '12.5px', color: '#6E7180' }}>{order.installments}x de R$ {fmt(order.installmentAmount || 0)}</span>
                            )}
                        </div>

                        {/* Ledger financeiro */}
                        {(order.productCost ?? 0) > 0 && (
                            <LedgerRow label="Custo do produto" value={'– R$ ' + fmt(order.productCost ?? 0)} negative />
                        )}
                        {order.shippingPrice > 0 && (
                            <LedgerRow label="Frete" value={'R$ ' + fmt(order.shippingPrice)} />
                        )}
                        {bumpsTotal > 0 && (
                            <LedgerRow label="Order Bumps" value={'+ R$ ' + fmt(bumpsTotal)} />
                        )}

                        {order.paymentStatus === 'pago' && order.netReceived && (
                            <>
                                <LedgerRow label="Taxa do Mercado Pago" value={'– R$ ' + fmt((order.totalPrice || 0) - order.netReceived)} negative />
                                <LedgerRow label="Valor líquido recebido" value={'R$ ' + fmt(order.netReceived)} />
                                {profit !== null && (
                                    <LedgerRow label="Lucro" value={'R$ ' + fmt(profit)} positive />
                                )}
                            </>
                        )}

                        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', paddingTop: '12px', marginTop: '6px', borderTop: '1px solid #E5E7EF' }}>
                            <span style={{ fontSize: '13.5px', fontWeight: 600, color: '#6E7180' }}>Total do pedido</span>
                            <span style={{ fontFamily: "'Fraunces', serif", fontSize: '22px', fontWeight: 600 }}>R$ {fmt(order.totalPrice || 0)}</span>
                        </div>

                        {order.mpPaymentId && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#6E7180', marginTop: '16px', paddingTop: '14px', borderTop: '1px solid #E5E7EF' }}>
                                <Hash size={12.5} color="#6E7180" strokeWidth={2} />
                                ID da transação · <span style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{order.mpPaymentId}</span>
                            </div>
                        )}

                        {order.paymentMethod === 'pix' && (order.paymentStatus === 'aguardando' || order.paymentStatus === 'processando') && (
                            <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid #E5E7EF' }}>
                                <ResendPixButton orderId={order.id} />
                            </div>
                        )}
                    </div>
                </div>

                {/* ═══════════════ COL 2: Cliente + Endereco ═══════════════ */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', minWidth: 0, height: '100%' }}>

                    {/* ── Dados do Cliente ── */}
                    <div style={cardStyle}>
                        <CardHead icon={User} title="Dados do cliente" />

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                            <div style={{
                                width: '40px', height: '40px', borderRadius: '10px',
                                background: '#F8F0DB', color: '#A9832C',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: '16px', flexShrink: 0,
                            }}>
                                {order.fullName?.charAt(0).toUpperCase() || '?'}
                            </div>
                            <div style={{ fontSize: '15px', fontWeight: 700 }}>{order.fullName || 'Cliente sem nome'}</div>
                        </div>

                        <FieldRow icon={Hash} label="CPF" value={order.cpf || '—'} mono copyText={order.cpf || ''} />
                        <FieldRow icon={Mail} label="E-mail" value={order.email || 'Sem e-mail'} copyText={order.email || ''} />
                        <FieldRow icon={Phone} label="Telefone" value={order.phone || 'Sem telefone'} mono copyText={order.phone || ''} />
                    </div>

                    {/* ── Endereço de Entrega ── */}
                    <div style={cardStyle}>
                        <CardHead icon={MapPin} title="Endereço de entrega" />

                        <FieldRow label="Destinatário" value={order.recipient || order.fullName || '—'} />

                        <FieldRow label="Rua" value={order.rua || '—'} copyText={order.rua || ''} />
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: '16px' }}>
                            <FieldRow label="Número" value={order.numero || '—'} mono copyText={order.numero || ''} />
                            <FieldRow label="Complemento" value={order.complemento || '—'} copyText={order.complemento || ''} />
                        </div>
                        <FieldRow label="Bairro" value={order.bairro || '—'} copyText={order.bairro || ''} />
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: '16px' }}>
                            <FieldRow label="Cidade" value={order.cidade && order.estado ? (order.cidade + ' / ' + order.estado) : '—'} copyText={order.cidade && order.estado ? (order.cidade + ' / ' + order.estado) : ''} />
                            <FieldRow label="CEP" value={order.cep || '—'} mono copyText={order.cep || ''} />
                        </div>

                        {(order as any).referencia && (
                            <div style={{ marginTop: '12px', background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: '9px', padding: '10px 14px' }}>
                                <span style={{ fontSize: '12px', color: '#92400E', fontWeight: 500 }}>
                                    <span style={{ fontWeight: 700 }}>Ref:</span> {(order as any).referencia}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* ═══════════════ COL 3: Tracking + Email + UTM ═══════════════ */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', minWidth: 0, height: '100%' }}>
                    <TrackingManagement orderId={order.id} initialUrl={order.trackingUrl} />
                    <EmailSection orderId={order.id} email={order.email || ''} />

                    {utmData.length > 0 && (
                        <div style={cardStyle}>
                            <CardHead icon={Globe} title="UTM / Rastreamento" />
                            {utmData.map((utm) => (
                                <FieldRow key={utm.label} icon={Globe} label={utm.label} value={utm.value} mono copyText={utm.value} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

/* ═══════════════ COMPONENTS ═══════════════ */

const cardStyle: React.CSSProperties = {
    background: '#FFFFFF', border: '1px solid #E5E7EF', borderRadius: '14px', padding: '24px',
    flex: 1,
}

function Step({ done, current, failed, label }: { done?: boolean; current?: boolean; failed?: boolean; label: string }) {
    const dotStyle: React.CSSProperties = {
        width: '11px', height: '11px', borderRadius: '50%', flexShrink: 0,
        border: done || current ? 'none' : '2px solid #E5E7EF',
        background: failed ? '#B23B32' : current ? '#1E7A52' : done ? '#14151F' : '#fff',
        boxShadow: current ? '0 0 0 4px #E3F4EA' : 'none',
    }
    const labelColor = failed ? '#B23B32' : current ? '#1E7A52' : done ? '#14151F' : '#6E7180'
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '9px', flexShrink: 0 }}>
            <div style={dotStyle} />
            <span style={{ fontSize: '12.5px', fontWeight: 600, color: labelColor, whiteSpace: 'nowrap' }}>{label}</span>
        </div>
    )
}

function StatCard({ label, value, sub, hero, text }: { label: string; value: string; sub?: string; hero?: boolean; text?: boolean }) {
    return (
        <div style={{ background: '#fff', border: '1px solid #E5E7EF', borderRadius: '14px', padding: '19px 20px', minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{ fontSize: '10.5px', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#6E7180' }}>{label}</div>
            </div>
            <div style={{
                fontSize: hero ? '26px' : text ? '15.5px' : '22px',
                fontWeight: 600, lineHeight: 1.15,
                fontFamily: hero ? "'Fraunces', serif" : text ? "'Inter', sans-serif" : 'inherit',
                color: hero ? '#A9832C' : '#14151F',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: hero ? 'nowrap' : text ? 'normal' : 'nowrap',
            }}>
                {value}
            </div>
            {sub && <div style={{ fontSize: '12.5px', color: '#6E7180', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub}</div>}
        </div>
    )
}

function CardHead({ icon: Icon, title, tag }: { icon: any; title: string; tag?: string }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '11px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '9px', background: '#F5F6F9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid #E5E7EF' }}>
                    <Icon size={15} color="#14151F" strokeWidth={1.9} />
                </div>
                <div style={{ fontFamily: "'Fraunces', serif", fontSize: '17.5px', fontWeight: 600, letterSpacing: '-0.005em', color: '#14151F' }}>{title}</div>
            </div>
            {tag && <span style={{ fontSize: '11px', fontWeight: 600, color: '#6E7180', background: '#F5F6F9', padding: '4px 10px', borderRadius: '999px' }}>{tag}</span>}
        </div>
    )
}

function FieldRow({ icon: Icon, label, value, mono, copyText }: { icon?: any; label: string; value: string; mono?: boolean; copyText?: string }) {
    return (
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px', padding: '11px 0', borderBottom: '1px solid #E5E7EF' }}>
            <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '10.5px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#6E7180', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    {Icon && <Icon size={11} color="#6E7180" strokeWidth={2} />}
                    {label}
                </div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#14151F', wordBreak: 'break-word', fontFamily: mono ? "'IBM Plex Mono', monospace" : 'inherit', fontVariantNumeric: mono ? 'tabular-nums' : undefined }}>
                    {value}
                </div>
            </div>
            {copyText && <InlineCopyBtn text={copyText} />}
        </div>
    )
}

function LedgerRow({ label, value, negative, positive }: { label: string; value: string; negative?: boolean; positive?: boolean }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13.5px', padding: '7px 0' }}>
            <span style={{ color: '#6E7180' }}>{label}</span>
            <span style={{
                fontFamily: "'IBM Plex Mono', monospace", fontVariantNumeric: 'tabular-nums',
                color: negative ? '#B23B32' : positive ? '#1E7A52' : '#14151F',
                fontWeight: positive ? 700 : 400,
            }}>{value}</span>
        </div>
    )
}
