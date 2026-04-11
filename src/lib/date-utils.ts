/**
 * Centralized date utilities for PagFlow Admin.
 * All dates are calculated relative to the America/Sao_Paulo timezone (BRT/BRST).
 * This ensures that "today" always means the Brazilian calendar day,
 * regardless of the server's timezone (UTC on Vercel, etc).
 */

const TZ = 'America/Sao_Paulo'

/**
 * Returns the current Date object adjusted to Brazil time.
 */
export function getBrazilNow(): Date {
    const nowString = new Date().toLocaleString('en-US', { timeZone: TZ })
    return new Date(nowString)
}

/**
 * Formats a Date as 'YYYY-MM-DD' using its local (already BRT-adjusted) values.
 */
export function formatDateStr(d: Date): string {
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

/**
 * Converts a 'YYYY-MM-DD' date string to a proper UTC Date object
 * representing the START of that day in Brazil (00:00:00 BRT).
 *
 * Uses Intl.DateTimeFormat to dynamically determine the correct UTC offset
 * (handles both BRT -03:00 and BRST -02:00 during daylight saving).
 */
export function startOfDayBR(dateStr: string): Date {
    const offset = getBrazilOffsetString(dateStr)
    return new Date(`${dateStr}T00:00:00${offset}`)
}

/**
 * Converts a 'YYYY-MM-DD' date string to a proper UTC Date object
 * representing the END of that day in Brazil (23:59:59.999 BRT).
 */
export function endOfDayBR(dateStr: string): Date {
    const offset = getBrazilOffsetString(dateStr)
    return new Date(`${dateStr}T23:59:59.999${offset}`)
}

/**
 * Converts a UTC Date (from the database) to a 'YYYY-MM-DD' string
 * in the Brazil timezone. Use this for bucketing/grouping orders by day.
 */
export function dateToBrazilDateStr(utcDate: Date): string {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: TZ,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(utcDate)
    return parts // en-CA already formats as YYYY-MM-DD
}

/**
 * Determines the current UTC offset for Brazil on a given date.
 * Returns a string like '-03:00' (BRT) or '-02:00' (BRST during daylight saving).
 */
function getBrazilOffsetString(dateStr: string): string {
    // Create a date at noon to avoid edge cases
    const testDate = new Date(`${dateStr}T12:00:00Z`)
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: TZ,
        timeZoneName: 'shortOffset',
    })
    const parts = formatter.formatToParts(testDate)
    const tzPart = parts.find(p => p.type === 'timeZoneName')
    // tzPart.value will be something like "GMT-3" or "GMT-2"
    const match = tzPart?.value?.match(/GMT([+-]?\d+)/)
    if (match) {
        const hours = parseInt(match[1], 10)
        const sign = hours <= 0 ? '-' : '+'
        return `${sign}${String(Math.abs(hours)).padStart(2, '0')}:00`
    }
    return '-03:00' // Safe fallback for BRT
}

/**
 * Computes all standard date filter values in Brazil timezone.
 * Used by admin pages (Analytics, Pedidos, Abandonados).
 */
export function getDateFilters(filterParam?: string, fromParam?: string, toParam?: string) {
    const now = getBrazilNow()

    const todayStr = formatDateStr(now)

    const yesterdayDate = new Date(now)
    yesterdayDate.setDate(yesterdayDate.getDate() - 1)
    const yesterdayStr = formatDateStr(yesterdayDate)

    const last7DaysDate = new Date(now)
    last7DaysDate.setDate(last7DaysDate.getDate() - 7)
    const last7DaysStr = formatDateStr(last7DaysDate)

    const last30DaysDate = new Date(now)
    last30DaysDate.setDate(last30DaysDate.getDate() - 30)
    const last30DaysStr = formatDateStr(last30DaysDate)

    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const firstDayOfMonthStr = formatDateStr(firstDayOfMonth)

    const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const firstDayLastMonthStr = formatDateStr(firstDayLastMonth)

    const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)
    const lastDayLastMonthStr = formatDateStr(lastDayLastMonth)

    let fromDate: string
    let toDate: string

    switch (filterParam) {
        case 'today':
            fromDate = todayStr
            toDate = todayStr
            break
        case 'yesterday':
            fromDate = yesterdayStr
            toDate = yesterdayStr
            break
        case '7dias':
            fromDate = last7DaysStr
            toDate = todayStr
            break
        case '30dias':
            fromDate = last30DaysStr
            toDate = todayStr
            break
        case 'mes':
            fromDate = firstDayOfMonthStr
            toDate = todayStr
            break
        case 'mes-anterior':
            fromDate = firstDayLastMonthStr
            toDate = lastDayLastMonthStr
            break
        case 'vida':
            fromDate = '2020-01-01'
            toDate = todayStr
            break
        default:
            fromDate = fromParam || todayStr
            toDate = toParam || todayStr
    }

    return {
        now,
        todayStr,
        fromDate,
        toDate,
        fromDateUTC: startOfDayBR(fromDate),
        toDateUTC: endOfDayBR(toDate),
    }
}
