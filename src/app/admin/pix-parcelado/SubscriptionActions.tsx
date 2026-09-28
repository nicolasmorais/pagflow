'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { XCircle, RotateCcw, Loader, AlertTriangle, CheckCircle } from 'lucide-react';

interface Charge {
    cycle: number;
    status: string;
    amount: string;
    dueDate: string | null;
    paidAt: string | null;
    correlationID?: string;
}

interface Props {
    orderId: string;
    status: string;
    charges?: Charge[];
}

type ActionState = 'idle' | 'loading' | 'success' | 'error';

export default function SubscriptionActions({ orderId, status, charges = [] }: Props) {
    const router = useRouter();
    const [cancelState, setCancelState] = useState<ActionState>('idle');
    const [confirmCancel, setConfirmCancel] = useState(false);
    const [cancelError, setCancelError] = useState('');

    const [refundingId, setRefundingId] = useState<string | null>(null);
    const [refundState, setRefundState] = useState<ActionState>('idle');
    const [refundError, setRefundError] = useState('');
    const [refundSuccess, setRefundSuccess] = useState('');

    const isCancelled = status === 'CANCELED' || status === 'cancelled' || status === 'recusado';

    async function doCancel() {
        setCancelState('loading');
        setCancelError('');
        try {
            const res = await fetch('/api/admin/subscription/action', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId, action: 'cancel' }),
            });
            const data = await res.json();
            if (data.success) {
                setCancelState('success');
                router.refresh();
            } else {
                setCancelState('error');
                setCancelError(data.error || 'Erro ao cancelar');
            }
        } catch (e: any) {
            setCancelState('error');
            setCancelError(e.message);
        } finally {
            setConfirmCancel(false);
        }
    }

    async function doRefund(chargeCorrelationID: string, amount: string) {
        setRefundingId(chargeCorrelationID);
        setRefundState('loading');
        setRefundError('');
        setRefundSuccess('');
        try {
            const res = await fetch('/api/admin/subscription/action', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId, action: 'refund', chargeCorrelationID }),
            });
            const data = await res.json();
            if (data.success) {
                setRefundState('success');
                setRefundSuccess(`Parcela reembolsada com sucesso (R$ ${amount})`);
                router.refresh();
            } else {
                setRefundState('error');
                setRefundError(data.error || 'Erro ao reembolsar');
            }
        } catch (e: any) {
            setRefundState('error');
            setRefundError(e.message);
        } finally {
            setRefundingId(null);
        }
    }

    const paidCharges = charges.filter(c =>
        (c.status === 'COMPLETED' || c.status === 'paid' || c.status === 'PAID') && c.correlationID
    );

    const btnBase: React.CSSProperties = {
        display: 'inline-flex', alignItems: 'center', gap: 7,
        padding: '9px 16px', borderRadius: 9, fontSize: 13, fontWeight: 700,
        border: 'none', cursor: 'pointer',
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Cancelamento */}
            <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
                    Cancelar Assinatura
                </div>
                {isCancelled ? (
                    <div style={{ background: '#fee2e2', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#b91c1c', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <AlertTriangle size={14} /> PIX Parcelado cancelado
                    </div>
                ) : !confirmCancel ? (
                    <button
                        style={{ ...btnBase, background: '#fee2e2', color: '#b91c1c' }}
                        onClick={() => setConfirmCancel(true)}
                        disabled={cancelState === 'loading'}
                    >
                        <XCircle size={14} />
                        Cancelar PIX Parcelado
                    </button>
                ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fee2e2', borderRadius: 9, padding: '8px 14px', border: '1px solid #fecaca' }}>
                        <span style={{ fontSize: 12, color: '#b91c1c', fontWeight: 600 }}>Confirmar cancelamento permanente?</span>
                        <button
                            style={{ ...btnBase, padding: '5px 12px', background: '#b91c1c', color: '#fff', fontSize: 12 }}
                            onClick={doCancel}
                            disabled={cancelState === 'loading'}
                        >
                            {cancelState === 'loading' ? <Loader size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <XCircle size={12} />}
                            Sim, cancelar
                        </button>
                        <button
                            style={{ ...btnBase, padding: '5px 12px', background: '#f1f5f9', color: '#64748b', fontSize: 12 }}
                            onClick={() => setConfirmCancel(false)}
                        >
                            Não
                        </button>
                    </div>
                )}
                {cancelError && (
                    <div style={{ marginTop: 8, fontSize: 12, color: '#b91c1c', background: '#fee2e2', padding: '8px 12px', borderRadius: 8 }}>{cancelError}</div>
                )}
                <div style={{ marginTop: 8, fontSize: 12, color: '#94a3b8' }}>
                    ⚠️ Suspensão temporária não está disponível na API Woovi — apenas cancelamento permanente.
                </div>
            </div>

            {/* Reembolsos */}
            {paidCharges.length > 0 && (
                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
                        Reembolsar Parcela
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {paidCharges.map(c => {
                            const isRefunding = refundingId === c.correlationID && refundState === 'loading';
                            return (
                                <div key={c.correlationID} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', borderRadius: 9, padding: '10px 14px', border: '1px solid #f1f5f9' }}>
                                    <div style={{ fontSize: 13, color: '#475569' }}>
                                        <strong style={{ color: '#0f172a' }}>Parcela {c.cycle}</strong>
                                        <span style={{ marginLeft: 8, color: '#94a3b8', fontSize: 12 }}>R$ {c.amount}</span>
                                    </div>
                                    <button
                                        style={{ ...btnBase, padding: '6px 12px', background: '#eff6ff', color: '#2563eb', fontSize: 12, opacity: isRefunding ? 0.6 : 1 }}
                                        onClick={() => c.correlationID && doRefund(c.correlationID, c.amount)}
                                        disabled={isRefunding || refundState === 'loading'}
                                    >
                                        {isRefunding
                                            ? <Loader size={12} style={{ animation: 'spin 1s linear infinite' }} />
                                            : <RotateCcw size={12} />
                                        }
                                        Reembolsar
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                    {refundSuccess && (
                        <div style={{ marginTop: 10, fontSize: 12, color: '#15803d', background: '#dcfce7', padding: '8px 12px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <CheckCircle size={13} /> {refundSuccess}
                        </div>
                    )}
                    {refundError && (
                        <div style={{ marginTop: 10, fontSize: 12, color: '#b91c1c', background: '#fee2e2', padding: '8px 12px', borderRadius: 8 }}>{refundError}</div>
                    )}
                </div>
            )}

            <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
        </div>
    );
}
