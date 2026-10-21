'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { EXIT_COUPON_PCT_KEY, EXIT_COUPON_MIN_PCT, EXIT_COUPON_MAX_PCT, isValidExitCouponPct } from '@/lib/exit-coupon'

async function requireAdmin() {
    const cookieStore = await cookies()
    if (cookieStore.get('admin_auth')?.value !== 'authenticated') {
        throw new Error('Não autorizado')
    }
}

export async function saveExitCouponPct(pct: number): Promise<{ success: boolean; error?: string }> {
    await requireAdmin()
    if (!isValidExitCouponPct(pct)) {
        return { success: false, error: `Use um número inteiro entre ${EXIT_COUPON_MIN_PCT} e ${EXIT_COUPON_MAX_PCT}.` }
    }
    await prisma.customization_settings.upsert({
        where: { key: EXIT_COUPON_PCT_KEY },
        update: { value: String(pct), updated_at: new Date() },
        create: { key: EXIT_COUPON_PCT_KEY, value: String(pct) },
    })
    revalidatePath('/admin/cupom-saida')
    return { success: true }
}
