export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma'
import { Package } from 'lucide-react'
import ProductsHeader from './components/ProductsHeader'
import ProductRow from './components/ProductRow'

export default async function ProductsPage() {
    const products = await prisma.product.findMany({
        orderBy: { createdAt: 'desc' }
    })

    const gridLayout = 'minmax(300px, 1.5fr) minmax(120px, 1fr) minmax(120px, 1fr) minmax(200px, 1.2fr) 180px';

    return (
        <div style={{ width: '100%', margin: '0 auto', padding: '24px 0' }}>
            <ProductsHeader />

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
                        letterSpacing: '0.05em',
                        opacity: 0.6
                    }}>
                        <div>Produto</div>
                        <div>Preço</div>
                        <div>Comissão</div>
                        <div>Link de Checkout</div>
                        <div style={{ textAlign: 'right' }}>Ações</div>
                    </div>
                )}

                {products.length === 0 ? (
                    <div className="glass-card" style={{ textAlign: 'center', padding: '5rem', borderRadius: '32px' }}>
                        <div style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '30px',
                            background: '#f1f5f9',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 24px',
                            color: '#94a3b8'
                        }}>
                            <Package size={38} />
                        </div>
                        <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1e293b', marginBottom: '8px' }}>Sem produtos por aqui</h3>
                        <p style={{ color: '#64748b', fontSize: '14px', maxWidth: '300px', margin: '0 auto' }}>
                            Você ainda não cadastrou nenhum produto. Clique no botão acima para começar.
                        </p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {products.map((product) => (
                            <ProductRow key={product.id} product={product} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
