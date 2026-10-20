'use client'

import { useEffect, useMemo, useState } from 'react'
import { reportWebVitals } from '@/lib/web-vitals-reporter'
import { CARD_MAX_INSTALLMENTS, DEFAULT_CARD_FEES, cardTotalWithFee, type CardFees } from '@/lib/card-fees'

// Lógica do checkout v2. Copiada (não compartilhada) da v1 de propósito:
// a v1 continua intocada enquanto as duas versões coexistem.

export const PIX_TTL = 10 * 60

const CARD_MIN_INSTALLMENT = 9.9

export type Section = 1 | 2 | 3
export type PayMethod = 'pix' | 'card' | 'pix_automatico'
export type CepStatus = 'idle' | 'loading' | 'ok' | 'notfound' | 'error'

export interface ShippingRule { id?: string; name: string; price: number; delivery_time?: string | null }

export const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export const onlyDigits = (v: string) => v.replace(/\D/g, '')

export const fmt = {
    cpf: (v: string) => onlyDigits(v).slice(0, 11)
        .replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2'),
    tel: (v: string) => {
        const d = onlyDigits(v).slice(0, 11)
        return d.length <= 10
            ? d.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2')
            : d.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2')
    },
    cep: (v: string) => { const d = onlyDigits(v).slice(0, 8); return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d },
    date: (v: string) => {
        const d = onlyDigits(v).slice(0, 8)
        if (d.length > 4) return d.replace(/(\d{2})(\d{2})(\d{1,4})/, '$1/$2/$3')
        if (d.length > 2) return d.replace(/(\d{2})(\d{1,2})/, '$1/$2')
        return d
    },
    card: (v: string) => onlyDigits(v).slice(0, 16).replace(/(\d{4})/g, '$1 ').trim(),
    exp: (v: string) => { const d = onlyDigits(v).slice(0, 4); return d.length >= 3 ? `${d.slice(0, 2)}/${d.slice(2)}` : d },
}

export function isValidCPF(v: string) {
    const c = onlyDigits(v)
    if (c.length !== 11 || /^(\d)\1{10}$/.test(c)) return false
    const calc = (n: number) => {
        let sum = 0
        for (let i = 0; i < n; i++) sum += Number(c[i]) * (n + 1 - i)
        const r = (sum * 10) % 11
        return r === 10 ? 0 : r
    }
    return calc(9) === Number(c[9]) && calc(10) === Number(c[10])
}

// Sugere correção para erros de digitação comuns no domínio do e-mail
const DOMAIN_FIXES: Record<string, string> = {
    'gmial.com': 'gmail.com', 'gmai.com': 'gmail.com', 'gmail.con': 'gmail.com', 'gmail.com.br': 'gmail.com',
    'gamil.com': 'gmail.com', 'gnail.com': 'gmail.com', 'gmail.co': 'gmail.com', 'gmaill.com': 'gmail.com',
    'hotmal.com': 'hotmail.com', 'hotmai.com': 'hotmail.com', 'hotmail.con': 'hotmail.com', 'hotmial.com': 'hotmail.com',
    'outlok.com': 'outlook.com', 'outlook.con': 'outlook.com', 'yahoo.con': 'yahoo.com', 'yaho.com.br': 'yahoo.com.br',
    'icloud.con': 'icloud.com', 'iclod.com': 'icloud.com',
}

export function emailIssue(raw: string): { error?: string; suggestion?: string } {
    const email = raw.trim().toLowerCase()
    if (!email) return { error: 'Informe seu e-mail' }
    const re = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/
    if (!re.test(email)) return { error: 'Confira o e-mail — parece incompleto' }
    const [local, domain] = email.split('@')
    if ((domain.split('.').pop() || '').length < 2) return { error: 'Confira o final do e-mail' }
    if (DOMAIN_FIXES[domain]) return { suggestion: `${local}@${DOMAIN_FIXES[domain]}` }
    return {}
}

export const deliveryLabel = (t?: string | null) => {
    if (!t) return ''
    const s = String(t).trim()
    return /^\d+$/.test(s) ? `Chega em até ${s} dias úteis` : s
}

export function useCheckoutV2({ product, customization, shippingRules, availableBumps, pixels }: any) {
    const rules: ShippingRule[] = shippingRules?.length ? shippingRules : [{ name: 'Entrega padrão', price: 0, delivery_time: '7' }]
    const bumps: any[] = (availableBumps || []).filter((b: any) => b.isActive !== false)

    const [section, setSection] = useState<Section>(1)
    const [dados, setDados] = useState({ nome: '', email: '', telefone: '', cpf: '', nascimento: '' })
    const [endereco, setEndereco] = useState({ cep: '', rua: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '', destinatario: '' })
    const [cepStatus, setCepStatus] = useState<CepStatus>('idle')
    const [shipping, setShipping] = useState<ShippingRule>(rules[0])
    const [paymentMethod, setPaymentMethod] = useState<PayMethod>('pix')
    const [selectedBumps, setSelectedBumps] = useState<string[]>([])
    const [card, setCard] = useState({ number: '', name: '', exp: '', cvv: '', installments: 1 })
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [emailSuggestion, setEmailSuggestion] = useState('')
    const [payError, setPayError] = useState('')

    const [submitting, setSubmitting] = useState(false)
    const [done, setDone] = useState(false)
    const [declined, setDeclined] = useState(false)
    const [orderId, setOrderId] = useState<string | null>(null)
    const [chargedTotal, setChargedTotal] = useState(0)

    const [pixData, setPixData] = useState<{ qrCode: string; qrCodeBase64: string } | null>(null)
    const [timeLeft, setTimeLeft] = useState(PIX_TTL)
    const [pixExpired, setPixExpired] = useState(false)
    const [pixPaid, setPixPaid] = useState(false)
    const [pixRegenerating, setPixRegenerating] = useState(false)
    const [pixChecking, setPixChecking] = useState(false)

    // PIX Parcelado (assinatura)
    const pixTotal: number = product?.pixPrice ? Number(product.pixPrice) : (product?.price || 0)
    const minInstallmentValue: number = product?.minInstallmentValue ?? 49.9
    const parcelasOpcoes = [2, 3, 4, 5, 6, 7, 8].filter(n => pixTotal / n >= minInstallmentValue)
    const [parcelas, setParcelas] = useState<number>(() => parcelasOpcoes[parcelasOpcoes.length - 1] ?? 6)
    const [subData, setSubData] = useState<{ qrCodeBase64: string; emv: string } | null>(null)
    const valorParcela = (n: number) => pixTotal / n

    // ── Preços (espelham o cálculo do servidor em /api/process-payment) ──
    const pixDiscountPct = Math.max(0, Number(customization?.pixDiscount || 0)) / 100
    const basePrice: number = Number(product?.price) || 0
    const bumpsTotal = bumps.filter(b => selectedBumps.includes(b.id)).reduce((s, b) => s + (b.price || 0), 0)
    const subtotal = basePrice + bumpsTotal
    const shippingPrice = Number(shipping?.price) || 0
    const pixDiscountValue = Number((subtotal * pixDiscountPct).toFixed(2))
    const pixPrice = Number((subtotal - pixDiscountValue + shippingPrice).toFixed(2))
    const fullPrice = Number((subtotal + shippingPrice).toFixed(2))
    const total = paymentMethod === 'pix' ? pixPrice : paymentMethod === 'pix_automatico' ? pixTotal : fullPrice

    // Taxa da Pagar.me (Admin → Configurações) repassada inteira ao cliente, inclusive à vista — igual à v1
    const cardFees: CardFees = customization?.cardFees ?? DEFAULT_CARD_FEES
    const installmentValue = (n: number) => cardTotalWithFee(fullPrice, n, cardFees) / n
    const installmentOptions = useMemo(() => {
        const opts: { n: number; value: number; total: number; interest: boolean }[] = []
        for (let n = 1; n <= CARD_MAX_INSTALLMENTS; n++) {
            const value = installmentValue(n)
            if (n === 1 || value >= CARD_MIN_INSTALLMENT) {
                opts.push({ n, value, total: Number((value * n).toFixed(2)), interest: n > 1 })
            }
        }
        return opts
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fullPrice, cardFees])
    const cardTotal = installmentOptions.find(o => o.n === card.installments)?.total ?? fullPrice

    // ── Tracking (mesmos eventos da v1) ──
    const visitorId = () => {
        try {
            let vid = localStorage.getItem('pf_vid')
            if (!vid) { vid = crypto.randomUUID(); localStorage.setItem('pf_vid', vid) }
            return vid
        } catch { return '' }
    }
    const qs = () => new URLSearchParams(typeof window === 'undefined' ? '' : window.location.search)
    const utm = () => {
        const p = qs()
        return {
            utmSource: p.get('utm_source'), utmMedium: p.get('utm_medium'), utmCampaign: p.get('utm_campaign'),
            utmTerm: p.get('utm_term'), utmContent: p.get('utm_content'), utmPlacement: p.get('utm_placement'),
            utmId: p.get('utm_id'), utmCreativeName: p.get('utm_creative_name'), clickId: p.get('tblci'),
        }
    }
    const trackFunnel = (step: string, oid?: string) => {
        try {
            const vid = visitorId()
            if (!vid) return
            const u = utm()
            fetch('/api/track', {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, keepalive: true,
                body: JSON.stringify({
                    visitorId: vid, step, productId: product?.id || null, orderId: oid || null,
                    clickId: u.clickId, utmSource: u.utmSource, utmMedium: u.utmMedium, utmCampaign: u.utmCampaign,
                    utmTerm: u.utmTerm, utmContent: u.utmContent,
                }),
            }).catch(() => { })
        } catch { }
    }
    const taboola = (name: string, data: any = {}) => {
        const _tfa = (window as any)._tfa || []
        if (pixels?.taboolaId) _tfa.push({ notify: 'event', name, id: pixels.taboolaId, ...data })
        for (const p of (pixels?.perProduct || []).filter((p: any) => p.type === 'taboola')) {
            _tfa.push({ notify: 'event', name, id: p.pixelId, ...data })
        }
    }
    const gtag = (name: string, params: Record<string, any> = {}) => {
        const g = (window as any).gtag
        if (g) g('event', name, params)
    }
    const gaItems = (price: number) => [{ item_id: product?.id || 'default', item_name: product?.name || 'Produto', price, quantity: 1 }]
    const trackPurchase = (oid: string | undefined, value: number, type: string) => {
        taboola(product?.purchaseEventName || 'make_purchase', { revenue: value, currency: 'BRL' })
        gtag('purchase', { transaction_id: oid || crypto.randomUUID(), value, currency: 'BRL', payment_type: type, items: gaItems(product?.price || 0) })
        const safe = /^[a-zA-Z0-9_-]+$/
        if (pixels?.googleId && pixels?.googleAdsConvLabel && safe.test(pixels.googleId) && safe.test(pixels.googleAdsConvLabel)) {
            gtag('conversion', { send_to: `${pixels.googleId}/${pixels.googleAdsConvLabel}`, value, currency: 'BRL', transaction_id: oid || '' })
        }
    }

    // ── Scripts de terceiros + previews (montagem) ──
    useEffect(() => {
        const safe = (id: string) => /^[a-zA-Z0-9_-]+$/.test(id)
        const addScript = (id: string, src: string) => {
            if (document.getElementById(id)) return
            const s = document.createElement('script'); s.id = id; s.async = true; s.src = src
            document.head.appendChild(s)
        }
        ; (window as any)._tfa = (window as any)._tfa || []
        if (pixels?.taboolaId && safe(pixels.taboolaId)) addScript('taboola-pixel', `https://cdn.taboola.com/libtr/${pixels.taboolaId}/tfa.js`)
        for (const p of (pixels?.perProduct || []).filter((p: any) => p.type === 'taboola')) {
            if (safe(p.pixelId)) addScript(`taboola-pixel-${p.pixelId}`, `https://cdn.taboola.com/libtr/${p.pixelId}/tfa.js`)
        }
        taboola(product?.startCheckoutEventName || 'start_checkout')
        trackFunnel('page_view')
        reportWebVitals(visitorId())

        if (!document.getElementById('gtag-script')) {
            addScript('gtag-script', 'https://www.googletagmanager.com/gtag/js?id=G-FQKVQXLFES')
            const w = window as any
            w.dataLayer = w.dataLayer || []
            w.gtag = function () { w.dataLayer.push(arguments) }
            w.gtag('js', new Date())
            w.gtag('config', 'G-FQKVQXLFES')
            gtag('begin_checkout', { currency: 'BRL', value: product?.price || 0, items: gaItems(product?.price || 0) })
        }
        if (!document.getElementById('clarity-script')) {
            const s = document.createElement('script'); s.id = 'clarity-script'
            s.innerHTML = `(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window, document, "clarity", "script", "wgy8utofnr");`
            document.head.appendChild(s)
        }

        // Previews: ?preview=pix-qr | pix-pago | confirmacao | recusado | pagamento
        const preview = qs().get('preview')
        if (preview) {
            const fakeDados = { nome: 'João da Silva', email: 'teste@pagflow.com', telefone: '(11) 91234-5678', cpf: '', nascimento: '' }
            const fakeEnd = { cep: '01310-100', rua: 'Av. Paulista', numero: '1000', complemento: '', bairro: 'Bela Vista', cidade: 'São Paulo', estado: 'SP', destinatario: 'João da Silva' }
            const fakeQr = { qrCode: '00020126580014br.gov.bcb.pix013688735ef-c3ea-420c-a616-6a4fc9d061a520400005303986', qrCodeBase64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==' }
            setDados(fakeDados); setEndereco(fakeEnd); setCepStatus('ok')
            if (preview === 'pagamento') setSection(3)
            if (preview === 'entrega') setSection(2)
            if (preview === 'pix-qr' || preview === 'pix-pago') {
                setPaymentMethod('pix'); setPixData(fakeQr); setTimeLeft(PIX_TTL); setDone(true)
                if (preview === 'pix-pago') setPixPaid(true)
            }
            if (preview === 'confirmacao') { setPaymentMethod('card'); setChargedTotal(fullPrice); setDone(true) }
            if (preview === 'recusado') { setPaymentMethod('card'); setSection(3); setDeclined(true) }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // ── Timer do PIX: só corre enquanto o QR está na tela ──
    useEffect(() => {
        if (!done || paymentMethod !== 'pix' || !pixData || pixPaid || pixExpired) return
        const t = setInterval(() => setTimeLeft(s => {
            if (s <= 1) { setPixExpired(true); return 0 }
            return s - 1
        }), 1000)
        return () => clearInterval(t)
    }, [done, paymentMethod, pixData, pixPaid, pixExpired])

    const checkPixStatus = async () => {
        if (!orderId) return false
        try {
            const res = await fetch(`/api/order-status/${orderId}`)
            if (res.ok) {
                const data = await res.json()
                if (data.paymentStatus === 'pago') { setPixPaid(true); window.scrollTo(0, 0); return true }
            }
        } catch { }
        return false
    }
    useEffect(() => {
        if (!done || paymentMethod !== 'pix' || !orderId || pixPaid) return
        const t = setInterval(checkPixStatus, 5000)
        return () => clearInterval(t)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [done, paymentMethod, orderId, pixPaid])

    const checkPixNow = async () => {
        setPixChecking(true)
        await checkPixStatus()
        setTimeout(() => setPixChecking(false), 600)
    }

    // ── Campos ──
    const clearError = (k: string) => setErrors(p => { if (!p[k]) return p; const n = { ...p }; delete n[k]; return n })
    const setDado = (k: keyof typeof dados, v: string) => { setDados(p => ({ ...p, [k]: v })); clearError(k); if (k === 'email') setEmailSuggestion('') }
    const setEnd = (k: keyof typeof endereco, v: string) => { setEndereco(p => ({ ...p, [k]: v })); clearError(k) }

    const lookupCep = async (digits: string) => {
        setCepStatus('loading')
        try {
            const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`)
            const data = await res.json()
            if (data.erro) { setCepStatus('notfound'); return }
            setEndereco(p => ({
                ...p,
                rua: data.logradouro || p.rua, bairro: data.bairro || p.bairro,
                cidade: data.localidade || p.cidade, estado: data.uf || p.estado,
            }))
            setCepStatus('ok')
        } catch {
            setCepStatus('error')
        }
    }
    const onCepChange = (v: string) => {
        const f = fmt.cep(v)
        setEnd('cep', f)
        const d = onlyDigits(f)
        if (d.length === 8) lookupCep(d)
        else if (cepStatus !== 'idle') setCepStatus('idle')
    }

    // ── Etapas ──
    const goTo = (s: Section) => { setSection(s); setPayError('') }

    const submitContact = () => {
        const e: Record<string, string> = {}
        if (dados.nome.trim().split(/\s+/).length < 2) e.nome = 'Informe nome e sobrenome'
        const em = emailIssue(dados.email)
        if (em.error) e.email = em.error
        if (onlyDigits(dados.telefone).length < 10) e.telefone = 'Informe o celular com DDD'
        if (!customization?.disableCpf && dados.cpf && !isValidCPF(dados.cpf)) e.cpf = 'CPF inválido — confira os números'
        setErrors(e)
        if (Object.keys(e).length) return false
        if (em.suggestion && !emailSuggestion) {
            // Não bloqueia: só pergunta uma vez
            setEmailSuggestion(em.suggestion)
            return false
        }
        if (!endereco.destinatario) setEndereco(p => ({ ...p, destinatario: dados.nome }))
        setSection(2)
        trackFunnel('dados_completo')
        gtag('add_contact_info', { currency: 'BRL', value: total, items: gaItems(product?.price || 0) })
        return true
    }

    const submitAddress = () => {
        const e: Record<string, string> = {}
        if (onlyDigits(endereco.cep).length !== 8) e.cep = 'CEP precisa ter 8 números'
        if (!endereco.rua.trim()) e.rua = 'Informe a rua'
        if (!endereco.numero.trim()) e.numero = 'Informe o número (ou "s/n")'
        if (!endereco.bairro.trim()) e.bairro = 'Informe o bairro'
        if (!endereco.cidade.trim()) e.cidade = 'Informe a cidade'
        if (!/^[A-Za-z]{2}$/.test(endereco.estado.trim())) e.estado = 'Selecione o estado'
        setErrors(e)
        if (Object.keys(e).length) return false
        setSection(3)
        trackFunnel('entrega_completa')
        gtag('add_shipping_info', { currency: 'BRL', value: total, shipping_tier: shipping?.name || 'Standard', items: gaItems(product?.price || 0) })
        return true
    }

    const toggleBump = (id: string) => setSelectedBumps(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])

    // ── Pagamento ──
    const orderPayload = () => ({
        ...dados, ...endereco,
        price: paymentMethod === 'pix' ? pixPrice : fullPrice,
        shippingPrice,
        productId: product?.id || 'default',
        selectedBumpIds: selectedBumps,
        visitorId: visitorId(),
        ...utm(),
    })

    const processPayment = async (method: 'pix' | 'credit_card', pagarmeData?: any) => {
        setSubmitting(true)
        setPayError('')
        trackFunnel('pagamento_iniciado')
        try {
            const res = await fetch('/api/process-payment', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ method, pagarmeData, orderId, orderData: orderPayload() }),
            })
            let result: any
            try { result = await res.json() } catch { throw new Error('Não conseguimos falar com o servidor. Tente de novo em instantes.') }
            if (!result.success) throw new Error(result.error || 'Não foi possível concluir o pagamento. Tente novamente.')

            const value = method === 'pix' ? pixPrice : (pagarmeData?.totalWithInterest ?? fullPrice)
            trackFunnel('pedido_criado', result.orderId)
            trackPurchase(result.orderId, value, method === 'pix' ? 'pix' : 'credit_card')

            setOrderId(result.orderId || orderId)
            setChargedTotal(value)
            if (result.paymentStatus === 'recusado') { setDeclined(true); window.scrollTo(0, 0); return }
            if (result.qrCodeBase64) {
                setPixData({ qrCode: result.qrCode, qrCodeBase64: result.qrCodeBase64 })
                setTimeLeft(PIX_TTL); setPixExpired(false)
            }
            setDone(true)
            window.scrollTo(0, 0)
        } catch (e: any) {
            setPayError(e?.message || 'Erro de conexão. Verifique sua internet e tente de novo.')
        } finally {
            setSubmitting(false)
        }
    }

    const payPix = () => processPayment('pix')

    const payCard = async () => {
        const e: Record<string, string> = {}
        const num = onlyDigits(card.number)
        if (num.length < 13) e.cardNumber = 'Número do cartão incompleto'
        if (!card.name.trim()) e.cardName = 'Informe o nome como está no cartão'
        const [mm, yy] = card.exp.split('/')
        const now = new Date()
        const expOk = mm?.length === 2 && yy?.length === 2 && +mm >= 1 && +mm <= 12 &&
            new Date(2000 + +yy, +mm, 0) >= new Date(now.getFullYear(), now.getMonth(), 1)
        if (!expOk) e.cardExp = 'Validade inválida (MM/AA)'
        if (card.cvv.length < 3) e.cardCvv = 'CVV tem 3 ou 4 números'
        if (!isValidCPF(dados.cpf)) e.cardCpf = 'CPF do titular inválido'
        const nd = onlyDigits(dados.nascimento)
        const iso = nd.length === 8 ? `${nd.slice(4)}-${nd.slice(2, 4)}-${nd.slice(0, 2)}` : ''
        const birth = iso ? new Date(iso + 'T12:00:00') : null
        const age = birth ? (Date.now() - birth.getTime()) / (365.25 * 864e5) : NaN
        if (!birth || isNaN(age) || age < 16 || age > 110 || birth.toISOString().slice(0, 10) !== iso) e.cardBirth = 'Data de nascimento inválida'
        setErrors(e)
        if (Object.keys(e).length) return

        setSubmitting(true)
        setPayError('')
        try {
            const tokenRes = await fetch(`https://api.pagar.me/core/v5/tokens?appId=${process.env.NEXT_PUBLIC_PAGARME_PUBLIC_KEY}`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'card', card: { number: num, holder_name: card.name.trim(), exp_month: +mm, exp_year: +yy, cvv: card.cvv } }),
            })
            const tk = await tokenRes.json()
            if (!tokenRes.ok || !tk.id) {
                setPayError(tk?.message || tk?.errors?.[0]?.message || 'Não foi possível validar o cartão. Confira os dados.')
                setSubmitting(false)
                return
            }
            await processPayment('credit_card', {
                cardToken: tk.id,
                brand: tk.card?.brand?.toLowerCase() || 'unknown',
                installments: card.installments,
                totalWithInterest: cardTotal,
            })
        } catch {
            setPayError('Erro de conexão ao validar o cartão. Tente novamente.')
            setSubmitting(false)
        }
    }

    const enrollSubscription = async () => {
        if (!isValidCPF(dados.cpf)) { setErrors({ subCpf: 'CPF inválido — obrigatório no PIX Parcelado' }); return }
        setSubmitting(true)
        setPayError('')
        try {
            const res = await fetch('/api/subscription/enroll', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productId: product?.id, parcelas,
                    orderData: { ...dados, ...endereco, shippingPrice, selectedBumpIds: selectedBumps, visitorId: visitorId(), ...utm() },
                }),
            })
            const result = await res.json()
            if (!result.success) throw new Error(result.error || 'Não foi possível criar o PIX Parcelado.')
            trackPurchase(result.orderId, pixTotal, 'pix_automatico')
            trackFunnel('pedido_criado', result.orderId)
            setSubData({ qrCodeBase64: result.qrCodeBase64 || '', emv: result.emv || '' })
            setOrderId(result.orderId)
            setDone(true)
            window.scrollTo(0, 0)
        } catch (e: any) {
            setPayError(e?.message || 'Erro de conexão. Tente novamente.')
        } finally {
            setSubmitting(false)
        }
    }

    const regeneratePix = async () => {
        setPixRegenerating(true)
        try {
            const res = await fetch('/api/process-payment', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ method: 'pix', orderId, orderData: orderPayload() }),
            })
            const result = await res.json()
            if (result.success && result.qrCodeBase64) {
                setPixData({ qrCode: result.qrCode, qrCodeBase64: result.qrCodeBase64 })
                setTimeLeft(PIX_TTL); setPixExpired(false)
                setOrderId(result.orderId || orderId)
            } else {
                alert(result.error || 'Erro ao gerar novo PIX. Tente novamente.')
            }
        } catch {
            alert('Erro de conexão. Tente novamente.')
        } finally {
            setPixRegenerating(false)
        }
    }

    const retryAfterDecline = (method: PayMethod) => {
        setDeclined(false)
        setPaymentMethod(method)
        setSection(3)
        setCard(c => ({ ...c, number: '', cvv: '' }))
        window.scrollTo(0, 0)
    }

    return {
        rules, bumps, section, goTo, dados, setDado, endereco, setEnd, cepStatus, onCepChange,
        shipping, setShipping, paymentMethod, setPaymentMethod, selectedBumps, toggleBump,
        card, setCard, errors, emailSuggestion, setEmailSuggestion, payError,
        submitting, done, declined, orderId, chargedTotal,
        pixData, timeLeft, pixExpired, pixPaid, pixRegenerating, pixChecking,
        parcelas, setParcelas, parcelasOpcoes, valorParcela, pixTotal, subData,
        basePrice, bumpsTotal, subtotal, shippingPrice, pixDiscountPct, pixDiscountValue, pixPrice, fullPrice, total,
        installmentOptions, cardTotal,
        submitContact, submitAddress, payPix, payCard, enrollSubscription, regeneratePix, checkPixNow, retryAfterDecline,
    }
}
