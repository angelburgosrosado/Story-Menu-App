/**
 * Admin Moderation — Content moderation flags
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

router.get('/moderation', async (req, res): Promise<any> => {
    const pool = getDbPool();
    if (pool) {
        try {
            const result = await pool.query(`SELECT * FROM moderation_flags WHERE status = 'pending' ORDER BY created_at DESC`);
            return res.json(result.rows);
        } catch(e) { }
    }
    return res.json([
        { id: 'flag-1', severity: 'high', reason: 'Automated NSFW detection triggered on image.', target_id: 'proj-123', target_type: 'published_work' }
    ]);
});
router.post('/moderation/:id/resolve', async (req, res): Promise<any> => {
    const { action } = req.body; // 'safe' or 'remove'
    const status = action === 'safe' ? 'resolved_safe' : 'resolved_removed';
    const pool = getDbPool();
    if (pool) {
        try {
            await pool.query(`UPDATE moderation_flags SET status = $1 WHERE id = $2`, [status, req.params.id]);
        } catch(e) { }
    }
    return res.json({ success: true });
});
router.put('/moderation/:id/safe', async (req, res): Promise<any> => {
    const id = req.params.id;
    const pool = getDbPool();
    if (pool) {
        try {
            await pool.query("UPDATE moderation_flags SET status = 'resolved_safe' WHERE id = $1", [id]);
            return res.json({ success: true });
        } catch(e) {}
    }
    return res.status(500).json({ error: 'Failed to update flag' });
});
router.delete('/moderation/:id', async (req, res): Promise<any> => {
    const id = req.params.id;
    const pool = getDbPool();
    if (pool) {
        try {
            const flagReq = await pool.query("SELECT target_type, target_id FROM moderation_flags WHERE id = $1", [id]);
            if (flagReq.rows.length > 0) {
                const { target_type, target_id } = flagReq.rows[0];
                if (target_type === 'published_work') {
                    await pool.query("DELETE FROM published_works WHERE id = $1", [target_id]);
                } else if (target_type === 'character_vault') {
                    await pool.query("DELETE FROM character_vault WHERE id = $1", [target_id]);
                }
                await pool.query("UPDATE moderation_flags SET status = 'resolved_removed' WHERE id = $1", [id]);
                return res.json({ success: true });
            }
        } catch(e) {}
    }
    return res.status(500).json({ error: 'Failed to delete content' });
});
export default router;
