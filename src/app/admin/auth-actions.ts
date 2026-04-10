'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function loginAction(formData: FormData) {
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
