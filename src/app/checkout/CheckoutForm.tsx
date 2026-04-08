'use client'

import { useState, useEffect } from 'react'
import './checkout.css'

export default function CheckoutForm({ product, customization, shippingRules = [], availableBumps = [] }: any) {
    const [isMounted, setIsMounted] = useState(false);
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [timeLeft, setTimeLeft] = useState(14 * 60 + 52);
    const [done, setDone] = useState(false);

    const [dados, setDados] = useState({ nome: '', email: '', telefone: '', cpf: '' });
    const [endereco, setEndereco] = useState({ cep: '', rua: '', numero: '', complemento: '', bairro: '', cidade: '', estado: 'SP', destinatario: '' });
    const [shipping, setShipping] = useState(shippingRules[0] || { label: 'Entrega Econômica', name: 'Entrega Econômica', price: 0, delivery_time: '7 dias úteis' });
    const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card' | ''>('');
    const [pixData, setPixData] = useState<{ qrCode: string, qrCodeBase64: string } | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [copied, setCopied] = useState(false);
    const [selectedBumps, setSelectedBumps] = useState<any[]>([]);

    useEffect(() => {
        setIsMounted(true);
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

        const timer = setInterval(() => setTimeLeft(prev => prev > 0 ? prev - 1 : 0), 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const pixDiscountVal = Number(customization?.pixDiscount || 0) / 100;
    const basePrice = Number(product?.price) || 0;
    const bumpsPrice = selectedBumps.reduce((acc, b) => acc + Number(b.price), 0);
    const totalPrice = basePrice + bumpsPrice + (shipping?.price || 0);
    const finalPrice = (step === 3 && paymentMethod === 'pix') ? (totalPrice * (1 - pixDiscountVal)) : totalPrice;

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

    const toggleBump = (bump: any) => {
        setSelectedBumps(prev => {
            if (prev.find(b => b.id === bump.id)) return prev.filter(b => b.id !== bump.id);
            return [...prev, bump];
        });
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
            const deviceId = (window as any).MP_DEVICE_SESSION_ID || (window as any).mercadopago?.deviceFingerprint;
            const currentMethod = paymentMethod === 'card' ? 'credit_card' : paymentMethod;
            let tokenData: any = null;
            if (brickData) {
                tokenData = {
                    token: brickData.token,
                    installments: brickData.installments,
                    payment_method_id: brickData.payment_method_id,
                    issuer_id: brickData.issuer_id
                };
            }
            const payload = {
                method: currentMethod,
                cardData: tokenData,
                brickData: brickData,
                orderId: localStorage.getItem('last_order_id'),
                orderData: {
                    ...dados, ...endereco,
                    price: finalPrice,
                    productId: product?.id || 'default',
                    selectedBumpIds: selectedBumps.map(b => b.id)
                },
                deviceId: deviceId
            };
            const response = await fetch('/api/process-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await response.json();
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
        } catch (e) {
            console.error("ERRO:", e);
            alert("Erro ao processar pagamento.");
        } finally { setLoading(false); }
    }

    useEffect(() => {
        if (paymentMethod === 'card' && step === 3 && isMounted && (window as any).MercadoPago) {
            const initBrick = async () => {
                const mp = new (window as any).MercadoPago(process.env.NEXT_PUBLIC_MP_PUBLIC_KEY || 'TEST-91331b4d-be71-43a4-b12a-d38e686b8ab2');
                const bricksBuilder = mp.bricks();
                const container = document.getElementById('paymentBrick_container');
                if (container) container.innerHTML = '';
                try {
                    await bricksBuilder.create('cardPayment', 'paymentBrick_container', {
                        initialization: { amount: finalPrice, payer: { email: dados.email } },
                        locale: 'pt-BR',
                        customization: { visual: { style: { theme: 'default' } } },
                        callbacks: {
                            onReady: () => console.log("Ready"),
                            onSubmit: ({ formData }) => finalizar(formData),
                            onError: (error) => console.error(error),
                        },
                    });
                } catch (e) { console.error(e); }
            };
            initBrick();
        }
    }, [paymentMethod, step, isMounted]);

    if (!isMounted) return null;

    if (done) {
        return (
            <div className="wrap success-screen" style={{ minHeight: '100vh', background: customization?.bgColor || '#f0f9ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="card" style={{ maxWidth: '500px', textAlign: 'center', padding: '40px' }}>
                    <div style={{ fontSize: '64px' }}>✅</div>
                    <h2>Pedido Recebido!</h2>
                    <p>{paymentMethod === 'pix' ? 'Pague o PIX para liberar o acesso.' : 'Processando pagamento...'}</p>
                    {pixData && (
                        <div className="pix-result" style={{ marginTop: '20px' }}>
                            <img src={`data:image/png;base64,${pixData.qrCodeBase64}`} alt="QR" style={{ width: '200px' }} />
                            <button className="main-cta" onClick={() => { navigator.clipboard.writeText(pixData.qrCode); setCopied(true); }}>
                                {copied ? 'Copiado!' : 'Copiar Código PIX'}
                            </button>
                            <div style={{ marginTop: '10px', color: '#e64a19' }}>Expira em: {formatTime(timeLeft)}</div>
                        </div>
                    )}
                    <button className="main-cta" onClick={() => window.location.href = '/'} style={{ marginTop: '20px' }}>Voltar</button>
                </div>
            </div>
        );
    }

    return (
        <div className="wrap" style={{ background: customization?.bgColor || '#f0f9ff', minHeight: '100vh' }}>
            <header className="checkout-header" style={{ background: '#fff', padding: '16px 0', borderBottom: '1px solid #eee' }}>
                <div className="container" style={{ textAlign: 'center' }}>
                    {customization?.logo ? <img src={customization.logo} alt="Logo" style={{ maxHeight: '45px' }} /> : <span style={{ fontSize: '24px', fontWeight: 'bold' }}>{customization?.storeName}</span>}
                </div>
            </header>

            {customization?.alertText && (
                <div className="alert-bar" style={{ background: customization.alertBg, color: '#fff', padding: '8px', textAlign: 'center' }}>
                    <span>🔥 {customization.alertText}</span>
                </div>
            )}

            <div className="container" style={{ maxWidth: '1000px', margin: '20px auto', padding: '0 15px' }}>
                <div className="checkout-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.3fr) 1fr', gap: '24px' }}>
                    <div className="checkout-left">
                        {step === 1 && (
                            <div className="card">
                                <div className="step-title">👋 Seus Dados</div>
                                <div className="field">
                                    <label>Nome Completo *</label>
                                    <input type="text" value={dados.nome} onChange={e => setDados({ ...dados, nome: e.target.value })} />
                                    {errors.nome && <div className="error-msg">{errors.nome}</div>}
                                </div>
                                <div className="field">
                                    <label>E-mail *</label>
                                    <input type="email" value={dados.email} onChange={e => setDados({ ...dados, email: e.target.value })} />
                                    {errors.email && <div className="error-msg">{errors.email}</div>}
                                </div>
                                <div className="two-col">
                                    <div className="field">
                                        <label>WhatsApp *</label>
                                        <input type="text" value={dados.telefone} onChange={e => setDados({ ...dados, telefone: formatTel(e.target.value) })} />
                                    </div>
                                    {!customization?.disableCpf && (
                                        <div className="field">
                                            <label>CPF *</label>
                                            <input type="text" value={dados.cpf} onChange={e => setDados({ ...dados, cpf: formatCPF(e.target.value) })} />
                                        </div>
                                    )}
                                </div>
                                <button className="main-cta" onClick={validateStep1}>Continuar para Entrega</button>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="card">
                                <button className="back-link" onClick={() => setStep(1)}>← Voltar</button>
                                <div className="step-title">🚚 Entrega</div>
                                <div className="field">
                                    <label>CEP *</label>
                                    <input type="text" value={endereco.cep} onChange={e => handleCEPChange(e.target.value)} />
                                </div>
                                <div className="field">
                                    <label>Rua *</label>
                                    <input type="text" value={endereco.rua} onChange={e => setEndereco({ ...endereco, rua: e.target.value })} />
                                </div>
                                <div className="two-col">
                                    <div className="field">
                                        <label>Número *</label>
                                        <input type="text" value={endereco.numero} onChange={e => setEndereco({ ...endereco, numero: e.target.value })} />
                                    </div>
                                    <div className="field">
                                        <label>Bairro *</label>
                                        <input type="text" value={endereco.bairro} onChange={e => setEndereco({ ...endereco, bairro: e.target.value })} />
                                    </div>
                                </div>
                                <div className="frete-title">Frete</div>
                                {shippingRules.map((rule: any) => (
                                    <div key={rule.id} className={`frete-opt ${shipping.id === rule.id ? 'selected' : ''}`} onClick={() => setShipping(rule)}>
                                        <span>{rule.name}</span>
                                        <span>{rule.price === 0 ? 'Grátis' : `R$ ${rule.price.toFixed(2)}`}</span>
                                    </div>
                                ))}
                                <button className="main-cta" onClick={validateStep2}>Pagamento</button>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="card">
                                <button className="back-link" onClick={() => setStep(2)}>← Voltar</button>
                                <div className="step-title">💳 Pagamento</div>
                                <div className={`pay-card ${paymentMethod === 'pix' ? 'selected' : ''}`} onClick={() => setPaymentMethod('pix')}>
                                    Pix {pixDiscountVal > 0 && <span>({customization.pixDiscount}% OFF)</span>}
                                </div>
                                {paymentMethod === 'pix' && <button className="main-cta" onClick={() => finalizar()}>GERAR PIX</button>}
                                <div className={`pay-card ${paymentMethod === 'card' ? 'selected' : ''}`} onClick={() => setPaymentMethod('card')}>Cartão</div>
                                {paymentMethod === 'card' && <div id="paymentBrick_container"></div>}
                            </div>
                        )}
                    </div>

                    <div className="checkout-right">
                        <div className="order-summary card">
                            <h3>Resumo</h3>
                            <div className="product-item">
                                <img src={product?.imageUrl} alt="" style={{ width: '50px' }} />
                                <div>{product?.name}</div>
                                <div>R$ {basePrice.toFixed(2)}</div>
                            </div>
                            {availableBumps.map((bump: any) => (
                                <div key={bump.id} className={`bump-card ${selectedBumps.find(b => b.id === bump.id) ? 'active' : ''}`} onClick={() => toggleBump(bump)}>
                                    {bump.name} (+ R$ {bump.price.toFixed(2)})
                                </div>
                            ))}
                            <div className="total-row" style={{ marginTop: '20px', fontWeight: 'bold', fontSize: '18px' }}>
                                Total: R$ {finalPrice.toFixed(2)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function formatTel(v: string) { return v.replace(/\D/g, '').slice(0, 11).replace(/^(\d{2})(\d)/, '($1) $2'); }
function formatCPF(v: string) { return v.replace(/\D/g, '').slice(0, 11).replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4'); }
