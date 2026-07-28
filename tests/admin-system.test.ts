import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import adminSystemRouter from '../routes/admin-system';

// Mock database
vi.mock('../db', () => ({
    getDbPool: vi.fn(() => ({
        query: vi.fn(),
    })),
    isDatabaseConnected: vi.fn(() => true),
    markDatabaseOffline: vi.fn(),
    isConnectionError: vi.fn(() => false),
}));

// Mock Firestore
vi.mock('firebase-admin/firestore', () => ({
    getFirestore: vi.fn(() => ({
        collection: vi.fn(() => ({
            get: vi.fn(() => ({ docs: [] })),
        })),
    })),
}));

vi.mock('../middleware/featureFlags', () => ({
    featureFlags: {
        getAllFlags: vi.fn().mockResolvedValue([
            { name: 'test-flag', enabled: true, percentage: 50 }
        ]),
        setFlag: vi.fn().mockResolvedValue(undefined),
        deleteFlag: vi.fn().mockResolvedValue(undefined),
    }
}));

vi.mock('../middleware/rateLimit', () => ({
    getRateLimitStores: vi.fn().mockReturnValue({
        '/api/test': [{ key: '127.0.0.1', count: 5, windowStart: '2026-07-28T00:00:00.000Z' }]
    })
}));

describe('Admin System Router', () => {
    let app: express.Express;

    beforeEach(() => {
        app = express();
        app.use(express.json());
        app.use('/api/admin', adminSystemRouter);
        vi.clearAllMocks();
    });

    it('should retrieve all feature flags from Firestore via GET', async () => {
        const req = {} as any;
        const res = {
            json: vi.fn(),
            status: vi.fn().mockReturnThis()
        } as any;

        const getRoute = adminSystemRouter.stack.find(s => s.route?.path === '/feature-flags' && (s.route as any).methods?.get);
        const getHandler = (getRoute as any).route.stack[0].handle;
        await getHandler(req, res);

        expect(res.json).toHaveBeenCalledWith([
            { name: 'test-flag', enabled: true, percentage: 50 }
        ]);
    });

    it('should update or create feature flag via POST', async () => {
        const req = {
            body: { name: 'new-flag', enabled: false, percentage: 10 }
        } as any;
        const res = {
            json: vi.fn(),
            status: vi.fn().mockReturnThis()
        } as any;

        const postRoute = adminSystemRouter.stack.find(s => s.route?.path === '/feature-flags' && (s.route as any).methods?.post);
        const postHandler = (postRoute as any).route.stack[0].handle;
        await postHandler(req, res);

        expect(res.json).toHaveBeenCalledWith({ success: true });
    });

    it('should delete a feature flag via DELETE', async () => {
        const req = {
            params: { name: 'test-flag' }
        } as any;
        const res = {
            json: vi.fn(),
            status: vi.fn().mockReturnThis()
        } as any;

        const deleteRoute = adminSystemRouter.stack.find(s => s.route?.path === '/feature-flags/:name' && (s.route as any).methods?.delete);
        const deleteHandler = (deleteRoute as any).route.stack[0].handle;
        await deleteHandler(req, res);

        expect(res.json).toHaveBeenCalledWith({ success: true });
    });

    it('should return active rate limit stats via GET', async () => {
        const req = {} as any;
        const res = {
            json: vi.fn(),
            status: vi.fn().mockReturnThis()
        } as any;

        const rateLimitsRoute = adminSystemRouter.stack.find(s => s.route?.path === '/system/rate-limits' && (s.route as any).methods?.get);
        const rateLimitsHandler = (rateLimitsRoute as any).route.stack[0].handle;
        await rateLimitsHandler(req, res);

        expect(res.json).toHaveBeenCalledWith({
            '/api/test': [{ key: '127.0.0.1', count: 5, windowStart: '2026-07-28T00:00:00.000Z' }]
        });
    });
});
