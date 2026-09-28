'use client';

import { useState, useEffect } from 'react';

interface Props {
    qrCodeBase64: string;
    emv: string;
    parcelas: number;
    valorParcela: number;
    email: string;
}

const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function PixParceladoSuccess({ qrCodeBase64, emv, parcelas, valorParcela, email }: Props) {
    const [copied, setCopied] = useState(false);
    const [seconds, setSeconds] = useState(600);

    useEffect(() => {
        const t = setInterval(() => setSeconds(s => Math.max(0, s - 1)), 1000);
        return () => clearInterval(t);
    }, []);

    const total = valorParcela * parcelas;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    const timerText = seconds > 0 ? `Expira em ${m}:${String(s).padStart(2, '0')}` : 'QR Code expirado';

    async function copiar() {
        if (!emv) return;
        try {
            await navigator.clipboard.writeText(emv);
        } catch {
            const ta = document.createElement('textarea');
            ta.value = emv;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
    }

    const card: React.CSSProperties = {
        background: '#fff',
        border: '1px solid #e4e7ec',
        borderRadius: 20,
        width: '100%',
        maxWidth: 420,
        overflow: 'hidden',
        boxShadow: '0 4px 24px rgba(0,0,0,.06)',
    };

    return (
        <div style={{ background: '#f7f8fa', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 16px 40px', fontFamily: "'Inter', system-ui, sans-serif" }}>
            <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" />

            <div style={card}>
                {/* Header */}
                <div style={{ background: '#edfaf8', borderBottom: '1px solid #e4e7ec', padding: '28px 24px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, textAlign: 'center' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#32bcad', color: '#fff', fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', padding: '4px 10px', borderRadius: 20 }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        Pix Parcelado
                    </div>

                    <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f1623', lineHeight: 1.25, margin: 0 }}>
                        Escaneie e autorize o pagamento
                    </h1>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 30, fontWeight: 700, color: '#00b37e', lineHeight: 1 }}>
                            R$&nbsp;{fmt(valorParcela)}
                        </span>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: '#0f1623', whiteSpace: 'nowrap' }}>{parcelas}× a cada 7 dias</span>
                            <span style={{ fontSize: 11, color: '#8a93a2', whiteSpace: 'nowrap' }}>Total R$&nbsp;{fmt(total)}</span>
                        </div>
                    </div>

                    {/* Dots de progresso */}
                    <div style={{ display: 'flex', gap: 5, alignItems: 'center', justifyContent: 'center' }}>
                        {Array.from({ length: parcelas }).map((_, i) => (
                            <div key={i} style={{
                                height: 6,
                                borderRadius: 99,
                                width: i === 0 ? 24 : 6,
                                background: i === 0 ? '#00b37e' : '#e4e7ec',
                                transition: 'width .2s',
                            }} />
                        ))}
                    </div>

                    <p style={{ fontSize: 14, color: '#4b5563', lineHeight: 1.5, margin: 0 }}>
                        A 1ª parcela é cobrada agora. As demais serão descontadas automaticamente a cada 7 dias.
                    </p>
                </div>

                {/* QR */}
                <div style={{ padding: '28px 24px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, borderBottom: '1px solid #e4e7ec' }}>
                    {qrCodeBase64 ? (
                        <div style={{ background: '#fff', border: '2px solid #e4e7ec', borderRadius: 16, padding: 16, display: 'inline-flex' }}>
                            <img src={`data:image/png;base64,${qrCodeBase64}`} alt="QR Code PIX Parcelado" style={{ width: 192, height: 192, display: 'block', borderRadius: 4 }} />
                        </div>
                    ) : null}

                    {/* Timer */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: seconds < 60 ? '#ef4444' : '#f59e0b', fontWeight: 500, background: seconds < 60 ? '#fef2f2' : '#fffbeb', padding: '6px 14px', borderRadius: 99 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                        </svg>
                        {timerText}
                    </div>

                    {/* Copia e Cola */}
                    {emv && (
                        <div style={{ width: '100%' }}>
                            <p style={{ fontSize: 11, fontWeight: 600, color: '#8a93a2', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 6 }}>Pix Copia e Cola</p>
                            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #e4e7ec', borderRadius: 10, overflow: 'hidden', background: '#f0f2f5', marginBottom: 10 }}>
                                <span style={{ flex: 1, fontSize: 11, color: '#4b5563', padding: '10px 12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: 'monospace' }}>
                                    {emv.substring(0, 40)}…
                                </span>
                                <span style={{ flexShrink: 0, fontSize: 11, color: '#8a93a2', padding: '10px 10px 10px 0' }}>●●●●</span>
                            </div>
                            <button
                                onClick={copiar}
                                style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                                    width: '100%', padding: 16,
                                    background: copied ? '#00b37e' : '#32bcad',
                                    color: '#fff', border: 'none', borderRadius: 14,
                                    fontSize: 17, fontWeight: 700, fontFamily: 'inherit',
                                    cursor: 'pointer', transition: 'opacity .15s, background .2s',
                                    WebkitTapHighlightColor: 'transparent',
                                }}
                            >
                                {copied ? (
                                    <>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                        Código copiado!
                                    </>
                                ) : (
                                    <>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                                        </svg>
                                        Copiar código Pix
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>

                {/* Info boxes */}
                <div style={{ padding: '20px 24px 4px', display: 'flex', flexDirection: 'column', gap: 10, borderBottom: '1px solid #e4e7ec' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px', borderRadius: 12, background: '#e8f9f2', border: '1px solid rgba(0,179,126,.3)' }}>
                        <div style={{ flexShrink: 0, width: 28, height: 28, borderRadius: '50%', background: '#00b37e', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                        </div>
                        <div>
                            <p style={{ fontSize: 13, fontWeight: 700, color: '#0f1623', marginBottom: 3 }}>Produto enviado após a 1ª parcela</p>
                            <p style={{ fontSize: 12, color: '#4b5563', lineHeight: 1.5 }}>
                                Assim que o pagamento de hoje for confirmado, seu pedido entra em separação. As {parcelas - 1} parcelas restantes são cobradas automaticamente a cada 7 dias.
                            </p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px', borderRadius: 12, background: '#fef2f2', border: '1px solid rgba(239,68,68,.25)', marginBottom: 10 }}>
                        <div style={{ flexShrink: 0, width: 28, height: 28, borderRadius: '50%', background: '#ef4444', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                        </div>
                        <div>
                            <p style={{ fontSize: 13, fontWeight: 700, color: '#0f1623', marginBottom: 3 }}>Parcelas em atraso geram negativação</p>
                            <p style={{ fontSize: 12, color: '#4b5563', lineHeight: 1.5 }}>
                                O não pagamento de qualquer parcela resulta em registro de inadimplência no <strong>SPC e Serasa</strong>, podendo afetar seu crédito.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Passos */}
                <div style={{ padding: '20px 24px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: '#0f1623', marginBottom: 14 }}>
                        Como pagar
                        <div style={{ flex: 1, height: 1, background: '#e4e7ec' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {[
                            { n: 1, text: 'Abra o app do seu banco', hint: 'Nubank, Itaú, Bradesco, Caixa, BB ou qualquer outro' },
                            { n: 2, text: 'Acesse Pix → Escanear QR Code', hint: 'Ou use "Pix Copia e Cola" e cole o código acima' },
                            { n: 3, text: `Revise e autorize as ${parcelas} parcelas`, hint: 'O banco exibirá o valor e as datas de débito a cada 7 dias' },
                        ].map(step => (
                            <div key={step.n} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                                <div style={{ flexShrink: 0, width: 28, height: 28, borderRadius: '50%', background: '#f0f2f5', border: '1.5px solid #e4e7ec', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#4b5563', marginTop: 1 }}>
                                    {step.n}
                                </div>
                                <div>
                                    <p style={{ fontSize: 14, fontWeight: 500, color: '#0f1623', lineHeight: 1.4 }}>{step.text}</p>
                                    <p style={{ fontSize: 12, color: '#8a93a2', marginTop: 2, lineHeight: 1.4 }}>{step.hint}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div style={{ background: '#f0f2f5', borderTop: '1px solid #e4e7ec', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8a93a2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                    </svg>
                    <p style={{ fontSize: 12, color: '#8a93a2', lineHeight: 1.4 }}>
                        Confirmação enviada para <span style={{ fontWeight: 600, color: '#4b5563' }}>{email}</span>
                    </p>
                </div>
            </div>

            {/* Segurança */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 20, fontSize: 12, color: '#8a93a2' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                Transação 100% segura via Banco Central do Brasil
            </div>
        </div>
    );
}
