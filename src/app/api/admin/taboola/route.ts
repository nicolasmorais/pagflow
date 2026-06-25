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

export async function GET(req: NextRequest) {
    try {
        const period = req.nextUrl.searchParams.get('period') || '30d'
        const { start, end } = getDateRange(period)
        const token = await getToken()

        // Fetch daily report
        const reportUrl = `${BASE_URL}/${TABOOLA_ACCOUNT_ID}/reports/marketing/day?start_date=${start}&end_date=${end}`
        const reportRes = await fetch(reportUrl, {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/json',
            },
        })

        if (!reportRes.ok) {
            const text = await reportRes.text()
            return NextResponse.json(
                { error: `Taboola report failed: ${reportRes.status}`, details: text },
                { status: reportRes.status }
            )
        }

        const reportData = await reportRes.json()
        const results = reportData.results || []

        // Fetch campaigns list
        const campaignsUrl = `${BASE_URL}/${TABOOLA_ACCOUNT_ID}/campaigns`
        const campaignsRes = await fetch(campaignsUrl, {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/json',
            },
        })

        let campaigns: any[] = []
        if (campaignsRes.ok) {
            const campaignsData = await campaignsRes.json()
            campaigns = campaignsData.results || []
        }

        // Fetch campaign-level report
        const campaignReportUrl = `${BASE_URL}/${TABOOLA_ACCOUNT_ID}/reports/campaign/day?start_date=${start}&end_date=${end}`
        const campaignReportRes = await fetch(campaignReportUrl, {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/json',
            },
        })

        let campaignReport: any[] = []
        if (campaignReportRes.ok) {
            const crData = await campaignReportRes.json()
            campaignReport = crData.results || []
        }

        // Aggregate daily data
        const totalSpent = results.reduce((s: number, r: any) => s + (r.spent || 0), 0)
        const totalImpressions = results.reduce((s: number, r: any) => s + (r.impressions || 0), 0)
        const totalClicks = results.reduce((s: number, r: any) => s + (r.clicks || 0), 0)
        const totalConversions = results.reduce((s: number, r: any) => s + (r.conversions || 0), 0)
        const cpc = totalClicks > 0 ? totalSpent / totalClicks : 0
        const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0
        const cpa = totalConversions > 0 ? totalSpent / totalConversions : 0

        // Daily chart data
        const daily = results.map((r: any) => ({
            date: r.date,
            spent: r.spent || 0,
            impressions: r.impressions || 0,
            clicks: r.clicks || 0,
            conversions: r.conversions || 0,
            cpc: (r.clicks || 0) > 0 ? (r.spent || 0) / r.clicks : 0,
            ctr: (r.impressions || 0) > 0 ? ((r.clicks || 0) / r.impressions) * 100 : 0,
        }))

        // Aggregate campaign data (group by campaign across days)
        const campaignMap = new Map<string, { name: string; spent: number; impressions: number; clicks: number; conversions: number; status: string }>()
        for (const cr of campaignReport) {
            const id = String(cr.campaign || cr.campaign_id || 'unknown')
            const existing = campaignMap.get(id)
            if (existing) {
                existing.spent += cr.spent || 0
                existing.impressions += cr.impressions || 0
                existing.clicks += cr.clicks || 0
                existing.conversions += cr.conversions || 0
            } else {
                const camp = campaigns.find((c: any) => String(c.id) === id)
                campaignMap.set(id, {
                    name: camp?.name || cr.campaign_name || `Campanha ${id}`,
                    spent: cr.spent || 0,
                    impressions: cr.impressions || 0,
                    clicks: cr.clicks || 0,
                    conversions: cr.conversions || 0,
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
