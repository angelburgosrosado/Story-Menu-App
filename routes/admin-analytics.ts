/**
 * Admin Analytics — Cost analytics
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

router.get('/analytics/costs', async (req, res): Promise<any> => {
    const pool = getDbPool();
    if (!pool) return res.status(500).json({ error: 'DB not connected' });

    try {
        // Aggregate totals
        const totalsRes = await pool.query('SELECT SUM(tokens_in) as total_in, SUM(tokens_out) as total_out, SUM(cost_usd) as total_cost FROM ai_usage_logs');
        const totals = totalsRes.rows[0];

        // Recent logs
        const logsRes = await pool.query('SELECT user_email, operation, model, tokens_in, tokens_out, cost_usd, created_at FROM ai_usage_logs ORDER BY created_at DESC LIMIT 100');

        return res.json({
            totals: {
                tokensIn: parseInt(totals.total_in || '0'),
                tokensOut: parseInt(totals.total_out || '0'),
                totalCostUsd: parseFloat(totals.total_cost || '0')
            },
            logs: logsRes.rows
        });
    } catch (e: any) {
        console.error("Analytics fetch error:", e);
        return res.status(500).json({ error: 'Database error' });
    }
});
export default router;
