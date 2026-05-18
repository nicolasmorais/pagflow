export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma'
import { Package } from 'lucide-react'
import ProductsHeader from './components/ProductsHeader'
import ProductCard from './components/ProductCard'

export default async function ProductsPage() {
    const products = await prisma.product.findMany({
        orderBy: { createdAt: 'desc' }
    })

    return (
        <div style={{ width: '100%', paddingBottom: '60px' }}>
            <ProductsHeader productCount={products.length} />

            {products.length === 0 ? (
                <div style={{
                    background: '#fff', border: '1px solid #f1f5f9', borderRadius: '18px',
                    padding: '80px 40px', textAlign: 'center',
                }}>
                    <div style={{
                        width: '72px', height: '72px', background: '#f8fafc', borderRadius: '18px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
                    }}>
                        <Package size={32} color="#cbd5e1" />
                    </div>
                    <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1e293b', margin: '0 0 8px' }}>Nenhum produto ainda</h3>
                    <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>Use o campo acima para criar seu primeiro produto.</p>
                </div>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: '14px',
                }}>
                    {products.map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            )}
        </div>
    )
}
