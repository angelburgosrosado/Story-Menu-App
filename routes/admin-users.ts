/**
 * Admin Users — System users and customer management
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

router.get('/system/users', async (req, res) => {
    try {
        if (isDatabaseConnected()) {
            const pool = getDbPool();
            if (pool) {

                await pool.query(`
                    CREATE TABLE IF NOT EXISTS admin_users (
                        username VARCHAR(255) PRIMARY KEY,
                        password_hash TEXT NOT NULL,
                        salt TEXT NOT NULL,
                        role VARCHAR(50) DEFAULT 'admin',
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                `);
                await pool.query('ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS password_hash TEXT');
                await pool.query('ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS salt TEXT');
                await pool.query('ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT \'admin\'');


                const { rows } = await pool.query('SELECT username, role, created_at FROM admin_users');
                return res.json(rows);
            }
        } else {
            return res.json((memoryDb.admin_users || []).map((u:any) => ({ username: u.username, role: u.role, created_at: u.created_at })));
        }
        res.json([]);
    } catch(e) {
        res.status(500).json({ error: 'Server error' });
    }
});
router.post('/system/users', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Missing username or password' });

    try {
        const salt = crypto.randomBytes(16).toString('hex');
        const hash = hashPassword(password, salt);

        if (isDatabaseConnected()) {
            const pool = getDbPool();
            if (pool) {

                await pool.query(`
                    CREATE TABLE IF NOT EXISTS admin_users (
                        username VARCHAR(255) PRIMARY KEY,
                        password_hash TEXT NOT NULL,
                        salt TEXT NOT NULL,
                        role VARCHAR(50) DEFAULT 'admin',
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                `);
                await pool.query('ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS password_hash TEXT');
                await pool.query('ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS salt TEXT');
                await pool.query('ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT \'admin\'');


                await pool.query('INSERT INTO admin_users (username, password_hash, salt) VALUES ($1, $2, $3)', [username, hash, salt]);
            }
        } else {
            memoryDb.admin_users = memoryDb.admin_users || [];
            memoryDb.admin_users.push({ username, password_hash: hash, salt, role: 'admin', created_at: new Date().toISOString() });
        }
        res.json({ success: true });
    } catch(e) {
        console.error(e);
        res.status(500).json({ error: 'Server error or user exists' });
    }
});
router.delete('/system/users/:username', async (req, res) => {
    const { username } = req.params;
    try {
        if (isDatabaseConnected()) {
            const pool = getDbPool();
            if (pool) {
                await pool.query('DELETE FROM admin_users WHERE username = $1', [username]);
            }
        } else {
            memoryDb.admin_users = (memoryDb.admin_users || []).filter((u:any) => u.username !== username);
        }
        res.json({ success: true });
    } catch(e) {
        console.error(e);
        res.status(500).json({ error: 'Server error' });
    }
});
router.post('/customers', async (req, res): Promise<any> => {
    try {
        const { email, tier, firstName, lastName, phone, company, internalNotes } = req.body;
        if (!email) return res.status(400).json({ error: 'Email required' });

        const db = getFirestore();
        const newCustomer = {
            email,
            subscriptionTier: tier || 'Free',
            tokens: 0,
            created_at: new Date().toISOString(),
            firstName: firstName || '',
            lastName: lastName || '',
            phone: phone || '',
            company: company || '',
            internalNotes: internalNotes || ''
        };

        try {
            await db.collection('users').doc(email).set(newCustomer, { merge: true });
        } catch (err: any) {
            // Fallback to memory
            const existingIdx = memoryDb.users.findIndex((u:any) => u.email === email);
            if (existingIdx >= 0) {
                memoryDb.users[existingIdx] = { ...memoryDb.users[existingIdx], ...newCustomer };
            } else {
                memoryDb.users.push(newCustomer);
            }
        }

        return res.json({ success: true, customer: newCustomer });
    } catch (error: any) {
        console.error("Admin API Error - Add Customer:", error);
        return res.status(500).json({ error: error.message });
    }
});
router.get('/customers', async (req, res): Promise<any> => {
        const pool = getDbPool();
        if (pool) {
            try {
                // Ensure columns exist first
                await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS tier VARCHAR(100);');
                await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_id VARCHAR(100);');
                await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);');

                const result = await pool.query('SELECT id, email, tier, subscription_id as "subscriptionId", payment_method as "paymentMethod", created_at as "createdAt" FROM users ORDER BY created_at DESC');
                return res.json(result.rows);
            } catch (err: any) {
                console.warn("Database admin customers fallback:", err.message);
                if (isConnectionError(err)) {
                    markDatabaseOffline();
                }
            }
        }

        // Fallback to memory DB
        const mappedMemory = memoryDb.users.map(u => ({
            id: u.id,
            email: u.email,
            tier: u.tier || null,
            subscriptionId: u.subscriptionId || null,
            paymentMethod: u.paymentMethod || null,
            createdAt: u.created_at || new Date()
        }));
        return res.json(mappedMemory);
    });
router.put('/customers/:email', async (req, res): Promise<any> => {
    const { email } = req.params;
    const { tier, subscriptionId, paymentMethod } = req.body;

    console.info(`🔧 [Admin Action] Overriding subscription details for ${email} to tier: ${tier}`);

    const pool = getDbPool();
    if (pool) {
        try {
            await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS tier VARCHAR(100);');
            await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_id VARCHAR(100);');
            await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);');

            await pool.query(
                'UPDATE users SET tier = $1, subscription_id = $2, payment_method = $3 WHERE email = $4',
                [tier || null, subscriptionId || null, paymentMethod || null, email]
            );
        } catch (err: any) {
            console.warn("Database admin put fallback:", err.message);
            if (isConnectionError(err)) {
                markDatabaseOffline();
            }
        }
    }

    // Update memory DB
    const matchUser = memoryDb.users.find(u => u.email === email);
    if (matchUser) {
        matchUser.tier = tier || undefined;
        matchUser.subscriptionId = subscriptionId || undefined;
        matchUser.paymentMethod = paymentMethod || undefined;
    } else {
        // Check if user should be created
        memoryDb.users.push({
            id: '00000000-0000-0000-0000-000000000000',
            email,
            tier: tier || undefined,
            subscriptionId: subscriptionId || undefined,
            paymentMethod: paymentMethod || undefined,
            created_at: new Date()
        });
    }

    return res.json({ success: true, message: `Successfully updated user "${email}" in administration records.` });
});
router.delete('/customers/:email', async (req, res): Promise<any> => {
    const { email } = req.params;
    console.info(`🟥 [Admin Action] Deleting user profile and credentials for ${email}`);

    const pool = getDbPool();
    if (pool) {
        try {
            await pool.query('DELETE FROM users WHERE email = $1', [email]);
        } catch (err: any) {
            console.warn("Database admin delete fallback:", err.message);
            if (isConnectionError(err)) {
                markDatabaseOffline();
            }
        }
    }

                    // Memory delete
    memoryDb.users = memoryDb.users.filter(u => u.email !== email);
    return res.json({ success: true, message: `Successfully deleted user "${email}" from Saas registration.` });
});
router.post('/customers/:email/tokens', async (req, res): Promise<any> => {
    const { email } = req.params;
    const { amount, action } = req.body; // action: 'add', 'set'

    const pool = getDbPool();
    if (!pool) return res.status(500).json({ error: 'DB not connected' });

    try {
        const userRes = await pool.query('SELECT tokens FROM users WHERE email = $1', [email]);
        if (userRes.rows.length === 0) return res.status(404).json({ error: 'User not found' });

        let newBalance = userRes.rows[0].tokens;
        if (action === 'set') {
            newBalance = parseInt(amount);
        } else {
            newBalance += parseInt(amount);
        }

        await pool.query('UPDATE users SET tokens = $1 WHERE email = $2', [newBalance, email]);
        return res.json({ success: true, tokens: newBalance, message: `Successfully updated token balance to ${newBalance}` });
    } catch (e: any) {
        console.error("Token update error:", e);
        return res.status(500).json({ error: 'Database error' });
    }
});
router.put('/customers/:email/tokens', async (req, res): Promise<any> => {
    const email = req.params.email;
    const { amount, reason } = req.body;
    if (!amount || isNaN(Number(amount))) return res.status(400).json({ error: 'Valid amount required' });

    const pool = getDbPool();
    if (pool) {
        try {
            // Check if user exists in Postgres
            const pgUser = await pool.query('SELECT id, token_balance FROM subscriptions WHERE user_id = (SELECT id FROM users WHERE email = $1)', [email]);
            if (pgUser.rows.length > 0) {
                await pool.query('UPDATE subscriptions SET token_balance = token_balance + $1 WHERE user_id = (SELECT id FROM users WHERE email = $2)', [amount, email]);
                return res.json({ success: true, message: `Tokens updated successfully by ${amount}.` });
            }
        } catch (e: any) {
            console.error("PG token update error:", e);
        }
    }

    // Fallback to Firestore
    try {
        const db = getFirestore();
        const snapshot = await db.collection('users').where('email', '==', email).get();
        if (!snapshot.empty) {
            const userRef = snapshot.docs[0].ref;
            const current = snapshot.docs[0].data()?.tokens || 0;
            await userRef.update({ tokens: current + Number(amount) });
            return res.json({ success: true, message: `Tokens updated in Firestore by ${amount}.` });
        }
    } catch (e: any) {
        console.error("Firestore token update error:", e);
    }

    return res.status(404).json({ error: 'User not found' });
});

// Alias used by AdminDashboard: /api/admin/auth/users -> /api/admin/system/users
router.get('/auth/users', async (req, res) => {
    try {
        if (isDatabaseConnected()) {
            const pool = getDbPool();
            if (pool) {
                await pool.query(`
                    CREATE TABLE IF NOT EXISTS admin_users (
                        username VARCHAR(255) PRIMARY KEY,
                        password_hash TEXT NOT NULL,
                        salt TEXT NOT NULL,
                        role VARCHAR(50) DEFAULT 'admin',
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                `);
                await pool.query('ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS password_hash TEXT');
                await pool.query('ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS salt TEXT');
                await pool.query('ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT \'admin\'');
                const { rows } = await pool.query('SELECT username, role, created_at FROM admin_users');
                return res.json(rows);
            }
        } else {
            return res.json((memoryDb.admin_users || []).map((u:any) => ({ username: u.username, role: u.role, created_at: u.created_at })));
        }
        res.json([]);
    } catch(e) {
        res.status(500).json({ error: 'Server error' });
    }
});
router.post('/auth/users', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Missing username or password' });
    try {
        const salt = crypto.randomBytes(16).toString('hex');
        const hash = hashPassword(password, salt);
        if (isDatabaseConnected()) {
            const pool = getDbPool();
            if (pool) {
                await pool.query(`
                    CREATE TABLE IF NOT EXISTS admin_users (
                        username VARCHAR(255) PRIMARY KEY,
                        password_hash TEXT NOT NULL,
                        salt TEXT NOT NULL,
                        role VARCHAR(50) DEFAULT 'admin',
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                `);
                await pool.query('ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS password_hash TEXT');
                await pool.query('ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS salt TEXT');
                await pool.query('ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT \'admin\'');
                await pool.query('INSERT INTO admin_users (username, password_hash, salt) VALUES ($1, $2, $3)', [username, hash, salt]);
            }
        } else {
            memoryDb.admin_users = memoryDb.admin_users || [];
            memoryDb.admin_users.push({ username, password_hash: hash, salt, role: 'admin', created_at: new Date().toISOString() });
        }
        res.json({ success: true });
    } catch(e) {
        console.error(e);
        res.status(500).json({ error: 'Server error or user exists' });
    }
});
router.delete('/auth/users/:username', async (req, res) => {
    const { username } = req.params;
    try {
        if (isDatabaseConnected()) {
            const pool = getDbPool();
            if (pool) {
                await pool.query('DELETE FROM admin_users WHERE username = $1', [username]);
            }
        } else {
            memoryDb.admin_users = (memoryDb.admin_users || []).filter((u:any) => u.username !== username);
        }
        res.json({ success: true });
    } catch(e) {
        console.error(e);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
