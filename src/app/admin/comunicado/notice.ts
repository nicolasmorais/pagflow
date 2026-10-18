// Comunicado de reembolso: pedidos no cartão que não puderam ser processados
// (conta do Mercado Pago bloqueada). Usado pela prévia e pelo envio.

export const REFUND_NOTICE_TYPE = 'refund_notice'

// Produtos incluídos no comunicado (busca por trecho do nome, sem diferenciar maiúsculas)
export const REFUND_PRODUCTS = ['DermaVit', 'LumiSkin', 'Vitamin C', 'Pele de Porcelana']

// Domínios digitados errado no checkout → domínio certo. Corrige só no envio (o pedido não muda).
const DOMAIN_FIXES: Record<string, string> = {
    'gmsil.com': 'gmail.com',
    'gmil.com': 'gmail.com',
    'gmai.com': 'gmail.com',
    'gamil.com': 'gmail.com',
    'gnail.com': 'gmail.com',
    'gmail.con': 'gmail.com',
    'gmail.co': 'gmail.com',
    'hotmal.com': 'hotmail.com',
    'hotmial.com': 'hotmail.com',
    'hotmail.con': 'hotmail.com',
    'outlok.com': 'outlook.com',
}

export function fixEmail(email: string) {
    const at = email.lastIndexOf('@')
    if (at < 0) return email
    const user = email.slice(0, at).trim()
    let domain = email.slice(at + 1).trim().toLowerCase()
    domain = domain.replace(/^\d+(gmail|hotmail|outlook)\./, '$1.') // ex.: 7gmail.com
    return `${user}@${DOMAIN_FIXES[domain] ?? domain}`
}

export const looksMistyped = (email: string) => !!email && fixEmail(email) !== email.trim()

// Pedidos de teste do próprio admin: começam desmarcados
export const looksLikeTest = (name: string, product: string) =>
    /^teste?\b/i.test(name.trim()) || /\(c[oó]pia\)/i.test(product)

// Como o método cartão aparece gravado nos pedidos (atual e legados)
export const CARD_METHODS = ['credito', 'credit_card', 'card', 'cartao']

export const REFUND_SUBJECT = 'Informação importante sobre o reembolso da sua compra'

const escapeHtml = (s: string) =>
    s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))

export function buildRefundNotice(fullName: string | null, descriptor: string) {
    const name = escapeHtml((fullName || '').trim().split(/\s+/)[0] || 'cliente')
    const desc = escapeHtml(descriptor.trim() || 'Elabela Store')

    const p = 'margin:0 0 16px;font-size:15px;line-height:1.6;color:#334155;'
    const html = `
<div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;padding:32px 28px;">
    <p style="${p}">Olá, ${name},</p>
    <p style="${p}">Entramos em contato para te passar uma informação importante sobre sua compra conosco.</p>
    <p style="${p}">Nossa conta no Mercado Pago, a plataforma que processa nossos pagamentos, foi bloqueada e, por conta disso, não conseguimos processar e entregar o seu pedido.</p>
    <p style="${p}">A boa notícia é que o seu dinheiro será devolvido na íntegra. Mas para agilizar esse processo, precisamos que você entre em contato com o seu banco ou operadora do cartão e solicite o estorno da compra.</p>
    <p style="margin:24px 0 12px;font-size:15px;font-weight:700;color:#0f172a;">Como solicitar o reembolso:</p>
    <p style="${p}">Ligue para a central do seu banco ou operadora (o número fica no verso do seu cartão) e informe:</p>
    <ul style="margin:0 0 16px;padding-left:20px;font-size:15px;line-height:1.7;color:#334155;">
        <li>Que deseja solicitar o estorno de uma compra não recebida</li>
        <li>O nome que aparece na sua fatura: <strong>${desc}</strong></li>
        <li>A data aproximada da compra e o valor cobrado</li>
    </ul>
    <p style="${p}">O valor será devolvido em 1 a 2 faturas, conforme a política do seu banco.</p>
    <p style="${p}">Pedimos desculpas pelo transtorno. Você não terá nenhum prejuízo: o valor pago será totalmente devolvido.</p>
    <p style="${p}">Qualquer dúvida, estamos à disposição.</p>
    <p style="margin:24px 0 0;font-size:15px;line-height:1.6;color:#334155;">Com carinho,<br/>Equipe Elabela</p>
</div>`

    return { subject: REFUND_SUBJECT, html }
}
