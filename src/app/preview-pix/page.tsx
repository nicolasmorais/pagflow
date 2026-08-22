'use client';

import { useState } from 'react';

const MOCK_PIX_CODE = '00020126580014br.gov.bcb.pix0136a629534e-7693-4846-b028-571ed5f2a45f52040000530398654041.005802BR5925LOJA EXEMPLO PAGFLOW LTDA6009SAO PAULO62070503***6304E2CA';

// Generate a simple placeholder QR code SVG
function PlaceholderQR() {
    const size = 156;
    const cellSize = 6;
    const cells: boolean[][] = [];
    // Deterministic pattern
    for (let y = 0; y < Math.floor(size / cellSize); y++) {
        cells[y] = [];
        for (let x = 0; x < Math.floor(size / cellSize); x++) {
            // Finder patterns (corners)
            const inTopLeft = x < 7 && y < 7;
            const inTopRight = x >= Math.floor(size / cellSize) - 7 && y < 7;
            const inBottomLeft = x < 7 && y >= Math.floor(size / cellSize) - 7;
            if (inTopLeft || inTopRight || inBottomLeft) {
                const cx = inTopRight ? x - (Math.floor(size / cellSize) - 7) : x;
                const cy = inBottomLeft ? y - (Math.floor(size / cellSize) - 7) : y;
                cells[y][x] = (cx === 0 || cx === 6 || cy === 0 || cy === 6 || (cx >= 2 && cx <= 4 && cy >= 2 && cy <= 4));
            } else {
                cells[y][x] = ((x * 7 + y * 13 + x * y) % 3) === 0;
            }
        }
    }
    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block' }}>
            <rect width={size} height={size} fill="white" />
            {cells.map((row, y) =>
                row.map((filled, x) =>
                    filled ? <rect key={`${x}-${y}`} x={x * cellSize} y={y * cellSize} width={cellSize} height={cellSize} fill="#111" /> : null
                )
            )}
        </svg>
    );
}

export default function PreviewPixPage() {
    const [copied, setCopied] = useState(false);

    return (
        <>
            <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />

            <style>{`
                *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
                :root {
                    --bg: #F5F5F5;
                    --white: #FFFFFF;
                    --black: #1E1E1E;
                    --green: #1D9A52;
                    --green-dark: #136638;
                    --border: #E5E7EB;
                    --text: #1E1E1E;
                    --muted: #6B7280;
                    --light: #9CA3AF;
                    --red: #B83030;
                    --radius: 12px;
                    --radius-sm: 8px;
                }
                html { scroll-behavior: smooth; }
                body { font-family: 'Manrope', sans-serif !important; background: var(--bg); color: var(--text); line-height: 1.55; font-size: 16px; -webkit-font-smoothing: antialiased; }

                .pix-page-wrapper {
                    background: #F5F5F5;
                    min-height: 100vh;
                    font-family: 'Manrope', sans-serif !important;
                    color: #111111;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }
                .pix-header-strip {
                    background: #fff;
                    border-bottom: 1px solid #e5e7eb;
                    padding: 10px 20px;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    gap: 16px;
                    font-size: 13px;
                    font-weight: 600;
                    color: #4b5563;
                    width: 100%;
                }
                .ssl-badge { display: flex; align-items: center; gap: 6px; color: #059669; }
                .lock-icon { width: 14px; height: 14px; fill: currentColor; }
                .bc-badge { display: flex; align-items: center; gap: 6px; }
                .bc-badge::before { content: ''; width: 4px; height: 4px; border-radius: 50%; background: #d1d5db; }

                .success-page-content {
                    max-width: 480px;
                    width: 100%;
                    margin: 0 auto;
                    padding: 28px 24px 60px;
                }

                .status-top { text-align: center; margin-bottom: 24px; }
                .check-circle {
                    width: 52px; height: 52px; border-radius: 50%;
                    background: var(--green);
                    display: flex; align-items: center; justify-content: center;
                    margin: 0 auto 14px;
                }
                .check-circle svg { width: 26px; height: 26px; color: #fff; }
                .status-title { font-size: 20px; font-weight: 800; letter-spacing: -.3px; margin-bottom: 4px; line-height: 1.3; }
                .status-sub { font-size: 13px; font-weight: 500; color: var(--muted); }

                .pix-card {
                    background: var(--white);
                    border: 1px solid var(--border);
                    border-radius: var(--radius);
                    overflow: hidden;
                    margin-bottom: 12px;
                }
                .qr-section { padding: 24px 24px 20px; text-align: center; }
                .qr-instruction { font-size: 13px; font-weight: 600; color: var(--muted); margin-bottom: 16px; }
                .qr-wrap {
                    width: 180px; height: 180px;
                    margin: 0 auto 20px;
                    border: 1.5px solid var(--border);
                    border-radius: var(--radius-sm);
                    padding: 12px;
                    background: var(--white);
                    display: flex; align-items: center; justify-content: center;
                }
                .qr-wrap img, .qr-wrap svg { width: 100%; height: 100%; object-fit: contain; }

                .or-divider-pix {
                    display: flex; align-items: center; gap: 10px;
                    margin: 0 24px 16px;
                }
                .or-divider-pix::before, .or-divider-pix::after { content: ''; flex: 1; height: 1px; background: var(--border); }
                .or-divider-pix span { font-size: 11px; font-weight: 700; color: var(--light); letter-spacing: .04em; }

                .code-section { padding: 0 24px 20px; }
                .code-box {
                    background: var(--bg);
                    border: 1.5px solid var(--border);
                    border-radius: var(--radius-sm);
                    padding: 12px 14px;
                    font-size: 11px; font-weight: 600; color: var(--muted);
                    word-break: break-all; line-height: 1.5;
                    margin-bottom: 12px; letter-spacing: .01em;
                    font-family: 'Manrope', sans-serif !important;
                }

                .pix-copy-btn {
                    width: 100%; padding: 16px;
                    background: var(--green); color: var(--white);
                    border: none; border-radius: var(--radius-sm);
                    font-family: 'Manrope', sans-serif !important;
                    font-size: 16px; font-weight: 800; cursor: pointer;
                    display: flex; align-items: center; justify-content: center; gap: 8px;
                    transition: all .18s; letter-spacing: -.1px;
                }
                .pix-copy-btn:hover { filter: brightness(1.07); transform: translateY(-1px); }
                .pix-copy-btn:active { transform: none; filter: none; }
                .pix-copy-btn.copied { background: #136638; }
                .pix-copy-btn svg { width: 18px; height: 18px; flex-shrink: 0; }

                .steps-card {
                    background: var(--white);
                    border: 1px solid var(--border);
                    border-radius: var(--radius);
                    padding: 18px 20px;
                    margin-bottom: 12px;
                }
                .steps-title { font-size: 11px; font-weight: 800; color: var(--muted); text-transform: uppercase; letter-spacing: .06em; margin-bottom: 14px; }
                .step-row-pix { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 12px; }
                .step-row-pix:last-child { margin-bottom: 0; }
                .step-num-pix {
                    width: 24px; height: 24px; border-radius: 50%;
                    background: #111111; color: var(--white);
                    font-size: 11px; font-weight: 800;
                    display: flex; align-items: center; justify-content: center;
                    flex-shrink: 0; margin-top: 1px;
                }
                .step-text-pix { font-size: 13px; font-weight: 600; color: #111111; line-height: 1.45; }
                .step-text-pix span { color: var(--muted); font-weight: 500; }

                .trust-row-pix {
                    display: flex; align-items: center; justify-content: center;
                    gap: 20px; flex-wrap: wrap; padding: 14px 0;
                }
                .trust-item-pix { display: flex; align-items: center; gap: 5px; font-size: 11.5px; font-weight: 700; color: var(--muted); }
                .trust-item-pix svg { width: 13px; height: 13px; color: var(--green); }

                .pix-toast {
                    position: fixed; bottom: 24px; left: 50%;
                    transform: translateX(-50%) translateY(20px);
                    background: #111111; color: var(--white);
                    padding: 10px 20px; border-radius: 99px;
                    font-size: 13px; font-weight: 700;
                    opacity: 0; transition: all .25s;
                    white-space: nowrap; z-index: 99; pointer-events: none;
                }
                .pix-toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }

            `}</style>

            <div className="pix-page-wrapper">
                {/* HEADER STRIP */}
                <div className="pix-header-strip">
                    <div className="ssl-badge">
                        <svg className="lock-icon" viewBox="0 0 24 24">
                            <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
                        </svg>
                        Pagamento 100% seguro
                    </div>
                    <div className="bc-badge">Banco Central do Brasil</div>
                </div>

                <div className="success-page-content">
                    {/* STATUS */}
                    <div className="status-top">
                        <div className="check-circle">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"/>
                            </svg>
                        </div>
                        <div className="status-title">Seu pedido já foi encaminhado ao setor de logística.<br />Assim que o pagamento for confirmado, o envio será realizado.</div>
                        <div className="status-sub" style={{ marginTop: '6px' }}>Escaneie o QR Code ou copie o codigo abaixo</div>
                    </div>

                    {/* MAIN PIX CARD */}
                    <div className="pix-card">
                        <div className="qr-section">
                            <div className="qr-instruction">Abra o app do banco e escaneie o QR Code</div>
                            <div className="qr-wrap">
                                <PlaceholderQR />
                            </div>
                        </div>

                        <div className="or-divider-pix"><span>OU COPIE O CODIGO</span></div>

                        <div className="code-section">
                            <div className="code-box">{MOCK_PIX_CODE}</div>
                            <button
                                className={`pix-copy-btn ${copied ? 'copied' : ''}`}
                                onClick={() => {
                                    navigator.clipboard.writeText(MOCK_PIX_CODE);
                                    setCopied(true);
                                    setTimeout(() => setCopied(false), 3000);
                                }}
                            >
                                {copied ? (
                                    <>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                        Codigo Copiado!
                                    </>
                                ) : (
                                    <>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                                        Copiar Codigo PIX
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
                                Confirmacao por e-mail em minutos <span>— assim que o pagamento for identificado em <strong>cliente@email.com</strong></span>
                            </div>
                        </div>
                        <div className="step-row-pix">
                            <div className="step-num-pix">2</div>
                            <div className="step-text-pix">
                                Separacao e envio do pedido <span>— pagamentos ate as 15h saem no mesmo dia.</span>
                            </div>
                        </div>
                        <div className="step-row-pix">
                            <div className="step-num-pix">3</div>
                            <div className="step-text-pix">Codigo de rastreio por e-mail <span>— acompanhe sua entrega em tempo real</span></div>
                        </div>
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

                    <div style={{ marginTop: '20px' }}>
                        <p style={{ fontSize: '13px', color: '#777', textAlign: 'center' }}>
                            Precisa de ajuda? <a href="mailto:suporte@loja.com" style={{ color: '#111', fontWeight: 700, textDecoration: 'none' }}>Entre em contato por e-mail</a>
                        </p>
                    </div>
                </div>

                {/* TOAST */}
                <div className={`pix-toast ${copied ? 'show' : ''}`}>✓ Codigo copiado!</div>
            </div>
        </>
    );
}
