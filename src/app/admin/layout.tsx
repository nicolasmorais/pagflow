'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    BarChart3,
    LineChart,
    ShoppingCart,
    Package,
    Truck,
    Target,
    Mail,
    AlertTriangle,
    Megaphone,
    Settings,
    Bell,
    LogOut,
    Wallet,
    Bot,
    RefreshCw,
    PackagePlus,
    Palette
} from 'lucide-react'
import { logoutAction } from './auth-actions'
import './admin.css'

const menuSections = [
    {
        label: 'Visão Geral',
        items: [
            { icon: BarChart3, label: 'Dashboard', href: '/admin' },
            { icon: LineChart, label: 'Analytics', href: '/admin/analytics' },
            { icon: ShoppingCart, label: 'Pedidos', href: '/admin/pedidos' },
            { icon: Wallet, label: 'Financeiro', href: '/admin/financeiro' },
            { icon: RefreshCw, label: 'PIX Parcelado', href: '/admin/pix-parcelado' },
        ]
    },
    {
        label: 'Catálogo',
        items: [
            { icon: Package, label: 'Produtos', href: '/admin/produtos' },
            { icon: Truck, label: 'Frete', href: '/admin/ecommerce' },
            { icon: PackagePlus, label: 'Order Bumps', href: '/admin/ordem' },
        ]
    },
    {
        label: 'Marketing',
        items: [
            { icon: Target, label: 'Pixels', href: '/admin/marketing' },
            { icon: Megaphone, label: 'Taboola', href: '/admin/taboola' },
            { icon: Mail, label: 'E-mails', href: '/admin/emails' },
            { icon: Palette, label: 'Personalização', href: '/admin/personalizacao' },
        ]
    },
    {
        label: 'Sistema',
        items: [
            { icon: Bot, label: 'MCP Agent', href: '/admin/mcp' },
            { icon: AlertTriangle, label: 'Erros', href: '/admin/errors' },
            { icon: Settings, label: 'Configurações', href: '/admin/configuracoes' },
            { icon: Bell, label: 'Notificações', href: '/admin/notificacoes' },
        ]
    },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    // Rotas filhas (ex.: /admin/pedidos/123) mantêm o item pai ativo
    const isActiveRoute = (href: string) =>
        href === '/admin' ? pathname === href : pathname === href || pathname.startsWith(href + '/')

    return (
        <div className="admin-layout" style={{ fontFamily: '"Space Grotesk", "Nunito", sans-serif' }}>
            <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

            <aside className="sidebar">
                {/* Logo */}
                <div className="sidebar-header">
                    <div className="sidebar-logo">
                        <img
                            className="sidebar-logo-desktop"
                            src="https://pub-da9fd1c19b8e45d691d67626b9a7ba6d.r2.dev/1774828533696-1774828360577-019d3c03-84c9-7750-9ed0-2cd31fab976b.png"
                            alt="PagFlow"
                        />
                        <img
                            className="sidebar-logo-mobile"
                            src="https://pub-da9fd1c19b8e45d691d67626b9a7ba6d.r2.dev/1779247326232-1774828533696-1774828360577-019d3c03-84c9-7750-9ed0-2cd31fab976b-(1).png"
                            alt="PagFlow"
                        />
                    </div>
                </div>

                {/* Navigation */}
                <nav className="sidebar-nav" aria-label="Menu do admin">
                    {menuSections.map((section) => (
                        <div key={section.label} className="sidebar-section">
                            <span className="sidebar-section-label">{section.label}</span>
                            {section.items.map((item) => {
                                const isActive = isActiveRoute(item.href)
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`sidebar-link ${isActive ? 'active' : ''}`}
                                        aria-current={isActive ? 'page' : undefined}
                                        aria-label={item.label}
                                        title={item.label}
                                    >
                                        <item.icon size={18} strokeWidth={isActive ? 2.2 : 1.8} aria-hidden />
                                        <span>{item.label}</span>
                                    </Link>
                                )
                            })}
                        </div>
                    ))}
                </nav>

                {/* Footer */}
                <div className="sidebar-footer">
                    <div className="sidebar-user">
                        <div className="sidebar-user-avatar" aria-hidden>AD</div>
                        <div className="sidebar-user-info">
                            <span className="sidebar-user-name">Admin</span>
                            <span className="sidebar-user-role">Administrador</span>
                        </div>
                        <form action={logoutAction} className="sidebar-logout-form">
                            <button type="submit" className="sidebar-logout" title="Sair" aria-label="Sair do admin">
                                <LogOut size={16} aria-hidden />
                            </button>
                        </form>
                    </div>
                </div>
            </aside>

            <main className="main-content">
                <div className="main-content-inner">
                    {children}
                </div>
            </main>

            <style jsx global>{`
                .main-content-inner { padding: 28px 40px; }
                @media (max-width: 1400px) {
                    .main-content-inner { padding: 24px 28px; }
                }
                @media (max-width: 1024px) {
                    .main-content-inner { padding: 16px; padding-top: 20px; }
                }
                @media (max-width: 480px) {
                    .main-content-inner { padding: 12px; padding-top: 16px; }
                }
            `}</style>
        </div>
    )
}
