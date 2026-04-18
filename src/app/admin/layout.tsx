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
import CapacitorInit from '@/components/CapacitorInit'

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
        { icon: Bell, label: 'Notificações', href: '/admin/notificacoes' },
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

    const [isSidebarOpen, setIsSidebarOpen] = useState(false)

    return (
        <div className="admin-layout" style={{ fontFamily: '"Space Grotesk", "Nunito", sans-serif' }}>
            <CapacitorInit />
            <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

            {/* Sidebar Overlay (Mobile) */}
            {isSidebarOpen && (
                <div
                    className="sidebar-overlay"
                    onClick={() => setIsSidebarOpen(false)}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.5)',
                        backdropFilter: 'blur(4px)',
                        zIndex: 95
                    }}
                />
            )}

            <aside className={`sidebar ${isSidebarOpen ? 'mobile-open' : 'desktop-only'}`}>
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
                            <div key={item.label} onClick={() => setIsSidebarOpen(false)}>
                                <SidebarItem
                                    icon={item.icon}
                                    label={item.label}
                                    href={item.href}
                                    active={pathname === item.href}
                                />
                            </div>
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
                <TopBar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
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
                    .mobile-only {
                        display: flex !important;
                    }
                    .main-content-inner {
                        padding: 16px;
                        padding-top: 24px;
                    }
                    .desktop-only {
                        display: none !important;
                    }
                    .sidebar.mobile-open {
                        display: flex !important;
                        left: 0 !important;
                        animation: slideIn 0.3s ease-out;
                    }
                    @keyframes slideIn {
                        from { transform: translateX(-100%); }
                        to { transform: translateX(0); }
                    }
                    .main-content {
                        margin-left: 0 !important;
                        width: 100% !important;
                        padding-bottom: 80px !important;
                    }
                    .topbar-container {
                        padding: 12px 16px !important;
                    }
                    .topbar-greeting {
                        font-size: 13px !important;
                        max-width: 150px;
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                    }
                    .topbar-progress {
                        gap: 8px !important;
                    }
                    .topbar-progress-line {
                        width: 80px !important;
                    }
                }
                @media (max-width: 480px) {
                    .topbar-greeting {
                        display: none !important;
                    }
                    .main-content-inner {
                        padding: 12px;
                        padding-top: 16px;
                    }
                }
            `}</style>
        </div>
    )
}
