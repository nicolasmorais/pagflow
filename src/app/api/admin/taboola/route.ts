import { NextRequest, NextResponse } from 'next/server'
import { getBrazilNow, formatDateStr } from '@/lib/date-utils'
import { fetchAllTaboolaAccounts, fetchAccountCampaigns, TABOOLA_ACCOUNTS, attributeOrdersToAccounts, buildCampaignAccountMap } from '@/lib/taboola'
import { prisma } from '@/lib/prisma'

function getDateRange(period: string): { start: string; end: string } {
    const now = getBrazilNow()
    let end = formatDateStr(now)
    const start = new Date(now)

    switch (period) {
        case 'today':
            break
        case 'yesterday':
            start.setDate(start.getDate() - 1)
            end = formatDateStr(start)
            break
        case 'week':
            start.setDate(start.getDate() - 7)
            break
        case 'this_month':
            start.setDate(1)
            break
        case 'last_month':
            start.setMonth(start.getMonth() - 1)
            start.setDate(1)
            end = formatDateStr(new Date(now.getFullYear(), now.getMonth(), 0))
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

    return { start: formatDateStr(start), end }
}

export async function GET(req: NextRequest) {
    try {
        const period = req.nextUrl.searchParams.get('period') || '30d'
        const accountId = req.nextUrl.searchParams.get('account')
        const { start, end } = getDateRange(period)

        // Single account mode
        if (accountId) {
            const account = TABOOLA_ACCOUNTS.find(a => a.id === accountId)
            if (!account) {
                return NextResponse.json({ error: 'Account not found' }, { status: 404 })
            }

            const result = await fetchAllTaboolaAccounts(start, end)
            const accData = result.accounts.find(a => a.accountId === accountId)
            if (!accData) {
                return NextResponse.json({ error: 'Failed to fetch account data' }, { status: 500 })
            }

            const campaigns = await fetchAccountCampaigns(accountId, start, end)

            const daily = Array.from(accData.byDate.entries()).map(([date, spent]) => ({
                date,
                spent,
            })).sort((a, b) => a.date.localeCompare(b.date))

            // Revenue attribution for this account
            const [taboolaOrders, campaignMap] = await Promise.all([
                prisma.order.findMany({
                    where: {
                        deletedAt: null,
                        utmSource: { contains: 'taboola', mode: 'insensitive' },
                        createdAt: { gte: new Date(start), lte: new Date(end + 'T23:59:59') },
                    },
                    select: { totalPrice: true, paymentStatus: true, utmCampaign: true, utmSource: true, utmId: true },
                }),
                buildCampaignAccountMap(),
            ])
            const attribution = attributeOrdersToAccounts(taboolaOrders, [accData], campaignMap)
            const accAttr = attribution.byAccount.get(accountId)

            return NextResponse.json({
                summary: {
                    totalSpent: accData.totalSpent,
                    totalImpressions: accData.totalImpressions,
                    totalClicks: accData.totalClicks,
                    totalConversions: accData.totalConversions,
                    cpc: accData.cpc,
                    ctr: accData.ctr,
                    cpa: accData.cpa,
                },
                daily,
                campaigns,
                revenue: {
                    paidRevenue: accAttr?.paidRevenue || 0,
                    unpaidRevenue: accAttr?.unpaidRevenue || 0,
                    totalRevenue: accAttr?.totalRevenue || 0,
                    paidOrders: accAttr?.paidOrders || 0,
                    totalOrders: accAttr?.totalOrders || 0,
                },
                period,
                dateRange: { start, end },
                accountId,
                accountLabel: account.label,
            })
        }

        // All accounts mode
        const result = await fetchAllTaboolaAccounts(start, end)

        const accounts = result.accounts.map(acc => {
            const daily = Array.from(acc.byDate.entries()).map(([date, spent]) => ({
                date, spent,
            })).sort((a, b) => a.date.localeCompare(b.date))

            return {
                accountId: acc.accountId,
                label: acc.label,
                summary: {
                    totalSpent: acc.totalSpent,
                    totalImpressions: acc.totalImpressions,
                    totalClicks: acc.totalClicks,
                    totalConversions: acc.totalConversions,
                    cpc: acc.cpc,
                    ctr: acc.ctr,
                    cpa: acc.cpa,
                },
                daily,
                error: acc.error,
            }
        })

        // Revenue attribution via UTM
        const [taboolaOrders, campaignMap] = await Promise.all([
            prisma.order.findMany({
                where: {
                    deletedAt: null,
                    utmSource: { contains: 'taboola', mode: 'insensitive' },
                    createdAt: { gte: new Date(start), lte: new Date(end + 'T23:59:59') },
                },
                select: { totalPrice: true, paymentStatus: true, utmCampaign: true, utmSource: true, utmId: true },
            }),
            buildCampaignAccountMap(),
        ])
        const attribution = attributeOrdersToAccounts(taboolaOrders, result.accounts, campaignMap)
        const revenue = accounts.map(a => {
            const attr = attribution.byAccount.get(a.accountId)
            return {
                accountId: a.accountId,
                paidRevenue: attr?.paidRevenue || 0,
                unpaidRevenue: attr?.unpaidRevenue || 0,
                totalRevenue: attr?.totalRevenue || 0,
                paidOrders: attr?.paidOrders || 0,
                totalOrders: attr?.totalOrders || 0,
            }
        })

        return NextResponse.json({
            accounts,
            revenue,
            totalSpent: result.totalSpent,
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
