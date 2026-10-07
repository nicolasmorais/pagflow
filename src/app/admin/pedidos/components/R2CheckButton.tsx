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
        idle: { bg: '#FFFFFF', color: '#6E7180', border: '#E5E7EF' },
        checking: { bg: '#E7F1F8', color: '#2C5C86', border: '#C3DAEC' },
        exists: { bg: '#E3F4EA', color: '#1E7A52', border: '#BFE3CE' },
        missing: { bg: '#FEF3C7', color: '#92400E', border: '#F6DB8E' },
        error: { bg: '#FBEAE8', color: '#B23B32', border: '#F3CFCB' },
        uploading: { bg: '#E7F1F8', color: '#2C5C86', border: '#C3DAEC' },
        uploaded: { bg: '#E3F4EA', color: '#1E7A52', border: '#BFE3CE' },
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
            aria-label={tooltip}
            style={{
                width: '32px', height: '32px', borderRadius: '9px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: s.bg, color: s.color, border: `1px solid ${s.border}`,
                cursor: 'pointer', transition: 'all 0.15s',
            }}
        >
            {icon}
        </button>
    )
}
