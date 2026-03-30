import Link from 'next/link'
import { Package, ArrowRight, ShieldCheck, Clock } from 'lucide-react'

export default function Home() {
  return (
    <div>
      <nav className="nav">
        <div className="nav-logo">PagFlow</div>
        <Link href="/checkout" className="btn-primary" style={{ width: 'auto', padding: '0.5rem 1.5rem' }}>
          Agendar Agora
        </Link>
      </nav>

      <main className="container" style={{ textAlign: 'center', maxWidth: '800px' }}>
        <Package size={80} color="var(--primary)" style={{ marginBottom: '2rem' }} />
        <h1 className="title" style={{ fontSize: '3.5rem' }}>Entrega Inteligente</h1>
        <p className="subtitle" style={{ fontSize: '1.25rem' }}>
          Agende suas entregas de forma rápida, segura e transparente.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem', marginTop: '4rem', marginBottom: '4rem' }}>
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <Clock size={32} color="var(--accent)" style={{ marginBottom: '1rem' }} />
            <h3 style={{ marginBottom: '0.5rem' }}>Rápido</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Agende em menos de 2 minutos.</p>
          </div>
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <ShieldCheck size={32} color="var(--accent)" style={{ marginBottom: '1rem' }} />
            <h3 style={{ marginBottom: '0.5rem' }}>Seguro</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Seus dados protegidos de ponta a ponta.</p>
          </div>
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <Package size={32} color="var(--accent)" style={{ marginBottom: '1rem' }} />
            <h3 style={{ marginBottom: '0.5rem' }}>Fácil</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Acompanhe tudo pelo nosso painel.</p>
          </div>
        </div>

        <Link href="/checkout" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', width: 'auto', padding: '1rem 3rem', fontSize: '1.125rem' }}>
          Começar Agendamento <ArrowRight size={20} />
        </Link>

        <div style={{ marginTop: '2rem' }}>
          <Link href="/admin" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.875rem' }}>
            Acessar Painel Admin
          </Link>
        </div>
      </main>
    </div>
  )
}
