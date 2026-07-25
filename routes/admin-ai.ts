/**
 * AI Admin Routes — Extracted from server.ts
 * Handles: AI providers, models, workflows, routing rules, fallback configs
 * All routes use memoryDb (in-memory store) for CRUD operations.
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
router.get('/providers', providers.list);
router.post('/providers', providers.create);
router.put('/providers/:id', providers.update);
router.delete('/providers/:id', providers.remove);

// ─── AI Models ─────────────────────────────────────────────────────────
router.get('/models', models.list);
router.post('/models', models.create);
router.put('/models/:id', models.update);
router.delete('/models/:id', models.remove);

// ─── AI Workflows ──────────────────────────────────────────────────────
router.get('/workflows', workflows.list);
router.post('/workflows', workflows.create);
router.put('/workflows/:id', workflows.update);
router.delete('/workflows/:id', workflows.remove);

// ─── AI Routing Rules ──────────────────────────────────────────────────
router.get('/routing-rules', rules.list);
router.post('/routing-rules', rules.create);
router.put('/routing-rules/:id', rules.update);
router.delete('/routing-rules/:id', rules.remove);

// ─── AI Fallback Configs ───────────────────────────────────────────────
router.get('/fallback-configs', (_req: Request, res: Response) => {
    res.json(memoryDb.ai_fallback_configs || []);
});

router.put('/fallback-configs/:id', (req: Request, res: Response) => {
    const idx = (memoryDb.ai_fallback_configs || []).findIndex((f: any) => f.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    memoryDb.ai_fallback_configs[idx] = { ...memoryDb.ai_fallback_configs[idx], ...req.body };
    return res.json(memoryDb.ai_fallback_configs[idx]);
});

// ─── Dry-Run Resolver ──────────────────────────────────────────────────
router.get('/routing/resolve', (req: Request, res: Response) => {
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

export default router;
