/**
 * Rate Limiter — Task 1.3
 * In-memory sliding window rate limiter. No external dependencies.
 * Use on sensitive routes to prevent abuse.
 */

interface RateLimitEntry {
    count: number;
    windowStart: number;
}

interface RateLimitConfig {
    windowMs: number;    // Time window in milliseconds
    max: number;         // Max requests per window
    message?: string;    // Error message on limit exceeded
}

const stores = new Map<string, Map<string, RateLimitEntry>>();

export function rateLimit(config: RateLimitConfig) {
    const { windowMs, max, message = 'Too many requests' } = config;
    
    return (req: any, res: any, next: any) => {
        // Use IP + route as key, or IP + email if authenticated
        const key = `${req.ip}:${req.path}`;
        const storeKey = req.path;
        
        if (!stores.has(storeKey)) {
            stores.set(storeKey, new Map());
        }
        const store = stores.get(storeKey)!;
        
        const now = Date.now();
        const entry = store.get(key);
        
        if (!entry || now - entry.windowStart > windowMs) {
            // New window
            store.set(key, { count: 1, windowStart: now });
            return next();
        }
        
        entry.count++;
        
        if (entry.count > max) {
            const retryAfter = Math.ceil((entry.windowStart + windowMs - now) / 1000);
            res.set('Retry-After', String(retryAfter));
            return res.status(429).json({ error: message, retryAfter });
        }
        
        next();
    };
}

// Pre-configured limiters for common use cases
export const generalLimiter = rateLimit({
    windowMs: 60 * 1000,   // 1 minute
    max: 120,               // 120 requests/minute
    message: 'Rate limit exceeded. Please slow down.'
});

export const aiGenerationLimiter = rateLimit({
    windowMs: 60 * 1000,   // 1 minute
    max: 10,                // 10 AI generations/minute
    message: 'AI generation rate limit. Please wait before creating more.'
});

export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max: 10,                     // 10 login attempts per 15 min
    message: 'Too many login attempts. Please try again later.'
});

export const checkoutLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,  // 1 hour
    max: 5,                      // 5 checkout attempts per hour
    message: 'Too many checkout attempts. Please try again later.'
});

/**
 * Server-side token budget enforcement.
 * Replaces client-only token checks with authoritative server validation.
 */
export async function enforceTokenBudget(
    email: string, 
    requiredTokens: number,
    getDbPool: () => any,
    memoryDb: any
): Promise<{ allowed: boolean; remaining?: number; error?: string }> {
    if (!email) return { allowed: false, error: 'Email required' };
    
    // Admin users bypass token budget
    // (RBAC check handled separately by isAdminUser)
    
    // Check Postgres first
    const pool = getDbPool?.();
    if (pool) {
        try {
            const result = await pool.query('SELECT tokens FROM users WHERE email = $1', [email]);
            if (result.rows.length > 0) {
                const tokens = result.rows[0].tokens || 0;
                if (tokens < requiredTokens) {
                    return { allowed: false, remaining: tokens, error: `Insufficient tokens. Need ${requiredTokens}, have ${tokens}.` };
                }
                return { allowed: true, remaining: tokens };
            }
        } catch (err: any) {
            console.warn('[TokenBudget] Postgres check failed:', err.message);
        }
    }
    
    // Memory fallback
    const user = memoryDb?.users?.find((u: any) => u.email === email);
    if (user) {
        const tokens = user.tokens || 0;
        if (tokens < requiredTokens) {
            return { allowed: false, remaining: tokens, error: `Insufficient tokens. Need ${requiredTokens}, have ${tokens}.` };
        }
        return { allowed: true, remaining: tokens };
    }
    
    return { allowed: false, error: 'User not found' };
}

export function getRateLimitStores() {
    const result: Record<string, any[]> = {};
    for (const [route, ipMap] of stores.entries()) {
        result[route] = [];
        for (const [key, entry] of ipMap.entries()) {
            result[route].push({
                key,
                count: entry.count,
                windowStart: new Date(entry.windowStart).toISOString(),
            });
        }
    }
    return result;
}
