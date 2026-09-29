/**
 * Developer API — Task 3.6
 * REST API with API key auth, rate limiting, and OpenAPI docs.
 * Mount at /api/v1/*
 */

import { Router, Request, Response, NextFunction } from 'express';
import { getFirestore } from 'firebase-admin/firestore';

const router = Router();

// ─── API Key Validation Middleware ─────────────────────────────────────

interface ApiKeyRecord {
    key: string;
    ownerEmail: string;
    plan: 'free' | 'pro' | 'enterprise';
    rateLimit: number;
    createdAt: string;
    lastUsedAt?: string;
}

const apiKeyStore = new Map<string, ApiKeyRecord>();

export function registerApiKey(key: string, ownerEmail: string, plan: 'free' | 'pro' | 'enterprise' = 'free') {
    const limits = { free: 60, pro: 600, enterprise: 6000 };
    apiKeyStore.set(key, {
        key,
        ownerEmail,
        plan,
        rateLimit: limits[plan],
        createdAt: new Date().toISOString(),
    });
}

async function validateApiKey(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing API key. Send Authorization: Bearer <key>' });
    }

    const key = authHeader.split(' ')[1];
    const record = apiKeyStore.get(key);

    if (!record) {
        return res.status(401).json({ error: 'Invalid API key' });
    }

    // Update last used
    record.lastUsedAt = new Date().toISOString();

    // Attach to request
    (req as any).apiKey = record;
    next();
}

// ─── Rate Limiter for API Key ─────────────────────────────────────────

const apiCallCounts = new Map<string, { count: number; windowStart: number }>();

function apiKeyRateLimit(req: Request, res: Response, next: NextFunction) {
    const record = (req as any).apiKey as ApiKeyRecord;
    if (!record) return next();

    const now = Date.now();
    const entry = apiCallCounts.get(record.key);

    if (!entry || now - entry.windowStart > 60000) {
        apiCallCounts.set(record.key, { count: 1, windowStart: now });
        return next();
    }

    entry.count++;
    if (entry.count > record.rateLimit) {
        res.set('Retry-After', String(Math.ceil((entry.windowStart + 60000 - now) / 1000)));
        return res.status(429).json({
            error: 'Rate limit exceeded',
            limit: record.rateLimit,
            plan: record.plan,
            retryAfter: Math.ceil((entry.windowStart + 60000 - now) / 1000),
        });
    }

    next();
}

// ─── Apply middleware to all /api/v1 routes ────────────────────────────

router.use(validateApiKey);
router.use(apiKeyRateLimit);

// ─── GET /api/v1/stories — List stories ────────────────────────────────

router.get('/stories', async (req: Request, res: Response) => {
    const { page = '1', limit = '20', genre, format } = req.query;
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
    const maxLimit = Math.min(parseInt(limit as string), 100);

    try {
        const db = getFirestore();
        let query: any = db.collectionGroup('projects');

        if (genre) query = query.where('genre', '==', genre);
        if (format) query = query.where('format', '==', format);

        const snapshot = await query.orderBy('created_at', 'desc').offset(offset).limit(maxLimit).get();
        const stories = snapshot.docs.map((doc: any) => ({
            id: doc.id,
            ...doc.data(),
            _links: { self: `/api/v1/stories/${doc.id}` },
        }));

        res.json({
            data: stories,
            pagination: {
                page: parseInt(page as string),
                limit: maxLimit,
                total: snapshot.size,
                hasMore: snapshot.size === maxLimit,
            },
        });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// ─── GET /api/v1/stories/:id — Get story by ID ─────────────────────────

router.get('/stories/:id', async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        const db = getFirestore();
        // Search across all user project subcollections
        const usersSnap = await db.collection('users').limit(50).get();

        for (const userDoc of usersSnap.docs) {
            const storySnap = await userDoc.ref.collection('projects').doc(String(id)).get();
            if (storySnap.exists) {
                return res.json({ id: storySnap.id, ...storySnap.data() });
            }
        }

        res.status(404).json({ error: 'Story not found' });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// ─── POST /api/v1/stories/:id/export — Export story as JSON ────────────

router.post('/stories/:id/export', async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        const db = getFirestore();
        const usersSnap = await db.collection('users').limit(50).get();

        for (const userDoc of usersSnap.docs) {
            const storySnap = await userDoc.ref.collection('projects').doc(String(id)).get();
            if (storySnap.exists) {
                const data = storySnap.data();
                res.setHeader('Content-Disposition', `attachment; filename="story-${id}.json"`);
                return res.json({
                    title: data?.title || 'Untitled',
                    genre: data?.genre,
                    pages: data?.pages || data?.panels || [],
                    characters: data?.characters || [],
                    narration: data?.narration || data?.script || '',
                    exportedAt: new Date().toISOString(),
                });
            }
        }

        res.status(404).json({ error: 'Story not found' });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// ─── GET /api/v1/genres — List available genres ─────────────────────────

router.get('/genres', (_req: Request, res: Response) => {
    const genres = [
        'Superhero Action', 'Historical Epics', 'Classic Horror', 'Dark Sci-Fi',
        'High Fantasy', 'Neon Noir Detective', 'Wasteland Apocalyse',
        'Lighthearted Comedy', 'Teen Drama / Slice of Life', 'Anime Story',
    ];
    res.json({ data: genres });
});

// ─── GET /api/v1/formats — List available formats ───────────────────────

router.get('/formats', (_req: Request, res: Response) => {
    const formats = [
        { id: 'comic', name: 'Comic Book', description: 'Classic graphic novel layout' },
        { id: 'visual-lesson', name: 'Visual Lesson', description: 'Educational step-by-step panels' },
        { id: 'bilingual-story', name: 'Bilingual Story', description: 'Side-by-side dual language' },
        { id: 'kid-story', name: 'Kid Story', description: 'Large illustrations for early readers' },
        { id: 'science-explainer', name: 'Science Explainer', description: 'Process-focused science concepts' },
        { id: 'history-lesson', name: 'History Lesson', description: 'Chronological narrative panels' },
    ];
    res.json({ data: formats });
});

// ─── GET /api/v1/usage — API usage stats ────────────────────────────────

router.get('/usage', async (req: Request, res: Response) => {
    const record = (req as any).apiKey as ApiKeyRecord;
    const entry = apiCallCounts.get(record.key);

    res.json({
        plan: record.plan,
        rateLimit: record.rateLimit,
        currentWindow: {
            calls: entry?.count || 0,
            remaining: Math.max(0, record.rateLimit - (entry?.count || 0)),
            resetsAt: new Date((entry?.windowStart || Date.now()) + 60000).toISOString(),
        },
    });
});

// ─── OpenAPI Spec ──────────────────────────────────────────────────────

router.get('/openapi.json', (_req: Request, res: Response) => {
    res.json({
        openapi: '3.0.3',
        info: {
            title: 'Story.Menu Developer API',
            version: '1.0.0',
            description: 'API for accessing Story.Menu stories, genres, and formats.',
        },
        servers: [{ url: 'https://storymenu.app', description: 'Production' }],
        security: [{ BearerAuth: [] }],
        components: {
            securitySchemes: {
                BearerAuth: { type: 'http', scheme: 'bearer', description: 'API key as Bearer token' },
            },
        },
        paths: {
            '/api/v1/stories': {
                get: {
                    summary: 'List stories',
                    parameters: [
                        { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
                        { name: 'limit', in: 'query', schema: { type: 'integer', default: 20, maximum: 100 } },
                        { name: 'genre', in: 'query', schema: { type: 'string' } },
                        { name: 'format', in: 'query', schema: { type: 'string' } },
                    ],
                },
            },
            '/api/v1/stories/{id}': {
                get: { summary: 'Get story by ID', parameters: [{ name: 'id', in: 'path', required: true }] },
            },
            '/api/v1/genres': { get: { summary: 'List genres' } },
            '/api/v1/formats': { get: { summary: 'List formats' } },
            '/api/v1/usage': { get: { summary: 'API usage stats' } },
        },
    });
});

export default router;
