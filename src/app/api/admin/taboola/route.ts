import { NextRequest, NextResponse } from 'next/server'

const TABOOLA_CLIENT_ID = '101768521273467f9b5b87c1a86c01f2'
const TABOOLA_CLIENT_SECRET = '43ae9bcc72054b3bb45843a20083b60b'
const TABOOLA_ACCOUNT_ID = 'taboolaaccount-admcasocastoregmailcom'
const BASE_URL = 'https://backstage.taboola.com/backstage/api/1.0'

let cachedToken: { token: string; expiresAt: number } | null = null

async function getToken(): Promise<string> {
    if (cachedToken && cachedToken.expiresAt > Date.now()) {
        return cachedToken.token
    }

    const res = await fetch('https://backstage.taboola.com/backstage/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            client_id: TABOOLA_CLIENT_ID,
            client_secret: TABOOLA_CLIENT_SECRET,
            grant_type: 'client_credentials',
        }),
    })

    if (!res.ok) {
        const text = await res.text()
        throw new Error(`Taboola auth failed: ${res.status} - ${text}`)
    }

    const data = await res.json()
    cachedToken = {
        token: data.access_token,
        expiresAt: Date.now() + (data.expires_in - 60) * 1000,
    }
    return cachedToken.token
}

function getDateRange(period: string): { start: string; end: string } {
    const now = new Date()
    const end = now.toISOString().split('T')[0]
    const start = new Date(now)

    switch (period) {
        case 'today':
            break
        case '7d':
            start.setDate(start.getDate() - 7)
            break
        case '30d':
            start.setDate(start.getDate() - 30)
            break
        case '90d':
            start.setDate(start.getDate() - 90)
            break
        default:
            start.setDate(start.getDate() - 30)
    }

    return { start: start.toISOString().split('T')[0], end }
}

async function taboolaFetch(url: string, token: string): Promise<any> {
    const res = await fetch(url, {
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
        },
    })
    if (!res.ok) {
        const text = await res.text()
        throw new Error(`Taboola API ${res.status}: ${text.substring(0, 300)}`)
    }
    return res.json()
}

export async function GET(req: NextRequest) {
    try {
        const period = req.nextUrl.searchParams.get('period') || '30d'
        const { start, end } = getDateRange(period)
        const token = await getToken()

        // 1. Daily summary: /reports/campaign-summary/dimensions/day
        const summaryUrl = `${BASE_URL}/${TABOOLA_ACCOUNT_ID}/reports/campaign-summary/dimensions/day?start_date=${start}&end_date=${end}`
        const summaryData = await taboolaFetch(summaryUrl, token)
        const summaryResults = summaryData.results || []

        // 2. Campaign breakdown: /reports/top-campaign-content
        let campaignItems: any[] = []
        try {
            const campaignUrl = `${BASE_URL}/${TABOOLA_ACCOUNT_ID}/reports/top-campaign-content?start_date=${start}&end_date=${end}`
            const crData = await taboolaFetch(campaignUrl, token)
            campaignItems = crData.results || []
        } catch {
            // No campaign data
        }

        // 3. Campaign list for status info
        let campaigns: any[] = []
        try {
            const campaignsUrl = `${BASE_URL}/${TABOOLA_ACCOUNT_ID}/campaigns?status=ALL`
            const campaignsData = await taboolaFetch(campaignsUrl, token)
            campaigns = campaignsData.results || []
        } catch {
            // Ignore
        }

        // Aggregate daily totals
        const totalSpent = summaryResults.reduce((s: number, r: any) => s + (r.spent || 0), 0)
        const totalImpressions = summaryResults.reduce((s: number, r: any) => s + (r.impressions || 0), 0)
        const totalClicks = summaryResults.reduce((s: number, r: any) => s + (r.clicks || 0), 0)
        const totalConversions = summaryResults.reduce((s: number, r: any) => s + (r.cpa_actions_num || 0), 0)
        const cpc = totalClicks > 0 ? totalSpent / totalClicks : 0
        const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0
        const cpa = totalConversions > 0 ? totalSpent / totalConversions : 0

        // Daily chart data
        const daily = summaryResults.map((r: any) => ({
            date: r.date?.split(' ')[0] || r.date,
            spent: r.spent || 0,
            impressions: r.impressions || 0,
            clicks: r.clicks || 0,
            conversions: r.cpa_actions_num || 0,
            cpc: r.cpc || 0,
            ctr: r.ctr || 0,
        }))

        // Aggregate campaign items by campaign_id
        const campaignMap = new Map<string, { name: string; spent: number; impressions: number; clicks: number; conversions: number; status: string }>()
        for (const item of campaignItems) {
            const id = String(item.campaign || 'unknown')
            const existing = campaignMap.get(id)
            const impressions = item.impressions || 0
            const clicks = item.clicks || 0
            const conversions = item.actions || 0
            const spent = item.cpc ? item.cpc * clicks : 0
            if (existing) {
                existing.spent += spent
                existing.impressions += impressions
                existing.clicks += clicks
                existing.conversions += conversions
            } else {
                const camp = campaigns.find((c: any) => String(c.id) === id)
                campaignMap.set(id, {
                    name: camp?.name || item.campaign_name || `Campanha ${id}`,
                    spent,
                    impressions,
                    clicks,
                    conversions,
                    status: camp?.status || 'UNKNOWN',
                })
            }
        }

        const campaignBreakdown = Array.from(campaignMap.values())
            .sort((a, b) => b.spent - a.spent)

        return NextResponse.json({
            summary: {
                totalSpent,
                totalImpressions,
                totalClicks,
                totalConversions,
                cpc,
                ctr,
                cpa,
            },
            daily,
            campaigns: campaignBreakdown,
            period,
            dateRange: { start, end },
        })
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || 'Internal error' },
            { status: 500 }
        )
    }
}
