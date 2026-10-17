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

const STATUS_CONFIG: Record<string, { bg: string; color: string; border: string; label: string }> = {
    pago: { bg: '#E3F4EA', color: '#1E7A52', border: '#C3E8D4', label: 'Pago' },
    recusado: { bg: '#FBEAE8', color: '#B23B32', border: '#F5CDC9', label: 'Recusado' },
    reembolsado: { bg: '#E7F1F8', color: '#2C5C86', border: '#C5DDEF', label: 'Reembolsado' },
    aguardando: { bg: '#FEF3C7', color: '#92400E', border: '#FDE68A', label: 'Aguardando' },
    processando: { bg: '#FEF3C7', color: '#92400E', border: '#FDE68A', label: 'Aguardando' },
    atendido: { bg: '#E3F4EA', color: '#1E7A52', border: '#C3E8D4', label: 'Atendido' },
    cancelado: { bg: '#FBEAE8', color: '#B23B32', border: '#F5CDC9', label: 'Cancelado' },
}
const getStatus = (s: string) => STATUS_CONFIG[s?.toLowerCase()] ?? STATUS_CONFIG.processando

const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

function paymentMethodLabel(method: string | null, cardBrand: string | null, installments: number | null, installmentAmount: number | null) {
    if (!method) return '—'
    if (method === 'pix') return 'PIX'
    if (method === 'pix_automatico') return 'PIX Parcelado'
    const brand = cardBrand ? cardBrand.toUpperCase() : 'Cartão'
    if (installments && installments > 1) return `${brand} ${installments}× R$ ${fmt(installmentAmount || 0)}`
    return `${brand} à vista`
}

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
                            background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`,
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <OrderStatusSelect orderId={order.id} initialStatus={order.status || 'pendente'} />
                    <form action={async () => {
                        'use server'
                        await deleteOrder(id)
                        redirect('/admin/pedidos')
                    }}>
                        <button type="submit" style={{
                            display: 'inline-flex', alignItems: 'center', gap: '7px',
                            background: 'transparent', border: '1px solid #E5E7EF', color: '#6E7180',
                            fontSize: '13px', fontWeight: 600, padding: '9px 15px', borderRadius: '9px',
                            cursor: 'pointer', fontFamily: 'inherit',
                        }}>
                            <Trash2 size={14} strokeWidth={2} />
                            Excluir
                        </button>
                    </form>
                </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid #E5E7EF', margin: '0 0 24px' }} />

            {/* ── Summary Stats Bar ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '28px' }}>
                <SummaryCard
                    label="Total do pedido"
                    value={`R$ ${fmt(order.totalPrice || 0)}`}
                    icon={DollarSign}
                    highlight
                />
                <SummaryCard
                    label="Método de pagamento"
                    value={paymentMethodLabel(order.paymentMethod, order.cardBrand, order.installments, order.installmentAmount)}
                    icon={CreditCard}
                />
                <SummaryCard
                    label="Produto"
                    value={order.product?.name ?? 'Sem produto'}
                    icon={Package}
                    truncate
                />
                {profit !== null ? (
                    <SummaryCard
                        label="Lucro estimado"
                        value={`R$ ${fmt(profit)}`}
                        icon={TrendingUp}
                        positive={profit >= 0}
                    />
                ) : order.netReceived ? (
                    <SummaryCard
                        label="Valor líquido"
                        value={`R$ ${fmt(order.netReceived)}`}
                        icon={ArrowDownLeft}
                    />
                ) : (
                    <SummaryCard
                        label="Frete"
                        value={order.shippingPrice > 0 ? `R$ ${fmt(order.shippingPrice)}` : 'Grátis'}
                        icon={Truck}
                    />
                )}
            </div>

            {/* ── Content Grid ── */}
            <div className="pedido-content-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', alignItems: 'start' }}>

                {/* ═══════════════ COL 1: Pedido + Timeline + Tracking ═══════════════ */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', minWidth: 0 }}>

                    {/* ── Informações do Pedido ── */}
                    <div style={cardStyle}>
                        <CardHead icon={ReceiptText} title="Informações do pedido" />

                        {/* Produto */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', paddingBottom: '16px', borderBottom: '1px solid #E5E7EF', marginBottom: '14px' }}>
                            {order.product?.imageUrl ? (
                                <div style={{ width: '52px', height: '52px', borderRadius: '12px', flexShrink: 0, border: '1px solid #E5E7EF', overflow: 'hidden', background: '#F5F6F9' }}>
                                    <img src={order.product.imageUrl} alt={order.product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </div>
                            ) : (
                                <div style={{ width: '52px', height: '52px', borderRadius: '12px', flexShrink: 0, background: '#F5F6F9', border: '1px solid #E5E7EF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Package size={22} color="#6E7180" strokeWidth={2} />
                                </div>
                            )}
                            <div style={{ minWidth: 0, flex: 1 }}>
                                <div style={{ fontSize: '14px', fontWeight: 700, color: '#14151F', lineHeight: 1.3 }}>{order.product?.name || 'Produto removido'}</div>
                                <div style={{ fontSize: '11.5px', color: '#6E7180', marginTop: '3px', fontFamily: "'IBM Plex Mono', monospace" }}>
                                    SKU {order.id.slice(0, 8).toUpperCase()} · Qtd {order.product?.quantity ?? 1}
                                    {orderBumps.length > 0 && ` · +${orderBumps.length} bump${orderBumps.length > 1 ? 's' : ''}`}
                                </div>
                            </div>
                            <div style={{ fontSize: '14.5px', fontWeight: 700, whiteSpace: 'nowrap', color: '#14151F' }}>R$ {fmt(order.product?.price || 0)}</div>
                        </div>

                        {/* Order Bumps */}
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
                                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#14151F' }}>{bump.name}</div>
                                    <div style={{ fontSize: '10px', color: '#6E7180', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: '2px' }}>Order Bump</div>
                                </div>
                                <div style={{ fontSize: '13px', fontWeight: 700, whiteSpace: 'nowrap', color: '#14151F' }}>R$ {fmt(bump.price || 0)}</div>
                            </div>
                        ))}

                        {/* Método */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
                            {order.paymentMethod === 'pix' ? (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#E7F1F8', color: '#2C5C86', fontSize: '11.5px', fontWeight: 700, padding: '5px 11px', borderRadius: '7px' }}>PIX</span>
                            ) : order.paymentMethod === 'pix_automatico' ? (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#dcfce7', color: '#15803d', fontSize: '11.5px', fontWeight: 700, padding: '5px 11px', borderRadius: '7px' }}>PIX Parcelado</span>
                            ) : (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#E7F1F8', color: '#2C5C86', fontSize: '11.5px', fontWeight: 700, padding: '5px 11px', borderRadius: '7px' }}>
                                    {order.cardBrand ? order.cardBrand.toUpperCase() : 'CARTÃO'}
                                </span>
                            )}
                            {order.paymentMethod === 'pix_automatico' && (
                                <span style={{ fontSize: '12.5px', color: '#6E7180' }}>
                                    {order.parcelasPagas ?? 0}/{order.totalParcelas ?? 4} parcelas pagas
                                </span>
                            )}
                            {order.installments && order.paymentMethod !== 'pix_automatico' && (
                                <span style={{ fontSize: '12.5px', color: '#6E7180' }}>{order.installments}× de R$ {fmt(order.installmentAmount || 0)}</span>
                            )}
                            {order.paymentMethod === 'pix_automatico' && (
                                <Link href={`/admin/pix-parcelado/${order.id}`} style={{ fontSize: '11.5px', color: '#15803d', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, background: '#f0fdf4', padding: '5px 10px', borderRadius: 7, border: '1px solid #bbf7d0' }}>
                                    Ver PIX Parcelado →
                                </Link>
                            )}
                        </div>

                        {/* Ledger */}
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
                                    <LedgerRow label="Lucro estimado" value={'R$ ' + fmt(profit)} positive={profit >= 0} negative={profit < 0} />
                                )}
                            </>
                        )}

                        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', paddingTop: '12px', marginTop: '6px', borderTop: '2px solid #14151F' }}>
                            <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#14151F' }}>Total</span>
                            <span style={{ fontFamily: "'Fraunces', serif", fontSize: '24px', fontWeight: 600 }}>R$ {fmt(order.totalPrice || 0)}</span>
                        </div>

                        {order.mpPaymentId && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#6E7180', marginTop: '16px', paddingTop: '14px', borderTop: '1px solid #E5E7EF' }}>
                                <Hash size={12.5} color="#6E7180" strokeWidth={2} />
                                ID transação · <span style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{order.mpPaymentId}</span>
                                <InlineCopyBtn text={order.mpPaymentId} />
                            </div>
                        )}

                        {order.paymentMethod === 'pix' && (order.paymentStatus === 'aguardando' || order.paymentStatus === 'processando') && (
                            <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid #E5E7EF' }}>
                                <ResendPixButton orderId={order.id} />
                            </div>
                        )}
                    </div>

                    {/* ── Status Timeline ── */}
                    <div style={cardStyle}>
                        <CardHead icon={Truck} title="Status do Pedido" />
                        <AdminStatusTimeline
                            status={order.status || 'pendente'}
                            paymentStatus={order.paymentStatus || undefined}
                            createdAt={order.createdAt.toISOString()}
                            paidAt={order.paidAt?.toISOString() || null}
                            shippedAt={order.shippedAt?.toISOString() || null}
                            deliveredAt={order.deliveredAt?.toISOString() || null}
                        />
                    </div>

                    {/* ── Tracking ── */}
                    <TrackingManagement orderId={order.id} initialUrl={order.trackingUrl} initialTrackingCode={order.trackingCode} />
                </div>

                {/* ═══════════════ COL 2: Cliente + Endereço ═══════════════ */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', minWidth: 0 }}>

                    <div style={cardStyle}>
                        <CardHead icon={User} title="Dados do cliente" />

                        {/* Avatar + nome */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px', paddingBottom: '18px', borderBottom: '1px solid #E5E7EF' }}>
                            <div style={{
                                width: '44px', height: '44px', borderRadius: '12px',
                                background: '#F8F0DB', color: '#A9832C',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: '18px', flexShrink: 0,
                            }}>
                                {order.fullName?.charAt(0).toUpperCase() || '?'}
                            </div>
                            <div>
                                <div style={{ fontSize: '15px', fontWeight: 700, color: '#14151F' }}>{order.fullName || 'Cliente sem nome'}</div>
                                <div style={{ fontSize: '12px', color: '#6E7180', marginTop: '2px' }}>Cliente</div>
                            </div>
                        </div>

                        <FieldRow icon={Hash} label="CPF" value={order.cpf || '—'} mono copyText={order.cpf || ''} />
                        <FieldRow icon={Mail} label="E-mail" value={order.email || 'Sem e-mail'} copyText={order.email || ''} />
                        <FieldRow icon={Phone} label="Telefone" value={order.phone || 'Sem telefone'} mono copyText={order.phone || ''} />

                        {/* Endereço */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#6E7180', margin: '20px 0 8px' }}>
                            <MapPin size={12} color="#6E7180" strokeWidth={2} />
                            Endereço de entrega
                        </div>

                        {/* Endereço como bloco de envio */}
                        {(order.rua || order.cidade) ? (
                            <div style={{ background: '#F5F6F9', border: '1px solid #E5E7EF', borderRadius: '10px', padding: '14px 16px', marginBottom: '4px' }}>
                                <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#14151F', lineHeight: 1.5 }}>
                                    {order.recipient || order.fullName}
                                </div>
                                <div style={{ fontSize: '13px', color: '#3A3C4A', lineHeight: 1.6, marginTop: '4px' }}>
                                    {[order.rua, order.numero].filter(Boolean).join(', ')}
                                    {order.complemento && ` – ${order.complemento}`}
                                    <br />
                                    {order.bairro && `${order.bairro}, `}
                                    {[order.cidade, order.estado].filter(Boolean).join(' / ')}
                                    {order.cep && (
                                        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px', color: '#6E7180' }}> · CEP {order.cep}</span>
                                    )}
                                </div>
                                {(order as any).referencia && (
                                    <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #E5E7EF', fontSize: '12px', color: '#6E7180' }}>
                                        <span style={{ fontWeight: 700 }}>Ref:</span> {(order as any).referencia}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <p style={{ fontSize: '13px', color: '#6E7180', fontStyle: 'italic', margin: 0 }}>Endereço não informado.</p>
                        )}

                        {/* Copy campos individuais */}
                        <div style={{ marginTop: '8px', display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: '16px' }}>
                            {order.cep && <FieldRow label="CEP" value={order.cep} mono copyText={order.cep} />}
                            {order.numero && <FieldRow label="Número" value={order.numero} mono copyText={order.numero} />}
                        </div>
                    </div>
                </div>

                {/* ═══════════════ COL 3: Email + UTM ═══════════════ */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', minWidth: 0 }}>
                    <EmailSection
                        orderId={order.id}
                        email={order.email || ''}
                        paymentStatus={order.paymentStatus || 'processando'}
                        paymentMethod={order.paymentMethod || ''}
                        trackingCode={order.trackingCode}
                    />

                    {utmData.length > 0 && (
                        <div style={cardStyle}>
                            <CardHead icon={Globe} title="UTM / Rastreamento" />
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: '16px' }}>
                                {utmData.map((utm) => (
                                    <FieldRow key={utm.label} label={utm.label} value={utm.value} mono copyText={utm.value} />
                                ))}
                            </div>
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
}

function SummaryCard({ label, value, icon: Icon, highlight, positive, truncate }: {
    label: string; value: string; icon: any; highlight?: boolean; positive?: boolean; truncate?: boolean
}) {
    return (
        <div style={{
            background: highlight ? '#14151F' : '#fff',
            border: `1px solid ${highlight ? 'transparent' : '#E5E7EF'}`,
            borderRadius: '12px', padding: '16px 18px',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <Icon size={13} color={highlight ? '#9ca3af' : '#6E7180'} strokeWidth={2} />
                <span style={{ fontSize: '10.5px', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: highlight ? '#9ca3af' : '#6E7180' }}>{label}</span>
            </div>
            <div style={{
                fontSize: highlight ? '20px' : '15px',
                fontWeight: 700, lineHeight: 1.2,
                fontFamily: highlight ? "'Fraunces', serif" : 'inherit',
                color: highlight ? '#fff' : positive === false ? '#B23B32' : positive ? '#1E7A52' : '#14151F',
                overflow: 'hidden', textOverflow: truncate ? 'ellipsis' : undefined, whiteSpace: truncate ? 'nowrap' : undefined,
            }}>
                {value}
            </div>
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
            <div style={{ minWidth: 0, flex: 1 }}>
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
