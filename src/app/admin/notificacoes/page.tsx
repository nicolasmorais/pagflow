// Trigger build - v2
import { prisma } from '@/lib/prisma'
import { Bell, CheckCircle2, ShoppingCart, Clock } from 'lucide-react'
import TestPushButton from './TestPushButton' // Client component
export const dynamic = 'force-dynamic';

export default async function NotificacoesPage() {
    // 1. Fetch recent events (last 50 orders)
    const recentOrders = await prisma.order.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: { product: true }
    });

    const formatMoney = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

    const notifications = recentOrders.map(order => {
        let type = 'pending';
        let icon = Clock;
        let color = '#f59e0b';
        let bg = '#fef3c7';
        let title = 'Compra Pendente';
        let description = `Novo pedido de ${order.fullName || 'Cliente'} aguardando pagamento.`;

        if (order.paymentStatus === 'pago') {
            type = 'approved';
            icon = CheckCircle2;
            color = '#10b981';
            bg = '#d1fae5';
            title = 'Compra Aprovada!';
            description = `Pagamento de ${order.fullName || 'Cliente'} aprovado. Receita: ${formatMoney(order.netReceived || order.totalPrice)}.`;
        } else if (order.paymentStatus === 'abandonado' || order.paymentStatus === 'processando') {
            type = 'abandoned';
            icon = ShoppingCart;
            color = '#ef4444';
            bg = '#fee2e2';
            title = 'Carrinho Abandonado';
            description = `${order.fullName || 'Um cliente'} deixou ${order.product?.name || 'itens'} no carrinho.`;
        }

        return {
            id: order.id,
            date: order.createdAt,
            type, icon, color, bg, title, description
        }
    }).filter(n => n.type === 'approved' || n.type === 'abandoned' || n.type === 'pending');

    return (
        <div style={{ width: '100%', paddingBottom: '60px' }}>

            <header className="page-header" style={{
                marginBottom: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '20px'
            }}>
                <div className="page-title-section" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div className="page-title-icon" style={{
                        width: '46px', height: '46px', borderRadius: '14px', flexShrink: 0,
                        background: 'linear-gradient(135deg, #1e293b, #0f172a)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 6px 18px rgba(15,23,42,0.3)'
                    }}>
                        <Bell size={22} color="white" />
                    </div>
                    <div className="page-title-text">
                        <h1 style={{ fontSize: 'clamp(1.1rem, 4vw, 1.5rem)', fontWeight: 900, color: '#1e293b', margin: 0, letterSpacing: '-0.03em' }}>
                            Notificações do Sistema
                        </h1>
                        <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b', fontWeight: 500 }}>
                            Acompanhe eventos de vendas e carrinhos abandonados.
                        </p>
                    </div>
                </div>

                <TestPushButton />
            </header>

            <div className="stark-card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {notifications.length === 0 ? (
                        <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
                            Nenhuma notificação recente encontrada.
                        </div>
                    ) : (
                        notifications.map((notif) => (
                            <div key={notif.id} style={{
                                display: 'flex', alignItems: 'flex-start', gap: '16px', padding: '16px',
                                border: '1px solid var(--admin-border)', borderRadius: '16px',
                                background: '#f8fafc', transition: 'all 0.2s ease'
                            }}>
                                <div style={{
                                    width: '42px', height: '42px', borderRadius: '12px', flexShrink: 0,
                                    background: notif.bg, color: notif.color,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    <notif.icon size={20} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '4px' }}>
                                        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#1e293b' }}>{notif.title}</h3>
                                        <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                            {new Intl.DateTimeFormat('pt-BR', {
                                                day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
                                            }).format(new Date(notif.date)).replace(',', ' às')}
                                        </span>
                                    </div>
                                    <p style={{ margin: 0, fontSize: '13px', color: '#64748b', lineHeight: 1.4, fontWeight: 500 }}>
                                        {notif.description}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
