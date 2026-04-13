'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    Home,
    ShoppingCart,
    ShoppingBag,
    Package,
    Truck,
    Megaphone,
    Target,
    Sparkles,
    Settings,
    Activity,
    LogOut,
    Bell,
    Mail,
    ChevronDown,
    BarChart3,
    Shield
} from 'lucide-react'
import './admin.css'

const SidebarItem = ({ icon: Icon, label, href, active, count }: {
    icon: any,
    label: string,
    href: string,
    active: boolean,
    count?: number
}) => {
    return (
        <Link
            href={href}
            className={`nav-item ${active ? 'active' : ''}`}
        >
            <div className="nav-icon-box">
                <Icon className="nav-item-icon" />
            </div>
            <span>{label}</span>
            {count !== undefined && count > 0 && (
                <span className="nav-count">{count}</span>
            )}
        </Link>
    )
}

import TopBar from './components/TopBar'
import BottomNav from './components/BottomNav'
import NotificationCenter from './components/NotificationCenter'
import { Search } from 'lucide-react'

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()

    const menuItems = [
        { icon: BarChart3, label: 'Dashboard', href: '/admin' },
        { icon: ShoppingCart, label: 'Pedidos', href: '/admin/pedidos' },
        { icon: Activity, label: 'Carrinhos Abandonados', href: '/admin/abandonados' },
        { icon: Package, label: 'Lista de Produtos', href: '/admin/produtos' },
        { icon: Truck, label: 'Configurações de Frete', href: '/admin/ecommerce' },
        { icon: Target, label: 'Pixel de Marketing', href: '/admin/marketing' },
        { icon: Sparkles, label: 'Order Bumps', href: '/admin/ordem' },
        { icon: Activity, label: 'ROI de Anúncios', href: '/admin/roi' },
        { icon: Mail, label: 'Automação de E-mails', href: '/admin/emails' },
        { icon: Shield, label: 'Sistema Anti-Fuga', href: '/admin/antifuga' },
        { icon: Sparkles, label: 'Personalização', href: '/admin/personalizacao' },
        { icon: Settings, label: 'Configurações', href: '/admin/configuracoes' },
    ]

    return (
        <div className="admin-layout" style={{ fontFamily: '"Space Grotesk", "Nunito", sans-serif' }}>
            <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

            <aside className="sidebar desktop-only">
                <div className="sidebar-top-header">
                    <div className="sidebar-logo">
                        <img
                            src="https://pub-da9fd1c19b8e45d691d67626b9a7ba6d.r2.dev/1774828533696-1774828360577-019d3c03-84c9-7750-9ed0-2cd31fab976b.png"
                            alt="PagFlow"
                        />
                    </div>
                </div>

                <div className="sidebar-scroll">
                    <nav className="sidebar-nav">
                        {menuItems.map((item) => (
                            <SidebarItem
                                key={item.label}
                                icon={item.icon}
                                label={item.label}
                                href={item.href}
                                active={pathname === item.href}
                            />
                        ))}
                    </nav>
                </div>

                <div className="sidebar-footer">
                    <div className="user-profile">
                        <div className="user-avatar">AD</div>
                        <div className="user-info">
                            <span className="user-name">Admin</span>
                            <span className="user-role">Premium Account</span>
                        </div>
                        <Link href="/" title="Sair" className="logout-btn">
                            <LogOut size={16} />
                        </Link>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="main-content">
                <div className="main-content-inner">
                    {children}
                </div>
                <BottomNav />
            </main>

            <style jsx global>{`
                .main-content-inner {
                    padding: 32px;
                }
                @media (max-width: 1024px) {
                    .main-content-inner {
                        padding: 16px;
                        padding-top: 24px;
                    }
                    .desktop-only {
                        display: none !important;
                    }
                    .main-content {
                        margin-left: 0 !important;
                        width: 100% !important;
                        padding-bottom: 80px !important;
                    }
                }
                @media (max-width: 480px) {
                    .main-content-inner {
                        padding: 12px;
                        padding-top: 16px;
                    }
                }
            `}</style>
        </div>
    )
}
