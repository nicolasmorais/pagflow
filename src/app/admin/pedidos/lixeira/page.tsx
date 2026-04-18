export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma'
import { ArrowLeft, Trash2, RotateCcw, ShieldAlert, Clock } from 'lucide-react'
import Link from 'next/link'
import { RestoreButton, PermanentDeleteButton } from './components/RecycleBinButtons'

export default async function LixeiraPage() {
    const deletedOrders = await prisma.order.findMany({
        where: {
            deletedAt: { not: null }
        },
        orderBy: { deletedAt: 'desc' },
        include: { product: true }
    });

    return (
        <div style={{ width: '100%', paddingBottom: '60px' }}>
            {/* Header */}
            <header style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <Link
                        href="/admin/pedidos"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            color: '#64748b',
                            fontSize: '13px',
                            textDecoration: 'none',
                            marginBottom: '10px',
                            fontWeight: 600
                        }}
                    >
                        <ArrowLeft size={14} /> Voltar para Pedidos
                    </Link>
                    <h1 style={{ fontSize: '28px', fontWeight: 900, color: 'var(--admin-text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
                        Lixeira de Pedidos
                    </h1>
                    <p style={{ color: '#64748b', fontSize: '14px', margin: '4px 0 0' }}>
                        Visualize e recupere pedidos que foram excluídos recentemente.
                    </p>
                </div>
                <div style={{
                    background: '#FFFBEB',
                    padding: '12px 20px',
                    borderRadius: '12px',
                    border: '1px solid #FEF3C7',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    maxWidth: '400px'
                }}>
                    <ShieldAlert size={20} color="#D97706" />
                    <span style={{ fontSize: '12px', color: '#92400E', fontWeight: 600 }}>
                        Pedidos nesta lista não aparecem nos relatórios financeiros ou na gestão ativa.
                    </span>
                </div>
            </header>

            {/* List */}
            {deletedOrders.length === 0 ? (
                <div style={{
                    background: 'white',
                    borderRadius: '24px',
                    border: '1px solid var(--admin-border)',
                    padding: '80px 20px',
                    textAlign: 'center'
                }}>
                    <div style={{
                        width: '64px', height: '64px', background: '#F8FAF9', borderRadius: '20px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px'
                    }}>
                        <Trash2 size={32} color="#CBD5E1" />
                    </div>
                    <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#1E293B', marginBottom: '8px' }}>Lixeira vazia</h2>
                    <p style={{ color: '#64748B', fontSize: '14px' }}>Nenhum pedido foi excluído nos últimos tempos.</p>
                </div>
            ) : (
                <div className="stark-card" style={{ padding: 0, overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#F9FAFB', borderBottom: '1px solid var(--admin-border)' }}>
                                <th style={headerStyle}>CLIENTE</th>
                                <th style={headerStyle}>PRODUTO</th>
                                <th style={headerStyle}>DATA EXCLUSÃO</th>
                                <th style={{ ...headerStyle, textAlign: 'right' }}>AÇÕES</th>
                            </tr>
                        </thead>
                        <tbody>
                            {deletedOrders.map((order: any) => (
                                <tr key={order.id} style={{ borderBottom: '1px solid var(--admin-border)' }}>
                                    <td style={cellStyle}>
                                        <div style={{ fontSize: '14px', fontWeight: 700, color: '#1E293B' }}>{order.fullName}</div>
                                        <div style={{ fontSize: '12px', color: '#64748B' }}>{order.email}</div>
                                        <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px' }}>ID: {order.id.toUpperCase()}</div>
                                    </td>
                                    <td style={cellStyle}>
                                        <div style={{ fontSize: '13px', fontWeight: 600 }}>{order.product?.name || 'Produto'}</div>
                                        <div style={{ fontSize: '13px', fontWeight: 800, color: 'black' }}>R$ {order.totalPrice?.toFixed(2)}</div>
                                    </td>
                                    <td style={cellStyle}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748B' }}>
                                            <Clock size={14} />
                                            <div style={{ fontSize: '13px', fontWeight: 600 }}>
                                                {new Date(order.deletedAt).toLocaleDateString('pt-BR')} às {new Date(order.deletedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ ...cellStyle, textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                            <RestoreButton orderId={order.id} />
                                            <PermanentDeleteButton orderId={order.id} />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}

const headerStyle: React.CSSProperties = {
    padding: '14px 20px',
    fontSize: '10px',
    fontWeight: 900,
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: '0.1em'
}

const cellStyle: React.CSSProperties = {
    padding: '18px 20px',
}
