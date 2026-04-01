export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma'
import { Plus, Trash2, Tag, ShoppingCart, Package, Star } from 'lucide-react'
import { createOrderBump, deleteOrderBump } from '@/app/actions'

export default async function OrderBumpsPage() {
    const p = prisma as any
    const bumps = (p.orderBump || p.OrderBump) ? await (p.orderBump || p.OrderBump).findMany({
        include: { product: true },
        orderBy: { createdAt: 'desc' }
    }) : []

    const products = await prisma.product.findMany({
        orderBy: { name: 'asc' }
    })

    return (
        <div style={{ width: '100%' }}>

            <div className="glass-card" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Plus size={18} color="#10b981" />
                    Novo Order Bump
                </h2>
                <form action={createOrderBump} style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '1.25rem',
                    alignItems: 'flex-end'
                }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--admin-text-secondary)' }}>NOME DA OFERTA</label>
                        <input
                            name="name"
                            type="text"
                            className="input-field"
                            placeholder="Ex: Leve +1 com 50% OFF"
                            style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#000', padding: '10px' }}
                            required
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--admin-text-secondary)' }}>PREÇO DO BUMP (R$)</label>
                        <input
                            name="price"
                            type="number"
                            step="0.01"
                            className="input-field"
                            placeholder="0.00"
                            style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#000', padding: '10px' }}
                            required
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--admin-text-secondary)' }}>PRODUTO VINCULADO</label>
                        <select
                            name="productId"
                            className="input-field"
                            style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#000', padding: '10px' }}
                        >
                            <option value="global">Todos os Produtos (Global)</option>
                            {products.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', gridColumn: 'span 2' }}>
                        <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--admin-text-secondary)' }}>DESCRIÇÃO CURTA</label>
                        <input
                            name="description"
                            type="text"
                            className="input-field"
                            placeholder="Frase de impacto para convencer o cliente"
                            style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#000', padding: '10px' }}
                            required
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--admin-text-secondary)' }}>URL DA IMAGEM</label>
                        <input
                            name="imageUrl"
                            type="url"
                            className="input-field"
                            placeholder="https://..."
                            style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#000', padding: '10px' }}
                        />
                    </div>

                    <button type="submit" className="btn-primary" style={{ background: '#10b981', height: '42px', fontWeight: 800, border: 'none', borderRadius: '12px', color: 'white', cursor: 'pointer' }}>
                        Criar Bump
                    </button>
                </form>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>Bumps Ativos</h3>

                {bumps.length === 0 ? (
                    <div className="glass-card" style={{ textAlign: 'center', padding: '4rem' }}>
                        <Star size={48} color="#e2e8f0" style={{ marginBottom: '1rem' }} />
                        <p style={{ color: '#94a3b8' }}>Nenhum order bump configurado.</p>
                    </div>
                ) : (
                    bumps.map((bump: any) => (
                        <div key={bump.id} className="glass-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                <div style={{
                                    width: '60px',
                                    height: '60px',
                                    borderRadius: '12px',
                                    overflow: 'hidden',
                                    background: '#f1f5f9',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    {bump.imageUrl ? (
                                        <img src={bump.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <Package size={24} color="#cbd5e1" />
                                    )}
                                </div>
                                <div>
                                    <h4 style={{ fontWeight: 800, color: '#1e293b' }}>{bump.name}</h4>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
                                        <span style={{ fontSize: '0.85rem', color: '#64748b' }}>{bump.description}</span>
                                        <span style={{ padding: '2px 8px', borderRadius: '4px', background: '#f0fdf4', color: '#166534', fontSize: '0.75rem', fontWeight: 700 }}>
                                            R$ {bump.price.toFixed(2)}
                                        </span>
                                    </div>
                                    <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Tag size={12} color="#94a3b8" />
                                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8' }}>
                                            Vínculo: {bump.product ? bump.product.name : 'Global (Todos)'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <form action={async () => {
                                'use server'
                                await deleteOrderBump(bump.id)
                            }}>
                                <button
                                    type="submit"
                                    className="btn-icon"
                                    style={{
                                        background: '#fef2f2',
                                        color: '#ef4444',
                                        border: 'none',
                                        padding: '10px',
                                        borderRadius: '10px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <Trash2 size={18} />
                                </button>
                            </form>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
