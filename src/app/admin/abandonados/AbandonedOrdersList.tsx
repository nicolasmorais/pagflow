'use client'

import { useState } from 'react'
import { Phone, ExternalLink, Trash2, X, MapPin, Target, CalendarClock } from 'lucide-react'
import { deleteOrder } from '../../actions'

export default function AbandonedOrdersList({
    abandonedOrders,
    gridLayout
}: {
    abandonedOrders: any[]
    gridLayout: string
}) {
    const [selectedOrder, setSelectedOrder] = useState<any | null>(null)

    const getStepLabel = (step: number | null) => {
        switch (step) {
            case 1: return { label: 'Dados', color: '#3b82f6', bg: '#eff6ff' }
            case 2: return { label: 'Entrega', color: '#0ea5e9', bg: '#f0f9ff' }
            case 3: return { label: 'Pagamento', color: '#f59e0b', bg: '#fffbeb' }
            default: return { label: 'Início', color: '#6366f1', bg: '#eef2ff' }
        }
    }

    const DetailItem = ({ label, value }: { label: string, value: string | null | undefined }) => {
        if (!value) return null;
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--admin-text-primary)' }}>{value}</span>
            </div>
        )
    }

    return (
        <>
            <div className="desktop-orders-table" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: gridLayout,
                    padding: '0 24px 12px 24px',
                    color: 'var(--admin-text-secondary)',
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                }}>
                    <div>Cliente</div>
                    <div>Produto</div>
                    <div>Origem</div>
                    <div>Contato</div>
                    <div>Valor Potencial</div>
                    <div>Última Etapa</div>
                    <div style={{ textAlign: 'right' }}>Ações</div>
                </div>

                {abandonedOrders.map((order: any) => (
                    <div
                        key={order.id}
                        className="dashboard-order-row"
                        onClick={() => setSelectedOrder(order)}
                        style={{
                            background: 'var(--admin-card)',
                            border: '1px solid var(--admin-border)',
                            borderRadius: '16px',
                            padding: '16px 24px',
                            display: 'grid',
                            gridTemplateColumns: gridLayout,
                            alignItems: 'center',
                            gap: '16px',
                            transition: 'all 0.2s ease',
                            cursor: 'pointer',
                        }}
                        onMouseOver={(e) => { e.currentTarget.style.borderColor = '#c7d2fe'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.08)' }}
                        onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--admin-border)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}
                    >
                        <div>
                            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--admin-text-primary)', margin: '0 0 2px 0' }}>
                                {order.fullName || 'Sem nome'}
                            </h3>
                            <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-secondary)', marginBottom: '4px' }}>{order.email || 'Sem e-mail'}</div>
                            <div style={{ fontSize: '0.65rem', color: 'var(--admin-text-secondary)' }}>
                                {new Date(order.updatedAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {order.product ? (
                                <div style={{
                                    fontSize: '0.8rem',
                                    fontWeight: 700,
                                    color: '#3b82f6',
                                    background: '#eff6ff',
                                    padding: '3px 8px',
                                    borderRadius: '5px',
                                    border: '1px solid #dbeafe',
                                    display: 'inline-block',
                                    width: 'fit-content'
                                }}>
                                    {order.product.name}
                                </div>
                            ) : (
                                <span style={{ color: 'var(--admin-text-secondary)', fontSize: '0.8rem' }}>Interesse em produto</span>
                            )}
                        </div>

                        <div>
                            <div
                                style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, display: 'flex', flexDirection: 'column', gap: '2px' }}
                            >
                                <span style={{ color: '#7c3aed', fontWeight: 800 }}>{order.utmSource || 'Direto'}</span>
                                <span style={{ fontSize: '10px', opacity: 0.8 }}>{order.utmCampaign || '-'}</span>
                            </div>
                        </div>

                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--admin-text-primary)' }}>
                                <Phone size={14} color="#10b981" />
                                {order.phone || 'Sem telefone'}
                            </div>
                            <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '4px' }}>
                                CPF: {order.cpf || 'Não preenchido'}
                            </div>
                        </div>

                        <div style={{ fontSize: '1rem', fontWeight: 800, color: '#f59e0b' }}>
                            R$ {(order.totalPrice || 0).toFixed(2)}
                        </div>

                        <div>
                            <div style={{
                                ...getStepLabel(order.lastStepReached),
                                fontSize: '0.7rem',
                                fontWeight: 800,
                                padding: '4px 10px',
                                borderRadius: '6px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                textTransform: 'uppercase'
                            }}>
                                {getStepLabel(order.lastStepReached).label}
                            </div>
                            {order.paymentMethod && (
                                <div style={{ fontSize: '0.65rem', color: 'var(--admin-text-muted)', marginTop: '4px', fontWeight: 600 }}>
                                    💳 {order.paymentMethod.toUpperCase()}
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <a
                                href={`https://wa.me/${(order.phone || '').replace(/\D/g, '')}?text=Olá ${(order.fullName || 'Cliente').split(' ')[0]}, vimos que você iniciou a compra do ${order.product?.name || 'nosso produto'} mas não finalizou. Podemos te ajudar?`}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                    height: '34px',
                                    padding: '0 12px',
                                    background: '#e1fae9',
                                    borderRadius: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#10b981',
                                    border: '1px solid #d1f7de',
                                    textDecoration: 'none',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    gap: '6px'
                                }}
                            >
                                Recuperar <ExternalLink size={14} />
                            </a>

                            <div
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (confirm('Tem certeza que deseja apagar este carrinho abandonado?')) {
                                        deleteOrder(order.id);
                                    }
                                }}
                                style={{
                                    width: '34px',
                                    height: '34px',
                                    background: '#fff1f2',
                                    borderRadius: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#e11d48',
                                    border: '1px solid #ffe4e6',
                                    cursor: 'pointer'
                                }}
                            >
                                <Trash2 size={16} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* MODAL DE DETALHES COMPLETO */}
            {selectedOrder && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)',
                    zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '20px'
                }} onClick={() => setSelectedOrder(null)}>
                    <div style={{
                        background: '#ffffff',
                        width: '100%',
                        maxWidth: '650px',
                        maxHeight: '90vh',
                        borderRadius: '24px',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        animation: 'fadeInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                    }} onClick={(e) => e.stopPropagation()}>

                        {/* Header do pop-up */}
                        <div style={{
                            padding: '24px',
                            borderBottom: '1px solid #e2e8f0',
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'space-between',
                            background: '#f8fafc'
                        }}>
                            <div>
                                <h2 style={{ margin: '0 0 4px', fontSize: '1.25rem', fontWeight: 900, color: '#0f172a' }}>
                                    Detalhes do Carrinho
                                </h2>
                                <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <CalendarClock size={14} />
                                    Última interação: {new Date(selectedOrder.updatedAt).toLocaleString('pt-BR')}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedOrder(null)}
                                style={{
                                    background: '#e2e8f0', border: 'none', color: '#475569',
                                    width: '32px', height: '32px', borderRadius: '50%',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: 'pointer'
                                }}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Corpo do pop-up (Scrollável) */}
                        <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>

                            {/* Bloco: Dados Pessoais */}
                            <div style={{ border: '1px solid #e2e8f0', borderRadius: '16px', padding: '16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                                    <div style={{ background: '#eff6ff', color: '#3b82f6', padding: '6px', borderRadius: '8px' }}><Phone size={16} /></div>
                                    <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: '#1e293b' }}>Dados Pessoais</h3>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: '16px' }}>
                                    <DetailItem label="Nome" value={selectedOrder.fullName} />
                                    <DetailItem label="E-mail" value={selectedOrder.email} />
                                    <DetailItem label="Telefone" value={selectedOrder.phone} />
                                    <DetailItem label="CPF" value={selectedOrder.cpf} />
                                </div>
                            </div>

                            {/* Bloco: Dados de Endereço (Só aparece se tiver CEP) */}
                            {selectedOrder.cep && (
                                <div style={{ border: '1px solid #e2e8f0', borderRadius: '16px', padding: '16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                                        <div style={{ background: '#f0f9ff', color: '#0ea5e9', padding: '6px', borderRadius: '8px' }}><MapPin size={16} /></div>
                                        <h3 style={{ margin: '0', fontSize: '0.9rem', fontWeight: 800, color: '#1e293b' }}>Endereço de Entrega</h3>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                                        <DetailItem label="Destinatário" value={selectedOrder.recipient} />
                                        <DetailItem label="CEP" value={selectedOrder.cep} />
                                        <div style={{ gridColumn: 'span 2' }}>
                                            <DetailItem label="Endereço" value={`${selectedOrder.rua || ''}, ${selectedOrder.numero || 'S/N'} ${selectedOrder.complemento ? `(${selectedOrder.complemento})` : ''}`} />
                                        </div>
                                        <DetailItem label="Bairro" value={selectedOrder.bairro} />
                                        <DetailItem label="Cidade/UF" value={selectedOrder.cidade ? `${selectedOrder.cidade} - ${selectedOrder.estado}` : null} />
                                    </div>
                                </div>
                            )}

                            {/* Bloco: UTMs (Só aparece se tiver origem gravada) */}
                            {(selectedOrder.utmSource || selectedOrder.utmCampaign) && (
                                <div style={{ border: '1px solid #e2e8f0', borderRadius: '16px', padding: '16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                                        <div style={{ background: '#f5f3ff', color: '#8b5cf6', padding: '6px', borderRadius: '8px' }}><Target size={16} /></div>
                                        <h3 style={{ margin: '0', fontSize: '0.9rem', fontWeight: 800, color: '#1e293b' }}>Origem UTMs</h3>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                                        <DetailItem label="Source" value={selectedOrder.utmSource} />
                                        <DetailItem label="Medium" value={selectedOrder.utmMedium} />
                                        <DetailItem label="Campaign" value={selectedOrder.utmCampaign} />
                                        <DetailItem label="Content" value={selectedOrder.utmContent} />
                                        <DetailItem label="Term" value={selectedOrder.utmTerm} />
                                        <DetailItem label="Placement" value={selectedOrder.utmPlacement} />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer / CTA recuperacao */}
                        <div style={{ padding: '20px 24px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                            <button
                                onClick={() => setSelectedOrder(null)}
                                style={{ padding: '12px 20px', borderRadius: '12px', border: '1px solid #cbd5e1', background: '#fff', color: '#475569', fontWeight: 700, cursor: 'pointer' }}
                            >
                                Fechar
                            </button>
                            <a
                                href={`https://wa.me/${(selectedOrder.phone || '').replace(/\D/g, '')}?text=Olá ${(selectedOrder.fullName || 'Cliente').split(' ')[0]}, vimos que você iniciou a compra do ${selectedOrder.product?.name || 'nosso produto'} mas não finalizou. Podemos te ajudar?`}
                                target="_blank"
                                rel="noreferrer"
                                style={{ padding: '12px 20px', borderRadius: '12px', background: '#10b981', color: '#fff', fontWeight: 800, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}
                            >
                                Chamar no WhatsApp <ExternalLink size={16} />
                            </a>
                        </div>
                    </div>
                </div>
            )}

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes fadeInUp {
                    0% { opacity: 0; transform: translateY(20px) scale(0.95); }
                    100% { opacity: 1; transform: translateY(0) scale(1); }
                }
            `}} />
        </>
    )
}
