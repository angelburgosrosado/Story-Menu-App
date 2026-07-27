/**
 * Admin Characters — Global characters
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

router.get('/characters/global', async (req, res): Promise<any> => {
    const pool = getDbPool();
    if (pool) {
        try {
            const result = await pool.query('SELECT * FROM character_vault WHERE is_global = true ORDER BY created_at DESC');
            return res.json(result.rows);
        } catch(e: any) {
            console.error("Global Character GET Error:", e);
            return res.status(500).json({ error: e.message });
        }
    }
    return res.json(memoryDb.character_vault.filter(c => c.is_global === true));
});
router.post('/characters/global', async (req, res): Promise<any> => {
    const { character_name, role_type, description, image_url, generation_prompt, reference_images } = req.body;
    const pool = getDbPool();
    if (pool) {
        try {
            // Insert as global character. Since user_id is NOT NULL, we link it to the admin's user ID or a system user ID.
            // We'll find the first admin user ID
            const adminRes = await pool.query("SELECT id FROM users LIMIT 1");
            const systemUserId = adminRes.rows[0]?.id;

            if (systemUserId) {
                await pool.query(`
                    INSERT INTO character_vault (user_id, character_name, role_type, description, image_url, generation_prompt, reference_images, is_global)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, true)
                `, [systemUserId, character_name, role_type, description, image_url]);
                return res.json({ success: true });
            }
        } catch(e: any) {
            console.error("Global Character Error:", e);
        }
    }
    return res.status(500).json({ error: 'Failed to create global character' });
});
export default router;
