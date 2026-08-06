'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

export default function InlineCopyBtn({ text }: { text: string }) {
    const [copied, setCopied] = useState(false)

    const handleCopy = async (e: React.MouseEvent) => {
        e.stopPropagation()
        try {
            await navigator.clipboard.writeText(text)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch { }
    }

    return (
        <button
            onClick={handleCopy}
            title="Copiar"
            style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
                background: copied ? '#ecfdf5' : '#f8fafc',
                border: `1px solid ${copied ? '#d1fae5' : '#f1f5f9'}`,
                cursor: 'pointer', transition: 'all 0.2s ease',
                opacity: 1,
            }}
        >
            {copied
                ? <Check size={13} color="#059669" strokeWidth={2} />
                : <Copy size={13} color="#94a3b8" strokeWidth={1.8} />
            }
        </button>
    )
}
