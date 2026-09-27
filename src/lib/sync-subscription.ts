import { getSyncToken } from './sync';

const BASE_URL = 'https://api.syncpayments.com.br/api/partner/v1';

export interface SubscriptionPlanPayload {
    name: string;
    description?: string;
    amount: string; // decimal string ex: "97.00"
    periodicity_days: number;
    billing_method: 'pix_automatico' | 'qr_code' | 'credit_card';
    billing_advance_days?: number;
    grace_period_days?: number;
    max_retry_attempts?: number;
}

export interface SubscriptionPlanResponse {
    token: string;
    checkout_url: string;
    name: string;
    amount: string;
}

export async function createSubscriptionPlan(payload: SubscriptionPlanPayload): Promise<SubscriptionPlanResponse> {
    const token = await getSyncToken();
    const res = await fetch(`${BASE_URL}/subscription-plans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload),
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`[Sync] Falha ao criar plano: ${res.status} ${text}`);
    const json = JSON.parse(text);
    // Sync envolve a resposta em { data: { ... } }
    return json.data ?? json;
}

export interface EnrollPayload {
    name: string;
    email: string;
    document: string; // CPF sem máscara
    phone: string;
}

export interface EnrollResponse {
    mandate_id: string;
    qr_code: string;
    mandate_status: string;
}

export async function enrollSubscription(planToken: string, payload: EnrollPayload): Promise<EnrollResponse> {
    const token = await getSyncToken();
    const res = await fetch(`${BASE_URL}/subscription-plans/${planToken}/enroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload),
    });
    const text = await res.text();
    console.log(`[Sync Subscription] Enroll response ${res.status}:`, text);
    if (!res.ok) throw new Error(`[Sync] Falha ao enrolar assinante: ${res.status} ${text}`);
    const json = JSON.parse(text);
    // Sync envolve a resposta em { data: { ... } }
    return json.data ?? json;
}

export async function getSubscriptionDetails(subscriptionToken: string): Promise<any> {
    const token = await getSyncToken();
    const res = await fetch(`${BASE_URL}/subscriptions/${subscriptionToken}`, {
        headers: { 'Authorization': `Bearer ${token}` },
    });
    const text = await res.text();
    console.log(`[Sync Subscription] Details response ${res.status}:`, text);
    if (!res.ok) throw new Error(`[Sync] Falha ao buscar assinatura: ${res.status} ${text}`);
    const json = JSON.parse(text);
    return json.data ?? json;
}

export async function cancelSubscription(subscriptionToken: string): Promise<void> {
    const token = await getSyncToken();
    const res = await fetch(`${BASE_URL}/subscriptions/${subscriptionToken}/cancel`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    });
    const text = await res.text();
    console.log(`[Sync Subscription] Cancel response ${res.status}:`, text);
    if (!res.ok) throw new Error(`[Sync] Falha ao cancelar assinatura: ${res.status} ${text}`);
}

export async function suspendSubscription(subscriptionToken: string): Promise<void> {
    const token = await getSyncToken();
    const res = await fetch(`${BASE_URL}/subscriptions/${subscriptionToken}/suspend`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    });
    const text = await res.text();
    console.log(`[Sync Subscription] Suspend response ${res.status}:`, text);
    if (!res.ok) throw new Error(`[Sync] Falha ao suspender assinatura: ${res.status} ${text}`);
}

export async function resumeSubscription(subscriptionToken: string): Promise<void> {
    const token = await getSyncToken();
    const res = await fetch(`${BASE_URL}/subscriptions/${subscriptionToken}/resume`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    });
    const text = await res.text();
    console.log(`[Sync Subscription] Resume response ${res.status}:`, text);
    if (!res.ok) throw new Error(`[Sync] Falha ao reativar assinatura: ${res.status} ${text}`);
}
