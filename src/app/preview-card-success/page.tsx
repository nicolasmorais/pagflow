
'use client';
import '../checkout/checkout.css';

export default function PreviewCardSuccess() {
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
                        {/* HERO */}
                        <div className="cc-hero">
                            <div className="cc-confetti-ring">
                                <svg viewBox="0 0 88 88" fill="none">
                                    <circle cx="44" cy="44" r="40" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />
                                    <circle cx="44" cy="44" r="30" fill="rgba(255,255,255,0.15)" />
                                    <circle cx="44" cy="44" r="22" fill="#fff" />
                                    <path d="M32 44l8 8 16-16" stroke="#0d6e4a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <h1 className="cc-hero-title">Pagamento Aprovado!<br />Pedido confirmado.</h1>
                            <p className="cc-hero-sub">Seu cartão foi cobrado com sucesso.<br />Confira os detalhes abaixo.</p>
                        </div>

                        {/* RECIBO */}
                        <div className="cc-receipt">
                            <div className="cc-receipt-header">
                                <div className="cc-tag">Aprovado</div>
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
                                    <div className="cc-label">Parcelas</div>
                                    <div className="cc-value" style={{ color: '#b8933a' }}>3x sem juros</div>
                                </div>
                                <div className="cc-receipt-row">
                                    <div className="cc-label">Status</div>
                                    <div className="cc-value cc-green">✓ Aprovado</div>
                                </div>
                                <div className="cc-receipt-row">
                                    <div className="cc-label">Confirmação enviada para</div>
                                    <div className="cc-value" style={{ fontSize: '13px' }}>{dados.email}</div>
                                </div>
                            </div>
                            <div className="cc-total-row">
                                <div className="cc-label">Total cobrado</div>
                                <div className="cc-total-value">R$ {price.toFixed(2).replace('.', ',')}</div>
                            </div>
                        </div>

                        {/* CARTÃO VISUAL */}
                        <div className="cc-card-visual-wrap">
                            <div className="cc-card-visual">
                                <div className="cc-card-chip"></div>
                                <div className="cc-card-number">•••• •••• •••• 4821</div>
                                <div className="cc-card-bottom">
                                    <div>
                                        <div className="cc-card-holder-label">Titular</div>
                                        <div className="cc-card-holder-name">{dados.nome.toUpperCase()}</div>
                                    </div>
                                    <div className="cc-card-flag">
                                        <div className="cc-card-flag-circles">
                                            <div className="cc-circle-red"></div>
                                            <div className="cc-circle-orange"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* PRÓXIMOS PASSOS */}
                        <div className="cc-steps-card">
                            <div className="cc-steps-title">O que acontece agora?</div>
                            <div className="cc-step-item">
                                <div className="cc-step-dot">
                                    <svg viewBox="0 0 24 24" fill="none"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" fill="#0d6e4a" /></svg>
                                </div>
                                <div>
                                    <div className="cc-step-text-title">Confirmação por e-mail</div>
                                    <div className="cc-step-text-desc">O comprovante do pedido foi enviado para <strong>{dados.email}</strong> agora.</div>
                                </div>
                            </div>
                            <div className="cc-step-item">
                                <div className="cc-step-dot">
                                    <svg viewBox="0 0 24 24" fill="none"><path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" fill="#0d6e4a" /></svg>
                                </div>
                                <div>
                                    <div className="cc-step-text-title">Separação e envio</div>
                                    <div className="cc-step-text-desc">Pedidos confirmados até as 14h saem no mesmo dia. Após isso, no próximo dia útil.</div>
                                </div>
                            </div>
                            <div className="cc-step-item">
                                <div className="cc-step-dot">
                                    <svg viewBox="0 0 24 24" fill="none"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#0d6e4a" /></svg>
                                </div>
                                <div>
                                    <div className="cc-step-text-title">Rastreio por e-mail</div>
                                    <div className="cc-step-text-desc">Assim que o pedido sair, você recebe o código de rastreio direto no e-mail.</div>
                                </div>
                            </div>
                        </div>

                        {/* SOCIAL PROOF */}
                        <div className="social-proof" style={{ margin: '14px 16px 0' }}>
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
