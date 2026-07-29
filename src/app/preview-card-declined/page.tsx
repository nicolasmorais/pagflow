'use client';
import '../checkout/checkout.css';

export default function PreviewCardDeclined() {
    const dados = { nome: 'Nicolas Morais Braga', email: 'nicolasmorais154@gmail.com' };
    const price = 9.90;

    return (
        <div className="checkout-page-wrapper" style={{ background: '#F5F3EE', minHeight: '100vh' }}>
            <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Merriweather:wght@400;700&display=swap" rel="stylesheet" />

            <div style={{ maxWidth: '480px', margin: '0 auto' }}>
                <div className="pix-page-wrapper">
                    <div className="pix-header-strip">
                        <div className="ssl-badge">
                            <svg className="lock-icon" viewBox="0 0 24 24">
                                <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
                            </svg>
                            Pagamento 100% seguro
                        </div>
                        <div className="bc-badge">Banco Central do Brasil</div>
                    </div>

                    <div className="card-confirm-page">
                        {/* HERO — RECUSADO */}
                        <div className="cc-hero">
                            <div className="cc-red-circle">
                                <svg viewBox="0 0 88 88" fill="none">
                                    <circle cx="44" cy="44" r="40" fill="rgba(184,48,48,0.08)" stroke="rgba(184,48,48,0.2)" strokeWidth="1.5" />
                                    <circle cx="44" cy="44" r="30" fill="rgba(184,48,48,0.1)" />
                                    <circle cx="44" cy="44" r="22" fill="#fff" />
                                    <path d="M34 34l20 20M54 34l-20 20" stroke="#B83030" strokeWidth="3" strokeLinecap="round" />
                                </svg>
                            </div>
                            <h1 className="cc-hero-title" style={{ color: '#B83030' }}>
                                Pagamento Recusado
                            </h1>
                            <p className="cc-hero-sub">
                                A operadora não aprovou esta transação.<br />
                                Isso pode acontecer por diversos motivos.
                            </p>
                        </div>

                        {/* RECIBO */}
                        <div className="cc-receipt">
                            <div className="cc-receipt-header">
                                <div className="cc-tag cc-tag-red">Recusado</div>
                                <div className="cc-order-id">Pedido <span>#38472</span></div>
                            </div>
                            <div className="cc-receipt-rows">
                                <div className="cc-receipt-row">
                                    <div className="cc-label">Data</div>
                                    <div className="cc-value">{new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                                </div>
                                <div className="cc-receipt-row">
                                    <div className="cc-label">Método</div>
                                    <div className="cc-value">Cartão de crédito</div>
                                </div>
                                <div className="cc-receipt-row">
                                    <div className="cc-label">Status</div>
                                    <div className="cc-value cc-red">✕ Recusado</div>
                                </div>
                                <div className="cc-receipt-row">
                                    <div className="cc-label">Valor</div>
                                    <div className="cc-value" style={{ color: '#b8933a' }}>R$ {price.toFixed(2).replace('.', ',')}</div>
                                </div>
                            </div>
                            <div className="cc-total-row">
                                <div className="cc-label">Total</div>
                                <div className="cc-total-value">R$ {price.toFixed(2).replace('.', ',')}</div>
                            </div>
                        </div>

                        {/* POSSÍVEIS MOTIVOS */}
                        <div className="cc-steps-card">
                            <div className="cc-steps-title">Possíveis motivos</div>
                            <div className="cc-step-item">
                                <div className="cc-step-dot" style={{ background: '#FDECEA' }}>
                                    <svg viewBox="0 0 24 24" fill="none"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="#B83030" /></svg>
                                </div>
                                <div>
                                    <div className="cc-step-text-title">Limite insuficiente</div>
                                    <div className="cc-step-text-desc">Seu cartão pode não ter saldo disponível para esta compra.</div>
                                </div>
                            </div>
                            <div className="cc-step-item">
                                <div className="cc-step-dot" style={{ background: '#FDECEA' }}>
                                    <svg viewBox="0 0 24 24" fill="none"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="#B83030" /></svg>
                                </div>
                                <div>
                                    <div className="cc-step-text-title">Dados incorretos</div>
                                    <div className="cc-step-text-desc">Número, validade ou CVV podem ter sido digitados errado.</div>
                                </div>
                            </div>
                            <div className="cc-step-item">
                                <div className="cc-step-dot" style={{ background: '#FDECEA' }}>
                                    <svg viewBox="0 0 24 24" fill="none"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="#B83030" /></svg>
                                </div>
                                <div>
                                    <div className="cc-step-text-title">Bloqueio do banco</div>
                                    <div className="cc-step-text-desc">Seu banco pode ter bloqueado a compra por segurança. Tente autorizar ou use outro cartão.</div>
                                </div>
                            </div>
                        </div>

                        {/* BOTÕES DE AÇÃO */}
                        <button className="cc-retry-btn">
                            <svg viewBox="0 0 24 24" fill="none"><path d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" fill="currentColor" /></svg>
                            Tentar novamente
                        </button>

                        <button className="cc-pix-btn">
                            <svg viewBox="0 0 24 24" fill="none"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="#1D9A52" /></svg>
                            Pagar com PIX (desconto)
                        </button>

                        {/* SOCIAL PROOF */}
                        <div className="social-proof" style={{ margin: '0 16px 16px' }}>
                            <div className="avatar-group">
                                <div className="avatar">MJ</div>
                                <div className="avatar">RS</div>
                                <div className="avatar">CA</div>
                            </div>
                            <div className="social-text">
                                <strong>312 clientes</strong> compraram este mês. Nota média de satisfação: ⭐ 4,9
                            </div>
                        </div>

                        {/* TRUST */}
                        <div className="cc-trust-row">
                            <div className="cc-trust-item">
                                <svg viewBox="0 0 24 24" fill="#0d6e4a" width="14" height="14"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" /></svg>
                                Compra protegida
                            </div>
                            <div className="cc-trust-item">
                                <svg viewBox="0 0 24 24" fill="#0d6e4a" width="14" height="14"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" /></svg>
                                Dados criptografados
                            </div>
                            <div className="cc-trust-item">
                                <svg viewBox="0 0 24 24" fill="#0d6e4a" width="14" height="14"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg>
                                PCI DSS
                            </div>
                        </div>

                        <div className="cc-help">
                            Dúvidas? <a href="mailto:suporte@elabela.store">Entre em contato por e-mail</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
