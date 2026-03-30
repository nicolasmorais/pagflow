'use client'

import { createOrder } from '../actions'
import { useState, useEffect } from 'react'
import { initMercadoPago, CardPayment } from '@mercadopago/sdk-react'
import './checkout.css'

initMercadoPago(process.env.NEXT_PUBLIC_MP_PUBLIC_KEY!, { locale: 'pt-BR' })

const steps = [
    { id: 1, label: "Seus Dados" },
    { id: 2, label: "Entrega" },
    { id: 3, label: "Pagamento" },
];

function Field({ label, hint, error, touched, errorMsg, ...props }: any) {
    const [isTouched, setIsTouched] = useState(false);

    // An error is only "active" if the user has focused and then blurred the field,
    // or if the field was marked as touched by the parent.
    const showError = error && (isTouched || touched);

    return (
        <div className="field-group">
            <label className="field-label">{label}</label>
            <input
                {...props}
                className={`field-input ${showError ? 'input-error' : ''}`}
                onBlur={(e) => {
                    setIsTouched(true);
                    if (props.onBlur) props.onBlur(e);
                }}
            />
            {showError ? (
                <p className="field-error-msg">{errorMsg || `Digite um ${label.replace("*", "").trim()} válido`}</p>
            ) : (
                hint && <p className="field-hint">{hint}</p>
            )}
        </div>
    );
}

function StepBar({ current }: { current: number }) {
    return (
        <div className="step-bar">
            {steps.map((step, i) => {
                const done = current > step.id;
                const active = current === step.id;
                return (
                    <div key={step.id} className="step-item-container">
                        <div className="step-visual">
                            <div className={`step-circle ${done ? 'done' : active ? 'active' : 'inactive'}`}>
                                {done ? "✓" : step.id}
                            </div>
                            <span className={`step-label ${active ? 'active' : done ? 'done' : 'inactive'}`}>
                                {step.label}
                            </span>
                        </div>
                        {i < steps.length - 1 && (
                            <div className={`step-line ${done ? 'done' : ''}`} />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

export default function CheckoutForm({ product }: { product: any }) {
    const [step, setStep] = useState(1);
    const [step1Touched, setStep1Touched] = useState(false);
    const [done, setDone] = useState(false);
    const [loading, setLoading] = useState(false);
    const [dados, setDados] = useState({ nome: "", email: "", telefone: "", cpf: "" });
    const [endereco, setEndereco] = useState({ destinatario: "", cep: "", rua: "", numero: "", complemento: "", bairro: "", cidade: "", estado: "", referencia: "" });
    const [showSummary, setShowSummary] = useState(true);
    const [pixData, setPixData] = useState<{ qrCode: string, qrCodeBase64: string } | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<'pix' | 'credit_card' | null>(null);
    const [cardData, setCardData] = useState({ cardNumber: '', cardName: '', expiration: '', cvv: '', installments: 1 });
    const [shipping, setShipping] = useState({ type: 'economica', price: 0, label: 'Entrega Econômica' });
    const [hasOrderBump, setHasOrderBump] = useState(false);
    const [timeLeft, setTimeLeft] = useState(1620); // 27:00 in seconds
    const bumpPrice = 99.90;

    useEffect(() => {
        if (!done || !pixData) return;
        const timer = setInterval(() => {
            setTimeLeft(prev => prev > 0 ? prev - 1 : 0);
        }, 1000);
        return () => clearInterval(timer);
    }, [done, pixData]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const totalPrice = (product.price + shipping.price + (hasOrderBump ? bumpPrice : 0));
    const finalPrice = paymentMethod === 'pix' ? totalPrice * 0.65 : totalPrice;

    const updateDados = (k: string, v: string) => setDados(p => ({ ...p, [k]: v }));
    const updateCard = (k: string, v: any) => setCardData(p => ({ ...p, [k]: v }));
    const updateEnd = (k: string, v: string) => setEndereco(p => ({ ...p, [k]: v }));

    const handleCEPChange = async (cep: string) => {
        const cleanCEP = cep.replace(/\D/g, '');
        updateEnd("cep", cleanCEP);

        if (cleanCEP.length === 8) {
            try {
                const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);
                const data = await response.json();

                if (!data.erro) {
                    setEndereco(prev => ({
                        ...prev,
                        rua: data.logradouro || prev.rua,
                        bairro: data.bairro || prev.bairro,
                        cidade: data.localidade || prev.cidade,
                        estado: data.uf || prev.estado
                    }));
                }
            } catch (error) {
                console.error("Erro ao buscar CEP:", error);
            }
        }
    };

    async function handleFinalize(brickData?: any) {
        setLoading(true)
        try {
            const currentMethod = brickData ? 'credit_card' : paymentMethod;

            const response = await fetch('/api/process-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    method: currentMethod,
                    brickData,
                    cardData,
                    orderData: {
                        ...dados,
                        ...endereco,
                        productId: product.id,
                        price: Number(finalPrice.toFixed(2)),
                        hasBump: hasOrderBump,
                        shippingLabel: shipping.label,
                        shippingPrice: shipping.price
                    }
                })
            });
            const result = await response.json();
            if (result.success) {
                if (result.paymentStatus === 'recusado') {
                    alert("Pagamento Recusado: " + (result.statusDetail || "Verifique os dados do cartão e tente novamente."));
                    return;
                }

                if (result.qrCodeBase64) {
                    setPixData({ qrCode: result.qrCode, qrCodeBase64: result.qrCodeBase64 });
                }
                setDone(true);
            } else {
                alert("Erro no pagamento: " + (result.error || "Ocorreu um erro inesperado."));
            }

        } catch (error: any) {
            alert('Erro ao processar: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    const maskCardNumber = (v: string) => {
        v = v.replace(/\D/g, "");
        if (v.length > 16) v = v.slice(0, 16);
        v = v.replace(/(\d{4})(?=\d)/g, "$1 ");
        return v;
    };
    const maskExpiration = (v: string) => {
        v = v.replace(/\D/g, "");
        if (v.length > 4) v = v.slice(0, 4);
        v = v.replace(/(\d{2})(\d)/, "$1/$2");
        return v;
    };
    const maskCVV = (v: string) => {
        v = v.replace(/\D/g, "");
        if (v.length > 4) v = v.slice(0, 4);
        return v;
    };

    const nextStep = () => {
        if (step === 1 && !endereco.destinatario) {
            setEndereco(prev => ({ ...prev, destinatario: dados.nome }));
        }
        if (step < 3) setStep(s => s + 1);
    }

    const prevStep = () => {
        if (step > 1) setStep(s => s - 1);
    }

    if (done) {
        if (pixData) {
            return (
                <div style={{ background: '#fcfcfc', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
                    <div className="pix-success-wrapper" style={{ flex: 1 }}>
                        {/* Header - Always visible */}
                        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', padding: '12px 20px', background: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', zIndex: 100 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '24px' }}>🐻</span>
                                <span style={{ fontWeight: 700, fontSize: '1.25rem', color: '#1a1a1a', letterSpacing: '-0.3px' }}>Meu Amigurumi</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10px', fontWeight: 800, color: '#1a1a1a', textTransform: 'uppercase', opacity: 0.9 }}>
                                <span style={{ fontSize: '16px' }}>🔒</span>
                                <div>
                                    PAGAMENTO<br />
                                    <span style={{ color: '#666', fontSize: '9px' }}>100% SEGURO</span>
                                </div>
                            </div>
                        </div>

                        <div className="pix-column-left">
                            <h1 className="pix-success-title">Quase lá...</h1>
                            <p className="pix-success-subtitle">
                                Pague seu Pix dentro de <strong>{formatTime(timeLeft)}</strong> para garantir sua compra.
                            </p>

                            <div className="pix-status-badge">
                                Aguardando pagamento <span>•••</span>
                            </div>
                        </div>

                        <div className="pix-column-right">
                            <div className="pix-card-main">

                                <p className="desktop-only" style={{ fontSize: '15.5px', color: '#555', lineHeight: '1.6', marginBottom: '16px', textAlign: 'center' }}>
                                    Abra seu aplicativo de pagamento onde você<br />utiliza o Pix e escolha a opção Ler QR Code
                                </p>

                                <div className="pix-camera-hint desktop-only" style={{ marginBottom: '24px' }}>
                                    📱 Aponte a câmera do seu celular
                                </div>

                                <div className="pix-qr-container" style={{ marginBottom: '24px', textAlign: 'center', width: '100%' }}>
                                    <img src={`data:image/jpeg;base64,${pixData.qrCodeBase64}`} alt="QR Code PIX" style={{ width: '240px', height: 'auto', borderRadius: '4px', maxWidth: '100%', margin: '0 auto' }} />
                                    <p className="mobile-only" style={{ fontSize: '11px', color: '#999', marginTop: '10px' }}>Escanear QR Code</p>
                                </div>

                                <div className="pix-value-row">
                                    Valor do Pix: <span className="pix-value-amount">R$ {finalPrice.toFixed(2)}</span>
                                </div>

                                {/* Mobile Copy Button (Inside Card) */}
                                <button
                                    className="pix-copy-btn mobile-only"
                                    onClick={() => {
                                        navigator.clipboard.writeText(pixData.qrCode);
                                        alert('Código Copiado!');
                                    }}
                                >
                                    <span style={{ fontSize: '20px', fontWeight: 400 }}>📑</span> Copiar código
                                </button>

                                <p className="pix-helper-text mobile-only">
                                    Escolha a opção <span>Pix Copia e Cola</span> e insira o código copiado
                                </p>

                                <div className="pix-divider-dash mobile-only"></div>

                                <img src="https://pub-da9fd1c19b8e45d691d67626b9a7ba6d.r2.dev/1774813710675-MercadoPago_logo.png" alt="Mercado Pago" className="mp-logo-img-new" />
                            </div>

                            <div className="pix-copy-section-footer desktop-only">
                                <p className="pix-footer-text">
                                    Você também pode pagar escolhendo a opção Pix Copia e Cola no seu aplicativo de pagamento ou Internet Banking (banco online). Neste caso, copie o código clicando no botão abaixo:
                                </p>

                                <button
                                    className="pix-copy-btn-link"
                                    onClick={() => {
                                        navigator.clipboard.writeText(pixData.qrCode);
                                        alert('Código Copiado!');
                                    }}
                                >
                                    📑 Copiar código
                                </button>
                            </div>
                        </div>
                    </div>
                    <footer className="checkout-footer">
                        <div className="footer-content">
                            <div className="footer-info">
                                <p><strong>PagFlow Sistemas de Pagamentos LTDA</strong></p>
                                <p>CNPJ: 00.000.000/0001-00</p>
                                <p>Av. Paulista, 1000 - Bela Vista, São Paulo - SP, 01310-100</p>
                            </div>

                            <div className="footer-links">
                                <a href="#">Termos de Uso</a>
                                <a href="#">Privacidade</a>
                                <a href="#">Ajuda</a>
                            </div>

                            <p style={{ fontSize: '0.75rem', marginTop: '10px', opacity: 0.6 }}>
                                © {new Date().getFullYear()} PagFlow. Todos os direitos reservados.
                            </p>
                        </div>
                    </footer>
                </div>
            )
        }

        return (
            <div className="done-container" style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                <div style={{ background: '#fff', borderRadius: '20px', padding: '48px 36px', maxWidth: '480px', width: '100%', textAlign: 'center', boxShadow: '0 8px 40px rgba(0,0,0,0.1)' }}>
                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px', margin: '0 auto 20px' }}>✅</div>
                    <h2 style={{ fontSize: '26px', color: '#166534', marginBottom: '8px', fontWeight: 700 }}>Pedido Confirmado!</h2>
                    <p style={{ fontSize: '17px', color: '#4b5563', lineHeight: '1.8' }}>
                        Obrigado, <strong>{dados.nome.split(" ")[0]}</strong>!<br />
                        Seu pedido foi recebido com sucesso.
                    </p>
                </div>
            </div>
        );
    }

    const ReviewLine = ({ label, valor }: any) => valor ? (
        <div className="review-line">
            <span className="line-label">{label}</span>
            <span className="line-value">{valor}</span>
        </div>
    ) : null;

    const validateCPF = (cpfInput: string) => {
        const cpf = cpfInput.replace(/\D/g, '');
        if (cpf.length !== 11) return false;

        // Bloqueia CPFs com todos os dígitos iguais
        if (/^(\d)\1{10}$/.test(cpf)) return false;

        let sum = 0;
        let remainder;

        for (let i = 1; i <= 9; i++) sum = sum + parseInt(cpf.substring(i - 1, i)) * (11 - i);
        remainder = (sum * 10) % 11;

        if ((remainder === 10) || (remainder === 11)) remainder = 0;
        if (remainder !== parseInt(cpf.substring(9, 10))) return false;

        sum = 0;
        for (let i = 1; i <= 10; i++) sum = sum + parseInt(cpf.substring(i - 1, i)) * (12 - i);
        remainder = (sum * 10) % 11;

        if ((remainder === 10) || (remainder === 11)) remainder = 0;
        if (remainder !== parseInt(cpf.substring(10, 11))) return false;

        return true;
    };

    const maskCPF = (v: string) => {
        v = v.replace(/\D/g, "");
        if (v.length > 11) v = v.slice(0, 11);
        v = v.replace(/(\d{3})(\d)/, "$1.$2");
        v = v.replace(/(\d{3})(\d)/, "$1.$2");
        v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
        return v;
    };

    const validateEmail = (email: string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const maskPhone = (v: string) => {
        v = v.replace(/\D/g, "");
        if (v.length > 11) v = v.slice(0, 11);
        v = v.replace(/^(\d{2})(\d)/g, "($1) $2");
        v = v.replace(/(\d)(\d{4})$/, "$1-$2");
        return v;
    };

    const validatePhone = (phone: string) => {
        const clean = phone.replace(/\D/g, '');
        return clean.length >= 10 && clean.length <= 11;
    };

    const isStep1Valid = () => {
        return dados.nome.trim().length >= 3 && validateEmail(dados.email) && validatePhone(dados.telefone) && validateCPF(dados.cpf);
    };

    const isStep2Valid = () => {
        return !!endereco.destinatario && !!endereco.cep && !!endereco.rua && !!endereco.numero && !!endereco.bairro && !!endereco.cidade && !!endereco.estado;
    };

    return (
        <div className="checkout-page-wrapper">
            {loading && (
                <div className="loading-overlay">
                    <div className="loading-spinner"></div>
                    <h2 className="loading-title">aguarde...</h2>
                    <p className="loading-text">Estamos processando seu pedido. Não feche esta tela.</p>
                </div>
            )}
            <header className="checkout-top-bar">
                <div className="top-bar-content">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '24px' }}>🐻</span>
                        <span style={{ fontWeight: 700, fontSize: '1.25rem', color: '#1a1a1a', letterSpacing: '-0.3px' }}>Meu Amigurumi</span>
                    </div>
                    <div className="secure-badge-new">
                        <span style={{ fontSize: '16px' }}>🔒</span>
                        <div>
                            PAGAMENTO<br />
                            <span style={{ color: '#666', fontSize: '9px' }}>100% SEGURO</span>
                        </div>
                    </div>
                </div>
            </header>

            <div className="checkout-container">
                <div className="checkout-layout">
                    {/* Left Side: Form */}
                    <div className="checkout-card form-side">
                        <StepBar current={step} />

                        <h2 className="step-title">
                            {step === 1 && "1- Identificação"}
                            {step === 2 && "2- Entrega"}
                            {step === 3 && "3- Pagamento"}
                        </h2>

                        {step === 1 && (
                            <div className="step-content">
                                <Field
                                    label="Seu Nome Completo *"
                                    placeholder="Ex: Maria Aparecida Santos"
                                    value={dados.nome}
                                    error={dados.nome.trim().length > 0 && dados.nome.trim().length < 3}
                                    touched={step1Touched}
                                    errorMsg="Nome inválido"
                                    onChange={(e: any) => updateDados("nome", e.target.value)}
                                />
                                <Field
                                    label="Seu E-mail *"
                                    type="email"
                                    placeholder="Ex: maria@email.com"
                                    value={dados.email}
                                    error={dados.email.length > 0 && !validateEmail(dados.email)}
                                    touched={step1Touched}
                                    errorMsg="E-mail inválido"
                                    onChange={(e: any) => updateDados("email", e.target.value)}
                                />
                                <Field
                                    label="Qual seu Whatsapp? *"
                                    placeholder="(11) 91234-5678"
                                    value={dados.telefone}
                                    error={dados.telefone.length > 0 && !validatePhone(dados.telefone)}
                                    touched={step1Touched}
                                    errorMsg="Telefone inválido"
                                    onChange={(e: any) => updateDados("telefone", maskPhone(e.target.value))}
                                />
                                <Field
                                    label="CPF *"
                                    placeholder="000.000.000-00"
                                    hint="Necessário para emissão da nota fiscal."
                                    value={dados.cpf}
                                    error={dados.cpf.length > 0 && (dados.cpf.length === 14 ? !validateCPF(dados.cpf) : false)}
                                    touched={step1Touched}
                                    errorMsg="CPF inválido"
                                    onChange={(e: any) => updateDados("cpf", maskCPF(e.target.value))}
                                />
                            </div>
                        )}

                        {step === 2 && (
                            <div className="step-content">
                                <p className="step-description">
                                    🏠 Preencha o endereço completo para entrega.
                                </p>
                                <Field label="Destinatário *" placeholder="Nome de quem receberá o produto" value={endereco.destinatario} onChange={(e: any) => updateEnd("destinatario", e.target.value)} />
                                <Field label="CEP *" placeholder="00000-000" hint="Digite o CEP para entrega." value={endereco.cep} onChange={(e: any) => handleCEPChange(e.target.value)} />
                                <Field label="Rua ou Avenida *" placeholder="Ex: Rua das Flores" value={endereco.rua} onChange={(e: any) => updateEnd("rua", e.target.value)} />
                                <div className="grid-2col">
                                    <Field label="Número *" placeholder="Ex: 123" value={endereco.numero} onChange={(e: any) => updateEnd("numero", e.target.value)} />
                                    <Field label="Complemento (opcional)" placeholder="Apt, Bloc..." value={endereco.complemento} onChange={(e: any) => updateEnd("complemento", e.target.value)} />
                                </div>
                                <Field label="Bairro *" placeholder="Nome do bairro" value={endereco.bairro} onChange={(e: any) => updateEnd("bairro", e.target.value)} />
                                <div className="grid-cidade-uf">
                                    <Field label="Cidade *" placeholder="Ex: São Paulo" value={endereco.cidade} onChange={(e: any) => updateEnd("cidade", e.target.value)} />
                                    <Field label="Estado *" placeholder="SP" value={endereco.estado} onChange={(e: any) => updateEnd("estado", e.target.value)} />
                                </div>

                                <p className="step-description" style={{ marginTop: '32px' }}>🚀 Escolha uma forma de entrega:</p>
                                <div className="shipping-options">
                                    <div
                                        className={`shipping-card ${shipping.type === 'economica' ? 'active' : ''}`}
                                        onClick={() => setShipping({ type: 'economica', price: 0, label: 'Entrega Econômica' })}
                                    >
                                        <div className="s-check">
                                            <div className="s-circle"></div>
                                        </div>
                                        <div className="s-info">
                                            <div className="s-title-row">
                                                <span className="s-name">Entrega Econômica</span>
                                                <span className="s-price-free">Grátis</span>
                                            </div>
                                            <p className="s-delivery">Chega até quinta, dia 9 de abril</p>
                                        </div>
                                    </div>

                                    <div
                                        className={`shipping-card ${shipping.type === 'prioritaria' ? 'active' : ''}`}
                                        onClick={() => setShipping({ type: 'prioritaria', price: 12.9, label: 'Entrega Rápida Prioritária' })}
                                    >
                                        <div className="s-check">
                                            <div className="s-circle"></div>
                                        </div>
                                        <div className="s-info">
                                            <div className="s-title-row">
                                                <span className="s-name">Entrega Rápida Prioritária</span>
                                                <span className="s-price">R$ 12,90</span>
                                            </div>
                                            <p className="s-delivery">Chega até segunda, dia 6 de abril</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="step-content">
                                <p className="step-description">
                                    ✅ Escolha sua forma de pagamento preferida para finalizar.
                                </p>

                                <div className="payment-method-selector-new">
                                    <div className={`pm-option-pix-new ${paymentMethod === 'pix' ? 'active' : ''}`} onClick={() => setPaymentMethod('pix')}>
                                        <div className="pix-pm-top">
                                            <div className="pix-pm-left">
                                                <div className="radio-circle">
                                                    <div className="radio-inner"></div>
                                                </div>
                                                <span className="pix-icon">❖</span>
                                                <span className="pm-text" style={{ fontWeight: 600 }}>Pix</span>
                                            </div>
                                        </div>
                                        <div className="pix-pm-footer">
                                            😲 35% de desconto + envio prioritário
                                        </div>
                                    </div>
                                    <div className={`pm-option-new ${paymentMethod === 'credit_card' ? 'active' : ''}`} onClick={() => setPaymentMethod('credit_card')}>
                                        <div className="pm-main-col">
                                            <div className="pm-main">
                                                <span className="pm-icon">💳</span>
                                                <span className="pm-text">Cartão de Crédito</span>
                                            </div>
                                            <div className="card-flags-row">
                                                <img src="https://github.bubbstore.com/svg/card-hiper.svg" alt="Hiper" height="20" />
                                                <img src="https://github.bubbstore.com/svg/card-amex.svg" alt="Amex" height="20" />
                                                <img src="https://github.bubbstore.com/svg/card-visa.svg" alt="Visa" height="20" />
                                                <img src="https://github.bubbstore.com/svg/card-diners.svg" alt="Diners" height="20" />
                                                <img src="https://github.bubbstore.com/svg/card-mastercard.svg" alt="Mastercard" height="20" />
                                                <img src="https://github.bubbstore.com/svg/card-discover.svg" alt="Discover" height="20" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {paymentMethod && (
                                    <div className="order-bump-new">
                                        <div className="bump-badge">🎉 VOCÊ TEM 1 OFERTA!</div>
                                        <div className="bump-content">
                                            <div className="bump-main">
                                                <div style={{ width: '60px', height: '60px', borderRadius: '8px', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>✨</div>
                                                <div className="bump-info">
                                                    <p className="bump-title">Kit Gel DermaVit | 2 Und</p>
                                                    <p className="bump-price">por <strong>R$ 99,90</strong></p>
                                                </div>
                                            </div>
                                            <div className="bump-divider" />
                                            <p className="bump-subtitle">Adicione +2 pela Metade do Preço</p>
                                            <div className={`bump-check-btn ${hasOrderBump ? 'active' : ''}`} onClick={() => setHasOrderBump(!hasOrderBump)}>
                                                <div className="bump-checkbox">
                                                    {hasOrderBump && "✓"}
                                                </div>
                                                <span>+ Comprar Junto</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {paymentMethod === 'pix' && (
                                    <div className="pix-details-box">
                                        <p className="pix-instruction">
                                            A confirmação de pagamento é realizada em poucos minutos. Utilize o aplicativo do seu banco para pagar.
                                        </p>
                                        <div className="pix-expiration-warning">
                                            <span className="timer-icon">⏱️</span>
                                            <p>O código PIX expira em 10 minutos. Pague dentro do prazo para garantir sua compra.</p>
                                        </div>
                                    </div>
                                )}

                                {paymentMethod === 'credit_card' && (
                                    <div className="card-form-wrapper" style={{ minHeight: '400px' }}>
                                        <CardPayment
                                            key={totalPrice}
                                            initialization={{
                                                amount: totalPrice,
                                                payer: {
                                                    email: dados.email,
                                                },
                                            }}
                                            customization={{
                                                visual: {
                                                    style: {
                                                        theme: 'default',
                                                        customVariables: {
                                                            formButtonWidth: '100%',
                                                            formButtonHeight: '52px',
                                                            colorPrimary: '#10b981',
                                                            colorSecondary: '#10b981',
                                                            borderRadiusSmall: '8px'
                                                        }
                                                    }
                                                },
                                                paymentMethods: {
                                                    maxInstallments: 6,
                                                    types: {
                                                        excluded: ['debit_card']
                                                    }
                                                }
                                            }}
                                            onSubmit={async (formData) => {
                                                await handleFinalize(formData);
                                            }}
                                            onReady={() => console.log('Brick is ready')}
                                            onError={(e) => {
                                                console.error(e);
                                            }}
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="checkout-actions" style={{ marginTop: '24px' }}>
                            {/* Hide this button in Final Step if Credit Card is selected (Brick has its own button) */}
                            {!(step === 3 && paymentMethod === 'credit_card') && (
                                <button
                                    className="btn-primary-new"
                                    onClick={() => {
                                        if (step === 1) {
                                            setStep1Touched(true);
                                            if (isStep1Valid()) {
                                                setEndereco(prev => ({ ...prev, destinatario: prev.destinatario || dados.nome }));
                                                setStep(2);
                                            }
                                        } else if (step === 2) {
                                            if (isStep2Valid()) setStep(3);
                                        } else {
                                            handleFinalize();
                                        }
                                    }}
                                    disabled={
                                        loading ||
                                        (step === 2 && !isStep2Valid()) ||
                                        (step === 3 && !paymentMethod)
                                    }
                                >
                                    {loading ? "Processando..." : (
                                        step === 1 ? "Continuar para a Entrega →" :
                                            step === 2 ? "Ir para Pagamento →" :
                                                paymentMethod === 'pix' ? "Finalizar Compra" : "✅ Confirmar e Pagar"
                                    )}
                                </button>
                            )}

                            {step > 1 && (
                                <button className="btn-back-new" onClick={prevStep} disabled={loading}>
                                    ← Voltar
                                </button>
                            )}
                        </div>

                        <p className="security-hint">
                            🔒 Pagamento processado com segurança via Mercado Pago. Seus dados estão protegidos.
                        </p>
                    </div>

                    {/* Right Side: Order Summary */}
                    <div className="summary-side">
                        <div className="summary-card" style={{ padding: 0, overflow: 'hidden' }}>
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '16px 20px',
                                    background: '#f1f5f9',
                                    cursor: 'pointer',
                                    transition: 'background 0.2s'
                                }}
                                onClick={() => setShowSummary(!showSummary)}
                            >
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1e293b', textTransform: 'uppercase' }}>
                                        RESUMO (1)
                                    </span>
                                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                        Informações da sua compra
                                    </span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#10b981' }}>
                                        R$ {finalPrice.toFixed(2)}
                                    </span>
                                    <span style={{ color: '#1e293b', fontSize: '1.2rem', transform: showSummary ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }}>
                                        ▼
                                    </span>
                                </div>
                            </div>

                            <div style={{ padding: showSummary ? '24px' : '0', maxHeight: showSummary ? '1000px' : '0', overflow: 'hidden', transition: 'all 0.3s' }}>
                                <div className="summary-anim">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                                        <div style={{ width: '80px', height: '80px', flexShrink: 0 }}>
                                            <img src={product.imageUrl} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '10px', border: '1px solid #e2e8f0' }} />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#1e293b', margin: '0 0 4px 0' }}>{product.name}</h4>
                                            <div style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '4px' }}>
                                                Produto: R$ {product.price.toFixed(2)}
                                            </div>
                                            {shipping.price > 0 && (
                                                <div style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '4px' }}>
                                                    Frete: R$ {shipping.price.toFixed(2)}
                                                </div>
                                            )}
                                            {hasOrderBump && (
                                                <div style={{ fontSize: '0.9rem', color: '#10b981', marginBottom: '4px', fontWeight: 700 }}>
                                                    Oferta Extra: + R$ {bumpPrice.toFixed(2)}
                                                </div>
                                            )}
                                            {paymentMethod === 'pix' && (
                                                <div style={{ fontSize: '0.9rem', color: '#10b981', marginBottom: '4px', fontWeight: 700 }}>
                                                    Desconto PIX (35%): - R$ {(totalPrice * 0.35).toFixed(2)}
                                                </div>
                                            )}
                                            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#10b981' }}>
                                                Total: R$ {finalPrice.toFixed(2)}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Removido o card de resumo de pagamento conforme solicitado */}
                                </div>
                            </div>
                        </div>

                        <div className="trust-badges-new">
                            <div className="badge-item-new">
                                <div className="badge-icon-col">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.3c.4-.2.6-.6.5-1.1z" /></svg>
                                </div>
                                <div className="badge-text-col">
                                    <div className="badge-stars">★★★★★</div>
                                    <h4 className="badge-title">Envio Rápido</h4>
                                    <p className="badge-desc">Todos os nossos produtos são enviados diretamente para o endereço do cliente, garantindo mais agilidade na entrega.</p>
                                </div>
                            </div>

                            <div className="badge-divider-new" />

                            <div className="badge-item-new">
                                <div className="badge-icon-col">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M9 12l2 2 4-4" /></svg>
                                </div>
                                <div className="badge-text-col">
                                    <div className="badge-stars">★★★★★</div>
                                    <h4 className="badge-title">Trocas e devoluções</h4>
                                    <p className="badge-desc">Se não gostar, você pode trocar ou devolver em até 7 dias</p>
                                </div>
                            </div>

                            <div className="badge-divider-new" />

                            <div className="badge-item-new">
                                <div className="badge-icon-col">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
                                </div>
                                <div className="badge-text-col">
                                    <div className="badge-stars">★★★★★</div>
                                    <h4 className="badge-title">Compra protegida</h4>
                                    <p className="badge-desc">Seus dados cuidados durante toda a compra.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <footer className="checkout-footer">
                <div className="footer-content">
                    <div className="footer-info">
                        <p><strong>PagFlow Sistemas de Pagamentos LTDA</strong></p>
                        <p>CNPJ: 00.000.000/0001-00</p>
                        <p>Av. Paulista, 1000 - Bela Vista, São Paulo - SP, 01310-100</p>
                    </div>

                    <div className="footer-links">
                        <a href="#">Termos de Uso</a>
                        <a href="#">Privacidade</a>
                        <a href="#">Ajuda</a>
                    </div>

                    <p style={{ fontSize: '0.75rem', marginTop: '10px', opacity: 0.6 }}>
                        © {new Date().getFullYear()} PagFlow. Todos os direitos reservados.
                    </p>
                </div>
            </footer>
        </div>
    );
}
