const BASE_URL = process.env.WOOVI_BASE_URL || 'https://api.woovi.com';

function getAppId(): string {
    const appId = process.env.WOOVI_APP_ID;
    if (!appId) throw new Error('[Woovi] WOOVI_APP_ID não configurado');
    return appId;
}

export interface WooviChargeRequest {
    correlationID: string;
    value: number; // em centavos
    comment?: string;
    customer?: {
        name: string;
        taxID: string;
        email: string;
        phone?: string;
    };
}

export interface WooviChargeResponse {
    correlationID: string;
    transactionID?: string;
    brCode: string;
    status: string;
    paymentLinkUrl?: string;
}

export async function createCharge(payload: WooviChargeRequest): Promise<WooviChargeResponse> {
    const appId = getAppId();
    console.log('[Woovi] createCharge:', JSON.stringify(payload));
    const res = await fetch(`${BASE_URL}/api/v1/charge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': appId },
        body: JSON.stringify(payload),
    });
    const text = await res.text();
    console.log(`[Woovi] createCharge response ${res.status}:`, text);
    if (!res.ok) throw new Error(`[Woovi] Falha ao criar cobrança: ${res.status} ${text}`);
    const json = JSON.parse(text);
    const charge = json.charge ?? json;
    return {
        correlationID: charge.correlationID,
        transactionID: charge.transactionID,
        brCode: charge.brCode,
        status: charge.status,
        paymentLinkUrl: charge.paymentLinkUrl,
    };
}

export async function getCharge(correlationID: string): Promise<WooviChargeResponse> {
    const appId = getAppId();
    const res = await fetch(`${BASE_URL}/api/v1/charge/${correlationID}`, {
        headers: { 'Authorization': appId },
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`[Woovi] Falha ao consultar cobrança: ${res.status} ${text}`);
    const json = JSON.parse(text);
    const charge = json.charge ?? json;
    return {
        correlationID: charge.correlationID,
        transactionID: charge.transactionID,
        brCode: charge.brCode,
        status: charge.status,
    };
}

export const WOOVI_STATUS_MAP: Record<string, string> = {
    COMPLETED: 'pago',
    ACTIVE: 'aguardando',
    EXPIRED: 'recusado',
    CANCELED: 'recusado',
};
