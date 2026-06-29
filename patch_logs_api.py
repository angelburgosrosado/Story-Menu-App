with open('server.ts', 'r') as f:
    content = f.read()

target = """    // Webhook & Error Logs API
    app.get('/api/admin/logs', requireAdmin, async (req, res): Promise<any> => {
        const pool = getDbPool();
        if (pool) {
            try {
                const logsReq = await pool.query("SELECT * FROM webhook_logs ORDER BY created_at DESC LIMIT 100");
                return res.json(logsReq.rows);
            } catch(e) {
                return res.json([]);
            }
        }
        return res.json([]);
    });"""

replacement = """    // Webhook & Error Logs API
    app.get('/api/admin/logs', requireAdmin, async (req, res): Promise<any> => {
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

    app.get('/api/admin/system/bypasses', requireAdmin, async (req, res): Promise<any> => {
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
    });"""

if target in content:
    content = content.replace(target, replacement)
    with open('server.ts', 'w') as f:
        f.write(content)
    print("Patched server.ts successfully")
else:
    print("Target block not found in server.ts")
