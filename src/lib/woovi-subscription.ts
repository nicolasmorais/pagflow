const BASE_URL = process.env.WOOVI_BASE_URL || 'https://api.woovi-sandbox.com';

function getAppId(): string {
    const appId = process.env.WOOVI_APP_ID;
    if (!appId) throw new Error('[Woovi] WOOVI_APP_ID não configurado');
    return appId;
}

function calcEndDate(totalParcelas: number): string {
    const date = new Date();
    date.setDate(date.getDate() + (totalParcelas - 1) * 7);
    return date.toISOString();
}

export interface WooviSubscriptionRequest {
    correlationID: string;
    value: number; // em centavos
    comment?: string; // max 30 chars
    totalParcelas: number; // usado para calcular endDate
    customer: {
        name: string;
        email: string;
        taxID: string; // CPF sem máscara
        phone?: string;
        address?: {
            zipcode?: string;
            street?: string;
            number?: string;
            neighborhood?: string;
            city?: string;
            state?: string;
            country?: string;
        };
    };
}

export interface WooviSubscriptionResponse {
    globalID: string;
    correlationID: string;
    value: number;
    status: string;
    emv: string; // QR code EMV para autorização (Jornada 3)
}

export async function createSubscription(payload: WooviSubscriptionRequest): Promise<WooviSubscriptionResponse> {
    const appId = getAppId();
    const body = {
        value: payload.value,
        type: 'PIX_RECURRING',
        frequency: 'WEEKLY',
        dayGenerateCharge: new Date().toISOString(),
        endDate: calcEndDate(payload.totalParcelas),
        dayDue: 3,
        comment: (payload.comment ?? 'PagFlow Parcelado').substring(0, 30),
        correlationID: payload.correlationID,
        customer: payload.customer,
        pixRecurringOptions: {
            journey: 'PAYMENT_ON_APPROVAL',
            retryPolicy: 'NON_PERMITED',
        },
    };
    console.log('[Woovi] createSubscription:', JSON.stringify(body));
    const res = await fetch(`${BASE_URL}/api/v1/subscriptions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': appId },
        body: JSON.stringify(body),
    });
    const text = await res.text();
    console.log(`[Woovi] createSubscription response ${res.status}:`, text);
    if (!res.ok) throw new Error(`[Woovi] Falha ao criar assinatura: ${res.status} ${text}`);
    const json = JSON.parse(text);
    const sub = json.subscription ?? json;
    return {
        globalID: sub.globalID,
        correlationID: sub.correlationID,
        value: sub.value,
        status: sub.status,
        emv: sub.pixRecurring?.emv ?? '',
    };
}

export async function getSubscription(globalID: string): Promise<any> {
    const appId = getAppId();
    const res = await fetch(`${BASE_URL}/api/v1/subscriptions/${encodeURIComponent(globalID)}`, {
        headers: { 'Authorization': appId },
    });
    const text = await res.text();
    console.log(`[Woovi] getSubscription response ${res.status}:`, text);
    if (!res.ok) throw new Error(`[Woovi] Falha ao consultar assinatura: ${res.status} ${text}`);
    const json = JSON.parse(text);
    return json.subscription ?? json;
}

export async function cancelSubscription(globalID: string): Promise<void> {
    const appId = getAppId();
    const res = await fetch(`${BASE_URL}/api/v1/subscriptions/${encodeURIComponent(globalID)}/cancel`, {
        method: 'PUT',
        headers: { 'Authorization': appId },
    });
    const text = await res.text();
    console.log(`[Woovi] cancelSubscription response ${res.status}:`, text);
    if (!res.ok) throw new Error(`[Woovi] Falha ao cancelar assinatura: ${res.status} ${text}`);
}

export async function listInstallments(globalID: string): Promise<any[]> {
    const appId = getAppId();
    const res = await fetch(`${BASE_URL}/api/v1/subscriptions/${encodeURIComponent(globalID)}/installments`, {
        headers: { 'Authorization': appId },
    });
    const text = await res.text();
    console.log(`[Woovi] listInstallments response ${res.status}:`, text);
    if (!res.ok) throw new Error(`[Woovi] Falha ao listar parcelas: ${res.status} ${text}`);
    const json = JSON.parse(text);
    return json.installments ?? json.charges ?? [];
}

export async function refundInstallment(chargeCorrelationID: string, value?: number): Promise<void> {
    const appId = getAppId();
    const body = value ? { value } : {};
    const res = await fetch(`${BASE_URL}/api/v1/charges/${encodeURIComponent(chargeCorrelationID)}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': appId },
        body: JSON.stringify(body),
    });
    const text = await res.text();
    console.log(`[Woovi] refundInstallment response ${res.status}:`, text);
    if (!res.ok) throw new Error(`[Woovi] Falha ao reembolsar parcela: ${res.status} ${text}`);
}

export { calcEndDate };
