import { prisma } from '@/lib/prisma'
import CheckoutForm from './CheckoutForm'

export default async function CheckoutPage({
    searchParams
}: {
    searchParams: Promise<{ p?: string }>
}) {
    const params = await searchParams
    const productId = params.p

    let product = null

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
    const settings = await (prisma as any).customization_settings.findMany({
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
                    'marketing_taboola_id',
                    'marketing_facebook_id',
                    'marketing_google_id'
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
        pixBadgeBg: settings.find((s: any) => s.key === 'checkout_pix_badge_bg')?.value || '#10b981'
    }

    const pixels = {
        taboolaId: settings.find((s: any) => s.key === 'marketing_taboola_id')?.value || '',
        facebookId: settings.find((s: any) => s.key === 'marketing_facebook_id')?.value || '',
        googleId: settings.find((s: any) => s.key === 'marketing_google_id')?.value || ''
    }

    // Fetch order bumps
    const p = prisma as any;
    const orderBumps = (p.orderBump || p.OrderBump) ? await (p.orderBump || p.OrderBump).findMany({
        where: {
            OR: [
                { productId: null },
                { productId: productId || '' }
            ]
        }
    }) : [];

    // Map order bumps to simple objects
    const mappedOrderBumps = orderBumps.map((bump: any) => ({
        id: bump.id,
        name: bump.name,
        description: bump.description,
        price: Number(bump.price),
        imageUrl: bump.imageUrl
    }))

    // Fetch shipping rules
    const shippingRules = await (prisma as any).shipping_rules.findMany({
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
