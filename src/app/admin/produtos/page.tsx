import { prisma } from '@/lib/prisma'
import { Plus, Package } from 'lucide-react'
import { createProduct } from '../../actions'
import ProductRow from './components/ProductRow'

export default async function ProductsPage() {
    const products = await prisma.product.findMany({
        orderBy: { createdAt: 'desc' }
    })

    const gridLayout = 'minmax(300px, 1.5fr) minmax(120px, 1fr) minmax(120px, 1fr) minmax(200px, 1.2fr) 180px';

    return (
        <div style={{ width: '100%' }}>

            {/* Creation form in a horizontal layout or compact card */}
            <div className="glass-card" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Plus size={18} color="#3b82f6" />
                    Novo Produto
                </h2>
                <form action={createProduct} style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(250px, 1.5fr) minmax(120px, 0.8fr) minmax(120px, 0.8fr) minmax(250px, 1.5fr) 180px',
                    gap: '1.25rem',
                    alignItems: 'flex-end'
                }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--admin-text-secondary)' }}>NOME</label>
                        <input
                            name="name"
                            type="text"
                            className="input-field"
                            placeholder="Nome do produto"
                            style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#000', padding: '10px' }}
                            required
                        />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--admin-text-secondary)' }}>PREÇO (R$)</label>
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
                        <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--admin-text-secondary)' }}>COMISSÃO (R$)</label>
                        <input
                            name="commission"
                            type="number"
                            step="0.01"
                            className="input-field"
                            placeholder="0.00"
                            style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#000', padding: '10px' }}
                            required
                        />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--admin-text-secondary)' }}>URL DA FOTO (OPCIONAL)</label>
                        <input
                            name="imageUrl"
                            type="url"
                            className="input-field"
                            placeholder="Link da imagem..."
                            style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#000', padding: '10px' }}
                        />
                    </div>
                    <button type="submit" className="btn-primary" style={{ background: '#3b82f6', height: '42px', fontWeight: 800 }}>
                        Adicionar
                    </button>
                </form>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {products.length > 0 && (
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
                        <div>Produto</div>
                        <div>Preço</div>
                        <div>Comissão</div>
                        <div>Link de Checkout</div>
                        <div style={{ textAlign: 'right' }}>Ações</div>
                    </div>
                )}

                {products.length === 0 ? (
                    <div className="glass-card" style={{ textAlign: 'center', padding: '4rem' }}>
                        <Package size={48} color="#e2e8f0" style={{ marginBottom: '1rem' }} />
                        <p className="subtitle">Nenhum produto cadastrado.</p>
                    </div>
                ) : (
                    products.map((product) => (
                        <ProductRow key={product.id} product={product} />
                    ))
                )}
            </div>
        </div>
    )
}
