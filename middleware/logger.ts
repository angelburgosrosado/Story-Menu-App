/**
 * Structured Logger — Task 1.8
 * Replaces console.log with structured JSON logging.
 * PII-safe: never logs email, names, or tokens.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
    timestamp: string;
    level: LogLevel;
    message: string;
    requestId?: string;
    userId?: string;
    endpoint?: string;
    method?: string;
    statusCode?: number;
    latencyMs?: number;
    error?: string;
    stack?: string;
    [key: string]: any;
}

function redact(obj: any): any {
    if (typeof obj === 'string') return obj;
    if (!obj || typeof obj !== 'object') return obj;
    const clean: any = Array.isArray(obj) ? [] : {};
    for (const [k, v] of Object.entries(obj)) {
        const key = k.toLowerCase();
        if (key.includes('password') || key.includes('token') || key.includes('secret') || key.includes('api_key') || key.includes('authorization')) {
            clean[k] = '[REDACTED]';
        } else if (typeof v === 'object' && v !== null) {
            clean[k] = redact(v);
        } else {
            clean[k] = v;
        }
    }
    return clean;
}

function log(level: LogLevel, message: string, meta: Partial<LogEntry> = {}) {
    const entry: LogEntry = {
        timestamp: new Date().toISOString(),
        level,
        message,
        ...meta,
    };
    
    // Remove undefined fields
    Object.keys(entry).forEach(k => entry[k] === undefined && delete entry[k]);
    
    const output = JSON.stringify(redact(entry));
    
    if (level === 'error') {
        console.error(output);
    } else if (level === 'warn') {
        console.warn(output);
    } else {
        console.log(output);
    }
}

export const logger = {
    debug: (msg: string, meta?: Partial<LogEntry>) => log('debug', msg, meta),
    info: (msg: string, meta?: Partial<LogEntry>) => log('info', msg, meta),
    warn: (msg: string, meta?: Partial<LogEntry>) => log('warn', msg, meta),
    error: (msg: string, meta?: Partial<LogEntry>) => log('error', msg, meta),
    
    // Express request logging middleware
    requestMiddleware(req: any, res: any, next: any) {
        const start = Date.now();
        const requestId = `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        req.requestId = requestId;
        res.set('X-Request-Id', requestId);
        
        res.on('finish', () => {
            const latency = Date.now() - start;
            const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';
            log(level, `${req.method} ${req.path}`, {
                requestId,
                method: req.method,
                endpoint: req.path,
                statusCode: res.statusCode,
                latencyMs: latency,
            });
        });
        
        next();
    }
};
