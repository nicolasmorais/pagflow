'use client';

import { useState, useRef, useEffect } from 'react';
import { RefreshCw, X } from 'lucide-react';

interface Charge {
    cycle: number;
    status: string;
    amount: string;
    dueDate: string;
    paidAt: string | null;
}

interface WooviData {
    parcelasPagas: number;
    totalParcelas: number;
    status: string;
    nextChargeAt: string | null;
    charges: Charge[];
}

interface Props {
    orderId: string;
    initialParcelas: number;
    totalParcelas: number;
}

const STATUS_LABEL: Record<string, { label: string; color: string; bg: string }> = {
    ACTIVE:    { label: 'Ativo',      color: '#15803d', bg: '#dcfce7' },
    CANCELED:  { label: 'Cancelado',  color: '#b91c1c', bg: '#fee2e2' },
    active:    { label: 'Ativo',      color: '#15803d', bg: '#dcfce7' },
    cancelled: { label: 'Cancelado',  color: '#b91c1c', bg: '#fee2e2' },
};

const CHARGE_STATUS: Record<string, { label: string; color: string }> = {
    COMPLETED: { label: 'Paga',     color: '#15803d' },
    ACTIVE:    { label: 'Pendente', color: '#92400e' },
    EXPIRED:   { label: 'Expirada', color: '#6b7280' },
    CANCELED:  { label: 'Cancelada', color: '#b91c1c' },
    paid:      { label: 'Paga',     color: '#15803d' },
    pending:   { label: 'Pendente', color: '#92400e' },
    expired:   { label: 'Expirada', color: '#6b7280' },
};

function dateBR(iso: string | null) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

export default function WooviButton({ orderId, initialParcelas, totalParcelas }: Props) {
    const [loading, setLoading] = useState(false);
    const [parcelas, setParcelas] = useState(initialParcelas);
    const [data, setData] = useState<WooviData | null>(null);
    const [open, setOpen] = useState(false);
    const [error, setError] = useState('');
    const panelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        if (open) document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [open]);

    async function syncNow() {
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/admin/subscription/sync-status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId }),
            });
            const result = await res.json();
            if (result.success) {
                setParcelas(result.parcelasPagas);
                setData(result);
                setOpen(true);
            } else {
                setError(result.error || 'Erro');
            }
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }

    const statusCfg = data ? (STATUS_LABEL[data.status] ?? { label: data.status, color: '#64748b', bg: '#f1f5f9' }) : null;

    return (
        <div style={{ position: 'relative' }} ref={panelRef}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{
                    background: parcelas >= totalParcelas ? '#fee2e2' : '#f0fdf4',
                    color: parcelas >= totalParcelas ? '#b91c1c' : '#15803d',
                    borderRadius: 6, padding: '3px 8px', fontSize: 12, fontWeight: 700,
                }}>
                    {parcelas}/{totalParcelas}
                </div>
                <button
                    onClick={syncNow}
                    disabled={loading}
                    title="Atualizar parcelas via Woovi"
                    style={{
                        background: 'none', border: 'none', cursor: loading ? 'wait' : 'pointer',
                        padding: 2, display: 'flex', alignItems: 'center', color: '#94a3b8',
                    }}
                >
                    <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
                </button>
                {error && <span style={{ fontSize: 10, color: '#ef4444' }} title={error}>⚠</span>}
            </div>

            {open && data && (
                <div style={{
                    position: 'fixed', zIndex: 9999,
                    background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.14)',
                    padding: '18px 20px', width: 320,
                    top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                    fontFamily: '"Space Grotesk", sans-serif',
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                        <div style={{ fontWeight: 800, fontSize: 14, color: '#0f172a' }}>Dados Woovi</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {statusCfg && (
                                <span style={{ background: statusCfg.bg, color: statusCfg.color, borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>
                                    {statusCfg.label}
                                </span>
                            )}
                            <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0, display: 'flex' }}>
                                <X size={16} />
                            </button>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
                        <div style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 12px' }}>
                            <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>Parcelas pagas</div>
                            <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>{data.parcelasPagas}<span style={{ fontSize: 12, color: '#94a3b8' }}>/{data.totalParcelas}</span></div>
                        </div>
                        <div style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 12px' }}>
                            <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>Próximo débito</div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{dateBR(data.nextChargeAt)}</div>
                        </div>
                    </div>

                    {data.charges.length > 0 && (
                        <div>
                            <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>Histórico</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                {[...data.charges].sort((a, b) => b.cycle - a.cycle).map(c => {
                                    const cs = CHARGE_STATUS[c.status] ?? { label: c.status, color: '#64748b' };
                                    return (
                                        <div key={c.cycle} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: '#f8fafc', borderRadius: 7, fontSize: 12 }}>
                                            <span style={{ fontWeight: 600, color: '#475569' }}>Parcela {c.cycle}</span>
                                            <span style={{ color: '#64748b' }}>R$ {c.amount ?? '—'}</span>
                                            <span style={{ color: cs.color, fontWeight: 700 }}>{cs.label}</span>
                                            <span style={{ color: '#94a3b8', fontSize: 11 }}>{dateBR(c.paidAt ?? c.dueDate)}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}

            <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
        </div>
    );
}
