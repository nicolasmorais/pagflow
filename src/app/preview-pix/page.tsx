'use client';

import { useState } from 'react';

const MOCK_PIX_CODE = '00020126580014br.gov.bcb.pix0136a629534e-7693-4846-b028-571ed5f2a45f52040000530398654041.005802BR5925LOJA EXEMPLO PAGFLOW LTDA6009SAO PAULO62070503***6304E2CA';

function PlaceholderQR() {
    const size = 156;
    const cellSize = 6;
    const cells: boolean[][] = [];
    for (let y = 0; y < Math.floor(size / cellSize); y++) {
        cells[y] = [];
        for (let x = 0; x < Math.floor(size / cellSize); x++) {
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
                    filled ? <rect key={`${x}-${y}`} x={x * cellSize} y={y * cellSize} width={cellSize} height={cellSize} fill="#241F16" /> : null
                )
            )}
        </svg>
    );
}

export default function PreviewPixPage() {
    const [copied, setCopied] = useState(false);

    return (
        <>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            <link href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400&family=Atkinson+Hyperlegible+Next:wght@500;700;800&display=swap" rel="stylesheet" />

            <style>{`
                *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
                html { scroll-behavior: smooth; }
                body {
                    margin: 0;
                    background: #FBF7EF;
                    font-family: 'Atkinson Hyperlegible', 'Atkinson Hyperlegible Next', system-ui, sans-serif;
                    color: #241F16;
                    -webkit-font-smoothing: antialiased;
                }
                .page {
                    max-width: 520px;
                    margin: 0 auto;
                    padding: 20px 18px 48px;
                }
                a { color: #093F30; }
                :focus-visible { outline: 3px solid #1D6FD8; outline-offset: 3px; }

                .status {
                    text-align: center;
                    margin-bottom: 26px;
                }
                .status-badge {
                    width: 74px; height: 74px;
                    margin: 0 auto 16px;
                    background: #0B5D45;
                    border-radius: 50%;
                    display: flex; align-items: center; justify-content: center;
                }
                .status-badge svg { width: 38px; height: 38px; }
                .status h1 {
                    font-size: 25px;
                    font-weight: 800;
                    line-height: 1.35;
                    margin: 0 0 10px;
                    color: #241F16;
                }
                .status p {
                    font-size: 19px;
                    line-height: 1.5;
                    margin: 0;
                    color: #4A4436;
                    font-weight: 400;
                }

                .card {
                    background: #FFFFFF;
                    border: 2px solid #E7DFCC;
                    border-radius: 18px;
                    padding: 22px 20px;
                    margin-bottom: 22px;
                }

                .step-instruction {
                    text-align: center;
                    font-size: 19px;
                    font-weight: 700;
                    margin: 0 0 18px;
                }

                .qr-wrap {
                    display: flex;
                    justify-content: center;
                    margin-bottom: 6px;
                }
                .qr-box {
                    width: 220px; height: 220px;
                    background: #FBF7EF;
                    border: 2px solid #D8CBA8;
                    border-radius: 14px;
                    display: flex; align-items: center; justify-content: center;
                    padding: 16px;
                }
                .qr-box svg { width: 100%; height: 100%; }
                .qr-caption {
                    text-align: center;
                    font-size: 15px;
                    color: #4A4436;
                    margin: 8px 0 0;
                }

                .or-row {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin: 24px 0 16px;
                }
                .or-row hr { flex: 1; border: none; border-top: 2px solid #E7DFCC; }
                .or-row span { font-size: 15px; font-weight: 700; color: #4A4436; white-space: nowrap; }

                .code-box {
                    background: #FBF7EF;
                    border: 2px dashed #D8CBA8;
                    border-radius: 12px;
                    padding: 14px;
                    font-family: monospace;
                    font-size: 14px;
                    color: #4A4436;
                    word-break: break-all;
                    line-height: 1.5;
                    margin-bottom: 16px;
                }

                .btn-copy {
                    width: 100%;
                    background: #0B5D45;
                    color: #fff;
                    border: none;
                    border-radius: 14px;
                    padding: 20px;
                    font-size: 20px;
                    font-weight: 800;
                    font-family: inherit;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    cursor: pointer;
                    min-height: 64px;
                    transition: background .18s;
                }
                .btn-copy:hover { background: #093F30; }
                .btn-copy.copied { background: #093F30; }
                .btn-copy svg { width: 24px; height: 24px; flex: none; }

                .copy-hint {
                    text-align: center;
                    font-size: 15px;
                    color: #4A4436;
                    margin: 12px 0 0;
                }

                .steps-title {
                    font-size: 19px;
                    font-weight: 800;
                    margin: 0 0 16px;
                }
                .step-row {
                    display: flex;
                    gap: 14px;
                    margin-bottom: 18px;
                }
                .step-row:last-child { margin-bottom: 0; }
                .step-num {
                    flex: none;
                    width: 36px; height: 36px;
                    border-radius: 50%;
                    background: #E4F3EB;
                    color: #093F30;
                    font-weight: 800;
                    font-size: 17px;
                    display: flex; align-items: center; justify-content: center;
                }
                .step-text {
                    font-size: 17px;
                    line-height: 1.5;
                    color: #241F16;
                    padding-top: 5px;
                }
                .step-text strong { font-weight: 700; }

                .trust-row {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 10px 18px;
                    justify-content: center;
                    margin-bottom: 22px;
                }
                .trust-item {
                    display: flex;
                    align-items: center;
                    gap: 7px;
                    font-size: 15px;
                    color: #4A4436;
                    font-weight: 700;
                }
                .trust-item svg { width: 18px; height: 18px; color: #0B5D45; flex: none; }

                .help-card {
                    background: #E4F3EB;
                    border: 2px solid #0B5D45;
                    border-radius: 16px;
                    padding: 20px;
                    text-align: center;
                }
                .help-card p.title {
                    font-size: 18px;
                    font-weight: 800;
                    margin: 0 0 6px;
                    color: #093F30;
                }
                .help-card p.sub {
                    font-size: 16px;
                    margin: 0 0 16px;
                    color: #4A4436;
                }
                .btn-help {
                    display: inline-flex;
                    align-items: center;
                    gap: 10px;
                    background: #093F30;
                    color: #fff;
                    text-decoration: none;
                    border-radius: 12px;
                    padding: 16px 22px;
                    font-weight: 800;
                    font-size: 17px;
                    min-height: 56px;
                    transition: filter .18s;
                }
                .btn-help:hover { filter: brightness(1.15); }
                .btn-help svg { width: 22px; height: 22px; }

                .pix-toast {
                    position: fixed; bottom: 24px; left: 50%;
                    transform: translateX(-50%) translateY(20px);
                    background: #241F16; color: #fff;
                    padding: 12px 24px; border-radius: 99px;
                    font-size: 15px; font-weight: 700;
                    opacity: 0; transition: all .25s;
                    white-space: nowrap; z-index: 99; pointer-events: none;
                }
                .pix-toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }
            `}</style>

            <div className="page">
                {/* STATUS */}
                <div className="status">
                    <div className="status-badge">
                        <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                    </div>
                    <h1>Seu pedido já está separado</h1>
                    <p>Falta só o pagamento para enviarmos até você.</p>
                </div>

                {/* QR CODE CARD */}
                <div className="card">
                    <p className="step-instruction">Como pagar com PIX</p>

                    <div className="qr-wrap">
                        <div className="qr-box">
                            <PlaceholderQR />
                        </div>
                    </div>
                    <p className="qr-caption">Abra o aplicativo do seu banco e escaneie este código</p>

                    <div className="or-row">
                        <hr />
                        <span>ou pague copiando o código</span>
                        <hr />
                    </div>

                    <div className="code-box">{MOCK_PIX_CODE}</div>

                    <button
                        className={`btn-copy ${copied ? 'copied' : ''}`}
                        onClick={() => {
                            navigator.clipboard.writeText(MOCK_PIX_CODE);
                            setCopied(true);
                            setTimeout(() => setCopied(false), 3000);
                        }}
                    >
                        {copied ? (
                            <>
                                <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                Código copiado!
                            </>
                        ) : (
                            <>
                                <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                                Copiar código PIX
                            </>
                        )}
                    </button>
                    <p className="copy-hint">Toque no botão, depois cole o código no aplicativo do seu banco</p>
                </div>

                {/* NEXT STEPS */}
                <div className="card">
                    <p className="steps-title">O que acontece depois do pagamento</p>
                    <div className="step-row">
                        <span className="step-num">1</span>
                        <p className="step-text"><strong>Você recebe um e-mail de confirmação</strong> em poucos minutos, assim que identificarmos o pagamento.</p>
                    </div>
                    <div className="step-row">
                        <span className="step-num">2</span>
                        <p className="step-text"><strong>Seu pedido é enviado no mesmo dia</strong> para pagamentos feitos até às 15h.</p>
                    </div>
                    <div className="step-row">
                        <span className="step-num">3</span>
                        <p className="step-text"><strong>Você acompanha a entrega</strong> pelo código de rastreio que enviamos por e-mail.</p>
                    </div>
                </div>

                {/* TRUST */}
                <div className="trust-row">
                    <span className="trust-item">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                        PIX oficial do Banco Central
                    </span>
                    <span className="trust-item">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                        Seus dados protegidos
                    </span>
                </div>

                {/* HELP */}
                <div className="help-card">
                    <p className="title">Precisa de ajuda para pagar?</p>
                    <p className="sub">Fale com a gente pelo WhatsApp, é rapidinho</p>
                    <a className="btn-help" href="#">
                        <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                        Chamar no WhatsApp
                    </a>
                </div>
            </div>

            {/* TOAST */}
            <div className={`pix-toast ${copied ? 'show' : ''}`}>✓ Código copiado!</div>
        </>
    );
}
