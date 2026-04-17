import { prisma } from './prisma';

export type WebhookType = 'SALE_CONFIRMED' | 'CART_ABANDONED';

export async function sendWebhook(type: WebhookType, data: any) {
    try {
        // Fetch webhook URL from settings
        const setting = await prisma.customization_settings.findUnique({
            where: { key: 'webhook_url' }
        });

        if (!setting || !setting.value) {
            console.log('Webhook URL not configured. Skipping...');
            return;
        }

        const payload = {
            event: type,
            timestamp: new Date().toISOString(),
            data: {
                id: data.id,
                customer: {
                    name: data.fullName || data.customer_name,
                    email: data.email || data.customer_email,
                    phone: data.phone,
                    cpf: data.cpf,
                },
                address: {
                    cep: data.cep || data.customer_cep,
                    rua: data.rua || data.customer_address,
                    numero: data.numero || data.customer_number,
                    bairro: data.bairro || data.customer_neighborhood,
                    cidade: data.cidade || data.customer_city,
                    estado: data.estado || data.customer_state,
                },
                payment: {
                    method: data.paymentMethod || data.payment_method,
                    status: data.paymentStatus || data.status,
                    total: data.totalPrice || (data.amount ? Number(data.amount) : 0),
                    installments: data.installments,
                },
                product: data.product || {
                    id: data.productId || data.product_id,
                    name: data.product?.name || 'Produto Principal'
                },
                utm: {
                    source: data.utmSource || data.utm_source,
                    medium: data.utmMedium || data.utm_medium,
                    campaign: data.utmCampaign || data.utm_campaign,
                    term: data.utmTerm || data.utm_term,
                    content: data.utmContent || data.utm_content,
                }
            }
        };

        console.log(`Sending Webhook [${type}] to ${setting.value}`);

        const response = await fetch(setting.value, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-PagFlow-Event': type,
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            console.error(`Webhook error: ${response.status} ${response.statusText}`);
        } else {
            console.log(`Webhook sent successfully [${type}]`);
        }
    } catch (error) {
        console.error('Error sending webhook:', error);
    }
}
