/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { getDbPool, isDatabaseConnected, initializeDatabaseSchema, markDatabaseOffline, testCustomConnectionString, resetConnectionState } from './db';

let startupError: any = null;

// Capture and diagnostics for any unhandled startup crashes
process.on('uncaughtException', (err) => {
    console.error('🚨 UNCAUGHT EXCEPTION:', err && (err.stack || err.message || err));
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('⚠️ UNHANDLED PROMISE REJECTION:', reason);
});

const app = express();

let _filename = '';
let _dirname = '';
if (typeof __filename !== 'undefined' && __filename) {
    _filename = __filename;
} else {
    try {
        _filename = fileURLToPath(import.meta.url);
    } catch {
        _filename = '';
    }
}

if (typeof __dirname !== 'undefined' && __dirname) {
    _dirname = __dirname;
} else if (_filename) {
    _dirname = path.dirname(_filename);
} else {
    _dirname = process.cwd();
}

// Safely load local .env credentials if they exist in the root folder
try {
    const envPath = path.join(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        envContent.split('\n').forEach((line) => {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#')) {
                const eqIdx = trimmed.indexOf('=');
                if (eqIdx !== -1) {
                    const key = trimmed.substring(0, eqIdx).trim();
                    const val = trimmed.substring(eqIdx + 1).trim();
                    if (key && !process.env[key]) {
                        process.env[key] = val;
                    }
                }
            }
        });
        console.info("💡 Local .env configuration loaded successfully.");
    }
} catch (err) {
    console.warn("Could not read local .env file:", err);
}

// Ensure any quotes or whitespace in DATABASE_URL are sanitized on startup
if (process.env.DATABASE_URL) {
    const val = process.env.DATABASE_URL.toString().replace(/['"]/g, '').trim();
    const cleanLower = val.toLowerCase();
    if (
        !val ||
        cleanLower === 'undefined' ||
        cleanLower === 'null' ||
        cleanLower === 'none' ||
        cleanLower.includes('placeholder') ||
        cleanLower.includes('<username>') ||
        cleanLower.includes('<password>') ||
        cleanLower.includes('@base:') ||
        cleanLower.includes('your_host') ||
        cleanLower.includes('insert-your') ||
        cleanLower.includes('your-database')
    ) {
        console.warn(`📢 [Self-Healing DB] Detected placeholder, undefined, or empty DATABASE_URL: "${val}". Disabling database pool to instantly fall back to safe sandbox mode.`);
        process.env.DATABASE_URL = '';
    } else {
        process.env.DATABASE_URL = val;
    }
}

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

async function startServer(app: express.Express) {
    const isCompiledFile = _dirname.includes('dist') || _filename.includes('dist') || _filename.endsWith('.cjs');
    const isCloudRun = !!process.env.K_SERVICE || !!process.env.K_REVISION || process.env.GOOGLE_CLOUD_PROJECT !== undefined;
    const hasCompiledAssets = fs.existsSync(path.join(process.cwd(), 'dist', 'index.html'));
    const isProductionMode = process.env.NODE_ENV === "production" || isCompiledFile || isCloudRun || hasCompiledAssets || !fs.existsSync(path.join(process.cwd(), 'server.ts'));

    let port = 3000;
    if (process.env.PORT) {
        try {
            const cleanedPortStr = process.env.PORT.toString().replace(/['"]/g, '').trim();
            const parsedPort = parseInt(cleanedPortStr, 10);
            if (!isNaN(parsedPort) && parsedPort > 0) {
                port = parsedPort;
            }
        } catch {}
    }

    app.use(express.json({ limit: '50mb' }));
    app.use(express.urlencoded({ extended: true, limit: '50mb' }));

    // Try starting & initializing PostgreSQL structure asynchronously so it does not block server startup
    console.info(`📡 Current server-side process.env.DATABASE_URL (masked): ${process.env.DATABASE_URL ? maskConnectionUri(process.env.DATABASE_URL) : 'None'}`);
    initializeDatabaseSchema().catch((e) => {
        console.warn("Could not auto-initialize DB tables on reboot:", e);
    });

    /**
     * SECURELY MASK DATABASE URI PASSWORDS FOR DIAGNOSIS
     */
    function maskConnectionUri(urlStr: string | undefined): string {
        if (!urlStr) return '';
        try {
            const doubleSlashIdx = urlStr.indexOf('://');
            if (doubleSlashIdx === -1) return 'invalid-url';
            
            const protocol = urlStr.substring(0, doubleSlashIdx);
            const rest = urlStr.substring(doubleSlashIdx + 3);
            
            const firstSlashInRest = rest.indexOf('/');
            const authority = firstSlashInRest === -1 ? rest : rest.substring(0, firstSlashInRest);
            const dbName = firstSlashInRest === -1 ? '' : rest.substring(firstSlashInRest + 1);
            
            const lastAtIdx = authority.lastIndexOf('@');
            if (lastAtIdx === -1) {
                return `${protocol}://${authority}/${dbName}`; // no credentials
            }
            
            const credentials = authority.substring(0, lastAtIdx);
            const hostPort = authority.substring(lastAtIdx + 1);
            
            const colonInCreds = credentials.indexOf(':');
            let user = credentials;
            if (colonInCreds !== -1) {
                user = credentials.substring(0, colonInCreds);
            }
            
            return `${protocol}://${user}:******@${hostPort}/${dbName}`;
        } catch (e) {
            return 'invalid-url';
        }
    }

    /**
     * DATABASE HEALTH & CONFIG STATUS
     */
    app.get('/api/db-status', (req, res) => {
        const connected = isDatabaseConnected();
        res.json({
            connected,
            status: connected ? 'ok' : 'offline',
            mode: connected ? 'production-postgres' : 'offline-memory',
            hasUrlEnv: !!process.env.DATABASE_URL,
            dbUrlMasked: process.env.DATABASE_URL ? maskConnectionUri(process.env.DATABASE_URL) : ''
        });
    });

    /**
     * MANUAL RESET AND FORCE RECONNECT ENDPOINT FOR CLOUD RUN HANDSHAKES
     */
    app.post('/api/db-reconnect', async (req, res): Promise<any> => {
        try {
            console.log("⚡ Received client request to resolve database status and force reconnect...");
            resetConnectionState();
            
            // Re-attempt initial schema checks or pool verification
            await initializeDatabaseSchema();
            
            const connected = isDatabaseConnected();
            return res.json({
                success: connected,
                status: connected ? 'ok' : 'offline',
                message: connected ? 'Successfully re-established database connection pool and validated schema tables!' : 'Re-connection failed. Check that your database host, username, and password are correct, and your database allows incoming traffic.'
            });
        } catch (err: any) {
            return res.status(500).json({
                success: false,
                error: err.message || 'Error occurred during forced database re-connection.'
            });
        }
    });

    /**
     * RETRIEVE CURRENT DATABASE CONFIGURATION URL (UNMASKED FOR DIAGNOSTIC LOADER)
     */
    app.get('/api/get-raw-database-url', (req, res) => {
        res.json({
            url: process.env.DATABASE_URL || ''
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
            port: port.toString(),
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
    if (!isProductionMode) {
        console.info("🛠️ [Setup] Server starting in DEVELOPMENT Mode. Initializing Vite dev server middleware...");
        try {
            const viteModule = await Function('return import("vite")')();
            const { createServer: createViteServer } = viteModule;
            const vite = await createViteServer({
                server: { middlewareMode: true },
                appType: 'spa'
            });
            app.use(vite.middlewares);
        } catch (viteImportErr: any) {
            console.error("🚨 Failed to dynamically load Vite in dev mode:", viteImportErr.message || viteImportErr);
            console.info("🩹 Fallback Action: Attuning to production-grade asset delivery to prevent startup crash.");
            let distPath = path.join(process.cwd(), 'dist');
            if (!fs.existsSync(path.join(distPath, 'index.html')) && fs.existsSync(path.join(_dirname, 'index.html'))) {
                distPath = _dirname;
            }
            if (fs.existsSync(path.join(distPath, 'index.html'))) {
                console.info(`📂 Serving static files from verified directory: "${distPath}"`);
                app.use(express.static(distPath));
                app.use((req, res) => {
                    res.sendFile(path.join(distPath, 'index.html'));
                });
            } else {
                console.error("🚨 Fallback failed: 'dist/index.html' not found under either directory path.");
                throw viteImportErr;
            }
        }
    } else {
        console.info("🌐 [Setup] Server starting in PRODUCTION Mode. Serving compiled static assets...");
        let distPath = path.join(process.cwd(), 'dist');
        
        // Dynamic fallback matching compile location inside 'dist' folder
        if (!fs.existsSync(path.join(distPath, 'index.html'))) {
            if (fs.existsSync(path.join(_dirname, 'index.html'))) {
                distPath = _dirname;
            }
        }

        if (fs.existsSync(path.join(distPath, 'index.html'))) {
            console.info(`📂 Serving static files from verified directory: "${distPath}"`);
            app.use(express.static(distPath));
            app.use((req, res) => {
                res.sendFile(path.join(distPath, 'index.html'));
            });
        } else {
            console.error(`🚨 CRITICAL ERROR: 'dist/index.html' not found under root "${process.cwd()}" or location "${_dirname}". Starting a safe fallback response to ensure health checks pass.`);
            app.use((req, res) => {
                res.status(500).send(`
                    <html>
                        <head>
                            <title>Configuration or Deployment Error</title>
                            <style>body { font-family: sans-serif; padding: 40px; background: #0f172a; color: #f8fafc; line-height: 1.6; max-width: 600px; margin: 0 auto; }</style>
                        </head>
                        <body>
                            <h2>🚨 Build / Deployment Configuration Notice</h2>
                            <p>Express server is active and listening on port ${port}, but compiled frontend files are missing.</p>
                            <p><strong>Diagnosis:</strong> The 'dist' front-end directory or 'dist/index.html' was not found.</p>
                            <p><strong>Solution:</strong> Ensure that <code>npm run build</code> runs as part of your deployment build phase so the Vite client is compiled.</p>
                        </body>
                    </html>
                `);
            });
        }
    }

    // Start listening on port only when all API endpoints and static assets are fully configured
    try {
        const serverInstance = app.listen(port, "0.0.0.0", () => {
            console.log(`🌐 Resilient Express Server listening on http://0.0.0.0:${port} (Vite port context: ${process.env.PORT || 'none (default 3000)'})`);
        });

        serverInstance.on('error', (err: any) => {
            console.error("🚨 Resilient Server binding error event:", err);
            if (err.code === 'EADDRINUSE') {
                console.error(`💡 HINT: Host port ${port} is already in use by another active process. Check system metrics.`);
            }
        });
    } catch (listenError: any) {
        console.error("🚨 CRITICAL: Synchronous error during app.listen():", listenError.message || listenError);
        process.exit(1);
    }

}

startServer(app).catch((err) => {
    console.error("🚨 CRITICAL ERROR DURING startServer():", err);
    process.exit(1);
});
