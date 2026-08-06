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
            setTimeout(() => setCopied(false), 1200)
        } catch { }
    }

    return (
        <button
            onClick={handleCopy}
            title="Copiar"
            style={{
                width: '26px', height: '26px', borderRadius: '7px',
                border: '1px solid transparent', background: copied ? '#E3F4EA' : 'transparent',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, cursor: 'pointer', transition: 'background 0.15s, color 0.15s',
                color: copied ? '#1E7A52' : '#9CA0AE',
            }}
        >
            {copied
                ? <Check size={12.5} strokeWidth={2.6} />
                : <Copy size={12.5} strokeWidth={2} />
            }
        </button>
    )
}
