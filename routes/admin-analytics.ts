/**
 * Admin Analytics — Cost analytics
 * Extracted from server.ts
 */
import { Router, Request, Response } from 'express';
import { getDbPool } from '../db';

const router = Router();
let memoryDb: any = {};
export function setMemoryDb(db: any) { memoryDb = db; }

router.get('/analytics/costs', async (req, res): Promise<any> => {
    const pool = getDbPool();
    if (!pool) return res.status(500).json({ error: 'DB not connected' });

    try {
        // Aggregate totals
        const totalsRes = await pool.query('SELECT SUM(tokens_in) as total_in, SUM(tokens_out) as total_out, SUM(cost_usd) as total_cost FROM ai_usage_logs');
        const totals = totalsRes.rows[0] || {};

        // Cost by Provider
        const providerRes = await pool.query('SELECT model, SUM(cost_usd) as total_cost FROM ai_usage_logs GROUP BY model');
        const providerMap: Record<string, number> = {};
        (providerRes.rows || []).forEach((row: any) => {
            const model = (row.model || 'unknown').toLowerCase();
            const provider = model.includes('gemini') || model.includes('imagen') || model.includes('google') ? 'google' : (model.includes('leonardo') ? 'leonardo' : (model.includes('eleven') ? 'elevenlabs' : 'other'));
            const cost = parseFloat(row.total_cost || '0');
            providerMap[provider] = (providerMap[provider] || 0) + cost;
        });
        const by_provider = Object.entries(providerMap).map(([provider, total]) => ({
            provider,
            total: Math.round(total * 100) // convert USD to cents
        }));

        // Cost by User
        const userRes = await pool.query('SELECT user_email, COUNT(*) as calls, SUM(cost_usd) as total_cost FROM ai_usage_logs GROUP BY user_email');
        const by_user = (userRes.rows || []).map((row: any) => ({
            user_email: row.user_email,
            calls: parseInt(row.calls || '0'),
            total: Math.round(parseFloat(row.total_cost || '0') * 100) // convert USD to cents
        })).sort((a, b) => b.total - a.total).slice(0, 10);

        // Recent logs
        const logsRes = await pool.query('SELECT user_email, operation, model, tokens_in, tokens_out, cost_usd, created_at FROM ai_usage_logs ORDER BY created_at DESC LIMIT 100');

        return res.json({
            total_cost_cents: Math.round(parseFloat(totals.total_cost || '0') * 100),
            by_provider,
            by_user,
            totals: {
                tokensIn: parseInt(totals.total_in || '0'),
                tokensOut: parseInt(totals.total_out || '0'),
                totalCostUsd: parseFloat(totals.total_cost || '0')
            },
            logs: logsRes.rows || []
        });
    } catch (e: any) {
        console.error("Analytics fetch error:", e);
        return res.status(500).json({ error: 'Database error' });
    }
});

export default router;
