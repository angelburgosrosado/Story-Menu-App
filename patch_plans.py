import re

with open('server.ts', 'r') as f:
    content = f.read()

start_marker = "// --- SUBSCRIPTION PLANS (FIRESTORE) ---"
end_marker = "app.get('/api/admin/categories'"

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx == -1 or end_idx == -1:
    print("Markers not found")
    exit(1)

replacement = """// --- SUBSCRIPTION PLANS (POSTGRES / MEMORY DB FALLBACK) ---
    app.get('/api/public/plans', async (req, res): Promise<any> => {
        if (!isDatabaseConnected()) {
            return res.json(memoryDb.subscription_plans || []);
        }
        const pool = getDbPool();
        try {
            await pool.query(`CREATE TABLE IF NOT EXISTS subscription_plans (id SERIAL PRIMARY KEY, name VARCHAR(255), description TEXT, price_subscription DECIMAL(10,2), price_one_time DECIMAL(10,2), features JSONB, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
            const result = await pool.query('SELECT * FROM subscription_plans ORDER BY created_at ASC');
            const plans = result.rows.map(r => ({
                id: r.id.toString(),
                name: r.name,
                description: r.description,
                priceSubscription: parseFloat(r.price_subscription),
                priceOneTime: parseFloat(r.price_one_time),
                features: r.features || []
            }));
            return res.json(plans);
        } catch (e: any) {
            console.error("Failed to load public plans from Postgres", e);
            return res.json([]);
        }
    });

    app.get('/api/admin/plans', async (req, res): Promise<any> => {
        if (!isDatabaseConnected()) {
            return res.json(memoryDb.subscription_plans || []);
        }
        const pool = getDbPool();
        try {
            await pool.query(`CREATE TABLE IF NOT EXISTS subscription_plans (id SERIAL PRIMARY KEY, name VARCHAR(255), description TEXT, price_subscription DECIMAL(10,2), price_one_time DECIMAL(10,2), features JSONB, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
            const result = await pool.query('SELECT * FROM subscription_plans ORDER BY created_at ASC');
            const plans = result.rows.map(r => ({
                id: r.id.toString(),
                name: r.name,
                description: r.description,
                priceSubscription: parseFloat(r.price_subscription),
                priceOneTime: parseFloat(r.price_one_time),
                features: r.features || []
            }));
            return res.json(plans);
        } catch (e: any) {
            console.error("Failed to load admin plans from Postgres", e);
            return res.json([]);
        }
    });

    app.post('/api/admin/plans', async (req, res): Promise<any> => {
        const { name, description, priceSubscription, priceOneTime, features } = req.body;
        if (!isDatabaseConnected()) {
            memoryDb.subscription_plans = memoryDb.subscription_plans || [];
            const newId = String(Date.now());
            memoryDb.subscription_plans.push({
                id: newId,
                name,
                description: description || '',
                priceSubscription: Number(priceSubscription) || 0,
                priceOneTime: Number(priceOneTime) || 0,
                features: features || [],
                createdAt: new Date().toISOString()
            });
            return res.json({ success: true, id: newId });
        }
        const pool = getDbPool();
        try {
            await pool.query(`CREATE TABLE IF NOT EXISTS subscription_plans (id SERIAL PRIMARY KEY, name VARCHAR(255), description TEXT, price_subscription DECIMAL(10,2), price_one_time DECIMAL(10,2), features JSONB, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
            const result = await pool.query(
                'INSERT INTO subscription_plans (name, description, price_subscription, price_one_time, features) VALUES ($1, $2, $3, $4, $5) RETURNING id',
                [name, description || '', Number(priceSubscription) || 0, Number(priceOneTime) || 0, JSON.stringify(features || [])]
            );
            return res.json({ success: true, id: result.rows[0].id.toString() });
        } catch (e: any) {
            return res.status(500).json({ error: e.message });
        }
    });
    
    app.delete('/api/admin/plans/:id', async (req, res): Promise<any> => {
        if (!isDatabaseConnected()) {
            memoryDb.subscription_plans = (memoryDb.subscription_plans || []).filter((p:any) => p.id !== req.params.id);
            return res.json({ success: true });
        }
        const pool = getDbPool();
        try {
            await pool.query('DELETE FROM subscription_plans WHERE id = $1', [req.params.id]);
            return res.json({ success: true });
        } catch (e: any) {
            return res.status(500).json({ error: e.message });
        }
    });

    """

new_content = content[:start_idx] + replacement + content[end_idx:]

with open('server.ts', 'w') as f:
    f.write(new_content)
print("Patched server.ts successfully.")
