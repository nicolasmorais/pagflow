export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { RefreshCw, Users, DollarSign, TrendingUp, BarChart3, CheckCircle, ArrowRight } from 'lucide-react';

const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function nextDebitDate(createdAt: Date, parcelasPagas: number): string {
    if (parcelasPagas === 0) return '—';
    const next = new Date(createdAt.getTime() + parcelasPagas * 7 * 24 * 60 * 60 * 1000);
    return next.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

const STATUS_CFG: Record<string, { label: string; bg: string; color: string; dot: string }> = {
    pago:        { label: 'Ativa',      bg: '#dcfce7', color: '#15803d', dot: '#16a34a' },
    aguardando:  { label: 'Aguardando', bg: '#fef3c7', color: '#92400e', dot: '#d97706' },
    processando: { label: 'Aguardando', bg: '#fef3c7', color: '#92400e', dot: '#d97706' },
    recusado:    { label: 'Cancelada',  bg: '#fee2e2', color: '#b91c1c', dot: '#ef4444' },
};
const getS = (s: string) => STATUS_CFG[s] ?? STATUS_CFG.aguardando;

const AVATAR_COLORS = ['#6366f1', '#16a34a', '#d97706', '#0369a1', '#db2777', '#7c3aed', '#0891b2'];
function avatarColor(name: string) {
    return AVATAR_COLORS[(name?.charCodeAt(0) ?? 0) % AVATAR_COLORS.length];
}
function initials(name: string) {
    return (name || 'AS').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

export default async function PixParceladoPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
    const { filter } = await searchParams;

    const allOrders = await prisma.order.findMany({
        where: { paymentMethod: 'pix_automatico', deletedAt: null },
        orderBy: { createdAt: 'desc' },
        include: { product: true },
    });

    // KPI calculations (always from allOrders)
    const total = allOrders.length;
    const ativas = allOrders.filter(o => o.paymentStatus === 'pago').length;
    const aguardando = allOrders.filter(o => o.paymentStatus === 'aguardando' || o.paymentStatus === 'processando').length;
    const canceladas = allOrders.filter(o => o.paymentStatus === 'recusado').length;

    const receitaRealizada = allOrders.reduce((sum, o) => sum + (o.parcelasPagas ?? 0) * (o.totalPrice ?? 0), 0);
    const projecaoReceber = allOrders
        .filter(o => o.paymentStatus === 'pago')
        .reduce((sum, o) => sum + ((o.totalParcelas ?? 4) - (o.parcelasPagas ?? 0)) * (o.totalPrice ?? 0), 0);

    // Filtered list
    const orders = filter === 'ativas' ? allOrders.filter(o => o.paymentStatus === 'pago')
        : filter === 'aguardando' ? allOrders.filter(o => o.paymentStatus === 'aguardando' || o.paymentStatus === 'processando')
        : filter === 'canceladas' ? allOrders.filter(o => o.paymentStatus === 'recusado')
        : allOrders;

    // Footer totals for filtered set
    const filteredRecebido = orders.reduce((s, o) => s + (o.parcelasPagas ?? 0) * (o.totalPrice ?? 0), 0);
    const filteredAReceber = orders.filter(o => o.paymentStatus === 'pago').reduce((s, o) => s + ((o.totalParcelas ?? 4) - (o.parcelasPagas ?? 0)) * (o.totalPrice ?? 0), 0);

    const kpis = [
        { icon: Users,       label: 'Total PIX Parcelado', value: total,                          color: '#6366f1', bg: '#eef2ff' },
        { icon: CheckCircle, label: 'Assinaturas Ativas',  value: ativas,                         color: '#16a34a', bg: '#dcfce7' },
        { icon: DollarSign,  label: 'Receita Realizada',   value: `R$ ${fmt(receitaRealizada)}`,  color: '#0369a1', bg: '#e0f2fe' },
        { icon: TrendingUp,  label: 'Projeção a Receber',  value: `R$ ${fmt(projecaoReceber)}`,   color: '#d97706', bg: '#fef3c7' },
    ];

    const filters: { key: string; label: string; count: number }[] = [
        { key: '',          label: 'Todos',      count: total },
        { key: 'ativas',    label: 'Ativas',     count: ativas },
        { key: 'aguardando',label: 'Aguardando', count: aguardando },
        { key: 'canceladas',label: 'Canceladas', count: canceladas },
    ];

    return (
        <div style={{ fontFamily: '"Space Grotesk", sans-serif', color: '#0f172a' }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 11, background: 'linear-gradient(135deg,#16a34a,#15803d)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(22,163,74,0.3)' }}>
                        <RefreshCw size={20} color="#fff" />
                    </div>
                    <div>
                        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>PIX Parcelado</h1>
                        <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>Cobranças recorrentes via PIX Automático · Woovi</p>
                    </div>
                </div>
                <Link href="/admin/pix-parcelado/analytics" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, background: 'linear-gradient(135deg,#6366f1,#4f46e5)', color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}>
                    <BarChart3 size={14} /> Análises
                </Link>
            </div>

            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 24 }}>
                {kpis.map((k, i) => (
                    <div key={i} style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ width: 46, height: 46, borderRadius: 12, background: k.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <k.icon size={21} color={k.color} />
                        </div>
                        <div>
                            <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{k.label}</div>
                            <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginTop: 2 }}>{k.value}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filtros */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
                {filters.map(f => {
                    const active = (filter ?? '') === f.key;
                    return (
                        <Link
                            key={f.key}
                            href={f.key ? `/admin/pix-parcelado?filter=${f.key}` : '/admin/pix-parcelado'}
                            style={{
                                padding: '6px 14px', borderRadius: 99, fontSize: 13, fontWeight: 600,
                                textDecoration: 'none', cursor: 'pointer',
                                background: active ? '#0f172a' : '#f1f5f9',
                                color: active ? '#fff' : '#64748b',
                                border: active ? '1px solid #0f172a' : '1px solid #e2e8f0',
                            }}
                        >
                            {f.label} <span style={{ opacity: 0.7, fontSize: 11, marginLeft: 4 }}>{f.count}</span>
                        </Link>
                    );
                })}
            </div>

            {/* Tabela */}
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                {/* Header */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1.4fr 0.7fr 1.1fr 1.1fr 0.9fr 0.7fr',
                    padding: '11px 20px',
                    background: '#f8fafc',
                    borderBottom: '1px solid #e2e8f0',
                    fontSize: 11, fontWeight: 700, color: '#94a3b8',
                    textTransform: 'uppercase', letterSpacing: '0.05em', gap: 8,
                }}>
                    <span>Cliente</span>
                    <span>Produto</span>
                    <span>Plano</span>
                    <span>Recebido</span>
                    <span>A Receber</span>
                    <span>Próx. Débito</span>
                    <span>Status</span>
                </div>

                {orders.length === 0 ? (
                    <div style={{ padding: '60px 20px', textAlign: 'center', color: '#94a3b8' }}>
                        <RefreshCw size={32} style={{ marginBottom: 12, opacity: 0.3 }} />
                        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Nenhum resultado</div>
                        <div style={{ fontSize: 13 }}>Tente outro filtro ou aguarde novas assinaturas</div>
                    </div>
                ) : (
                    orders.map((order, idx) => {
                        const s = getS(order.paymentStatus);
                        const pagas = order.parcelasPagas ?? 0;
                        const total = order.totalParcelas ?? 4;
                        const preco = order.totalPrice ?? 0;
                        const recebido = pagas * preco;
                        const aReceber = order.paymentStatus === 'pago' ? (total - pagas) * preco : 0;
                        const nextDebit = nextDebitDate(order.createdAt, pagas);

                        return (
                            <Link
                                key={order.id}
                                href={`/admin/pix-parcelado/${order.id}`}
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: '2fr 1.4fr 0.7fr 1.1fr 1.1fr 0.9fr 0.7fr',
                                    padding: '13px 20px',
                                    borderBottom: idx < orders.length - 1 ? '1px solid #f1f5f9' : 'none',
                                    alignItems: 'center', gap: 8,
                                    textDecoration: 'none', color: 'inherit',
                                    transition: 'background 0.1s',
                                }}
                                onMouseEnter={undefined}
                            >
                                {/* Cliente */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                                    <div style={{ width: 34, height: 34, borderRadius: '50%', background: avatarColor(order.fullName || ''), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                                        {initials(order.fullName || '')}
                                    </div>
                                    <div style={{ minWidth: 0 }}>
                                        <div style={{ fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{order.fullName || '—'}</div>
                                        <div style={{ fontSize: 11, color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{order.email || '—'}</div>
                                    </div>
                                </div>

                                {/* Produto */}
                                <div style={{ fontSize: 13, color: '#475569', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {order.product?.name || '—'}
                                </div>

                                {/* Plano */}
                                <div>
                                    <span style={{ background: '#f0f9ff', color: '#0369a1', borderRadius: 6, padding: '3px 8px', fontSize: 12, fontWeight: 700 }}>
                                        {total}×
                                    </span>
                                </div>

                                {/* Recebido */}
                                <div>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: '#16a34a' }}>R$ {fmt(recebido)}</div>
                                    <div style={{ fontSize: 11, color: '#94a3b8' }}>{pagas}/{total} parc.</div>
                                </div>

                                {/* A Receber */}
                                <div>
                                    {aReceber > 0 ? (
                                        <>
                                            <div style={{ fontSize: 13, fontWeight: 700, color: '#0369a1' }}>R$ {fmt(aReceber)}</div>
                                            <div style={{ fontSize: 11, color: '#94a3b8' }}>{total - pagas} parc.</div>
                                        </>
                                    ) : (
                                        <div style={{ fontSize: 12, color: '#94a3b8' }}>—</div>
                                    )}
                                </div>

                                {/* Próx. Débito */}
                                <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>
                                    {nextDebit}
                                </div>

                                {/* Status */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: s.dot, flexShrink: 0 }} />
                                    <span style={{ background: s.bg, color: s.color, borderRadius: 6, padding: '3px 8px', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>
                                        {s.label}
                                    </span>
                                </div>
                            </Link>
                        );
                    })
                )}

                {/* Footer totais */}
                {orders.length > 0 && (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '2fr 1.4fr 0.7fr 1.1fr 1.1fr 0.9fr 0.7fr',
                        padding: '12px 20px',
                        background: '#f8fafc',
                        borderTop: '2px solid #e2e8f0',
                        fontSize: 12, fontWeight: 700, gap: 8,
                    }}>
                        <div style={{ color: '#64748b' }}>Total ({orders.length} registros)</div>
                        <div />
                        <div />
                        <div style={{ color: '#16a34a' }}>R$ {fmt(filteredRecebido)}</div>
                        <div style={{ color: '#0369a1' }}>R$ {fmt(filteredAReceber)}</div>
                        <div />
                        <div />
                    </div>
                )}
            </div>

            {/* Legenda */}
            <div style={{ marginTop: 16, padding: '10px 16px', background: '#f8fafc', borderRadius: 10, border: '1px solid #f1f5f9', fontSize: 12, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 8 }}>
                <ArrowRight size={12} />
                Clique em qualquer linha para ver o detalhe completo da assinatura · A Woovi debita automaticamente a cada 7 dias
            </div>
        </div>
    );
}
