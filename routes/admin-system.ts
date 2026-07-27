/**
 * Admin System — Health, stats, logs, system bypasses
 * Extracted from server.ts
 */
import { Router, Request, Response } from 'express';
import { getDbPool, isDatabaseConnected, markDatabaseOffline, isConnectionError } from '../db';
import { getFirestore } from 'firebase-admin/firestore';
import Stripe from 'stripe';
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

router.get('/health', async (req, res): Promise<any> => {
    const start = Date.now();
    const health: any = {
        status: 'ok',
        database: { status: 'offline', message: 'Sandbox Mode' },
        storage: { status: 'unknown' },
        integrations: {
            gemini: { status: 'missing', message: 'API Key not configured in .env' },
            stripe: { status: 'missing', message: 'Not configured' },
            paypal: { status: 'missing', message: 'Not configured' }
        },
        environment: {
            port: process.env.PORT || 3001,
            nodeEnv: process.env.NODE_ENV || 'development',
            memoryUsage: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB'
        }
    };

    const pool = getDbPool();
    if (pool) {
        try {
            const client = await pool.connect();
            await client.query('SELECT 1');
            client.release();
            health.database = { status: 'ok', message: 'Connected to PostgreSQL' };
        } catch (e: any) {
            health.database = { status: 'error', message: e.message };
            health.status = 'warning';
        }
    } else {
        health.status = 'warning';
    }

    if (process.env.GEMINI_API_KEY || process.env.API_KEY) health.integrations.gemini = { status: 'ok', message: 'Configured in .env' };
    if (process.env.STRIPE_SECRET_KEY) health.integrations.stripe = { status: 'ok', message: 'Configured in .env' };
    if (process.env.PAYPAL_CLIENT_ID) health.integrations.paypal = { status: 'ok', message: 'Configured in .env' };

    if (pool && health.database.status === 'ok') {
        try {
           const settingsRes = await pool.query("SELECT key_name, key_value FROM app_settings WHERE key_name IN ('stripe_secret_key', 'paypal_client_id', 'gemini_api_key')");
           settingsRes.rows.forEach(r => {
               if (r.key_value && r.key_value.trim() !== '') {
                   const key = r.key_name.replace('_secret_key', '').replace('_client_id', '').replace('_access_token', '').replace('_api_key', '');
                   if (health.integrations[key]) {
                       health.integrations[key] = { status: 'ok', message: 'Configured in DB' };
                   }
               }
           });
        } catch(e) {}
    } else if (!isDatabaseConnected() && memoryDb.app_settings) {
        memoryDb.app_settings.forEach((s:any) => {
            if (s.key_value && s.key_value.trim() !== '') {
                const key = s.key_name.replace('_secret_key', '').replace('_client_id', '').replace('_access_token', '').replace('_api_key', '');
                if (health.integrations[key]) {
                    health.integrations[key] = { status: 'ok', message: 'Configured in MemoryDb' };
                }
            }
        });
    }

    try {
        const geminiKey = await getSettingValue('gemini_api_key');
        if (geminiKey) {
            const ai = getAIClient(geminiKey);
            await ai.models.generateContent({ model: 'gemini-flash-latest', contents: 'test' });
            health.integrations.gemini = { status: 'ok', message: 'API connection successful' };
        }
    } catch (e: any) {
        health.integrations.gemini = { status: 'error', message: `Gemini API Error: ${e.message}` };
        health.status = 'warning';
    }

    try {
        const stripeSecret = await getSettingValue('stripe_secret_key');
        if (stripeSecret) {
            const stripe = new Stripe(stripeSecret, { apiVersion: '2024-06-20' as any });
            await stripe.balance.retrieve();
            health.integrations.stripe = { status: 'ok', message: 'API connection successful' };
        }
    } catch (e: any) {
        health.integrations.stripe = { status: 'error', message: `Stripe API Error: ${e.message}` };
        health.status = 'warning';
    }

    try {
        const fs = await import('fs/promises');
        const path = await import('path');
        const testFile = path.join(process.cwd(), 'health_check.tmp');
        await fs.writeFile(testFile, 'ok');
        await fs.unlink(testFile);
        health.storage = { status: 'ok', message: 'Read/Write access verified' };
    } catch (e: any) {
        health.storage = { status: 'error', message: e.message };
        health.status = 'error';
    }

    health.uptime = Math.round(process.uptime()) + 's';
    health.responseTimeMs = Date.now() - start;

    res.json(health);
});
router.get('/stats', async (req, res): Promise<any> => {
    let customersList: any[] = [];
    const pool = getDbPool();

    if (pool) {
        try {
            await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS tier VARCHAR(100);');
            await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_id VARCHAR(100);');
            await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);');

            const result = await pool.query('SELECT id, email, tier, subscription_id, payment_method FROM users');
            customersList = result.rows.map(r => ({
                email: r.email,
                tier: r.tier,
                paymentMethod: r.payment_method
            }));
        } catch (err: any) {
            console.warn("Database admin stats fallback:", err.message);
            if (isConnectionError(err)) {
                markDatabaseOffline();
            }
        }
    }

    if (customersList.length === 0) {
        customersList = memoryDb.users.map(u => ({
            email: u.email,
            tier: u.tier,
            paymentMethod: u.paymentMethod
        }));
    }

    const stats = {
        totalUsers: customersList.length,
        proUsers: customersList.filter(u => u.tier && u.tier.includes('Pro')).length,
        enterpriseUsers: customersList.filter(u => u.tier && u.tier.includes('Enterprise')).length,
        freeUsers: customersList.filter(u => !u.tier || (!u.tier.includes('Pro') && !u.tier.includes('Enterprise'))).length,
        mrrEstimate: 0,
        stripePayments: customersList.filter(u => u.paymentMethod === 'Stripe').length,
        paypalPayments: customersList.filter(u => u.paymentMethod === 'PayPal').length,
        manualPayments: customersList.filter(u => u.paymentMethod === 'Manual Admin').length,
    };

    stats.mrrEstimate = (stats.proUsers * 19) + (stats.enterpriseUsers * 79);

    return res.json(stats);
});
router.get('/logs', async (req, res): Promise<any> => {
    const pool = getDbPool();
    if (pool) {
        try {
            await pool.query(`
                CREATE TABLE IF NOT EXISTS webhook_logs (
                    id SERIAL PRIMARY KEY,
                    source VARCHAR(255),
                    event_type VARCHAR(255),
                    payload TEXT,
                    error_message TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            const logsReq = await pool.query("SELECT * FROM webhook_logs ORDER BY created_at DESC LIMIT 100");
            return res.json(logsReq.rows);
        } catch(e) {
            return res.json([]);
        }
    }
    return res.json(memoryDb.webhook_logs || []);
});
router.get('/system/bypasses', async (req, res): Promise<any> => {
    // Expose critical operational bypasses currently active in the system
    const bypasses = [];

    // Check for Auth Bypass
    try {
        const adminEmails = process.env.SUPER_ADMIN_EMAILS ? process.env.SUPER_ADMIN_EMAILS.split(',') : [];
        if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY && adminEmails.length > 0) {
            bypasses.push({
                type: "Authentication Fallback",
                status: "Active",
                description: "Firebase Admin is not initialized. Using standard email headers for local development admin authentication.",
                severity: "Warning",
                affected_components: ["requireAdmin middleware"]
            });
        }
    } catch(e) {}

    // Check for DB Bypass
    if (!isDatabaseConnected()) {
        bypasses.push({
            type: "Database Fallback",
            status: "Active",
            description: "Postgres database is not connected. The application is running entirely on volatile in-memory storage (memoryDb).",
            severity: "Critical",
            affected_components: ["All Stateful Endpoints", "Stripe Data", "User Accounts"]
        });
    }

    return res.json(bypasses);
});
export default router;
