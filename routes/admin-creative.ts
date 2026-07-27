/**
 * Admin Creative — Voices, soundtracks, languages, styles, prompt templates, categories
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

router.get('/voices', async (req, res): Promise<any> => {
    if (!isDatabaseConnected()) return res.json(memoryDb.voices || DEFAULT_VOICES);
    const pool = getDbPool();
    try {
        const result = await pool.query("SELECT * FROM voices ORDER BY sortOrder ASC");
        const rows = result.rows.map(r => ({
            ...r,
            languageCodes: typeof r.languageCodes === 'string' ? JSON.parse(r.languageCodes) : r.languageCodes
        }));
        return res.json(rows);
    } catch (e: any) {
        return res.status(500).json({ error: e.message });
    }
});
router.post('/voices', async (req, res): Promise<any> => {
    const body = req.body;
    const id = crypto.randomUUID();
    const data = {
        id, slug: body.slug || body.displayName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        displayName: body.displayName, providerId: body.providerId || 'elevenlabs-voice-sim',
        modelId: body.modelId || 'eleven_monolingual_v1',
        languageCodes: Array.isArray(body.languageCodes) ? body.languageCodes : [body.primaryLanguageCode],
        primaryLanguageCode: body.primaryLanguageCode || 'en-US',
        accentLabel: body.accentLabel || '', toneLabel: body.toneLabel || '',
        ageDescriptor: body.ageDescriptor || 'Adult', narratorSuitability: body.narratorSuitability ?? true,
        childSafe: body.childSafe ?? true, classroomSafe: body.classroomSafe ?? true,
        supportsBilingualWorkflows: body.supportsBilingualWorkflows ?? false,
        visibleInStudio: body.visibleInStudio ?? true, visibleInKidStory: body.visibleInKidStory ?? true,
        visibleInComicStudio: body.visibleInComicStudio ?? true, visibleInTeacherFlow: body.visibleInTeacherFlow ?? true,
        visibleInHomeschool: body.visibleInHomeschool ?? true, internalTestingOnly: body.internalTestingOnly ?? false,
        status: body.status || 'Active', featured: body.featured ?? false, sortOrder: body.sortOrder ?? 99
    };
    if (!isDatabaseConnected()) {
        memoryDb.voices.push(data);
        return res.json(data);
    }
    const pool = getDbPool();
    try {
        await pool.query(
            `INSERT INTO voices (id, slug, displayName, providerId, modelId, languageCodes, primaryLanguageCode, accentLabel, toneLabel, ageDescriptor, narratorSuitability, childSafe, classroomSafe, supportsBilingualWorkflows, visibleInStudio, visibleInKidStory, visibleInComicStudio, visibleInTeacherFlow, visibleInHomeschool, internalTestingOnly, status, featured, sortOrder)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)`,
            [data.id, data.slug, data.displayName, data.providerId, data.modelId, JSON.stringify(data.languageCodes), data.primaryLanguageCode, data.accentLabel, data.toneLabel, data.ageDescriptor, data.narratorSuitability, data.childSafe, data.classroomSafe, data.supportsBilingualWorkflows, data.visibleInStudio, data.visibleInKidStory, data.visibleInComicStudio, data.visibleInTeacherFlow, data.visibleInHomeschool, data.internalTestingOnly, data.status, data.featured, data.sortOrder]
        );
        return res.json(data);
    } catch (e: any) {
        return res.status(500).json({ error: e.message });
    }
});
router.put('/voices/:id', async (req, res): Promise<any> => {
    const id = req.params.id;
    const updateFields = req.body;
    if (!isDatabaseConnected()) {
        const index = memoryDb.voices.findIndex((v: any) => v.id === id);
        if (index !== -1) {
            memoryDb.voices[index] = { ...memoryDb.voices[index], ...updateFields };
            return res.json(memoryDb.voices[index]);
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
            if (key === 'languageCodes') {
                fields.push(`languageCodes = $${i++}`);
                values.push(JSON.stringify(updateFields[key]));
            } else {
                fields.push(`${key} = $${i++}`);
                values.push(updateFields[key]);
            }
        });
        values.push(id);
        await pool.query(`UPDATE voices SET ${fields.join(', ')} WHERE id = $${i}`, values);
        return res.json({ success: true });
    } catch (e: any) {
        return res.status(500).json({ error: e.message });
    }
});
router.delete('/voices/:id', async (req, res): Promise<any> => {
    const id = req.params.id;
    if (!isDatabaseConnected()) {
        memoryDb.voices = memoryDb.voices.filter((v: any) => v.id !== id);
        return res.json({ success: true });
    }
    const pool = getDbPool();
    try {
        await pool.query('DELETE FROM voices WHERE id = $1', [id]);
        return res.json({ success: true });
    } catch (e: any) {
        return res.status(500).json({ error: e.message });
    }
});
router.get('/soundtracks', async (req, res): Promise<any> => {
    if (!isDatabaseConnected()) return res.json(memoryDb.soundtrack_items || DEFAULT_SOUNDTRACKS);
    const pool = getDbPool();
    try {
        const result = await pool.query("SELECT * FROM soundtrack_items ORDER BY sortOrder ASC");
        return res.json(result.rows);
    } catch (e: any) {
        return res.status(500).json({ error: e.message });
    }
});
router.post('/soundtracks', async (req, res): Promise<any> => {
    const body = req.body;
    const id = crypto.randomUUID();
    const data = {
        id, slug: body.slug || body.title.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        title: body.title, category: body.category || 'Soundtrack', mood: body.mood || '',
        educationalSuitability: body.educationalSuitability ?? true,
        familySuitability: body.familySuitability ?? true, classroomSuitability: body.classroomSuitability ?? true,
        languageNeutral: body.languageNeutral ?? true, status: body.status || 'Active',
        internalTestingOnly: body.internalTestingOnly ?? false, sortOrder: body.sortOrder ?? 99
    };
    if (!isDatabaseConnected()) {
        memoryDb.soundtrack_items.push(data);
        return res.json(data);
    }
    const pool = getDbPool();
    try {
        await pool.query(
            `INSERT INTO soundtrack_items (id, slug, title, category, mood, educationalSuitability, familySuitability, classroomSuitability, languageNeutral, status, internalTestingOnly, sortOrder)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
            [data.id, data.slug, data.title, data.category, data.mood, data.educationalSuitability, data.familySuitability, data.classroomSuitability, data.languageNeutral, data.status, data.internalTestingOnly, data.sortOrder]
        );
        return res.json(data);
    } catch (e: any) {
        return res.status(500).json({ error: e.message });
    }
});
router.put('/soundtracks/:id', async (req, res): Promise<any> => {
    const id = req.params.id;
    const updateFields = req.body;
    if (!isDatabaseConnected()) {
        const index = memoryDb.soundtrack_items.findIndex((s: any) => s.id === id);
        if (index !== -1) {
            memoryDb.soundtrack_items[index] = { ...memoryDb.soundtrack_items[index], ...updateFields };
            return res.json(memoryDb.soundtrack_items[index]);
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
        await pool.query(`UPDATE soundtrack_items SET ${fields.join(', ')} WHERE id = $${i}`, values);
        return res.json({ success: true });
    } catch (e: any) {
        return res.status(500).json({ error: e.message });
    }
});
router.delete('/soundtracks/:id', async (req, res): Promise<any> => {
    const id = req.params.id;
    if (!isDatabaseConnected()) {
        memoryDb.soundtrack_items = memoryDb.soundtrack_items.filter((s: any) => s.id !== id);
        return res.json({ success: true });
    }
    const pool = getDbPool();
    try {
        await pool.query('DELETE FROM soundtrack_items WHERE id = $1', [id]);
        return res.json({ success: true });
    } catch (e: any) {
        return res.status(500).json({ error: e.message });
    }
});
router.get('/languages', async (req, res): Promise<any> => {
    if (!isDatabaseConnected()) return res.json(memoryDb.languages || DEFAULT_LANGUAGES);
    const pool = getDbPool();
    try {
        const result = await pool.query("SELECT * FROM languages ORDER BY sortOrder ASC");
        return res.json(result.rows);
    } catch (e: any) {
        return res.status(500).json({ error: e.message });
    }
});
router.post('/languages', async (req, res): Promise<any> => {
    const body = req.body;
    const id = crypto.randomUUID();
    const data = {
        id, code: body.code, slug: body.slug || body.displayName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        displayName: body.displayName, nativeName: body.nativeName, direction: body.direction || 'ltr',
        status: body.status || 'Active', visibleInStudio: body.visibleInStudio ?? true,
        visibleInKidStory: body.visibleInKidStory ?? true, visibleInComicStudio: body.visibleInComicStudio ?? true,
        visibleInTeacherFlow: body.visibleInTeacherFlow ?? true, visibleInHomeschool: body.visibleInHomeschool ?? true,
        supportsBilingual: body.supportsBilingual ?? true, supportsNarration: body.supportsNarration ?? true,
        supportsTranslation: body.supportsTranslation ?? true, internalTestingOnly: body.internalTestingOnly ?? false,
        educationalNotes: body.educationalNotes || '', sortOrder: body.sortOrder ?? 99, featured: body.featured ?? false
    };
    if (!isDatabaseConnected()) {
        memoryDb.languages.push(data);
        return res.json(data);
    }
    const pool = getDbPool();
    try {
        await pool.query(
            `INSERT INTO languages (id, code, slug, displayName, nativeName, direction, status, visibleInStudio, visibleInKidStory, visibleInComicStudio, visibleInTeacherFlow, visibleInHomeschool, supportsBilingual, supportsNarration, supportsTranslation, internalTestingOnly, educationalNotes, sortOrder, featured)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)`,
            [data.id, data.code, data.slug, data.displayName, data.nativeName, data.direction, data.status, data.visibleInStudio, data.visibleInKidStory, data.visibleInComicStudio, data.visibleInTeacherFlow, data.visibleInHomeschool, data.supportsBilingual, data.supportsNarration, data.supportsTranslation, data.internalTestingOnly, data.educationalNotes, data.sortOrder, data.featured]
        );
        return res.json(data);
    } catch (e: any) {
        return res.status(500).json({ error: e.message });
    }
});
router.put('/languages/:id', async (req, res): Promise<any> => {
    const id = req.params.id;
    const updateFields = req.body;
    if (!isDatabaseConnected()) {
        const index = memoryDb.languages.findIndex((l: any) => l.id === id);
        if (index !== -1) {
            memoryDb.languages[index] = { ...memoryDb.languages[index], ...updateFields };
            return res.json(memoryDb.languages[index]);
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
        await pool.query(`UPDATE languages SET ${fields.join(', ')} WHERE id = $${i}`, values);
        return res.json({ success: true });
    } catch (e: any) {
        return res.status(500).json({ error: e.message });
    }
});
router.delete('/languages/:id', async (req, res): Promise<any> => {
    const id = req.params.id;
    if (!isDatabaseConnected()) {
        memoryDb.languages = memoryDb.languages.filter((l: any) => l.id !== id);
        return res.json({ success: true });
    }
    const pool = getDbPool();
    try {
        await pool.query('DELETE FROM languages WHERE id = $1', [id]);
        return res.json({ success: true });
    } catch (e: any) {
        return res.status(500).json({ error: e.message });
    }
});
router.get('/styles', async (req, res): Promise<any> => {
    if (!isDatabaseConnected()) return res.json(memoryDb.styles || DEFAULT_STYLES);
    const pool = getDbPool();
    try {
        const result = await pool.query("SELECT * FROM styles ORDER BY sortOrder ASC");
        return res.json(result.rows);
    } catch (e: any) {
        return res.status(500).json({ error: e.message });
    }
});
router.post('/styles', async (req, res): Promise<any> => {
    const body = req.body;
    const id = crypto.randomUUID();
    const data = {
        id, slug: body.slug || body.title.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        title: body.title, shortDescription: body.shortDescription, longDescription: body.longDescription,
        visualMood: body.visualMood, audienceTags: body.audienceTags || [], useCaseTags: body.useCaseTags || [],
        styleFamily: body.styleFamily, recommendationTags: body.recommendationTags || [], visibleInStudio: body.visibleInStudio ?? true,
        visibleInHomeschool: body.visibleInHomeschool ?? true, visibleInTeacherFlow: body.visibleInTeacherFlow ?? true,
        visibilityState: body.visibilityState || 'Active', featured: body.featured ?? false, sortOrder: body.sortOrder ?? 99,
        internalTestingOnly: body.internalTestingOnly ?? false, artworkReference: body.artworkReference || ''
    };
    if (!isDatabaseConnected()) {
        memoryDb.styles.push(data);
        return res.json(data);
    }
    const pool = getDbPool();
    try {
        await pool.query(
            `INSERT INTO styles (id, slug, title, shortDescription, longDescription, visualMood, audienceTags, useCaseTags, styleFamily, recommendationTags, visibleInStudio, visibleInHomeschool, visibleInTeacherFlow, visibilityState, featured, sortOrder, internalTestingOnly, artworkReference)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)`,
            [data.id, data.slug, data.title, data.shortDescription, data.longDescription, data.visualMood, JSON.stringify(data.audienceTags), JSON.stringify(data.useCaseTags), data.styleFamily, JSON.stringify(data.recommendationTags), data.visibleInStudio, data.visibleInHomeschool, data.visibleInTeacherFlow, data.visibilityState, data.featured, data.sortOrder, data.internalTestingOnly, data.artworkReference]
        );
        return res.json(data);
    } catch (e: any) {
        return res.status(500).json({ error: e.message });
    }
});
router.put('/styles/:id', async (req, res): Promise<any> => {
    const id = req.params.id;
    const updateFields = req.body;
    if (!isDatabaseConnected()) {
        const index = memoryDb.styles.findIndex((s: any) => s.id === id);
        if (index !== -1) {
            memoryDb.styles[index] = { ...memoryDb.styles[index], ...updateFields };
            return res.json(memoryDb.styles[index]);
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
            let val = updateFields[key];
            if (Array.isArray(val)) val = JSON.stringify(val);
            fields.push(`${key} = $${i++}`);
            values.push(val);
        });
        values.push(id);
        await pool.query(`UPDATE styles SET ${fields.join(', ')} WHERE id = $${i}`, values);
        return res.json({ success: true });
    } catch (e: any) {
        return res.status(500).json({ error: e.message });
    }
});
router.delete('/styles/:id', async (req, res): Promise<any> => {
    const id = req.params.id;
    if (!isDatabaseConnected()) {
        memoryDb.styles = memoryDb.styles.filter((s: any) => s.id !== id);
        return res.json({ success: true });
    }
    const pool = getDbPool();
    try {
        await pool.query('DELETE FROM styles WHERE id = $1', [id]);
        return res.json({ success: true });
    } catch (e: any) {
        return res.status(500).json({ error: e.message });
    }
});
router.get('/prompt-templates', async (req, res): Promise<any> => {
    if (!isDatabaseConnected()) return res.json(memoryDb.prompt_templates || DEFAULT_PROMPT_TEMPLATES);
    const pool = getDbPool();
    try {
        const result = await pool.query("SELECT * FROM prompt_templates ORDER BY title ASC");
        return res.json(result.rows);
    } catch (e: any) {
        return res.status(500).json({ error: e.message });
    }
});
router.post('/prompt-templates', async (req, res): Promise<any> => {
    const body = req.body;
    const id = crypto.randomUUID();
    const data = {
        id, slug: body.slug || body.title.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        title: body.title, workflowType: body.workflowType, formatMappings: body.formatMappings,
        creatorFlowMappings: body.creatorFlowMappings, styleModifiers: body.styleModifiers,
        educationalMode: body.educationalMode, bilingualHandlingHint: body.bilingualHandlingHint,
        personaConsistencyHint: body.personaConsistencyHint, status: body.status || 'Active',
        visibleInAdmin: body.visibleInAdmin ?? true, internalTestingOnly: body.internalTestingOnly ?? false
    };
    if (!isDatabaseConnected()) {
        memoryDb.prompt_templates.push(data);
        return res.json(data);
    }
    const pool = getDbPool();
    try {
        await pool.query(
            `INSERT INTO prompt_templates (id, slug, title, workflowType, formatMappings, creatorFlowMappings, styleModifiers, educationalMode, bilingualHandlingHint, personaConsistencyHint, status, visibleInAdmin, internalTestingOnly)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
            [data.id, data.slug, data.title, data.workflowType, data.formatMappings, data.creatorFlowMappings, data.styleModifiers, data.educationalMode, data.bilingualHandlingHint, data.personaConsistencyHint, data.status, data.visibleInAdmin, data.internalTestingOnly]
        );
        return res.json(data);
    } catch (e: any) {
        return res.status(500).json({ error: e.message });
    }
});
router.put('/prompt-templates/:id', async (req, res): Promise<any> => {
    const id = req.params.id;
    const updateFields = req.body;
    if (!isDatabaseConnected()) {
        const index = memoryDb.prompt_templates.findIndex((pt: any) => pt.id === id);
        if (index !== -1) {
            memoryDb.prompt_templates[index] = { ...memoryDb.prompt_templates[index], ...updateFields };
            return res.json(memoryDb.prompt_templates[index]);
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
        await pool.query(`UPDATE prompt_templates SET ${fields.join(', ')} WHERE id = $${i}`, values);
        return res.json({ success: true });
    } catch (e: any) {
        return res.status(500).json({ error: e.message });
    }
});
router.delete('/prompt-templates/:id', async (req, res): Promise<any> => {
    const id = req.params.id;
    if (!isDatabaseConnected()) {
        memoryDb.prompt_templates = memoryDb.prompt_templates.filter((pt: any) => pt.id !== id);
        return res.json({ success: true });
    }
    const pool = getDbPool();
    try {
        await pool.query('DELETE FROM prompt_templates WHERE id = $1', [id]);
        return res.json({ success: true });
    } catch (e: any) {
        return res.status(500).json({ error: e.message });
    }
});
router.get('/categories', async (req, res): Promise<any> => {
    if (!isDatabaseConnected()) {
        return res.json(memoryDb.content_categories || DEFAULT_CATEGORIES);
    }
    const pool = getDbPool();
    if (pool) {
        try {
            const result = await pool.query(`SELECT * FROM content_categories ORDER BY created_at DESC`);
            if (result.rows && result.rows.length > 0) {
                return res.json(result.rows);
            }
        } catch(e) { }
    }
    return res.json(DEFAULT_CATEGORIES);
});
router.post('/categories', async (req, res): Promise<any> => {
    const { name, category_type, emoji, prompt_instruction, is_featured } = req.body;
    if (!isDatabaseConnected()) {
        const newItem = {
            id: crypto.randomUUID(),
            name,
            category_type,
            emoji: emoji || '📖',
            prompt_instruction: prompt_instruction || 'clean illustration, modern aesthetic',
            is_featured: is_featured || false,
            is_active: true,
            created_at: new Date().toISOString()
        };
        memoryDb.content_categories = memoryDb.content_categories || [];
        memoryDb.content_categories.push(newItem);
        return res.json({ success: true });
    }
    const pool = getDbPool();
    if (pool) {
        try {
            await pool.query(`INSERT INTO content_categories (name, category_type, emoji, prompt_instruction, is_featured) VALUES ($1, $2, $3, $4, $5)`, [name, category_type, emoji || null, prompt_instruction || null, is_featured || false]);
        } catch(e) { }
    }
    return res.json({ success: true });
});
router.put('/categories/:id', async (req, res): Promise<any> => {
    try {
        const id = req.params.id;
        const { name, category_type, emoji, prompt_instruction, is_featured, is_active } = req.body;

        if (!isDatabaseConnected()) {
            memoryDb.content_categories = memoryDb.content_categories || [];
            const cat = memoryDb.content_categories.find((c: any) => c.id === id);
            if (cat) {
                if (name !== undefined) cat.name = name;
                if (category_type !== undefined) cat.category_type = category_type;
                if (emoji !== undefined) cat.emoji = emoji;
                if (prompt_instruction !== undefined) cat.prompt_instruction = prompt_instruction;
                if (is_featured !== undefined) cat.is_featured = is_featured;
                if (is_active !== undefined) cat.is_active = is_active;
            }
            return res.json({ success: true });
        }

        const pool = getDbPool();
        if (pool) {
            // Determine fields to update dynamically or just update all
            const fields = [];
            const values = [];
            let i = 1;

            if (name !== undefined) { fields.push(`name = $${i++}`); values.push(name); }
            if (category_type !== undefined) { fields.push(`category_type = $${i++}`); values.push(category_type); }
            if (emoji !== undefined) { fields.push(`emoji = $${i++}`); values.push(emoji); }
            if (prompt_instruction !== undefined) { fields.push(`prompt_instruction = $${i++}`); values.push(prompt_instruction); }
            if (is_featured !== undefined) { fields.push(`is_featured = $${i++}`); values.push(is_featured); }
            if (is_active !== undefined) { fields.push(`is_active = $${i++}`); values.push(is_active); }

            if (fields.length > 0) {
                values.push(id);
                await pool.query(`UPDATE content_categories SET ${fields.join(', ')} WHERE id = $${i}`, values);
            }
        }
        return res.json({ success: true });
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
});
router.post('/categories/suggest', async (req, res): Promise<any> => {
    try {
        const { currentCategories } = req.body;
        const ai = getAIClient();
        const route = resolveAIRoute('beat', 'High User', process.env.NODE_ENV);
        const prompt = `Analyze these current categories and suggest 5 new relevant tags or genres to expand the catalog. Return ONLY a JSON array of strings. Current: ${JSON.stringify(currentCategories)}`;
        const response = await ai.models.generateContent({
            model: route.modelSlug,
            contents: prompt
        });
        let text = response.text || "[]";
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const suggestions = JSON.parse(text);
        return res.json({ suggestions });
    } catch (error: any) {
        return res.status(500).json({ error: error.message, suggestions: [] });
    }
});
router.delete('/categories/:id', async (req, res): Promise<any> => {
    const id = req.params.id;
    if (!isDatabaseConnected()) {
        memoryDb.content_categories = (memoryDb.content_categories || []).filter((c: any) => c.id !== id);
        return res.json({ success: true });
    }
    const pool = getDbPool();
    if (pool) {
        try {
            await pool.query(`DELETE FROM content_categories WHERE id = $1`, [id]);
        } catch(e) { }
    }
    return res.json({ success: true });
});
export default router;
