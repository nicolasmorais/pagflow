'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { XCircle, Loader } from 'lucide-react';

interface Props {
    orderId: string;
    status: string; // ACTIVE | CANCELED | ...
}

export default function SubscriptionActions({ orderId, status }: Props) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [confirmCancel, setConfirmCancel] = useState(false);

    async function doCancel() {
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/admin/subscription/action', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId, action: 'cancel' }),
            });
            const data = await res.json();
            if (data.success) {
                router.refresh();
            } else {
                setError(data.error || 'Erro ao cancelar');
            }
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
            setConfirmCancel(false);
        }
    }

    const isCancelled = status === 'CANCELED' || status === 'cancelled' || status === 'recusado';

    if (isCancelled) {
        return (
            <div style={{ background: '#fee2e2', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#b91c1c', fontWeight: 600 }}>
                Assinatura cancelada — sem ações disponíveis
            </div>
        );
    }

    const btnBase: React.CSSProperties = {
        display: 'inline-flex', alignItems: 'center', gap: 7,
        padding: '9px 16px', borderRadius: 9, fontSize: 13, fontWeight: 700,
        border: 'none', cursor: 'pointer',
    };

    return (
        <div>
            {!confirmCancel ? (
                <button
                    style={{ ...btnBase, background: '#fee2e2', color: '#b91c1c' }}
                    onClick={() => setConfirmCancel(true)}
                    disabled={loading}
                >
                    <XCircle size={14} />
                    Cancelar assinatura
                </button>
            ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fee2e2', borderRadius: 9, padding: '8px 14px', border: '1px solid #fecaca' }}>
                    <span style={{ fontSize: 12, color: '#b91c1c', fontWeight: 600 }}>Confirmar cancelamento?</span>
                    <button
                        style={{ ...btnBase, padding: '5px 12px', background: '#b91c1c', color: '#fff', fontSize: 12 }}
                        onClick={doCancel}
                        disabled={loading}
                    >
                        {loading ? <Loader size={12} style={{ animation: 'spin 1s linear infinite' }} /> : null}
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

            {error && (
                <div style={{ marginTop: 10, fontSize: 12, color: '#b91c1c', background: '#fee2e2', padding: '8px 12px', borderRadius: 8 }}>
                    {error}
                </div>
            )}

            <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
        </div>
    );
}
