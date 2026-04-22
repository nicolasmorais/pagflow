export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma'
import CheckoutForm from './CheckoutForm'
import { Metadata } from 'next'
import Script from 'next/script'

export async function generateMetadata({
    searchParams
}: {
    searchParams: Promise<{ p?: string }>
}): Promise<Metadata> {
    const params = await searchParams
    const productId = params.p

    const [product, storeSetting] = await Promise.all([
        productId ? prisma.product.findUnique({
            where: { id: productId },
            select: { name: true }
        }) : Promise.resolve(null),
        prisma.customization_settings.findFirst({
            where: { key: 'checkout_store_name' }
        })
    ]);

    const productName = product?.name || 'Checkout'
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

    // Parallelize all database queries for much faster SSR load time
    const [dbProduct, settings, orderBumps, shippingRules] = await Promise.all([
        productId ? prisma.product.findUnique({
            where: { id: productId }
        }) : Promise.resolve(null),

        prisma.customization_settings.findMany({
            where: {
                key: {
                    in: [
                        'checkout_logo', 'checkout_footer_text', 'checkout_primary_color',
                        'checkout_button_color', 'checkout_bg_color', 'checkout_alert_text',
                        'checkout_alert_bg_color', 'checkout_pix_badge_text', 'checkout_pix_badge_color',
                        'checkout_pix_badge_bg', 'checkout_pix_discount', 'checkout_card_discount',
                        'checkout_disable_cpf', 'checkout_store_name', 'checkout_disable_back',
                        'marketing_taboola_id', 'marketing_facebook_id', 'marketing_google_id',
                        'checkout_disable_wa', 'checkout_support_email', 'checkout_support_phone'
                    ]
                }
            }
        }),

        prisma.orderBump.findMany({
            where: {
                OR: [
                    { productId: null },
                    { productId: productId || '' }
                ]
            }
        }),

        prisma.shipping_rules.findMany({
            where: { is_active: true },
            orderBy: { price: 'asc' }
        })
    ]);

    let product = dbProduct;

    // Default product if none found or no ID provided
    if (!product) {
        product = {
            id: '',
            name: 'Produto Padrão',
            price: 0,
            imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1999&auto=format&fit=crop'
        } as any
    }

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
        disableWa: settings.find((s: any) => s.key === 'checkout_disable_wa')?.value === 'true',
        supportEmail: settings.find((s: any) => s.key === 'checkout_support_email')?.value || '',
        supportPhone: settings.find((s: any) => s.key === 'checkout_support_phone')?.value || ''
    }

    const pixels = {
        taboolaId: settings.find((s: any) => s.key === 'marketing_taboola_id')?.value || '',
        facebookId: settings.find((s: any) => s.key === 'marketing_facebook_id')?.value || '',
        googleId: settings.find((s: any) => s.key === 'marketing_google_id')?.value || ''
    }

    // Map order bumps to simple objects
    const mappedOrderBumps = orderBumps.map((bump: any) => ({
        id: bump.id,
        name: bump.name,
        description: bump.description,
        price: Number(bump.price),
        imageUrl: bump.imageUrl
    }))

    // Map shipping rules to numbers because Decimal can't be passed to client components easily
    const mappedShippingRules = shippingRules.map((rule: any) => ({
        ...rule,
        price: Number(rule.price)
    }));

    // Fetch exit popup config (needs separate try/catch since model might not exist or be generated differently)
    let exitPopupConfig: any = null
    try {
        const p: any = prisma;
        if (p.exitPopupConfig) {
            exitPopupConfig = await p.exitPopupConfig.findFirst()
        }

        if (!exitPopupConfig) {
            exitPopupConfig = { isEnabled: false, discountPct: 50, timerSeconds: 480, installments: 3 }
        }
    } catch (e) {
        exitPopupConfig = { isEnabled: false }
    }

    return (
        <>
            <Script
                src="https://t.contentsquare.net/uxa/da4f1c872e126.js"
                strategy="afterInteractive"
            />
            <CheckoutForm
                product={product}
                customization={customization}
                shippingRules={mappedShippingRules}
                pixels={pixels}
                availableBumps={mappedOrderBumps}
                exitPopupConfig={exitPopupConfig}
            />
        </>
    )
}
