'use client'

import { useId } from 'react'
import PixPayment from '../PixPayment'
import PixParceladoSuccess from '../PixParceladoSuccess'
import { useCheckoutV2, brl, fmt, onlyDigits, deliveryLabel, PIX_TTL, type Section } from './useCheckoutV2'
import './checkout-v2.css'

const UFS = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO']
const COLOR_RE = /^#([0-9a-fA-F]{3,8})$|^rgba?\([\d\s,.%/]+\)$|^hsla?\([\d\s,.%/]+\)$/

/* ── Ícones ── */
const I = {
    lock: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>,
    check: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>,
    shield: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>,
    swap: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M17 2l4 4-4 4" /><path d="M3 11V9a3 3 0 0 1 3-3h15" /><path d="M7 22l-4-4 4-4" /><path d="M21 13v2a3 3 0 0 1-3 3H3" /></svg>,
    chat: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>,
    x: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>,
    pix: <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M11.92 2.3a3 3 0 0 1 2.16.9l2.7 2.7h-.3a2.6 2.6 0 0 0-1.85.77l-2.2 2.2a.6.6 0 0 1-.86 0L9.37 6.67A2.6 2.6 0 0 0 7.52 5.9h-.3l2.54-2.7a3 3 0 0 1 2.16-.9Zm-6.6 5.1h2.2c.3 0 .58.12.8.33l2.2 2.2a2.1 2.1 0 0 0 2.96 0l2.2-2.2c.21-.21.5-.33.8-.33h1.9l2.42 2.42a3 3 0 0 1 0 4.24l-2.42 2.43h-1.9c-.3 0-.59-.12-.8-.34l-2.2-2.2a2.15 2.15 0 0 0-2.96 0l-2.2 2.2c-.22.22-.5.34-.8.34h-2.2L2.9 14.06a3 3 0 0 1 0-4.24L5.32 7.4Zm6.6 7.26a.6.6 0 0 1 .43.18l2.2 2.2a2.6 2.6 0 0 0 1.85.77h.3l-2.7 2.7a3 3 0 0 1-4.24 0L7.22 17.8h.3c.7 0 1.36-.28 1.85-.77l2.12-2.2a.6.6 0 0 1 .43-.18Z" /></svg>,
    card: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" /></svg>,
    repeat: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M17 1l4 4-4 4" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><path d="M7 23l-4-4 4-4" /><path d="M21 13v2a4 4 0 0 1-4 4H3" /></svg>,
}

/* ── Campo com label, erro e dica ligados por id ── */
function Field({ label, error, hint, optional, children, className = '' }: {
    label: string; error?: string; hint?: string; optional?: boolean; className?: string
    children: (p: { id: string; 'aria-invalid'?: boolean; 'aria-describedby'?: string }) => React.ReactNode
}) {
    const id = useId()
    const desc = error ? `${id}-err` : hint ? `${id}-hint` : undefined
    return (
        <div className={`ck2-field ${error ? 'has-error' : ''} ${className}`}>
            <label htmlFor={id}>{label}{optional && <span className="ck2-opt"> (opcional)</span>}</label>
            {children({ id, 'aria-invalid': error ? true : undefined, 'aria-describedby': desc })}
            {error ? <p id={`${id}-err`} className="ck2-err">{error}</p> : hint ? <p id={`${id}-hint`} className="ck2-hint">{hint}</p> : null}
        </div>
    )
}

export default function CheckoutV2(props: any) {
    const { product, customization } = props
    const c = useCheckoutV2(props)
    const pc = customization?.primaryColor?.trim()
    const themeStyle = pc && COLOR_RE.test(pc) ? ({ '--green': pc } as React.CSSProperties) : undefined
    const canGoBack = !customization?.disableBack

    const storeName = product?.storeName || customization?.storeName || 'Loja'
    const logo = product?.storeLogo || customization?.logo
    const supportEmail: string = customization?.supportEmail || ''
    const phoneDigits = onlyDigits(customization?.supportPhone || '')
    const waNumber = phoneDigits ? (phoneDigits.length <= 11 ? `55${phoneDigits}` : phoneDigits) : ''
    const showWa = !customization?.disableWa && !!waNumber

    const pixPct = Math.round(c.pixDiscountPct * 100)
    const pixBadge = customization?.pixBadgeText || (pixPct > 0 ? `${pixPct}% de desconto` : '')
    const maxInstallments = c.installmentOptions[c.installmentOptions.length - 1]?.n ?? 1

    /* ── Resumo do pedido (sidebar e gaveta mobile) ── */
    const summaryLines = (
        <>
            <div className="ck2-prod">
                <div className="ck2-prod-img">{product?.imageUrl ? <img src={product.imageUrl} alt="" /> : null}</div>
                <div className="ck2-prod-info">
                    <p className="ck2-prod-name">{product?.name || 'Produto'}</p>
                    <p className="ck2-prod-qty">Quantidade: 1</p>
                </div>
                <p className="ck2-prod-price">{brl(c.basePrice)}</p>
            </div>
            {c.bumps.filter(b => c.selectedBumps.includes(b.id)).map(b => (
                <div key={b.id} className="ck2-line"><span>{b.name}</span><span>{brl(b.price)}</span></div>
            ))}
            <dl className="ck2-totals">
                <div><dt>Subtotal</dt><dd>{brl(c.subtotal)}</dd></div>
                <div><dt>Frete</dt><dd>{c.shippingPrice === 0 ? <span className="ck2-free">Grátis</span> : brl(c.shippingPrice)}</dd></div>
                {c.paymentMethod === 'pix' && c.pixDiscountValue > 0 && (
                    <div className="ck2-discount"><dt>Desconto PIX ({pixPct}%)</dt><dd>− {brl(c.pixDiscountValue)}</dd></div>
                )}
                {c.paymentMethod === 'pix_automatico' ? (
                    <div className="ck2-total"><dt>Total</dt><dd>{c.parcelas}× {brl(c.valorParcela(c.parcelas))}</dd></div>
                ) : c.paymentMethod === 'card' && c.card.installments > 1 ? (
                    <div className="ck2-total"><dt>Total</dt><dd>{brl(c.cardTotal)}<small>{c.card.installments}× de {brl(c.cardTotal / c.card.installments)}</small></dd></div>
                ) : (
                    <div className="ck2-total"><dt>Total</dt><dd>{brl(c.total)}</dd></div>
                )}
            </dl>
        </>
    )

    const trust = (
        <ul className="ck2-trust">
            <li>{I.shield}<div><strong>Compra protegida</strong><span>Seus dados de pagamento são criptografados.</span></div></li>
            <li>{I.swap}<div><strong>7 dias para trocar ou devolver</strong><span>Direito garantido pelo Código de Defesa do Consumidor.</span></div></li>
            {(supportEmail || showWa) && (
                <li>{I.chat}<div><strong>Atendimento</strong><span>
                    {showWa && <a href={`https://wa.me/${waNumber}`} target="_blank" rel="noreferrer">WhatsApp</a>}
                    {showWa && supportEmail && ' ou '}
                    {supportEmail && <a href={`mailto:${supportEmail}`}>{supportEmail}</a>}
                </span></div></li>
            )}
        </ul>
    )

    /* ── Cabeçalho de cada etapa ── */
    const stepHead = (n: Section, title: string, doneSummary?: React.ReactNode) => {
        const state = c.section === n ? 'active' : c.section > n ? 'done' : 'next'
        return (
            <div className="ck2-step-head">
                <span className={`ck2-step-num is-${state}`} aria-hidden="true">{state === 'done' ? I.check : n}</span>
                <div className="ck2-step-titles">
                    <h2>{title}</h2>
                    {state === 'done' && doneSummary && <p className="ck2-step-sum">{doneSummary}</p>}
                </div>
                {state === 'done' && canGoBack && !c.submitting && (
                    <button type="button" className="ck2-edit" onClick={() => c.goTo(n)} aria-label={`Alterar ${title.toLowerCase()}`}>Alterar</button>
                )}
            </div>
        )
    }

    /* ── Telas finais ── */
    let finalScreen: React.ReactNode = null
    if (c.declined) {
        finalScreen = (
            <div className="ck2-result">
                <div className="ck2-result-mark is-bad">{I.x}</div>
                <h1>Pagamento não aprovado</h1>
                <p className="ck2-result-lede">O banco emissor recusou o cartão. Nenhum valor foi cobrado.</p>
                <div className="ck2-card">
                    <h2 className="ck2-h3">Motivos mais comuns</h2>
                    <ul className="ck2-bullets">
                        <li>Limite insuficiente para o valor da compra</li>
                        <li>Número, validade ou CVV digitados com erro</li>
                        <li>Bloqueio de segurança do banco — confirme a compra no app dele</li>
                    </ul>
                </div>
                <button className="ck2-btn" onClick={() => c.retryAfterDecline('pix')}>
                    Pagar com PIX{c.pixPrice < c.fullPrice ? ` por ${brl(c.pixPrice)}` : ''}
                </button>
                <button className="ck2-btn ck2-btn-ghost" onClick={() => c.retryAfterDecline('card')}>Tentar outro cartão</button>
                {c.orderId && <p className="ck2-result-meta">Pedido #{c.orderId.slice(0, 8).toUpperCase()}</p>}
            </div>
        )
    } else if (c.done && c.paymentMethod === 'pix') {
        finalScreen = (
            <PixPayment
                qrCode={c.pixData?.qrCode || null}
                qrCodeBase64={c.pixData?.qrCodeBase64 || null}
                amount={c.chargedTotal || c.pixPrice}
                orderId={c.orderId}
                productName={product?.name || 'Produto'}
                email={c.dados.email}
                timeLeft={c.timeLeft}
                totalTime={PIX_TTL}
                expired={c.pixExpired}
                paid={c.pixPaid}
                regenerating={c.pixRegenerating}
                checking={c.pixChecking}
                onRegenerate={c.regeneratePix}
                onCheckNow={c.checkPixNow}
            />
        )
    } else if (c.done && c.paymentMethod === 'pix_automatico') {
        finalScreen = (
            <PixParceladoSuccess
                qrCodeBase64={c.subData?.qrCodeBase64 || ''}
                emv={c.subData?.emv || ''}
                parcelas={c.parcelas}
                valorParcela={c.valorParcela(c.parcelas)}
                email={c.dados.email}
            />
        )
    } else if (c.done) {
        const n = c.card.installments
        finalScreen = (
            <div className="ck2-result">
                <div className="ck2-result-mark is-ok">{I.check}</div>
                <h1>Pagamento aprovado</h1>
                <p className="ck2-result-lede">Seu pedido está confirmado. Enviamos o comprovante para <strong>{c.dados.email}</strong>.</p>
                <div className="ck2-card">
                    <dl className="ck2-kv">
                        {c.orderId && <div><dt>Pedido</dt><dd>#{c.orderId.slice(0, 8).toUpperCase()}</dd></div>}
                        <div><dt>Produto</dt><dd>{product?.name}</dd></div>
                        <div><dt>Pagamento</dt><dd>Cartão de crédito{n > 1 ? `, ${n}×` : ''}</dd></div>
                        <div className="is-total"><dt>Total</dt><dd>{brl(c.chargedTotal || c.fullPrice)}</dd></div>
                    </dl>
                </div>
                <div className="ck2-card">
                    <h2 className="ck2-h3">Próximos passos</h2>
                    <ol className="ck2-steps-list">
                        <li>Pedidos aprovados até 15h saem no mesmo dia; depois disso, no próximo dia útil.</li>
                        <li>Você recebe o código de rastreio por e-mail quando o pedido for enviado.</li>
                    </ol>
                </div>
            </div>
        )
    }

    const selectedRule = (r: any) => c.shipping.name === r.name && Number(c.shipping.price) === Number(r.price)

    return (
        <div className="ck2" style={themeStyle}>
            <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@500;600;700;800&display=swap" rel="stylesheet" />

            <header className="ck2-header">
                <div className="ck2-header-in">
                    <div className="ck2-logo">{logo ? <img src={logo} alt={storeName} /> : <span>{storeName}</span>}</div>
                    <p className="ck2-secure">{I.lock}Pagamento seguro</p>
                </div>
            </header>

            {customization?.alertText && !finalScreen && (
                <div className="ck2-alert" style={{ background: customization.alertBg, color: customization.alertColor || '#111' }}>{customization.alertText}</div>
            )}

            {finalScreen ? (
                <main className="ck2-final">{finalScreen}</main>
            ) : (
                <>
                    <details className="ck2-msum">
                        <summary>
                            <span>Resumo do pedido</span>
                            <strong>{c.paymentMethod === 'pix_automatico' ? `${c.parcelas}× ${brl(c.valorParcela(c.parcelas))}` : brl(c.paymentMethod === 'card' ? c.cardTotal : c.total)}</strong>
                        </summary>
                        <div className="ck2-msum-body">{summaryLines}</div>
                    </details>

                    <main className="ck2-main">
                        <div className="ck2-form">
                            {/* ── 1. Contato ── */}
                            <section className={`ck2-step ${c.section === 1 ? 'is-active' : ''}`} aria-labelledby="ck2-s1">
                                <div id="ck2-s1">{stepHead(1, 'Seus dados', <>{c.dados.nome}<br />{c.dados.email} · {c.dados.telefone}</>)}</div>
                                {c.section === 1 && (
                                    <form className="ck2-step-body" onSubmit={e => { e.preventDefault(); c.submitContact() }} noValidate>
                                        <Field label="Nome completo" error={c.errors.nome}>
                                            {p => <input {...p} name="name" autoComplete="name" autoCapitalize="words" value={c.dados.nome} onChange={e => c.setDado('nome', e.target.value)} />}
                                        </Field>
                                        <Field label="E-mail" error={c.errors.email} hint="Para enviar a confirmação e o rastreio">
                                            {p => <input {...p} type="email" name="email" autoComplete="email" inputMode="email" autoCapitalize="none" spellCheck={false} value={c.dados.email} onChange={e => c.setDado('email', e.target.value)} />}
                                        </Field>
                                        {c.emailSuggestion && (
                                            <div className="ck2-suggest" role="status">
                                                <span>Você quis dizer <strong>{c.emailSuggestion}</strong>?</span>
                                                <div>
                                                    <button type="button" onClick={() => c.setDado('email', c.emailSuggestion)}>Sim, corrigir</button>
                                                    <button type="button" onClick={() => c.submitContact()}>Não, continuar</button>
                                                </div>
                                            </div>
                                        )}
                                        <Field label="Celular com DDD" error={c.errors.telefone} hint="Avisamos por aqui quando o pedido sair">
                                            {p => <input {...p} type="tel" name="tel" autoComplete="tel-national" inputMode="tel" placeholder="(11) 91234-5678" value={c.dados.telefone} onChange={e => c.setDado('telefone', fmt.tel(e.target.value))} />}
                                        </Field>
                                        {!customization?.disableCpf && (
                                            <Field label="CPF" optional error={c.errors.cpf} hint="Para a nota fiscal. Obrigatório só no cartão">
                                                {p => <input {...p} inputMode="numeric" autoComplete="off" placeholder="000.000.000-00" value={c.dados.cpf} onChange={e => c.setDado('cpf', fmt.cpf(e.target.value))} />}
                                            </Field>
                                        )}
                                        <button type="submit" className="ck2-btn">Continuar</button>
                                    </form>
                                )}
                            </section>

                            {/* ── 2. Entrega ── */}
                            <section className={`ck2-step ${c.section === 2 ? 'is-active' : ''} ${c.section < 2 ? 'is-next' : ''}`} aria-labelledby="ck2-s2">
                                <div id="ck2-s2">{stepHead(2, 'Entrega', <>{c.endereco.rua}, {c.endereco.numero}{c.endereco.complemento ? ` — ${c.endereco.complemento}` : ''}<br />{c.endereco.cidade}/{c.endereco.estado} · {c.shipping.name}</>)}</div>
                                {c.section === 2 && (
                                    <form className="ck2-step-body" onSubmit={e => { e.preventDefault(); c.submitAddress() }} noValidate>
                                        <Field label="CEP" error={c.errors.cep} className="ck2-cep">
                                            {p => (
                                                <div className="ck2-cep-row">
                                                    <input {...p} inputMode="numeric" autoComplete="postal-code" placeholder="00000-000" value={c.endereco.cep} onChange={e => c.onCepChange(e.target.value)} autoFocus />
                                                    <a href="https://buscacepinter.correios.com.br/app/endereco/index.php" target="_blank" rel="noreferrer">Não sei meu CEP</a>
                                                </div>
                                            )}
                                        </Field>
                                        {c.cepStatus === 'loading' && <p className="ck2-cep-msg">Buscando endereço…</p>}
                                        {c.cepStatus === 'notfound' && <p className="ck2-cep-msg is-warn">Não encontramos esse CEP. Confira os números ou preencha o endereço abaixo.</p>}
                                        {c.cepStatus === 'error' && <p className="ck2-cep-msg is-warn">Não conseguimos buscar o CEP agora. Preencha o endereço abaixo.</p>}

                                        {(c.cepStatus !== 'idle' && c.cepStatus !== 'loading') || c.endereco.rua ? (
                                            <>
                                                <Field label="Rua ou avenida" error={c.errors.rua}>
                                                    {p => <input {...p} autoComplete="address-line1" value={c.endereco.rua} onChange={e => c.setEnd('rua', e.target.value)} />}
                                                </Field>
                                                <div className="ck2-row">
                                                    <Field label="Número" error={c.errors.numero} className="ck2-num">
                                                        {p => <input {...p} inputMode="text" autoComplete="address-line2" value={c.endereco.numero} onChange={e => c.setEnd('numero', e.target.value)} autoFocus={c.cepStatus === 'ok'} />}
                                                    </Field>
                                                    <Field label="Complemento">
                                                        {p => <input {...p} placeholder="Opcional" value={c.endereco.complemento} onChange={e => c.setEnd('complemento', e.target.value)} />}
                                                    </Field>
                                                </div>
                                                <Field label="Bairro" error={c.errors.bairro}>
                                                    {p => <input {...p} autoComplete="address-level3" value={c.endereco.bairro} onChange={e => c.setEnd('bairro', e.target.value)} />}
                                                </Field>
                                                <div className="ck2-row">
                                                    <Field label="Cidade" error={c.errors.cidade}>
                                                        {p => <input {...p} autoComplete="address-level2" value={c.endereco.cidade} onChange={e => c.setEnd('cidade', e.target.value)} />}
                                                    </Field>
                                                    <Field label="Estado" error={c.errors.estado} className="ck2-uf">
                                                        {p => (
                                                            <select {...p} autoComplete="address-level1" value={c.endereco.estado} onChange={e => c.setEnd('estado', e.target.value)}>
                                                                <option value="">UF</option>
                                                                {UFS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                                                            </select>
                                                        )}
                                                    </Field>
                                                </div>

                                                <fieldset className="ck2-choices">
                                                    <legend>Forma de entrega</legend>
                                                    {c.rules.map((r, i) => (
                                                        <label key={r.id || i} className={`ck2-choice ${selectedRule(r) ? 'is-on' : ''}`}>
                                                            <input type="radio" name="frete" checked={selectedRule(r)} onChange={() => c.setShipping(r)} />
                                                            <span className="ck2-radio" aria-hidden="true" />
                                                            <span className="ck2-choice-main">
                                                                <span className="ck2-choice-title">{r.name}</span>
                                                                {deliveryLabel(r.delivery_time) && <span className="ck2-choice-sub">{deliveryLabel(r.delivery_time)}</span>}
                                                            </span>
                                                            <span className={`ck2-choice-price ${Number(r.price) === 0 ? 'is-free' : ''}`}>{Number(r.price) === 0 ? 'Grátis' : brl(Number(r.price))}</span>
                                                        </label>
                                                    ))}
                                                </fieldset>

                                                <button type="submit" className="ck2-btn">Continuar para o pagamento</button>
                                            </>
                                        ) : null}
                                    </form>
                                )}
                            </section>

                            {/* ── 3. Pagamento ── */}
                            <section className={`ck2-step ${c.section === 3 ? 'is-active' : ''} ${c.section < 3 ? 'is-next' : ''}`} aria-labelledby="ck2-s3">
                                <div id="ck2-s3">{stepHead(3, 'Pagamento')}</div>
                                {c.section === 3 && (
                                    <div className="ck2-step-body">
                                        {c.bumps.length > 0 && (
                                            <fieldset className="ck2-choices">
                                                <legend>Aproveite e leve também</legend>
                                                {c.bumps.map(b => {
                                                    const on = c.selectedBumps.includes(b.id)
                                                    return (
                                                        <label key={b.id} className={`ck2-choice ck2-bump ${on ? 'is-on' : ''}`}>
                                                            <input type="checkbox" checked={on} onChange={() => c.toggleBump(b.id)} />
                                                            <span className="ck2-check" aria-hidden="true">{on && I.check}</span>
                                                            {b.imageUrl && <img src={b.imageUrl} alt="" className="ck2-bump-img" />}
                                                            <span className="ck2-choice-main">
                                                                <span className="ck2-choice-title">{b.name}</span>
                                                                {b.description && <span className="ck2-choice-sub">{b.description}</span>}
                                                            </span>
                                                            <span className="ck2-choice-price">+ {brl(b.price)}</span>
                                                        </label>
                                                    )
                                                })}
                                            </fieldset>
                                        )}

                                        <fieldset className="ck2-choices">
                                            <legend>Como você quer pagar?</legend>
                                            <label className={`ck2-choice ${c.paymentMethod === 'pix' ? 'is-on' : ''}`}>
                                                <input type="radio" name="pay" checked={c.paymentMethod === 'pix'} onChange={() => c.setPaymentMethod('pix')} />
                                                <span className="ck2-radio" aria-hidden="true" />
                                                <span className="ck2-pay-icon is-pix">{I.pix}</span>
                                                <span className="ck2-choice-main">
                                                    <span className="ck2-choice-title">PIX {pixBadge && <span className="ck2-badge" style={customization?.pixBadgeText ? { background: customization.pixBadgeBg, color: customization.pixBadgeColor } : undefined}>{pixBadge}</span>}</span>
                                                    <span className="ck2-choice-sub">Aprovação em poucos minutos</span>
                                                </span>
                                                <span className="ck2-choice-price">
                                                    {c.pixPrice < c.fullPrice && <s>{brl(c.fullPrice)}</s>}
                                                    {brl(c.pixPrice)}
                                                </span>
                                            </label>
                                            <label className={`ck2-choice ${c.paymentMethod === 'card' ? 'is-on' : ''}`}>
                                                <input type="radio" name="pay" checked={c.paymentMethod === 'card'} onChange={() => c.setPaymentMethod('card')} />
                                                <span className="ck2-radio" aria-hidden="true" />
                                                <span className="ck2-pay-icon">{I.card}</span>
                                                <span className="ck2-choice-main">
                                                    <span className="ck2-choice-title">Cartão de crédito</span>
                                                    <span className="ck2-choice-sub">{maxInstallments > 1 ? `À vista ou em até ${maxInstallments}×` : 'À vista'}</span>
                                                </span>
                                                <span className="ck2-choice-price">{brl(c.fullPrice)}</span>
                                            </label>
                                            {product?.subscriptionEnabled && c.parcelasOpcoes.length > 0 && (
                                                <label className={`ck2-choice ${c.paymentMethod === 'pix_automatico' ? 'is-on' : ''}`}>
                                                    <input type="radio" name="pay" checked={c.paymentMethod === 'pix_automatico'} onChange={() => c.setPaymentMethod('pix_automatico')} />
                                                    <span className="ck2-radio" aria-hidden="true" />
                                                    <span className="ck2-pay-icon is-pix">{I.repeat}</span>
                                                    <span className="ck2-choice-main">
                                                        <span className="ck2-choice-title">PIX Parcelado</span>
                                                        <span className="ck2-choice-sub">Parcelas semanais no débito automático</span>
                                                    </span>
                                                    <span className="ck2-choice-price">{c.parcelas}× {brl(c.valorParcela(c.parcelas))}</span>
                                                </label>
                                            )}
                                        </fieldset>

                                        {/* Painel do método escolhido */}
                                        {c.paymentMethod === 'pix' && (
                                            <div className="ck2-panel">
                                                <ul className="ck2-bullets">
                                                    <li>Depois de clicar, aparece o código PIX para você pagar no app do banco.</li>
                                                    <li>O código vale por 10 minutos. A confirmação aparece na tela.</li>
                                                </ul>
                                            </div>
                                        )}

                                        {c.paymentMethod === 'card' && (
                                            <div className="ck2-panel">
                                                <Field label="Número do cartão" error={c.errors.cardNumber}>
                                                    {p => <input {...p} inputMode="numeric" autoComplete="cc-number" placeholder="0000 0000 0000 0000" value={c.card.number} onChange={e => c.setCard(s => ({ ...s, number: fmt.card(e.target.value) }))} />}
                                                </Field>
                                                <Field label="Nome impresso no cartão" error={c.errors.cardName}>
                                                    {p => <input {...p} autoComplete="cc-name" autoCapitalize="characters" value={c.card.name} onChange={e => c.setCard(s => ({ ...s, name: e.target.value.toUpperCase() }))} />}
                                                </Field>
                                                <div className="ck2-row">
                                                    <Field label="Validade" error={c.errors.cardExp}>
                                                        {p => <input {...p} inputMode="numeric" autoComplete="cc-exp" placeholder="MM/AA" value={c.card.exp} onChange={e => c.setCard(s => ({ ...s, exp: fmt.exp(e.target.value) }))} />}
                                                    </Field>
                                                    <Field label="CVV" error={c.errors.cardCvv} hint="3 ou 4 números no verso">
                                                        {p => <input {...p} inputMode="numeric" autoComplete="cc-csc" maxLength={4} value={c.card.cvv} onChange={e => c.setCard(s => ({ ...s, cvv: onlyDigits(e.target.value) }))} />}
                                                    </Field>
                                                </div>
                                                <div className="ck2-row">
                                                    <Field label="CPF do titular" error={c.errors.cardCpf}>
                                                        {p => <input {...p} inputMode="numeric" placeholder="000.000.000-00" value={c.dados.cpf} onChange={e => c.setDado('cpf', fmt.cpf(e.target.value))} />}
                                                    </Field>
                                                    <Field label="Data de nascimento" error={c.errors.cardBirth}>
                                                        {p => <input {...p} inputMode="numeric" autoComplete="bday" placeholder="DD/MM/AAAA" value={c.dados.nascimento} onChange={e => c.setDado('nascimento', fmt.date(e.target.value))} />}
                                                    </Field>
                                                </div>
                                                <Field label="Parcelas">
                                                    {p => (
                                                        <select {...p} value={c.card.installments} onChange={e => c.setCard(s => ({ ...s, installments: Number(e.target.value) }))}>
                                                            {c.installmentOptions.map(o => (
                                                                <option key={o.n} value={o.n}>
                                                                    {o.n === 1 ? `À vista — ${brl(o.total)}` : `${o.n}× de ${brl(o.value)} — total ${brl(o.total)}`}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    )}
                                                </Field>
                                                {c.card.installments > 1 && (
                                                    <p className="ck2-interest">Parcelado com juros. Total no cartão: <strong>{brl(c.cardTotal)}</strong>.</p>
                                                )}
                                            </div>
                                        )}

                                        {c.paymentMethod === 'pix_automatico' && (
                                            <div className="ck2-panel">
                                                <Field label="Número de parcelas">
                                                    {p => (
                                                        <select {...p} value={c.parcelas} onChange={e => c.setParcelas(Number(e.target.value))}>
                                                            {c.parcelasOpcoes.map(n => <option key={n} value={n}>{n}× de {brl(c.valorParcela(n))} por semana</option>)}
                                                        </select>
                                                    )}
                                                </Field>
                                                <ol className="ck2-schedule">
                                                    {Array.from({ length: c.parcelas }).map((_, i) => {
                                                        const d = new Date(); d.setDate(d.getDate() + i * 7)
                                                        return (
                                                            <li key={i}>
                                                                <span>{i === 0 ? 'Hoje' : d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span>
                                                                <span>{brl(c.valorParcela(c.parcelas))}</span>
                                                            </li>
                                                        )
                                                    })}
                                                </ol>
                                                <p className="ck2-interest">A 1ª parcela é paga hoje ao autorizar no app do banco. As demais são debitadas automaticamente a cada 7 dias. Parcelas não pagas podem gerar registro em órgãos de proteção ao crédito.</p>
                                                <Field label="CPF" error={c.errors.subCpf} hint="Obrigatório para o débito automático">
                                                    {p => <input {...p} inputMode="numeric" placeholder="000.000.000-00" value={c.dados.cpf} onChange={e => c.setDado('cpf', fmt.cpf(e.target.value))} />}
                                                </Field>
                                            </div>
                                        )}

                                        {c.payError && <div className="ck2-payerr" role="alert">{c.payError}</div>}

                                        <button
                                            type="button"
                                            className="ck2-btn ck2-btn-pay"
                                            disabled={c.submitting}
                                            onClick={c.paymentMethod === 'pix' ? c.payPix : c.paymentMethod === 'card' ? c.payCard : c.enrollSubscription}
                                        >
                                            {c.submitting ? <><span className="ck2-spin" aria-hidden="true" />Processando…</>
                                                : c.paymentMethod === 'pix' ? `Gerar PIX de ${brl(c.pixPrice)}`
                                                    : c.paymentMethod === 'card' ? `Pagar ${brl(c.cardTotal)}`
                                                        : `Autorizar PIX Parcelado`}
                                        </button>
                                        <p className="ck2-secure-note">{I.lock}{c.paymentMethod === 'card' ? 'Pagamento processado pela Pagar.me · PCI DSS' : 'PIX oficial do Banco Central'}</p>
                                    </div>
                                )}
                            </section>
                        </div>

                        <aside className="ck2-aside">
                            <div className="ck2-card ck2-summary">
                                <h2 className="ck2-h3">Resumo do pedido</h2>
                                {summaryLines}
                            </div>
                            {trust}
                        </aside>
                    </main>
                </>
            )}

            <footer className="ck2-footer">
                {!finalScreen && <div className="ck2-mtrust">{trust}</div>}
                {customization?.footerText && <p>{customization.footerText}</p>}
            </footer>
        </div>
    )
}
