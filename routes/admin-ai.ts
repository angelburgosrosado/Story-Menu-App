/**
 * AI Admin Routes — Extracted from server.ts
 * Handles: AI providers, models, workflows, routing rules, fallback configs,
 * dry-run resolver, and engine summary.
 *
 * These routes use legacy paths (/ai-providers, /ai-models, ...) because the
 * admin UI still calls them. The router is mounted at /api/admin.
 */

import { Router, Request, Response } from 'express';

const router = Router();

let memoryDb: any = {};
let resolveAIRoute: any = () => ({});

export function setMemoryDb(db: any) { memoryDb = db; }
export function setRouteResolver(fn: any) { resolveAIRoute = fn; }

// Helper: generic CRUD for in-memory collections
function memoryCrud(collection: string, idPrefix: string) {
    return {
        list: (_req: Request, res: Response) => res.json(memoryDb[collection] || []),

        create: (req: Request, res: Response) => {
            const item = { id: `${idPrefix}-${Date.now()}`, ...req.body, createdAt: new Date().toISOString() };
            memoryDb[collection] = memoryDb[collection] || [];
            memoryDb[collection].push(item);
            return res.json(item);
        },

        update: (req: Request, res: Response) => {
            const idx = (memoryDb[collection] || []).findIndex((i: any) => i.id === req.params.id);
            if (idx === -1) return res.status(404).json({ error: 'Not found' });
            memoryDb[collection][idx] = { ...memoryDb[collection][idx], ...req.body };
            return res.json(memoryDb[collection][idx]);
        },

        remove: (req: Request, res: Response) => {
            memoryDb[collection] = (memoryDb[collection] || []).filter((i: any) => i.id !== req.params.id);
            return res.json({ success: true });
        },
    };
}

const providers = memoryCrud('ai_providers', 'prov');
const models = memoryCrud('ai_models', 'model');
const workflows = memoryCrud('ai_workflows', 'flow');
const rules = memoryCrud('ai_routing_rules', 'rule');

// ─── AI Providers ──────────────────────────────────────────────────────
router.get('/ai-providers', providers.list);
router.post('/ai-providers', providers.create);
router.put('/ai-providers/:id', providers.update);
router.delete('/ai-providers/:id', providers.remove);

// ─── AI Models ─────────────────────────────────────────────────────────
router.get('/ai-models', models.list);
router.post('/ai-models', models.create);
router.put('/ai-models/:id', models.update);
router.delete('/ai-models/:id', models.remove);

// ─── AI Workflows ──────────────────────────────────────────────────────
router.get('/ai-workflows', workflows.list);
router.post('/ai-workflows', workflows.create);
router.put('/ai-workflows/:id', workflows.update);
router.delete('/ai-workflows/:id', workflows.remove);

// ─── AI Routing Rules ──────────────────────────────────────────────────
router.get('/ai-routing-rules', rules.list);
router.post('/ai-routing-rules', rules.create);
router.put('/ai-routing-rules/:id', rules.update);
router.delete('/ai-routing-rules/:id', rules.remove);

// ─── AI Fallback Configs ───────────────────────────────────────────────
router.get('/ai-fallback-configs', (_req: Request, res: Response) => {
    res.json(memoryDb.ai_fallback_configs || []);
});

router.put('/ai-fallback-configs/:id', (req: Request, res: Response) => {
    const idx = (memoryDb.ai_fallback_configs || []).findIndex((f: any) => f.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    memoryDb.ai_fallback_configs[idx] = { ...memoryDb.ai_fallback_configs[idx], ...req.body };
    return res.json(memoryDb.ai_fallback_configs[idx]);
});

// ─── Dry-Run Resolver ──────────────────────────────────────────────────
router.get('/ai-routing/resolve', (req: Request, res: Response) => {
    const { workflow, tier = 'Free', env = 'production' } = req.query as any;
    if (!workflow) return res.status(400).json({ error: 'workflow query param required' });

    const resolution = resolveAIRoute(workflow, tier, env);
    const model = (memoryDb.ai_models || []).find((m: any) => m.id === resolution.modelId);
    const provider = (memoryDb.ai_providers || []).find((p: any) => p.id === resolution.providerId);

    return res.json({
        ...resolution,
        modelDisplayName: model?.displayName || resolution.modelSlug,
        providerDisplayName: provider?.displayName || resolution.providerSlug,
        costTier: model?.costTier || 'Unknown',
        performanceTier: model?.performanceTier || 'Unknown',
    });
});

// ─── AI Engine Summary (for Diagnostics) ───────────────────────────────
router.get('/ai-engine/summary', (_req: Request, res: Response) => {
    const providers = memoryDb.ai_providers || [];
    const models = memoryDb.ai_models || [];
    const workflows = memoryDb.ai_workflows || [];
    const rules = memoryDb.ai_routing_rules || [];
    const fallbacks = memoryDb.ai_fallback_configs || [];

    return res.json({
        totalProviders: providers.length,
        activeProviders: providers.filter((p: any) => p.status === 'Active').length,
        totalModels: models.length,
        activeModels: models.filter((m: any) => m.status === 'Active').length,
        totalWorkflows: workflows.length,
        activeWorkflows: workflows.filter((w: any) => w.status === 'Active').length,
        totalRoutingRules: rules.length,
        activeRoutingRules: rules.filter((r: any) => r.status === 'Active').length,
        fallbackConfigsActive: fallbacks.filter((f: any) => f.status === 'Active').length,
        providerStatuses: providers.map((p: any) => ({ displayName: p.displayName, status: p.status, slug: p.slug }))
    });
});

export default router;
