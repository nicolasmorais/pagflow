export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/prisma';
import { getSubscription, listInstallments } from '@/lib/woovi-subscription';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, RefreshCw, User, Package, CreditCard, TrendingUp, AlertTriangle, CheckCircle, Clock, XCircle } from 'lucide-react';
import WooviButton from '../WooviButton';
import SubscriptionActions from '../SubscriptionActions';

const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function dateBR(iso: string | null | undefined) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
}
function dateBRShort(iso: string | null | undefined) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

function estimatedDate(createdAt: Date, parcelaIndex: number): string {
    const d = new Date(createdAt.getTime() + parcelaIndex * 7 * 24 * 60 * 60 * 1000);
    return dateBRShort(d.toISOString());
}

const STATUS_CFG: Record<string, { label: string; color: string; bg: string; border: string }> = {
    ACTIVE:    { label: 'Ativa',     color: '#15803d', bg: '#dcfce7', border: '#bbf7d0' },
    CANCELED:  { label: 'Cancelada', color: '#b91c1c', bg: '#fee2e2', border: '#fecaca' },
    active:    { label: 'Ativa',     color: '#15803d', bg: '#dcfce7', border: '#bbf7d0' },
    cancelled: { label: 'Cancelada', color: '#b91c1c', bg: '#fee2e2', border: '#fecaca' },
};

const CHARGE_STATUS: Record<string, { label: string; color: string; bg: string }> = {
    COMPLETED: { label: 'Paga',      color: '#15803d', bg: '#dcfce7' },
    ACTIVE:    { label: 'Pendente',  color: '#92400e', bg: '#fef3c7' },
    EXPIRED:   { label: 'Expirada',  color: '#6b7280', bg: '#f1f5f9' },
    CANCELED:  { label: 'Cancelada', color: '#b91c1c', bg: '#fee2e2' },
    paid:      { label: 'Paga',      color: '#15803d', bg: '#dcfce7' },
    pending:   { label: 'Pendente',  color: '#92400e', bg: '#fef3c7' },
    expired:   { label: 'Expirada',  color: '#6b7280', bg: '#f1f5f9' },
};

const WOOVI_FEE = 0.01; // 1% estimado por parcela

export default async function PixParceladoDetailPage({ params }: { params: Promise<{ orderId: string }> }) {
    const { orderId } = await params;

    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { product: true },
    });

    if (!order || order.paymentMethod !== 'pix_automatico') notFound();

    let syncData: any = null;
    let syncError = '';
    let charges: any[] = [];

    if (order.mpPaymentId) {
        try {
            [syncData, charges] = await Promise.all([
                getSubscription(order.mpPaymentId),
                listInstallments(order.mpPaymentId),
            ]);
        } catch (e: any) {
            syncError = e.message;
        }
    }

    const totalParcelas = order.totalParcelas ?? 4;
    const installmentValue = order.totalPrice ?? 0;
    const productCost = order.product?.cost ?? 0;

    const parcelasPagasWoovi = charges.filter((c: any) =>
        c.status === 'COMPLETED' || c.status === 'paid' || c.status === 'PAID'
    ).length;
    const parcelasPagas = parcelasPagasWoovi || order.parcelasPagas || 0;

    // Financeiro
    const receitaContratada = totalParcelas * installmentValue;
    const receitaRealizada = parcelasPagas * installmentValue;
    const receitaProjetada = (totalParcelas - parcelasPagas) * installmentValue;
    const custoWoovi = receitaContratada * WOOVI_FEE;
    const custoWooviRealizado = receitaRealizada * WOOVI_FEE;
    const lucroRealizado = receitaRealizada - productCost - custoWooviRealizado;
    const lucroProjetado = receitaContratada - productCost - custoWoovi;

    const statusCfg = syncData
        ? (STATUS_CFG[syncData.status] ?? { label: syncData.status, color: '#64748b', bg: '#f1f5f9', border: '#e2e8f0' })
        : null;

    // Normalizar charges para o SubscriptionActions
    const normalizedCharges = charges.map((c: any, idx: number) => ({
        cycle: c.number ?? c.cycle_number ?? (idx + 1),
        status: c.status,
        amount: c.value != null ? (c.value / 100).toFixed(2).replace('.', ',') : c.amount ?? '—',
        dueDate: c.dueDate ?? c.due_date ?? null,
        paidAt: c.paidAt ?? c.paid_at ?? null,
        correlationID: c.correlationID ?? c.correlation_id ?? null,
    }));

    // Build timeline: merge real charges with estimated future ones
    const timeline = Array.from({ length: totalParcelas }, (_, i) => {
        const realCharge = charges[i];
        const num = i + 1;
        const isPaid = realCharge && (realCharge.status === 'COMPLETED' || realCharge.status === 'paid' || realCharge.status === 'PAID');
        const isExpired = realCharge && (realCharge.status === 'EXPIRED' || realCharge.status === 'expired');
        const isCanceled = realCharge && (realCharge.status === 'CANCELED' || realCharge.status === 'cancelled');

        return {
            num,
            status: isPaid ? 'paid' : isExpired ? 'expired' : isCanceled ? 'canceled' : 'pending',
            paidAt: realCharge?.paidAt ?? realCharge?.paid_at ?? null,
            estimatedDate: estimatedDate(order.createdAt, i),
            amount: realCharge?.value != null ? (realCharge.value / 100).toFixed(2).replace('.', ',') : installmentValue.toFixed(2).replace('.', ','),
            correlationID: realCharge?.correlationID ?? null,
        };
    });

    const card: React.CSSProperties = { background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: '20px' };
    const cardTitle = (icon: React.ReactNode, label: string) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            {icon}
            <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>{label}</span>
        </div>
    );
    const fieldRow = (label: string, value: string | null | undefined, mono = false) => (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid #f1f5f9', fontSize: 13 }}>
            <span style={{ color: '#94a3b8', fontWeight: 600, flexShrink: 0, marginRight: 12 }}>{label}</span>
            <span style={{ color: '#0f172a', fontWeight: 600, fontFamily: mono ? '"IBM Plex Mono", monospace' : undefined, textAlign: 'right', wordBreak: 'break-all' }}>{value || '—'}</span>
        </div>
    );

    return (
        <div style={{ fontFamily: '"Space Grotesk", sans-serif', color: '#0f172a', maxWidth: 1400 }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28, flexWrap: 'wrap' }}>
                <Link href="/admin/pix-parcelado" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 9, background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#64748b', textDecoration: 'none', flexShrink: 0 }}>
                    <ArrowLeft size={16} />
                </Link>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{order.fullName || 'Assinante'}</h1>
                    <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>{order.email} · PIX Parcelado {totalParcelas}×</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {statusCfg && (
                        <span style={{ background: statusCfg.bg, color: statusCfg.color, border: `1px solid ${statusCfg.border}`, borderRadius: 8, padding: '5px 14px', fontSize: 13, fontWeight: 700 }}>
                            {statusCfg.label}
                        </span>
                    )}
                    <WooviButton orderId={order.id} initialParcelas={parcelasPagas} totalParcelas={totalParcelas} />
                </div>
            </div>

            {/* Progress bar global */}
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: '16px 20px', marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{parcelasPagas} de {totalParcelas} parcelas pagas</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#16a34a' }}>R$ {fmt(receitaRealizada)} recebidos</span>
                </div>
                <div style={{ height: 8, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(parcelasPagas / totalParcelas) * 100}%`, background: 'linear-gradient(90deg,#16a34a,#10b981)', borderRadius: 99, transition: 'width 0.3s' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 12, color: '#94a3b8' }}>
                    <span>Início: {order.createdAt.toLocaleDateString('pt-BR')}</span>
                    <span>Previsão fim: {estimatedDate(order.createdAt, totalParcelas - 1)}</span>
                </div>
            </div>

            {/* 3-column grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr 300px', gap: 16, alignItems: 'start' }}>

                {/* ── Coluna Esquerda — Cliente + Woovi ── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                    {/* Cliente */}
                    <div style={card}>
                        {cardTitle(<User size={14} color="#6366f1" />, 'Cliente')}
                        {fieldRow('Nome', order.fullName)}
                        {fieldRow('E-mail', order.email)}
                        {fieldRow('Telefone', order.phone)}
                        {fieldRow('CPF', order.cpf, true)}
                    </div>

                    {/* Endereço */}
                    {order.rua && (
                        <div style={card}>
                            {cardTitle(<Package size={14} color="#d97706" />, 'Endereço')}
                            {fieldRow('Rua', `${order.rua}, ${order.numero || ''}`)}
                            {order.complemento && fieldRow('Complemento', order.complemento)}
                            {fieldRow('Bairro', order.bairro)}
                            {fieldRow('Cidade/UF', `${order.cidade}/${order.estado}`)}
                            {fieldRow('CEP', order.cep, true)}
                        </div>
                    )}

                    {/* Woovi */}
                    {syncData && (
                        <div style={card}>
                            {cardTitle(<RefreshCw size={14} color="#0369a1" />, 'Woovi API')}
                            {fieldRow('Status', syncData.status)}
                            {fieldRow('Próximo débito', dateBRShort(syncData.nextChargeAt ?? syncData.next_charge_at))}
                            {fieldRow('Global ID', order.mpPaymentId?.substring(0, 22) + '…', true)}
                        </div>
                    )}

                    {syncError && (
                        <div style={{ background: '#fee2e2', borderRadius: 12, padding: '12px 16px', fontSize: 13, color: '#b91c1c' }}>
                            <AlertTriangle size={14} style={{ marginRight: 6 }} />
                            Erro Woovi: {syncError}
                        </div>
                    )}
                </div>

                {/* ── Coluna Centro — Timeline de Parcelas ── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div style={card}>
                        {cardTitle(<CreditCard size={14} color="#d97706" />, 'Histórico de Cobranças')}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                            {timeline.map((t, idx) => {
                                const isPaid = t.status === 'paid';
                                const isExpired = t.status === 'expired';
                                const isCanceled = t.status === 'canceled';
                                const isLast = idx === timeline.length - 1;

                                const dotColor = isPaid ? '#16a34a' : isExpired ? '#6b7280' : isCanceled ? '#b91c1c' : '#d97706';
                                const dotBg = isPaid ? '#dcfce7' : isExpired ? '#f1f5f9' : isCanceled ? '#fee2e2' : '#fef3c7';
                                const StatusIcon = isPaid ? CheckCircle : isExpired || isCanceled ? XCircle : Clock;

                                return (
                                    <div key={t.num} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                                        {/* Linha vertical + dot */}
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                                            <div style={{ width: 36, height: 36, borderRadius: '50%', background: dotBg, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${dotColor}` }}>
                                                <StatusIcon size={16} color={dotColor} />
                                            </div>
                                            {!isLast && (
                                                <div style={{ width: 2, flex: 1, minHeight: 20, background: '#f1f5f9', margin: '4px 0' }} />
                                            )}
                                        </div>

                                        {/* Conteúdo */}
                                        <div style={{ flex: 1, paddingBottom: isLast ? 0 : 16, paddingTop: 4 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                                                <div>
                                                    <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Parcela {t.num}</span>
                                                    <span style={{ marginLeft: 10, fontSize: 14, fontWeight: 800, color: isPaid ? '#16a34a' : '#94a3b8' }}>
                                                        R$ {t.amount}
                                                    </span>
                                                </div>
                                                <span style={{ background: CHARGE_STATUS[isPaid ? 'COMPLETED' : isExpired ? 'EXPIRED' : isCanceled ? 'CANCELED' : 'ACTIVE']?.bg ?? '#f1f5f9', color: CHARGE_STATUS[isPaid ? 'COMPLETED' : isExpired ? 'EXPIRED' : isCanceled ? 'CANCELED' : 'ACTIVE']?.color ?? '#64748b', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>
                                                    {CHARGE_STATUS[isPaid ? 'COMPLETED' : isExpired ? 'EXPIRED' : isCanceled ? 'CANCELED' : 'ACTIVE']?.label ?? 'Aguardando'}
                                                </span>
                                            </div>
                                            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 3 }}>
                                                {isPaid
                                                    ? `Paga em ${dateBRShort(t.paidAt)}`
                                                    : `Estimada para ${t.estimatedDate}`
                                                }
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Produto */}
                    <div style={card}>
                        {cardTitle(<Package size={14} color="#16a34a" />, 'Produto')}
                        {order.product?.imageUrl && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, background: '#f8fafc', borderRadius: 10, padding: '10px 12px' }}>
                                <img src={order.product.imageUrl} alt="" style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover' }} />
                                <div>
                                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{order.product.name}</div>
                                    <div style={{ fontSize: 12, color: '#94a3b8' }}>Loja: {order.product.storeName || '—'}</div>
                                </div>
                            </div>
                        )}
                        {fieldRow('Produto', order.product?.name)}
                        {fieldRow('Custo do produto', `R$ ${fmt(productCost)}`)}
                        {fieldRow('Plano', `${totalParcelas}× de R$ ${fmt(installmentValue)}`)}
                        {fieldRow('Total contratado', `R$ ${fmt(receitaContratada)}`)}
                        {fieldRow('Pedido iniciado', order.createdAt.toLocaleDateString('pt-BR'))}
                    </div>
                </div>

                {/* ── Coluna Direita — Financeiro + Ações ── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                    {/* Bloco Financeiro */}
                    <div style={card}>
                        {cardTitle(<TrendingUp size={14} color="#16a34a" />, 'Financeiro')}

                        {/* Receita */}
                        <div style={{ marginBottom: 14 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' as const, letterSpacing: '0.04em', marginBottom: 8 }}>Receita</div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13, borderBottom: '1px solid #f1f5f9' }}>
                                <span style={{ color: '#64748b' }}>Contratada</span>
                                <span style={{ fontWeight: 700 }}>R$ {fmt(receitaContratada)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13, borderBottom: '1px solid #f1f5f9' }}>
                                <span style={{ color: '#64748b' }}>Realizada</span>
                                <span style={{ fontWeight: 700, color: '#16a34a' }}>R$ {fmt(receitaRealizada)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13 }}>
                                <span style={{ color: '#64748b' }}>A Receber</span>
                                <span style={{ fontWeight: 700, color: '#0369a1' }}>R$ {fmt(receitaProjetada)}</span>
                            </div>
                        </div>

                        {/* Custos */}
                        <div style={{ marginBottom: 14 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' as const, letterSpacing: '0.04em', marginBottom: 8 }}>Custos</div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13, borderBottom: '1px solid #f1f5f9' }}>
                                <span style={{ color: '#64748b' }}>Produto</span>
                                <span style={{ fontWeight: 700, color: '#b91c1c' }}>−R$ {fmt(productCost)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13 }}>
                                <span style={{ color: '#64748b' }}>Woovi (~1%)¹</span>
                                <span style={{ fontWeight: 700, color: '#b91c1c' }}>−R$ {fmt(custoWoovi)}</span>
                            </div>
                        </div>

                        {/* Lucro */}
                        <div style={{ background: lucroProjetado >= 0 ? '#f0fdf4' : '#fef2f2', borderRadius: 10, padding: '12px 14px', border: `1px solid ${lucroProjetado >= 0 ? '#bbf7d0' : '#fecaca'}` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                                <span style={{ color: '#64748b', fontWeight: 600 }}>Lucro realizado</span>
                                <span style={{ fontWeight: 800, color: lucroRealizado >= 0 ? '#16a34a' : '#b91c1c' }}>R$ {fmt(lucroRealizado)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                                <span style={{ color: '#64748b', fontWeight: 600 }}>Lucro projetado</span>
                                <span style={{ fontWeight: 800, color: lucroProjetado >= 0 ? '#15803d' : '#b91c1c', fontSize: 16 }}>R$ {fmt(lucroProjetado)}</span>
                            </div>
                        </div>
                        <div style={{ marginTop: 8, fontSize: 11, color: '#94a3b8' }}>¹ Taxa Woovi estimada em 1% · consulte sua conta</div>
                    </div>

                    {/* Ações */}
                    {(syncData?.status || !syncData) && (
                        <div style={card}>
                            {cardTitle(<AlertTriangle size={14} color="#d97706" />, 'Ações')}
                            <SubscriptionActions
                                orderId={order.id}
                                status={syncData?.status ?? order.paymentStatus}
                                charges={normalizedCharges}
                            />
                        </div>
                    )}

                    {/* ID Técnico */}
                    <div style={{ ...card, padding: '14px 16px' }}>
                        <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>ID do Pedido</div>
                        <div style={{ fontSize: 12, fontFamily: '"IBM Plex Mono", monospace', color: '#475569', wordBreak: 'break-all' }}>{order.id}</div>
                        {order.mpPaymentId && (
                            <>
                                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 10, marginBottom: 4 }}>Woovi Global ID</div>
                                <div style={{ fontSize: 11, fontFamily: '"IBM Plex Mono", monospace', color: '#475569', wordBreak: 'break-all' }}>{order.mpPaymentId}</div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
