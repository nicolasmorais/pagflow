'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart3, ShoppingCart, Package, Settings } from 'lucide-react'
import NotificationCenter from './NotificationCenter'

const getItemStyle = (active: boolean) => ({
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    textDecoration: 'none',
    color: active ? '#0075ff' : '#94a3b8',
    transition: 'all 0.2s',
    background: active ? '#eff6ff' : 'transparent',
    padding: '12px 18px',
    borderRadius: '16px',
})

export default function BottomNav() {
    const pathname = usePathname()

    const navItems = [
        { Icon: BarChart3, label: 'Analytics', href: '/admin' },
        { Icon: ShoppingCart, label: 'Vendas', href: '/admin/pedidos' },
        { Icon: Package, label: 'Produtos', href: '/admin/produtos' },
        { Icon: Settings, label: 'Configs', href: '/admin/configuracoes' },
    ]

    return (
        <nav className="bottom-nav" style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            height: '75px',
            background: 'white',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'center',
            padding: '0 10px',
            zIndex: 1000,
            boxShadow: '0 -4px 12px rgba(0,0,0,0.08)',
            visibility: 'hidden'
        }}>
            <Link key={navItems[0].href} href={navItems[0].href} style={getItemStyle(pathname === navItems[0].href)}>
                <BarChart3 size={22} />
            </Link>

            <Link key={navItems[1].href} href={navItems[1].href} style={getItemStyle(pathname === navItems[1].href)}>
                <ShoppingCart size={22} />
            </Link>

            <Link key={navItems[2].href} href={navItems[2].href} style={getItemStyle(pathname === navItems[2].href)}>
                <Package size={22} />
            </Link>

            <Link key={navItems[3].href} href={navItems[3].href} style={getItemStyle(pathname === navItems[3].href)}>
                <Settings size={22} />
            </Link>

            <style jsx>{`
                @media (max-width: 1024px) {
                    .bottom-nav {
                        visibility: visible !important;
                        display: flex !important;
                    }
                }
            `}</style>
        </nav>
    )
}
