'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { TESTIMONIALS_KEY, normalizeTestimonials, type TestimonialsConfig } from '@/lib/testimonials'

async function requireAdmin() {
    const cookieStore = await cookies()
    if (cookieStore.get('admin_auth')?.value !== 'authenticated') {
        throw new Error('Não autorizado')
    }
}

export async function saveTestimonials(input: TestimonialsConfig): Promise<{ success: boolean; config: TestimonialsConfig }> {
    await requireAdmin()
    // Normaliza no servidor: corta tamanhos, valida a foto (só https) e descarta itens sem nome/texto
    const config = normalizeTestimonials(input)
    const value = JSON.stringify(config)
    await prisma.customization_settings.upsert({
        where: { key: TESTIMONIALS_KEY },
        update: { value, updated_at: new Date() },
        create: { key: TESTIMONIALS_KEY, value },
    })
    revalidatePath('/admin/depoimentos')
    revalidatePath('/checkout')
    return { success: true, config }
}
