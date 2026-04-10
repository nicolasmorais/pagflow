/**
 * Simple in-memory rate limiter.
 * Resets on server restart. Adequate for single-instance deployments.
 */

interface RateLimitEntry {
    count: number
    resetAt: number
}

const store = new Map<string, RateLimitEntry>()

/**
 * Check if the given key has exceeded the rate limit.
 * @param key      Identifier (e.g. IP address)
 * @param limit    Max requests allowed in the window
 * @param windowMs Time window in milliseconds
 * @returns        { limited: true } if rate limit exceeded, { limited: false } otherwise
 */
export function checkRateLimit(
    key: string,
    limit: number,
    windowMs: number
): { limited: boolean; remaining: number; resetAt: number } {
    const now = Date.now()
    const entry = store.get(key)

    if (!entry || now > entry.resetAt) {
        // New window
        const resetAt = now + windowMs
        store.set(key, { count: 1, resetAt })
        return { limited: false, remaining: limit - 1, resetAt }
    }

    if (entry.count >= limit) {
        return { limited: true, remaining: 0, resetAt: entry.resetAt }
    }

    entry.count++
    return { limited: false, remaining: limit - entry.count, resetAt: entry.resetAt }
}

// Clean up expired entries periodically (every 5 minutes)
if (typeof setInterval !== 'undefined') {
    setInterval(() => {
        const now = Date.now()
        for (const [key, entry] of store.entries()) {
            if (now > entry.resetAt) store.delete(key)
        }
    }, 5 * 60 * 1000)
}
