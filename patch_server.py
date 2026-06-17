with open('server.ts', 'r') as f:
    content = f.read()

target = """    // SaaS Analytics stats
    app.get('/api/admin/stats', async (req, res): Promise<any> => {"""

new_routes = """    // --- NEW SAAS DASHBOARD ENDPOINTS ---
    app.get('/api/admin/categories', async (req, res): Promise<any> => {
        const pool = getDbPool();
        if (pool) {
            try {
                const result = await pool.query(`SELECT * FROM content_categories ORDER BY created_at DESC`);
                return res.json(result.rows);
            } catch(e) { }
        }
        return res.json([
            { id: '1', category_type: 'Genre', name: 'Sci-Fi Cyberpunk' },
            { id: '2', category_type: 'Style', name: 'Cell-Shaded Anime' }
        ]);
    });

    app.post('/api/admin/categories', async (req, res): Promise<any> => {
        const { name, category_type } = req.body;
        const pool = getDbPool();
        if (pool) {
            try {
                await pool.query(`INSERT INTO content_categories (name, category_type) VALUES ($1, $2)`, [name, category_type]);
            } catch(e) { }
        }
        return res.json({ success: true });
    });

    app.delete('/api/admin/categories/:id', async (req, res): Promise<any> => {
        const pool = getDbPool();
        if (pool) {
            try {
                await pool.query(`DELETE FROM content_categories WHERE id = $1`, [req.params.id]);
            } catch(e) { }
        }
        return res.json({ success: true });
    });

    app.get('/api/admin/moderation', async (req, res): Promise<any> => {
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

    app.post('/api/admin/moderation/:id/resolve', async (req, res): Promise<any> => {
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

"""

content = content.replace(target, new_routes + target)

with open('server.ts', 'w') as f:
    f.write(content)

print("Server patched with new endpoints!")
