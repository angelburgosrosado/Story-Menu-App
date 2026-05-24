/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { getDbPool, isDatabaseConnected, initializeDatabaseSchema, markDatabaseOffline, testCustomConnectionString } from './db';

// Simple In-memory database fallback to ensure app stays 100% functional without DB configuration
const memoryDb = {
    users: [] as any[],
    character_vault: [] as any[],
    projects: [] as any[],
    project_casting: [] as any[],
};

// Insert a default anonymous creator in-memory
memoryDb.users.push({
    id: '00000000-0000-0000-0000-000000000000',
    email: 'local-creator@infinite.multiverse',
    created_at: new Date()
});

async function startServer() {
    const app = express();
    const PORT = 3000;

    app.use(express.json({ limit: '50mb' }));
    app.use(express.urlencoded({ extended: true, limit: '50mb' }));

    // Try starting & initializing PostgreSQL structure
    try {
        await initializeDatabaseSchema();
    } catch (e) {
        console.warn("Could not auto-initialize DB tables on reboot:", e);
    }

    /**
     * DATABASE HEALTH & CONFIG STATUS
     */
    app.get('/api/db-status', (req, res) => {
        const connected = isDatabaseConnected();
        res.json({
            connected,
            mode: connected ? 'production-postgres' : 'offline-memory'
        });
    });

    /**
     * ON-DEMAND DATABASE CONNECTION VERIFIER & DIAGNOSTIC UTILITY
     */
    app.post('/api/verify-database-connection', async (req, res): Promise<any> => {
        const { connectionString } = req.body;
        const targetUrl = connectionString || process.env.DATABASE_URL;

        if (!targetUrl) {
            return res.json({
                success: false,
                error: 'No database URL connection string provided, and default environment process.env.DATABASE_URL is empty.'
            });
        }

        try {
            const result = await testCustomConnectionString(targetUrl);
            return res.json(result);
        } catch (err: any) {
            return res.json({
                success: false,
                error: err.message || 'Verification attempt resulted in an unexpected error context.'
            });
        }
    });

    /**
     * CLOUD RUN ENVIRONMENT CONFIGURATION DETECTION
     */
    app.get('/api/cloudrun-config', (req, res) => {
        // Core Cloud Run environment vars: K_SERVICE, K_REVISION, K_CONFIGURATION
        const service = process.env.K_SERVICE || '';
        const revision = process.env.K_REVISION || '';
        const configuration = process.env.K_CONFIGURATION || '';
        const hasKEnv = !!(service || revision || configuration);
        
        // Inside our hosting runtime, check if we're inside a container (Cloud Run infrastructure)
        const isCloudRun = hasKEnv || process.env.GOOGLE_CLOUD_PROJECT !== undefined || (process.cwd && process.cwd().includes('/applet') || process.cwd().includes('/workspace'));

        res.json({
            isCloudRun,
            service: service || 'infinite-heroes-remix-app',
            revision: revision || 'remix-v1-prod',
            configuration: configuration || 'infinite-heroes-config',
            project: process.env.GOOGLE_CLOUD_PROJECT || 'ai-studio-multiverse-sandbox',
            port: process.env.PORT || '3000',
            region: process.env.CLOUD_RUN_REGION || 'us-east1'
        });
    });

    /**
     * 1. CREATE USER / CREATOR PROFILE
     */
    app.post('/api/users', async (req, res): Promise<any> => {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: 'Email parameter is required' });
        }

        const pool = getDbPool();
        if (pool) {
            try {
                // Upsert user based on email
                const result = await pool.query(
                    'INSERT INTO users (email) VALUES ($1) ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email RETURNING *',
                    [email]
                );
                return res.json(result.rows[0]);
            } catch (err: any) {
                console.error("Database user error, falling back gracefully:", err.message);
                markDatabaseOffline();
            }
        }
        
        // Memory Fallback
        let existing = memoryDb.users.find(u => u.email === email);
        if (!existing) {
            existing = {
                id: '00000000-0000-0000-0000-000000000000',
                email,
                created_at: new Date()
            };
            memoryDb.users.push(existing);
        }
        return res.json(existing);
    });

    /**
     * FETCH REGISTERED CREATORS list (for administrative dropdowns)
     */
    app.get('/api/users', async (req, res) => {
        const pool = getDbPool();
        if (pool) {
            try {
                const result = await pool.query('SELECT * FROM users ORDER BY created_at DESC');
                return res.json(result.rows);
            } catch (err: any) {
                console.error("Database list users error, falling back gracefully:", err.message);
                markDatabaseOffline();
            }
        }
        return res.json(memoryDb.users);
    });

    /**
     * 2. SEARCH & LIST CHARACTER VAULT
     */
    app.get('/api/characters', async (req, res) => {
        const { userId } = req.query;
        const pool = getDbPool();

        if (pool) {
            try {
                let query = 'SELECT * FROM character_vault';
                const params: any[] = [];
                if (userId) {
                    query += ' WHERE user_id = $1';
                    params.push(userId);
                }
                query += ' ORDER BY created_at DESC';
                const result = await pool.query(query, params);
                return res.json(result.rows);
            } catch (err: any) {
                console.error("Database list characters error, falling back gracefully:", err.message);
                markDatabaseOffline();
            }
        }
        
        let filtered = memoryDb.character_vault;
        if (userId) {
            filtered = memoryDb.character_vault.filter(c => c.user_id === userId);
        }
        return res.json(filtered);
    });

    /**
     * ADD CHARACTER TO COHERENT VAULT
     */
    app.post('/api/characters', async (req, res): Promise<any> => {
        const { userId, name, roleType, description, imageUrl, spatialVectors } = req.body;
        if (!userId || !name || !roleType) {
            return res.status(400).json({ error: 'userId, name, and roleType are required fields' });
        }

        const pool = getDbPool();
        if (pool) {
            try {
                const result = await pool.query(
                    `INSERT INTO character_vault (user_id, character_name, role_type, description, image_url, spatial_vectors)
                     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
                    [userId, name, roleType, description, imageUrl, spatialVectors ? JSON.stringify(spatialVectors) : null]
                );
                return res.json(result.rows[0]);
            } catch (err: any) {
                console.error("Database add character error, falling back gracefully:", err.message);
                markDatabaseOffline();
            }
        }
        
        const newItem = {
            id: crypto.randomUUID(),
            user_id: userId,
            character_name: name,
            role_type: roleType,
            description,
            image_url: imageUrl,
            spatial_vectors: spatialVectors || null,
            created_at: new Date()
        };
        memoryDb.character_vault.push(newItem);
        return res.json(newItem);
    });

    /**
     * DELETE Vault character
     */
    app.delete('/api/characters/:id', async (req, res): Promise<any> => {
        const { id } = req.params;
        const pool = getDbPool();

        if (pool) {
            try {
                await pool.query('DELETE FROM character_vault WHERE id = $1', [id]);
                return res.json({ success: true });
            } catch (err: any) {
                console.error("Database delete character error, falling back gracefully:", err.message);
                markDatabaseOffline();
            }
        }
        
        const index = memoryDb.character_vault.findIndex(c => c.id === id);
        if (index !== -1) {
            memoryDb.character_vault.splice(index, 1);
        }
        return res.json({ success: true });
    });

    /**
     * 3. PROJECTS STORES / HISTORY
     */
    app.post('/api/projects', async (req, res): Promise<any> => {
        const { userId, title, genre, language } = req.body;
        if (!userId || !title || !genre || !language) {
            return res.status(400).json({ error: 'userId, title, genre, and language are required fields' });
        }

        const pool = getDbPool();
        if (pool) {
            try {
                const result = await pool.query(
                    'INSERT INTO projects (user_id, title, genre, language, current_page) VALUES ($1, $2, $3, $4, 1) RETURNING *',
                    [userId, title, genre, language]
                );
                return res.json(result.rows[0]);
            } catch (err: any) {
                console.error("Database add project error, falling back gracefully:", err.message);
                markDatabaseOffline();
            }
        }
        
        const newProject = {
            id: crypto.randomUUID(),
            user_id: userId,
            title,
            genre,
            language,
            current_page: 1,
            created_at: new Date()
        };
        memoryDb.projects.push(newProject);
        return res.json(newProject);
    });

    app.get('/api/projects', async (req, res) => {
        const { userId } = req.query;
        const pool = getDbPool();

        if (pool) {
            try {
                let query = 'SELECT * FROM projects';
                const params: any[] = [];
                if (userId) {
                    query += ' WHERE user_id = $1';
                    params.push(userId);
                }
                query += ' ORDER BY created_at DESC';
                const result = await pool.query(query, params);
                return res.json(result.rows);
            } catch (err: any) {
                console.error("Database list projects error, falling back gracefully:", err.message);
                markDatabaseOffline();
            }
        }
        
        let filtered = memoryDb.projects;
        if (userId) {
            filtered = memoryDb.projects.filter(p => p.user_id === userId);
        }
        return res.json(filtered);
    });

    /**
     * 4. PROJECT CASTING RELATIONS
     */
    app.post('/api/project-casting', async (req, res): Promise<any> => {
        const { projectId, characterId } = req.body;
        if (!projectId || !characterId) {
            return res.status(400).json({ error: 'projectId and characterId are required' });
        }

        const pool = getDbPool();
        if (pool) {
            try {
                await pool.query(
                    'INSERT INTO project_casting (project_id, character_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                    [projectId, characterId]
                );
                return res.json({ success: true });
            } catch (err: any) {
                console.error("Database add project casting error, falling back gracefully:", err.message);
                markDatabaseOffline();
            }
        }
        
        memoryDb.project_casting.push({ project_id: projectId, character_id: characterId });
        return res.json({ success: true });
    });


    // Setup Vite middleware / client delivery
    if (process.env.NODE_ENV !== "production") {
        const vite = await createViteServer({
            server: { middlewareMode: true },
            appType: 'spa'
        });
        app.use(vite.middlewares);
    } else {
        const distPath = path.join(process.cwd(), 'dist');
        app.use(express.static(distPath));
        app.get('*', (req, res) => {
            res.sendFile(path.join(distPath, 'index.html'));
        });
    }

    app.listen(PORT, "0.0.0.0", () => {
        console.log(`🌐 Server active on http://0.0.0.0:${PORT} [mode: ${process.env.NODE_ENV || 'development'}]`);
    });
}

startServer();
