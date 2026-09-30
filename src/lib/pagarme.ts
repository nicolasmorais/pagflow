const PAGARME_BASE_URL = 'https://api.pagar.me/core/v5';

function getAuthHeader(): string {
    const key = process.env.PAGARME_SECRET_KEY || '';
    if (!key) console.error('[Pagar.me] ⚠️  PAGARME_SECRET_KEY não definido!');
    return 'Basic ' + Buffer.from(`${key}:`).toString('base64');
}

export interface PagarmeAddress {
    line_1: string;
    line_2?: string;
    zip_code: string;
    city: string;
    state: string;
    country?: string;
}

export interface PagarmeCardOrderParams {
    orderId: string;
    amount: number; // em centavos
    installments: number;
    cardToken: string;
    description: string;
    statementDescriptor?: string;
    customer: {
        name: string;
        email: string;
        document: string;
        phone?: string;
        birthdate?: string; // formato YYYY-MM-DD
        address?: PagarmeAddress;
    };
    shipping?: {
        name: string;
        phone?: string;
        address: PagarmeAddress;
    };
}

export interface PagarmeOrderResult {
    id: string;
    status: 'paid' | 'pending' | 'failed' | 'canceled' | string;
    charges: Array<{
        id: string;
        status: string;
        last_transaction?: {
            id: string;
            status: string;
            amount: number;
            installments: number;
            acquirer_return_code?: string;
            acquirer_message?: string;
        };
    }>;
}

const PAGARME_STATUS_MAP: Record<string, string> = {
    paid: 'pago',
    pending: 'aguardando',
    failed: 'recusado',
    canceled: 'recusado',
};

export function mapPagarmeStatus(status: string): string {
    return PAGARME_STATUS_MAP[status] || 'recusado';
}

export interface PagarmePixOrderParams {
    orderId: string;
    amount: number; // em centavos
    description: string;
    customer: {
        name: string;
        email: string;
        document?: string; // CPF apenas dígitos
        phone?: string;
    };
    expiresIn?: number; // segundos, padrão 3600
}

export interface PagarmePixOrderResult {
    id: string;
    status: string;
    qrCode: string;       // string EMV/PIX para copiar e colar
    qrCodeUrl?: string;   // URL da imagem do QR code
}

export async function createPixOrder(params: PagarmePixOrderParams): Promise<PagarmePixOrderResult> {
    const { orderId, amount, description, customer, expiresIn = 3600 } = params;

    const cleanPhone = (customer.phone || '').replace(/\D/g, '');
    const phones = cleanPhone.length >= 10 ? {
        mobile_phone: {
            country_code: '55',
            area_code: cleanPhone.slice(0, 2),
            number: cleanPhone.slice(2),
        }
    } : undefined;

    const customerObj: any = {
        name: customer.name,
        email: customer.email,
        type: 'individual',
        phones,
    };
    if (customer.document) {
        customerObj.document = customer.document;
        customerObj.document_type = 'CPF';
    }

    const body = {
        code: orderId,
        items: [{
            amount,
            description: description || 'Produto',
            quantity: 1,
            code: 'item-001',
        }],
        customer: customerObj,
        payments: [{
            payment_method: 'pix',
            pix: {
                expires_in: expiresIn,
            },
        }],
    };

    const res = await fetch(`${PAGARME_BASE_URL}/orders`, {
        method: 'POST',
        headers: {
            Authorization: getAuthHeader(),
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
        const msg = data?.message || data?.errors?.[0]?.message || `Pagar.me PIX error ${res.status}`;
        throw new Error(msg);
    }

    const lastTxn = data?.charges?.[0]?.last_transaction;
    const qrCode: string = lastTxn?.qr_code || '';
    const qrCodeUrl: string | undefined = lastTxn?.qr_code_url;

    return {
        id: data.id,
        status: data.status,
        qrCode,
        qrCodeUrl,
    };
}

export function buildCardOrderBody(params: PagarmeCardOrderParams): any {
    const { orderId, amount, installments, cardToken, description, statementDescriptor, customer, shipping } = params;
    const { birthdate } = customer;

    const cleanPhone = (customer.phone || '').replace(/\D/g, '');
    const phones = cleanPhone.length >= 10 ? {
        mobile_phone: {
            country_code: '55',
            area_code: cleanPhone.slice(0, 2),
            number: cleanPhone.slice(2),
        }
    } : undefined;

    const buildAddress = (addr: PagarmeAddress) => ({
        line_1: addr.line_1,
        ...(addr.line_2 ? { line_2: addr.line_2 } : {}),
        zip_code: addr.zip_code.replace(/\D/g, ''),
        city: addr.city,
        state: addr.state,
        country: addr.country || 'BR',
    });

    const body: any = {
        code: orderId,
        antifraud_enabled: false,
        items: [{
            amount,
            description: description || 'Produto',
            quantity: 1,
            code: 'item-001',
        }],
        customer: {
            name: customer.name,
            email: customer.email,
            type: 'individual',
            document: customer.document,
            document_type: 'CPF',
            phones,
            ...(birthdate ? { birthdate } : {}),
            ...(customer.address ? { address: buildAddress(customer.address) } : {}),
        },
        payments: [{
            payment_method: 'credit_card',
            credit_card: {
                operation_type: 'auth_and_capture',
                installments,
                statement_descriptor: (statementDescriptor || 'PAGFLOW').substring(0, 13).toUpperCase(),
                card_token: cardToken,
            },
        }],
    };

    if (shipping) {
        body.shipping = {
            amount: 0,
            description: 'Entrega',
            recipient_name: shipping.name,
            ...(shipping.phone ? { recipient_phone: shipping.phone } : {}),
            address: buildAddress(shipping.address),
        };
    }

    return body;
}

export async function createCardOrder(params: PagarmeCardOrderParams): Promise<PagarmeOrderResult> {
    const body = buildCardOrderBody(params);

    const res = await fetch(`${PAGARME_BASE_URL}/orders`, {
        method: 'POST',
        headers: {
            Authorization: getAuthHeader(),
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
        const msg = data?.message || data?.errors?.[0]?.message || `Pagar.me error ${res.status}`;
        throw new Error(msg);
    }

    return data as PagarmeOrderResult;
}
