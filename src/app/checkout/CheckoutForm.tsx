'use client'

import { useState, useEffect } from 'react'
import './checkout.css'

export default function CheckoutForm({ product, customization, shippingRules = [], availableBumps = [], pixels = {} }: any) {
    const [step, setStep] = useState(1);
    const [isSummaryOpen, setIsSummaryOpen] = useState(true);
    const [loading, setLoading] = useState(false);
    const [timeLeft, setTimeLeft] = useState(14 * 60 + 52);
    const [done, setDone] = useState(false);
    const [isMpLoaded, setIsMpLoaded] = useState(false);
    const [step1Loading, setStep1Loading] = useState(false);
    const [cepResolved, setCepResolved] = useState(false);

    const [dados, setDados] = useState({ nome: '', email: '', telefone: '', cpf: '' });
    const [endereco, setEndereco] = useState({ cep: '', rua: '', numero: '', complemento: '', bairro: '', cidade: '', estado: 'SP', destinatario: '' });
    const defaultShipping = shippingRules && shippingRules.length > 0
        ? shippingRules[0]
        : { name: 'Entrega Econômica', price: 0, delivery_time: '7' };
    const [shipping, setShipping] = useState(defaultShipping);
    const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card' | ''>('');
    const [pixData, setPixData] = useState<{ qrCode: string, qrCodeBase64: string } | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [copied, setCopied] = useState(false);
    const [cardData, setCardData] = useState({ number: '', name: '', exp: '', cvv: '', installments: 1 });

    useEffect(() => {
        // TEST MODE: Force success screen for preview
        const params = new URLSearchParams(window.location.search);
        const testMode = params.get('test');
        if (testMode === 'pix') {
            setPaymentMethod('pix');
            setPixData({ 
                qrCode: '00020126580014br.gov.bcb.pix013688735ef-c3ea-420c-a616-6a4fc9d061a520400005303986', 
                qrCodeBase64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==' 
            });
            setDone(true);
        } else if (testMode === 'card') {
            setPaymentMethod('card');
            setDone(true);
        }
    }, []);

    const trackTaboolaEvent = (eventName: string, data: any = {}) => {
        if (!pixels?.taboolaId || typeof window === 'undefined') return;
        const _tfa = (window as any)._tfa || [];
        _tfa.push({ notify: 'event', name: eventName, id: pixels.taboolaId, ...data });
    };

    // ── Google Analytics / Google Ads gtag helper ──
    const trackGoogleEvent = (eventName: string, params: Record<string, any> = {}) => {
        if (typeof window === 'undefined') return;
        const gtag = (window as any).gtag;
        if (!gtag) return;
        gtag('event', eventName, params);
    };

    const pixDiscountVal = Number(customization?.pixDiscount || 0) / 100; // dynamic discount
    const basePrice = product?.price || 9;
    
    const effectivePrice = (step === 3 && paymentMethod === 'pix') ? (basePrice * (1 - pixDiscountVal) + shipping.price) : (basePrice + shipping.price);
    const finalPrice = effectivePrice;

    useEffect(() => {
        // Validar IDs de pixel (apenas alfanumérico e hífen)
        const isValidPixelId = (id: string) => /^[a-zA-Z0-9_-]+$/.test(id);

        // Taboola Base Script
        if (pixels?.taboolaId && isValidPixelId(pixels.taboolaId) && !document.getElementById('taboola-pixel')) {
            const _tfa = (window as any)._tfa || [];
            (window as any)._tfa = _tfa;
            const s = document.createElement('script');
            s.id = 'taboola-pixel';
            s.async = true;
            s.src = `https://cdn.taboola.com/libtr/${pixels.taboolaId}/tfa.js`;
            document.head.appendChild(s);
            trackTaboolaEvent('start_checkout');
        }

        // ── Google Analytics (GA4) + Google Ads gtag.js ──
        if (!document.getElementById('gtag-script')) {
            const gtagScript = document.createElement('script');
            gtagScript.id = 'gtag-script';
            gtagScript.async = true;
            gtagScript.src = `https://www.googletagmanager.com/gtag/js?id=G-FQKVQXLFES`;
            document.head.appendChild(gtagScript);

            (window as any).dataLayer = (window as any).dataLayer || [];
            (window as any).gtag = function () { (window as any).dataLayer.push(arguments); };
            (window as any).gtag('js', new Date());
            (window as any).gtag('config', 'G-FQKVQXLFES');

            // Fire begin_checkout event
            trackGoogleEvent('begin_checkout', {
                currency: 'BRL',
                value: product?.price || 0,
                items: [{
                    item_id: product?.id || 'default',
                    item_name: product?.name || 'Produto',
                    price: product?.price || 0,
                    quantity: 1
                }]
            });
        }

        // ── Microsoft Clarity ──
        if (!document.getElementById('clarity-script')) {
            const clarityScript = document.createElement('script');
            clarityScript.id = 'clarity-script';
            clarityScript.type = 'text/javascript';
            clarityScript.innerHTML = `
                (function(c,l,a,r,i,t,y){
                    c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                    t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                    y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
                })(window, document, "clarity", "script", "wgy8utofnr");
            `;
            document.head.appendChild(clarityScript);
        }

        // Injetar MP SDK V2 manualmente
        if (!document.getElementById('mp-v2')) {
            const script = document.createElement('script');
            script.id = 'mp-v2';
            script.src = 'https://sdk.mercadopago.com/js/v2?locale=pt-BR';
            script.onload = () => setIsMpLoaded(true);
            document.body.appendChild(script);
        } else {
            setIsMpLoaded(true);
        }
        if (!document.getElementById('mp-security')) {
            const s = document.createElement('script');
            s.id = 'mp-security';
            s.src = 'https://www.mercadopago.com/v2/security.js';
            s.setAttribute('view', 'checkout');
            document.body.appendChild(s);
        }

        // Referrer Policy
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

    // Auto-save progress and tracking removed per user request (Deep Cleanup)

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

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
                    setCepResolved(true);
                    setErrors(prev => { const n = { ...prev }; delete n.cep; return n; });
                } else {
                    setErrors(prev => ({ ...prev, cep: 'CEP não encontrado. Verifique e tente novamente.' }));
                }
            } catch (e) {
                setErrors(prev => ({ ...prev, cep: 'Erro ao buscar CEP. Tente novamente.' }));
            }
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
                setCepResolved(true);
                setErrors(prev => { const n = { ...prev }; delete n.cep; return n; });
            } else {
                setErrors(prev => ({ ...prev, cep: 'CEP não encontrado. Verifique e tente novamente.' }));
            }
        } catch (e) {
            setErrors(prev => ({ ...prev, cep: 'Erro ao buscar CEP. Tente novamente.' }));
        }
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
            if (cleanCpf.length > 0 && cleanCpf.length !== 11) {
                newErrors.cpf = 'CPF inválido';
            }
        }

        setErrors(newErrors);
        if (Object.keys(newErrors).length === 0) {
            if (!endereco.destinatario) {
                setEndereco(prev => ({ ...prev, destinatario: dados.nome }));
            }

            setStep(product?.isDigital ? 3 : 2);
            trackGoogleEvent('add_contact_info', {
                currency: 'BRL',
                value: finalPrice,
                items: [{ item_id: product?.id || 'default', item_name: product?.name || 'Produto', price: product?.price || 0, quantity: 1 }]
            });
            window.scrollTo(0, 0);

            return true;
        }
        return false;
    };

    const validateStep2 = () => {
        let newErrors: Record<string, string> = {};
        if (endereco.cep.replace(/\D/g, '').length !== 8) newErrors.cep = 'CEP inválido';
        if (!endereco.rua) newErrors.rua = 'Informe a rua';
        if (!endereco.numero) newErrors.numero = 'Informe o número';
        if (!endereco.complemento) newErrors.complemento = 'Informe o complemento';
        if (!endereco.bairro) newErrors.bairro = 'Informe o bairro';
        if (!endereco.cidade) newErrors.cidade = 'Informe a cidade';
        if (!endereco.estado) newErrors.estado = 'Selecione o estado';

        setErrors(newErrors);
        if (Object.keys(newErrors).length === 0) {
            setStep(3);
            trackGoogleEvent('add_shipping_info', {
                currency: 'BRL',
                value: finalPrice,
                shipping_tier: shipping?.name || 'Standard',
                items: [{ item_id: product?.id || 'default', item_name: product?.name || 'Produto', price: product?.price || 0, quantity: 1 }]
            });
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
                const payloadSrc = brickData.formData ? brickData.formData : brickData;
                tokenData = {
                    token: payloadSrc.token,
                    installments: payloadSrc.installments,
                    payment_method_id: payloadSrc.payment_method_id,
                    issuer_id: payloadSrc.issuer_id
                };
            }
            else if (paymentMethod === 'card') {
                // ... fallback logic if needed
            }

            const searchParams = new URLSearchParams(window.location.search);
            const payload = {
                method: currentMethod,
                cardData: tokenData,
                brickData: brickData, // Envia para o backend processar via BrickData
                orderId: null,
                orderData: {
                    ...dados,
                    ...endereco,
                    price: finalPrice,
                    shippingPrice: shipping?.price || 0,
                    productId: product?.id || 'default',
                    utmSource: searchParams.get('utm_source'),
                    utmMedium: searchParams.get('utm_medium'),
                    utmCampaign: searchParams.get('utm_campaign'),
                    utmTerm: searchParams.get('utm_term'),
                    utmContent: searchParams.get('utm_content'),
                    utmPlacement: searchParams.get('utm_placement'),
                    utmId: searchParams.get('utm_id'),
                    utmCreativeName: searchParams.get('utm_creative_name'),
                },
                deviceId: deviceId
            };

            const response = await fetch('/api/process-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const textResponse = await response.text();
            let result;
            try {
                result = JSON.parse(textResponse);
            } catch (err) {
                console.error("Backend Error Response:", textResponse);
                alert("Erro no servidor ao processar pagamento.");
                throw new Error("Erro de resposta do servidor");
            }

            if (result.success) {
                // Taboola: Track EVERY attempt (approved, declined, pending Pix)
                trackTaboolaEvent('make_purchase', { value: finalPrice, currency: 'BRL' });

                // Google Analytics: purchase event
                trackGoogleEvent('purchase', {
                    transaction_id: result.orderId || crypto.randomUUID(),
                    value: finalPrice,
                    currency: 'BRL',
                    payment_type: paymentMethod === 'pix' ? 'pix' : 'credit_card',
                    items: [{ item_id: product?.id || 'default', item_name: product?.name || 'Produto', price: product?.price || 0, quantity: 1 }]
                });

                // Google Ads: conversion event
                if (pixels?.googleId && pixels?.googleAdsConvLabel && /^[a-zA-Z0-9_-]+$/.test(pixels.googleId) && /^[a-zA-Z0-9_-]+$/.test(pixels.googleAdsConvLabel)) {
                    trackGoogleEvent('conversion', {
                        send_to: `${pixels.googleId}/${pixels.googleAdsConvLabel}`,
                        value: finalPrice,
                        currency: 'BRL',
                        transaction_id: result.orderId || ''
                    });
                }

                if (result.paymentStatus === 'recusado') {
                    alert("Pagamento recusado pela operadora.");
                    throw new Error("Pagamento recusado.");
                }
                if (result.qrCodeBase64) {
                    setPixData({ qrCode: result.qrCode, qrCodeBase64: result.qrCodeBase64 });
                    setTimeLeft(10 * 60);
                }
                setDone(true);
            } else {
                alert("Erro: " + (result.error || "Tente novamente"));
                throw new Error(result.error || "Erro de validação do pagamento");
            }
        } catch (e) {
            console.error("ERRO DE PROCESSAMENTO:", e);
            if (!(e instanceof Error) || e.message === "Erro de conexão") {
                alert("Erro de conexão. Verifique sua rede.");
            }
            throw e;
        } finally { setLoading(false); }
    }

    // Efeito para inicializar o Brick
    useEffect(() => {
        let brickController: any = null;
        let mounted = true;

        if (paymentMethod === 'card' && step === 3 && typeof window !== 'undefined' && isMpLoaded && (window as any).MercadoPago) {
            const initBrick = async () => {
                const container = document.getElementById('paymentBrick_container');
                if (!container) return;
                container.innerHTML = '';

                const mp = new (window as any).MercadoPago(process.env.NEXT_PUBLIC_MP_PUBLIC_KEY!);
                const bricksBuilder = mp.bricks();

                // Prevent multiple instances in development StrictMode
                if ((window as any).cardBrickController) {
                    try { (window as any).cardBrickController.unmount(); } catch (e) { }
                }

                try {
                    const initPayload = {
                        amount: Number(finalPrice.toFixed(2)),
                        payer: {
                            email: dados.email,
                            identification: {
                                type: 'CPF',
                                number: dados.cpf ? dados.cpf.replace(/\D/g, '') : ''
                            }
                        },
                    };

                    console.log("🔹 [DEBUG] O que está sendo enviado na inicialização do Mercado Pago:", initPayload);

                    const controller = await bricksBuilder.create('cardPayment', 'paymentBrick_container', {
                        initialization: initPayload,
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
                            onSubmit: (formData) => {
                                return new Promise((resolve, reject) => {
                                    console.log("Card FormData Completo:", formData);

                                    // Validar se o Brick gerou um token válido
                                    const tokenSrc = formData?.formData || formData;
                                    if (!tokenSrc || !tokenSrc.token) {
                                        console.error("❌ Token não gerado pelo Brick. Possível bloqueio CORS/WAF do Mercado Pago.");
                                        alert("Não foi possível processar o cartão. O sistema de segurança bloqueou a operação. Tente novamente ou utilize o PIX.");
                                        reject(new Error("Token do cartão não disponível"));
                                        return;
                                    }

                                    // Validar CPF para cartão: Brick ou formulário devem ter CPF válido
                                    const brickCpf = tokenSrc.payer?.identification?.number?.replace(/\D/g, '') || '';
                                    const formCpf = dados.cpf?.replace(/\D/g, '') || '';
                                    const finalCpf = brickCpf || formCpf;
                                    if (!finalCpf || finalCpf.length !== 11) {
                                        alert("CPF é obrigatório para pagamento com cartão. Por favor, preencha seu CPF.");
                                        reject(new Error("CPF obrigatório para cartão"));
                                        return;
                                    }

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

                    if (!mounted) {
                        try { controller.unmount(); } catch (e) { }
                    } else {
                        brickController = controller;
                        (window as any).cardBrickController = controller;
                    }
                } catch (e) {
                    console.error("Error creating brick:", e);
                }
            };

            initBrick();
        }

        return () => {
            mounted = false;
            if (brickController) {
                try { brickController.unmount(); } catch (e) { }
                (window as any).cardBrickController = null;
            } else if ((window as any).cardBrickController) {
                // Caso a promessa ainda não tinha retornado
                try { (window as any).cardBrickController.unmount(); } catch (e) { }
                (window as any).cardBrickController = null;
            }
        };
    }, [paymentMethod, step, isMpLoaded, finalPrice, dados.email, dados.cpf]);

    const renderProgressBar = () => (
        <div className="progress">
            <div className="progress-inner">
                <div className="prog-step">
                    <div className={`prog-dot ${step > 1 ? 'done' : step === 1 ? 'active' : 'next'}`}>{step > 1 ? '✓' : '1'}</div>
                    <div className={`prog-lbl ${step > 1 ? 'done' : step === 1 ? 'active' : ''}`}>Seus Dados</div>
                </div>
                {!product?.isDigital && (
                    <>
                        <div className={`prog-line ${step > 1 ? 'done' : ''}`}></div>
                        <div className="prog-step">
                            <div className={`prog-dot ${step > 2 ? 'done' : step === 2 ? 'active' : 'next'}`}>{step > 2 ? '✓' : '2'}</div>
                            <div className={`prog-lbl ${step > 2 ? 'done' : step === 2 ? 'active' : ''}`}>Entrega</div>
                        </div>
                    </>
                )}
                <div className={`prog-line ${step >= (product?.isDigital ? 3 : 2) ? 'done' : ''}`}></div>
                <div className="prog-step">
                    <div className={`prog-dot ${step === 3 ? 'active' : 'next'}`}>{product?.isDigital ? '2' : '3'}</div>
                    <div className={`prog-lbl ${step === 3 ? 'active' : ''}`}>Pagamento</div>
                </div>
            </div>
        </div>
    );

    return (
        <div className={`checkout-page-wrapper ${done ? 'is-done' : ''}`}>
            {(() => {
                const pc = customization?.primaryColor;
                const isValidColor = pc && /^#([0-9a-fA-F]{3,8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$|^rgb[a]?\([\d\s,.%/]+\)$|^hsl[a]?\([\d\s,.%/]+\)$/.test(pc.trim());
                return isValidColor ? <style dangerouslySetInnerHTML={{ __html: `:root { --green: ${pc.trim()}; }` }} /> : null;
            })()}
            <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />

            {loading && <div className="loading-overlay"><div className="loading-spinner"></div><p style={{ marginTop: '20px', fontWeight: 800 }}>Processando...</p></div>}

            <div className="header">
                <div className="logo">
                    {product?.storeLogo ? <img src={product.storeLogo} alt={product?.storeName || 'Logo'} style={{ maxHeight: '42px' }} /> : customization?.logo ? <img src={customization.logo} alt="Logo" style={{ maxHeight: '42px' }} /> : (product?.storeName || customization?.storeName || 'PagFlow')}
                </div>
                <div className="secure">
                    <svg viewBox="0 0 20 20" fill="currentColor"><path d="M10 1L3 4.5v5C3 13.6 6 17.3 10 18.5c4-1.2 7-4.9 7-9V4.5L10 1z"/></svg>
                    PAGAMENTO 100% SEGURO
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

                    {paymentMethod === 'pix' ? (
                        <div className="pix-page-wrapper">
                            <div className="success-page-content">
                                {/* STATUS */}
                                <div className="status-top">
                                    <div className="check-circle">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="20 6 9 17 4 12"/>
                                        </svg>
                                    </div>
                                    <div className="status-title">Pedido reservado!<br />Falta só o pagamento.</div>
                                    <div className="status-sub" style={{ marginTop: '6px' }}>Escaneie o QR Code ou copie o código abaixo</div>
                                </div>

                                {/* MAIN CARD */}
                                <div className="pix-card">
                                    <div className="qr-section">
                                        <div className="qr-instruction">Abra o app do banco e escaneie o QR Code</div>
                                        <div className="qr-wrap">
                                            {pixData?.qrCodeBase64 ? (
                                                <img src={`data:image/jpeg;base64,${pixData.qrCodeBase64}`} alt="QR Code Pix" />
                                            ) : (
                                                <div style={{ color: '#ccc', fontSize: '12px' }}>Gerando QR Code...</div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="or-divider-pix"><span>OU COPIE O CÓDIGO</span></div>

                                    <div className="code-section">
                                        <div className="code-box">{pixData?.qrCode || 'Gerando código PIX...'}</div>
                                        <button
                                            className={`pix-copy-btn ${copied ? 'copied' : ''}`}
                                            onClick={() => {
                                                if (pixData?.qrCode) {
                                                    navigator.clipboard.writeText(pixData.qrCode);
                                                    setCopied(true);
                                                    setTimeout(() => setCopied(false), 3000);
                                                }
                                            }}
                                        >
                                            {copied ? (
                                                <>
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                                    Código Copiado!
                                                </>
                                            ) : (
                                                <>
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                                                    Copiar Código PIX
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* NEXT STEPS */}
                                <div className="steps-card">
                                    <div className="steps-title">O que acontece depois?</div>
                                    <div className="step-row-pix">
                                        <div className="step-num-pix">1</div>
                                        <div className="step-text-pix">
                                            {product?.isDigital ? 'Acesso enviado para seu e-mail' : 'Confirmação por e-mail em minutos'} <span>— assim que o pagamento for identificado em <strong>{dados.email}</strong></span>
                                        </div>
                                    </div>
                                    <div className="step-row-pix">
                                        <div className="step-num-pix">2</div>
                                        <div className="step-text-pix">
                                            {product?.isDigital ? 'Verifique sua caixa de entrada' : 'Separação e envio do pedido'} <span>— {product?.isDigital ? 'o acesso chega em até 5 minutos.' : 'pagamentos até as 15h saem no mesmo dia.'}</span>
                                        </div>
                                    </div>
                                    {!product?.isDigital && (
                                        <div className="step-row-pix">
                                            <div className="step-num-pix">3</div>
                                            <div className="step-text-pix">Código de rastreio por e-mail <span>— acompanhe sua entrega em tempo real</span></div>
                                        </div>
                                    )}
                                </div>

                                {/* TRUST */}
                                <div className="trust-row-pix">
                                    <div className="trust-item-pix">
                                        <svg viewBox="0 0 20 20" fill="currentColor"><path d="M10 1L3 4.5v5C3 13.6 6 17.3 10 18.5c4-1.2 7-4.9 7-9V4.5L10 1z"/></svg>
                                        PIX oficial Banco Central
                                    </div>
                                    <div className="trust-item-pix">
                                        <svg viewBox="0 0 20 20" fill="currentColor"><path d="M10 1L3 4.5v5C3 13.6 6 17.3 10 18.5c4-1.2 7-4.9 7-9V4.5L10 1z"/></svg>
                                        Dados criptografados
                                    </div>
                                    <div className="trust-item-pix">
                                        <svg viewBox="0 0 20 20" fill="currentColor"><path d="M10 1L3 4.5v5C3 13.6 6 17.3 10 18.5c4-1.2 7-4.9 7-9V4.5L10 1z"/></svg>
                                        Compra garantida
                                    </div>
                                </div>

                                <div className="help-row" style={{ marginTop: '20px' }}>
                                    <p style={{ fontSize: '13px', color: '#777', textAlign: 'center' }}>
                                        Precisa de ajuda? <a href={`mailto:${customization?.supportEmail || 'suporte@loja.com'}`} style={{ color: '#111', fontWeight: 700, textDecoration: 'none' }}>Entre em contato por e-mail</a>
                                    </p>
                                </div>
                            </div>

                            {/* TOAST */}
                            <div className={`pix-toast ${copied ? 'show' : ''}`}>✓ Código copiado!</div>
                        </div>
                    ) : (
                        <div className="card-confirm-page">
                            <div className="cc-container">
                                {/* HERO */}
                                <div className="cc-hero">
                                    <div className="cc-hero-circle">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="20 6 9 17 4 12"/>
                                        </svg>
                                    </div>
                                    <div className="cc-hero-title">Pagamento Aprovado!<br/>Pedido confirmado.</div>
                                    <div className="cc-hero-sub" style={{ marginTop: '8px' }}>O comprovante foi enviado para o seu e-mail.</div>
                                </div>

                                {/* ORDER DETAILS */}
                                <div className="cc-card">
                                    <div className="cc-card-head">
                                        <svg width="14" height="14" viewBox="0 0 20 20" fill="var(--green)"><path d="M4 4h12v12H4z" fill="none" stroke="var(--green)" strokeWidth="1.5"/><path d="M8 10l2 2 4-4" stroke="var(--green)" strokeWidth="1.5" strokeLinecap="round" fill="none"/></svg>
                                        <div className="cc-card-head-title">Detalhes do pedido</div>
                                    </div>
                                    <div className="cc-card-body">
                                        <div className="cc-detail-row">
                                            <span className="cc-detail-label">Pedido</span>
                                            <span className="cc-detail-value">#{String(Date.now()).slice(-5)}</span>
                                        </div>
                                        <div className="cc-detail-row">
                                            <span className="cc-detail-label">Data</span>
                                            <span className="cc-detail-value">{new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })} às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                        <div className="cc-detail-row">
                                            <span className="cc-detail-label">Método</span>
                                            <span className="cc-detail-value">Cartão de crédito</span>
                                        </div>
                                        <div className="cc-detail-row">
                                            <span className="cc-detail-label">Status</span>
                                            <span className="cc-detail-value">
                                                <span className="cc-badge-ok">
                                                    <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-7 7a1 1 0 01-1.4 0l-3-3a1 1 0 111.4-1.4L9 11.58l6.3-6.28a1 1 0 011.4 0z" clip-rule="evenodd"/></svg>
                                                    Aprovado
                                                </span>
                                            </span>
                                        </div>
                                        <div className="cc-detail-row">
                                            <span className="cc-detail-label">Total cobrado</span>
                                            <span className="cc-detail-value green">R$ {finalPrice.toFixed(2).replace('.', ',')}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* NEXT STEPS */}
                                <div className="cc-card">
                                    <div className="cc-card-head">
                                        <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="var(--green)" strokeWidth="1.5"><circle cx="10" cy="10" r="8"/><path d="M10 6v4l3 3" strokeLinecap="round"/></svg>
                                        <div className="cc-card-head-title">O que acontece agora?</div>
                                    </div>
                                    <div className="cc-card-body cc-steps">
                                        <div className="cc-step-row">
                                            <div className="cc-step-icon">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1-.9-2 2-2z"/>
                                                    <polyline points="22,6 12,13 2,6"/>
                                                </svg>
                                            </div>
                                            <div className="cc-step-body">
                                                <div className="cc-step-name">Confirmação por e-mail</div>
                                                <div className="cc-step-desc">O comprovante do pedido foi enviado agora para o seu e-mail <strong>{dados.email}</strong>.</div>
                                            </div>
                                        </div>

                                        <div className="cc-step-row">
                                            <div className="cc-step-icon">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                                    <rect x="1" y="3" width="15" height="13" rx="1"/>
                                                    <path d="M16 8h4l3 5v3h-7V8z"/>
                                                    <circle cx="5.5" cy="18.5" r="2.5"/>
                                                    <circle cx="18.5" cy="18.5" r="2.5"/>
                                                </svg>
                                            </div>
                                            <div className="cc-step-body">
                                                <div className="cc-step-name">{product?.isDigital ? 'Acesso imediato' : 'Separação e envio'}</div>
                                                <div className="cc-step-desc">{product?.isDigital ? 'Seu acesso chega em até 5 minutos no e-mail cadastrado.' : 'Pedidos confirmados até 15h saem no mesmo dia. Após isso, no próximo dia útil.'}</div>
                                            </div>
                                        </div>

                                        {!product?.isDigital && (
                                            <div className="cc-step-row">
                                                <div className="cc-step-icon">
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                                                        <circle cx="12" cy="10" r="3"/>
                                                    </svg>
                                                </div>
                                                <div className="cc-step-body">
                                                    <div className="cc-step-name">Rastreio por e-mail</div>
                                                    <div className="cc-step-desc">Assim que o pedido sair, você recebe o código de rastreio diretamente no e-mail.</div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* TRUST */}
                                <div className="cc-trust-row">
                                    <div className="cc-trust-item">
                                        <svg viewBox="0 0 20 20" fill="currentColor"><path d="M10 1L3 4.5v5C3 13.6 6 17.3 10 18.5c4-1.2 7-4.9 7-9V4.5L10 1z"/></svg>
                                        Compra protegida
                                    </div>
                                    <div className="cc-trust-item">
                                        <svg viewBox="0 0 20 20" fill="currentColor"><path d="M10 1L3 4.5v5C3 13.6 6 17.3 10 18.5c4-1.2 7-4.9 7-9V4.5L10 1z"/></svg>
                                        Dados criptografados
                                    </div>
                                    <div className="cc-trust-item">
                                        <svg viewBox="0 0 20 20" fill="currentColor"><path d="M10 1L3 4.5v5C3 13.6 6 17.3 10 18.5c4-1.2 7-4.9 7-9V4.5L10 1z"/></svg>
                                        PCI-DSS
                                    </div>
                                </div>

                                <div className="help-row" style={{ marginTop: '20px' }}>
                                    <p style={{ fontSize: '13px', color: '#777', textAlign: 'center' }}>
                                        Precisa de ajuda? <a href={`mailto:${customization?.supportEmail || 'suporte@loja.com'}`} style={{ color: '#111', fontWeight: 700, textDecoration: 'none' }}>Entre em contato por e-mail</a>
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <>
                    {customization?.alertText && (
                        <div className="header-strip" style={{ backgroundColor: customization.alertBg, color: customization.alertColor || '#111' }}>
                            {customization.alertText}
                        </div>
                    )}

                    <div className="page">
                        <div className="layout">

                        {/* Sidebar - Resumo + Trust Badges */}
                        <aside className="aside">
                            <div className="aside-summary">
                                <div className="prod-summary">
                                    <div className="prod-img">
                                        {product?.imageUrl ? <img src={product.imageUrl} alt={product.name} /> : '🧴'}
                                    </div>
                                    <div className="prod-info">
                                        <div className="prod-name">{product?.name || "Produto"}</div>
                                        <div className="prod-qty">Quantidade: 1</div>
                                    </div>
                                    <div className="prod-price">R$ {finalPrice.toFixed(2).replace('.', ',')}</div>
                                </div>
                            </div>
                            <div className="trust-section">
                                {product?.isDigital ? (
                                    [
                                        { icon: '✅', title: 'Acesso Imediato', p: 'Assim que o pagamento é confirmado, o link chega no seu e-mail em minutos. Sem espera, sem frete.' },
                                        { icon: '🔄', title: 'Garantia de 7 Dias', p: 'Se não gostar por qualquer motivo, devolvemos 100% do seu dinheiro. Sem perguntas, sem burocracia.' },
                                        { icon: '🔒', title: 'Compra Protegida', p: 'Seus dados pessoais e de pagamento estão completamente seguros. Ambiente criptografado e certificado.' },
                                        { icon: '💬', title: 'Suporte Humanizado', p: 'Nossa equipe está pronta para te ajudar por e-mail e WhatsApp. Resposta rápida em até 1 hora.' }
                                    ].map((t, i) => (
                                        <div key={i} className="trust-item">
                                            <div className="t-icon">{t.icon}</div>
                                            <div className="t-body">
                                                <div className="t-stars">★★★★★</div>
                                                <div className="t-name">{t.title}</div>
                                                <div className="t-desc">{t.p}</div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    [
                                        { icon: '✈️', title: 'Envio Rápido', p: 'Seu produto é enviado diretamente para o seu endereço, com rastreamento pelo WhatsApp.' },
                                        { icon: '🔄', title: 'Trocas e Devoluções', p: 'Se não gostar ou chegar com problema, trocamos ou devolvemos em até 7 dias. Sem complicação.' },
                                        { icon: '🔒', title: 'Compra Protegida', p: 'Seus dados pessoais e de pagamento estão completamente seguros conosco.' },
                                        { icon: '💬', title: 'Suporte Humanizado', p: 'Nossa equipe está pronta para te ajudar por e-mail e WhatsApp. Resposta rápida em até 1 hora.' }
                                    ].map((t, i) => (
                                        <div key={i} className="trust-item">
                                            <div className="t-icon">{t.icon}</div>
                                            <div className="t-body">
                                                <div className="t-stars">★★★★★</div>
                                                <div className="t-name">{t.title}</div>
                                                <div className="t-desc">{t.p}</div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </aside>

                        <div className="form-col">

                        <div className={`screen ${step === 1 ? 'active' : ''}`}>
                            <div className="card">
                                {renderProgressBar()}
                                <div className="step-title">Identificação</div>
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
                                    <div className="field-hint">Vamos enviar a confirmação do pedido para este e-mail</div>
                                </div>
                                <div className={`field ${errors.telefone ? 'error' : ''}`}>
                                    <label className="field-label">Seu Telefone *</label>
                                    <input type="text" placeholder="(11) 91234-5678" maxLength={15} value={dados.telefone} onChange={e => handleMaskDados('telefone', e.target.value, formatTel)} />
                                    {errors.telefone && <div className="error-msg">⚠️ {errors.telefone}</div>}
                                    <div className="field-hint">{product?.isDigital ? 'Para receber o acesso ao produto via WhatsApp' : 'Para avisar quando o produto sair para entrega'}</div>
                                </div>
                                {!customization?.disableCpf && (
                                    <div className={`field ${errors.cpf ? 'error' : ''}`}>
                                        <label className="field-label">CPF <span style={{ fontWeight: 400, fontSize: '13px', color: '#94a3b8' }}>(Obrigatório para cartão)</span></label>
                                        <input type="text" placeholder="000.000.000-00" maxLength={14} value={dados.cpf} onChange={e => handleMaskDados('cpf', e.target.value, formatCPF)} />
                                        {errors.cpf && <div className="error-msg">⚠️ {errors.cpf}</div>}
                                        <div className="field-hint">Necessário apenas para emissão de nota fiscal</div>
                                    </div>
                                )}

                                <button className="cta-btn" onClick={validateStep1} disabled={step1Loading}>
                                    {step1Loading ? 'Carregando...' : (product?.isDigital ? 'Continuar para o Pagamento' : 'Continuar para a Entrega')}
                                </button>
                                <div className="cta-note">
                                    <svg viewBox="0 0 20 20" fill="currentColor"><path d="M10 1L3 4.5v5C3 13.6 6 17.3 10 18.5c4-1.2 7-4.9 7-9V4.5L10 1z"/></svg>
                                    Pagamento processado com segurança via Mercado Pago
                                </div>
                            </div>
                        </div>

                        <div className={`screen ${step === 2 ? 'active' : ''}`}>
                            <div className="card">
                                <button className="back-btn" onClick={() => setStep(1)}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                                    Voltar
                                </button>
                                {renderProgressBar()}
                                <div className="step-title">Passo 2 — Endereço de Entrega</div>
                                <div className="step-sub">Para onde vamos enviar o seu produto?</div>

                                <div className={`field ${errors.cep ? 'error' : ''}`}>
                                    <label className="field-label">CEP *</label>
                                    <div className="cep-row">
                                        <input type="text" placeholder="00000-000" maxLength={9} value={endereco.cep} onChange={e => handleCEPChange(e.target.value)} autoFocus />
                                    </div>
                                    {errors.cep && <div className="error-msg">⚠️ {errors.cep}</div>}
                                </div>

                                {cepResolved && (
                                    <>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', fontWeight: 600, color: '#92400e' }}>
                                            ✅ Endereço encontrado! Preencha os campos abaixo.
                                        </div>

                                        <div className={`field ${errors.rua ? 'error' : ''}`}>
                                            <label className="field-label">Rua ou Avenida *</label>
                                            <input type="text" placeholder="Ex: Rua das Flores" value={endereco.rua} onChange={e => handleMaskEnd('rua', e.target.value, v => v)} />
                                            {errors.rua && <div className="error-msg">⚠️ {errors.rua}</div>}
                                        </div>
                                        <div className="two">
                                            <div className={`field ${errors.numero ? 'error' : ''}`}>
                                                <label className="field-label">Número *</label>
                                                <input type="text" placeholder="Ex: 123" value={endereco.numero} onChange={e => handleMaskEnd('numero', e.target.value, v => v)}
                                                    style={endereco.numero ? { background: '#f0fdf4', border: '2px solid #22c55e', fontWeight: 600 } : { background: '#fffbeb', border: '2px solid #fbbf24', fontWeight: 600 }}
                                                    autoFocus />
                                                {errors.numero && <div className="error-msg">⚠️ {errors.numero}</div>}
                                            </div>
                                            <div className={`field ${errors.complemento ? 'error' : ''}`}>
                                                <label className="field-label">Complemento *</label>
                                                <input type="text" placeholder="Apto, Bloco..." value={endereco.complemento} onChange={e => handleMaskEnd('complemento', e.target.value, v => v)}
                                                    style={endereco.complemento ? { background: '#f0fdf4', border: '2px solid #22c55e', fontWeight: 600 } : { background: '#fffbeb', border: '2px solid #fbbf24', fontWeight: 600 }} />
                                                {errors.complemento && <div className="error-msg">⚠️ {errors.complemento}</div>}
                                            </div>
                                        </div>
                                        <div className="two">
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
                                                <option value="">Selecione o estado</option>
                                                {['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'].map(uf => (
                                                    <option key={uf} value={uf}>{uf}</option>
                                                ))}
                                            </select>
                                            {errors.estado && <div className="error-msg">⚠️ {errors.estado}</div>}
                                        </div>

                                        <div className="section-label">🚚 Formas de Entrega</div>
                                        {(shippingRules && shippingRules.length > 0 ? shippingRules : [
                                            { name: 'Entrega Econômica', price: 0, delivery_time: '7' }
                                        ]).map((opt: any, idx: number) => {
                                            const days = parseInt(String(opt.delivery_time).replace(/\D/g, '')) || 7;
                                            const entregaDate = new Date();
                                            entregaDate.setDate(entregaDate.getDate() + days);
                                            const dateStr = entregaDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                                            return (
                                                <div key={idx} className={`frete-opt ${shipping.price === opt.price && shipping.name === opt.name ? 'selected' : ''}`} onClick={() => setShipping(opt)}>
                                                    <div className="frad"></div>
                                                    <div>
                                                        <div className="frete-name" style={{display:'flex', alignItems:'center'}}>{opt.name} {opt.price === 0 && <span className="tag-free">GRÁTIS</span>}</div>
                                                        <div className="frete-sub">Chega até dia {dateStr}</div>
                                                    </div>
                                                    <div className={`frete-cost ${opt.price === 0 ? 'free' : ''}`} style={{marginLeft:'auto'}}>{opt.price === 0 ? 'GRÁTIS' : `R$ ${Number(opt.price).toFixed(2).replace('.', ',')}`}</div>
                                                </div>
                                            );
                                        })}

                                        <button className="cta-btn" style={{ marginTop: '14px' }} onClick={validateStep2}>
                                            Ir para Pagamento
                                        </button>
                                        <div className="cta-note">
                                            <svg viewBox="0 0 20 20" fill="currentColor"><path d="M10 1L3 4.5v5C3 13.6 6 17.3 10 18.5c4-1.2 7-4.9 7-9V4.5L10 1z"/></svg>
                                            Pagamento processado com segurança via Mercado Pago
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className={`screen ${step === 3 ? 'active' : ''}`}>
                            <div className="card">
                                <button className="back-btn" onClick={() => setStep(product?.isDigital ? 1 : 2)}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                                    Voltar
                                </button>
                                {renderProgressBar()}
                                <div className="step-title">Passo {product?.isDigital ? '2' : '3'} — Pagamento</div>
                                <div className="step-sub">Escolha como prefere pagar. É simples e seguro!</div>

                                {pixDiscountVal > 0 && (
                                    <div style={{
                                        background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
                                        border: '1.5px solid #6ee7b7',
                                        borderRadius: '12px',
                                        padding: '12px 16px',
                                        marginBottom: '16px',
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        gap: '10px',
                                        fontSize: '13.5px',
                                        color: '#065f46',
                                        fontWeight: 500,
                                        lineHeight: 1.5
                                    }}>
                                        <span style={{ fontSize: '18px', flexShrink: 0 }}>⚡</span>
                                        <div>
                                            <strong>Atenção:</strong> Pagando por PIX sai por{' '}
                                            <strong style={{ color: '#059669' }}>
                                                R$ {(basePrice * (1 - pixDiscountVal)).toFixed(2).replace('.', ',')}
                                            </strong>
                                            {product?.isDigital ? (
                                                <> + acesso <strong>IMEDIATO</strong> <span style={{ opacity: 0.85 }}>(no seu e-mail)</span> ⚡</>
                                            ) : (
                                                <> + frete rápido <strong>GRÁTIS</strong> <span style={{ opacity: 0.85 }}>(chega em 5 dias úteis)</span> 🚀</>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className={`pay-opt ${paymentMethod === 'pix' ? 'selected' : ''}`} onClick={() => setPaymentMethod('pix')}>
                                    <div className="prad"></div>
                                    <div className="pay-icon" style={{color:'#00B69B'}}>
                                        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z"/></svg>
                                    </div>
                                    <div style={{flex:1}}>
                                        <div className="pay-name" style={{display:'flex',alignItems:'center',gap:'6px'}}>PIX <span className="pay-badge g">Aprovação na hora</span></div>
                                        <div className="pay-desc">Pagamento rápido e seguro</div>
                                    </div>
                                </div>
                                {paymentMethod === 'pix' && (
                                    <div className="pix-box">
                                        <p>A confirmação de pagamento é realizada em poucos minutos.<br/>Utilize o aplicativo do seu banco para pagar.</p>
                                        <button className="cta-btn" onClick={() => finalizar()} disabled={loading} style={{ marginTop: '16px' }}>
                                            {loading ? 'Processando...' : 'GERAR PIX'}
                                        </button>
                                        <div className="cta-note" style={{marginTop:'12px'}}>
                                            <svg viewBox="0 0 20 20" fill="currentColor"><path d="M10 1L3 4.5v5C3 13.6 6 17.3 10 18.5c4-1.2 7-4.9 7-9V4.5L10 1z"/></svg>
                                            Pagamento processado com segurança via Mercado Pago
                                        </div>
                                    </div>
                                )}

                                <div className={`pay-opt ${paymentMethod === 'card' ? 'selected' : ''}`} onClick={() => setPaymentMethod('card')} style={{marginTop:'10px'}}>
                                    <div className="prad"></div>
                                    <div className="pay-icon" style={{color:'#444'}}>💳</div>
                                    <div style={{flex:1}}>
                                        <div className="pay-name" style={{display:'flex',alignItems:'center',gap:'6px'}}>Cartão de Crédito <span className="pay-badge n">Até 10x</span></div>
                                        <div className="pay-desc">Pague com segurança</div>
                                    </div>
                                </div>
                                {paymentMethod === 'card' && (
                                    <div className="card-extra">
                                        <div id="paymentBrick_container" style={{ marginTop: '0px' }}></div>
                                        <div className="cta-note" style={{marginTop:'12px'}}>
                                            <svg viewBox="0 0 20 20" fill="currentColor"><path d="M10 1L3 4.5v5C3 13.6 6 17.3 10 18.5c4-1.2 7-4.9 7-9V4.5L10 1z"/></svg>
                                            Pagamento processado com segurança via Mercado Pago
                                        </div>
                                    </div>
                                )}

                            </div>
                        </div>

                        </div>

                        </div>
                    </div>
                </>
            )}

            {!customization?.disableWa && (
                <a className="wa" href="https://wa.me/5511999999999" target="_blank" rel="noreferrer">
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.47 14.38c-.3-.15-1.77-.87-2.04-.97s-.47-.15-.67.15-.77.97-.94 1.17-.35.22-.65.07a8.14 8.14 0 01-2.4-1.48 9 9 0 01-1.66-2.07c-.17-.3 0-.46.13-.61l.43-.5c.14-.16.18-.3.27-.5s.05-.37-.02-.52-.67-1.6-.91-2.2c-.24-.57-.49-.5-.67-.5s-.37-.01-.57-.01a1.1 1.1 0 00-.8.37 3.36 3.36 0 00-1.05 2.5 5.84 5.84 0 001.22 3.1 13.38 13.38 0 005.13 4.52c.72.31 1.28.5 1.72.64a4.14 4.14 0 001.9.12 3.08 3.08 0 002.02-1.43 2.5 2.5 0 00.17-1.43c-.07-.12-.27-.19-.57-.34zM12 2a10 10 0 00-8.7 14.93L2 22l5.25-1.38A10 10 0 1012 2z" /></svg>
                    Dúvidas? Fale conosco
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
