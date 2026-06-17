with open('server.ts', 'r') as f:
    content = f.read()

target = "// --- NEW SAAS DASHBOARD ENDPOINTS ---"

endpoints = """
    // --- INTEGRATIONS AND SETTINGS ---
    app.get('/api/admin/settings', async (req, res): Promise<any> => {
        const pool = getDbPool();
        if (!pool) return res.status(500).json({ error: 'DB not connected' });
        try {
            await pool.query(`CREATE TABLE IF NOT EXISTS app_settings (key_name VARCHAR(100) PRIMARY KEY, key_value TEXT NOT NULL, is_secret BOOLEAN DEFAULT false, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
            const result = await pool.query('SELECT key_name as "keyName", key_value as "keyValue", is_secret as "isSecret" FROM app_settings');
            return res.json(result.rows);
        } catch (e: any) {
            return res.status(500).json({ error: e.message });
        }
    });

    app.post('/api/admin/settings', async (req, res): Promise<any> => {
        const pool = getDbPool();
        if (!pool) return res.status(500).json({ error: 'DB not connected' });
        try {
            const { keyName, keyValue, isSecret } = req.body;
            await pool.query(`
                INSERT INTO app_settings (key_name, key_value, is_secret) 
                VALUES ($1, $2, $3) 
                ON CONFLICT (key_name) DO UPDATE SET key_value = EXCLUDED.key_value, is_secret = EXCLUDED.is_secret, updated_at = CURRENT_TIMESTAMP
            `, [keyName, keyValue, isSecret || false]);
            return res.json({ success: true });
        } catch (e: any) {
            return res.status(500).json({ error: e.message });
        }
    });

    // --- SUBSCRIPTION PLANS ---
    app.get('/api/admin/plans', async (req, res): Promise<any> => {
        const pool = getDbPool();
        if (!pool) return res.json([ // Fallback if no db
            { id: 'mock-1', name: 'Pro', price: 19.99, billing_cycle: 'monthly', features: JSON.stringify(['7000 Tokens/mo', 'Priority Queue', 'Basic Models']) },
            { id: 'mock-2', name: 'Enterprise', price: 79.99, billing_cycle: 'monthly', features: JSON.stringify(['Unlimited Tokens', 'Instant Queue', 'All Models']) }
        ]);
        try {
            await pool.query(`CREATE TABLE IF NOT EXISTS subscription_plans (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name VARCHAR(100) NOT NULL, price NUMERIC(10, 2) NOT NULL, billing_cycle VARCHAR(50) DEFAULT 'monthly', features JSONB DEFAULT '[]', is_active BOOLEAN DEFAULT true, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
            const result = await pool.query('SELECT id, name, price, billing_cycle as "billingCycle", features, is_active as "isActive" FROM subscription_plans WHERE is_active = true ORDER BY price ASC');
            return res.json(result.rows);
        } catch (e: any) {
            console.error("Failed to load plans", e);
            return res.json([]);
        }
    });

    app.post('/api/admin/plans', async (req, res): Promise<any> => {
        const pool = getDbPool();
        if (!pool) return res.status(500).json({ error: 'DB not connected' });
        try {
            const { name, price, billingCycle, features } = req.body;
            await pool.query(`
                INSERT INTO subscription_plans (name, price, billing_cycle, features) 
                VALUES ($1, $2, $3, $4)
            `, [name, price, billingCycle || 'monthly', JSON.stringify(features || [])]);
            return res.json({ success: true });
        } catch (e: any) {
            return res.status(500).json({ error: e.message });
        }
    });
    
    app.delete('/api/admin/plans/:id', async (req, res): Promise<any> => {
        const pool = getDbPool();
        if (!pool) return res.status(500).json({ error: 'DB not connected' });
        try {
            await pool.query('DELETE FROM subscription_plans WHERE id = $1', [req.params.id]);
            return res.json({ success: true });
        } catch (e: any) {
            return res.status(500).json({ error: e.message });
        }
    });
"""

if target in content:
    content = content.replace(target, target + "\n" + endpoints)
    with open('server.ts', 'w') as f:
        f.write(content)
    print("Injected settings and plans endpoints.")
else:
    print("Target block not found!")
