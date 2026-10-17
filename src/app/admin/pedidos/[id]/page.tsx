import { prisma } from '@/lib/prisma'
import {
    ChevronLeft, Trash2, Package, Phone, Mail,
    MapPin, CreditCard, User, Truck, ReceiptText,
    DollarSign, Hash, Globe, Zap, TrendingUp, ArrowDownLeft,
} from 'lucide-react'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { deleteOrder } from '@/app/actions'
import EmailSection from './EmailSection'
import TrackingManagement from './TrackingManagement'
import AdminStatusTimeline from './AdminStatusTimeline'
import OrderStatusSelect from '../components/OrderStatusSelect'
import InlineCopyBtn from './InlineCopyBtn'
import ResendPixButton from './ResendPixButton'

/* ── Status config ── */
const STATUS_CFG: Record<string, { bg: string; color: string; border: string; label: string }> = {
    pago:        { bg: '#E3F4EA', color: '#1E7A52', border: '#C3E8D4', label: 'Pago' },
    recusado:    { bg: '#FBEAE8', color: '#B23B32', border: '#F5CDC9', label: 'Recusado' },
    reembolsado: { bg: '#E7F1F8', color: '#2C5C86', border: '#C5DDEF', label: 'Reembolsado' },
    aguardando:  { bg: '#FEF3C7', color: '#92400E', border: '#FDE68A', label: 'Aguardando' },
    processando: { bg: '#FEF3C7', color: '#92400E', border: '#FDE68A', label: 'Aguardando' },
    atendido:    { bg: '#E3F4EA', color: '#1E7A52', border: '#C3E8D4', label: 'Atendido' },
    cancelado:   { bg: '#FBEAE8', color: '#B23B32', border: '#F5CDC9', label: 'Cancelado' },
}
const getStatus = (s: string) => STATUS_CFG[s?.toLowerCase()] ?? STATUS_CFG.processando
const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

function methodLabel(
    method: string | null,
    brand: string | null,
    installments: number | null,
    installmentAmount: number | null,
) {
    if (!method) return '—'
    if (method === 'pix') return 'PIX'
    if (method === 'pix_automatico') return 'PIX Parcelado'
    const b = brand ? brand.toUpperCase() : 'Cartão'
    if (installments && installments > 1) return `${b} ${installments}× R$ ${fmt(installmentAmount || 0)}`
    return `${b} à vista`
}

/* ══════════════════════════════════════════════════════ PAGE ══════════════════════════════════════════════════════ */

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const order = await prisma.order.findUnique({ where: { id }, include: { product: true } })
    if (!order) notFound()

    const bumpIds  = Array.isArray(order.selectedBumps) ? order.selectedBumps as string[] : []
    const orderBumps = bumpIds.length > 0
        ? await prisma.orderBump.findMany({ where: { id: { in: bumpIds } } })
        : []
    const bumpsTotal = orderBumps.reduce((s, b) => s + (b.price || 0), 0)

    const utmFields = [
        { key: 'utmSource',       label: 'Source'   },
        { key: 'utmMedium',       label: 'Medium'   },
        { key: 'utmCampaign',     label: 'Campaign' },
        { key: 'utmTerm',         label: 'Term'     },
        { key: 'utmContent',      label: 'Content'  },
        { key: 'utmPlacement',    label: 'Placement'},
        { key: 'utmId',           label: 'ID'       },
        { key: 'utmCreativeName', label: 'Creative' },
    ] as const
    const utmData = utmFields
        .map(f => ({ label: f.label, value: (order as any)[f.key] }))
        .filter(u => u.value)

    const ps     = order.paymentStatus || 'processando'
    const sc     = getStatus(ps)
    const profit = order.netReceived && (order.productCost ?? 0) > 0
        ? order.netReceived - (order.productCost ?? 0) : null

    const createdAt = new Date(order.createdAt)
    const dateStr   = createdAt.toLocaleDateString('pt-BR',  { day: '2-digit', month: 'long', year: 'numeric' })
    const timeStr   = createdAt.toLocaleTimeString('pt-BR',  { hour: '2-digit', minute: '2-digit' })

    return (
        <div style={{ paddingBottom: '64px', color: '#14151F' }}>

            {/* ── Breadcrumb ── */}
            <nav style={{ marginBottom: '22px' }}>
                <Link href="/admin/pedidos" style={{
                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                    fontSize: '13px', fontWeight: 600, color: '#6E7180', textDecoration: 'none',
                }}>
                    <ChevronLeft size={13} strokeWidth={2.5} />
                    Pedidos
                </Link>
            </nav>

            {/* ── Page Header ── */}
            <div style={{
                display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
                gap: '16px', flexWrap: 'wrap', marginBottom: '24px',
            }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                        <h1 style={{
                            fontFamily: "'IBM Plex Mono', monospace",
                            fontSize: 'clamp(22px, 3vw, 28px)',
                            fontWeight: 500, letterSpacing: '-0.01em',
                            margin: 0, color: '#14151F', fontVariantNumeric: 'tabular-nums',
                        }}>
                            #{order.id.slice(0, 8).toUpperCase()}
                        </h1>
                        <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '6px',
                            fontSize: '12px', fontWeight: 700, padding: '5px 12px', borderRadius: '999px',
                            background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`,
                        }}>
                            <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'currentColor', flexShrink: 0 }} />
                            {sc.label}
                        </span>
                    </div>
                    <p style={{ fontSize: '13px', color: '#6E7180', margin: '6px 0 0' }}>
                        {dateStr} · {timeStr}
                    </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                    <OrderStatusSelect orderId={order.id} initialStatus={order.status || 'pendente'} />
                    <form action={async () => {
                        'use server'
                        await deleteOrder(id)
                        redirect('/admin/pedidos')
                    }}>
                        <button type="submit" style={{
                            display: 'inline-flex', alignItems: 'center', gap: '6px',
                            background: 'transparent', border: '1px solid #E5E7EF', color: '#6E7180',
                            fontSize: '13px', fontWeight: 600, padding: '9px 14px', borderRadius: '9px',
                            cursor: 'pointer', fontFamily: 'inherit',
                        }}>
                            <Trash2 size={13} strokeWidth={2} />
                            Excluir
                        </button>
                    </form>
                </div>
            </div>

            <div style={{ borderTop: '1px solid #E5E7EF', marginBottom: '24px' }} />

            {/* ── Summary Strip (4 stats) ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
                <StatCard
                    label="Total do pedido"
                    value={`R$ ${fmt(order.totalPrice || 0)}`}
                    icon={DollarSign}
                    variant="dark"
                />
                <StatCard
                    label="Pagamento"
                    value={methodLabel(order.paymentMethod, order.cardBrand, order.installments, order.installmentAmount)}
                    icon={CreditCard}
                />
                <StatCard
                    label="Produto"
                    value={order.product?.name ?? 'Sem produto'}
                    icon={Package}
                    truncate
                />
                {profit !== null ? (
                    <StatCard
                        label="Lucro estimado"
                        value={`R$ ${fmt(profit)}`}
                        icon={TrendingUp}
                        variant={profit >= 0 ? 'positive' : 'negative'}
                    />
                ) : order.netReceived ? (
                    <StatCard
                        label="Valor líquido"
                        value={`R$ ${fmt(order.netReceived)}`}
                        icon={ArrowDownLeft}
                    />
                ) : (
                    <StatCard
                        label="Frete"
                        value={order.shippingPrice > 0 ? `R$ ${fmt(order.shippingPrice)}` : 'Grátis'}
                        icon={Truck}
                    />
                )}
            </div>

            {/* ── 2-Column Grid ── */}
            <div className="order-detail-grid" style={{
                display: 'grid',
                gridTemplateColumns: '1fr 400px',
                gap: '20px',
                alignItems: 'start',
            }}>

                {/* ══ LEFT — Pedido + Timeline + Tracking ══ */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minWidth: 0 }}>

                    {/* ── Detalhes do pedido ── */}
                    <section style={CARD}>
                        <CardHead icon={ReceiptText} title="Detalhes do pedido" />

                        {/* Product row */}
                        <ProductRow
                            imageUrl={order.product?.imageUrl}
                            name={order.product?.name || 'Produto removido'}
                            sku={order.id.slice(0, 8).toUpperCase()}
                            qty={order.product?.quantity ?? 1}
                            price={order.product?.price || 0}
                        />

                        {/* Order Bumps */}
                        {orderBumps.map(bump => (
                            <BumpRow
                                key={bump.id}
                                name={bump.name}
                                imageUrl={bump.imageUrl}
                                price={bump.price || 0}
                            />
                        ))}

                        {/* Payment + Ledger */}
                        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #E5E7EF' }}>

                            {/* Payment method chips */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
                                {order.paymentMethod === 'pix' ? (
                                    <Chip bg="#E7F1F8" color="#2C5C86">PIX</Chip>
                                ) : order.paymentMethod === 'pix_automatico' ? (
                                    <>
                                        <Chip bg="#dcfce7" color="#15803d">PIX Parcelado</Chip>
                                        <span style={{ fontSize: '12.5px', color: '#6E7180' }}>
                                            {order.parcelasPagas ?? 0}/{order.totalParcelas ?? 4} parcelas pagas
                                        </span>
                                        <Link
                                            href={`/admin/pix-parcelado/${order.id}`}
                                            style={{
                                                fontSize: '11.5px', color: '#15803d', fontWeight: 700,
                                                textDecoration: 'none', display: 'inline-flex', alignItems: 'center',
                                                gap: 4, background: '#f0fdf4', padding: '5px 10px',
                                                borderRadius: 7, border: '1px solid #bbf7d0',
                                            }}
                                        >
                                            Ver PIX Parcelado →
                                        </Link>
                                    </>
                                ) : (
                                    <>
                                        <Chip bg="#E7F1F8" color="#2C5C86">
                                            {order.cardBrand ? order.cardBrand.toUpperCase() : 'CARTÃO'}
                                        </Chip>
                                        {order.installments && order.paymentMethod !== 'pix_automatico' && (
                                            <span style={{ fontSize: '12.5px', color: '#6E7180' }}>
                                                {order.installments}× de R$ {fmt(order.installmentAmount || 0)}
                                            </span>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* Ledger rows */}
                            {(order.productCost ?? 0) > 0 && (
                                <LedgerRow label="Custo do produto" value={`– R$ ${fmt(order.productCost ?? 0)}`} negative />
                            )}
                            {order.shippingPrice > 0 && (
                                <LedgerRow label="Frete" value={`R$ ${fmt(order.shippingPrice)}`} />
                            )}
                            {bumpsTotal > 0 && (
                                <LedgerRow label={`Order Bumps (${orderBumps.length})`} value={`+ R$ ${fmt(bumpsTotal)}`} />
                            )}
                            {order.paymentStatus === 'pago' && order.netReceived && (
                                <>
                                    <LedgerRow
                                        label="Taxa Mercado Pago"
                                        value={`– R$ ${fmt((order.totalPrice || 0) - order.netReceived)}`}
                                        negative
                                    />
                                    <LedgerRow label="Valor líquido recebido" value={`R$ ${fmt(order.netReceived)}`} />
                                    {profit !== null && (
                                        <LedgerRow
                                            label="Lucro estimado"
                                            value={`R$ ${fmt(profit)}`}
                                            positive={profit >= 0}
                                            negative={profit < 0}
                                        />
                                    )}
                                </>
                            )}

                            {/* Total */}
                            <div style={{
                                display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
                                paddingTop: '12px', marginTop: '4px', borderTop: '2px solid #14151F',
                            }}>
                                <span style={{ fontSize: '12px', fontWeight: 700, color: '#14151F', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Total
                                </span>
                                <span style={{ fontFamily: "'Fraunces', serif", fontSize: '26px', fontWeight: 600, color: '#14151F' }}>
                                    R$ {fmt(order.totalPrice || 0)}
                                </span>
                            </div>

                            {/* Transaction ID */}
                            {order.mpPaymentId && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '14px', paddingTop: '14px', borderTop: '1px solid #E5E7EF' }}>
                                    <Hash size={12} color="#6E7180" strokeWidth={2} />
                                    <span style={{ fontSize: '12px', color: '#6E7180', fontFamily: "'IBM Plex Mono', monospace" }}>
                                        {order.mpPaymentId}
                                    </span>
                                    <InlineCopyBtn text={order.mpPaymentId} />
                                </div>
                            )}

                            {/* PIX Resend */}
                            {order.paymentMethod === 'pix' && ['aguardando', 'processando'].includes(order.paymentStatus || '') && (
                                <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #E5E7EF' }}>
                                    <ResendPixButton orderId={order.id} />
                                </div>
                            )}
                        </div>
                    </section>

                    {/* ── Status Timeline ── */}
                    <section style={CARD}>
                        <CardHead icon={Truck} title="Status do pedido" />
                        <AdminStatusTimeline
                            status={order.status || 'pendente'}
                            paymentStatus={order.paymentStatus || undefined}
                            createdAt={order.createdAt.toISOString()}
                            paidAt={order.paidAt?.toISOString() || null}
                            shippedAt={order.shippedAt?.toISOString() || null}
                            deliveredAt={order.deliveredAt?.toISOString() || null}
                        />
                    </section>

                    {/* ── Tracking ── */}
                    <TrackingManagement
                        orderId={order.id}
                        initialUrl={order.trackingUrl}
                        initialTrackingCode={order.trackingCode}
                    />
                </div>

                {/* ══ RIGHT — Cliente + Emails + UTM ══ */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minWidth: 0 }}>

                    {/* ── Dados do cliente ── */}
                    <section style={CARD}>
                        <CardHead icon={User} title="Dados do cliente" />

                        {/* Avatar + name */}
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '12px',
                            paddingBottom: '16px', marginBottom: '16px', borderBottom: '1px solid #E5E7EF',
                        }}>
                            <div style={{
                                width: '42px', height: '42px', borderRadius: '12px', flexShrink: 0,
                                background: '#F8F0DB', color: '#A9832C',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: '18px',
                            }}>
                                {order.fullName?.charAt(0).toUpperCase() || '?'}
                            </div>
                            <div>
                                <div style={{ fontSize: '14.5px', fontWeight: 700, color: '#14151F' }}>
                                    {order.fullName || 'Cliente sem nome'}
                                </div>
                                <div style={{ fontSize: '12px', color: '#6E7180', marginTop: '1px' }}>Cliente</div>
                            </div>
                        </div>

                        <Field icon={Hash}  label="CPF"      value={order.cpf   || '—'}            mono copyText={order.cpf   || ''} />
                        <Field icon={Mail}  label="E-mail"   value={order.email || 'Sem e-mail'}        copyText={order.email  || ''} />
                        <Field icon={Phone} label="Telefone" value={order.phone || 'Sem telefone'} mono copyText={order.phone  || ''} />

                        {/* Address */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#6E7180', margin: '18px 0 8px' }}>
                            <MapPin size={11} color="#6E7180" strokeWidth={2} />
                            Endereço de entrega
                        </div>

                        {(order.rua || order.cidade) ? (
                            <>
                                <div style={{ background: '#F5F6F9', border: '1px solid #E5E7EF', borderRadius: '10px', padding: '12px 14px' }}>
                                    <p style={{ fontSize: '13.5px', fontWeight: 700, color: '#14151F', lineHeight: 1.5, margin: 0 }}>
                                        {order.recipient || order.fullName}
                                    </p>
                                    <p style={{ fontSize: '13px', color: '#3A3C4A', lineHeight: 1.65, margin: '3px 0 0' }}>
                                        {[order.rua, order.numero].filter(Boolean).join(', ')}
                                        {order.complemento && ` – ${order.complemento}`}
                                        <br />
                                        {order.bairro && `${order.bairro}, `}
                                        {[order.cidade, order.estado].filter(Boolean).join(' / ')}
                                        {order.cep && (
                                            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11.5px', color: '#6E7180' }}>
                                                {' · '}{order.cep}
                                            </span>
                                        )}
                                    </p>
                                    {(order as any).referencia && (
                                        <p style={{ fontSize: '11.5px', color: '#6E7180', margin: '8px 0 0', paddingTop: '8px', borderTop: '1px solid #E5E7EF' }}>
                                            <strong>Ref:</strong> {(order as any).referencia}
                                        </p>
                                    )}
                                </div>
                                <div style={{ marginTop: '4px', display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: '8px' }}>
                                    {order.cep    && <Field label="CEP"    value={order.cep}    mono copyText={order.cep}    />}
                                    {order.numero && <Field label="Número" value={order.numero} mono copyText={order.numero} />}
                                </div>
                            </>
                        ) : (
                            <p style={{ fontSize: '13px', color: '#6E7180', fontStyle: 'italic', margin: 0 }}>
                                Endereço não informado.
                            </p>
                        )}
                    </section>

                    {/* ── E-mails ── */}
                    <EmailSection
                        orderId={order.id}
                        email={order.email || ''}
                        paymentStatus={order.paymentStatus || 'processando'}
                        paymentMethod={order.paymentMethod || ''}
                        trackingCode={order.trackingCode}
                    />

                    {/* ── UTM ── */}
                    {utmData.length > 0 && (
                        <section style={CARD}>
                            <CardHead icon={Globe} title="Rastreamento UTM" />
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: '8px' }}>
                                {utmData.map(u => (
                                    <Field key={u.label} label={u.label} value={u.value} mono copyText={u.value} />
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            </div>

            <style>{`
                @media (max-width: 1120px) {
                    .order-detail-grid { grid-template-columns: 1fr !important; }
                }
            `}</style>
        </div>
    )
}

/* ══════════════════════════════════════════════════════ CONSTANTS ══ */

const CARD: React.CSSProperties = {
    background: '#FFFFFF',
    border: '1px solid #E5E7EF',
    borderRadius: '14px',
    padding: '22px 24px',
}

/* ══════════════════════════════════════════════════════ COMPONENTS ══ */

function StatCard({ label, value, icon: Icon, variant, truncate }: {
    label: string
    value: string
    icon: any
    variant?: 'dark' | 'positive' | 'negative'
    truncate?: boolean
}) {
    const isDark     = variant === 'dark'
    const isPositive = variant === 'positive'
    const isNegative = variant === 'negative'
    const valColor   = isDark ? '#FFFFFF' : isPositive ? '#1E7A52' : isNegative ? '#B23B32' : '#14151F'
    const lblColor   = isDark ? 'rgba(255,255,255,0.5)' : '#6E7180'

    return (
        <div style={{
            background: isDark ? '#14151F' : '#FFFFFF',
            border:     `1px solid ${isDark ? 'transparent' : '#E5E7EF'}`,
            borderRadius: '12px',
            padding: '15px 18px',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '8px' }}>
                <Icon size={12} color={lblColor} strokeWidth={2} />
                <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: lblColor }}>
                    {label}
                </span>
            </div>
            <div style={{
                fontSize: isDark ? '20px' : '14px',
                fontWeight: 700, lineHeight: 1.2, color: valColor,
                fontFamily: isDark ? "'Fraunces', serif" : 'inherit',
                overflow: truncate ? 'hidden' : undefined,
                textOverflow: truncate ? 'ellipsis' : undefined,
                whiteSpace: truncate ? 'nowrap' : undefined,
            }}>
                {value}
            </div>
        </div>
    )
}

function CardHead({ icon: Icon, title }: { icon: any; title: string }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
            <div style={{
                width: '30px', height: '30px', borderRadius: '8px', flexShrink: 0,
                background: '#F5F6F9', border: '1px solid #E5E7EF',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
                <Icon size={14} color="#14151F" strokeWidth={1.9} />
            </div>
            <span style={{ fontFamily: "'Fraunces', serif", fontSize: '16px', fontWeight: 600, color: '#14151F', letterSpacing: '-0.01em' }}>
                {title}
            </span>
        </div>
    )
}

function Field({ icon: Icon, label, value, mono, copyText }: {
    icon?: any; label: string; value: string; mono?: boolean; copyText?: string
}) {
    return (
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', padding: '10px 0', borderBottom: '1px solid #E5E7EF' }}>
            <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#6E7180', marginBottom: '3px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {Icon && <Icon size={10} color="#9CA3AF" strokeWidth={2} />}
                    {label}
                </div>
                <div style={{
                    fontSize: '13.5px', fontWeight: 600, color: '#14151F', wordBreak: 'break-word',
                    fontFamily: mono ? "'IBM Plex Mono', monospace" : 'inherit',
                    fontVariantNumeric: mono ? 'tabular-nums' : undefined,
                }}>
                    {value}
                </div>
            </div>
            {copyText && <InlineCopyBtn text={copyText} />}
        </div>
    )
}

function ProductRow({ imageUrl, name, sku, qty, price }: {
    imageUrl?: string | null; name: string; sku: string; qty: number; price: number
}) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '14px', borderBottom: '1px solid #E5E7EF' }}>
            {imageUrl ? (
                <div style={{ width: '44px', height: '44px', borderRadius: '10px', flexShrink: 0, border: '1px solid #E5E7EF', overflow: 'hidden', background: '#F5F6F9' }}>
                    <img src={imageUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
            ) : (
                <div style={{ width: '44px', height: '44px', borderRadius: '10px', flexShrink: 0, background: '#F5F6F9', border: '1px solid #E5E7EF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Package size={18} color="#6E7180" strokeWidth={1.8} />
                </div>
            )}
            <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#14151F', lineHeight: 1.3 }}>{name}</div>
                <div style={{ fontSize: '11px', color: '#6E7180', marginTop: '2px', fontFamily: "'IBM Plex Mono', monospace" }}>
                    SKU {sku} · Qtd {qty}
                </div>
            </div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '14px', fontWeight: 700, color: '#14151F', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                R$ {fmt(price)}
            </div>
        </div>
    )
}

function BumpRow({ name, imageUrl, price }: { name: string; imageUrl?: string | null; price: number }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0', borderBottom: '1px solid #E5E7EF' }}>
            {imageUrl ? (
                <div style={{ width: '38px', height: '38px', borderRadius: '8px', flexShrink: 0, border: '1px solid #E5E7EF', overflow: 'hidden', background: '#F5F6F9' }}>
                    <img src={imageUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
            ) : (
                <div style={{ width: '38px', height: '38px', borderRadius: '8px', flexShrink: 0, background: '#FEF3C7', border: '1px solid #FDE68A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Zap size={14} color="#92400E" strokeWidth={2} />
                </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#14151F' }}>{name}</div>
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#92400E', background: '#FEF3C7', border: '1px solid #FDE68A', display: 'inline-block', padding: '1px 6px', borderRadius: '4px', marginTop: '3px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                    Bump
                </span>
            </div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px', fontWeight: 700, color: '#14151F', whiteSpace: 'nowrap' }}>
                + R$ {fmt(price)}
            </div>
        </div>
    )
}

function LedgerRow({ label, value, negative, positive }: { label: string; value: string; negative?: boolean; positive?: boolean }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', fontSize: '13px' }}>
            <span style={{ color: '#6E7180' }}>{label}</span>
            <span style={{
                fontFamily: "'IBM Plex Mono', monospace", fontVariantNumeric: 'tabular-nums',
                color: negative ? '#B23B32' : positive ? '#1E7A52' : '#14151F',
                fontWeight: positive ? 700 : 400,
            }}>
                {value}
            </span>
        </div>
    )
}

function Chip({ children, bg, color }: { children: React.ReactNode; bg: string; color: string }) {
    return (
        <span style={{ display: 'inline-flex', alignItems: 'center', background: bg, color, fontSize: '11.5px', fontWeight: 700, padding: '4px 10px', borderRadius: '6px' }}>
            {children}
        </span>
    )
}
