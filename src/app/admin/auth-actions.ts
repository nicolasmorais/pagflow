'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { checkRateLimit } from '@/lib/rate-limit'
import { headers } from 'next/headers'
import { timingSafeEqual } from 'crypto'

function safeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) return false
    try {
        return timingSafeEqual(Buffer.from(a), Buffer.from(b))
    } catch {
        return false
    }
}

export async function loginAction(formData: FormData) {
    const headersList = await headers()
    const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim()
        || headersList.get('x-real-ip')
        || 'unknown'

    const { limited } = checkRateLimit(`login:${ip}`, 5, 60_000)
    if (limited) {
        // Delay para dificultar brute force
        await new Promise(r => setTimeout(r, 2000))
        return { error: 'Muitas tentativas. Aguarde 1 minuto.' }
    }

    const password = formData.get('password') as string
    if (!password || typeof password !== 'string') {
        return { error: 'Senha inválida.' }
    }

    const adminPassword = process.env.ADMIN_PASSWORD
    if (!adminPassword) {
        console.error('ADMIN_PASSWORD env var not set!')
        return { error: 'Configuração do servidor incorreta.' }
    }

    // Comparação timing-safe para prevenir timing attacks
    if (safeCompare(password, adminPassword)) {
        const cookieStore = await cookies()
        cookieStore.set('admin_auth', 'authenticated', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: '/'
        })
        redirect('/admin')
    }

    // Delay em caso de falha para dificultar brute force
    await new Promise(r => setTimeout(r, 1000))
    return { error: 'Senha incorreta.' }
}

export async function logoutAction() {
    const cookieStore = await cookies()
    cookieStore.delete('admin_auth')
    redirect('/login')
}
