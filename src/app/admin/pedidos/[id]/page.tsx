import { prisma } from '@/lib/prisma'
import { MapPin, Phone, CreditCard, ChevronLeft, ExternalLink, Calendar, Mail, User, Info, MoreVertical, Package, ShieldCheck, Truck, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { deleteOrder } from '../../../actions'

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const order = await prisma.order.findUnique({
        where: { id },
        include: { product: true }
    })

    if (!order) notFound()

    const getStatusColor = (status: string) => {
        const s = status?.toLowerCase()
        if (s === 'pago' || s === 'atendido') return '#dcfce7'; // green-100
        if (s === 'recusado' || s === 'cancelado') return '#fee2e2'; // red-100
        return '#fef3c7'; // yellow-100
    }

    const getStatusTextColor = (status: string) => {
        const s = status?.toLowerCase()
        if (s === 'pago' || s === 'atendido') return '#166534';
        if (s === 'recusado' || s === 'cancelado') return '#991b1b';
        return '#92400e';
    }

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
            {/* Nav */}
            <Link href="/admin/pedidos" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '0.85rem', textDecoration: 'none', marginBottom: '20px' }}>
                <ChevronLeft size={16} /> Ver todos os pedidos
            </Link>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', margin: '0 0 8px 0' }}>
                        Pedido: <span style={{ fontWeight: 400 }}>{order.id.slice(0, 8).toUpperCase()}</span>
                        <span style={{ fontSize: '0.9rem', fontWeight: 400, color: '#64748b', marginLeft: '12px' }}>
                            em {new Date(order.createdAt).toLocaleDateString('pt-BR')} às {new Date(order.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{
                            background: getStatusColor(order.paymentStatus || 'processando'),
                            color: getStatusTextColor(order.paymentStatus || 'processando'),
                            padding: '4px 12px',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            textTransform: 'uppercase'
                        }}>
                            {order.paymentStatus || 'processando'}
                        </span>
                        <button style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            🔄 Atualizar status
                        </button>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <form action={async () => {
                        'use server'
                        await deleteOrder(id)
                        redirect('/admin/pedidos')
                    }}>
                        <button type="submit" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px', borderRadius: '8px', background: '#fff1f2', border: '1px solid #ffe4e6', color: '#e11d48', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
                            <Trash2 size={16} /> Excluir Pedido
                        </button>
                    </form>

                    <button style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px', borderRadius: '8px', background: 'white', border: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.85rem', fontWeight: 600 }}>
                        📄 Anotações <span style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '10px', fontSize: '0.7rem' }}>0</span>
                    </button>
                    <button style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px', borderRadius: '8px', background: 'white', border: '1px solid #e2e8f0', color: '#1e293b', fontSize: '0.85rem', fontWeight: 600 }}>
                        Ações <MoreVertical size={16} />
                    </button>
                </div>
            </div>

            {/* Info Cards Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', marginBottom: '32px' }}>
                <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)' }}>
                    <div style={{ padding: '24px', borderRight: '1px solid #f1f5f9' }}>
                        <h4 style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '16px' }}>Cliente</h4>
                        <div style={{ color: '#3b82f6', fontWeight: 700, fontSize: '1rem', marginBottom: '4px' }}>{order.fullName}</div>
                        <div style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '4px' }}>{order.email}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontSize: '0.85rem', marginBottom: '8px' }}>
                            <Phone size={14} /> {order.phone}
                        </div>
                        <div style={{ color: '#64748b', fontSize: '0.85rem' }}>CPF: {order.cpf}</div>
                        <div style={{ marginTop: '16px', fontSize: '0.75rem', color: '#94a3b8' }}>IP da compra: <br /> <span style={{ fontSize: '0.7rem' }}>177.102.45.189</span></div>
                    </div>
                    <div style={{ padding: '24px', borderRight: '1px solid #f1f5f9' }}>
                        <h4 style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '16px' }}>Pagamento</h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1e293b', fontWeight: 700, fontSize: '0.9rem' }}>
                            <div style={{ background: '#f8fafc', padding: '6px', borderRadius: '6px' }}>
                                {order.paymentMethod === 'pix' ? '❖' : '💳'}
                            </div>
                            {order.paymentMethod === 'pix' ? 'Pix' : 'Cartão de Crédito'}
                        </div>
                    </div>
                    <div style={{ padding: '24px' }}>
                        <h4 style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '16px' }}>Entrega</h4>
                        <div style={{ color: '#1e293b', fontWeight: 700, fontSize: '0.9rem', marginBottom: '8px' }}>{order.recipient || order.fullName}</div>
                        <div style={{ color: '#64748b', fontSize: '0.85rem', lineHeight: '1.5' }}>
                            {order.rua}, {order.numero}<br />
                            {order.bairro}<br />
                            {order.cidade} / {order.estado}<br />
                            CEP: {order.cep}
                        </div>
                        <div style={{ marginTop: '16px', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>
                            CORREIOS - PRAZO DE 2 A 4 SEMANAS
                        </div>
                    </div>
                </div>

                <div style={{ background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px' }}>
                    <h4 style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '20px' }}>Valor Total</h4>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: '#1e293b', marginBottom: '24px' }}>R$ {(order.totalPrice || 0).toFixed(2)}</div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '0.85rem', marginBottom: '8px' }}>
                        <span>Produtos</span>
                        <span>R$ {(order.totalPrice || 0).toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '0.85rem', marginBottom: '8px' }}>
                        <span>Desconto</span>
                        <span>- R$ 0,00</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '0.85rem' }}>
                        <span>Frete</span>
                        <span>R$ 0,00</span>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '2px', background: '#f1f5f9', padding: '4px', borderRadius: '10px', marginBottom: '24px', width: 'fit-content' }}>
                {['Resumo', 'Transações', 'Nota fiscal', 'Rastreamento', 'Status', 'Histórico', 'E-mails'].map((tab, idx) => (
                    <div key={tab} style={{
                        padding: '10px 24px',
                        borderRadius: '8px',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        color: idx === 0 ? '#1e293b' : '#64748b',
                        background: idx === 0 ? 'white' : 'transparent',
                        cursor: 'pointer',
                        boxShadow: idx === 0 ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                    }}>
                        {tab}
                    </div>
                ))}
            </div>

            {/* Stepper */}
            <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '32px', marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', position: 'relative', height: '40px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '1.2rem', zIndex: 2 }}>✓</div>
                    <div style={{ flex: 1, height: '4px', background: '#10b981', margin: '0 -1px' }}></div>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: getStatusTextColor(order.paymentStatus || ''), border: '4px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', zIndex: 2, boxShadow: '0 0 0 4px #f1f5f9' }}>
                        {order.paymentStatus === 'pago' ? '✓' : '!'}
                    </div>
                    <div style={{ flex: 1, height: '4px', background: '#f1f5f9', borderStyle: 'dotted' }}></div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', marginTop: '12px' }}>
                    <div style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 600 }}>Aguardando pagamento</div>
                    <div style={{ color: getStatusTextColor(order.paymentStatus || ''), fontSize: '0.8rem', fontWeight: 800, textAlign: 'center' }}>
                        {order.paymentStatus?.toUpperCase()}
                    </div>
                    <div style={{ textAlign: 'right', color: '#94a3b8', fontSize: '0.8rem' }}>Enviado</div>
                </div>
            </div>

            {/* Products Table */}
            <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#1e293b' }}>Produtos</h3>
                    <span style={{ background: '#f1f5f9', padding: '2px 8px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 800 }}>1</span>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: '#f8fafc' }}>
                        <tr>
                            <th style={{ textAlign: 'left', padding: '12px 24px', fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Produto</th>
                            <th style={{ textAlign: 'center', padding: '12px 24px', fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Qtd.</th>
                            <th style={{ textAlign: 'right', padding: '12px 24px', fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Valor Unit.</th>
                            <th style={{ textAlign: 'right', padding: '12px 24px', fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style={{ padding: '20px 24px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <div style={{ width: '50px', height: '50px', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden', flexShrink: 0 }}>
                                        <img src={order.product?.imageUrl || ''} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.9rem' }}>{order.product?.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>SKU: {order.id.slice(0, 8).toUpperCase()}</div>
                                    </div>
                                </div>
                            </td>
                            <td style={{ textAlign: 'center', padding: '20px 24px', fontWeight: 600, color: '#1e293b' }}>1</td>
                            <td style={{ textAlign: 'right', padding: '20px 24px', color: '#64748b', fontSize: '0.9rem' }}>R$ {order.product?.price.toFixed(2)}</td>
                            <td style={{ textAlign: 'right', padding: '20px 24px', fontWeight: 700, color: '#1e293b', fontSize: '0.9rem' }}>R$ {order.product?.price.toFixed(2)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    )
}
