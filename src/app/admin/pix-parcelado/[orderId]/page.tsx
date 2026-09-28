export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/prisma';
import { getSubscription, listInstallments } from '@/lib/woovi-subscription';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, RefreshCw, User, Package, CreditCard, AlertTriangle } from 'lucide-react';
import WooviButton from '../WooviButton';
import SubscriptionActions from '../SubscriptionActions';

function dateBR(iso: string | null | undefined) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
}

const STATUS_CFG: Record<string, { label: string; color: string; bg: string; border: string }> = {
    ACTIVE:    { label: "Ativo",     color: '#15803d', bg: '#dcfce7', border: '#bbf7d0' },
    CANCELED:  { label: "Cancelado", color: '#b91c1c', bg: '#fee2e2', border: '#fecaca' },
    active:    { label: "Ativo",     color: '#15803d', bg: '#dcfce7', border: '#bbf7d0' },
    cancelled: { label: "Cancelado", color: '#b91c1c', bg: '#fee2e2', border: '#fecaca' },
};

const CHARGE_STATUS: Record<string, { label: string; color: string; bg: string }> = {
    COMPLETED: { label: 'Paga',     color: '#15803d', bg: '#dcfce7' },
    ACTIVE:    { label: 'Pendente', color: '#92400e', bg: '#fef3c7' },
    EXPIRED:   { label: 'Expirada', color: '#6b7280', bg: '#f1f5f9' },
    CANCELED:  { label: "Cancelado", color: '#b91c1c', bg: '#fee2e2' },
    paid:      { label: 'Paga',     color: '#15803d', bg: '#dcfce7' },
    pending:   { label: 'Pendente', color: '#92400e', bg: '#fef3c7' },
    expired:   { label: 'Expirada', color: '#6b7280', bg: '#f1f5f9' },
};

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

    const parcelasPagas = charges.filter((c: any) =>
        c.status === 'COMPLETED' || c.status === 'paid' || c.status === 'PAID'
    ).length;
    const totalParcelas = order.totalParcelas ?? 4;
    const statusCfg = syncData ? (STATUS_CFG[syncData.status] ?? { label: syncData.status, color: '#64748b', bg: '#f1f5f9', border: '#e2e8f0' }) : null;

    return (
        <div style={{ fontFamily: '"Space Grotesk", sans-serif', color: '#0f172a', maxWidth: 860, margin: '0 auto' }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
                <Link href="/admin/pix-parcelado" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 9, background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#64748b', textDecoration: 'none' }}>
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
                
                <WooviButton orderId={order.id} initialParcelas={parcelasPagas || order.parcelasPagas} totalParcelas={totalParcelas} />
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

                    
                    {syncData && (
                        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: '18px 20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                                <RefreshCw size={14} color="#0369a1" />
                                <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Woovi</span>
                            </div>
                            {[
                                { label: 'Próximo débito', value: dateBR(syncData.nextChargeAt ?? syncData.next_charge_at) },
                                { label: 'Status Woovi',   value: syncData.status ?? '—' },
                                { label: 'Global ID',      value: (order.mpPaymentId || '').substring(0, 20) + '…' },
                            ].map(row => (
                                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f1f5f9', fontSize: 13 }}>
                                    <span style={{ color: '#94a3b8', fontWeight: 600 }}>{row.label}</span>
                                    <span style={{ color: '#0f172a', fontWeight: 600 }}>{row.value || '—'}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {syncData?.status === 'CANCELED' && (
                        <div style={{ background: '#fee2e2', borderRadius: 12, padding: '12px 16px', border: '1px solid #fecaca', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                            <AlertTriangle size={16} color="#b91c1c" style={{ flexShrink: 0, marginTop: 1 }} />
                            <div style={{ fontSize: 13, color: '#b91c1c', fontWeight: 600 }}>
                                PIX Parcelado cancelado na Woovi.
                            </div>
                        </div>
                    )}

                    {syncError && (
                        <div style={{ background: '#fee2e2', borderRadius: 12, padding: '12px 16px', fontSize: 13, color: '#b91c1c' }}>
                            Erro ao consultar Woovi: {syncError}
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
                            {[...charges].map((c: any, idx: number) => {
                                const cs = CHARGE_STATUS[c.status] ?? { label: c.status, color: '#64748b', bg: '#f1f5f9' };
                                const num = c.number ?? c.cycle_number ?? (idx + 1);
                                const paidAt = c.paidAt ?? c.paid_at;
                                const dueDate = c.dueDate ?? c.due_date;
                                const amount = c.value != null ? (c.value / 100).toFixed(2).replace('.', ',') : c.amount ?? '—';
                                return (
                                    <div key={num} style={{ display: 'grid', gridTemplateColumns: '40px 1fr auto auto', alignItems: 'center', gap: 12, padding: '12px 14px', background: '#f8fafc', borderRadius: 10, border: '1px solid #f1f5f9' }}>
                                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: cs.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, color: cs.color }}>
                                            {num}
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>Parcela {num}</div>
                                            <div style={{ fontSize: 11, color: '#94a3b8' }}>
                                                {paidAt ? `Paga em ${dateBR(paidAt)}` : dueDate ? `Vence ${dateBR(dueDate)}` : 'Aguardando'}
                                            </div>
                                        </div>
                                        <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                                            R$ {amount}
                                        </div>
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

            {/* Ações */}
            {syncData?.status && (
                <div style={{ marginTop: 20, background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: '18px 20px' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 14 }}>Ações</div>
                    <SubscriptionActions orderId={order.id} status={syncData.status} />
                </div>
            )}

            {/* Iniciou em */}
            <div style={{ marginTop: 16, fontSize: 12, color: '#94a3b8', textAlign: 'right' }}>
                PIX Parcelado iniciado em {dateBR(order.createdAt.toISOString())} · ID {order.id}
            </div>
        </div>
    );
}
