'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function loginAction(formData: FormData) {
    const password = formData.get('password') as string

    if (password === '84740949') {
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
