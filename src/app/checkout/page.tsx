export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma'
import CheckoutForm from './CheckoutForm'
import { Metadata } from 'next'

export async function generateMetadata({
    searchParams
}: {
    searchParams: Promise<{ p?: string }>
}): Promise<Metadata> {
    const params = await searchParams
    const productId = params.p

    let productName = 'Checkout'
    if (productId) {
        const p = await prisma.product.findUnique({
            where: { id: productId },
            select: { name: true }
        })
        if (p) productName = p.name
    }

    const storeSetting = await prisma.customization_settings.findFirst({
        where: { key: 'checkout_store_name' }
    })
    const storeName = storeSetting?.value || 'PagFlow Checkout'

    return {
        title: `${storeName} - ${productName}`,
        description: `Finalize sua compra de ${productName}`
    }
}

export default async function CheckoutPage({
    searchParams
}: {
    searchParams: Promise<{ p?: string }>
}) {
    const params = await searchParams
    const productId = params.p

    let product: any = null

    if (productId) {
        product = await prisma.product.findUnique({
            where: { id: productId }
        })
    }

    // Default product if none found or no ID provided
    if (!product) {
        product = {
            id: '',
            name: 'Produto Padrão',
            price: 0,
            imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1999&auto=format&fit=crop'
        }
    }

    // Fetch customization settings
    const settings = await prisma.customization_settings.findMany({
        where: {
            key: {
                in: [
                    'checkout_logo',
                    'checkout_footer_text',
                    'checkout_primary_color',
                    'checkout_button_color',
                    'checkout_bg_color',
                    'checkout_alert_text',
                    'checkout_alert_bg_color',
                    'checkout_pix_badge_text',
                    'checkout_pix_badge_color',
                    'checkout_pix_badge_bg',
                    'checkout_pix_discount',
                    'checkout_card_discount',
                    'checkout_disable_cpf',
                    'checkout_store_name',
                    'checkout_disable_back',
                    'marketing_taboola_id',
                    'marketing_facebook_id',
                    'marketing_google_id',
                    'checkout_disable_wa'
                ]
            }
        }
    })

    const customization = {
        logo: settings.find((s: any) => s.key === 'checkout_logo')?.value || '',
        footerText: settings.find((s: any) => s.key === 'checkout_footer_text')?.value || '',
        primaryColor: settings.find((s: any) => s.key === 'checkout_primary_color')?.value || '#10b981',
        buttonColor: settings.find((s: any) => s.key === 'checkout_button_color')?.value || '#10b981',
        bgColor: settings.find((s: any) => s.key === 'checkout_bg_color')?.value || '#f0f9ff',
        alertText: settings.find((s: any) => s.key === 'checkout_alert_text')?.value || '',
        alertBg: settings.find((s: any) => s.key === 'checkout_alert_bg_color')?.value || '#e64a19',
        pixBadgeText: settings.find((s: any) => s.key === 'checkout_pix_badge_text')?.value || '',
        pixBadgeColor: settings.find((s: any) => s.key === 'checkout_pix_badge_color')?.value || '#ffffff',
        pixBadgeBg: settings.find((s: any) => s.key === 'checkout_pix_badge_bg')?.value || '#10b981',
        pixDiscount: settings.find((s: any) => s.key === 'checkout_pix_discount')?.value || '0',
        cardDiscount: settings.find((s: any) => s.key === 'checkout_card_discount')?.value || '0',
        disableCpf: settings.find((s: any) => s.key === 'checkout_disable_cpf')?.value === 'true',
        storeName: settings.find((s: any) => s.key === 'checkout_store_name')?.value || 'PagFlow',
        disableBack: settings.find((s: any) => s.key === 'checkout_disable_back')?.value === 'true',
        disableWa: settings.find((s: any) => s.key === 'checkout_disable_wa')?.value === 'true'
    }

    const pixels = {
        taboolaId: settings.find((s: any) => s.key === 'marketing_taboola_id')?.value || '',
        facebookId: settings.find((s: any) => s.key === 'marketing_facebook_id')?.value || '',
        googleId: settings.find((s: any) => s.key === 'marketing_google_id')?.value || ''
    }

    const orderBumps = await prisma.orderBump.findMany({
        where: {
            OR: [
                { productId: null },
                { productId: productId || '' }
            ]
        }
    });

    // Map order bumps to simple objects
    const mappedOrderBumps = orderBumps.map((bump: any) => ({
        id: bump.id,
        name: bump.name,
        description: bump.description,
        price: Number(bump.price),
        imageUrl: bump.imageUrl
    }))

    // Fetch shipping rules
    const shippingRules = await prisma.shipping_rules.findMany({
        where: { is_active: true },
        orderBy: { price: 'asc' }
    })

    // Map shipping rules to numbers because Decimal can't be passed to client components easily
    const mappedShippingRules = shippingRules.map((rule: any) => ({
        ...rule,
        price: Number(rule.price)
    }));

    return <CheckoutForm
        product={product}
        customization={customization}
        shippingRules={mappedShippingRules}
        pixels={pixels}
        availableBumps={mappedOrderBumps}
    />
}
