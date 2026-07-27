/**
 * Admin Routes — Extracted from server.ts
 * Handles: settings, plans, formats, flows, goals, AI providers, usage modes
 * Pattern: each CRUD group is a separate function for readability.
 */

import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { getDbPool, isDatabaseConnected } from '../db';

const router = Router();

// In-memory fallback (shared with server.ts via import)
let memoryDb: any = {};

export function setMemoryDb(db: any) {
    memoryDb = db;
}

// ─── App Settings ──────────────────────────────────────────────────────

router.get('/settings', async (req: Request, res: Response): Promise<any> => {
    if (!isDatabaseConnected()) {
        return res.json((memoryDb.app_settings || []).map((s: any) => ({
            keyName: s.key_name, keyValue: s.key_value, isSecret: s.is_secret
        })));
    }
    const pool = getDbPool();
    if (!pool) return res.status(500).json({ error: 'DB not connected' });
    try {
        await pool.query(`CREATE TABLE IF NOT EXISTS app_settings (
            key_name VARCHAR(100) PRIMARY KEY, key_value TEXT NOT NULL, 
            is_secret BOOLEAN DEFAULT false, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);
        await pool.query(`ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS description TEXT`);
        const result = await pool.query(
            'SELECT key_name as "keyName", key_value as "keyValue", is_secret as "isSecret", description FROM app_settings'
        );
        return res.json(result.rows);
    } catch (e: any) {
        return res.status(500).json({ error: e.message });
    }
});

router.post('/settings', async (req: Request, res: Response): Promise<any> => {
    const { keyName, keyValue, isSecret, description } = req.body;

    // Keep process.env and .env in sync for keys that the server reads from env
    process.env[keyName.toUpperCase()] = keyValue;
    try {
        const envPath = path.join(process.cwd(), '.env');
        let envContent = '';
        if (fs.existsSync(envPath)) {
            envContent = fs.readFileSync(envPath, 'utf8');
        }
        const lines = envContent.split('\n');
        let found = false;
        const newLines = lines.map(line => {
            if (line.trim().startsWith(keyName.toUpperCase() + '=')) {
                found = true;
                return `${keyName.toUpperCase()}=${keyValue}`;
            }
            return line;
        });
        if (!found) {
            newLines.push(`${keyName.toUpperCase()}=${keyValue}`);
        }
        fs.writeFileSync(envPath, newLines.join('\n'));
    } catch (e) {
        console.error('[Settings] Could not write to .env file', e);
    }

    if (!isDatabaseConnected()) {
        memoryDb.app_settings = memoryDb.app_settings || [];
        const existing = memoryDb.app_settings.find((s: any) => s.key_name === keyName);
        if (existing) { existing.key_value = keyValue; existing.is_secret = isSecret || false; }
        else { memoryDb.app_settings.push({ key_name: keyName, key_value: keyValue, is_secret: isSecret || false }); }
        return res.json({ success: true });
    }
    const pool = getDbPool();
    if (!pool) return res.status(500).json({ error: 'DB not connected' });
    try {
        await pool.query(`INSERT INTO app_settings (key_name, key_value, is_secret) 
            VALUES ($1, $2, $3) ON CONFLICT (key_name) 
            DO UPDATE SET key_value = EXCLUDED.key_value, is_secret = EXCLUDED.is_secret, updated_at = CURRENT_TIMESTAMP
        `, [keyName, keyValue, isSecret || false]);
        return res.json({ success: true });
    } catch (e: any) {
        return res.status(500).json({ error: e.message });
    }
});

// ─── Subscription Plans ────────────────────────────────────────────────

router.get('/plans', async (req: Request, res: Response): Promise<any> => {
    if (!isDatabaseConnected()) return res.json(memoryDb.subscription_plans || []);
    const pool = getDbPool();
    try {
        await pool.query(`CREATE TABLE IF NOT EXISTS subscription_plans (
            id SERIAL PRIMARY KEY, name VARCHAR(255), description TEXT,
            price_subscription DECIMAL(10,2), price_one_time DECIMAL(10,2),
            features JSONB, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);
        const result = await pool.query('SELECT * FROM subscription_plans ORDER BY created_at ASC');
        return res.json(result.rows.map(r => ({
            id: r.id.toString(), name: r.name, description: r.description,
            priceSubscription: parseFloat(r.price_subscription),
            priceOneTime: parseFloat(r.price_one_time), features: r.features || []
        })));
    } catch (e: any) { return res.json([]); }
});

router.post('/plans', async (req: Request, res: Response): Promise<any> => {
    const { name, description, priceSubscription, priceOneTime, features } = req.body;
    if (!isDatabaseConnected()) {
        memoryDb.subscription_plans = memoryDb.subscription_plans || [];
        const newPlan = { id: Date.now().toString(), name, description, priceSubscription, priceOneTime, features: features || [] };
        memoryDb.subscription_plans.push(newPlan);
        return res.json(newPlan);
    }
    const pool = getDbPool();
    try {
        await pool.query(`CREATE TABLE IF NOT EXISTS subscription_plans (
            id SERIAL PRIMARY KEY, name VARCHAR(255), description TEXT,
            price_subscription DECIMAL(10,2), price_one_time DECIMAL(10,2), features JSONB, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);
        const result = await pool.query(
            'INSERT INTO subscription_plans (name, description, price_subscription, price_one_time, features) VALUES ($1,$2,$3,$4,$5) RETURNING *',
            [name, description, priceSubscription || 0, priceOneTime || 0, JSON.stringify(features || [])]
        );
        return res.json({ id: result.rows[0].id.toString(), ...result.rows[0] });
    } catch (e: any) { return res.status(500).json({ error: e.message }); }
});

router.delete('/plans/:id', async (req: Request, res: Response): Promise<any> => {
    const { id } = req.params;
    if (!isDatabaseConnected()) {
        memoryDb.subscription_plans = (memoryDb.subscription_plans || []).filter((p: any) => p.id !== id);
        return res.json({ success: true });
    }
    const pool = getDbPool();
    try {
        await pool.query('DELETE FROM subscription_plans WHERE id = $1', [id]);
        return res.json({ success: true });
    } catch (e: any) { return res.status(500).json({ error: e.message }); }
});

// ─── Starting Formats ──────────────────────────────────────────────────

router.get('/formats', async (req: Request, res: Response): Promise<any> => {
    if (!isDatabaseConnected()) return res.json(memoryDb.starting_formats || []);
    const pool = getDbPool();
    try {
        await pool.query(`CREATE TABLE IF NOT EXISTS starting_formats (
            id SERIAL PRIMARY KEY, slug VARCHAR(100), title VARCHAR(255),
            short_description TEXT, long_description TEXT, icon VARCHAR(10),
            sort_order INT DEFAULT 0, is_featured BOOLEAN DEFAULT false, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);
        const result = await pool.query('SELECT * FROM starting_formats ORDER BY sort_order ASC');
        return res.json(result.rows.map(r => ({
            id: r.id.toString(), slug: r.slug, title: r.title,
            shortDescription: r.short_description, longDescription: r.long_description,
            icon: r.icon, sortOrder: r.sort_order, isFeatured: r.is_featured
        })));
    } catch (e: any) { return res.json([]); }
});

router.post('/formats', async (req: Request, res: Response): Promise<any> => {
    const { slug, title, shortDescription, longDescription, icon, sortOrder, isFeatured } = req.body;
    if (!isDatabaseConnected()) {
        memoryDb.starting_formats = memoryDb.starting_formats || [];
        const newFmt = { id: Date.now().toString(), slug, title, shortDescription, longDescription, icon, sortOrder: sortOrder || 0, isFeatured: isFeatured || false };
        memoryDb.starting_formats.push(newFmt);
        return res.json(newFmt);
    }
    const pool = getDbPool();
    try {
        await pool.query(`CREATE TABLE IF NOT EXISTS starting_formats (
            id SERIAL PRIMARY KEY, slug VARCHAR(100), title VARCHAR(255),
            short_description TEXT, long_description TEXT, icon VARCHAR(10),
            sort_order INT DEFAULT 0, is_featured BOOLEAN DEFAULT false, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);
        const result = await pool.query(
            `INSERT INTO starting_formats (slug, title, short_description, long_description, icon, sort_order, is_featured) 
             VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
            [slug, title, shortDescription, longDescription, icon, sortOrder || 0, isFeatured || false]
        );
        return res.json({ id: result.rows[0].id.toString(), ...result.rows[0] });
    } catch (e: any) { return res.status(500).json({ error: e.message }); }
});

router.put('/formats/:id', async (req: Request, res: Response): Promise<any> => {
    const { id } = req.params;
    const { slug, title, shortDescription, longDescription, icon, sortOrder, isFeatured } = req.body;
    if (!isDatabaseConnected()) {
        const fmt = (memoryDb.starting_formats || []).find((f: any) => f.id === id);
        if (fmt) Object.assign(fmt, { slug, title, shortDescription, longDescription, icon, sortOrder, isFeatured });
        return res.json({ success: true });
    }
    const pool = getDbPool();
    try {
        await pool.query(
            `UPDATE starting_formats SET slug=$1, title=$2, short_description=$3, long_description=$4, icon=$5, sort_order=$6, is_featured=$7 WHERE id=$8`,
            [slug, title, shortDescription, longDescription, icon, sortOrder || 0, isFeatured || false, id]
        );
        return res.json({ success: true });
    } catch (e: any) { return res.status(500).json({ error: e.message }); }
});

router.delete('/formats/:id', async (req: Request, res: Response): Promise<any> => {
    const { id } = req.params;
    if (!isDatabaseConnected()) {
        memoryDb.starting_formats = (memoryDb.starting_formats || []).filter((f: any) => f.id !== id);
        return res.json({ success: true });
    }
    const pool = getDbPool();
    try {
        await pool.query('DELETE FROM starting_formats WHERE id = $1', [id]);
        return res.json({ success: true });
    } catch (e: any) { return res.status(500).json({ error: e.message }); }
});

export default router;
