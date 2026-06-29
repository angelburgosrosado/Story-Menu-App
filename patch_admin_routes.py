import re
import sys

def main():
    file_path = 'server.ts'
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print(f"Error reading {file_path}: {e}")
        sys.exit(1)

    # Routes to inject
    new_routes = """
    // --- ADMIN SUPERCHARGE ROUTES ---

    // Token Management API
    app.put('/api/admin/customers/:email/tokens', requireAdmin, async (req, res): Promise<any> => {
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

    // Content Moderation API - Resolve
    app.put('/api/admin/moderation/:id/safe', requireAdmin, async (req, res): Promise<any> => {
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

    // Content Moderation API - Delete Content
    app.delete('/api/admin/moderation/:id', requireAdmin, async (req, res): Promise<any> => {
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

    // Webhook & Error Logs API
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
    });

    // Global Characters API
    app.post('/api/admin/characters/global', requireAdmin, async (req, res): Promise<any> => {
        const { character_name, role_type, description, image_url } = req.body;
        const pool = getDbPool();
        if (pool) {
            try {
                // Insert as global character. Since user_id is NOT NULL, we link it to the admin's user ID or a system user ID.
                // We'll find the first admin user ID
                const adminRes = await pool.query("SELECT id FROM users LIMIT 1");
                const systemUserId = adminRes.rows[0]?.id;
                
                if (systemUserId) {
                    await pool.query(`
                        INSERT INTO character_vault (user_id, character_name, role_type, description, image_url, is_global)
                        VALUES ($1, $2, $3, $4, $5, true)
                    `, [systemUserId, character_name, role_type, description, image_url]);
                    return res.json({ success: true });
                }
            } catch(e: any) {
                console.error("Global Character Error:", e);
            }
        }
        return res.status(500).json({ error: 'Failed to create global character' });
    });

"""

    # We need to insert this before the static file handler.
    # We can search for "// === FRONTEND ROUTING & STATIC ASSETS ===" or "if (process.env.NODE_ENV"
    insert_marker = "// Start listening on port only when all API endpoints and static assets are fully configured"

    if insert_marker in content:
        if "// --- ADMIN SUPERCHARGE ROUTES ---" not in content:
            updated_content = content.replace(insert_marker, new_routes + "\n    " + insert_marker)
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(updated_content)
            print("Successfully inserted admin routes.")
        else:
            print("Admin routes already injected.")
    else:
        print("Marker not found.")

if __name__ == "__main__":
    main()
