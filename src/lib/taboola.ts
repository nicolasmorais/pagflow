const TABOOLA_ACCOUNTS = [
    {
        id: process.env.TABOOLA_ACCOUNT_1_ID || 'taboolaaccount-contaton1kaogmailcom',
        clientId: process.env.TABOOLA_ACCOUNT_1_CLIENT_ID || '3097ff12f8854fd1ad7f1f3d11dbee7f',
        clientSecret: process.env.TABOOLA_ACCOUNT_1_CLIENT_SECRET || '2709b35fea21418c8e5e6a49fd9600cd',
        label: 'Conta 1',
    },
    {
        id: process.env.TABOOLA_ACCOUNT_2_ID || 'taboolaaccount-contaadm1354gmailcom',
        clientId: process.env.TABOOLA_ACCOUNT_2_CLIENT_ID || '607c8ec255b54f61abe812a98961aa01',
        clientSecret: process.env.TABOOLA_ACCOUNT_2_CLIENT_SECRET || 'd3c5944760694eefb3f0f88cc8754432',
        label: 'Conta 2',
    },
    {
        id: process.env.TABOOLA_ACCOUNT_3_ID || 'taboolaaccount-admcasocastoregmailcom',
        clientId: process.env.TABOOLA_ACCOUNT_3_CLIENT_ID || '101768521273467f9b5b87c1a86c01f2',
        clientSecret: process.env.TABOOLA_ACCOUNT_3_CLIENT_SECRET || '43ae9bcc72054b3bb45843a20083b60b',
        label: 'Conta 3',
    },
]

export interface TaboolaAccountSummary {
    accountId: string
    label: string
    totalSpent: number
    totalImpressions: number
    totalClicks: number
    totalConversions: number
    cpc: number
    ctr: number
    cpa: number
    byDate: Map<string, number>
    error?: string
}

export interface TaboolaAggregated {
    totalSpent: number
    byDate: Map<string, number>
    accounts: TaboolaAccountSummary[]
}

/* ── Token cache per account ── */
const tokenCache = new Map<string, { token: string; expiresAt: number }>()

async function getToken(account: typeof TABOOLA_ACCOUNTS[number]): Promise<string | null> {
    const cached = tokenCache.get(account.id)
    if (cached && cached.expiresAt > Date.now()) return cached.token

    try {
        const res = await fetch('https://backstage.taboola.com/backstage/oauth/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: account.clientId,
                client_secret: account.clientSecret,
                grant_type: 'client_credentials',
            }),
            cache: 'no-store',
        })
        if (!res.ok) return null
        const data = await res.json()
        tokenCache.set(account.id, {
            token: data.access_token,
            expiresAt: Date.now() + (data.expires_in - 60) * 1000,
        })
        return data.access_token
    } catch {
        return null
    }
}

/* ── Fetch report for a single account ── */
async function fetchAccountReport(
    account: typeof TABOOLA_ACCOUNTS[number],
    startDate: string,
    endDate: string
): Promise<TaboolaAccountSummary> {
    const base: TaboolaAccountSummary = {
        accountId: account.id,
        label: account.label,
        totalSpent: 0, totalImpressions: 0, totalClicks: 0,
        totalConversions: 0, cpc: 0, ctr: 0, cpa: 0,
        byDate: new Map(),
    }

    const token = await getToken(account)
    if (!token) return { ...base, error: 'Auth failed' }

    try {
        const url = `https://backstage.taboola.com/backstage/api/1.0/${account.id}/reports/campaign-summary/dimensions/day?start_date=${startDate}&end_date=${endDate}`
        const res = await fetch(url, {
            headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
            cache: 'no-store',
        })
        if (!res.ok) return { ...base, error: `API ${res.status}` }

        const data = await res.json()
        const results = data.results || []

        for (const r of results) {
            const spent = r.spent || 0
            const impressions = r.impressions || 0
            const clicks = r.clicks || 0
            const conversions = r.cpa_actions_num || 0

            base.totalSpent += spent
            base.totalImpressions += impressions
            base.totalClicks += clicks
            base.totalConversions += conversions

            const dateKey = (r.date || '').split(' ')[0]
            if (dateKey) base.byDate.set(dateKey, (base.byDate.get(dateKey) || 0) + spent)
        }

        base.cpc = base.totalClicks > 0 ? base.totalSpent / base.totalClicks : 0
        base.ctr = base.totalImpressions > 0 ? (base.totalClicks / base.totalImpressions) * 100 : 0
        base.cpa = base.totalConversions > 0 ? base.totalSpent / base.totalConversions : 0

        return base
    } catch {
        return { ...base, error: 'Fetch failed' }
    }
}

/* ── Public: fetch all accounts in parallel ── */
export async function fetchAllTaboolaAccounts(
    startDate: string,
    endDate: string
): Promise<TaboolaAggregated> {
    const results = await Promise.all(
        TABOOLA_ACCOUNTS.map(acc => fetchAccountReport(acc, startDate, endDate))
    )

    const byDate = new Map<string, number>()
    let totalSpent = 0

    for (const r of results) {
        totalSpent += r.totalSpent
        for (const [date, spent] of r.byDate.entries()) {
            byDate.set(date, (byDate.get(date) || 0) + spent)
        }
    }

    return { totalSpent, byDate, accounts: results }
}

/* ── Public: fetch single account (for API route) ── */
export async function fetchTaboolaAccount(
    accountId: string,
    startDate: string,
    endDate: string
): Promise<TaboolaAccountSummary | null> {
    const account = TABOOLA_ACCOUNTS.find(a => a.id === accountId)
    if (!account) return null
    return fetchAccountReport(account, startDate, endDate)
}

/* ── Public: get campaigns for a single account ── */
export async function fetchAccountCampaigns(
    accountId: string,
    startDate: string,
    endDate: string
): Promise<any[]> {
    const account = TABOOLA_ACCOUNTS.find(a => a.id === accountId)
    if (!account) return []

    const token = await getToken(account)
    if (!token) return []

    try {
        const url = `https://backstage.taboola.com/backstage/api/1.0/${accountId}/reports/top-campaign-content?start_date=${startDate}&end_date=${endDate}`
        const res = await fetch(url, {
            headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
            cache: 'no-store',
        })
        if (!res.ok) return []
        const data = await res.json()
        return data.results || []
    } catch {
        return []
    }
}

export interface TaboolaRevenueAttribution {
    totalRevenue: number
    paidRevenue: number
    unpaidRevenue: number
    totalOrders: number
    paidOrders: number
    byAccount: Map<string, { totalRevenue: number; paidRevenue: number; unpaidRevenue: number; totalOrders: number; paidOrders: number }>
}

/* ── Build campaign ID → account ID mapping from Taboola API ── */
export async function buildCampaignAccountMap(): Promise<Map<string, string>> {
    const map = new Map<string, string>()

    await Promise.allSettled(
        TABOOLA_ACCOUNTS.map(async (account) => {
            const token = await getToken(account)
            if (!token) return

            try {
                const res = await fetch(
                    `https://backstage.taboola.com/backstage/api/1.0/${account.id}/campaigns`,
                    { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }, cache: 'no-store' }
                )
                if (!res.ok) return
                const data = await res.json()
                for (const c of (data.results || [])) {
                    const campaignId = String(c.id || '')
                    if (campaignId) map.set(campaignId, account.id)
                }
            } catch { /* skip */ }
        })
    )

    return map
}

/* ── Attribute orders to Taboola accounts via campaign mapping ── */
export function attributeOrdersToAccounts(
    orders: { totalPrice: number; paymentStatus: string; utmCampaign: string | null; utmSource: string | null; utmId: string | null }[],
    accounts: TaboolaAccountSummary[],
    campaignMap?: Map<string, string>
): TaboolaRevenueAttribution {
    const byAccount = new Map<string, { totalRevenue: number; paidRevenue: number; unpaidRevenue: number; totalOrders: number; paidOrders: number }>()

    for (const acc of accounts) {
        byAccount.set(acc.accountId, { totalRevenue: 0, paidRevenue: 0, unpaidRevenue: 0, totalOrders: 0, paidOrders: 0 })
    }

    let totalRevenue = 0, paidRevenue = 0, unpaidRevenue = 0, totalOrders = 0, paidOrders = 0

    for (const order of orders) {
        const isPaid = order.paymentStatus === 'pago'
        const rev = order.totalPrice || 0

        totalRevenue += rev
        totalOrders++
        if (isPaid) { paidRevenue += rev; paidOrders++ }
        else { unpaidRevenue += rev }

        let matched = false
        const campaign = (order.utmCampaign || '').trim()

        // 1. Try campaign map (campaign ID → account ID)
        if (campaignMap && campaign && campaignMap.has(campaign)) {
            const accId = campaignMap.get(campaign)!
            const accData = byAccount.get(accId)
            if (accData) {
                accData.totalRevenue += rev
                accData.totalOrders++
                if (isPaid) { accData.paidRevenue += rev; accData.paidOrders++ }
                else { accData.unpaidRevenue += rev }
                matched = true
            }
        }

        // 2. Fallback: try matching campaign/utmId against account ID strings
        if (!matched) {
            for (const acc of accounts) {
                const accIdLower = acc.accountId.toLowerCase()
                const utmId = (order.utmId || '').toLowerCase()

                if (campaign.toLowerCase().includes(accIdLower) || utmId.includes(accIdLower)) {
                    const accData = byAccount.get(acc.accountId)!
                    accData.totalRevenue += rev
                    accData.totalOrders++
                    if (isPaid) { accData.paidRevenue += rev; accData.paidOrders++ }
                    else { accData.unpaidRevenue += rev }
                    matched = true
                    break
                }
            }
        }

        // 3. Fallback: assign to first account
        if (!matched && accounts.length > 0) {
            const accData = byAccount.get(accounts[0].accountId)!
            accData.totalRevenue += rev
            accData.totalOrders++
            if (isPaid) { accData.paidRevenue += rev; accData.paidOrders++ }
            else { accData.unpaidRevenue += rev }
        }
    }

    return { totalRevenue, paidRevenue, unpaidRevenue, totalOrders, paidOrders, byAccount }
}

export { TABOOLA_ACCOUNTS }
