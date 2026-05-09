export type DailyData = { date: string; revenue: number; orders: number; paidOrders: number }
export type PaymentMethodData = { method: string; label: string; count: number; revenue: number; percentage: number }
export type InstallmentData = { label: string; count: number; revenue: number }
export type ProductData = { name: string; count: number; revenue: number }
export type StateData = { state: string; count: number; revenue: number }
export type StatusBreakdown = { status: string; label: string; count: number; percentage: number; color: string; bg: string }
export type CardBrandData = { brand: string; count: number }
export type BumpStats = {
    withBump: number; withoutBump: number
    bumpRevenue: number; nonBumpRevenue: number
    bumpAvgTicket: number; nonBumpAvgTicket: number
}
export type AnalyticsKpis = {
    totalRevenue: number; netRevenue: number
    totalOrders: number; paidOrders: number
    pendingOrders: number; rejectedOrders: number
    conversionRate: number; avgTicket: number; bumpRate: number
}

export type AnalyticsData = {
    kpis: AnalyticsKpis
    dailyData: DailyData[]
    paymentMethods: PaymentMethodData[]
    installments: InstallmentData[]
    cardBrands: CardBrandData[]
    topProducts: ProductData[]
    topStates: StateData[]
    statusBreakdown: StatusBreakdown[]
    bumpStats: BumpStats
}
