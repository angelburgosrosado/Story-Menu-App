/**
 * Admin Content Routes — Extracted from server.ts
 * Handles: personas, glossary, usage modes, cost analytics, landing config
 */

import { Router, Request, Response } from 'express';
import { getDbPool, isDatabaseConnected, markDatabaseOffline } from '../db';
import { isConnectionError } from '../db';

const router = Router();
let memoryDb: any = {};
export function setMemoryDb(db: any) { memoryDb = db; }

// ─── Personas ──────────────────────────────────────────────────────────

router.get('/personas', async (_req: Request, res: Response) => {
    if (!isDatabaseConnected()) return res.json(memoryDb.personas || []);
    try {
        const pool = getDbPool();
        await pool.query(`CREATE TABLE IF NOT EXISTS personas (
            id SERIAL PRIMARY KEY, slug VARCHAR(100) UNIQUE, title VARCHAR(255),
            description TEXT, icon VARCHAR(10), traits JSONB, is_default BOOLEAN DEFAULT false,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);
        const result = await pool.query('SELECT * FROM personas ORDER BY created_at ASC');
        return res.json(result.rows.map(r => ({
            id: r.id.toString(), slug: r.slug, title: r.title, description: r.description,
            icon: r.icon, traits: r.traits, isDefault: r.is_default
        })));
    } catch { return res.json(memoryDb.personas || []); }
});

router.post('/personas', async (req: Request, res: Response) => {
    const { slug, title, description, icon, traits, isDefault } = req.body;
    if (!isDatabaseConnected()) {
        memoryDb.personas = memoryDb.personas || [];
        const p = { id: Date.now().toString(), slug, title, description, icon, traits, isDefault };
        memoryDb.personas.push(p);
        return res.json(p);
    }
    try {
        const pool = getDbPool();
        await pool.query(`CREATE TABLE IF NOT EXISTS personas (
            id SERIAL PRIMARY KEY, slug VARCHAR(100) UNIQUE, title VARCHAR(255),
            description TEXT, icon VARCHAR(10), traits JSONB, is_default BOOLEAN DEFAULT false, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);
        const result = await pool.query(
            `INSERT INTO personas (slug, title, description, icon, traits, is_default) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
            [slug, title, description, icon, JSON.stringify(traits || []), isDefault || false]
        );
        return res.json({ id: result.rows[0].id.toString(), ...result.rows[0] });
    } catch (e: any) { return res.status(500).json({ error: e.message }); }
});

router.put('/personas/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    const { slug, title, description, icon, traits, isDefault } = req.body;
    if (!isDatabaseConnected()) {
        const p = (memoryDb.personas || []).find((p: any) => p.id === id);
        if (p) Object.assign(p, { slug, title, description, icon, traits, isDefault });
        return res.json({ success: true });
    }
    try {
        const pool = getDbPool();
        await pool.query(`UPDATE personas SET slug=$1, title=$2, description=$3, icon=$4, traits=$5, is_default=$6 WHERE id=$7`,
            [slug, title, description, icon, JSON.stringify(traits || []), isDefault || false, id]);
        return res.json({ success: true });
    } catch (e: any) { return res.status(500).json({ error: e.message }); }
});

router.delete('/personas/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!isDatabaseConnected()) { memoryDb.personas = (memoryDb.personas || []).filter((p: any) => p.id !== id); return res.json({ success: true }); }
    try { await getDbPool().query('DELETE FROM personas WHERE id = $1', [id]); return res.json({ success: true }); }
    catch (e: any) { return res.status(500).json({ error: e.message }); }
});

// ─── Glossary ──────────────────────────────────────────────────────────

router.get('/glossary', async (_req: Request, res: Response) => {
    if (!isDatabaseConnected()) return res.json(memoryDb.glossary || []);
    try {
        const pool = getDbPool();
        await pool.query(`CREATE TABLE IF NOT EXISTS glossary (
            id SERIAL PRIMARY KEY, term VARCHAR(255), definition TEXT, category VARCHAR(100),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);
        const result = await pool.query('SELECT * FROM glossary ORDER BY term ASC');
        return res.json(result.rows.map(r => ({ id: r.id.toString(), term: r.term, definition: r.definition, category: r.category })));
    } catch { return res.json(memoryDb.glossary || []); }
});

router.post('/glossary', async (req: Request, res: Response) => {
    const { term, definition, category } = req.body;
    if (!isDatabaseConnected()) {
        memoryDb.glossary = memoryDb.glossary || [];
        const g = { id: Date.now().toString(), term, definition, category };
        memoryDb.glossary.push(g);
        return res.json(g);
    }
    try {
        const pool = getDbPool();
        await pool.query(`CREATE TABLE IF NOT EXISTS glossary (id SERIAL PRIMARY KEY, term VARCHAR(255), definition TEXT, category VARCHAR(100), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
        const result = await pool.query('INSERT INTO glossary (term, definition, category) VALUES ($1,$2,$3) RETURNING *', [term, definition, category]);
        return res.json({ id: result.rows[0].id.toString(), ...result.rows[0] });
    } catch (e: any) { return res.status(500).json({ error: e.message }); }
});

router.put('/glossary/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    const { term, definition, category } = req.body;
    if (!isDatabaseConnected()) { const g = (memoryDb.glossary || []).find((g: any) => g.id === id); if (g) Object.assign(g, { term, definition, category }); return res.json({ success: true }); }
    try { await getDbPool().query('UPDATE glossary SET term=$1, definition=$2, category=$3 WHERE id=$4', [term, definition, category, id]); return res.json({ success: true }); }
    catch (e: any) { return res.status(500).json({ error: e.message }); }
});

router.delete('/glossary/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!isDatabaseConnected()) { memoryDb.glossary = (memoryDb.glossary || []).filter((g: any) => g.id !== id); return res.json({ success: true }); }
    try { await getDbPool().query('DELETE FROM glossary WHERE id = $1', [id]); return res.json({ success: true }); }
    catch (e: any) { return res.status(500).json({ error: e.message }); }
});

// ─── Usage Modes ───────────────────────────────────────────────────────

router.get('/usage-modes', async (_req: Request, res: Response) => {
    if (!isDatabaseConnected()) return res.json(memoryDb.usage_modes || []);
    try {
        const pool = getDbPool();
        await pool.query(`CREATE TABLE IF NOT EXISTS usage_modes (
            id SERIAL PRIMARY KEY, slug VARCHAR(100) UNIQUE, title VARCHAR(255),
            description TEXT, icon VARCHAR(10), features JSONB, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);
        const result = await pool.query('SELECT * FROM usage_modes ORDER BY created_at ASC');
        return res.json(result.rows.map(r => ({ id: r.id.toString(), slug: r.slug, title: r.title, description: r.description, icon: r.icon, features: r.features })));
    } catch { return res.json(memoryDb.usage_modes || []); }
});

router.post('/usage-modes', async (req: Request, res: Response) => {
    const { slug, title, description, icon, features } = req.body;
    if (!isDatabaseConnected()) {
        memoryDb.usage_modes = memoryDb.usage_modes || [];
        const m = { id: Date.now().toString(), slug, title, description, icon, features };
        memoryDb.usage_modes.push(m);
        return res.json(m);
    }
    try {
        const pool = getDbPool();
        await pool.query(`CREATE TABLE IF NOT EXISTS usage_modes (id SERIAL PRIMARY KEY, slug VARCHAR(100) UNIQUE, title VARCHAR(255), description TEXT, icon VARCHAR(10), features JSONB, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
        const result = await pool.query('INSERT INTO usage_modes (slug, title, description, icon, features) VALUES ($1,$2,$3,$4,$5) RETURNING *',
            [slug, title, description, icon, JSON.stringify(features || [])]);
        return res.json({ id: result.rows[0].id.toString(), ...result.rows[0] });
    } catch (e: any) { return res.status(500).json({ error: e.message }); }
});

router.put('/usage-modes/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    const { slug, title, description, icon, features } = req.body;
    if (!isDatabaseConnected()) { const m = (memoryDb.usage_modes || []).find((m: any) => m.id === id); if (m) Object.assign(m, { slug, title, description, icon, features }); return res.json({ success: true }); }
    try { await getDbPool().query('UPDATE usage_modes SET slug=$1, title=$2, description=$3, icon=$4, features=$5 WHERE id=$6',
        [slug, title, description, icon, JSON.stringify(features || []), id]); return res.json({ success: true }); }
    catch (e: any) { return res.status(500).json({ error: e.message }); }
});

// ─── Cost Analytics ────────────────────────────────────────────────────

router.get('/cost-analytics', async (_req: Request, res: Response) => {
    if (!isDatabaseConnected()) return res.json({ totals: { tokensIn: 0, tokensOut: 0, totalCostUsd: 0 }, logs: [] });
    try {
        const pool = getDbPool();
        const totalsRes = await pool.query('SELECT SUM(tokens_in) as total_in, SUM(tokens_out) as total_out, SUM(cost_usd) as total_cost FROM ai_usage_logs');
        const logsRes = await pool.query('SELECT user_email, operation, model, tokens_in, tokens_out, cost_usd, created_at FROM ai_usage_logs ORDER BY created_at DESC LIMIT 100');
        return res.json({
            totals: { tokensIn: parseInt(totalsRes.rows[0]?.total_in || '0'), tokensOut: parseInt(totalsRes.rows[0]?.total_out || '0'), totalCostUsd: parseFloat(totalsRes.rows[0]?.total_cost || '0') },
            logs: logsRes.rows
        });
    } catch { return res.json({ totals: { tokensIn: 0, tokensOut: 0, totalCostUsd: 0 }, logs: [] }); }
});

// ─── Landing Config ────────────────────────────────────────────────────

router.get('/landing', async (_req: Request, res: Response) => {
    if (!isDatabaseConnected()) return res.json(memoryDb.landing_config || {});
    try {
        const pool = getDbPool();
        await pool.query(`CREATE TABLE IF NOT EXISTS landing_config (key VARCHAR(100) PRIMARY KEY, value JSONB, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
        const result = await pool.query('SELECT * FROM landing_config');
        const config: any = {};
        result.rows.forEach(r => { config[r.key] = r.value; });
        return res.json(config);
    } catch { return res.json(memoryDb.landing_config || {}); }
});

router.post('/landing', async (req: Request, res: Response) => {
    const { key, value } = req.body;
    if (!key) return res.status(400).json({ error: 'key required' });
    if (!isDatabaseConnected()) {
        memoryDb.landing_config = memoryDb.landing_config || {};
        memoryDb.landing_config[key] = value;
        return res.json({ success: true });
    }
    try {
        const pool = getDbPool();
        await pool.query(`CREATE TABLE IF NOT EXISTS landing_config (key VARCHAR(100) PRIMARY KEY, value JSONB, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
        await pool.query('INSERT INTO landing_config (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP',
            [key, JSON.stringify(value)]);
        return res.json({ success: true });
    } catch (e: any) { return res.status(500).json({ error: e.message }); }
});

export default router;
