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
    BarChart3
} from 'lucide-react'
import './admin.css'

const SidebarItem = ({ icon: Icon, label, href, active, count, subItems, pathname }: {
    icon: any,
    label: string,
    href: string,
    active: boolean,
    count?: number,
    subItems?: { label: string, href: string }[],
    pathname: string
}) => {
    const [isOpen, setIsOpen] = useState(active || subItems?.some(sub => pathname === sub.href))

    return (
        <div className="nav-item-container">
            <Link
                href={href}
                className={`nav-item ${active ? 'active' : ''}`}
                onClick={(e) => {
                    if (subItems) {
                        setIsOpen(!isOpen)
                    }
                }}
            >
                <div className="nav-icon-box">
                    <Icon className="nav-item-icon" />
                </div>
                <span>{label}</span>
                {count !== undefined && count > 0 && (
                    <span className="nav-count">{count}</span>
                )}
                {subItems && (
                    <ChevronDown size={14} style={{ marginLeft: 'auto', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                )}
            </Link>

            {subItems && isOpen && (
                <div className="sub-menu">
                    {subItems.map((sub) => (
                        <Link
                            key={sub.href}
                            href={sub.href}
                            className={`sub-nav-item ${pathname === sub.href ? 'active' : ''}`}
                        >
                            <span>{sub.label}</span>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    )
}

import TopBar from './components/TopBar'
import BottomNav from './components/BottomNav'

import NotificationCenter from './components/NotificationCenter'

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()

    const mainMenu = [
        { icon: BarChart3, label: 'Analytics', href: '/admin' },
        {
            icon: ShoppingCart,
            label: 'Todas as Vendas',
            href: '/admin/pedidos',
            subItems: [
                { label: 'Pedidos', href: '/admin/pedidos' },
                { label: 'Carrinhos Abandonados', href: '/admin/abandonados' },
            ]
        },
        {
            icon: Package,
            label: 'Produtos',
            href: '/admin/produtos',
            subItems: [
                { label: 'Lista de Produtos', href: '/admin/produtos' },
                { label: 'Configurações de Frete', href: '/admin/ecommerce' },
            ]
        },
        {
            icon: Megaphone,
            label: 'Marketing',
            href: '/admin/marketing',
            subItems: [
                { label: 'Pixel', href: '/admin/marketing' },
                { label: 'Order Bumps', href: '/admin/ordem' },
                { label: 'ROI de Anúncios', href: '/admin/roi' },
                { label: 'E-mails', href: '/admin/emails' },
            ]
        },
    ]

    const managementMenu = [
        { icon: Sparkles, label: 'Personalização', href: '/admin/personalizacao' },
        { icon: Settings, label: 'Configurações', href: '/admin/configuracoes' },
    ]

    return (
        <div className="admin-layout" style={{ fontFamily: '"Space Grotesk", "Nunito", sans-serif' }}>
            <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
            {/* Sidebar Navigation - Hidden on Mobile */}
            <aside className="sidebar desktop-only">
                <div className="sidebar-logo" style={{ padding: '0 12px', marginBottom: '24px' }}>
                    <img
                        src="https://pub-da9fd1c19b8e45d691d67626b9a7ba6d.r2.dev/1774828533696-1774828360577-019d3c03-84c9-7750-9ed0-2cd31fab976b.png"
                        alt="PagFlow"
                        style={{ maxWidth: '100%', height: 'auto', display: 'block' }}
                    />
                </div>

                <div className="sidebar-scroll">
                    <nav className="sidebar-nav">
                        {mainMenu.map((item) => (
                            <SidebarItem
                                key={item.label}
                                icon={item.icon}
                                label={item.label}
                                href={item.href}
                                active={pathname === item.href}
                                subItems={(item as any).subItems}
                                pathname={pathname}
                            />
                        ))}
                    </nav>

                    <div className="sidebar-section-title">ACCOUNT PAGES</div>
                    <nav className="sidebar-nav">
                        {managementMenu.map((item) => (
                            <SidebarItem
                                key={item.label}
                                icon={item.icon}
                                label={item.label}
                                href={item.href}
                                active={pathname === item.href}
                                subItems={(item as any).subItems}
                                pathname={pathname}
                            />
                        ))}
                    </nav>
                </div>

                <div className="sidebar-footer">
                    <div style={{ padding: '0 12px 16px' }}>
                        <NotificationCenter />
                    </div>
                    <div className="user-profile">
                        <div className="user-avatar">AD</div>
                        <div className="user-info">
                            <span className="user-name">Admin</span>
                            <span className="user-role">Premium User</span>
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
