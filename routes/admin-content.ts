/**
 * Admin Content — Landing, flows, goals, usage modes, glossary, reference images, personas
 * Extracted from server.ts
 */
import { Router, Request, Response } from 'express';
import { getDbPool, isDatabaseConnected, markDatabaseOffline, isConnectionError } from '../db';
import { getFirestore } from 'firebase-admin/firestore';
import crypto from 'crypto';
import { hashPassword, getSettingValue, isValidUuid, getAIClient, resolveAIRoute } from '../admin-helpers';
import {
    DEFAULT_CATEGORIES, DEFAULT_FLOWS, DEFAULT_GOALS, DEFAULT_USAGE_MODES, DEFAULT_PERSONAS,
    DEFAULT_STYLES, DEFAULT_PROMPT_TEMPLATES, DEFAULT_LANGUAGES, DEFAULT_GLOSSARY,
    DEFAULT_VOICES, DEFAULT_SOUNDTRACKS
} from '../admin-constants';

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

router.post('/landing', async (req, res): Promise<any> => {
    try {
        const db = getFirestore();
        await db.collection('app_settings').doc('landing_page_config').set(req.body, { merge: true });
        return res.json({ success: true });
    } catch (e: any) {
        console.error("Failed to update landing config:", e);
        return res.status(500).json({ error: 'Database error' });
    }
});
router.get('/cost-analytics', async (req, res): Promise<any> => {
    try {
        const pool = getDbPool();
        if (!pool) return res.status(500).json({ error: 'DB not connected' });

        const totalCostRes = await pool.query('SELECT SUM(cost_usd_cents) as total FROM ai_cost_analytics');
        const providerCostRes = await pool.query('SELECT provider, SUM(cost_usd_cents) as total FROM ai_cost_analytics GROUP BY provider');
        const userCostRes = await pool.query('SELECT user_email, SUM(cost_usd_cents) as total, COUNT(*) as calls FROM ai_cost_analytics GROUP BY user_email ORDER BY total DESC LIMIT 50');

        return res.json({
            total_cost_cents: totalCostRes.rows[0].total || 0,
            by_provider: providerCostRes.rows,
            by_user: userCostRes.rows
        });
    } catch (e: any) {
        console.error("Cost analytics API error:", e.message);
        return res.status(500).json({ error: e.message });
    }
});
router.get('/flows', async (req, res): Promise<any> => {
    if (!isDatabaseConnected()) return res.json(memoryDb.creator_flows || DEFAULT_FLOWS);
    const pool = getDbPool();
    try {
        const result = await pool.query('SELECT * FROM creator_flows ORDER BY sort_order ASC');
        return res.json(result.rows);
    } catch (e: any) {
        return res.status(500).json({ error: e.message });
    }
});
router.post('/flows', async (req, res): Promise<any> => {
    const { id, slug, title, short_description, best_for, output_hint, related_formats, visibility_state, show_in_onboarding, featured, sort_order } = req.body;
    const itemId = id || crypto.randomUUID();
    const data = {
        id: itemId,
        slug: slug || title.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        title, short_description, best_for, output_hint,
        related_formats: Array.isArray(related_formats) ? related_formats : [],
        visibility_state: visibility_state || 'Active',
        show_in_onboarding: show_in_onboarding ?? true,
        featured: featured ?? false,
        sort_order: sort_order ?? 99
    };

    if (!isDatabaseConnected()) {
        memoryDb.creator_flows.push(data);
        return res.json(data);
    }
    const pool = getDbPool();
    try {
        await pool.query(
            `INSERT INTO creator_flows (id, slug, title, short_description, best_for, output_hint, related_formats, visibility_state, show_in_onboarding, featured, sort_order)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
            [
                data.id, data.slug, data.title, data.short_description, data.best_for, data.output_hint,
                JSON.stringify(data.related_formats), data.visibility_state, data.show_in_onboarding,
                data.featured, data.sort_order
            ]
        );
        return res.json(data);
    } catch (e: any) {
        return res.status(500).json({ error: e.message });
    }
});
router.put('/flows/:id', async (req, res): Promise<any> => {
    const id = req.params.id;
    const updateFields = req.body;

    if (updateFields.related_formats && Array.isArray(updateFields.related_formats)) {
        updateFields.related_formats = JSON.stringify(updateFields.related_formats);
    }

    if (!isDatabaseConnected()) {
        const idx = memoryDb.creator_flows.findIndex((item: any) => item.id === id);
        if (idx !== -1) {
            memoryDb.creator_flows[idx] = { ...memoryDb.creator_flows[idx], ...req.body };
        }
        return res.json({ success: true });
    }
    const pool = getDbPool();
    try {
        const fields: string[] = [];
        const values: any[] = [];
        let i = 1;
        Object.keys(updateFields).forEach((key) => {
            if (key !== 'id') {
                fields.push(`${key} = $${i}`);
                values.push(updateFields[key]);
                i++;
            }
        });
        values.push(id);
        await pool.query(`UPDATE creator_flows SET ${fields.join(', ')} WHERE id = $${i}`, values);
        return res.json({ success: true });
    } catch (e: any) {
        return res.status(500).json({ error: e.message });
    }
});
router.delete('/flows/:id', async (req, res): Promise<any> => {
    const id = req.params.id;
    if (!isDatabaseConnected()) {
        memoryDb.creator_flows = memoryDb.creator_flows.filter((item: any) => item.id !== id);
        return res.json({ success: true });
    }
    const pool = getDbPool();
    try {
        await pool.query('DELETE FROM creator_flows WHERE id = $1', [id]);
        return res.json({ success: true });
    } catch (e: any) {
        return res.status(500).json({ error: e.message });
    }
});
router.get('/goals', async (req, res): Promise<any> => {
    if (!isDatabaseConnected()) return res.json(memoryDb.story_goals || DEFAULT_GOALS);
    const pool = getDbPool();
    try {
        const result = await pool.query('SELECT * FROM story_goals ORDER BY sort_order ASC');
        return res.json(result.rows);
    } catch (e: any) {
        return res.status(500).json({ error: e.message });
    }
});
router.post('/goals', async (req, res): Promise<any> => {
    const { id, slug, title, short_description, category, tags, related_formats, related_creator_flows, importance, visibility_state, show_in_wizard, show_in_homeschool, show_in_teacher_flows, featured, sort_order } = req.body;
    const itemId = id || crypto.randomUUID();
    const data = {
        id: itemId,
        slug: slug || title.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        title, short_description,
        category: category || 'General',
        tags: Array.isArray(tags) ? tags : [],
        related_formats: Array.isArray(related_formats) ? related_formats : [],
        related_creator_flows: Array.isArray(related_creator_flows) ? related_creator_flows : [],
        importance: importance || 'Primary',
        visibility_state: visibility_state || 'Active',
        show_in_wizard: show_in_wizard ?? true,
        show_in_homeschool: show_in_homeschool ?? true,
        show_in_teacher_flows: show_in_teacher_flows ?? true,
        featured: featured ?? false,
        sort_order: sort_order ?? 99
    };

    if (!isDatabaseConnected()) {
        memoryDb.story_goals.push(data);
        return res.json(data);
    }
    const pool = getDbPool();
    try {
        await pool.query(
            `INSERT INTO story_goals (id, slug, title, short_description, category, tags, related_formats, related_creator_flows, importance, visibility_state, show_in_wizard, show_in_homeschool, show_in_teacher_flows, featured, sort_order)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
            [
                data.id, data.slug, data.title, data.short_description, data.category,
                JSON.stringify(data.tags), JSON.stringify(data.related_formats), JSON.stringify(data.related_creator_flows),
                data.importance, data.visibility_state, data.show_in_wizard, data.show_in_homeschool,
                data.show_in_teacher_flows, data.featured, data.sort_order
            ]
        );
        return res.json(data);
    } catch (e: any) {
        return res.status(500).json({ error: e.message });
    }
});
router.put('/goals/:id', async (req, res): Promise<any> => {
    const id = req.params.id;
    const updateFields = req.body;

    if (updateFields.tags && Array.isArray(updateFields.tags)) {
        updateFields.tags = JSON.stringify(updateFields.tags);
    }
    if (updateFields.related_formats && Array.isArray(updateFields.related_formats)) {
        updateFields.related_formats = JSON.stringify(updateFields.related_formats);
    }
    if (updateFields.related_creator_flows && Array.isArray(updateFields.related_creator_flows)) {
        updateFields.related_creator_flows = JSON.stringify(updateFields.related_creator_flows);
    }

    if (!isDatabaseConnected()) {
        const idx = memoryDb.story_goals.findIndex((item: any) => item.id === id);
        if (idx !== -1) {
            memoryDb.story_goals[idx] = { ...memoryDb.story_goals[idx], ...req.body };
        }
        return res.json({ success: true });
    }
    const pool = getDbPool();
    try {
        const fields: string[] = [];
        const values: any[] = [];
        let i = 1;
        Object.keys(updateFields).forEach((key) => {
            if (key !== 'id') {
                fields.push(`${key} = $${i}`);
                values.push(updateFields[key]);
                i++;
            }
        });
        values.push(id);
        await pool.query(`UPDATE story_goals SET ${fields.join(', ')} WHERE id = $${i}`, values);
        return res.json({ success: true });
    } catch (e: any) {
        return res.status(500).json({ error: e.message });
    }
});
router.delete('/goals/:id', async (req, res): Promise<any> => {
    const id = req.params.id;
    if (!isDatabaseConnected()) {
        memoryDb.story_goals = memoryDb.story_goals.filter((item: any) => item.id !== id);
        return res.json({ success: true });
    }
    const pool = getDbPool();
    try {
        await pool.query('DELETE FROM story_goals WHERE id = $1', [id]);
        return res.json({ success: true });
    } catch (e: any) {
        return res.status(500).json({ error: e.message });
    }
});
router.get('/usage-modes', async (req, res): Promise<any> => {
    if (!isDatabaseConnected()) return res.json(memoryDb.usage_modes || DEFAULT_USAGE_MODES);
    const pool = getDbPool();
    try {
        const result = await pool.query("SELECT * FROM usage_modes ORDER BY sortOrder ASC");
        return res.json(result.rows);
    } catch (e: any) {
        return res.status(500).json({ error: e.message });
    }
});
router.post('/usage-modes', async (req, res): Promise<any> => {
    const { label, slug, shortDescription, generationBehaviorHint, safetyNotes, visibleInWizard, sortOrder, status } = req.body;
    const id = crypto.randomUUID();
    const data = {
        id,
        slug: slug || label.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        label, shortDescription, generationBehaviorHint, safetyNotes,
        visibleInWizard: visibleInWizard ?? true,
        sortOrder: sortOrder ?? 99,
        status: status || 'Active'
    };
    if (!isDatabaseConnected()) {
        memoryDb.usage_modes = memoryDb.usage_modes || [];
        memoryDb.usage_modes.push(data);
        return res.json(data);
    }
    const pool = getDbPool();
    try {
        await pool.query(
            `INSERT INTO usage_modes (id, slug, label, shortDescription, generationBehaviorHint, safetyNotes, visibleInWizard, sortOrder, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [data.id, data.slug, data.label, data.shortDescription, data.generationBehaviorHint, data.safetyNotes, data.visibleInWizard, data.sortOrder, data.status]
        );
        return res.json(data);
    } catch (e: any) {
        return res.status(500).json({ error: e.message });
    }
});
router.put('/usage-modes/:id', async (req, res): Promise<any> => {
    const id = req.params.id;
    const updateFields = req.body;
    if (!isDatabaseConnected()) {
        memoryDb.usage_modes = memoryDb.usage_modes || [];
        const index = memoryDb.usage_modes.findIndex((m: any) => m.id === id);
        if (index !== -1) {
            memoryDb.usage_modes[index] = { ...memoryDb.usage_modes[index], ...updateFields };
            return res.json(memoryDb.usage_modes[index]);
        }
        return res.status(404).json({ error: 'Not found' });
    }
    const pool = getDbPool();
    try {
        const fields: string[] = [];
        const values: any[] = [];
        let i = 1;
        Object.keys(updateFields).forEach(key => {
            if (key === 'id') return;
            fields.push(`${key} = $${i++}`);
            values.push(updateFields[key]);
        });
        values.push(id);
        await pool.query(`UPDATE usage_modes SET ${fields.join(', ')} WHERE id = $${i}`, values);
        return res.json({ success: true });
    } catch (e: any) {
        return res.status(500).json({ error: e.message });
    }
});
router.get('/reference-images', async (req, res): Promise<any> => {
    if (!isDatabaseConnected()) return res.json(memoryDb.reference_images || []);
    const pool = getDbPool();
    try {
        const result = await pool.query("SELECT * FROM reference_images ORDER BY createdAt DESC");
        return res.json(result.rows);
    } catch (e: any) {
        return res.status(500).json({ error: e.message });
    }
});
router.get('/glossary', async (req, res): Promise<any> => {
    if (!isDatabaseConnected()) return res.json(memoryDb.glossary_entries || DEFAULT_GLOSSARY);
    const pool = getDbPool();
    try {
        const result = await pool.query("SELECT * FROM glossary_entries ORDER BY sortOrder ASC");
        return res.json(result.rows);
    } catch (e: any) {
        return res.status(500).json({ error: e.message });
    }
});
router.post('/glossary', async (req, res): Promise<any> => {
    const body = req.body;
    const id = crypto.randomUUID();
    const data = {
        id, slug: body.slug || body.sourceTerm.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        sourceTerm: body.sourceTerm, preferredTranslation: body.preferredTranslation,
        sourceLanguageCode: body.sourceLanguageCode, targetLanguageCode: body.targetLanguageCode,
        termType: body.termType || 'Name', preserveTerm: body.preserveTerm ?? true,
        scopeType: body.scopeType || 'Global', internalTestingOnly: body.internalTestingOnly ?? false,
        status: body.status || 'Active', sortOrder: body.sortOrder ?? 99
    };
    if (!isDatabaseConnected()) {
        memoryDb.glossary_entries.push(data);
        return res.json(data);
    }
    const pool = getDbPool();
    try {
        await pool.query(
            `INSERT INTO glossary_entries (id, slug, sourceTerm, preferredTranslation, sourceLanguageCode, targetLanguageCode, termType, preserveTerm, scopeType, internalTestingOnly, status, sortOrder)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
            [data.id, data.slug, data.sourceTerm, data.preferredTranslation, data.sourceLanguageCode, data.targetLanguageCode, data.termType, data.preserveTerm, data.scopeType, data.internalTestingOnly, data.status, data.sortOrder]
        );
        return res.json(data);
    } catch (e: any) {
        return res.status(500).json({ error: e.message });
    }
});
router.put('/glossary/:id', async (req, res): Promise<any> => {
    const id = req.params.id;
    const updateFields = req.body;
    if (!isDatabaseConnected()) {
        const index = memoryDb.glossary_entries.findIndex((g: any) => g.id === id);
        if (index !== -1) {
            memoryDb.glossary_entries[index] = { ...memoryDb.glossary_entries[index], ...updateFields };
            return res.json(memoryDb.glossary_entries[index]);
        }
        return res.status(404).json({ error: 'Not found' });
    }
    const pool = getDbPool();
    try {
        const fields: string[] = [];
        const values: any[] = [];
        let i = 1;
        Object.keys(updateFields).forEach(key => {
            if (key === 'id') return;
            fields.push(`${key} = $${i++}`);
            values.push(updateFields[key]);
        });
        values.push(id);
        await pool.query(`UPDATE glossary_entries SET ${fields.join(', ')} WHERE id = $${i}`, values);
        return res.json({ success: true });
    } catch (e: any) {
        return res.status(500).json({ error: e.message });
    }
});
router.delete('/glossary/:id', async (req, res): Promise<any> => {
    const id = req.params.id;
    if (!isDatabaseConnected()) {
        memoryDb.glossary_entries = memoryDb.glossary_entries.filter((g: any) => g.id !== id);
        return res.json({ success: true });
    }
    const pool = getDbPool();
    try {
        await pool.query('DELETE FROM glossary_entries WHERE id = $1', [id]);
        return res.json({ success: true });
    } catch (e: any) {
        return res.status(500).json({ error: e.message });
    }
});
router.put('/reference-images/:id', async (req, res): Promise<any> => {
    const id = req.params.id;
    const updateFields = req.body;
    if (!isDatabaseConnected()) {
        memoryDb.reference_images = memoryDb.reference_images || [];
        const index = memoryDb.reference_images.findIndex((img: any) => img.id === id);
        if (index !== -1) {
            memoryDb.reference_images[index] = { ...memoryDb.reference_images[index], ...updateFields };
            return res.json(memoryDb.reference_images[index]);
        }
        return res.status(404).json({ error: 'Not found' });
    }
    const pool = getDbPool();
    try {
        const fields: string[] = [];
        const values: any[] = [];
        let i = 1;
        Object.keys(updateFields).forEach(key => {
            if (key === 'id') return;
            fields.push(`${key} = $${i++}`);
            values.push(updateFields[key]);
        });
        values.push(id);
        await pool.query(`UPDATE reference_images SET ${fields.join(', ')} WHERE id = $${i}`, values);
        return res.json({ success: true });
    } catch (e: any) {
        return res.status(500).json({ error: e.message });
    }
});
export default router;
