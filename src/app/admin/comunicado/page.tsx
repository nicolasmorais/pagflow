export const dynamic = 'force-dynamic'

import { findRefundOrders } from './queries'
import RefundNoticeClient from './RefundNoticeClient'
import { REFUND_PRODUCTS } from './notice'

export default async function ComunicadoPage() {
    let orders: Awaited<ReturnType<typeof findRefundOrders>> = []
    let loadError: string | null = null
    try {
        orders = await findRefundOrders()
    } catch (e: any) {
        console.error('[comunicado] Falha ao carregar pedidos:', e)
        loadError = String(e?.message || e).slice(0, 600)
    }

    const rows = orders.map(o => ({
        id: o.id,
        fullName: o.fullName || 'Sem nome',
        email: o.email || '',
        product: o.product?.name || '—',
        total: o.totalPrice,
        createdAt: o.createdAt.toISOString(),
        sentAt: o.emailLogs.find(l => l.status === 'sent')?.sentAt.toISOString() ?? null,
        lastError: o.emailLogs[0]?.status === 'error',
    }))

    return (
        <div className="od">
            <div className="od-head">
                <div>
                    <h1>Comunicado de reembolso</h1>
                    <p className="od-meta">
                        Pedidos pagos no cartão, ainda em processando, de: {REFUND_PRODUCTS.join(', ')}.
                    </p>
                </div>
            </div>
            {loadError ? (
                <section className="dash-card">
                    <p className="od-hint" style={{ color: 'var(--negative)' }}>Não consegui carregar os pedidos: {loadError}</p>
                </section>
            ) : (
                <RefundNoticeClient orders={rows} />
            )}
        </div>
    )
}
