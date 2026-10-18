export const dynamic = 'force-dynamic'

import { findRefundOrders } from './actions'
import RefundNoticeClient from './RefundNoticeClient'
import { REFUND_PRODUCTS } from './template'

export default async function ComunicadoPage() {
    const orders = await findRefundOrders()

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
            <RefundNoticeClient orders={rows} />
        </div>
    )
}
