const BASE_URL = 'https://api.openpix.com.br';

function getAppId(): string {
    const appId = process.env.WOOVI_APP_ID;
    if (!appId) throw new Error('[Woovi] WOOVI_APP_ID não configurado');
    return appId;
}

export interface WooviSubscriptionRequest {
    correlationID: string;
    name: string;
    value: number; // em centavos
    customer: {
        name: string;
        email: string;
        taxID: string; // CPF sem máscara
        phone?: string;
    };
    comment?: string;
    frequency?: 'WEEKLY' | 'MONTHLY';
    type?: 'PIX_RECURRING';
    installmentCount?: number; // quantas cobranças (0 = indefinido)
    dayGenerateCharge?: number;
    dayDue?: number;
    pixRecurringOptions?: {
        journey?: 'ONLY_RECURRENCY' | 'PAYMENT_ON_APPROVAL';
        retryPolicy?: 'PERMITED' | 'NON_PERMITED';
    };
}

export interface WooviSubscriptionResponse {
    globalID: string;
    correlationID: string;
    value: number;
    status: string;
    emv: string; // QR code EMV para autorização
}

export async function createSubscription(payload: WooviSubscriptionRequest): Promise<WooviSubscriptionResponse> {
    const appId = getAppId();
    const body = {
        ...payload,
        frequency: payload.frequency ?? 'WEEKLY',
        type: payload.type ?? 'PIX_RECURRING',
        dayGenerateCharge: payload.dayGenerateCharge ?? 3,
        dayDue: payload.dayDue ?? 5,
        pixRecurringOptions: payload.pixRecurringOptions ?? {
            journey: 'ONLY_RECURRENCY',
            retryPolicy: 'PERMITED',
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
