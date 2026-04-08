'use client'

import { useState, useEffect } from 'react'
import './checkout.css'

export default function CheckoutForm({ product, customization, shippingRules = [], availableBumps = [] }: any) {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [timeLeft, setTimeLeft] = useState(14 * 60 + 52);
    const [done, setDone] = useState(false);

    const [dados, setDados] = useState({ nome: '', email: '', telefone: '', cpf: '' });
    const [endereco, setEndereco] = useState({ cep: '', rua: '', numero: '', complemento: '', bairro: '', cidade: '', estado: 'SP', destinatario: '' });
    const [shipping, setShipping] = useState(shippingRules[0] || { label: 'Entrega Econômica', price: 0, delivery_time: '7 dias úteis' });
    const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card' | ''>('');
    const [pixData, setPixData] = useState<{ qrCode: string, qrCodeBase64: string } | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [copied, setCopied] = useState(false);
    const [cardData, setCardData] = useState({ number: '', name: '', exp: '', cvv: '', installments: 1 });

    useEffect(() => {
        // Injetar MP SDK V2 manualmente
        if (!document.getElementById('mp-v2')) {
            const script = document.createElement('script');
            script.id = 'mp-v2';
            script.src = 'https://sdk.mercadopago.com/js/v2?locale=pt-BR';
            document.body.appendChild(script);
        }
        if (!document.getElementById('mp-security')) {
            const s = document.createElement('script');
            s.id = 'mp-security';
            s.src = 'https://www.mercadopago.com/v2/security.js';
            s.setAttribute('view', 'checkout');
            document.body.appendChild(s);
        }

        // Tentar resolver CORS em localhost via Referrer Policy
        if (!document.getElementById('referrer-meta')) {
            const meta = document.createElement('meta');
            meta.id = 'referrer-meta';
            meta.name = 'referrer';
            meta.content = 'no-referrer-when-downgrade';
            document.head.appendChild(meta);
        }

        const timer = setInterval(() => setTimeLeft(prev => prev > 0 ? prev - 1 : 0), 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const pixDiscountVal = Number(customization?.pixDiscount || 0) / 100; // dynamic discount
    const basePrice = product?.price || 9;
    const finalPrice = (step === 3 && paymentMethod === 'pix') ? (basePrice * (1 - pixDiscountVal) + shipping.price) : (basePrice + shipping.price);

    const handleCEPChange = async (val: string) => {
        const cleanCEP = val.replace(/\D/g, '').slice(0, 8);
        let formatted = cleanCEP;
        if (cleanCEP.length > 5) formatted = cleanCEP.slice(0, 5) + '-' + cleanCEP.slice(5);
        setEndereco(p => ({ ...p, cep: formatted }));

        if (cleanCEP.length === 8) {
            try {
                const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);
                const data = await response.json();
                if (!data.erro) {
                    setEndereco(prev => ({
                        ...prev,
                        cep: formatted,
                        rua: data.logradouro,
                        bairro: data.bairro,
                        cidade: data.localidade,
                        estado: data.uf
                    }));
                }
            } catch (e) { }
        }
    };

    const buscarCep = async () => {
        const c = endereco.cep.replace(/\D/g, '');
        if (c.length !== 8) { alert('Por favor, digite um CEP válido com 8 números.'); return; }
        try {
            const response = await fetch(`https://viacep.com.br/ws/${c}/json/`);
            const data = await response.json();
            if (!data.erro) {
                setEndereco(prev => ({ ...prev, rua: data.logradouro, bairro: data.bairro, cidade: data.localidade, estado: data.uf }));
            }
        } catch (e) { }
    };

    const handleMaskEnd = (k: string, raw: string, formatter: (s: string) => string) => {
        setEndereco(p => ({ ...p, [k]: formatter(raw) }));
        if (errors[k]) setErrors(prev => { const n = { ...prev }; delete n[k]; return n; });
    }
    const handleMaskDados = (k: string, raw: string, formatter: (s: string) => string) => {
        setDados(p => ({ ...p, [k]: formatter(raw) }));
        if (errors[k]) setErrors(prev => { const n = { ...prev }; delete n[k]; return n; });
    }

    const formatCPF = (v: string) => {
        let clean = v.replace(/\D/g, '');
        return clean.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    };

    const formatTel = (v: string) => {
        let clean = v.replace(/\D/g, '').slice(0, 11);
        if (clean.length <= 10) {
            return clean.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2');
        } else {
            return clean.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2');
        }
    };

    const validateStep1 = () => {
        let newErrors: Record<string, string> = {};
        if (!dados.nome) newErrors.nome = 'Informe seu nome completo';

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!dados.email || !emailRegex.test(dados.email)) newErrors.email = 'E-mail inválido';

        const cleanTel = dados.telefone.replace(/\D/g, '');
        if (cleanTel.length < 10) newErrors.telefone = 'WhatsApp inválido';

        if (!customization?.disableCpf) {
            const cleanCpf = dados.cpf.replace(/\D/g, '');
            if (cleanCpf.length !== 11) newErrors.cpf = 'CPF inválido';
        }

        setErrors(newErrors);
        if (Object.keys(newErrors).length === 0) {
            setEndereco(prev => ({ ...prev, destinatario: prev.destinatario || dados.nome }));
            setStep(2);
            window.scrollTo(0, 0);
            return true;
        }
        return false;
    };

    const validateStep2 = () => {
        let newErrors: Record<string, string> = {};
        if (!endereco.destinatario) newErrors.destinatario = 'Informe o destinatário';
        if (endereco.cep.replace(/\D/g, '').length !== 8) newErrors.cep = 'CEP inválido';
        if (!endereco.rua) newErrors.rua = 'Informe a rua';
        if (!endereco.numero) newErrors.numero = 'Informe o número';
        if (!endereco.bairro) newErrors.bairro = 'Informe o bairro';
        if (!endereco.cidade) newErrors.cidade = 'Informe a cidade';
        if (!endereco.estado) newErrors.estado = 'Selecione o estado';

        setErrors(newErrors);
        if (Object.keys(newErrors).length === 0) {
            setStep(3);
            window.scrollTo(0, 0);
            return true;
        }
        return false;
    };

    async function finalizar(brickData?: any) {
        setLoading(true);
        try {
            // Capturar o Device ID gerado pelo security.js
            const deviceId = (window as any).MP_DEVICE_SESSION_ID || (window as any).mercadopago?.deviceFingerprint;
            const idempotencyKey = crypto.randomUUID();

            const currentMethod = paymentMethod === 'card' ? 'credit_card' : paymentMethod;
            let tokenData: any = null;

            // Se brickData existir, ele já vem tokenizado pelo Mercado Pago Brick
            if (brickData) {
                tokenData = {
                    token: brickData.token,
                    installments: brickData.installments,
                    payment_method_id: brickData.payment_method_id,
                    issuer_id: brickData.issuer_id
                };
            }
            else if (paymentMethod === 'card') {
                // ... fallback logic if needed
            }

            const payload = {
                method: currentMethod,
                cardData: tokenData,
                brickData: brickData, // Envia para o backend processar via BrickData
                orderId: localStorage.getItem('last_order_id'),
                orderData: {
                    ...dados,
                    ...endereco,
                    price: finalPrice,
                    productId: product?.id || 'default'
                },
                deviceId: deviceId
            };

            const response = await fetch('/api/process-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const textResponse = await response.text();
            try {
                const result = JSON.parse(textResponse);
                if (result.success) {
                    if (result.paymentStatus === 'recusado') {
                        alert("Pagamento recusado pela operadora.");
                        return;
                    }
                    if (result.qrCodeBase64) {
                        setPixData({ qrCode: result.qrCode, qrCodeBase64: result.qrCodeBase64 });
                        setTimeLeft(10 * 60);
                    }
                    setDone(true);
                } else {
                    alert("Erro: " + (result.error || "Tente novamente"));
                }
            } catch (err) {
                console.error("Backend Error Response:", textResponse);
                alert("Erro no servidor ao processar pagamento.");
            }
        } catch (e) {
            console.error("ERRO DE PROCESSAMENTO:", e);
            alert("Erro de conexão. Verifique sua rede.");
        } finally { setLoading(false); }
    }

    // Efeito para inicializar o Brick
    useEffect(() => {
        if (paymentMethod === 'card' && step === 3 && typeof window !== 'undefined' && (window as any).MercadoPago) {
            const initBrick = async () => {
                const mp = new (window as any).MercadoPago(process.env.NEXT_PUBLIC_MP_PUBLIC_KEY || 'TEST-91331b4d-be71-43a4-b12a-d38e686b8ab2');
                const bricksBuilder = mp.bricks();

                const container = document.getElementById('paymentBrick_container');
                if (container) container.innerHTML = '';

                try {
                    await bricksBuilder.create('cardPayment', 'paymentBrick_container', {
                        initialization: {
                            amount: finalPrice,
                            payer: {
                                email: dados.email,
                            },
                        },
                        locale: 'pt-BR',
                        customization: {
                            visual: {
                                style: {
                                    theme: 'default',
                                }
                            }
                        },
                        callbacks: {
                            onReady: () => {
                                console.log("Card Brick Ready");
                            },
                            onSubmit: ({ formData }) => {
                                return new Promise((resolve, reject) => {
                                    finalizar(formData)
                                        .then(resolve)
                                        .catch(reject);
                                });
                            },
                            onError: (error) => {
                                console.error("Brick Error:", error);
                            },
                        },
                    });
                } catch (e) {
                    console.error("Error creating brick:", e);
                }
            };
            initBrick();
        }
    }, [paymentMethod, step]);

    const renderProgressBar = () => (
        <div className="progress-wrap" style={{ borderBottom: 'none', padding: '0 0 24px 0', background: 'transparent' }}>
            <div className="progress-inner">
                <div className="progress-steps">
                    <div className="prog-step">
                        <div className={`prog-circle ${step > 1 ? 'done' : step === 1 ? 'active' : 'next'}`}>{step > 1 ? '✓' : '1'}</div>
                        <div className={`prog-label ${step > 1 ? 'done' : step === 1 ? 'active' : ''}`}>Seus Dados</div>
                    </div>
                    <div className={`prog-line ${step > 1 ? 'done' : ''}`}></div>
                    <div className="prog-step">
                        <div className={`prog-circle ${step > 2 ? 'done' : step === 2 ? 'active' : 'next'}`}>{step > 2 ? '✓' : '2'}</div>
                        <div className={`prog-label ${step > 2 ? 'done' : step === 2 ? 'active' : ''}`}>Entrega</div>
                    </div>
                    <div className={`prog-line ${step > 2 ? 'done' : ''}`}></div>
                    <div className="prog-step">
                        <div className={`prog-circle ${step === 3 ? 'active' : 'next'}`}>3</div>
                        <div className={`prog-label ${step === 3 ? 'active' : ''}`}>Pagamento</div>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className={`checkout-page-wrapper ${done ? 'is-done' : ''}`}>
            <style dangerouslySetInnerHTML={{
                __html: `
                :root {
                    --bg: ${customization?.bgColor || '#F5F3EE'};
                    --green: ${customization?.primaryColor || '#1A8C4E'};
                    --green-btn: ${customization?.buttonColor || '#22A85F'};
                    --green-btn-hover: ${customization?.primaryColor || '#1A8C4E'};
                    --red: #B83030;
                    --red-light: #FDECEA;
                }
                .field.error input, .field.error select { border-color: var(--red) !important; background: var(--red-light); }
                .error-msg { color: var(--red); font-size: 12px; font-weight: 700; margin-top: 4px; display: flex; align-items: center; gap: 4px; }
            `}} />
            <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Merriweather:wght@400;700&family=Source+Sans+3:wght@400;600;700&display=swap" rel="stylesheet" />

            {loading && <div className="loading-overlay"><div className="loading-spinner"></div><p style={{ marginTop: '20px', fontWeight: 800 }}>Processando...</p></div>}

            <div className="header">
                <div className="header-side"></div>
                <div className="logo">
                    {customization?.logo ? <img src={customization.logo} alt="Logo" style={{ maxHeight: '42px' }} /> : (customization?.storeName || 'ELABELA')}
                </div>
                <div className="header-side">
                    <div className="secure-badge-subtle">
                        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" /></svg>
                        <span>PAGAMENTO<br />100% SEGURO</span>
                    </div>
                </div>
            </div>

            {done ? (
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

                    <div className="success-hero">
                        <div className="check-circle-wrapper">
                            <svg viewBox="0 0 24 24" fill="none">
                                <circle cx="12" cy="12" r="12" fill="#1a6b3a" />
                                <path d="M6 12.5l4 4 8-8" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
                            </svg>
                        </div>
                        <h1>Pedido Reservado!<br />Falta só o pagamento</h1>
                        <p className="subtitle">Seu pedido está <strong>guardado por {formatTime(timeLeft)}.</strong><br />Finalize agora para garantir o envio hoje.</p>
                    </div>

                    <div className="urgency-bar">
                        <div className="urgency-icon">⏰</div>
                        <div className="urgency-text">
                            <div className="title">Tempo restante para pagar:</div>
                            <div className="desc">Após isso, o pedido é liberado para outro cliente</div>
                        </div>
                        <div className="timer-display" style={{ color: timeLeft <= 120 ? '#c0392b' : 'inherit' }}>{formatTime(timeLeft)}</div>
                    </div>

                    {paymentMethod === 'pix' && pixData ? (
                        <div className="pix-main-card">
                            <div className="card-title">Pague com Pix — rápido e fácil</div>
                            <div className="card-sub">Abra o app do seu banco e escaneie o QR Code abaixo</div>
                            <div className="qr-wrapper">
                                <div className="qr-frame">
                                    <img src={`data:image/jpeg;base64,${pixData.qrCodeBase64}`} alt="QR Code Pix" />
                                </div>
                                <div className="or-divider"><span>ou copie o código</span></div>
                                <div className="pix-code-box">{pixData.qrCode}</div>
                                <button
                                    className={`copy-btn ${copied ? 'copied' : ''}`}
                                    onClick={() => {
                                        navigator.clipboard.writeText(pixData.qrCode);
                                        setCopied(true);
                                        setTimeout(() => setCopied(false), 3000);
                                    }}
                                >
                                    <svg className="copy-icon" viewBox="0 0 24 24">
                                        <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
                                    </svg>
                                    {copied ? 'Código Copiado!' : 'Copiar Código Pix'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="card-success-container" style={{ margin: '12px 16px', padding: '40px', textAlign: 'center', background: '#fff', borderRadius: '14px' }}>
                            <div className="success-icon-big" style={{ fontSize: '64px', marginBottom: '20px' }}>🎉</div>
                            <h1 className="success-header" style={{ fontSize: '24px', fontWeight: 800, marginBottom: '16px' }}>Seu pedido foi confirmado!</h1>
                            <p className="success-message" style={{ color: '#666', marginBottom: '24px' }}>Parabéns! Sua compra foi processada e já estamos preparando tudo com carinho para o envio.</p>
                            <button className="main-cta success-cta" onClick={() => window.location.href = '/'}>PÁGINA INICIAL ✓</button>
                        </div>
                    )}

                    <div className="social-proof">
                        <div className="avatar-group">
                            <div className="avatar">MJ</div>
                            <div className="avatar">RS</div>
                            <div className="avatar">CA</div>
                        </div>
                        <div className="social-text">
                            <strong>47 pessoas compraram</strong> hoje. Maria de Santos pagou há 3 minutos e já recebeu a confirmação por e-mail.
                        </div>
                    </div>

                    <div className="pix-main-card" style={{ marginTop: '12px' }}>
                        <div className="card-title" style={{ marginBottom: '14px' }}>O que acontece depois?</div>

                        <div className="step-row">
                            <div className="step-num">1</div>
                            <div>
                                <div className="step-title">Confirmação por e-mail em minutos</div>
                                <div className="step-desc">Após o pagamento, você recebe a confirmação do pedido em <strong>{dados.email}</strong>.</div>
                            </div>
                        </div>

                        <div className="step-row">
                            <div className="step-num">2</div>
                            <div>
                                <div className="step-title">Separação e envio do pedido</div>
                                <div className="step-desc">Pagamentos feitos até as 14h saem no mesmo dia. Após isso, no próximo dia útil.</div>
                            </div>
                        </div>

                        <div className="step-row">
                            <div className="step-num">3</div>
                            <div>
                                <div className="step-title">Código de rastreio por e-mail</div>
                                <div className="step-desc">Assim que o pedido sair, você recebe o link de rastreio direto no seu e-mail.</div>
                            </div>
                        </div>
                    </div>

                    <div className="trust-strip-footer">
                        <div className="trust-item"><div className="trust-dot"></div>Pix oficial do Banco Central</div>
                        <div className="trust-item"><div className="trust-dot"></div>Dados criptografados</div>
                        <div className="trust-item"><div className="trust-dot"></div>Compra garantida</div>
                    </div>

                    <div className="help-row">
                        <p>Precisa de ajuda? <a href={`mailto:${customization?.supportEmail || 'suporte@loja.com'}`}>Entre em contato por e-mail</a></p>
                    </div>
                </div>
            ) : (
                <>
                    {customization?.alertText && (
                        <div className="header-strip" style={{ backgroundColor: customization.alertBg }}>
                            {customization.alertText}
                        </div>
                    )}

                    <div className="layout">
                        <div className="form-col">

                            <div className={`screen ${step === 1 ? 'active' : ''}`}>
                                <div className="card">
                                    {renderProgressBar()}
                                    <div className="step-title"><span className="step-icon">👤</span> Passo 1 — Seus Dados</div>
                                    <div className="step-sub">Precisamos de algumas informações básicas para continuar.</div>

                                    <div className={`field ${errors.nome ? 'error' : ''}`}>
                                        <label className="field-label">Seu Nome Completo *</label>
                                        <input type="text" placeholder="Ex: Maria Aparecida Santos" value={dados.nome} onChange={e => { setDados({ ...dados, nome: e.target.value }); if (errors.nome) setErrors(prev => { const n = { ...prev }; delete n.nome; return n; }); }} />
                                        {errors.nome && <div className="error-msg">⚠️ {errors.nome}</div>}
                                    </div>
                                    <div className={`field ${errors.email ? 'error' : ''}`}>
                                        <label className="field-label">Seu E-mail *</label>
                                        <input type="email" placeholder="Ex: maria@email.com" value={dados.email} onChange={e => { setDados({ ...dados, email: e.target.value }); if (errors.email) setErrors(prev => { const n = { ...prev }; delete n.email; return n; }); }} />
                                        {errors.email && <div className="error-msg">⚠️ {errors.email}</div>}
                                        <div className="field-hint-label">Vamos enviar a confirmação do pedido para este e-mail</div>
                                    </div>
                                    <div className={`field ${errors.telefone ? 'error' : ''}`}>
                                        <label className="field-label">Seu WhatsApp *</label>
                                        <input type="text" placeholder="(11) 91234-5678" maxLength={15} value={dados.telefone} onChange={e => handleMaskDados('telefone', e.target.value, formatTel)} />
                                        {errors.telefone && <div className="error-msg">⚠️ {errors.telefone}</div>}
                                        <div className="field-hint-label">Para avisar quando o produto sair para entrega</div>
                                    </div>
                                    {!customization?.disableCpf && (
                                        <div className={`field ${errors.cpf ? 'error' : ''}`}>
                                            <label className="field-label">CPF *</label>
                                            <input type="text" placeholder="000.000.000-00" maxLength={14} value={dados.cpf} onChange={e => handleMaskDados('cpf', e.target.value, formatCPF)} />
                                            {errors.cpf && <div className="error-msg">⚠️ {errors.cpf}</div>}
                                            <div className="field-hint-label">Necessário para emissão da nota fiscal</div>
                                        </div>
                                    )}

                                    <button className="main-cta" onClick={validateStep1}>
                                        Continuar para a Entrega →
                                    </button>

                                </div>
                            </div>

                            <div className={`screen ${step === 2 ? 'active' : ''}`}>
                                <div className="card">
                                    {renderProgressBar()}
                                    <button className="back-link" onClick={() => setStep(1)}>← Voltar</button>
                                    <div className="step-title"><span className="step-icon">📦</span> Passo 2 — Endereço de Entrega</div>
                                    <div className="step-sub">Para onde vamos enviar o seu produto?</div>

                                    <div className={`field ${errors.destinatario ? 'error' : ''}`}>
                                        <label className="field-label">Destinatário *</label>
                                        <input type="text" placeholder="Nome de quem vai receber" value={endereco.destinatario} onChange={e => handleMaskEnd('destinatario', e.target.value, v => v)} />
                                        {errors.destinatario && <div className="error-msg">⚠️ {errors.destinatario}</div>}
                                    </div>

                                    <div className={`field ${errors.cep ? 'error' : ''}`}>
                                        <label className="field-label">CEP *</label>
                                        <div className="cep-row">
                                            <input type="text" placeholder="00000-000" maxLength={9} value={endereco.cep} onChange={e => handleCEPChange(e.target.value)} style={{ width: '100%' }} />
                                        </div>
                                        {errors.cep && <div className="error-msg">⚠️ {errors.cep}</div>}
                                        <div className="field-hint-label">Digite seu CEP e o endereço será preenchido automaticamente</div>
                                    </div>

                                    <div className={`field ${errors.rua ? 'error' : ''}`}>
                                        <label className="field-label">Rua ou Avenida *</label>
                                        <input type="text" placeholder="Ex: Rua das Flores" value={endereco.rua} onChange={e => handleMaskEnd('rua', e.target.value, v => v)} />
                                        {errors.rua && <div className="error-msg">⚠️ {errors.rua}</div>}
                                    </div>

                                    <div className="two-col">
                                        <div className={`field ${errors.numero ? 'error' : ''}`}>
                                            <label className="field-label">Número *</label>
                                            <input type="text" placeholder="Ex: 123" value={endereco.numero} onChange={e => handleMaskEnd('numero', e.target.value, v => v)} />
                                            {errors.numero && <div className="error-msg">⚠️ {errors.numero}</div>}
                                        </div>
                                        <div className="field">
                                            <label className="field-label">Complemento</label>
                                            <input type="text" placeholder="Apto, Bloco... (opcional)" value={endereco.complemento} onChange={e => handleMaskEnd('complemento', e.target.value, v => v)} />
                                        </div>
                                    </div>

                                    <div className="two-col">
                                        <div className={`field ${errors.bairro ? 'error' : ''}`}>
                                            <label className="field-label">Bairro *</label>
                                            <input type="text" placeholder="Nome do bairro" value={endereco.bairro} onChange={e => handleMaskEnd('bairro', e.target.value, v => v)} />
                                            {errors.bairro && <div className="error-msg">⚠️ {errors.bairro}</div>}
                                        </div>
                                        <div className={`field ${errors.cidade ? 'error' : ''}`}>
                                            <label className="field-label">Cidade *</label>
                                            <input type="text" placeholder="Ex: São Paulo" value={endereco.cidade} onChange={e => handleMaskEnd('cidade', e.target.value, v => v)} />
                                            {errors.cidade && <div className="error-msg">⚠️ {errors.cidade}</div>}
                                        </div>
                                    </div>

                                    <div className={`field ${errors.estado ? 'error' : ''}`}>
                                        <label className="field-label">Estado *</label>
                                        <select value={endereco.estado} onChange={e => handleMaskEnd('estado', e.target.value, v => v)}>
                                            <option value="">Selecione o seu estado</option>
                                            {['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'].map(uf => (
                                                <option key={uf} value={uf}>{uf}</option>
                                            ))}
                                        </select>
                                        {errors.estado && <div className="error-msg">⚠️ {errors.estado}</div>}
                                    </div>

                                    <div className="frete-title">🚚 Escolha a forma de entrega:</div>
                                    {[
                                        { label: 'Entrega Econômica', name: 'Entrega Econômica', price: 0, delivery_time: 'Chega em até 7 dias úteis' },
                                        { label: 'Entrega Rápida Prioritária', name: 'Entrega Rápida Prioritária ⚡', price: 9.90, delivery_time: 'Chega em até 5 dias úteis' }
                                    ].map(opt => (
                                        <div key={opt.price} className={`frete-opt ${shipping.price === opt.price ? 'selected' : ''}`} onClick={() => setShipping(opt)}>
                                            <div className="frete-radio"></div>
                                            <div className="frete-info">
                                                <div className="frete-name">{opt.name} {opt.price === 0 && <span className="frete-tag">GRÁTIS</span>}</div>
                                                <div className="frete-days">📅 {opt.delivery_time}</div>
                                            </div>
                                            <div className={`frete-price ${opt.price === 0 ? 'free' : ''}`}>{opt.price === 0 ? 'GRÁTIS' : `R$ ${opt.price.toFixed(2).replace('.', ',')}`}</div>
                                        </div>
                                    ))}

                                    <button className="main-cta" style={{ marginTop: '10px' }} onClick={validateStep2}>
                                        Ir para Pagamento →
                                    </button>

                                </div>
                            </div>

                            <div className={`screen ${step === 3 ? 'active' : ''}`}>
                                <div className="card">
                                    {renderProgressBar()}
                                    <button className="back-link" onClick={() => setStep(2)}>← Voltar</button>
                                    <div className="step-title"><span className="step-icon">💳</span> Passo 3 — Pagamento</div>
                                    <div className="step-sub">Escolha como prefere pagar. É simples e seguro!</div>

                                    <div className={`pay-card ${paymentMethod === 'pix' ? 'selected' : ''}`} onClick={() => setPaymentMethod('pix')}>
                                        <div className="pay-radio"></div>
                                        <div className="pay-icon-wrap">
                                            <img src="https://pub-da9fd1c19b8e45d691d67626b9a7ba6d.r2.dev/1775608116043-2889edc1-1a70-456a-a32c-e3f050102347.png" alt="Pix" style={{ width: '32px', height: 'auto' }} />
                                        </div>
                                        <div className="pay-info">
                                            <div className="pay-name">PIX</div>
                                            <div className="pay-desc">Pague pelo aplicativo do banco — aprovação na hora</div>
                                        </div>
                                        {pixDiscountVal > 0 && <div className="pay-tag green">{customization?.pixDiscount}% OFF</div>}
                                    </div>
                                    {paymentMethod === 'pix' && (
                                        <div className="pix-box" style={{ marginTop: '12px', background: 'transparent', border: 'none', padding: '0' }}>
                                            <div className="pix-box-body" style={{ color: '#444', fontSize: '13.5px', textAlign: 'left', padding: '0 8px', marginBottom: '12px', fontWeight: '500' }}>
                                                A confirmação de pagamento é realizada em poucos minutos. Utilize o aplicativo do seu banco para pagar.
                                            </div>
                                            <div className="pix-expire-box">
                                                <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: '22px', flexShrink: 0 }}><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z" /></svg>
                                                <span>O código PIX expira em 10 minutos. Pague dentro do prazo para garantir sua compra.</span>
                                            </div>
                                            <button className="main-cta" onClick={() => finalizar()} disabled={loading} style={{ marginTop: '16px', background: 'var(--green-btn)', width: '100%', height: '54px' }}>
                                                {loading ? 'Processando...' : 'GERAR PIX'}
                                            </button>
                                        </div>
                                    )}

                                    <div className={`pay-card ${paymentMethod === 'card' ? 'selected' : ''}`} onClick={() => setPaymentMethod('card')} style={{ marginTop: '12px' }}>
                                        <div className="pay-radio"></div>
                                        <div className="pay-icon-wrap">💳</div>
                                        <div className="pay-info">
                                            <div className="pay-name">Cartão de Crédito</div>
                                            <div className="pay-desc">Parcele em até 10x sem juros</div>
                                        </div>
                                        <div className="pay-tag gray">Até 10x</div>
                                    </div>

                                    {paymentMethod === 'card' && (
                                        <div id="paymentBrick_container" style={{ marginTop: '16px' }}></div>
                                    )}






                                </div>
                            </div>

                        </div>

                        <div className="aside">
                            <div className="product-card">
                                <div className="product-card-title">Resumo do Pedido</div>
                                <div className="product-row">
                                    <div className="product-img">
                                        {product?.imageUrl ? <img src={product.imageUrl} alt={product.name} /> : '🧴'}
                                    </div>
                                    <div>
                                        <div className="product-name">{product?.name || "Kit Gel DermaVit 3 Unidades"}</div>
                                        <div className="product-qty">Quantidade: 1</div>
                                    </div>
                                </div>
                                <div className="price-table">
                                    <div className="price-row"><span>Subtotal</span><span>R$ {basePrice.toFixed(2).replace('.', ',')}</span></div>
                                    <div className="price-row"><span>Frete</span><span className="green">{shipping.price === 0 ? 'GRÁTIS' : `R$ ${shipping.price.toFixed(2).replace('.', ',')}`}</span></div>
                                    {step === 3 && paymentMethod === 'pix' && pixDiscountVal > 0 && (
                                        <div className="price-row"><span>Desconto PIX ({customization?.pixDiscount}%)</span><span className="green">− R$ {(basePrice * pixDiscountVal).toFixed(2).replace('.', ',')}</span></div>
                                    )}
                                    <div className="price-row total"><span>Total</span><span>R$ {finalPrice.toFixed(2).replace('.', ',')}</span></div>
                                </div>
                            </div>

                            <div className="trust-card">
                                {[
                                    { icon: '✈️', title: 'Envio Rápido', p: 'Seu produto é enviado diretamente para o seu endereço, com rastreamento pelo WhatsApp.' },
                                    { icon: '🔄', title: 'Trocas e Devoluções', p: 'Se não gostar ou chegar com problema, trocamos ou devolvemos em até 7 dias. Sem complicação.' },
                                    { icon: '🔒', title: 'Compra Protegida', p: 'Seus dados pessoais e de pagamento estão completamente seguros conosco.' }
                                ].map((t, i) => (
                                    <div key={i} className="trust-item">
                                        <div className="trust-icon">{t.icon}</div>
                                        <div className="trust-text">
                                            <div className="stars">★★★★★</div>
                                            <h4>{t.title}</h4>
                                            <p>{t.p}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>


                        </div>
                    </div>
                </>
            )}

            {!customization?.disableWa && (
                <a className="wa-float" href="https://wa.me/5511999999999" target="_blank" rel="noreferrer">
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.47 14.38c-.3-.15-1.77-.87-2.04-.97s-.47-.15-.67.15-.77.97-.94 1.17-.35.22-.65.07a8.14 8.14 0 01-2.4-1.48 9 9 0 01-1.66-2.07c-.17-.3 0-.46.13-.61l.43-.5c.14-.16.18-.3.27-.5s.05-.37-.02-.52-.67-1.6-.91-2.2c-.24-.57-.49-.5-.67-.5s-.37-.01-.57-.01a1.1 1.1 0 00-.8.37 3.36 3.36 0 00-1.05 2.5 5.84 5.84 0 001.22 3.1 13.38 13.38 0 005.13 4.52c.72.31 1.28.5 1.72.64a4.14 4.14 0 001.9.12 3.08 3.08 0 002.02-1.43 2.5 2.5 0 00.17-1.43c-.07-.12-.27-.19-.57-.34zM12 2a10 10 0 00-8.7 14.93L2 22l5.25-1.38A10 10 0 1012 2z" /></svg>
                    Precisa de ajuda?
                </a>
            )}

            <footer className="checkout-footer">
                <div className="footer-payments">
                    <img loading="lazy" alt="pix" src="https://icons.yampi.me/svg/card-pix.svg" />
                    <img loading="lazy" alt="hiper" src="https://icons.yampi.me/svg/card-hiper.svg" />
                    <img loading="lazy" alt="amex" src="https://icons.yampi.me/svg/card-amex.svg" />
                    <img loading="lazy" alt="visa" src="https://icons.yampi.me/svg/card-visa.svg" />
                    <img loading="lazy" alt="diners" src="https://icons.yampi.me/svg/card-diners.svg" />
                    <img loading="lazy" alt="mastercard" src="https://icons.yampi.me/svg/card-mastercard.svg" />
                    <img loading="lazy" alt="discover" src="https://icons.yampi.me/svg/card-discover.svg" />
                    <img loading="lazy" alt="aura" src="https://icons.yampi.me/svg/card-aura.svg" />
                    <img loading="lazy" alt="elo" src="https://icons.yampi.me/svg/card-elo.svg" />
                </div>
                <div className="footer-info">
                    {customization?.footerText || "Todos os direitos reservados. CNPJ: 00.000.000/0001-00"}
                </div>
            </footer>
        </div>
    );
}
