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
    Bell
} from 'lucide-react'
import './admin.css'

const SidebarItem = ({ icon: Icon, label, href, active, count }: {
    icon: any,
    label: string,
    href: string,
    active: boolean,
    count?: number
}) => (
    <Link href={href} className={`nav-item ${active ? 'active' : ''}`}>
        <Icon className="nav-item-icon" />
        <span>{label}</span>
        {count !== undefined && count > 0 && (
            <span className="nav-count">{count}</span>
        )}
    </Link>
)

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()

    // Simulated stats for the sidebar
    const pendingOrders = 3 // This would come from real data in a production app

    const mainMenu = [
        { icon: Home, label: 'Visão Geral', href: '/admin' },
        { icon: ShoppingCart, label: 'Todas as Vendas', href: '/admin/vendas' },
        { icon: ShoppingBag, label: 'Abandonados', href: '/admin/abandonados' },
        { icon: Package, label: 'Produtos', href: '/admin/produtos' },
        { icon: Truck, label: 'Fretes', href: '/admin/ecommerce' },
        { icon: Megaphone, label: 'Marketing', href: '/admin/marketing' },
        { icon: Sparkles, label: 'Order Bumps', href: '/admin/ordem' },
        { icon: Target, label: 'ROI de Anúncios', href: '/admin/roi' },
    ]

    const managementMenu = [
        { icon: Sparkles, label: 'Personalização', href: '/admin/personalizacao' },
        { icon: Settings, label: 'Configurações', href: '/admin/configuracoes' },
        { icon: Activity, label: 'Status do Sistema', href: '/admin/status' },
    ]

    return (
        <div className="admin-layout">
            {/* Sidebar Navigation */}
            <aside className="sidebar">
                <div className="sidebar-logo">
                    <img
                        src="https://pub-da9fd1c19b8e45d691d67626b9a7ba6d.r2.dev/1774908668169-1774828360577-019d3c03-84c9-7750-9ed0-2cd31fab976b-(2).png"
                        alt="Logo"
                        style={{ height: '32px', width: 'auto', objectFit: 'contain' }}
                    />
                </div>

                <div className="sidebar-scroll">
                    <div className="sidebar-section-title">Menu Principal</div>
                    <nav className="sidebar-nav">
                        {mainMenu.map((item) => (
                            <SidebarItem
                                key={item.label}
                                icon={item.icon}
                                label={item.label}
                                href={item.href}
                                active={pathname === item.href}
                            />
                        ))}
                    </nav>

                    <div className="sidebar-section-title" style={{ marginTop: '24px' }}>Gerenciamento</div>
                    <nav className="sidebar-nav">
                        {managementMenu.map((item) => (
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
                            <span className="user-role">Super Usuário</span>
                        </div>
                        <Link href="/" title="Sair" style={{ marginLeft: 'auto', color: '#94a3b8', transition: 'color 0.2s' }}>
                            <LogOut size={16} />
                        </Link>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="main-content">
                <header style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '20px 0 16px 0',
                    alignItems: 'center'
                }}>
                    <div>
                        <h1 className="title" style={{ fontSize: '1.6rem', margin: 0 }}>
                            {pathname === '/admin' && 'Visão Geral'}
                            {pathname === '/admin/vendas' && 'Todas as Vendas'}
                            {pathname === '/admin/abandonados' && 'Carrinhos Abandonados'}
                            {pathname === '/admin/produtos' && 'Gestão de Produtos'}
                            {pathname === '/admin/ecommerce' && 'Gestão de Fretes'}
                            {pathname === '/admin/marketing' && 'Marketing & Campanhas'}
                            {pathname === '/admin/roi' && 'Analítico de ROI'}
                            {pathname === '/admin/personalizacao' && 'Personalizar Loja'}
                            {pathname === '/admin/configuracoes' && 'Configurações do Sistema'}
                            {pathname === '/admin/status' && 'Status do Servidor'}
                        </h1>
                    </div>
                </header>

                {children}
            </main>
        </div>
    )
}
