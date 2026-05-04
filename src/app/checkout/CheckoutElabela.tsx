'use client'

import { useState, useEffect } from 'react'
import './checkout.css'
import ExitPopup from './ExitPopup'
import { saveOrderProgress } from '../actions'

export default function CheckoutForm({ product, customization, shippingRules = [], availableBumps = [], pixels = {}, exitPopupConfig }: any) {
  const [step, setStep] = useState(1);
  const [isSummaryOpen, setIsSummaryOpen] = useState(true);
  const [exitDiscount, setExitDiscount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(14 * 60 + 52);
  const [done, setDone] = useState(false);
  const [isMpLoaded, setIsMpLoaded] = useState(false);
  const [accessId, setAccessId] = useState<string | null>(null);
  const [lastTrackedStep, setLastTrackedStep] = useState<number>(0);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [step1Loading, setStep1Loading] = useState(false);
  // Live popup state - fetched from DB on mount to override stale SSR prop
  const [livePopupEnabled, setLivePopupEnabled] = useState<boolean>(exitPopupConfig?.isEnabled ?? false);

  const [dados, setDados] = useState({ nome: '', email: '', telefone: '', cpf: '' });
  const [endereco, setEndereco] = useState({ cep: '', rua: '', numero: '', complemento: '', bairro: '', cidade: '', estado: 'SP', destinatario: '' });
  const defaultShipping = shippingRules && shippingRules.length > 0
    ? shippingRules[0]
    : { name: 'Entrega Econômica', price: 0, delivery_time: 'Chega em até 7 dias úteis' };
  const [shipping, setShipping] = useState(defaultShipping);
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card' | ''>('');
  const [pixData, setPixData] = useState<{ qrCode: string, qrCodeBase64: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);
  const [cardData, setCardData] = useState({ number: '', name: '', exp: '', cvv: '', installments: 1 });

  // Fetch live popup config from DB on mount (overrides stale SSR prop)
  useEffect(() => {
    fetch('/api/exit-popup/config')
      .then(r => r.ok ? r.json() : null)
      .then(cfg => { if (cfg) setLivePopupEnabled(cfg.isEnabled === true); })
      .catch(() => { /* silently keep SSR default */ });
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
  // exitDiscount overrides the normal PIX discount (from anti-exit popup)
  const effectivePrice = exitDiscount !== null
    ? exitDiscount
    : (step === 3 && paymentMethod === 'pix') ? (basePrice * (1 - pixDiscountVal) + shipping.price) : (basePrice + shipping.price);
  const finalPrice = effectivePrice;

  useEffect(() => {
    // Taboola Base Script
    if (pixels?.taboolaId && !document.getElementById('taboola-pixel')) {
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
      trackGoogleEvent('begin_checkout', {
        currency: 'BRL',
        value: product?.price || 0,
        items: [{ item_id: product?.id || 'default', item_name: product?.name || 'Produto', price: product?.price || 0, quantity: 1 }]
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

    // Tentar resolver CORS em localhost via Referrer Policy
    if (!document.getElementById('referrer-meta')) {
      const meta = document.createElement('meta');
      meta.id = 'referrer-meta';
      meta.name = 'referrer';
      meta.content = 'no-referrer-when-downgrade';
      document.head.appendChild(meta);
    }

    const timer = setInterval(() => setTimeLeft(prev => prev > 0 ? prev - 1 : 0), 1000);

    // ── Funnel Tracking Logic ──
    const searchParams = new URLSearchParams(window.location.search);
    const utmData = {
      productId: product?.id,
      source: searchParams.get('utm_source'),
      medium: searchParams.get('utm_medium'),
      campaign: searchParams.get('utm_campaign'),
      term: searchParams.get('utm_term'),
      content: searchParams.get('utm_content'),
      placement: searchParams.get('utm_placement'),
      utmId: searchParams.get('utm_id'),
      creativeName: searchParams.get('utm_creative_name'),
    };

    fetch('/api/checkout-access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(utmData)
    })
      .then(res => res.json())
      .then(res => {
        if (res.success) setAccessId(res.accessId);
      })
      .catch(e => console.error('Tracking Error:', e));

    // Restore orderId from localStorage if exists
    const savedId = localStorage.getItem('last_order_id');
    if (savedId) setOrderId(savedId);

    return () => clearInterval(timer);
  }, []);

  const updateTrackingStep = async (stepValue: number | string) => {
    if (!accessId) return;
    try {
      await fetch('/api/checkout-access', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessId, step: stepValue })
      });
    } catch (e) {
      console.error('Update Tracking Error:', e);
    }
  };

  useEffect(() => {
    if (step === 3 && lastTrackedStep < 3) {
      updateTrackingStep(3);
      setLastTrackedStep(3);
    } else if (step > lastTrackedStep && step < 3) {
      setLastTrackedStep(step);
    }
  }, [step, lastTrackedStep, accessId]);

  // Auto-save progress when payment method is selected
  useEffect(() => {
    if (step === 3 && paymentMethod && orderId) {
      saveOrderProgress({
        id: orderId,
        paymentMethod,
        lastStepReached: 3,
        paymentStatus: 'abandonado',
      });
      trackGoogleEvent('add_payment_info', {
        currency: 'BRL',
        value: finalPrice,
        payment_type: paymentMethod === 'pix' ? 'pix' : 'credit_card',
        items: [{ item_id: product?.id || 'default', item_name: product?.name || 'Produto', price: product?.price || 0, quantity: 1 }]
      });
    }
  }, [paymentMethod, step, orderId]);

  // Save partial address progress in Step 2 (debounced)
  useEffect(() => {
    if (step === 2 && orderId) {
      const timer = setTimeout(() => {
        saveOrderProgress({
          id: orderId,
          ...endereco,
          fullName: dados.nome,
          email: dados.email,
          phone: dados.telefone,
          cpf: customization?.disableCpf ? null : dados.cpf,
          productId: product?.id,
          totalPrice: finalPrice,
          lastStepReached: 2,
          paymentStatus: 'abandonado',
          utmSource: new URLSearchParams(window.location.search).get('utm_source'),
          utmMedium: new URLSearchParams(window.location.search).get('utm_medium'),
          utmCampaign: new URLSearchParams(window.location.search).get('utm_campaign'),
          utmTerm: new URLSearchParams(window.location.search).get('utm_term'),
          utmContent: new URLSearchParams(window.location.search).get('utm_content'),
          utmPlacement: new URLSearchParams(window.location.search).get('utm_placement'),
          utmId: new URLSearchParams(window.location.search).get('utm_id'),
          utmCreativeName: new URLSearchParams(window.location.search).get('utm_creative_name'),
        });
      }, 2000); // 2 second debounce
      return () => clearTimeout(timer);
    }
  }, [endereco, step, orderId, dados, customization?.disableCpf, product?.id, finalPrice]);

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
      if (cleanCpf.length > 0 && cleanCpf.length !== 11) {
        newErrors.cpf = 'CPF inválido';
      }
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length === 0) {
      // Auto-populate destinatario if empty
      if (!endereco.destinatario) {
        setEndereco(prev => ({ ...prev, destinatario: dados.nome }));
      }

      setStep1Loading(true);
      setStep(product?.isDigital ? 3 : 2);
      updateTrackingStep(1);
      trackGoogleEvent('add_contact_info', {
        currency: 'BRL',
        value: finalPrice,
        items: [{ item_id: product?.id || 'default', item_name: product?.name || 'Produto', price: product?.price || 0, quantity: 1 }]
      });
      window.scrollTo(0, 0);

      // Save Progress (Abandonment Lead)
      const searchParams = new URLSearchParams(window.location.search);
      saveOrderProgress({
        id: orderId,
        fullName: dados.nome,
        email: dados.email,
        phone: dados.telefone,
        cpf: customization?.disableCpf ? null : dados.cpf,
        productId: product?.id,
        totalPrice: finalPrice,
        lastStepReached: 1,
        paymentStatus: 'abandonado',
        utmSource: searchParams.get('utm_source'),
        utmMedium: searchParams.get('utm_medium'),
        utmCampaign: searchParams.get('utm_campaign'),
        utmTerm: searchParams.get('utm_term'),
        utmContent: searchParams.get('utm_content'),
        utmPlacement: searchParams.get('utm_placement'),
        utmId: searchParams.get('utm_id'),
        utmCreativeName: searchParams.get('utm_creative_name'),
      }).then(res => {
        setStep1Loading(false);
        if (res.success && res.id) {
          setOrderId(res.id);
          localStorage.setItem('last_order_id', res.id);
        }
      }).catch(() => setStep1Loading(false));

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
      updateTrackingStep(2);
      trackGoogleEvent('add_shipping_info', {
        currency: 'BRL',
        value: finalPrice,
        shipping_tier: shipping?.name || 'Standard',
        items: [{ item_id: product?.id || 'default', item_name: product?.name || 'Produto', price: product?.price || 0, quantity: 1 }]
      });
      window.scrollTo(0, 0);

      // Save Progress (Update with Address)
      saveOrderProgress({
        id: orderId,
        ...endereco,
        fullName: dados.nome,
        email: dados.email,
        phone: dados.telefone,
        cpf: customization?.disableCpf ? null : dados.cpf,
        productId: product?.id,
        totalPrice: finalPrice,
        lastStepReached: 2,
        paymentStatus: 'abandonado',
      });

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
        orderId: localStorage.getItem('last_order_id'),
        orderData: {
          ...dados,
          ...endereco,
          price: finalPrice,
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
          transaction_id: result.orderId || orderId || crypto.randomUUID(),
          value: finalPrice,
          currency: 'BRL',
          payment_type: paymentMethod === 'pix' ? 'pix' : 'credit_card',
          items: [{ item_id: product?.id || 'default', item_name: product?.name || 'Produto', price: product?.price || 0, quantity: 1 }]
        });

        // Google Ads: conversion event
        if (pixels?.googleId && pixels?.googleAdsConvLabel) {
          trackGoogleEvent('conversion', {
            send_to: `${pixels.googleId}/${pixels.googleAdsConvLabel}`,
            value: finalPrice,
            currency: 'BRL',
            transaction_id: result.orderId || orderId || ''
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
        updateTrackingStep('payment'); // Funnel Completed!
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
    <div className="progress-wrap" style={{ borderBottom: 'none', padding: '0 0 24px 0', background: 'transparent' }}>
      <div className="progress-inner">
        <div className="progress-steps">
          <div className="prog-step">
            <div className={`prog-circle ${step > 1 ? 'done' : step === 1 ? 'active' : 'next'}`}>{step > 1 ? '✓' : '1'}</div>
            <div className={`prog-label ${step > 1 ? 'done' : step === 1 ? 'active' : ''}`}>Seus Dados</div>
          </div>
          {!product?.isDigital && (
            <>
              <div className={`prog-line ${step > 1 ? 'done' : ''}`}></div>
              <div className="prog-step">
                <div className={`prog-circle ${step > 2 ? 'done' : step === 2 ? 'active' : 'next'}`}>{step > 2 ? '✓' : '2'}</div>
                <div className={`prog-label ${step > 2 ? 'done' : step === 2 ? 'active' : ''}`}>Entrega</div>
              </div>
            </>
          )}
          <div className={`prog-line ${step >= (product?.isDigital ? 3 : 2) ? 'done' : ''}`}></div>
          <div className="prog-step">
            <div className={`prog-circle ${step === 3 ? 'active' : 'next'}`}>{product?.isDigital ? '2' : '3'}</div>
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

          {paymentMethod === 'pix' ? (
            <>
              <div className="success-hero">
                <div className="check-circle-wrapper">
                  <svg viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="12" fill="#1a6b3a" />
                    <path d="M6 12.5l4 4 8-8" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <h1>Pedido Reservado!<br />Falta só o pagamento</h1>
                <p className="subtitle">Seu pedido está <strong>guardado por {formatTime(timeLeft)}.</strong><br />Finalize agora para garantir o envio hoje.</p>
              </div>

              <div className="urgency-bar">
                <div className="urgency-icon">⏰</div>
                <div className="urgency-text">
                  <div className="title" style={{ color: '#7a4a00' }}>Tempo restante para pagar:</div>
                  <div className="desc">Após isso, o pedido é liberado para outro cliente</div>
                </div>
                <div className="timer-display" style={{ color: timeLeft <= 120 ? '#c0392b' : 'inherit' }}>{formatTime(timeLeft)}</div>
              </div>

              <div className="pix-main-card">
                <div className="card-title">Pague com Pix — rápido e fácil</div>
                <div className="card-sub">Abra o app do seu banco e escaneie o QR Code abaixo</div>
                <div className="qr-wrapper">
                  {pixData?.qrCodeBase64 && (
                    <div className="qr-frame">
                      <img src={`data:image/jpeg;base64,${pixData.qrCodeBase64}`} alt="QR Code Pix" />
                    </div>
                  )}
                  <div className="or-divider"><span>ou copie o código</span></div>
                  <div className="pix-code-box">{pixData?.qrCode || 'Gerando código PIX...'}</div>
                  <button
                    className={`copy-btn ${copied ? 'copied' : ''}`}
                    onClick={() => {
                      if (pixData?.qrCode) navigator.clipboard.writeText(pixData.qrCode);
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

              <div className="social-proof">
                <div className="avatar-group">
                  <div className="avatar">MJ</div>
                  <div className="avatar">RS</div>
                  <div className="avatar">CA</div>
                </div>
                <div className="social-text">
                  <strong>47 pessoas compraram</strong> hoje. Maria de Santos pagou há 3 minutos e {product?.isDigital ? 'já recebeu o acesso no e-mail.' : 'já recebeu a confirmação por e-mail.'}
                </div>
              </div>

              <div className="pix-main-card" style={{ marginTop: '12px' }}>
                <div className="card-title" style={{ marginBottom: '14px' }}>O que acontece depois?</div>
                <div className="step-row">
                  <div className="step-num">1</div>
                  <div>
                    <div className="step-title">{product?.isDigital ? 'Acesso enviado para seu e-mail' : 'Confirmação por e-mail em minutos'}</div>
                    <div className="step-desc">{product?.isDigital ? `Assim que o pagamento for detectado, o link de acesso será enviado para ` : `Após o pagamento, você recebe a confirmação do pedido em `}<strong>{dados.email}</strong>.</div>
                  </div>
                </div>
                <div className="step-row">
                  <div className="step-num">2</div>
                  <div>
                    <div className="step-title">{product?.isDigital ? 'Verifique sua caixa de entrada' : 'Separação e envio do pedido'}</div>
                    <div className="step-desc">{product?.isDigital ? 'O e-mail chega em até 5 minutos. Verifique também sua pasta de Spam ou Promoções.' : 'Pagamentos feitos até as 14h saem no mesmo dia. Após isso, no próximo dia útil.'}</div>
                  </div>
                </div>
                {!product?.isDigital && (
                  <div className="step-row">
                    <div className="step-num">3</div>
                    <div>
                      <div className="step-title">Código de rastreio por e-mail</div>
                      <div className="step-desc">Assim que o pedido sair, você recebe o link de rastreio direto no seu e-mail.</div>
                    </div>
                  </div>
                )}
              </div>

              <div className="trust-strip-footer">
                <div className="trust-item"><div className="trust-dot"></div>Pix oficial do Banco Central</div>
                <div className="trust-item"><div className="trust-dot"></div>Dados criptografados</div>
                <div className="trust-item"><div className="trust-dot"></div>Compra garantida</div>
              </div>

              <div className="help-row">
                <p>Precisa de ajuda? <a href={`mailto:${customization?.supportEmail || 'suporte@loja.com'}`}>Entre em contato por e-mail</a></p>
              </div>
            </>
          ) : (
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
                  <div className="cc-order-id">Pedido <span>#{String(Date.now()).slice(-5)}</span></div>
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
                    <div className="cc-value cc-green">✓ Aprovado</div>
                  </div>
                  <div className="cc-receipt-row">
                    <div className="cc-label">Confirmação enviada para</div>
                    <div className="cc-value" style={{ fontSize: '13px' }}>{dados.email}</div>
                  </div>
                </div>
                <div className="cc-total-row">
                  <div className="cc-label">Total cobrado</div>
                  <div className="cc-total-value">R$ {(product?.price || 0).toFixed(2).replace('.', ',')}</div>
                </div>
              </div>

              {/* CARTÃO VISUAL */}
              <div className="cc-card-visual-wrap">
                <div className="cc-card-visual">
                  <div className="cc-card-chip"></div>
                  <div className="cc-card-number">•••• •••• •••• ••••</div>
                  <div className="cc-card-bottom">
                    <div>
                      <div className="cc-card-holder-label">Titular</div>
                      <div className="cc-card-holder-name">{(dados.nome || 'TITULAR').toUpperCase()}</div>
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
                    <div className="cc-step-text-title">{product?.isDigital ? 'Acesso imediato' : 'Separação e envio'}</div>
                    <div className="cc-step-text-desc">{product?.isDigital ? 'Seu link de acesso será liberado assim que o pagamento for confirmado.' : 'Pedidos confirmados até as 14h saem no mesmo dia. Após isso, no próximo dia útil.'}</div>
                  </div>
                </div>
                {!product?.isDigital && (
                  <div className="cc-step-item">
                    <div className="cc-step-dot">
                      <svg viewBox="0 0 24 24" fill="none"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#0d6e4a" /></svg>
                    </div>
                    <div>
                      <div className="cc-step-text-title">Rastreio por e-mail</div>
                      <div className="cc-step-text-desc">Assim que o pedido sair, você recebe o código de rastreio direto no e-mail.</div>
                    </div>
                  </div>
                )}
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
                Dúvidas? <a href={`mailto:${customization?.supportEmail || 'suporte@loja.com'}`}>Entre em contato por e-mail</a>
              </div>
            </div>
          )}
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
                      <label className="field-label">CPF <span style={{ fontWeight: 400, fontSize: '13px', color: '#94a3b8' }}>(Opcional)</span></label>
                      <input type="text" placeholder="000.000.000-00" maxLength={14} value={dados.cpf} onChange={e => handleMaskDados('cpf', e.target.value, formatCPF)} />
                      {errors.cpf && <div className="error-msg">⚠️ {errors.cpf}</div>}
                      <div className="field-hint-label">Necessário apenas para emissão de nota fiscal</div>
                    </div>
                  )}

                  <button className="main-cta" onClick={validateStep1} disabled={step1Loading}>
                    {step1Loading ? 'Carregando...' : (product?.isDigital ? 'Continuar para o Pagamento →' : 'Continuar para a Entrega →')}
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
                  {(shippingRules && shippingRules.length > 0 ? shippingRules : [
                    { name: 'Entrega Econômica', price: 0, delivery_time: 'Chega em até 7 dias úteis' }
                  ]).map((opt: any, idx: number) => (
                    <div key={idx} className={`frete-opt ${shipping.price === opt.price && shipping.name === opt.name ? 'selected' : ''}`} onClick={() => setShipping(opt)}>
                      <div className="frete-radio"></div>
                      <div className="frete-info">
                        <div className="frete-name">{opt.name} {opt.price === 0 && <span className="frete-tag">GRÁTIS</span>}</div>
                        <div className="frete-days">📅 {opt.delivery_time}</div>
                      </div>
                      <div className={`frete-price ${opt.price === 0 ? 'free' : ''}`}>{opt.price === 0 ? 'GRÁTIS' : `R$ ${Number(opt.price).toFixed(2).replace('.', ',')}`}</div>
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
                  <button className="back-link" onClick={() => setStep(product?.isDigital ? 1 : 2)}>← Voltar</button>
                  <div className="step-title"><span className="step-icon">💳</span> Passo {product?.isDigital ? '2' : '3'} — Pagamento</div>
                  <div className="step-sub">Escolha como prefere pagar. É simples e seguro!</div>

                  {pixDiscountVal > 0 && exitDiscount === null && (
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

                  <div className={`pay-card ${paymentMethod === 'pix' ? 'selected' : ''}`} onClick={() => setPaymentMethod('pix')}>
                    <div className="pay-radio"></div>
                    <div className="pay-icon-wrap">
                      <img src="https://pub-da9fd1c19b8e45d691d67626b9a7ba6d.r2.dev/1775608116043-2889edc1-1a70-456a-a32c-e3f050102347.png" alt="Pix" style={{ width: '32px', height: 'auto' }} />
                    </div>
                    <div className="pay-info">
                      <div className="pay-name">PIX</div>
                      <div className="pay-desc">Pague pelo aplicativo do banco — aprovação na hora</div>
                    </div>
                    {pixDiscountVal > 0 && exitDiscount === null && <div className="pay-tag green">{customization?.pixDiscount}% OFF</div>}
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
                <div
                  className="product-card-title"
                  onClick={() => setIsSummaryOpen(!isSummaryOpen)}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }}
                >
                  {isSummaryOpen ? (
                    <span>Resumo do Pedido</span>
                  ) : (
                    <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'space-between', fontSize: '15px', marginRight: '12px' }}>
                      <span style={{ fontWeight: 600, color: '#333', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px' }}>
                        {product?.name || "Kit Gel DermaVit"}
                      </span>
                      <span style={{ fontWeight: 800, color: '#1e293b' }}>
                        R$ {finalPrice.toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  )}
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    style={{
                      width: '20px',
                      height: '20px',
                      flexShrink: 0,
                      transform: isSummaryOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.3s ease'
                    }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                {isSummaryOpen && (
                  <>
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
                      {!product?.isDigital && (
                        <div className="price-row"><span>Frete</span><span className="green">{shipping.price === 0 ? 'GRÁTIS' : `R$ ${shipping.price.toFixed(2).replace('.', ',')}`}</span></div>
                      )}
                      {product?.isDigital && (
                        <div className="price-row"><span>Entrega Digital</span><span className="green">GRÁTIS</span></div>
                      )}
                      {step === 3 && paymentMethod === 'pix' && pixDiscountVal > 0 && (
                        <div className="price-row"><span>Desconto PIX ({customization?.pixDiscount}%)</span><span className="green">− R$ {(basePrice * pixDiscountVal).toFixed(2).replace('.', ',')}</span></div>
                      )}
                      <div className="price-row total"><span>Total</span><span>R$ {finalPrice.toFixed(2).replace('.', ',')}</span></div>
                    </div>
                  </>
                )}
              </div>

              <div className="trust-card">
                {product?.isDigital ? (
                  [
                    { icon: '✅', title: 'Acesso Imediato', p: 'Assim que o pagamento é confirmado, o link chega no seu e-mail em minutos. Sem espera, sem frete.' },
                    { icon: '🔄', title: 'Garantia de 7 Dias', p: 'Se não gostar por qualquer motivo, devolvemos 100% do seu dinheiro. Sem perguntas, sem burocracia.' },
                    { icon: '🔒', title: 'Compra Protegida', p: 'Seus dados pessoais e de pagamento estão completamente seguros. Ambiente criptografado e certificado.' }
                  ].map((t, i) => (
                    <div key={i} className="trust-item">
                      <div className="trust-icon">{t.icon}</div>
                      <div className="trust-text">
                        <div className="stars">★★★★★</div>
                        <h4>{t.title}</h4>
                        <p>{t.p}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  [
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
                  ))
                )}
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

      {livePopupEnabled && !done && (
        <ExitPopup
          productName={product?.name || 'Produto'}
          originalPrice={product?.price || basePrice}
          discountPct={exitPopupConfig.discountPct ?? 50}
          installments={exitPopupConfig.installments ?? 3}
          timerSeconds={exitPopupConfig.timerSeconds ?? 480}
          productId={product?.id}
          isEnabled={exitPopupConfig.isEnabled}
          canIntercept={step === 1}
          onAccept={(discountedPrice: number) => {
            setExitDiscount(discountedPrice)
            setPaymentMethod('pix')
          }}
          onDecline={() => { }}
        />
      )}
    </div>
  );
}
