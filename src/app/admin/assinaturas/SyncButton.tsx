'use client';

import { useState } from 'react';
import { RefreshCw } from 'lucide-react';

interface Props {
    orderId: string;
    initialParcelas: number;
    totalParcelas: number;
}

export default function SyncButton({ orderId, initialParcelas, totalParcelas }: Props) {
    const [loading, setLoading] = useState(false);
    const [parcelas, setParcelas] = useState(initialParcelas);
    const [error, setError] = useState('');

    async function syncNow() {
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/admin/subscription/sync-status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId }),
            });
            const data = await res.json();
            if (data.success) {
                setParcelas(data.parcelasPagas);
            } else {
                setError(data.error || 'Erro');
            }
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{
                background: parcelas === 1 ? '#eef2ff' : parcelas >= totalParcelas ? '#fee2e2' : '#f0fdf4',
                color: parcelas === 1 ? '#6366f1' : parcelas >= totalParcelas ? '#b91c1c' : '#15803d',
                borderRadius: 6,
                padding: '3px 8px',
                fontSize: 12,
                fontWeight: 700,
            }}>
                {parcelas}/{totalParcelas}
            </div>
            <button
                onClick={syncNow}
                disabled={loading}
                title="Buscar parcelas pagas na Sync"
                style={{
                    background: 'none',
                    border: 'none',
                    cursor: loading ? 'wait' : 'pointer',
                    padding: 2,
                    display: 'flex',
                    alignItems: 'center',
                    color: '#94a3b8',
                    transition: 'color 0.1s',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = '#6366f1')}
                onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}
            >
                <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            </button>
            {error && <span style={{ fontSize: 10, color: '#ef4444' }} title={error}>!</span>}
            <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
        </div>
    );
}
