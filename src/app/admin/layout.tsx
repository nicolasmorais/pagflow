'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    BarChart3,
    ShoppingCart,
    Package,
    Truck,
    Target,
    Sparkles,
    Mail,
    Settings,
    Bell,
    LogOut,
    X
} from 'lucide-react'
import './admin.css'

const menuSections = [
    {
        label: 'Visão Geral',
        items: [
            { icon: BarChart3, label: 'Dashboard', href: '/admin' },
            { icon: ShoppingCart, label: 'Pedidos', href: '/admin/pedidos' },
        ]
    },
    {
        label: 'Catálogo',
        items: [
            { icon: Package, label: 'Produtos', href: '/admin/produtos' },
            { icon: Truck, label: 'Frete', href: '/admin/ecommerce' },
            { icon: Sparkles, label: 'Order Bumps', href: '/admin/ordem' },
        ]
    },
    {
        label: 'Marketing',
        items: [
            { icon: Target, label: 'Pixels', href: '/admin/marketing' },
            { icon: Mail, label: 'E-mails', href: '/admin/emails' },
            { icon: Sparkles, label: 'Personalização', href: '/admin/personalizacao' },
        ]
    },
    {
        label: 'Sistema',
        items: [
            { icon: Settings, label: 'Configurações', href: '/admin/configuracoes' },
            { icon: Bell, label: 'Notificações', href: '/admin/notificacoes' },
        ]
    },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)

    return (
        <div className="admin-layout" style={{ fontFamily: '"Space Grotesk", "Nunito", sans-serif' }}>
            <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />
            )}

            <aside className={`sidebar ${isSidebarOpen ? 'mobile-open' : ''}`}>
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
                    <button className="sidebar-close-btn" onClick={() => setIsSidebarOpen(false)}>
                        <X size={18} />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="sidebar-nav">
                    {menuSections.map((section) => (
                        <div key={section.label} className="sidebar-section">
                            <span className="sidebar-section-label">{section.label}</span>
                            {section.items.map((item) => {
                                const isActive = pathname === item.href
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`sidebar-link ${isActive ? 'active' : ''}`}
                                        onClick={() => setIsSidebarOpen(false)}
                                    >
                                        <item.icon size={18} strokeWidth={isActive ? 2.2 : 1.8} />
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
                        <div className="sidebar-user-avatar">AD</div>
                        <div className="sidebar-user-info">
                            <span className="sidebar-user-name">Admin</span>
                            <span className="sidebar-user-role">Premium</span>
                        </div>
                        <Link href="/" title="Sair" className="sidebar-logout">
                            <LogOut size={16} />
                        </Link>
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
