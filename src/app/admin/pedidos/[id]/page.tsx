import { prisma } from '@/lib/prisma'
import { ChevronLeft, Package, Zap, MessageCircle } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import EmailSection from './EmailSection'
import TrackingManagement from './TrackingManagement'
import AdminStatusTimeline from './AdminStatusTimeline'
import OrderStatusSelect from '../components/OrderStatusSelect'
import InlineCopyBtn from './InlineCopyBtn'
import MoveToTrashButton from './MoveToTrashButton'

export const dynamic = 'force-dynamic'

const TZ = 'America/Sao_Paulo'

const PAYMENT_STATUS: Record<string, { label: string; bg: string; color: string }> = {
    pago: { label: 'Pago', bg: '#E3F4EA', color: '#1E7A52' },
    aguardando: { label: 'Aguardando', bg: '#FEF3C7', color: '#92400E' },
    processando: { label: 'Aguardando', bg: '#FEF3C7', color: '#92400E' },
    recusado: { label: 'Recusado', bg: '#FBEAE8', color: '#B23B32' },
    reembolsado: { label: 'Reembolsado', bg: '#E7F1F8', color: '#2C5C86' },
    cancelado: { label: 'Cancelado', bg: '#FBEAE8', color: '#B23B32' },
}

const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const brl = (v: number) => `R$ ${fmt(v)}`

function methodLabel(method: string | null, brand: string | null, installments: number | null, installmentAmount: number | null) {
    if (method === 'pix') return 'PIX'
    if (method === 'pix_automatico') return 'PIX Parcelado'
    if (!method) return 'Método não informado'
    const b = brand ? brand.charAt(0).toUpperCase() + brand.slice(1).toLowerCase() : 'Cartão'
    if (installments && installments > 1) return `${b} · ${installments}× de ${brl(installmentAmount || 0)}`
    return `${b} · à vista`
}

function whatsappLink(phone: string | null) {
    const digits = (phone || '').replace(/\D/g, '')
    if (digits.length < 10) return null
    return `https://wa.me/${digits.length <= 11 ? `55${digits}` : digits}`
}

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const order = await prisma.order.findUnique({ where: { id }, include: { product: true } })
    if (!order) notFound()

    const bumpIds = Array.isArray(order.selectedBumps) ? (order.selectedBumps as string[]) : []
    const bumps = bumpIds.length > 0 ? await prisma.orderBump.findMany({ where: { id: { in: bumpIds } } }) : []

    /* ── Valores ── */
    const total = order.totalPrice || 0
    const productPrice = order.product?.price ?? 0
    const bumpsTotal = bumps.reduce((s, b) => s + (b.price || 0), 0)
    const shipping = order.shippingPrice || 0
    const adjustment = order.product ? Math.round((total - productPrice - bumpsTotal - shipping) * 100) / 100 : 0
    const adjustmentLabel = adjustment < 0
        ? 'Desconto'
        : (order.installments ?? 0) > 1 ? 'Juros do parcelamento' : 'Acréscimo'

    const isPaid = order.paymentStatus === 'pago'
    const net = isPaid && order.netReceived ? order.netReceived : null
    const costFromOrder = order.productCost || 0
    const cost = costFromOrder > 0 ? costFromOrder : (order.product?.cost ?? 0)
    const costIsEstimate = costFromOrder <= 0 && cost > 0
    const profit = net !== null && cost > 0 ? net - cost : null
    const fees = net !== null ? Math.round((total - net) * 100) / 100 : 0

    const status = PAYMENT_STATUS[order.paymentStatus] ?? PAYMENT_STATUS.aguardando
    const shortId = order.id.slice(0, 8).toUpperCase()
    const createdLabel = new Date(order.createdAt).toLocaleString('pt-BR', {
        day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: TZ,
    })
    const wa = whatsappLink(order.phone)
    const qty = order.product?.quantity ?? 1
    const itemCount = 1 + bumps.length

    const hasAddress = !!(order.rua || order.cidade || order.cep)
    const addressLine1 = [[order.rua, order.numero].filter(Boolean).join(', '), order.complemento].filter(Boolean).join(' – ')
    const addressLine2 = [order.bairro, [order.cidade, order.estado].filter(Boolean).join('/')].filter(Boolean).join(', ')
    const addressFull = [order.recipient || order.fullName, addressLine1, addressLine2, order.cep ? `CEP ${order.cep}` : null]
        .filter(Boolean).join('\n')

    const utm = ([
        ['Source', order.utmSource], ['Medium', order.utmMedium], ['Campaign', order.utmCampaign],
        ['Term', order.utmTerm], ['Content', order.utmContent], ['Placement', order.utmPlacement],
        ['ID', order.utmId], ['Criativo', order.utmCreativeName],
    ] as const).filter(([, v]) => !!v) as [string, string][]

    return (
        <div className="od">
            <Link href="/admin/pedidos" className="od-crumb">
                <ChevronLeft size={14} strokeWidth={2.4} aria-hidden />
                Pedidos
            </Link>

            {order.deletedAt && (
                <div role="status" style={{ padding: '10px 14px', borderRadius: 10, background: '#FEF3C7', color: '#92400E', fontSize: 13, fontWeight: 600 }}>
                    Este pedido está na lixeira. <Link href="/admin/pedidos/lixeira" className="od-link" style={{ color: '#92400E', textDecoration: 'underline' }}>Abrir lixeira</Link>
                </div>
            )}

            {/* ── Cabeçalho ── */}
            <header className="od-head">
                <div>
                    <h1>Pedido <span className="od-id">#{shortId}</span></h1>
                    <div className="od-meta">
                        <span>{createdLabel}</span>
                        <span aria-hidden>·</span>
                        <span>Pagamento</span>
                        <span className="dash-badge" style={{ background: status.bg, color: status.color }}>{status.label}</span>
                    </div>
                </div>
                <div className="od-head-actions">
                    <span className="od-logistics">
                        Logística
                        <OrderStatusSelect orderId={order.id} initialStatus={order.status || 'pendente'} />
                    </span>
                    {wa && (
                        <a href={wa} target="_blank" rel="noopener noreferrer" className="od-btn">
                            <MessageCircle size={14} aria-hidden />
                            WhatsApp
                        </a>
                    )}
                    {!order.deletedAt && <MoveToTrashButton orderId={order.id} />}
                </div>
            </header>

            {/* ── Resumo ── */}
            <section className="dash-card od-summary" aria-label="Resumo financeiro">
                <div className="dash-stats od-stats">
                    <Stat
                        label="Total do pedido"
                        value={brl(total)}
                        hint={methodLabel(order.paymentMethod, order.cardBrand, order.installments, order.installmentAmount)}
                        large
                    />
                    <Stat
                        label="Recebido líquido"
                        value={net !== null ? brl(net) : '—'}
                        hint={net !== null ? (fees >= 0.01 ? `${brl(fees)} em taxas` : 'Sem taxas') : isPaid ? 'Repasse não informado' : 'Pagamento não aprovado'}
                        muted={net === null}
                    />
                    <Stat
                        label="Custo do produto"
                        value={cost > 0 ? brl(cost) : '—'}
                        hint={cost > 0 ? (costIsEstimate ? 'Custo atual do produto' : 'Registrado no pedido') : 'Cadastre o custo no produto'}
                        muted={cost <= 0}
                    />
                    <Stat
                        label="Lucro estimado"
                        value={profit !== null ? brl(profit) : '—'}
                        hint={profit !== null && net ? `${Math.round((profit / net) * 100)}% do líquido` : net === null ? 'Sem valor líquido do gateway' : 'Sem custo do produto'}
                        tone={profit === null ? 'muted' : profit >= 0 ? 'positive' : 'negative'}
                    />
                </div>
            </section>

            {/* ── Conteúdo ── */}
            <div className="od-grid">
                <div className="od-col">

                    {/* Itens + contas */}
                    <section className="dash-card">
                        <div className="od-card-head">
                            <h2>Itens</h2>
                            <span>{itemCount} {itemCount === 1 ? 'item' : 'itens'}</span>
                        </div>

                        <div className="od-item">
                            <div className="od-thumb">
                                {order.product?.imageUrl
                                    ? <img src={order.product.imageUrl} alt="" />
                                    : <Package size={18} aria-hidden />}
                            </div>
                            <div className="od-item-body">
                                <p className="od-item-name">{order.product?.name || 'Produto removido do catálogo'}</p>
                                <p className="od-item-sub">{qty} {qty === 1 ? 'unidade' : 'unidades'} na Shopee</p>
                            </div>
                            {order.product && <span className="od-item-price">{brl(productPrice)}</span>}
                        </div>

                        {bumps.map(b => (
                            <div key={b.id} className="od-item">
                                <div className="od-thumb">
                                    {b.imageUrl ? <img src={b.imageUrl} alt="" /> : <Zap size={16} aria-hidden />}
                                </div>
                                <div className="od-item-body">
                                    <p className="od-item-name">{b.name}</p>
                                    <p className="od-item-sub">Order bump</p>
                                </div>
                                <span className="od-item-price">{brl(b.price || 0)}</span>
                            </div>
                        ))}

                        <dl className="od-ledger">
                            {order.product && <LedgerRow label="Produto" value={brl(productPrice)} />}
                            {bumpsTotal > 0 && <LedgerRow label={bumps.length === 1 ? 'Order bump' : `Order bumps (${bumps.length})`} value={brl(bumpsTotal)} />}
                            {order.product && <LedgerRow label="Frete" value={shipping > 0 ? brl(shipping) : 'Grátis'} />}
                            {Math.abs(adjustment) >= 0.01 && (
                                <LedgerRow label={adjustmentLabel} value={`${adjustment < 0 ? '− ' : '+ '}${brl(Math.abs(adjustment))}`} tone={adjustment < 0 ? 'neg' : undefined} />
                            )}
                            <div className="od-ledger-total">
                                <dt>Total</dt>
                                <dd>{brl(total)}</dd>
                            </div>
                        </dl>

                        {(net !== null || order.paymentMethod === 'pix_automatico') && (
                            <>
                                <p className="od-subhead">Recebimento</p>
                                <dl className="od-ledger" style={{ marginTop: 0 }}>
                                    {order.paymentMethod === 'pix_automatico' && (
                                        <LedgerRow label="Parcelas pagas" value={`${order.parcelasPagas} de ${order.totalParcelas}`} />
                                    )}
                                    {net !== null && (
                                        <>
                                            {fees >= 0.01 && <LedgerRow label="Taxas do gateway" value={`− ${brl(fees)}`} tone="neg" />}
                                            <LedgerRow label="Líquido recebido" value={brl(net)} tone="strong" />
                                            {cost > 0 && <LedgerRow label="Custo do produto" value={`− ${brl(cost)}`} tone="neg" />}
                                            {profit !== null && (
                                                <LedgerRow label="Lucro estimado" value={brl(profit)} tone={profit >= 0 ? 'pos' : 'neg'} />
                                            )}
                                        </>
                                    )}
                                </dl>
                                {order.paymentMethod === 'pix_automatico' && (
                                    <Link href={`/admin/pix-parcelado/${order.id}`} className="od-link">Ver parcelas do PIX Parcelado →</Link>
                                )}
                            </>
                        )}

                        {order.mpPaymentId && (
                            <div className="od-txn">
                                <span>ID da transação</span>
                                <code>{order.mpPaymentId}</code>
                                <InlineCopyBtn text={order.mpPaymentId} label="Copiar ID da transação" />
                            </div>
                        )}
                    </section>

                    {/* Logística */}
                    <section className="dash-card">
                        <div className="od-card-head">
                            <h2>Logística</h2>
                        </div>
                        <AdminStatusTimeline
                            status={order.status || 'pendente'}
                            paymentStatus={order.paymentStatus || undefined}
                            createdAt={order.createdAt.toISOString()}
                            paidAt={order.paidAt?.toISOString() || null}
                            shippedAt={order.shippedAt?.toISOString() || null}
                            deliveredAt={order.deliveredAt?.toISOString() || null}
                        />
                    </section>

                    <TrackingManagement orderId={order.id} initialUrl={order.trackingUrl} initialTrackingCode={order.trackingCode} />
                </div>

                <div className="od-col">

                    {/* Cliente */}
                    <section className="dash-card">
                        <div className="od-card-head">
                            <h2>Cliente</h2>
                        </div>
                        <p className="od-customer-name">{order.fullName || 'Cliente sem nome'}</p>
                        <dl className="od-rows">
                            <DataRow label="CPF" value={order.cpf} />
                            <DataRow label="E-mail" value={order.email} />
                            <DataRow label="Telefone" value={order.phone} />
                        </dl>

                        <p className="od-address-label">Endereço de entrega</p>
                        {hasAddress ? (
                            <>
                                <div className="od-address">
                                    <div>
                                        <p className="od-address-name">{order.recipient || order.fullName}</p>
                                        {addressLine1 && <p>{addressLine1}</p>}
                                        {addressLine2 && <p>{addressLine2}</p>}
                                        {order.cep && <p>CEP {order.cep}</p>}
                                        {order.referencia && <p className="od-address-ref">Referência: {order.referencia}</p>}
                                    </div>
                                    <InlineCopyBtn text={addressFull} label="Copiar endereço completo" />
                                </div>
                                <dl className="od-pair">
                                    <DataRow label="CEP" value={order.cep} />
                                    <DataRow label="Número" value={order.numero} />
                                </dl>
                            </>
                        ) : (
                            <p className="od-hint" style={{ marginTop: 0 }}>Endereço não informado.</p>
                        )}
                    </section>

                    <EmailSection
                        orderId={order.id}
                        email={order.email || ''}
                        paymentStatus={order.paymentStatus}
                        paymentMethod={order.paymentMethod || ''}
                        hasTracking={!!(order.trackingCode || order.trackingUrl)}
                    />

                    {utm.length > 0 && (
                        <section className="dash-card">
                            <div className="od-card-head">
                                <h2>Origem do tráfego</h2>
                            </div>
                            <dl className="od-rows">
                                {utm.map(([label, value]) => <DataRow key={label} label={label} value={value} />)}
                            </dl>
                        </section>
                    )}
                </div>
            </div>
        </div>
    )
}

/* ── Primitivos ── */

function Stat({ label, value, hint, large, muted, tone }: {
    label: string; value: string; hint?: string; large?: boolean; muted?: boolean
    tone?: 'positive' | 'negative' | 'muted'
}) {
    const color = tone === 'positive' ? '#1E7A52' : tone === 'negative' ? '#B23B32' : undefined
    return (
        <div className="dash-stat">
            <p className="dash-stat-label">{label}</p>
            <p
                className={`dash-stat-value${muted || tone === 'muted' ? ' is-muted' : ''}`}
                style={{ fontSize: large ? '28px' : undefined, color }}
            >
                {value}
            </p>
            {hint && <div className="dash-stat-foot"><span>{hint}</span></div>}
        </div>
    )
}

function LedgerRow({ label, value, tone }: { label: string; value: string; tone?: 'neg' | 'pos' | 'strong' }) {
    return (
        <div className={`od-ledger-row${tone ? ` is-${tone}` : ''}`}>
            <dt>{label}</dt>
            <dd>{value}</dd>
        </div>
    )
}

function DataRow({ label, value }: { label: string; value: string | null | undefined }) {
    return (
        <div className="od-row">
            <div className="od-row-body">
                <dt>{label}</dt>
                <dd className={value ? undefined : 'is-empty'}>{value || 'Não informado'}</dd>
            </div>
            {value && <InlineCopyBtn text={value} label={`Copiar ${label}`} />}
        </div>
    )
}
