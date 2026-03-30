'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    LayoutDashboard,
    ShoppingBag,
    Package,
    BarChart3,
    Settings,
    HelpCircle,
    LogOut,
    ChevronRight,
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

    const navItems = [
        { icon: LayoutDashboard, label: 'Resumo', href: '/admin' },
        { icon: ShoppingBag, label: 'Pedidos', href: '/admin/pedidos', count: pendingOrders },
        { icon: Package, label: 'Produtos', href: '/admin/produtos' },
    ]

    return (
        <div className="admin-layout">
            {/* Sidebar Navigation */}
            <aside className="sidebar">
                <div className="sidebar-logo">
                    <img
                        src="https://pub-da9fd1c19b8e45d691d67626b9a7ba6d.r2.dev/1774828533696-1774828360577-019d3c03-84c9-7750-9ed0-2cd31fab976b.png"
                        alt="Logo"
                        style={{ height: '40px', width: 'auto', objectFit: 'contain' }}
                    />
                </div>

                <div className="sidebar-section-title">Menu</div>

                <nav className="sidebar-nav">
                    {navItems.map((item) => (
                        <SidebarItem
                            key={item.label}
                            icon={item.icon}
                            label={item.label}
                            href={item.href}
                            active={pathname === item.href}
                            count={item.count}
                        />
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <div className="user-profile">
                        <div className="user-avatar">AD</div>
                        <div className="user-info">
                            <span className="user-name">Admin</span>
                            <span className="user-role">Super Usuário</span>
                        </div>
                        <Link href="/" title="Sair" style={{ marginLeft: 'auto', color: '#94a3b8', transition: 'color 0.2s' }}>
                            <LogOut size={18} />
                        </Link>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="main-content">
                <header style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '32px 0 24px 0',
                    gap: '24px',
                    alignItems: 'flex-start'
                }}>
                    <div>
                        <h1 className="title" style={{ fontSize: '2.2rem', marginBottom: '4px', lineHeight: '1.2' }}>
                            {pathname === '/admin' && 'Dashboard de Vendas'}
                            {pathname === '/admin/pedidos' && 'Gestão de Pedidos'}
                            {pathname === '/admin/produtos' && 'Meus Produtos'}
                        </h1>
                        <p className="subtitle" style={{ margin: 0 }}>
                            {pathname === '/admin' && 'Bem-vindo ao PagFlow. Veja o que está acontecendo hoje.'}
                            {pathname === '/admin/pedidos' && 'Gerencie todos os pedidos e acompanhe o status.'}
                            {pathname === '/admin/produtos' && 'Cadastre e gerencie os produtos para venda.'}
                        </p>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', paddingTop: '8px' }}>
                        <button style={{
                            background: '#fff',
                            border: '1px solid #e2e8f0',
                            borderRadius: '10px',
                            padding: '8px',
                            color: '#64748b',
                            cursor: 'pointer',
                            position: 'relative',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <Bell size={18} />
                            <span style={{
                                position: 'absolute',
                                top: '8px',
                                right: '8px',
                                width: '6px',
                                height: '6px',
                                background: '#ef4444',
                                borderRadius: '50%',
                                border: '1.5px solid #fff'
                            }}></span>
                        </button>

                        <div style={{
                            background: '#fff',
                            border: '1px solid #e2e8f0',
                            borderRadius: '10px',
                            padding: '8px 14px',
                            fontSize: '13px',
                            fontWeight: '600',
                            color: '#475569',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                        }}>
                            <span style={{ width: '6px', height: '6px', background: '#22c55e', borderRadius: '50%' }}></span>
                            Sistema Online
                        </div>
                    </div>
                </header>

                {children}
            </main>
        </div>
    )
}
