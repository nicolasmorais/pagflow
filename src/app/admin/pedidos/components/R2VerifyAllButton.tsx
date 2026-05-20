'use client'
import { useState } from 'react'
import { Loader2, Cloud } from 'lucide-react'

export default function R2VerifyAllButton({ orders }: { orders: any[] }) {
    const [status, setStatus] = useState<'idle' | 'checking' | 'done'>('idle')
    const [result, setResult] = useState<{ exists: number; missing: number } | null>(null)

    const handleVerify = async () => {
        setStatus('checking')
        try {
            const results = await Promise.all(
                orders.map(async (order) => {
                    try {
                        const res = await fetch(`/api/order/${order.id}/r2-check`)
                        const data = await res.json()
                        return data.exists
                    } catch {
                        return false
                    }
                })
            )
            setResult({
                exists: results.filter(Boolean).length,
                missing: results.filter(r => !r).length,
            })
            setStatus('done')
        } catch {
            setStatus('idle')
        }
    }

    return (
        <button
            onClick={handleVerify}
            disabled={status === 'checking'}
            style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '9px 16px', background: '#fff', color: status === 'done' ? '#16a34a' : '#64748b',
                borderRadius: '12px', border: `1px solid ${status === 'done' ? '#bbf7d0' : '#e2e8f0'}`,
                fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                transition: 'all 0.15s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                fontFamily: 'inherit',
            }}
            title={result ? `${result.exists} com backup, ${result.missing} sem backup` : 'Verificar backups R2'}
        >
            {status === 'checking' ? (
                <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
            ) : status === 'done' && result ? (
                <>
                    <Cloud size={14} />
                    {result.exists}/{orders.length} R2
                </>
            ) : (
                <>
                    <Cloud size={14} />
                    Verificar R2
                </>
            )}
        </button>
    )
}
