'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { checkRateLimit } from '@/lib/rate-limit'
import { headers } from 'next/headers'

export async function loginAction(formData: FormData) {
    const headersList = await headers()
    const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim()
        || headersList.get('x-real-ip')
        || 'unknown'

    const { limited } = checkRateLimit(`login:${ip}`, 5, 60_000)
    if (limited) {
        return { error: 'Muitas tentativas. Aguarde 1 minuto.' }
    }

    const password = formData.get('password') as string

    const adminPassword = process.env.ADMIN_PASSWORD
    if (!adminPassword) {
        console.error('ADMIN_PASSWORD env var not set!')
        return { error: 'Configuração do servidor incorreta.' }
    }

    if (password === adminPassword) {
        const cookieStore = await cookies()
        cookieStore.set('admin_auth', 'authenticated', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: '/'
        })
        redirect('/admin')
    }

    return { error: 'Senha incorreta. Tente novamente.' }
}

export async function logoutAction() {
    const cookieStore = await cookies()
    cookieStore.delete('admin_auth')
    redirect('/login')
}
