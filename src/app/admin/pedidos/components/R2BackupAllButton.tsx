'use client'
import { useState } from 'react'
import { Loader2, CloudUpload } from 'lucide-react'
import { backupAllPaidOrders } from '@/app/actions'

export default function R2BackupAllButton() {
    const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
    const [result, setResult] = useState<{ count: number; total: number } | null>(null)

    const handleBackup = async () => {
        setStatus('loading')
        try {
            const res = await backupAllPaidOrders()
            if (res.success && res.count !== undefined) {
                setResult({ count: res.count, total: res.total! })
            }
            setStatus('done')
        } catch {
            setStatus('error')
        }
    }

    return (
        <button
            onClick={handleBackup}
            disabled={status === 'loading'}
            style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '9px 16px', background: '#fff',
                color: status === 'done' ? '#16a34a' : status === 'error' ? '#dc2626' : '#64748b',
                borderRadius: '12px', border: `1px solid ${status === 'done' ? '#bbf7d0' : status === 'error' ? '#fecaca' : '#e2e8f0'}`,
                fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                transition: 'all 0.15s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                fontFamily: 'inherit',
            }}
            title={result ? `${result.count}/${result.total} pedidos salvos no R2` : 'Salvar todos pedidos pagos no R2'}
        >
            {status === 'loading' ? (
                <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
            ) : status === 'done' && result ? (
                <>
                    <CloudUpload size={14} />
                    {result.count} salvos
                </>
            ) : status === 'error' ? (
                <>
                    <CloudUpload size={14} />
                    Erro
                </>
            ) : (
                <>
                    <CloudUpload size={14} />
                    Backup R2
                </>
            )}
        </button>
    )
}
