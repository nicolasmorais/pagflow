const BASE_URL = 'https://api.syncpayments.com.br/api/partner/v1';

let cachedToken: string | null = null;
let tokenExpiresAt: number = 0;

export async function getSyncToken(): Promise<string> {
    if (cachedToken && Date.now() < tokenExpiresAt - 60_000) {
        return cachedToken;
    }

    const clientId = process.env.SYNC_CLIENT_ID;
    const clientSecret = process.env.SYNC_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        throw new Error('[Sync] SYNC_CLIENT_ID ou SYNC_CLIENT_SECRET não configurados');
    }

    const res = await fetch(`${BASE_URL}/auth-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: clientId, client_secret: clientSecret }),
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`[Sync] Falha ao obter token: ${res.status} ${text}`);
    }

    const data = await res.json();
    cachedToken = data.access_token;
    tokenExpiresAt = Date.now() + (data.expires_in || 3600) * 1000;

    return cachedToken!;
}

export interface SyncCashInRequest {
    amount: number;
    description?: string;
    webhook_url: string;
    client?: {
        name: string;
        cpf: string;
        email: string;
        phone: string;
    };
}

export interface SyncCashInResponse {
    message: string;
    pix_code: string;
    identifier: string;
}

export async function syncCashIn(payload: SyncCashInRequest): Promise<SyncCashInResponse> {
    const token = await getSyncToken();

    const res = await fetch(`${BASE_URL}/cash-in`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`[Sync] Falha no cash-in: ${res.status} ${text}`);
    }

    return res.json();
}

export interface SyncTransactionData {
    reference_id: string;
    currency: string;
    amount: number;
    transaction_date: string;
    status: 'pending' | 'completed' | 'failed' | 'refunded' | 'med';
    description: string | null;
    pix_code: string | null;
}

export async function getSyncTransaction(identifier: string): Promise<SyncTransactionData> {
    const token = await getSyncToken();

    const res = await fetch(`${BASE_URL}/transaction/${identifier}`, {
        headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`[Sync] Falha ao consultar transação: ${res.status} ${text}`);
    }

    const data = await res.json();
    return data.data;
}

export const SYNC_STATUS_MAP: Record<string, string> = {
    completed: 'pago',
    pending: 'aguardando',
    failed: 'recusado',
    refunded: 'recusado',
    med: 'recusado',
};
