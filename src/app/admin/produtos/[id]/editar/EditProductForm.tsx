'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
    ArrowLeft, Package, DollarSign, Image as ImageIcon,
    Store, Target, Globe, RefreshCw, Loader2, Save,
} from 'lucide-react'
import { updateProduct } from '@/app/actions'

const card: React.CSSProperties = {
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: 16,
    padding: '24px',
    marginBottom: 20,
}

const sectionTitle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 800,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.07em',
    marginBottom: 18,
}

const labelStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 12,
    fontWeight: 700,
    color: '#475569',
    marginBottom: 6,
}

const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '11px 14px',
    borderRadius: 10,
    border: '1px solid #e2e8f0',
    background: '#f8fafc',
    fontSize: 13,
    color: '#0f172a',
    outline: 'none',
    fontWeight: 500,
    boxSizing: 'border-box',
}

const hint: React.CSSProperties = {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 4,
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
    return (
        <button
            type="button"
            onClick={onChange}
            style={{
                width: 42, height: 24, borderRadius: 24, border: 'none', cursor: 'pointer',
                background: checked ? '#16a34a' : '#cbd5e1',
                position: 'relative', transition: '0.2s', flexShrink: 0,
            }}
        >
            <span style={{
                position: 'absolute', height: 18, width: 18,
                left: checked ? 21 : 3, top: 3,
                background: '#fff', borderRadius: '50%', transition: '0.2s',
            }} />
        </button>
    )
}

export default function EditProductForm({ product }: { product: any }) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [isDigital, setIsDigital] = useState(product.isDigital || false)
    const [subscriptionEnabled, setSubscriptionEnabled] = useState(product.subscriptionEnabled || false)

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        const formData = new FormData(e.currentTarget)
        try {
            await updateProduct(formData)
            router.push('/admin/produtos')
        } catch (err: any) {
            alert('Erro ao salvar: ' + err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={{ maxWidth: 900, margin: '0 auto', paddingBottom: 60 }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
                <Link href="/admin/produtos" style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: 38, height: 38, borderRadius: 10,
                    background: '#f1f5f9', border: '1px solid #e2e8f0',
                    color: '#475569', textDecoration: 'none', flexShrink: 0,
                }}>
                    <ArrowLeft size={18} />
                </Link>
                <div>
                    <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#0f172a' }}>Editar Produto</h1>
                    <p style={{ margin: 0, fontSize: 13, color: '#94a3b8' }}>{product.name}</p>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <input type="hidden" name="id" value={product.id} />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20, alignItems: 'start' }}>

                    {/* Coluna esquerda */}
                    <div>

                        {/* Informações básicas */}
                        <div style={card}>
                            <div style={sectionTitle}>Informações básicas</div>

                            <div style={{ marginBottom: 16 }}>
                                <label style={labelStyle}><Package size={13} /> Nome do Produto</label>
                                <input name="name" type="text" style={inputStyle} defaultValue={product.name} required
                                    onFocus={e => { e.target.style.borderColor = '#0f172a'; e.target.style.background = '#fff' }}
                                    onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc' }}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                                <div>
                                    <label style={labelStyle}><DollarSign size={13} /> Preço (R$)</label>
                                    <input name="price" type="number" step="0.01" style={inputStyle} defaultValue={product.price} required
                                        onFocus={e => { e.target.style.borderColor = '#0f172a'; e.target.style.background = '#fff' }}
                                        onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc' }}
                                    />
                                </div>
                                <div>
                                    <label style={labelStyle}><DollarSign size={13} /> Custo unitário (R$)</label>
                                    <input name="cost" type="number" step="0.01" style={inputStyle} defaultValue={product.cost || 0} required
                                        onFocus={e => { e.target.style.borderColor = '#0f172a'; e.target.style.background = '#fff' }}
                                        onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc' }}
                                    />
                                </div>
                            </div>

                            <div>
                                <label style={labelStyle}><ImageIcon size={13} /> URL da Imagem</label>
                                <input name="imageUrl" type="url" style={inputStyle} defaultValue={product.imageUrl || ''} placeholder="https://..."
                                    onFocus={e => { e.target.style.borderColor = '#0f172a'; e.target.style.background = '#fff' }}
                                    onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc' }}
                                />
                            </div>
                        </div>

                        {/* Loja */}
                        <div style={card}>
                            <div style={sectionTitle}>Loja</div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div>
                                    <label style={labelStyle}><Store size={13} /> Nome da Loja</label>
                                    <input name="storeName" type="text" style={inputStyle} defaultValue={product.storeName || 'PagFlow'} placeholder="PagFlow"
                                        onFocus={e => { e.target.style.borderColor = '#0f172a'; e.target.style.background = '#fff' }}
                                        onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc' }}
                                    />
                                </div>
                                <div>
                                    <label style={labelStyle}><ImageIcon size={13} /> Logo da Loja (URL)</label>
                                    <input name="storeLogo" type="url" style={inputStyle} defaultValue={product.storeLogo || ''} placeholder="https://..."
                                        onFocus={e => { e.target.style.borderColor = '#0f172a'; e.target.style.background = '#fff' }}
                                        onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc' }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Pixels / Eventos */}
                        <div style={card}>
                            <div style={sectionTitle}>Eventos de Pixel (opcional)</div>
                            <div style={{ marginBottom: 16 }}>
                                <label style={labelStyle}><Target size={13} /> Evento de "iniciar checkout"</label>
                                <input name="startCheckoutEventName" type="text" style={inputStyle} defaultValue={product.startCheckoutEventName || ''} placeholder="start_checkout (padrão)"
                                    onFocus={e => { e.target.style.borderColor = '#0f172a'; e.target.style.background = '#fff' }}
                                    onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc' }}
                                />
                                <p style={hint}>Substitui o evento padrão do pixel Taboola para este produto.</p>
                            </div>
                            <div>
                                <label style={labelStyle}><Target size={13} /> Evento de compra</label>
                                <input name="purchaseEventName" type="text" style={inputStyle} defaultValue={product.purchaseEventName || ''} placeholder="make_purchase (padrão)"
                                    onFocus={e => { e.target.style.borderColor = '#0f172a'; e.target.style.background = '#fff' }}
                                    onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc' }}
                                />
                                <p style={hint}>Substitui o evento de compra padrão do pixel Taboola para este produto.</p>
                            </div>
                        </div>
                    </div>

                    {/* Coluna direita */}
                    <div>

                        {/* Produto Digital */}
                        <div style={card}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isDigital ? 16 : 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{ width: 36, height: 36, borderRadius: 10, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Globe size={18} color="#3b82f6" />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>Produto Digital</div>
                                        <div style={{ fontSize: 11, color: '#94a3b8' }}>Sem frete, envio por e-mail</div>
                                    </div>
                                </div>
                                <Toggle checked={isDigital} onChange={() => setIsDigital((v: boolean) => !v)} />
                            </div>
                            {isDigital && (
                                <div>
                                    <label style={labelStyle}><Globe size={13} /> Link de Acesso</label>
                                    <input name="accessLink" type="url" style={inputStyle} defaultValue={product.accessLink || ''} placeholder="https://drive.google.com/..."
                                        onFocus={e => { e.target.style.borderColor = '#3b82f6'; e.target.style.background = '#fff' }}
                                        onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc' }}
                                    />
                                    <p style={hint}>Enviado automaticamente por e-mail após confirmação do pagamento.</p>
                                </div>
                            )}
                            <input type="hidden" name="isDigital" value={isDigital ? 'true' : 'false'} />
                        </div>

                        {/* PIX Automático / Parcelado */}
                        <div style={card}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: subscriptionEnabled ? 20 : 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{ width: 36, height: 36, borderRadius: 10, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <RefreshCw size={18} color="#16a34a" />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 13, fontWeight: 700, color: '#14532d' }}>PIX Automático</div>
                                        <div style={{ fontSize: 11, color: '#4ade80' }}>Cobrança recorrente via Woovi</div>
                                    </div>
                                </div>
                                <Toggle checked={subscriptionEnabled} onChange={() => setSubscriptionEnabled((v: boolean) => !v)} />
                            </div>
                            <input type="hidden" name="subscriptionEnabled" value={subscriptionEnabled ? 'true' : 'false'} />

                            {subscriptionEnabled && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                    <div style={{ height: 1, background: '#f1f5f9' }} />
                                    <div style={{ fontSize: 11, fontWeight: 700, color: '#14532d', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        Configuração PIX Parcelado
                                    </div>
                                    <div>
                                        <label style={{ ...labelStyle, color: '#166534' }}><DollarSign size={13} /> Preço por parcela (R$)</label>
                                        <input name="pixPrice" type="number" step="0.01" style={inputStyle} defaultValue={product.pixPrice ?? ''}
                                            placeholder="Deixe vazio para calcular automaticamente"
                                            onFocus={e => { e.target.style.borderColor = '#16a34a'; e.target.style.background = '#fff' }}
                                            onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc' }}
                                        />
                                        <p style={{ ...hint, color: '#4ade80' }}>Se vazio, calcula como: Preço ÷ nº de parcelas escolhido.</p>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                        <div>
                                            <label style={{ ...labelStyle, color: '#166634' }}>Parcelas mínimas</label>
                                            <select name="parcelasMin" style={inputStyle} defaultValue={product.parcelasMin ?? 2}>
                                                <option value="2">2×</option>
                                                <option value="3">3×</option>
                                                <option value="4">4×</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label style={{ ...labelStyle, color: '#166634' }}>Parcelas máximas</label>
                                            <select name="parcelasMax" style={inputStyle} defaultValue={product.parcelasMax ?? 6}>
                                                <option value="4">4×</option>
                                                <option value="5">5×</option>
                                                <option value="6">6×</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Botões */}
                        <div style={{ display: 'flex', gap: 10 }}>
                            <Link href="/admin/produtos" style={{
                                flex: 1, padding: '13px', borderRadius: 12,
                                border: '1px solid #e2e8f0', background: '#fff',
                                color: '#475569', fontWeight: 700, fontSize: 13,
                                textDecoration: 'none', display: 'flex', alignItems: 'center',
                                justifyContent: 'center',
                            }}>
                                Cancelar
                            </Link>
                            <button type="submit" disabled={loading} style={{
                                flex: 2, padding: '13px', borderRadius: 12,
                                border: 'none', background: '#0f172a', color: '#fff',
                                fontWeight: 700, fontSize: 13,
                                cursor: loading ? 'wait' : 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                            }}>
                                {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={16} />}
                                {loading ? 'Salvando...' : 'Salvar Produto'}
                            </button>
                        </div>
                        <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
                    </div>
                </div>
            </form>
        </div>
    )
}
