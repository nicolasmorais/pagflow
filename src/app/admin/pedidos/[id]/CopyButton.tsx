'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

export default function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false)

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(text)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch { }
    }

    return (
        <button
            onClick={handleCopy}
            style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '7px 14px', borderRadius: '10px',
                background: copied ? '#ecfdf5' : '#f0f4ff',
                border: `1.5px solid ${copied ? '#a7f3d0' : '#c7d2fe'}`,
                color: copied ? '#059669' : '#6366f1',
                fontSize: '12px', fontWeight: 700,
                cursor: 'pointer', transition: 'all 0.2s',
            }}
        >
            {copied ? <Check size={13} strokeWidth={2.5} /> : <Copy size={13} strokeWidth={2} />}
            {copied ? 'Copiado!' : 'Copiar'}
        </button>
    )
}
