export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma'
import { CARD_FEES_KEY, parseCardFees } from '@/lib/card-fees'
import { TESTIMONIALS_KEY, parseTestimonials, publicTestimonials } from '@/lib/testimonials'
import nextDynamic from 'next/dynamic'
import { Metadata } from 'next'
import Script from 'next/script'
import { headers, cookies } from 'next/headers'
import { after } from 'next/server'
import { reportFunnel, cleanClickId, cleanAccount, CLICK_PARAM, CLICK_COOKIE, ACCOUNT_PARAM, ACCOUNT_COOKIE } from '@/lib/funnel-s2s'

// Import dinâmico: só o CSS/JS da versão escolhida é carregado
const CheckoutForm = nextDynamic(() => import('./CheckoutForm'))
const CheckoutV2 = nextDynamic(() => import('./v2/CheckoutV2'))
const CheckoutV3 = nextDynamic(() => import('./v3/CheckoutV3'))

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
            select: { name: true, storeName: true, storeLogo: true }
        }) : Promise.resolve(null),
        prisma.customization_settings.findFirst({
            where: { key: 'checkout_store_name' }
        })
    ]);

    const productName = product?.name || 'Checkout'
    const storeName = (product as any)?.storeName || storeSetting?.value || 'PagFlow'
    const displayTitle = storeName === 'PagFlow' ? 'PagFlow' : `PagFlow ${storeName}`

    return {
        title: `${displayTitle} - ${productName}`,
        description: `Finalize sua compra de ${productName}`
    }
}

export default async function CheckoutPage({
    searchParams
}: {
    searchParams: Promise<{ p?: string; v?: string; [key: string]: string | string[] | undefined }>
}) {
    const params = await searchParams
    const productId = params.p

    // Parallelize all database queries for much faster SSR load time
    const [dbProduct, settings, orderBumps, shippingRules, productPixels] = await Promise.all([
        productId ? prisma.product.findUnique({
            where: { id: productId }
        }) : Promise.resolve(null),

        prisma.customization_settings.findMany({
            where: {
                key: {
                    in: [
                        'checkout_version', 'checkout_logo', 'checkout_footer_text', 'checkout_primary_color',
                        'checkout_button_color', 'checkout_bg_color', 'checkout_alert_text',
                        'checkout_alert_bg_color', 'checkout_alert_color', 'checkout_pix_badge_text', 'checkout_pix_badge_color',
                        'checkout_pix_badge_bg', 'checkout_pix_discount', 'checkout_card_discount',
                        'checkout_disable_cpf', 'checkout_store_name', 'checkout_disable_back',
                        'marketing_taboola_id', 'marketing_facebook_id', 'marketing_google_id',
                        'marketing_ga_id', 'marketing_google_conv_label',
                        'checkout_disable_wa', 'checkout_support_email', 'checkout_support_phone',
                        CARD_FEES_KEY,
                        TESTIMONIALS_KEY
                    ]
                }
            }
        }),

        prisma.orderBump.findMany({
            where: {
                isActive: true,
                OR: [
                    { productId: null },
                    { productId: productId || '' }
                ]
            }
        }),

        prisma.shipping_rules.findMany({
            where: { is_active: true },
            orderBy: { price: 'asc' }
        }),

        // Carregar pixels específicos do produto (via productId que referencia Product)
        productId ? prisma.product_pixels.findMany({
            where: { productId: productId },
            include: { marketing_pixels: true }
        }) : Promise.resolve([])
    ]);

    // Link aponta para um produto que não existe mais (excluído/id inválido): não renderizar
    // um checkout falso que sempre falha no pagamento — avisa o cliente e para por aqui.
    if (productId && !dbProduct) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', textAlign: 'center', fontFamily: 'sans-serif' }}>
                <div>
                    <h1 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>Este link de pagamento não está mais disponível</h1>
                    <p style={{ color: '#6E7180', fontSize: '14px' }}>O produto associado a este link foi removido ou o endereço está incorreto. Entre em contato com quem enviou o link para obter um novo.</p>
                </div>
            </div>
        )
    }

    // Funil server-side da Taboola: chegou no checkout com click_id (da URL ou do cookie do domínio)
    // → start_checkout, enviado depois da resposta para não atrasar a página.
    if (dbProduct) {
        try {
            const sp = params as Record<string, string | string[] | undefined>
            const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? null
            const [h, c] = await Promise.all([headers(), cookies()])
            const prefetch = h.get('next-router-prefetch') || h.get('purpose') === 'prefetch' || h.get('sec-purpose')?.includes('prefetch')
            const clickId = cleanClickId(one(sp[CLICK_PARAM])) || cleanClickId(c.get(CLICK_COOKIE)?.value)
            if (clickId && !prefetch) {
                const account = cleanAccount(one(sp[ACCOUNT_PARAM])) || cleanAccount(c.get(ACCOUNT_COOKIE)?.value)
                const userAgent = h.get('user-agent') || ''
                const ip = (h.get('cf-connecting-ip') || h.get('x-forwarded-for') || h.get('x-real-ip') || '').split(',')[0].trim()
                const eventName = (dbProduct as any).startCheckoutEventName || 'start_checkout'
                after(() => reportFunnel({
                    step: 'start_checkout', eventName, clickId, account, productId: dbProduct.id, userAgent, ip,
                    utmCampaign: one(sp.utm_campaign), utmTerm: one(sp.utm_term), utmContent: one(sp.utm_content),
                }).then(r => { if (!r.ok && r.error !== 'não configurado') console.warn('[s2s] start_checkout:', r.error) }))
            }
        } catch (e) {
            console.error('[s2s] start_checkout:', (e as Error)?.message || e)
        }
    }

    let product = dbProduct;

    // Default product if no ID provided at all
    if (!product) {
        product = {
            id: '',
            name: 'Produto Padrão',
            price: 0,
            imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1999&auto=format&fit=crop'
        } as any
    }

    // Product's storeLogo/storeName override global customization
    const globalLogo = settings.find((s: any) => s.key === 'checkout_logo')?.value || '';
    const globalStoreName = settings.find((s: any) => s.key === 'checkout_store_name')?.value || 'PagFlow';

    const customization = {
        logo: (product as any)?.storeLogo || globalLogo,
        footerText: settings.find((s: any) => s.key === 'checkout_footer_text')?.value || '',
        primaryColor: settings.find((s: any) => s.key === 'checkout_primary_color')?.value || '#10b981',
        buttonColor: settings.find((s: any) => s.key === 'checkout_button_color')?.value || '#10b981',
        bgColor: settings.find((s: any) => s.key === 'checkout_bg_color')?.value || '#f0f9ff',
        alertText: settings.find((s: any) => s.key === 'checkout_alert_text')?.value || '',
        alertBg: settings.find((s: any) => s.key === 'checkout_alert_bg_color')?.value || '#e64a19',
        alertColor: settings.find((s: any) => s.key === 'checkout_alert_color')?.value || '#111111',
        pixBadgeText: settings.find((s: any) => s.key === 'checkout_pix_badge_text')?.value || '',
        pixBadgeColor: settings.find((s: any) => s.key === 'checkout_pix_badge_color')?.value || '#ffffff',
        pixBadgeBg: settings.find((s: any) => s.key === 'checkout_pix_badge_bg')?.value || '#10b981',
        pixDiscount: settings.find((s: any) => s.key === 'checkout_pix_discount')?.value || '0',
        cardDiscount: settings.find((s: any) => s.key === 'checkout_card_discount')?.value || '0',
        disableCpf: settings.find((s: any) => s.key === 'checkout_disable_cpf')?.value === 'true',
        storeName: (product as any)?.storeName || globalStoreName,
        disableBack: settings.find((s: any) => s.key === 'checkout_disable_back')?.value === 'true',
        disableWa: settings.find((s: any) => s.key === 'checkout_disable_wa')?.value === 'true',
        supportEmail: settings.find((s: any) => s.key === 'checkout_support_email')?.value || '',
        supportPhone: settings.find((s: any) => s.key === 'checkout_support_phone')?.value || '',
        cardFees: parseCardFees(settings.find((s: any) => s.key === CARD_FEES_KEY)?.value)
    }

    const testimonials = publicTestimonials(parseTestimonials(settings.find((s: any) => s.key === TESTIMONIALS_KEY)?.value))

    // Pixels globais (fallback)
    const globalPixels = {
        taboolaId: settings.find((s: any) => s.key === 'marketing_taboola_id')?.value || '',
        facebookId: settings.find((s: any) => s.key === 'marketing_facebook_id')?.value || '',
        googleId: settings.find((s: any) => s.key === 'marketing_google_id')?.value || '',
        googleAnalyticsId: settings.find((s: any) => s.key === 'marketing_ga_id')?.value || '',
        googleAdsConvLabel: settings.find((s: any) => s.key === 'marketing_google_conv_label')?.value || ''
    }

    // Pixels por produto (específicos)
    const perProductPixels = (productPixels as any[]).map((pp: any) => ({
        type: pp.marketing_pixels.type,
        pixelId: pp.marketing_pixels.pixel_id,
        name: pp.marketing_pixels.name
    }))

    // Merge: produto-specific pixels + global pixels as fallback
    const pixels = {
        ...globalPixels,
        perProduct: perProductPixels
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


    // Versão do checkout: escolhida no admin; ?v=1 / ?v=2 / ?v=3 força uma versão só nesta visita
    const VERSIONS = { v1: CheckoutForm, v2: CheckoutV2, v3: CheckoutV3 } as const
    type Version = keyof typeof VERSIONS
    const isVersion = (v: unknown): v is Version => typeof v === 'string' && v in VERSIONS
    const savedValue = settings.find((s: any) => s.key === 'checkout_version')?.value
    const forcedValue = params.v ? `v${params.v}` : undefined
    const version: Version = isVersion(forcedValue) ? forcedValue : isVersion(savedValue) ? savedValue : 'v1'
    const Checkout = VERSIONS[version]

    return (
        <>
            <Script
                src="https://t.contentsquare.net/uxa/da4f1c872e126.js"
                strategy="afterInteractive"
            />
            <Checkout
                product={product}
                customization={customization}
                shippingRules={mappedShippingRules}
                pixels={pixels}
                availableBumps={mappedOrderBumps}
                testimonials={testimonials}
            />
        </>
    )
}
