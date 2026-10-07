'use client'

import { useState } from 'react'
import './PixPayment.css'

interface Props {
    qrCode: string | null
    qrCodeBase64: string | null
    amount: number
    orderId: string | null
    productName: string
    email: string
    timeLeft: number
    totalTime: number
    expired: boolean
    paid: boolean
    regenerating: boolean
    checking: boolean
    onRegenerate: () => void
    onCheckNow: () => void
}

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const shortId = (id: string | null) => (id ? `#${id.slice(0, 8).toUpperCase()}` : '')
const mmss = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

// Fallback para webviews (Instagram/Facebook) onde navigator.clipboard falha
async function copyText(text: string) {
    try {
        await navigator.clipboard.writeText(text)
        return true
    } catch {
        try {
            const ta = document.createElement('textarea')
            ta.value = text
            ta.setAttribute('readonly', '')
            ta.style.position = 'fixed'
            ta.style.opacity = '0'
            document.body.appendChild(ta)
            ta.select()
            const ok = document.execCommand('copy')
            document.body.removeChild(ta)
            return ok
        } catch {
            return false
        }
    }
}

const IconCheck = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
)
const IconCopy = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
)

export default function PixPayment(props: Props) {
    const { qrCode, qrCodeBase64, amount, orderId, productName, email, timeLeft, totalTime, expired, paid, regenerating, checking, onRegenerate, onCheckNow } = props
    const [copied, setCopied] = useState(false)
    const [copyFailed, setCopyFailed] = useState(false)
    const [showQr, setShowQr] = useState(false)

    const handleCopy = async () => {
        if (!qrCode) return
        const ok = await copyText(qrCode)
        setCopyFailed(!ok)
        if (ok) {
            setCopied(true)
            setTimeout(() => setCopied(false), 3000)
        }
    }

    // ── PAGO ──
    if (paid) {
        return (
            <div className="pq">
                <div className="pq-head" role="status">
                    <div className="pq-mark pq-mark-ok"><IconCheck /></div>
                    <h1 className="pq-title">Pagamento confirmado</h1>
                    <p className="pq-lede">Recebemos seu PIX de <strong>{brl(amount)}</strong>. Seu pedido já está em separação.</p>
                </div>

                <div className="pq-card">
                    <dl className="pq-summary">
                        {orderId && <div><dt>Pedido</dt><dd>{shortId(orderId)}</dd></div>}
                        <div><dt>Produto</dt><dd>{productName}</dd></div>
                        <div><dt>Total pago</dt><dd>{brl(amount)}</dd></div>
                    </dl>
                </div>

                <div className="pq-card">
                    <h2 className="pq-h2">Próximos passos</h2>
                    <ol className="pq-steps">
                        <li><span>1</span><p>O comprovante foi enviado para <strong>{email || 'o seu e-mail'}</strong>.</p></li>
                        <li><span>2</span><p>Pedidos pagos até 15h saem no mesmo dia. Depois disso, no próximo dia útil.</p></li>
                        <li><span>3</span><p>Você recebe o código de rastreio por e-mail assim que o pedido for enviado.</p></li>
                    </ol>
                </div>
            </div>
        )
    }

    // ── EXPIRADO ──
    if (expired) {
        return (
            <div className="pq">
                <div className="pq-head" role="status">
                    <div className="pq-mark pq-mark-warn">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
                    </div>
                    <h1 className="pq-title">O código PIX expirou</h1>
                    <p className="pq-lede">Seu pedido continua salvo. Gere um novo código para pagar <strong>{brl(amount)}</strong>.</p>
                </div>
                <button className="pq-btn" onClick={onRegenerate} disabled={regenerating}>
                    {regenerating ? 'Gerando novo código…' : 'Gerar novo código PIX'}
                </button>
                <p className="pq-note">Se você já pagou, não gere outro. <button className="pq-link" onClick={onCheckNow} disabled={checking}>{checking ? 'Verificando…' : 'Verificar pagamento'}</button></p>
            </div>
        )
    }

    // ── SEM QR (falha na geração) ──
    if (!qrCode) {
        return (
            <div className="pq">
                <div className="pq-head" role="status">
                    <div className="pq-spinner" aria-hidden="true" />
                    <h1 className="pq-title">Gerando seu código PIX</h1>
                    <p className="pq-lede">Isso costuma levar alguns segundos. Se não aparecer, tente de novo.</p>
                </div>
                <button className="pq-btn" onClick={onRegenerate} disabled={regenerating}>
                    {regenerating ? 'Gerando…' : 'Tentar novamente'}
                </button>
            </div>
        )
    }

    // ── AGUARDANDO PAGAMENTO ──
    const urgent = timeLeft <= 120
    const pct = Math.max(0, Math.min(100, (timeLeft / totalTime) * 100))

    return (
        <div className="pq">
            <div className="pq-head">
                <div className="pq-pill" role="status"><span className="pq-dot" aria-hidden="true" />Aguardando pagamento</div>
                <p className="pq-eyebrow">Total a pagar</p>
                <h1 className="pq-amount">{brl(amount)}</h1>
                <p className="pq-lede">
                    Seu pedido{orderId ? <> <strong>{shortId(orderId)}</strong></> : null} está reservado.
                    A confirmação aparece nesta tela assim que o pagamento cair.
                </p>
            </div>

            <div className={`pq-timer ${urgent ? 'is-urgent' : ''}`}>
                <div className="pq-timer-row">
                    <span>O código expira em</span>
                    <strong aria-live="off">{mmss(timeLeft)}</strong>
                </div>
                <div className="pq-timer-bar"><div style={{ width: `${pct}%` }} /></div>
            </div>

            <div className="pq-card pq-pay">
                <div className="pq-copy">
                    <h2 className="pq-h2">Pague com PIX Copia e Cola</h2>
                    <ol className="pq-steps">
                        <li><span>1</span><p>Toque em <strong>Copiar código</strong></p></li>
                        <li><span>2</span><p>No app do seu banco, abra <strong>PIX → Copia e Cola</strong></p></li>
                        <li><span>3</span><p>Cole o código e confirme o valor de <strong>{brl(amount)}</strong></p></li>
                    </ol>

                    <button className={`pq-btn ${copied ? 'is-copied' : ''}`} onClick={handleCopy}>
                        {copied ? <IconCheck /> : <IconCopy />}
                        {copied ? 'Código copiado' : 'Copiar código PIX'}
                    </button>
                    <span className="pq-sr" aria-live="polite">{copied ? 'Código PIX copiado' : ''}</span>

                    <div className="pq-code" aria-label="Código PIX Copia e Cola">{qrCode}</div>
                    {copyFailed && <p className="pq-note pq-note-warn">Não foi possível copiar automaticamente. Toque e segure o código acima para copiar.</p>}
                </div>

                <button className="pq-qr-toggle" onClick={() => setShowQr(v => !v)} aria-expanded={showQr}>
                    {showQr ? 'Ocultar QR Code' : 'Vai pagar em outro aparelho? Mostrar QR Code'}
                </button>

                <div className={`pq-qr ${showQr ? 'is-open' : ''}`}>
                    <div className="pq-qr-frame">
                        {qrCodeBase64
                            ? <img src={`data:image/png;base64,${qrCodeBase64}`} alt="QR Code para pagamento PIX" />
                            : <span>QR Code indisponível</span>}
                    </div>
                    <p className="pq-qr-caption">Escaneie com a câmera do app do seu banco</p>
                </div>
            </div>

            <div className="pq-check">
                <div className="pq-check-row">
                    <span className="pq-spinner pq-spinner-sm" aria-hidden="true" />
                    <span>Verificando o pagamento automaticamente</span>
                </div>
                <button className="pq-btn-ghost" onClick={onCheckNow} disabled={checking}>
                    {checking ? 'Verificando…' : 'Já paguei, verificar agora'}
                </button>
            </div>

            <div className="pq-card">
                <dl className="pq-summary">
                    <div><dt>Produto</dt><dd>{productName}</dd></div>
                    <div><dt>Confirmação para</dt><dd>{email || '—'}</dd></div>
                    <div><dt>Total</dt><dd>{brl(amount)}</dd></div>
                </dl>
            </div>

            <p className="pq-foot">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
                Pagamento pelo PIX oficial do Banco Central
            </p>
        </div>
    )
}
