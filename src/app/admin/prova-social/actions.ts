'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { SOCIAL_PROOF_KEY, normalizeSocialProofConfig, type SocialProofConfig } from '@/lib/social-proof'

async function requireAdmin() {
    const cookieStore = await cookies()
    if (cookieStore.get('admin_auth')?.value !== 'authenticated') {
        throw new Error('Não autorizado')
    }
}

export async function saveSocialProofConfig(input: SocialProofConfig): Promise<{ success: boolean; config: SocialProofConfig }> {
    await requireAdmin()
    // Normaliza no servidor: valores fora dos limites são ajustados, nunca gravados crus
    const config = normalizeSocialProofConfig(input)
    const value = JSON.stringify(config)
    await prisma.customization_settings.upsert({
        where: { key: SOCIAL_PROOF_KEY },
        update: { value, updated_at: new Date() },
        create: { key: SOCIAL_PROOF_KEY, value },
    })
    revalidatePath('/admin/prova-social')
    return { success: true, config }
}
