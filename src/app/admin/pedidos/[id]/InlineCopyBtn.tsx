'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

export default function InlineCopyBtn({ text, label = 'Copiar' }: { text: string; label?: string }) {
    const [copied, setCopied] = useState(false)

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(text)
            setCopied(true)
            setTimeout(() => setCopied(false), 1400)
        } catch { }
    }

    return (
        <button
            type="button"
            onClick={handleCopy}
            className={`od-copy${copied ? ' is-done' : ''}`}
            title={copied ? 'Copiado' : label}
            aria-label={copied ? 'Copiado' : label}
        >
            {copied ? <Check size={14} strokeWidth={2.4} aria-hidden /> : <Copy size={14} strokeWidth={2} aria-hidden />}
        </button>
    )
}
