'use client'

import { useState, useEffect } from 'react'
import { reportWebVitals } from '@/lib/web-vitals-reporter'
import PixParceladoSuccess from './PixParceladoSuccess'
import PixPayment from './PixPayment'
import './checkout.css'

const PIX_TTL = 10 * 60;

export default function CheckoutForm({ product, customization, shippingRules = [], availableBumps = [], pixels = {} }: any) {
    const [step, setStep] = useState(1);
    const [isSummaryOpen, setIsSummaryOpen] = useState(true);
    const [loading, setLoading] = useState(false);
    const [timeLeft, setTimeLeft] = useState(14 * 60 + 52);
    const [done, setDone] = useState(false);
    const [pixExpired, setPixExpired] = useState(false);
    const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
    const [pixLoading, setPixLoading] = useState(false);
    const [pixPaid, setPixPaid] = useState(false);
    const [pixChecking, setPixChecking] = useState(false);
    const [declined, setDeclined] = useState(false);
    const [declinedOrderId, setDeclinedOrderId] = useState('');
    const [step1Loading, setStep1Loading] = useState(false);
    const [cepResolved, setCepResolved] = useState(false);
    const [cepLoading, setCepLoading] = useState(false);
    const [cepFound, setCepFound] = useState<boolean | null>(null);

    const [dados, setDados] = useState({ nome: '', email: '', telefone: '', cpf: '', nascimento: '' });
    const [endereco, setEndereco] = useState({ cep: '', rua: '', numero: '', complemento: '', bairro: '', cidade: '', estado: 'SP', destinatario: '' });
    const defaultShipping = shippingRules && shippingRules.length > 0
        ? shippingRules[0]
        : { name: 'Entrega Econômica', price: 0, delivery_time: '7' };
    const [shipping, setShipping] = useState(defaultShipping);
    const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card' | 'pix_automatico' | ''>('');
    const [pixData, setPixData] = useState<{ qrCode: string, qrCodeBase64: string } | null>(null);
    const [subData, setSubData] = useState<{ mandateId: string, mandateStatus: string, qrCodeBase64: string, emv: string, resumed: boolean } | null>(null);
    const [subLoading, setSubLoading] = useState(false);
    const minInstallmentValue: number = product?.minInstallmentValue ?? 49.90;
    const pixTotal: number = product?.pixPrice ? Number(product.pixPrice) : (product?.price || 0);
    const parcelasOpcoes: number[] = [2, 3, 4, 5, 6, 7, 8].filter(n => pixTotal / n >= minInstallmentValue);
    const parcelasMin = parcelasOpcoes[0] ?? 2;
    const parcelasMax = parcelasOpcoes[parcelasOpcoes.length - 1] ?? 6;
    const [parcelas, setParcelas] = useState<number>(() => parcelasMax);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [cardData, setCardData] = useState({ number: '', name: '', exp: '', cvv: '', installments: 1 });
    const [cardErrors, setCardErrors] = useState<Record<string, string>>({});
    const [cardTokenizing, setCardTokenizing] = useState(false);
    const [selectedBumps, setSelectedBumps] = useState<string[]>([]);
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const testMode = params.get('test');
        const stepParam = params.get('step');
        const previewParam = params.get('preview');

        const fakeDados = { nome: 'João da Silva', email: 'teste@pagflow.com', telefone: '(11) 91234-5678', cpf: '', nascimento: '' };
        const fakeEndereco = { cep: '01310-100', rua: 'Av. Paulista', numero: '1000', complemento: 'Apto 101', bairro: 'Bela Vista', cidade: 'São Paulo', estado: 'SP', destinatario: 'João da Silva' };
        const fakeQr = { qrCode: '00020126580014br.gov.bcb.pix013688735ef-c3ea-420c-a616-6a4fc9d061a520400005303986', qrCodeBase64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==' };

        if (stepParam === '2') {
            setDados(fakeDados);
            setStep(2);
        } else if (stepParam === '3') {
            setDados(fakeDados);
            setEndereco(fakeEndereco);
            setStep(3);
        } else if (previewParam === 'pix') {
            setDados(fakeDados);
            setEndereco(fakeEndereco);
            setPaymentMethod('pix');
            setPixData(fakeQr);
            setStep(3);
        } else if (previewParam === 'confirmacao') {
            setDados(fakeDados);
            setPaymentMethod('card');
            setDone(true);
        } else if (previewParam === 'pix-pago') {
            setDados(fakeDados);
            setPaymentMethod('pix');
            setPixData(fakeQr);
            setPixPaid(true);
            setDone(true);
        } else if (previewParam === 'pix-qr' || testMode === 'pix') {
            setDados(fakeDados);
            setPaymentMethod('pix');
            setPixData(fakeQr);
            setTimeLeft(PIX_TTL);
            setDone(true);
        } else if (testMode === 'card') {
            setPaymentMethod('card');
            setDone(true);
        }
    }, []);

    const getVisitorId = () => {
        if (typeof window === 'undefined') return '';
        try {
            let vid = window.localStorage.getItem('pf_vid');
            if (!vid) {
                vid = crypto.randomUUID();
                window.localStorage.setItem('pf_vid', vid);
            }
            return vid;
        } catch {
            return '';
        }
    };

    const getUrlParams = () => {
        if (typeof window === 'undefined') return {} as Record<string, string | null>;
        const p = new URLSearchParams(window.location.search);
        return {
            clickId: p.get('tblci'),
            utmSource: p.get('utm_source'),
            utmMedium: p.get('utm_medium'),
            utmCampaign: p.get('utm_campaign'),
            utmTerm: p.get('utm_term'),
            utmContent: p.get('utm_content'),
        };
    };

    const trackFunnel = (step: string, orderId?: string) => {
        if (typeof window === 'undefined') return;
        try {
            const visitorId = getVisitorId();
            if (!visitorId) return;
            const params = getUrlParams();
            fetch('/api/track', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    visitorId,
                    step,
                    productId: product?.id || null,
                    orderId: orderId || null,
                    ...params,
                }),
                keepalive: true,
            }).catch(() => {});
        } catch {}
    };

    const trackTaboolaEvent = (eventName: string, data: any = {}) => {
        if (typeof window === 'undefined') return;
        const _tfa = (window as any)._tfa || [];

        // Global Taboola pixel
        if (pixels?.taboolaId) {
            _tfa.push({ notify: 'event', name: eventName, id: pixels.taboolaId, ...data });
        }

        // Per-product Taboola pixels
        if (pixels?.perProduct) {
            const taboolaPixels = pixels.perProduct.filter((p: any) => p.type === 'taboola')
            for (const pixel of taboolaPixels) {
                _tfa.push({ notify: 'event', name: eventName, id: pixel.pixelId, ...data });
            }
        }
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

    // Preço por parcela = pixTotal (preço PIX Parcelado) ÷ n
    const pixValorParcela = (n: number) => pixTotal / n;
    const pixTotalParcelado = (n: number) => pixValorParcela(n) * n;

    const bumpsTotal = (availableBumps || [])
        .filter((b: any) => selectedBumps.includes(b.id))
        .reduce((sum: number, b: any) => sum + (b.price || 0), 0);

    const subtotalBeforeDiscount = basePrice + bumpsTotal;
    const effectivePrice = (step === 3 && paymentMethod === 'pix')
        ? (subtotalBeforeDiscount * (1 - pixDiscountVal) + shipping.price)
        : (subtotalBeforeDiscount + shipping.price);
    const finalPrice = effectivePrice;

    useEffect(() => {
        // Validar IDs de pixel (apenas alfanumérico e hífen)
        const isValidPixelId = (id: string) => /^[a-zA-Z0-9_-]+$/.test(id);

        // Taboola Base Script - Global
        if (pixels?.taboolaId && isValidPixelId(pixels.taboolaId) && !document.getElementById('taboola-pixel')) {
            const _tfa = (window as any)._tfa || [];
            (window as any)._tfa = _tfa;
            const s = document.createElement('script');
            s.id = 'taboola-pixel';
            s.async = true;
            s.src = `https://cdn.taboola.com/libtr/${pixels.taboolaId}/tfa.js`;
            document.head.appendChild(s);
        }

        // Taboola Base Script - Per-Product Pixels
        if (pixels?.perProduct) {
            const _tfa = (window as any)._tfa || [];
            (window as any)._tfa = _tfa;
            const taboolaPixels = pixels.perProduct.filter((p: any) => p.type === 'taboola')
            for (const pixel of taboolaPixels) {
                if (isValidPixelId(pixel.pixelId) && !document.getElementById(`taboola-pixel-${pixel.pixelId}`)) {
                    const s = document.createElement('script');
                    s.id = `taboola-pixel-${pixel.pixelId}`;
                    s.async = true;
                    s.src = `https://cdn.taboola.com/libtr/${pixel.pixelId}/tfa.js`;
                    document.head.appendChild(s);
                }
            }
        }

        // Track start_checkout for all Taboola pixels
        // Produtos podem sobrescrever o evento padrão via product.startCheckoutEventName
        trackTaboolaEvent(product?.startCheckoutEventName || 'start_checkout');
        trackFunnel('page_view');
        reportWebVitals(getVisitorId());

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

    // ── PIX: Polling de status ──
    const checkPixStatus = async () => {
        if (!currentOrderId) return false;
        try {
            const res = await fetch(`/api/order-status/${currentOrderId}`);
            if (res.ok) {
                const data = await res.json();
                if (data.paymentStatus === 'pago') {
                    setPixPaid(true);
                    window.scrollTo(0, 0);
                    return true;
                }
            }
        } catch { }
        return false;
    };

    const checkPixNow = async () => {
        setPixChecking(true);
        await checkPixStatus();
        // Feedback mínimo perceptível mesmo quando a resposta é instantânea
        setTimeout(() => setPixChecking(false), 600);
    };

    useEffect(() => {
        if (!done || paymentMethod !== 'pix' || !currentOrderId || pixPaid) return;
        // Continua consultando mesmo após expirar: o cliente pode ter pago no último segundo
        const pollInterval = setInterval(checkPixStatus, 5000);
        return () => clearInterval(pollInterval);
    }, [done, paymentMethod, currentOrderId, pixPaid]);

    const regenerarPix = async () => {
        setPixLoading(true);
        try {
            const res = await fetch('/api/process-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    method: 'pix',
                    orderId: currentOrderId,
                    orderData: {
                        ...dados,
                        ...endereco,
                        price: finalPrice,
                        shippingPrice: shipping?.price || 0,
                        productId: product?.id || 'default',
                        selectedBumpIds: selectedBumps,
                    },
                })
            });
            const result = await res.json();
            if (result.success && result.qrCodeBase64) {
                setPixData({ qrCode: result.qrCode, qrCodeBase64: result.qrCodeBase64 });
                setTimeLeft(PIX_TTL);
                setPixExpired(false);
                setCurrentOrderId(result.orderId || currentOrderId);
            } else {
                alert(result.error || "Erro ao gerar novo PIX. Tente novamente.");
            }
        } catch {
            alert("Erro de conexão. Tente novamente.");
        } finally {
            setPixLoading(false);
        }
    };

    // ── PIX: Timer expirou → marcar como expirado ──
    useEffect(() => {
        if (done && paymentMethod === 'pix' && timeLeft <= 0 && !pixExpired) {
            setPixExpired(true);
        }
    }, [done, paymentMethod, timeLeft, pixExpired]);

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
            setCepLoading(true);
            setCepFound(null);
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
                    setCepFound(true);
                    setErrors(prev => { const n = { ...prev }; delete n.cep; return n; });
                } else {
                    setCepFound(false);
                }
            } catch (e) {
                setCepFound(false);
            } finally {
                // Mesmo sem achar o CEP, libera os campos para o cliente digitar o endereço à mão
                setCepResolved(true);
                setCepLoading(false);
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

    const formatDate = (v: string) => {
        let d = v.replace(/\D/g, '').slice(0, 8);
        if (d.length > 4) return d.replace(/(\d{2})(\d{2})(\d{1,4})/, '$1/$2/$3');
        if (d.length > 2) return d.replace(/(\d{2})(\d{1,2})/, '$1/$2');
        return d;
    };
    const parseDateToISO = (v: string) => {
        const parts = v.replace(/\D/g, '');
        if (parts.length !== 8) return undefined;
        return `${parts.slice(4)}-${parts.slice(2, 4)}-${parts.slice(0, 2)}`;
    };

    const formatTel = (v: string) => {
        let clean = v.replace(/\D/g, '').slice(0, 11);
        if (clean.length <= 10) {
            return clean.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2');
        } else {
            return clean.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2');
        }
    };

    // Opções clicáveis (entrega/pagamento) também funcionam pelo teclado e leitor de tela
    const pickable = (selected: boolean, onPick: () => void) => ({
        role: 'radio' as const,
        'aria-checked': selected,
        tabIndex: 0,
        onClick: onPick,
        onKeyDown: (e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPick(); } },
    });

    // Leva o cliente direto ao primeiro campo com erro (quem não vê bem não percebe o aviso fora da tela)
    const focusFirstError = () => {
        setTimeout(() => {
            const el = document.querySelector<HTMLElement>('.screen.active .field.error input, .screen.active .field.error select');
            if (!el) return;
            el.scrollIntoView({ block: 'center', behavior: 'smooth' });
            el.focus({ preventScroll: true });
        }, 50);
    };

    // Ao chegar na etapa de entrega, o cursor já fica no CEP
    useEffect(() => {
        if (step === 2 && !endereco.cep) {
            setTimeout(() => document.getElementById('ck-cep')?.focus({ preventScroll: true }), 50);
        }
    }, [step]);

    const validateStep1 = () => {
        let newErrors: Record<string, string> = {};
        if (!dados.nome) newErrors.nome = 'Informe seu nome completo';

        // Validação robusta de e-mail
        const email = (dados.email || '').trim().toLowerCase();
        if (!email) {
            newErrors.email = 'Informe seu e-mail';
        } else {
            // Lista de provedores e TLDs válidos
            const validDomains = [
                'gmail.com', 'outlook.com', 'outlook.com.br', 'hotmail.com', 'hotmail.com.br',
                'yahoo.com', 'yahoo.com.br', 'icloud.com', 'me.com', 'mac.com', 'live.com',
                'live.com.br', 'uol.com.br', 'bol.com.br', 'terra.com.br', 'globo.com',
                'ig.com.br', 'r7.com', 'zipmail.com.br', 'msn.com', 'protonmail.com',
                'proton.me', 'zoho.com', 'mail.com', 'yandex.com', 'fastmail.com',
                'aol.com', 'mailbox.org', 'tutanota.com', 'pm.me'
            ];
            const validTLDs = [
                'com', 'com.br', 'net', 'net.br', 'org', 'org.br', 'edu', 'edu.br',
                'gov', 'gov.br', 'mil', 'br', 'io', 'co', 'app', 'dev', 'tech',
                'store', 'online', 'site', 'info', 'biz', 'me', 'tv', 'cc',
                'us', 'uk', 'pt', 'es', 'fr', 'de', 'it', 'jp', 'au', 'ca'
            ];

            // Formato básico: algo@algo.algo
            const basicRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
            if (!basicRegex.test(email)) {
                newErrors.email = 'E-mail incompleto — confira se tem o @ e o final (ex: @gmail.com)';
            } else {
                const [localPart, domain] = email.split('@');
                // Verificar parte local
                if (!localPart || localPart.length < 2) {
                    newErrors.email = 'E-mail incompleto';
                }
                // Verificar domínio: deve ter pelo menos um ponto e TLD válido
                else if (!domain || !domain.includes('.')) {
                    newErrors.email = 'Domínio de e-mail inválido';
                }
                else {
                    // Extrair TLD (tudo após o último ponto)
                    const lastDot = domain.lastIndexOf('.');
                    const tld = domain.substring(lastDot + 1);
                    const fullTld = domain.includes('.') ? domain.split('.').slice(1).join('.') : '';

                    // Verificar se o TLD é válido (2+ chars ou na lista)
                    if (tld.length < 2) {
                        newErrors.email = 'Domínio de e-mail inválido — verifique o final';
                    }
                    // Verificar se é um domínio conhecido OU tem TLD válido
                    else if (!validDomains.includes(domain) && !validTLDs.includes(fullTld) && !validTLDs.includes(tld)) {
                        newErrors.email = 'Domínio não reconhecido — use Gmail, Outlook, Yahoo ou outro provedor válido';
                    }
                    // Verificar se o domínio não começa ou termina com hífen
                    else if (domain.startsWith('-') || domain.endsWith('-') || domain.startsWith('.')) {
                        newErrors.email = 'Formato de e-mail inválido';
                    }
                }
            }
        }

        const cleanTel = dados.telefone.replace(/\D/g, '');
        if (cleanTel.length < 10) newErrors.telefone = 'Celular incompleto — digite o DDD e o número';

        if (!customization?.disableCpf) {
            const cleanCpf = dados.cpf.replace(/\D/g, '');
            if (cleanCpf.length > 0 && cleanCpf.length !== 11) {
                newErrors.cpf = 'CPF incompleto — confira os 11 números';
            }
        }

        setErrors(newErrors);
        if (Object.keys(newErrors).length === 0) {
            if (!endereco.destinatario) {
                setEndereco(prev => ({ ...prev, destinatario: dados.nome }));
            }

            setStep(2);
            trackFunnel('dados_completo');
            trackGoogleEvent('add_contact_info', {
                currency: 'BRL',
                value: finalPrice,
                items: [{ item_id: product?.id || 'default', item_name: product?.name || 'Produto', price: product?.price || 0, quantity: 1 }]
            });
            window.scrollTo(0, 0);

            return true;
        }
        focusFirstError();
        return false;
    };

    const validateStep2 = () => {
        let newErrors: Record<string, string> = {};
        if (endereco.cep.replace(/\D/g, '').length !== 8) newErrors.cep = 'CEP incompleto — são 8 números';
        if (!endereco.rua) newErrors.rua = 'Informe a rua';
        if (!endereco.numero) newErrors.numero = 'Informe o número';
        if (!endereco.complemento) newErrors.complemento = 'Informe o complemento (se não tiver, escreva "Casa")';
        if (!endereco.bairro) newErrors.bairro = 'Informe o bairro';
        if (!endereco.cidade) newErrors.cidade = 'Informe a cidade';
        if (!endereco.estado) newErrors.estado = 'Selecione o estado';

        setErrors(newErrors);
        if (Object.keys(newErrors).length === 0) {
            setStep(3);
            trackFunnel('entrega_completa');
            trackGoogleEvent('add_shipping_info', {
                currency: 'BRL',
                value: finalPrice,
                shipping_tier: shipping?.name || 'Standard',
                items: [{ item_id: product?.id || 'default', item_name: product?.name || 'Produto', price: product?.price || 0, quantity: 1 }]
            });
            window.scrollTo(0, 0);

            return true;
        }
        focusFirstError();
        return false;
    };

    async function finalizarAssinatura() {
        setSubLoading(true);
        try {
            const res = await fetch('/api/subscription/enroll', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productId: product?.id,
                    parcelas,
                    orderData: {
                        nome: dados.nome,
                        email: dados.email,
                        telefone: dados.telefone,
                        cpf: dados.cpf,
                        cep: endereco.cep,
                        rua: endereco.rua,
                        numero: endereco.numero,
                        complemento: endereco.complemento,
                        bairro: endereco.bairro,
                        cidade: endereco.cidade,
                        estado: endereco.estado,
                        shippingPrice: shipping?.price || 0,
                        selectedBumpIds: selectedBumps,
                        visitorId: getVisitorId(),
                        clickId: new URLSearchParams(window.location.search).get('tblci'),
                        utmSource: new URLSearchParams(window.location.search).get('utm_source'),
                        utmMedium: new URLSearchParams(window.location.search).get('utm_medium'),
                        utmCampaign: new URLSearchParams(window.location.search).get('utm_campaign'),
                        utmTerm: new URLSearchParams(window.location.search).get('utm_term'),
                        utmContent: new URLSearchParams(window.location.search).get('utm_content'),
                    }
                }),
            });
            const result = await res.json();
            if (result.success) {
                trackTaboolaEvent(product?.purchaseEventName || 'make_purchase', { revenue: pixTotal, currency: 'BRL' });
                trackGoogleEvent('purchase', {
                    transaction_id: result.orderId || crypto.randomUUID(),
                    value: pixTotal,
                    currency: 'BRL',
                    payment_type: 'pix_automatico',
                    items: [{ item_id: product?.id || 'default', item_name: product?.name || 'Produto', price: pixTotal, quantity: 1 }]
                });
                if (pixels?.googleId && pixels?.googleAdsConvLabel && /^[a-zA-Z0-9_-]+$/.test(pixels.googleId) && /^[a-zA-Z0-9_-]+$/.test(pixels.googleAdsConvLabel)) {
                    trackGoogleEvent('conversion', {
                        send_to: `${pixels.googleId}/${pixels.googleAdsConvLabel}`,
                        value: pixTotal,
                        currency: 'BRL',
                        transaction_id: result.orderId || ''
                    });
                }
                trackFunnel('pedido_criado', result.orderId);
                setSubData({ mandateId: result.mandateId, mandateStatus: result.mandateStatus, qrCodeBase64: result.qrCodeBase64 || '', emv: result.emv || '', resumed: result.resumed || false });
                setCurrentOrderId(result.orderId);
                setDone(true);
            } else {
                alert(result.error || 'Erro ao criar PIX Parcelado.');
            }
        } catch (e: any) {
            alert('Erro ao criar PIX Parcelado: ' + e.message);
        } finally {
            setSubLoading(false);
        }
    }

    async function finalizar(pagarmeCardData?: { pagarmeToken: string; brand: string; installments: number; totalWithInterest?: number }) {
        setLoading(true);
        trackFunnel('pagamento_iniciado');
        try {
            const currentMethod = paymentMethod === 'card' ? 'credit_card' : paymentMethod;

            const searchParams = new URLSearchParams(window.location.search);
            const payload: any = {
                method: currentMethod,
                pagarmeData: pagarmeCardData ? {
                    cardToken: pagarmeCardData.pagarmeToken,
                    brand: pagarmeCardData.brand,
                    installments: pagarmeCardData.installments,
                    totalWithInterest: pagarmeCardData.totalWithInterest,
                } : undefined,
                orderId: currentOrderId || null,
                orderData: {
                    ...dados,
                    ...endereco,
                    price: finalPrice,
                    shippingPrice: shipping?.price || 0,
                    productId: product?.id || 'default',
                    selectedBumpIds: selectedBumps,
                    utmSource: searchParams.get('utm_source'),
                    utmMedium: searchParams.get('utm_medium'),
                    utmCampaign: searchParams.get('utm_campaign'),
                    utmTerm: searchParams.get('utm_term'),
                    utmContent: searchParams.get('utm_content'),
                    utmPlacement: searchParams.get('utm_placement'),
                    utmId: searchParams.get('utm_id'),
                    utmCreativeName: searchParams.get('utm_creative_name'),
                    clickId: searchParams.get('tblci'),
                    visitorId: getVisitorId(),
                },
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
                trackFunnel('pedido_criado', result.orderId);

                // Taboola: Track EVERY attempt (approved, declined, pending Pix)
                // Produtos podem sobrescrever o evento padrão via product.purchaseEventName
                trackTaboolaEvent(product?.purchaseEventName || 'make_purchase', { revenue: finalPrice, currency: 'BRL' });

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
                    setDeclinedOrderId(result.orderId || '');
                    setDeclined(true);
                    setLoading(false);
                    return;
                }
                setCurrentOrderId(result.orderId || null);
                if (result.qrCodeBase64) {
                    setPixData({ qrCode: result.qrCode, qrCodeBase64: result.qrCodeBase64 });
                    setTimeLeft(PIX_TTL);
                    setPixExpired(false);
                    setDone(true);
                } else if (paymentMethod === 'pix') {
                    // PIX sem QR code — vai pra tela de processando com retry
                    setDone(true);
                } else {
                    setDone(true);
                }
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

    // Detecta bandeira do cartão pelo número
    const detectCardBrand = (num: string): string => {
        const n = num.replace(/\s/g, '');
        if (/^4/.test(n)) return 'visa';
        if (/^5[1-5]/.test(n) || /^2(2[2-9][1-9]|[3-6]\d{2}|7[01]\d|720)/.test(n)) return 'mastercard';
        if (/^3[47]/.test(n)) return 'amex';
        if (/^(606282|3841)/.test(n)) return 'hipercard';
        if (/^(4011|4312|4389|4514|4576|5041|5066|5067|509|6277|6362|6363|650|6516|6550)/.test(n)) return 'elo';
        return 'unknown';
    };

    // Formata número do cartão com espaços
    const formatCardNumber = (v: string): string => {
        const n = v.replace(/\D/g, '').slice(0, 16);
        return n.replace(/(\d{4})/g, '$1 ').trim();
    };

    // Formata expiração MM/AA
    const formatExpiry = (v: string): string => {
        const n = v.replace(/\D/g, '').slice(0, 4);
        if (n.length >= 3) return n.slice(0, 2) + '/' + n.slice(2);
        return n;
    };

    // Opções de parcelamento para cartão — independente do PIX Parcelado
    const CARD_MIN_INSTALLMENT = 9.9;
    const CARD_FREE_INSTALLMENTS = 1;  // só 1x sem juros
    const CARD_INTEREST_RATE = 0.05;   // 5% a.m. juros simples
    // 1x: sem juros. 2-18x: price * (1 + 0.05 * n) / n
    const calcInstallmentValue = (total: number, n: number): number => {
        if (n <= CARD_FREE_INSTALLMENTS) return total / n;
        return total * (1 + CARD_INTEREST_RATE * n) / n;
    };
    const cardInstallmentOptions: { n: number; val: number; hasInterest: boolean }[] = (() => {
        const opts: { n: number; val: number; hasInterest: boolean }[] = [];
        for (let i = 1; i <= 18; i++) {
            const val = calcInstallmentValue(finalPrice, i);
            if (i === 1 || val >= CARD_MIN_INSTALLMENT) {
                opts.push({ n: i, val, hasInterest: i > CARD_FREE_INSTALLMENTS });
            }
        }
        return opts;
    })();
    const maxInstallments = cardInstallmentOptions[cardInstallmentOptions.length - 1]?.n ?? 1;

    useEffect(() => {
        if (maxInstallments > 1) {
            setCardData(p => ({ ...p, installments: maxInstallments }));
        }
    }, [maxInstallments]);

    // Tokeniza cartão no Pagar.me e chama finalizar
    const finalizarCartao = async () => {
        const errs: Record<string, string> = {};
        const num = cardData.number.replace(/\s/g, '');
        if (num.length < 13) errs.number = 'Número do cartão inválido';
        if (!cardData.name.trim()) errs.name = 'Nome no cartão obrigatório';
        const expParts = cardData.exp.split('/');
        if (expParts.length !== 2 || expParts[0].length !== 2 || expParts[1].length !== 2)
            errs.exp = 'Validade inválida (MM/AA)';
        if (cardData.cvv.length < 3) errs.cvv = 'CVV inválido';
        const cleanCpf = dados.cpf.replace(/\D/g, '');
        if (!cleanCpf || cleanCpf.length !== 11) errs.cpf = 'CPF obrigatório para cartão';
        const nasc = parseDateToISO(dados.nascimento);
        const nascDate = nasc ? new Date(nasc + 'T12:00:00') : null;
        const age = nascDate ? (Date.now() - nascDate.getTime()) / (365.25 * 24 * 3600 * 1000) : NaN;
        if (!nascDate || isNaN(age) || age < 16 || age > 110 || nascDate.toISOString().slice(0, 10) !== nasc) errs.nascimento = 'Data de nascimento inválida';
        if (!dados.email.trim()) errs.email = 'E-mail obrigatório para cartão';
        if (endereco.cep.replace(/\D/g, '').length !== 8) errs.cep = 'CEP obrigatório';
        if (!endereco.rua.trim()) errs.rua = 'Rua obrigatória';
        if (!endereco.numero.trim()) errs.numero = 'Número obrigatório';
        if (!endereco.bairro.trim()) errs.bairro = 'Bairro obrigatório';
        if (!endereco.cidade.trim()) errs.cidade = 'Cidade obrigatória';
        if (!/^[A-Za-z]{2}$/.test(endereco.estado.trim())) errs.estado = 'UF inválida';

        setCardErrors(errs);
        if (Object.keys(errs).length > 0) { focusFirstError(); return; }

        setCardTokenizing(true);
        try {
            const publicKey = process.env.NEXT_PUBLIC_PAGARME_PUBLIC_KEY;
            const tokenRes = await fetch(
                `https://api.pagar.me/core/v5/tokens?appId=${publicKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: 'card',
                        card: {
                            number: num,
                            holder_name: cardData.name.trim(),
                            exp_month: parseInt(expParts[0], 10),
                            exp_year: parseInt(expParts[1], 10),
                            cvv: cardData.cvv,
                        },
                    }),
                }
            );
            const tokenData = await tokenRes.json();
            if (!tokenRes.ok || !tokenData.id) {
                const errMsg = tokenData?.message || tokenData?.errors?.[0]?.message || 'Erro ao tokenizar cartão';
                alert(errMsg);
                return;
            }

            const brand = tokenData.card?.brand?.toLowerCase() || detectCardBrand(num);
            const chosenInstallments = cardData.installments;
            const installmentVal = calcInstallmentValue(finalPrice, chosenInstallments);
            const totalWithInterest = parseFloat((installmentVal * chosenInstallments).toFixed(2));
            await finalizar({ pagarmeToken: tokenData.id, brand, installments: chosenInstallments, totalWithInterest });
        } catch (e: any) {
            alert('Erro ao processar cartão: ' + e.message);
        } finally {
            setCardTokenizing(false);
        }
    };

    const renderProgressBar = () => (
        <div className="progress">
            <div className="progress-inner">
                <div className="prog-step">
                    <div className={`prog-dot ${step > 1 ? 'done' : step === 1 ? 'active' : 'next'}`}>{step > 1 ? '✓' : '1'}</div>
                    <div className={`prog-lbl ${step > 1 ? 'done' : step === 1 ? 'active' : ''}`}>Seus Dados</div>
                </div>
                <div className={`prog-line ${step > 1 ? 'done' : ''}`}></div>
                <div className="prog-step">
                    <div className={`prog-dot ${step > 2 ? 'done' : step === 2 ? 'active' : 'next'}`}>{step > 2 ? '✓' : '2'}</div>
                    <div className={`prog-lbl ${step > 2 ? 'done' : step === 2 ? 'active' : ''}`}>Entrega</div>
                </div>
                <div className={`prog-line ${step >= 2 ? 'done' : ''}`}></div>
                <div className="prog-step">
                    <div className={`prog-dot ${step === 3 ? 'active' : 'next'}`}>3</div>
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
            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes pulse-badge { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
                @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
            ` }} />
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

            {declined ? (
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
                        <div className="cc-hero">
                            <div className="cc-red-circle">
                                <svg viewBox="0 0 88 88" fill="none">
                                    <circle cx="44" cy="44" r="40" fill="rgba(184,48,48,0.08)" stroke="rgba(184,48,48,0.2)" strokeWidth="1.5" />
                                    <circle cx="44" cy="44" r="30" fill="rgba(184,48,48,0.1)" />
                                    <circle cx="44" cy="44" r="22" fill="#fff" />
                                    <path d="M34 34l20 20M54 34l-20 20" stroke="#B83030" strokeWidth="3" strokeLinecap="round" />
                                </svg>
                            </div>
                            <h1 className="cc-hero-title" style={{ color: '#B83030' }}>Pagamento Recusado</h1>
                            <p className="cc-hero-sub">A operadora não aprovou esta transação.<br />Isso pode acontecer por diversos motivos.</p>
                        </div>

                        <div className="cc-receipt">
                            <div className="cc-receipt-header">
                                <div className="cc-tag cc-tag-red">Recusado</div>
                                <div className="cc-order-id">Pedido <span>#{declinedOrderId?.slice(0, 6) || '------'}</span></div>
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
                                    <div className="cc-value" style={{ color: '#b8933a' }}>R$ {finalPrice.toFixed(2).replace('.', ',')}</div>
                                </div>
                            </div>
                            <div className="cc-total-row">
                                <div className="cc-label">Total</div>
                                <div className="cc-total-value">R$ {finalPrice.toFixed(2).replace('.', ',')}</div>
                            </div>
                        </div>

                        <div className="cc-steps-card">
                            <div className="cc-steps-title">Possíveis motivos</div>
                            <div className="cc-step-item">
                                <div className="cc-step-dot" style={{ background: '#FDECEA' }}>
                                    <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="#B83030" opacity="0.15" /><path d="M12 8v4m0 4h.01" stroke="#B83030" strokeWidth="2" strokeLinecap="round" /></svg>
                                </div>
                                <div>
                                    <div className="cc-step-text-title">Limite insuficiente</div>
                                    <div className="cc-step-text-desc">Seu cartão pode não ter saldo disponível para esta compra.</div>
                                </div>
                            </div>
                            <div className="cc-step-item">
                                <div className="cc-step-dot" style={{ background: '#FDECEA' }}>
                                    <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="#B83030" opacity="0.15" /><path d="M12 8v4m0 4h.01" stroke="#B83030" strokeWidth="2" strokeLinecap="round" /></svg>
                                </div>
                                <div>
                                    <div className="cc-step-text-title">Dados incorretos</div>
                                    <div className="cc-step-text-desc">Número, validade ou CVV podem ter sido digitados errado.</div>
                                </div>
                            </div>
                            <div className="cc-step-item">
                                <div className="cc-step-dot" style={{ background: '#FDECEA' }}>
                                    <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="#B83030" opacity="0.15" /><path d="M12 8v4m0 4h.01" stroke="#B83030" strokeWidth="2" strokeLinecap="round" /></svg>
                                </div>
                                <div>
                                    <div className="cc-step-text-title">Bloqueio do banco</div>
                                    <div className="cc-step-text-desc">Seu banco pode ter bloqueado a compra por segurança. Tente autorizar ou use outro cartão.</div>
                                </div>
                            </div>
                        </div>

                        <button className="cc-retry-btn" onClick={() => { setDeclined(false); setPaymentMethod('card'); setStep(3); }}>
                            <svg viewBox="0 0 24 24" fill="none"><path d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" fill="currentColor" /></svg>
                            Tentar novamente
                        </button>

                        <button className="cc-pix-btn" onClick={() => { setDeclined(false); setPaymentMethod('pix'); setStep(3); }}>
                            <svg viewBox="0 0 24 24" fill="none"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="#1D9A52" /></svg>
                            Pagar com PIX (desconto)
                        </button>

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
                </div>
            ) : done ? (
                <div className="pix-page-wrapper">
                    {paymentMethod === 'pix' ? (
                        <PixPayment
                            qrCode={pixData?.qrCode || null}
                            qrCodeBase64={pixData?.qrCodeBase64 || null}
                            amount={finalPrice}
                            orderId={currentOrderId}
                            productName={product?.name || 'Produto'}
                            email={dados.email}
                            timeLeft={timeLeft}
                            totalTime={PIX_TTL}
                            expired={pixExpired}
                            paid={pixPaid}
                            regenerating={pixLoading}
                            checking={pixChecking}
                            onRegenerate={regenerarPix}
                            onCheckNow={checkPixNow}
                        />
                    ) : paymentMethod === 'pix_automatico' ? (
                        <PixParceladoSuccess
                            qrCodeBase64={subData?.qrCodeBase64 || ''}
                            emv={subData?.emv || ''}
                            parcelas={parcelas}
                            valorParcela={pixValorParcela(parcelas)}
                            email={dados.email || ''}
                        />
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
                                                <div className="cc-step-name">Separação e envio</div>
                                                <div className="cc-step-desc">Pedidos confirmados até 15h saem no mesmo dia. Após isso, no próximo dia útil.</div>
                                            </div>
                                        </div>

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
                                    <div className="prod-price">
                                        {paymentMethod === 'pix_automatico'
                                            ? <>{parcelas}× R$ {pixValorParcela(parcelas).toFixed(2).replace('.', ',')}</>
                                            : <>R$ {basePrice.toFixed(2).replace('.', ',')}</>
                                        }
                                    </div>
                                </div>
                                {selectedBumps.length > 0 && availableBumps && availableBumps
                                    .filter((b: any) => selectedBumps.includes(b.id))
                                    .map((bump: any) => (
                                        <div key={bump.id} className="prod-summary" style={{ marginTop: '-2px' }}>
                                            <div className="prod-img" style={{ fontSize: '18px' }}>🎁</div>
                                            <div className="prod-info">
                                                <div className="prod-name">{bump.name}</div>
                                                <div className="prod-qty">Oferta adicionada</div>
                                            </div>
                                            <div className="prod-price">R$ {bump.price.toFixed(2).replace('.', ',')}</div>
                                        </div>
                                    ))
                                }
                            </div>
                            <div className="trust-section">
                                {[
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
                                ))}
                            </div>
                        </aside>

                        <div className="form-col">

                        <div className={`screen ${step === 1 ? 'active' : ''}`}>
                            <div className="card">
                                {renderProgressBar()}
                                <h1 className="step-title">Passo 1 — Seus dados</h1>
                                <div className="step-sub">Preencha os campos abaixo para continuar.</div>

                                <div className={`field ${errors.nome ? 'error' : ''}`}>
                                    <label className="field-label" htmlFor="ck-nome">Seu nome completo</label>
                                    <input id="ck-nome" type="text" name="name" autoComplete="name" autoCapitalize="words" placeholder="Ex: Maria Aparecida Santos" value={dados.nome} aria-invalid={!!errors.nome} onChange={e => { setDados({ ...dados, nome: e.target.value }); if (errors.nome) setErrors(prev => { const n = { ...prev }; delete n.nome; return n; }); }} />
                                    {errors.nome && <div className="error-msg" role="alert">⚠️ {errors.nome}</div>}
                                </div>
                                <div className={`field ${errors.email ? 'error' : ''}`}>
                                    <label className="field-label" htmlFor="ck-email">Seu e-mail</label>
                                    <input id="ck-email" type="email" name="email" autoComplete="email" inputMode="email" autoCapitalize="none" spellCheck={false} placeholder="Ex: maria@gmail.com" value={dados.email} aria-invalid={!!errors.email} onChange={e => { setDados({ ...dados, email: e.target.value }); if (errors.email) setErrors(prev => { const n = { ...prev }; delete n.email; return n; }); }} />
                                    {errors.email && <div className="error-msg" role="alert">⚠️ {errors.email}</div>}
                                    <div className="field-hint">Vamos enviar a confirmação do pedido para este e-mail.</div>
                                </div>
                                <div className={`field ${errors.telefone ? 'error' : ''}`}>
                                    <label className="field-label" htmlFor="ck-tel">Seu celular (WhatsApp)</label>
                                    <input id="ck-tel" type="tel" name="tel" autoComplete="tel-national" inputMode="tel" placeholder="(11) 91234-5678" maxLength={15} value={dados.telefone} aria-invalid={!!errors.telefone} onChange={e => handleMaskDados('telefone', e.target.value, formatTel)} />
                                    {errors.telefone && <div className="error-msg" role="alert">⚠️ {errors.telefone}</div>}
                                    <div className="field-hint">Com DDD. Usamos só para avisar sobre a entrega.</div>
                                </div>
                                {!customization?.disableCpf && (
                                    <div className={`field ${errors.cpf ? 'error' : ''}`}>
                                        <label className="field-label" htmlFor="ck-cpf">CPF <span className="opt">(opcional)</span></label>
                                        <input id="ck-cpf" type="text" inputMode="numeric" placeholder="000.000.000-00" maxLength={14} value={dados.cpf} aria-invalid={!!errors.cpf} onChange={e => handleMaskDados('cpf', e.target.value, formatCPF)} />
                                        {errors.cpf && <div className="error-msg" role="alert">⚠️ {errors.cpf}</div>}
                                        <div className="field-hint">Só é obrigatório se você for pagar com cartão.</div>
                                    </div>
                                )}

                                <button className="cta-btn" onClick={validateStep1} disabled={step1Loading}>
                                    {step1Loading ? 'Carregando...' : 'Continuar para a Entrega'}
                                </button>
                                <div className="cta-note">
                                    <svg viewBox="0 0 20 20" fill="currentColor"><path d="M10 1L3 4.5v5C3 13.6 6 17.3 10 18.5c4-1.2 7-4.9 7-9V4.5L10 1z"/></svg>
                                    Pagamento processado com segurança
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
                                <h1 className="step-title">Passo 2 — Endereço de entrega</h1>
                                <div className="step-sub">Para onde vamos enviar o seu produto?</div>

                                <div className={`field ${errors.cep ? 'error' : ''}`}>
                                    <label className="field-label" htmlFor="ck-cep">CEP</label>
                                    <div className="cep-row">
                                        <input id="ck-cep" type="text" inputMode="numeric" autoComplete="postal-code" placeholder="00000-000" maxLength={9} value={endereco.cep} aria-invalid={!!errors.cep} onChange={e => handleCEPChange(e.target.value)} />
                                    </div>
                                    {errors.cep && <div className="error-msg" role="alert">⚠️ {errors.cep}</div>}
                                    {!cepResolved && !cepLoading && (
                                        <div className="field-hint">
                                            Digite os 8 números do CEP. Não sabe? <a href="https://buscacepinter.correios.com.br/app/endereco/index.php" target="_blank" rel="noreferrer">Consulte nos Correios</a>
                                        </div>
                                    )}
                                </div>

                                {cepLoading && (
                                    <div className="status-box info" role="status">Buscando seu endereço...</div>
                                )}

                                {cepResolved && !cepLoading && (
                                    <>
                                        {cepFound ? (
                                            <div className="status-box ok" role="status">
                                                ✅ Endereço encontrado! Agora falta só o número e o complemento.
                                            </div>
                                        ) : (
                                            <div className="status-box info" role="status">
                                                Não encontramos este CEP automaticamente. Confira os números ou preencha o endereço abaixo.
                                            </div>
                                        )}

                                        <div className={`field ${errors.rua ? 'error' : ''}`}>
                                            <label className="field-label" htmlFor="ck-rua">Rua ou avenida</label>
                                            <input id="ck-rua" type="text" autoComplete="address-line1" placeholder="Ex: Rua das Flores" value={endereco.rua} aria-invalid={!!errors.rua} onChange={e => handleMaskEnd('rua', e.target.value, v => v)} />
                                            {errors.rua && <div className="error-msg" role="alert">⚠️ {errors.rua}</div>}
                                        </div>
                                        <div className="two">
                                            <div className={`field ${errors.numero ? 'error' : ''}`}>
                                                <label className="field-label" htmlFor="ck-numero">Número</label>
                                                <input id="ck-numero" type="text" inputMode="numeric" placeholder="Ex: 123" value={endereco.numero} aria-invalid={!!errors.numero} onChange={e => handleMaskEnd('numero', e.target.value, v => v)}
                                                    style={endereco.numero ? { background: '#f0fdf4', border: '2px solid #22c55e', fontWeight: 600 } : { background: '#fffbeb', border: '2px solid #f59e0b', fontWeight: 600 }}
                                                    autoFocus={!!cepFound} />
                                                {errors.numero && <div className="error-msg" role="alert">⚠️ {errors.numero}</div>}
                                            </div>
                                            <div className={`field ${errors.complemento ? 'error' : ''}`}>
                                                <label className="field-label" htmlFor="ck-compl">Complemento</label>
                                                <input id="ck-compl" type="text" autoComplete="address-line2" placeholder="Apto, bloco ou Casa" value={endereco.complemento} aria-invalid={!!errors.complemento} onChange={e => handleMaskEnd('complemento', e.target.value, v => v)}
                                                    style={endereco.complemento ? { background: '#f0fdf4', border: '2px solid #22c55e', fontWeight: 600 } : { background: '#fffbeb', border: '2px solid #f59e0b', fontWeight: 600 }} />
                                                {errors.complemento && <div className="error-msg" role="alert">⚠️ {errors.complemento}</div>}
                                                {!errors.complemento && <div className="field-hint">Mora em casa? Escreva "Casa".</div>}
                                            </div>
                                        </div>
                                        <div className="two">
                                            <div className={`field ${errors.bairro ? 'error' : ''}`}>
                                                <label className="field-label" htmlFor="ck-bairro">Bairro</label>
                                                <input id="ck-bairro" type="text" placeholder="Nome do bairro" value={endereco.bairro} aria-invalid={!!errors.bairro} onChange={e => handleMaskEnd('bairro', e.target.value, v => v)} />
                                                {errors.bairro && <div className="error-msg" role="alert">⚠️ {errors.bairro}</div>}
                                            </div>
                                            <div className={`field ${errors.cidade ? 'error' : ''}`}>
                                                <label className="field-label" htmlFor="ck-cidade">Cidade</label>
                                                <input id="ck-cidade" type="text" autoComplete="address-level2" placeholder="Ex: São Paulo" value={endereco.cidade} aria-invalid={!!errors.cidade} onChange={e => handleMaskEnd('cidade', e.target.value, v => v)} />
                                                {errors.cidade && <div className="error-msg" role="alert">⚠️ {errors.cidade}</div>}
                                            </div>
                                        </div>
                                        <div className={`field ${errors.estado ? 'error' : ''}`}>
                                            <label className="field-label" htmlFor="ck-estado">Estado</label>
                                            <select id="ck-estado" autoComplete="address-level1" value={endereco.estado} aria-invalid={!!errors.estado} onChange={e => handleMaskEnd('estado', e.target.value, v => v)}>
                                                <option value="">Selecione o estado</option>
                                                {['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'].map(uf => (
                                                    <option key={uf} value={uf}>{uf}</option>
                                                ))}
                                            </select>
                                            {errors.estado && <div className="error-msg" role="alert">⚠️ {errors.estado}</div>}
                                        </div>

                                        <div className="section-label" id="ck-frete-label">🚚 Escolha a entrega</div>
                                        <div role="radiogroup" aria-labelledby="ck-frete-label">
                                        {(shippingRules && shippingRules.length > 0 ? shippingRules : [
                                            { name: 'Entrega Econômica', price: 0, delivery_time: '7' }
                                        ]).map((opt: any, idx: number) => {
                                            const isSel = shipping.price === opt.price && shipping.name === opt.name;
                                            return (
                                                <div key={idx} className={`frete-opt ${isSel ? 'selected' : ''}`} role="radio" aria-checked={isSel} tabIndex={0} onClick={() => setShipping(opt)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setShipping(opt); } }}>
                                                    <div className="frad"></div>
                                                    <div>
                                                        <div className="frete-name" style={{display:'flex', alignItems:'center'}}>{opt.name} {opt.price === 0 && <span className="tag-free">GRÁTIS</span>}</div>
                                                        <div className="frete-sub">Chega de 3 a 7 dias úteis</div>
                                                    </div>
                                                    <div className={`frete-cost ${opt.price === 0 ? 'free' : ''}`} style={{marginLeft:'auto'}}>{opt.price === 0 ? 'GRÁTIS' : `R$ ${Number(opt.price).toFixed(2).replace('.', ',')}`}</div>
                                                </div>
                                            );
                                        })}
                                        </div>

                                        <button className="cta-btn" style={{ marginTop: '14px' }} onClick={validateStep2}>
                                            Continuar para o Pagamento
                                        </button>
                                        <div className="cta-note">
                                            <svg viewBox="0 0 20 20" fill="currentColor"><path d="M10 1L3 4.5v5C3 13.6 6 17.3 10 18.5c4-1.2 7-4.9 7-9V4.5L10 1z"/></svg>
                                            Pagamento processado com segurança
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className={`screen ${step === 3 ? 'active' : ''}`}>
                            <div className="card">
                                <button className="back-btn" onClick={() => setStep(2)}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                                    Voltar
                                </button>
                                {renderProgressBar()}
                                <h1 className="step-title">Passo 3 — Pagamento</h1>
                                <div className="step-sub">Toque na forma de pagamento que você prefere.</div>

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
                                        fontSize: '15px',
                                        color: '#065f46',
                                        fontWeight: 500,
                                        lineHeight: 1.5
                                    }}>
                                        <span style={{ fontSize: '18px', flexShrink: 0 }}>⚡</span>
                                        <div>
                                            <strong>Atenção:</strong> Pagando por PIX sai por{' '}
                                            <strong style={{ color: '#059669' }}>
                                                R$ {(subtotalBeforeDiscount * (1 - pixDiscountVal)).toFixed(2).replace('.', ',')}
                                            </strong>
                                            <> + frete rápido <strong>GRÁTIS</strong> <span style={{ opacity: 0.85 }}>(chega em 5 dias úteis)</span> 🚀</>
                                        </div>
                                    </div>
                                )}

                                {availableBumps && availableBumps.filter((b: any) => b.isActive !== false).length > 0 && (
                                    <>
                                        <div className="section-label" style={{ marginTop: '0', marginBottom: '10px' }}>
                                            🔥 Ofertas Especiais
                                        </div>
                                        {availableBumps.filter((b: any) => b.isActive !== false).map((bump: any) => {
                                            const isSelected = selectedBumps.includes(bump.id);
                                            const toggleBump = () => {
                                                setSelectedBumps(prev =>
                                                    isSelected
                                                        ? prev.filter(id => id !== bump.id)
                                                        : [...prev, bump.id]
                                                );
                                            };
                                            return (
                                                <div
                                                    key={bump.id}
                                                    className={`bump-opt ${isSelected ? 'selected' : ''}`}
                                                    role="checkbox"
                                                    aria-checked={isSelected}
                                                    tabIndex={0}
                                                    onClick={toggleBump}
                                                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleBump(); } }}
                                                >
                                                    {bump.imageUrl && (
                                                        <img
                                                            src={bump.imageUrl}
                                                            alt={bump.name}
                                                            style={{ width: 56, height: 56, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }}
                                                        />
                                                    )}
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div className="bump-name">{bump.name}</div>
                                                        {bump.description && <div className="bump-desc">{bump.description}</div>}
                                                        <div className="bump-price" style={{ marginTop: 4 }}>
                                                            +R$ {bump.price.toFixed(2).replace('.', ',')}
                                                        </div>
                                                    </div>
                                                    <div className="bump-check">
                                                        {isSelected && (
                                                            <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                                                                <polyline points="20 6 9 17 4 12"/>
                                                            </svg>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {selectedBumps.length > 0 && (
                                            <div className="status-box ok" role="status" style={{ marginBottom: 10 }}>
                                                ✅ {selectedBumps.length} oferta{selectedBumps.length > 1 ? 's' : ''} adicionada{selectedBumps.length > 1 ? 's' : ''} — Total: <strong>R$ {finalPrice.toFixed(2).replace('.', ',')}</strong>
                                            </div>
                                        )}
                                        <div style={{ height: '4px' }} />
                                    </>
                                )}

                                {/* ── Opções de pagamento ── */}
                                <div className="section-label" id="ck-pay-label" style={{ marginTop: '0', marginBottom: '10px' }}>💳 Como você quer pagar?</div>

                                {/* CARTÃO DE CRÉDITO */}
                                <div className={`pay-opt ${paymentMethod === 'card' ? 'selected' : ''}`} {...pickable(paymentMethod === 'card', () => setPaymentMethod('card'))} style={{ marginBottom: 4 }}>
                                    <div className="prad" style={{ borderColor: paymentMethod === 'card' ? 'var(--green)' : undefined, background: paymentMethod === 'card' ? 'var(--green)' : undefined }}></div>
                                    <div className="pay-icon" style={{ color: '#6366f1' }}>
                                        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                                            <path d="M20 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/>
                                        </svg>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div className="pay-name" style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                            Cartão de Crédito
                                            <span style={{ background: '#16a34a', color: '#fff', fontSize: 13, fontWeight: 800, padding: '3px 10px', borderRadius: 20 }}>em até 18x</span>
                                        </div>
                                        <div className="pay-desc">Visa, Mastercard, Elo e outros</div>
                                    </div>
                                </div>

                                {paymentMethod === 'card' && (
                                    <div className="card-fields">
                                        <div className={`field ${cardErrors.number ? 'error' : ''}`}>
                                            <label className="field-label" htmlFor="ck-cc-num">Número do cartão</label>
                                            <input
                                                id="ck-cc-num"
                                                type="text"
                                                inputMode="numeric"
                                                autoComplete="cc-number"
                                                placeholder="0000 0000 0000 0000"
                                                maxLength={19}
                                                value={cardData.number}
                                                aria-invalid={!!cardErrors.number}
                                                onChange={e => setCardData(p => ({ ...p, number: formatCardNumber(e.target.value) }))}
                                                style={{ letterSpacing: '0.06em' }}
                                            />
                                            {cardErrors.number && <div className="error-msg" role="alert">⚠️ {cardErrors.number}</div>}
                                        </div>

                                        <div className={`field ${cardErrors.name ? 'error' : ''}`}>
                                            <label className="field-label" htmlFor="ck-cc-name">Nome impresso no cartão</label>
                                            <input
                                                id="ck-cc-name"
                                                type="text"
                                                autoComplete="cc-name"
                                                placeholder="Ex: MARIA A SANTOS"
                                                value={cardData.name}
                                                aria-invalid={!!cardErrors.name}
                                                onChange={e => setCardData(p => ({ ...p, name: e.target.value.toUpperCase() }))}
                                            />
                                            {cardErrors.name && <div className="error-msg" role="alert">⚠️ {cardErrors.name}</div>}
                                        </div>

                                        <div className="two">
                                            <div className={`field ${cardErrors.exp ? 'error' : ''}`}>
                                                <label className="field-label" htmlFor="ck-cc-exp">Validade</label>
                                                <input
                                                    id="ck-cc-exp"
                                                    type="text"
                                                    inputMode="numeric"
                                                    autoComplete="cc-exp"
                                                    placeholder="MM/AA"
                                                    maxLength={5}
                                                    value={cardData.exp}
                                                    aria-invalid={!!cardErrors.exp}
                                                    onChange={e => setCardData(p => ({ ...p, exp: formatExpiry(e.target.value) }))}
                                                />
                                                {cardErrors.exp && <div className="error-msg" role="alert">⚠️ {cardErrors.exp}</div>}
                                            </div>
                                            <div className={`field ${cardErrors.cvv ? 'error' : ''}`}>
                                                <label className="field-label" htmlFor="ck-cc-cvv">Código (CVV)</label>
                                                <input
                                                    id="ck-cc-cvv"
                                                    type="text"
                                                    inputMode="numeric"
                                                    autoComplete="cc-csc"
                                                    placeholder="CVV"
                                                    maxLength={4}
                                                    value={cardData.cvv}
                                                    aria-invalid={!!cardErrors.cvv}
                                                    onChange={e => setCardData(p => ({ ...p, cvv: e.target.value.replace(/\D/g, '') }))}
                                                />
                                                {cardErrors.cvv && <div className="error-msg" role="alert">⚠️ {cardErrors.cvv}</div>}
                                                {!cardErrors.cvv && <div className="field-hint">3 números no verso do cartão</div>}
                                            </div>
                                        </div>

                                        <div className={`field ${cardErrors.cpf ? 'error' : ''}`}>
                                            <label className="field-label" htmlFor="ck-cc-cpf">CPF do dono do cartão</label>
                                            <input
                                                id="ck-cc-cpf"
                                                type="text"
                                                inputMode="numeric"
                                                placeholder="000.000.000-00"
                                                maxLength={14}
                                                value={dados.cpf}
                                                aria-invalid={!!cardErrors.cpf}
                                                onChange={e => handleMaskDados('cpf', e.target.value, formatCPF)}
                                            />
                                            {cardErrors.cpf && <div className="error-msg" role="alert">⚠️ {cardErrors.cpf}</div>}
                                        </div>

                                        <div className={`field ${cardErrors.nascimento ? 'error' : ''}`}>
                                            <label className="field-label" htmlFor="ck-cc-nasc">Data de nascimento</label>
                                            <input
                                                id="ck-cc-nasc"
                                                type="text"
                                                inputMode="numeric"
                                                autoComplete="bday"
                                                placeholder="DD/MM/AAAA"
                                                maxLength={10}
                                                value={dados.nascimento}
                                                aria-invalid={!!cardErrors.nascimento}
                                                onChange={e => { handleMaskDados('nascimento', e.target.value, formatDate); if (cardErrors.nascimento) setCardErrors(p => { const n = { ...p }; delete n.nascimento; return n; }); }}
                                            />
                                            {cardErrors.nascimento && <div className="error-msg" role="alert">⚠️ {cardErrors.nascimento}</div>}
                                        </div>

                                        {(() => {
                                            const addrErr = ['email', 'cep', 'rua', 'numero', 'bairro', 'cidade', 'estado'].map(k => cardErrors[k]).filter(Boolean);
                                            if (!addrErr.length) return null;
                                            return (
                                                <div className="error-msg" role="alert" style={{ marginBottom: 14, display: 'block' }}>
                                                    ⚠️ {addrErr.join(' · ')} — <button type="button" onClick={() => setStep(2)} style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', color: 'inherit', textDecoration: 'underline', cursor: 'pointer' }}>voltar ao endereço para completar</button>.
                                                </div>
                                            );
                                        })()}

                                        <div className="field">
                                            <label className="field-label" htmlFor="ck-cc-inst">Número de parcelas</label>
                                            <select
                                                id="ck-cc-inst"
                                                value={cardData.installments}
                                                onChange={e => setCardData(p => ({ ...p, installments: Number(e.target.value) }))}
                                            >
                                                {cardInstallmentOptions.map(({ n, val, hasInterest }) => (
                                                    <option key={n} value={n}>
                                                        {n}x de R$ {val.toFixed(2).replace('.', ',')} {hasInterest ? '(com juros)' : '(sem juros)'}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <button
                                            className="cta-btn"
                                            onClick={finalizarCartao}
                                            disabled={cardTokenizing || loading}
                                            style={{ marginBottom: 10 }}
                                        >
                                            {cardTokenizing || loading ? 'Processando...' : `Pagar R$ ${finalPrice.toFixed(2).replace('.', ',')}`}
                                        </button>
                                        <div className="cta-note">
                                            <svg viewBox="0 0 20 20" fill="currentColor"><path d="M10 1L3 4.5v5C3 13.6 6 17.3 10 18.5c4-1.2 7-4.9 7-9V4.5L10 1z"/></svg>
                                            Pagamento seguro via Pagar.me • PCI DSS
                                        </div>
                                    </div>
                                )}

                                {/* PIX À VISTA */}
                                <div className={`pay-opt ${paymentMethod === 'pix' ? 'selected' : ''}`} {...pickable(paymentMethod === 'pix', () => setPaymentMethod('pix'))}>
                                    <div className="prad"></div>
                                    <div className="pay-icon" style={{color:'#00B69B'}}>
                                        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z"/></svg>
                                    </div>
                                    <div style={{flex:1}}>
                                        <div className="pay-name" style={{display:'flex',alignItems:'center',gap:'6px'}}>
                                            PIX à vista
                                            <span className="pay-badge g">15% de desconto</span>
                                        </div>
                                        <div className="pay-desc">
                                            R$ {finalPrice.toFixed(2).replace('.', ',')} — pagamento único <span style={{ color: '#16a34a', fontWeight: 700 }}>• 15% de desconto</span>
                                        </div>
                                    </div>
                                </div>
                                {paymentMethod === 'pix' && (
                                    <div className="pix-box" style={{ padding: '18px 16px' }}>
                                        {/* Info row */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, padding: '12px 14px', background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0' }}>
                                            <svg viewBox="0 0 24 24" width="20" height="20" fill="#16a34a" style={{ flexShrink: 0 }}><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z"/></svg>
                                            <span style={{ fontSize: 15, color: '#166534', lineHeight: 1.5 }}>
                                                Na próxima tela aparece o código PIX. É só pagar pelo <strong>app do seu banco</strong> — a confirmação sai em poucos minutos.
                                            </span>
                                        </div>
                                        {/* Warning */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, padding: '11px 14px', background: '#fff7ed', borderRadius: 8, border: '1px solid #fed7aa' }}>
                                            <span style={{ fontSize: 17, flexShrink: 0 }}>⚠️</span>
                                            <span style={{ fontSize: 14, fontWeight: 600, color: '#9a3412', lineHeight: 1.5 }}>
                                                Não pagar o PIX pode negativar seu nome no SPC/Serasa.
                                            </span>
                                        </div>
                                        <button className="cta-btn" onClick={() => finalizar()} disabled={loading}>
                                            {loading ? 'Gerando seu PIX...' : 'Gerar código PIX'}
                                        </button>
                                        <div className="cta-note" style={{ marginTop: 12 }}>
                                            <svg viewBox="0 0 20 20" fill="currentColor"><path d="M10 1L3 4.5v5C3 13.6 6 17.3 10 18.5c4-1.2 7-4.9 7-9V4.5L10 1z"/></svg>
                                            Pagamento processado com segurança via Woovi
                                        </div>
                                    </div>
                                )}

                                {/* PIX PARCELADO (Semanal) — só aparece se o produto tiver assinatura ativa */}
                                {product?.subscriptionEnabled && (
                                    <>
                                        <div
                                            className={`pay-opt ${paymentMethod === 'pix_automatico' ? 'selected' : ''}`}
                                            {...pickable(paymentMethod === 'pix_automatico', () => setPaymentMethod('pix_automatico'))}
                                            style={{
                                                borderColor: paymentMethod === 'pix_automatico' ? '#16a34a' : undefined,
                                                background: paymentMethod === 'pix_automatico' ? '#f0fdf4' : undefined,
                                                marginTop: 8,
                                            }}
                                        >
                                            <div className="prad" style={{
                                                borderColor: paymentMethod === 'pix_automatico' ? '#16a34a' : undefined,
                                                background: paymentMethod === 'pix_automatico' ? '#16a34a' : undefined,
                                            }}></div>
                                            <div className="pay-icon" style={{ color: '#16a34a' }}>
                                                <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                                                    <path d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
                                                </svg>
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div className="pay-name" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    PIX Parcelado
                                                    <span className="pay-badge g" style={{ background: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0' }}>Semanal</span>
                                                </div>
                                                <div className="pay-desc" style={{ color: '#16a34a', fontWeight: 600 }}>
                                                    {parcelas}x de R$ {pixValorParcela(parcelas).toFixed(2).replace('.', ',')} — autorize uma vez, pague sempre
                                                </div>
                                            </div>
                                        </div>

                                        {paymentMethod === 'pix_automatico' && !subData && (
                                            <div style={{
                                                background: '#fff',
                                                border: '1px solid #e4e7ec',
                                                borderRadius: 20,
                                                overflow: 'hidden',
                                                boxShadow: '0 2px 12px rgba(0,0,0,.06)',
                                                fontFamily: "'Inter', system-ui, sans-serif",
                                            }}>
                                                {/* Tira superior */}
                                                <div style={{ background: '#0f7f73', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
                                                    <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
                                                        <path d="M16 3L29 10V22L16 29L3 22V10L16 3Z" fill="rgba(255,255,255,0.2)" stroke="white" strokeWidth="1.5"/>
                                                        <path d="M10 16L13.5 19.5L22 11" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                    </svg>
                                                    <span style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>Pix Parcelado — débito automático</span>
                                                </div>
                                                {/* Corpo */}
                                                <div style={{ padding: '20px 20px 0' }}>
                                                    <label style={{ display: 'block', fontSize: 14, fontWeight: 700, color: '#6b7280', margin: '0 0 8px' }}>
                                                        Número de parcelas
                                                    </label>
                                                    {/* Select de parcelas */}
                                                    <div style={{ position: 'relative', marginBottom: 14 }}>
                                                        <select
                                                            value={parcelas}
                                                            onChange={e => setParcelas(Number(e.target.value))}
                                                            style={{
                                                                width: '100%',
                                                                appearance: 'none' as const,
                                                                WebkitAppearance: 'none' as const,
                                                                padding: '13px 44px 13px 16px',
                                                                borderRadius: 12,
                                                                border: '2px solid #32bcad',
                                                                background: '#edfaf8',
                                                                fontSize: 16, fontWeight: 700, color: '#0f766e',
                                                                fontFamily: 'inherit',
                                                                cursor: 'pointer',
                                                                outline: 'none',
                                                            }}
                                                        >
                                                            {parcelasOpcoes.map(n => (
                                                                <option key={n} value={n}>
                                                                    {n}× de R$ {pixValorParcela(n).toFixed(2).replace('.', ',')} / semana{n === parcelasMax ? ' — Melhor opção' : ''}
                                                                </option>
                                                            ))}
                                                        </select>
                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#32bcad" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                                                            style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                                                            <polyline points="6 9 12 15 18 9"/>
                                                        </svg>
                                                    </div>
                                                    {/* Cronograma de cobranças */}
                                                    <div style={{ background: '#f8fafc', border: '1px solid #e4e7ec', borderRadius: 12, padding: '14px 16px', marginBottom: 14 }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#32bcad" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                                                            </svg>
                                                            <span style={{ fontSize: 14, fontWeight: 700, color: '#374151' }}>Cronograma de cobranças</span>
                                                        </div>
                                                        <p style={{ fontSize: 14, color: '#6b7280', margin: '0 0 12px', lineHeight: 1.55 }}>
                                                            A <strong style={{ color: '#0f1623' }}>1ª parcela é cobrada hoje</strong> ao autorizar o Pix no seu banco. As demais são descontadas automaticamente a cada <strong style={{ color: '#0f1623' }}>7 dias</strong>, sem ação necessária.
                                                        </p>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                                                            {Array.from({ length: parcelas }).map((_, i) => {
                                                                const d = new Date();
                                                                d.setDate(d.getDate() + i * 7);
                                                                const dia = String(d.getDate()).padStart(2, '0');
                                                                const mes = String(d.getMonth() + 1).padStart(2, '0');
                                                                const ano = d.getFullYear();
                                                                const valorParcela = pixValorParcela(parcelas);
                                                                const isFirst = i === 0;
                                                                const isLast = i === parcelas - 1;
                                                                return (
                                                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: isLast ? 'none' : '1px dashed #e4e7ec' }}>
                                                                        {/* Número da parcela */}
                                                                        <div style={{
                                                                            width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                                                                            background: isFirst ? '#32bcad' : '#fff',
                                                                            border: `2px solid ${isFirst ? '#32bcad' : '#d1d5db'}`,
                                                                            color: isFirst ? '#fff' : '#6b7280',
                                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                            fontSize: 14, fontWeight: 700,
                                                                        }}>{i + 1}</div>
                                                                        {/* Data + rótulo */}
                                                                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' as const }}>
                                                                            <span style={{ fontSize: 15, fontWeight: 600, color: '#0f1623' }}>
                                                                                {dia}/{mes}/{ano}
                                                                            </span>
                                                                            {isFirst ? (
                                                                                <span style={{ fontSize: 12, fontWeight: 700, background: '#edfaf8', color: '#0f766e', padding: '2px 8px', borderRadius: 20, textTransform: 'uppercase' as const, letterSpacing: '.05em' }}>
                                                                                    Hoje
                                                                                </span>
                                                                            ) : (
                                                                                <span style={{ fontSize: 13, color: '#6b7280' }}>em {i * 7} dias</span>
                                                                            )}
                                                                        </div>
                                                                        {/* Valor */}
                                                                        <span style={{ fontSize: 15, fontWeight: 700, color: isFirst ? '#0f766e' : '#374151', whiteSpace: 'nowrap' as const }}>
                                                                            R$ {valorParcela.toFixed(2).replace('.', ',')}
                                                                        </span>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                    {/* CPF */}
                                                    <div style={{ marginBottom: 14 }}>
                                                        <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 6 }}>CPF</label>
                                                        <input
                                                            type="text"
                                                            placeholder="000.000.000-00"
                                                            maxLength={14}
                                                            value={dados.cpf}
                                                            onChange={e => handleMaskDados('cpf', e.target.value, formatCPF)}
                                                            style={{
                                                                width: '100%', padding: '12px 14px',
                                                                borderRadius: 10,
                                                                border: `1.5px solid ${errors.cpf ? '#ef4444' : '#e4e7ec'}`,
                                                                fontSize: 15, outline: 'none',
                                                                background: '#fff', boxSizing: 'border-box' as const,
                                                                fontFamily: 'inherit',
                                                            }}
                                                        />
                                                        {errors.cpf && <div style={{ fontSize: 14, color: '#ef4444', marginTop: 4 }}>⚠️ {errors.cpf}</div>}
                                                    </div>
                                                    {/* Botão CTA */}
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const clean = dados.cpf.replace(/\D/g, '');
                                                            if (clean.length !== 11) { setErrors(p => ({ ...p, cpf: 'CPF obrigatório (11 dígitos)' })); return; }
                                                            finalizarAssinatura();
                                                        }}
                                                        disabled={subLoading}
                                                        style={{
                                                            width: '100%', padding: '16px',
                                                            background: subLoading ? '#9ca3af' : '#0f7f73',
                                                            color: '#fff', border: 'none', borderRadius: 14,
                                                            fontSize: 17, fontWeight: 700,
                                                            cursor: subLoading ? 'default' : 'pointer',
                                                            fontFamily: 'inherit', transition: 'opacity .15s',
                                                            marginBottom: 14,
                                                        }}
                                                    >
                                                        {subLoading ? 'Criando PIX Parcelado...' : 'Gerar Pix Parcelado'}
                                                    </button>
                                                    {/* Badge segurança */}
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 14, color: '#6b7280', paddingBottom: 20 }}>
                                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                                                        </svg>
                                                        Processado com segurança via Woovi Pix Automático
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {paymentMethod === 'pix_automatico' && subData && (
                                            <div className="pix-box" style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0' }}>
                                                {subData.qrCodeBase64 && !subData.resumed ? (
                                                    <>
                                                        <p style={{ color: '#14532d', fontWeight: 700, textAlign: 'center', margin: '0 0 12px' }}>
                                                            Escaneie o QR PIX para autorizar
                                                        </p>
                                                        <div style={{ display: 'flex', justifyContent: 'center', margin: '0 0 12px' }}>
                                                            <img src={`data:image/png;base64,${subData.qrCodeBase64}`} alt="QR PIX Parcelado" style={{ width: 200, height: 200, borderRadius: 10, border: '3px solid #bbf7d0' }} />
                                                        </div>
                                                        <div style={{ background: '#dcfce7', borderRadius: 8, padding: '10px 14px', fontSize: 14, color: '#14532d', textAlign: 'center' }}>
                                                            Abra o app do banco → PIX → Escanear QR code
                                                        </div>
                                                    </>
                                                ) : (
                                                    <>
                                                        <p style={{ color: '#14532d', fontWeight: 700, textAlign: 'center', margin: '0 0 10px' }}>
                                                            Autorize no app do banco
                                                        </p>
                                                        <div style={{ background: '#dcfce7', borderRadius: 8, padding: '12px 14px', fontSize: 15, color: '#14532d', lineHeight: 1.7 }}>
                                                            Abra o app do banco → PIX → PIX Automático → autorizar solicitação pendente
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </>
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
