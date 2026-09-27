export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { RefreshCw, Users, DollarSign, CheckCircle, TrendingUp } from 'lucide-react';
import SyncButton from './SyncButton';

const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const STATUS_CFG: Record<string, { label: string; bg: string; color: string; border: string }> = {
    pago:       { label: 'Pago',       bg: '#dcfce7', color: '#15803d', border: '#bbf7d0' },
    aguardando: { label: 'Aguardando', bg: '#fef3c7', color: '#92400e', border: '#fde68a' },
    processando:{ label: 'Aguardando', bg: '#fef3c7', color: '#92400e', border: '#fde68a' },
    recusado:   { label: 'Cancelado',  bg: '#fee2e2', color: '#b91c1c', border: '#fecaca' },
};
const getS = (s: string) => STATUS_CFG[s] ?? STATUS_CFG.aguardando;

function dateBR(d: Date) {
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
}
function timeBR(d: Date) {
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

// Calcula número da cobrança com base na data de criação (1 por semana)
function chargeNumber(createdAt: Date, refDate: Date = new Date()) {
    const diffMs = refDate.getTime() - createdAt.getTime();
    const weeks = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));
    return Math.max(1, weeks + 1);
}

export default async function AssinaturasPage() {
    // Busca todos os pedidos de assinatura (pix_automatico)
    const orders = await prisma.order.findMany({
        where: {
            paymentMethod: 'pix_automatico',
            deletedAt: null,
        },
        orderBy: { createdAt: 'desc' },
        include: { product: true },
    });

    const now = new Date();

    // ── KPIs ──────────────────────────────────────────────────────────
    const total = orders.length;
    const ativas = orders.filter(o => o.paymentStatus === 'pago').length;
    const aguardando = orders.filter(o => o.paymentStatus === 'aguardando' || o.paymentStatus === 'processando').length;
    const canceladas = orders.filter(o => o.paymentStatus === 'recusado').length;
    const receitaTotal = orders
        .filter(o => o.paymentStatus === 'pago')
        .reduce((sum, o) => sum + (o.totalPrice || 0), 0);

    // Receita projetada mensal (assinaturas ativas × 4 semanas)
    const receitaProjetada = ativas * (orders.find(o => o.paymentStatus === 'pago')?.totalPrice || 0) * 4;

    // Agrupado por produto
    const byProduct: Record<string, { name: string; count: number; ativas: number; receita: number }> = {};
    for (const o of orders) {
        const pid = o.productId || 'sem-produto';
        const pname = o.product?.name || 'Produto';
        if (!byProduct[pid]) byProduct[pid] = { name: pname, count: 0, ativas: 0, receita: 0 };
        byProduct[pid].count++;
        if (o.paymentStatus === 'pago') {
            byProduct[pid].ativas++;
            byProduct[pid].receita += o.totalPrice || 0;
        }
    }

    const kpis = [
        { icon: Users,        label: 'Total de Assinaturas',   value: total,                        color: '#6366f1', bg: '#eef2ff' },
        { icon: CheckCircle,  label: 'Assinaturas Ativas',     value: ativas,                       color: '#16a34a', bg: '#dcfce7' },
        { icon: DollarSign,   label: 'Receita Total (R$)',     value: `R$ ${fmt(receitaTotal)}`,    color: '#0369a1', bg: '#e0f2fe' },
        { icon: TrendingUp,   label: 'Receita Semanal Ativa',  value: `R$ ${fmt(ativas > 0 ? orders.filter(o=>o.paymentStatus==='pago').reduce((s,o)=>s+(o.totalPrice||0),0) : 0)}`, color: '#d97706', bg: '#fef3c7' },
    ];

    return (
        <div style={{ fontFamily: '"Space Grotesk", sans-serif', color: '#0f172a' }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <RefreshCw size={20} color="#16a34a" />
                    </div>
                    <div>
                        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>PIX Parcelado / Assinaturas</h1>
                        <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>Cobranças recorrentes via PIX Automático Semanal</p>
                    </div>
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8', background: '#f8fafc', padding: '6px 12px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                    {total} assinatura{total !== 1 ? 's' : ''} cadastrada{total !== 1 ? 's' : ''}
                </div>
            </div>

            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 28 }}>
                {kpis.map((k, i) => (
                    <div key={i} style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 11, background: k.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <k.icon size={20} color={k.color} />
                        </div>
                        <div>
                            <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{k.label}</div>
                            <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginTop: 2 }}>{k.value}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Status summary pills */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 24 }}>
                {[
                    { label: `${ativas} ativas`, bg: '#dcfce7', color: '#15803d', icon: '✅' },
                    { label: `${aguardando} aguardando autorização`, bg: '#fef3c7', color: '#92400e', icon: '⏳' },
                    { label: `${canceladas} canceladas`, bg: '#fee2e2', color: '#b91c1c', icon: '❌' },
                ].map((pill, i) => (
                    <span key={i} style={{ padding: '6px 14px', borderRadius: 99, background: pill.bg, color: pill.color, fontSize: 13, fontWeight: 600 }}>
                        {pill.icon} {pill.label}
                    </span>
                ))}
            </div>

            {/* Por produto */}
            {Object.keys(byProduct).length > 0 && (
                <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: '18px 20px', marginBottom: 24 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#64748b', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Resumo por Produto</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                        {Object.entries(byProduct).map(([pid, p]) => (
                            <div key={pid} style={{ background: '#f8fafc', borderRadius: 10, padding: '14px 16px', border: '1px solid #f1f5f9' }}>
                                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8, color: '#0f172a' }}>{p.name}</div>
                                <div style={{ display: 'flex', gap: 16, fontSize: 13 }}>
                                    <span style={{ color: '#64748b' }}>Total: <strong style={{ color: '#0f172a' }}>{p.count}</strong></span>
                                    <span style={{ color: '#16a34a' }}>Ativas: <strong>{p.ativas}</strong></span>
                                    <span style={{ color: '#0369a1' }}>R$ <strong>{fmt(p.receita)}</strong></span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Tabela de assinaturas */}
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                {/* Tabela header */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1.8fr 1.2fr 0.8fr 0.9fr 1fr 1fr 0.7fr',
                    padding: '11px 20px',
                    background: '#f8fafc',
                    borderBottom: '1px solid #e2e8f0',
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#94a3b8',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    gap: 8,
                }}>
                    <span>Assinante</span>
                    <span>Produto</span>
                    <span>Valor/sem</span>
                    <span>Cobrança</span>
                    <span>Iniciou em</span>
                    <span>Mandate ID</span>
                    <span>Status</span>
                </div>

                {orders.length === 0 ? (
                    <div style={{ padding: '60px 20px', textAlign: 'center', color: '#94a3b8' }}>
                        <RefreshCw size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
                        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Nenhuma assinatura ainda</div>
                        <div style={{ fontSize: 13 }}>Ative o PIX Automático em um produto para começar</div>
                    </div>
                ) : (
                    orders.map((order, idx) => {
                        const s = getS(order.paymentStatus);
                        const initials = (order.fullName || 'AS').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
                        const colors = ['#6366f1', '#16a34a', '#d97706', '#0369a1', '#db2777'];
                        const avatarBg = colors[order.fullName?.charCodeAt(0) ?? 0 % colors.length];

                        return (
                            <div
                                key={order.id}
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1.8fr 1.2fr 0.8fr 0.9fr 1fr 1fr 0.7fr',
                                    padding: '13px 20px',
                                    borderBottom: idx < orders.length - 1 ? '1px solid #f1f5f9' : 'none',
                                    alignItems: 'center',
                                    gap: 8,
                                }}
                            >
                                {/* Assinante */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: avatarBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                                        {initials}
                                    </div>
                                    <div style={{ minWidth: 0 }}>
                                        <div style={{ fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {order.fullName || '—'}
                                        </div>
                                        <div style={{ fontSize: 11, color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {order.email || '—'}
                                        </div>
                                    </div>
                                </div>

                                {/* Produto */}
                                <div style={{ fontSize: 13, color: '#475569', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {order.product?.name || '—'}
                                </div>

                                {/* Valor semanal */}
                                <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                                    R$ {fmt(order.totalPrice || 0)}
                                </div>

                                {/* Parcelas — botão sincroniza com Sync */}
                                <SyncButton
                                    orderId={order.id}
                                    initialParcelas={order.parcelasPagas ?? 0}
                                    totalParcelas={order.totalParcelas ?? 4}
                                />

                                {/* Data de início */}
                                <div style={{ fontSize: 12, color: '#64748b' }}>
                                    <div>{dateBR(order.createdAt)}</div>
                                    <div style={{ color: '#94a3b8' }}>{timeBR(order.createdAt)}</div>
                                </div>

                                {/* Mandate ID */}
                                <div style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={order.subscriptionMandateId || ''}>
                                    {order.subscriptionMandateId ? order.subscriptionMandateId.substring(0, 12) + '…' : '—'}
                                </div>

                                {/* Status */}
                                <div>
                                    <span style={{
                                        background: s.bg,
                                        color: s.color,
                                        border: `1px solid ${s.border}`,
                                        borderRadius: 6,
                                        padding: '3px 8px',
                                        fontSize: 11,
                                        fontWeight: 700,
                                        whiteSpace: 'nowrap',
                                    }}>
                                        {s.label}
                                    </span>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Legenda */}
            {orders.length > 0 && (
                <div style={{ marginTop: 16, padding: '12px 16px', background: '#f8fafc', borderRadius: 10, border: '1px solid #f1f5f9', fontSize: 12, color: '#94a3b8' }}>
                    💡 <strong style={{ color: '#64748b' }}>Nº da cobrança</strong> é calculado pela semana desde o início da assinatura. A Sync envia webhook{' '}
                    <code style={{ background: '#e2e8f0', padding: '1px 5px', borderRadius: 4, fontSize: 11 }}>cobranca_paga</code> a cada pagamento confirmado.
                </div>
            )}
        </div>
    );
}
