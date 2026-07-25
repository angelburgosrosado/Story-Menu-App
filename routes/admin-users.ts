/**
 * Admin User & Customer Routes — Extracted from server.ts
 * Handles: customer CRUD, token operations, system user management
 */

import { Router, Request, Response } from 'express';
import { getDbPool, isDatabaseConnected, markDatabaseOffline } from '../db';
import { isConnectionError } from '../db';

const router = Router();
let memoryDb: any = {};
export function setMemoryDb(db: any) { memoryDb = db; }

function ensurePool() {
    const pool = getDbPool();
    if (!pool) throw new Error('DB not connected');
    return pool;
}

// ─── System Users (Admin accounts) ─────────────────────────────────────

router.get('/system/users', async (_req: Request, res: Response) => {
    if (!isDatabaseConnected()) return res.json(memoryDb.admin_users || []);
    try {
        const pool = ensurePool();
        await pool.query(`CREATE TABLE IF NOT EXISTS admin_users (
            id SERIAL PRIMARY KEY, username VARCHAR(100) UNIQUE, password_hash TEXT,
            display_name VARCHAR(255), email VARCHAR(255), role VARCHAR(50) DEFAULT 'admin',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);
        const result = await pool.query('SELECT id, username, display_name, email, role, created_at FROM admin_users ORDER BY created_at DESC');
        return res.json(result.rows);
    } catch (e: any) { return res.json(memoryDb.admin_users || []); }
});

router.post('/system/users', async (req: Request, res: Response) => {
    const { username, password, displayName, email, role } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
    if (!isDatabaseConnected()) {
        memoryDb.admin_users = memoryDb.admin_users || [];
        memoryDb.admin_users.push({ id: Date.now(), username, displayName, email, role, createdAt: new Date() });
        return res.json({ success: true });
    }
    try {
        const pool = ensurePool();
        await pool.query(`CREATE TABLE IF NOT EXISTS admin_users (
            id SERIAL PRIMARY KEY, username VARCHAR(100) UNIQUE, password_hash TEXT,
            display_name VARCHAR(255), email VARCHAR(255), role VARCHAR(50) DEFAULT 'admin',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);
        await pool.query(
            'INSERT INTO admin_users (username, password_hash, display_name, email, role) VALUES ($1,$2,$3,$4,$5)',
            [username, password, displayName || username, email || '', role || 'admin']
        );
        return res.json({ success: true });
    } catch (e: any) { return res.status(500).json({ error: e.message }); }
});

router.delete('/system/users/:username', async (req: Request, res: Response) => {
    const { username } = req.params;
    if (!isDatabaseConnected()) {
        memoryDb.admin_users = (memoryDb.admin_users || []).filter((u: any) => u.username !== username);
        return res.json({ success: true });
    }
    try {
        const pool = ensurePool();
        await pool.query('DELETE FROM admin_users WHERE username = $1', [username]);
        return res.json({ success: true });
    } catch (e: any) { return res.status(500).json({ error: e.message }); }
});

// ─── Customers ─────────────────────────────────────────────────────────

router.get('/', async (_req: Request, res: Response) => {
    if (isDatabaseConnected()) {
        try {
            const pool = ensurePool();
            await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS tier VARCHAR(100);');
            await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_id VARCHAR(100);');
            await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);');
            const result = await pool.query(
                'SELECT id, email, tier, subscription_id as "subscriptionId", payment_method as "paymentMethod", created_at as "createdAt" FROM users ORDER BY created_at DESC'
            );
            return res.json(result.rows);
        } catch (err: any) {
            if (isConnectionError(err)) markDatabaseOffline();
        }
    }
    return res.json(memoryDb.users.map(u => ({
        id: u.id, email: u.email, tier: u.tier, subscriptionId: u.subscriptionId,
        paymentMethod: u.paymentMethod, createdAt: u.created_at
    })));
});

router.post('/', async (req: Request, res: Response) => {
    const { email, tier, firstName, lastName, phone, company, internalNotes } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });
    const newCustomer = {
        email, subscriptionTier: tier || 'Free', tokens: 0, created_at: new Date().toISOString(),
        firstName: firstName || '', lastName: lastName || '', phone: phone || '',
        company: company || '', internalNotes: internalNotes || ''
    };
    try {
        const { getFirestore } = require('firebase-admin/firestore');
        await getFirestore().collection('users').doc(email).set(newCustomer, { merge: true });
    } catch {
        const idx = memoryDb.users.findIndex((u: any) => u.email === email);
        if (idx >= 0) memoryDb.users[idx] = { ...memoryDb.users[idx], ...newCustomer };
        else memoryDb.users.push(newCustomer);
    }
    return res.json({ success: true, customer: newCustomer });
});

router.put('/:email', async (req: Request, res: Response) => {
    const { email } = req.params;
    const { tier, subscriptionId, paymentMethod } = req.body;
    if (isDatabaseConnected()) {
        try {
            const pool = ensurePool();
            await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS tier VARCHAR(100);');
            await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_id VARCHAR(100);');
            await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);');
            await pool.query(
                'UPDATE users SET tier = $1, subscription_id = $2, payment_method = $3 WHERE email = $4',
                [tier || null, subscriptionId || null, paymentMethod || null, email]
            );
        } catch (err: any) { if (isConnectionError(err)) markDatabaseOffline(); }
    }
    const matchUser = memoryDb.users.find((u: any) => u.email === email);
    if (matchUser) { matchUser.tier = tier; matchUser.subscriptionId = subscriptionId; matchUser.paymentMethod = paymentMethod; }
    else { memoryDb.users.push({ id: '00000000-0000-0000-0000-000000000000', email, tier, subscriptionId, paymentMethod, created_at: new Date() }); }
    return res.json({ success: true });
});

router.delete('/:email', async (req: Request, res: Response) => {
    const { email } = req.params;
    if (isDatabaseConnected()) {
        try { await ensurePool().query('DELETE FROM users WHERE email = $1', [email]); }
        catch (err: any) { if (isConnectionError(err)) markDatabaseOffline(); }
    }
    memoryDb.users = memoryDb.users.filter((u: any) => u.email !== email);
    return res.json({ success: true });
});

// ─── Token Operations ──────────────────────────────────────────────────

router.post('/:email/tokens', async (req: Request, res: Response) => {
    const { email } = req.params;
    const { amount, action } = req.body;
    if (!isDatabaseConnected()) return res.status(500).json({ error: 'DB not connected' });
    try {
        const pool = ensurePool();
        const userRes = await pool.query('SELECT tokens FROM users WHERE email = $1', [email]);
        if (userRes.rows.length === 0) return res.status(404).json({ error: 'User not found' });
        let newBalance = userRes.rows[0].tokens;
        if (action === 'set') newBalance = parseInt(amount); else newBalance += parseInt(amount);
        await pool.query('UPDATE users SET tokens = $1 WHERE email = $2', [newBalance, email]);
        return res.json({ success: true, tokens: newBalance });
    } catch (e: any) { return res.status(500).json({ error: e.message }); }
});

// ─── System Bypasses ───────────────────────────────────────────────────

router.get('/system/bypasses', async (_req: Request, res: Response) => {
    return res.json({ bypasses: memoryDb.system_bypasses || [] });
});

export default router;
