export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/prisma';
import { getSubscriptionDetails } from '@/lib/sync-subscription';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, RefreshCw, User, Package, CreditCard, AlertTriangle } from 'lucide-react';
import SyncButton from '../SyncButton';

function dateBR(iso: string | null | undefined) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
}

const STATUS_CFG: Record<string, { label: string; color: string; bg: string; border: string }> = {
    active:    { label: 'Ativa',     color: '#15803d', bg: '#dcfce7', border: '#bbf7d0' },
    suspended: { label: 'Suspensa',  color: '#92400e', bg: '#fef3c7', border: '#fde68a' },
    cancelled: { label: 'Cancelada', color: '#b91c1c', bg: '#fee2e2', border: '#fecaca' },
};

const CHARGE_STATUS: Record<string, { label: string; color: string; bg: string }> = {
    paid:    { label: 'Paga',     color: '#15803d', bg: '#dcfce7' },
    pending: { label: 'Pendente', color: '#92400e', bg: '#fef3c7' },
    expired: { label: 'Expirada', color: '#6b7280', bg: '#f1f5f9' },
    failed:  { label: 'Falhou',   color: '#b91c1c', bg: '#fee2e2' },
};

export default async function AssinaturaDetailPage({ params }: { params: Promise<{ orderId: string }> }) {
    const { orderId } = await params;

    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { product: true },
    });

    if (!order || order.paymentMethod !== 'pix_automatico') notFound();

    let syncData: any = null;
    let syncError = '';
    if (order.mpPaymentId) {
        try {
            syncData = await getSubscriptionDetails(order.mpPaymentId);
        } catch (e: any) {
            syncError = e.message;
        }
    }

    const charges: any[] = syncData?.charges ?? [];
    const parcelasPagas = charges.filter((c: any) => c.status === 'paid').length;
    const totalParcelas = order.totalParcelas ?? 4;
    const statusCfg = syncData ? (STATUS_CFG[syncData.status] ?? { label: syncData.status, color: '#64748b', bg: '#f1f5f9', border: '#e2e8f0' }) : null;

    return (
        <div style={{ fontFamily: '"Space Grotesk", sans-serif', color: '#0f172a', maxWidth: 860, margin: '0 auto' }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
                <Link href="/admin/assinaturas" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 9, background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#64748b', textDecoration: 'none' }}>
                    <ArrowLeft size={16} />
                </Link>
                <div style={{ flex: 1 }}>
                    <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>{order.fullName || 'Assinante'}</h1>
                    <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>{order.email}</p>
                </div>
                {statusCfg && (
                    <span style={{ background: statusCfg.bg, color: statusCfg.color, border: `1px solid ${statusCfg.border}`, borderRadius: 8, padding: '5px 14px', fontSize: 13, fontWeight: 700 }}>
                        {statusCfg.label}
                    </span>
                )}
                {/* Botão sync — atualiza parcelasPagas e reabre a página */}
                <SyncButton orderId={order.id} initialParcelas={parcelasPagas || order.parcelasPagas} totalParcelas={totalParcelas} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 16 }}>

                {/* Coluna esquerda */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                    {/* Assinante */}
                    <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: '18px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                            <User size={14} color="#6366f1" />
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Assinante</span>
                        </div>
                        {[
                            { label: 'Nome',     value: order.fullName },
                            { label: 'E-mail',   value: order.email },
                            { label: 'Telefone', value: order.phone },
                            { label: 'CPF',      value: order.cpf },
                        ].map(row => (
                            <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f1f5f9', fontSize: 13 }}>
                                <span style={{ color: '#94a3b8', fontWeight: 600 }}>{row.label}</span>
                                <span style={{ color: '#0f172a', fontWeight: 600 }}>{row.value || '—'}</span>
                            </div>
                        ))}
                    </div>

                    {/* Produto */}
                    <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: '18px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                            <Package size={14} color="#16a34a" />
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Produto</span>
                        </div>
                        {[
                            { label: 'Produto',       value: order.product?.name },
                            { label: 'Valor total',   value: `R$ ${(order.totalPrice * totalParcelas).toFixed(2).replace('.', ',')}` },
                            { label: 'Valor/parcela', value: `R$ ${order.totalPrice.toFixed(2).replace('.', ',')}` },
                            { label: 'Parcelas',      value: `${parcelasPagas || order.parcelasPagas}/${totalParcelas}` },
                        ].map(row => (
                            <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f1f5f9', fontSize: 13 }}>
                                <span style={{ color: '#94a3b8', fontWeight: 600 }}>{row.label}</span>
                                <span style={{ color: '#0f172a', fontWeight: 600 }}>{row.value || '—'}</span>
                            </div>
                        ))}
                    </div>

                    {/* Sync info */}
                    {syncData && (
                        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: '18px 20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                                <RefreshCw size={14} color="#0369a1" />
                                <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sync</span>
                            </div>
                            {[
                                { label: 'Próximo débito',  value: dateBR(syncData.next_charge_at) },
                                { label: 'Em atraso desde', value: dateBR(syncData.overdue_since) },
                                { label: 'Tentativas',      value: String(syncData.retry_count ?? 0) },
                                { label: 'Mandate ID',      value: order.subscriptionMandateId?.substring(0, 16) + '…' },
                            ].map(row => (
                                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f1f5f9', fontSize: 13 }}>
                                    <span style={{ color: '#94a3b8', fontWeight: 600 }}>{row.label}</span>
                                    <span style={{ color: '#0f172a', fontWeight: 600 }}>{row.value || '—'}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {syncData?.overdue_since && (
                        <div style={{ background: '#fef3c7', borderRadius: 12, padding: '12px 16px', border: '1px solid #fde68a', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                            <AlertTriangle size={16} color="#92400e" style={{ flexShrink: 0, marginTop: 1 }} />
                            <div style={{ fontSize: 13, color: '#92400e', fontWeight: 600 }}>
                                Assinatura em atraso desde {dateBR(syncData.overdue_since)}. {syncData.retry_count} tentativa{syncData.retry_count !== 1 ? 's' : ''} de recobrança.
                            </div>
                        </div>
                    )}

                    {syncError && (
                        <div style={{ background: '#fee2e2', borderRadius: 12, padding: '12px 16px', fontSize: 13, color: '#b91c1c' }}>
                            Erro ao consultar Sync: {syncError}
                        </div>
                    )}
                </div>

                {/* Coluna direita — histórico de cobranças */}
                <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: '18px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
                        <CreditCard size={14} color="#d97706" />
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Histórico de cobranças</span>
                    </div>

                    {charges.length === 0 ? (
                        <div style={{ textAlign: 'center', color: '#94a3b8', padding: '40px 0', fontSize: 13 }}>
                            {syncError ? 'Não foi possível carregar' : 'Nenhuma cobrança ainda'}
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {[...charges].sort((a, b) => b.cycle_number - a.cycle_number).map((c: any) => {
                                const cs = CHARGE_STATUS[c.status] ?? { label: c.status, color: '#64748b', bg: '#f1f5f9' };
                                return (
                                    <div key={c.cycle_number} style={{ display: 'grid', gridTemplateColumns: '40px 1fr auto auto', alignItems: 'center', gap: 12, padding: '12px 14px', background: '#f8fafc', borderRadius: 10, border: '1px solid #f1f5f9' }}>
                                        {/* Número */}
                                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: cs.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, color: cs.color }}>
                                            {c.cycle_number}
                                        </div>
                                        {/* Datas */}
                                        <div>
                                            <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>Parcela {c.cycle_number}</div>
                                            <div style={{ fontSize: 11, color: '#94a3b8' }}>
                                                {c.paid_at ? `Paga em ${dateBR(c.paid_at)}` : `Vence ${dateBR(c.due_date)}`}
                                            </div>
                                        </div>
                                        {/* Valor */}
                                        <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                                            R$ {c.amount ?? '—'}
                                        </div>
                                        {/* Status */}
                                        <span style={{ background: cs.bg, color: cs.color, borderRadius: 6, padding: '3px 8px', fontSize: 11, fontWeight: 700 }}>
                                            {cs.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Iniciou em */}
            <div style={{ marginTop: 16, fontSize: 12, color: '#94a3b8', textAlign: 'right' }}>
                Assinatura iniciada em {dateBR(order.createdAt.toISOString())} · ID {order.id}
            </div>
        </div>
    );
}
