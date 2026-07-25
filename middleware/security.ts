/**
 * Security Middleware — Tasks 1.4, 1.7, 1.9
 * Input validation, security headers, upload validation.
 */

// ─── Task 1.7: Security Headers ──────────────────────────────────────
export function securityHeaders(req: any, res: any, next: any) {
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('X-Frame-Options', 'DENY');
    res.set('X-XSS-Protection', '1; mode=block');
    res.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
        res.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    next();
}

// ─── Task 1.4: Input Validation ───────────────────────────────────────

type FieldType = 'string' | 'number' | 'boolean' | 'email' | 'array' | 'object';

interface FieldSchema {
    type: FieldType;
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: RegExp;
    enum?: any[];
    default?: any;
}

interface Schema {
    [field: string]: FieldSchema;
}

export function validate(schema: Schema) {
    return (req: any, res: any, next: any) => {
        const errors: string[] = [];
        const body = req.body || {};

        for (const [field, rules] of Object.entries(schema)) {
            const value = body[field];

            if (rules.required && (value === undefined || value === null || value === '')) {
                errors.push(`${field} is required`);
                continue;
            }
            if (value === undefined || value === null) {
                if (rules.default !== undefined) body[field] = rules.default;
                continue;
            }

            if (rules.type === 'string' || rules.type === 'email') {
                if (typeof value !== 'string') { errors.push(`${field} must be a string`); continue; }
                if (rules.minLength && value.length < rules.minLength) errors.push(`${field} min ${rules.minLength} chars`);
                if (rules.maxLength && value.length > rules.maxLength) errors.push(`${field} max ${rules.maxLength} chars`);
                if (rules.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) errors.push(`${field} invalid email`);
                if (rules.pattern && !rules.pattern.test(value)) errors.push(`${field} invalid format`);
            }
            if (rules.type === 'number') {
                const num = Number(value);
                if (isNaN(num)) { errors.push(`${field} must be a number`); continue; }
                if (rules.min !== undefined && num < rules.min) errors.push(`${field} min ${rules.min}`);
                if (rules.max !== undefined && num > rules.max) errors.push(`${field} max ${rules.max}`);
            }
            if (rules.type === 'boolean' && typeof value !== 'boolean') errors.push(`${field} must be boolean`);
            if (rules.type === 'array') {
                if (!Array.isArray(value)) { errors.push(`${field} must be array`); continue; }
                if (rules.maxLength && value.length > rules.maxLength) errors.push(`${field} max ${rules.maxLength} items`);
            }
            if (rules.enum && !rules.enum.includes(value)) errors.push(`${field} must be one of: ${rules.enum.join(', ')}`);
        }

        if (errors.length > 0) return res.status(400).json({ error: 'Validation failed', details: errors });
        next();
    };
}

// ─── Task 1.9: Image Upload Validation ────────────────────────────────

const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']);
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

export function validateImageUpload(req: any, res: any, next: any) {
    const contentType = req.headers['content-type'] || '';
    const contentLength = parseInt(req.headers['content-length'] || '0', 10);
    if (contentLength > MAX_IMAGE_SIZE) return res.status(413).json({ error: 'File too large. Max 10MB.' });
    if (contentType && contentType.startsWith('image/')) {
        const mime = contentType.split(';')[0].trim();
        if (!ALLOWED_IMAGE_TYPES.has(mime)) return res.status(415).json({ error: `Unsupported: ${mime}` });
    }
    next();
}

// ─── Common Schemas ───────────────────────────────────────────────────

export const checkoutSchema: Schema = {
    email: { type: 'email', required: true, maxLength: 255 },
    tier: { type: 'string', required: true, maxLength: 100 },
    paymentMethod: { type: 'string', required: true, enum: ['Stripe', 'PayPal'] },
    type: { type: 'string', enum: ['subscription', 'tokens'], default: 'subscription' },
    tokensAwarded: { type: 'number', min: 0, max: 100000, default: 0 },
};

export const geminiSuggestSchema: Schema = {
    fieldName: { type: 'string', required: true, maxLength: 100 },
    currentValue: { type: 'string', maxLength: 5000 },
    genre: { type: 'string', maxLength: 100 },
};
