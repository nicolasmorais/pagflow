'use client'

import { useState } from 'react'
import { Cloud, Check, AlertCircle, Loader2, RefreshCw } from 'lucide-react'
import { verifyOrderR2, forceOrderR2 } from '@/app/actions'

export default function R2CheckButton({ orderId }: { orderId: string }) {
    const [status, setStatus] = useState<'idle' | 'checking' | 'exists' | 'missing' | 'error' | 'uploading' | 'uploaded'>('idle')
    const [detail, setDetail] = useState('')

    const check = async () => {
        setStatus('checking')
        try {
            const result = await verifyOrderR2(orderId)
            if (result.exists) {
                setStatus('exists')
                setDetail(result.lastModified ? new Date(result.lastModified).toLocaleString('pt-BR') : '')
            } else {
                setStatus('missing')
            }
        } catch {
            setStatus('error')
        }
    }

    const forceUpload = async () => {
        setStatus('uploading')
        try {
            const result = await forceOrderR2(orderId)
            if (result?.success) {
                setStatus('uploaded')
                setDetail(new Date().toLocaleString('pt-BR'))
            } else {
                setStatus('error')
            }
        } catch {
            setStatus('error')
        }
    }

    const colorMap = {
        idle: { bg: '#f1f5f9', color: '#64748b', border: '#e2e8f0' },
        checking: { bg: '#eff6ff', color: '#3b82f6', border: '#bfdbfe' },
        exists: { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
        missing: { bg: '#fef3c7', color: '#d97706', border: '#fde68a' },
        error: { bg: '#fee2e2', color: '#dc2626', border: '#fecaca' },
        uploading: { bg: '#eff6ff', color: '#3b82f6', border: '#bfdbfe' },
        uploaded: { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
    }

    const s = colorMap[status]
    const iconSize = 13

    const icon = {
        idle: <Cloud size={iconSize} />,
        checking: <Loader2 size={iconSize} style={{ animation: 'spin 1s linear infinite' }} />,
        exists: <Check size={iconSize} />,
        missing: <AlertCircle size={iconSize} />,
        error: <AlertCircle size={iconSize} />,
        uploading: <Loader2 size={iconSize} style={{ animation: 'spin 1s linear infinite' }} />,
        uploaded: <Check size={iconSize} />,
    }[status]

    const tooltip = {
        idle: 'Verificar backup R2',
        checking: 'Verificando...',
        exists: `Backup encontrado${detail ? ` - ${detail}` : ''}`,
        missing: 'Sem backup - clique para enviar',
        error: 'Erro ao verificar',
        uploading: 'Enviando...',
        uploaded: `Enviado com sucesso${detail ? ` - ${detail}` : ''}`,
    }[status]

    return (
        <button
            onClick={status === 'missing' || status === 'error' ? forceUpload : check}
            title={tooltip}
            style={{
                width: '30px', height: '30px', borderRadius: '8px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: s.bg, color: s.color, border: `1px solid ${s.border}`,
                cursor: 'pointer', transition: 'all 0.15s',
            }}
        >
            {icon}
        </button>
    )
}
