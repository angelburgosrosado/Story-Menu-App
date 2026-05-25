/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import pg from 'pg';
import net from 'net';

const { Pool } = pg;

let dbPool: pg.Pool | null = null;
let isDbActive = false;
let dbConnectionFailed = false;
let lastConnectionAttemptTime = 0;
let cachedDatabaseUrl = '';
let approvedPasswordOverride: string | null = null;

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

/**
 * Explicitly clears the database offline state block and re-enables active pool creation attempts.
 */
export function resetConnectionState() {
    console.info("🔌 Forcefully resetting database connection failure state. Enabling fresh handshakes...");
    dbConnectionFailed = false;
    isDbActive = false;
    lastConnectionAttemptTime = 0;
    approvedPasswordOverride = null;
    if (dbPool) {
        try {
            dbPool.end().catch(() => {});
        } catch (e) {}
        dbPool = null;
    }
}

/**
 * Resolves an isolated database schema name per connection URL username,
 * safely avoiding table permission and ownership conflicts on shared multi-tenant clusters.
 */
export function getIsolatedSchemaName(): string {
    if (!process.env.DATABASE_URL) return 'public';
    try {
        const parsed = parsePgUrl(process.env.DATABASE_URL);
        if (parsed && parsed.user) {
            const sanitizedUser = parsed.user.toLowerCase().replace(/[^a-z0-9_]/g, '');
            if (sanitizedUser) {
                return `vault_app_${sanitizedUser}`;
            }
        }
    } catch {}
    return 'vault_app_default';
}

export function getDbPool(): pg.Pool | null {
    if (!process.env.DATABASE_URL) {
        if (!isDbActive) {
            console.warn("⚠️ No DATABASE_URL found. Running applet with safe local-storage and in-memory fallback databases.");
            isDbActive = false;
        }
        return null;
    }

    const currentUrl = process.env.DATABASE_URL || '';
    if (currentUrl !== cachedDatabaseUrl) {
        console.info("🔄 Detected database connection URL changed or configured. Clearing old pool and resetting connection state.");
        resetConnectionState();
        cachedDatabaseUrl = currentUrl;
    }

    // Dynamic Self-Healing Retry Cooldown:
    // If connection was marked as failed, but more than 15 seconds have elapsed since the last attempt,
    // clear the failure flag to allow another connection.
    if (dbConnectionFailed) {
        const now = Date.now();
        if (now - lastConnectionAttemptTime > 15000) {
            console.info("🩹 Self-Healing mechanism: 15-second offline cooldown elapsed. Retrying database connection...");
            dbConnectionFailed = false;
        } else {
            return null; // Keep returning null during the 15s rate-limit window
        }
    }

    if (!dbPool) {
        lastConnectionAttemptTime = Date.now();
        try {
            const parsed = parsePgUrl(process.env.DATABASE_URL);
            if (parsed) {
                const passwordToUse = approvedPasswordOverride || parsed.password;
                dbPool = new Pool({
                    user: parsed.user,
                    password: passwordToUse,
                    host: parsed.host,
                    port: parsed.port,
                    database: parsed.dbName,
                    ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false },
                    connectionTimeoutMillis: 5000 // 5-second fast failover for timeouts
                });
            } else {
                dbPool = new Pool({
                    connectionString: process.env.DATABASE_URL,
                    ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false },
                    connectionTimeoutMillis: 5000 // 5-second fast failover for timeouts
                });
            }
            
            // Listen for connection events to automatically apply the isolated search path to every client in the pool
            const schemaName = getIsolatedSchemaName();
            dbPool.on('connect', (client) => {
                if (schemaName !== 'public') {
                    client.query(`SET search_path TO ${schemaName}, public;`).catch(err => {
                        console.warn(`⚠️ Error setting search_path for schema "${schemaName}" on database client connect:`, err.message);
                    });
                }
            });

            // Listen for unexpected errors on idle clients to prevent Node server crashes
            dbPool.on('error', (err) => {
                console.error("📋 Unexpected database pool state transition error:", err.message);
                markDatabaseOffline();
            });

            isDbActive = true;
            console.log(`🔌 Connected to PostgreSQL Database Pool successfully. Isolated schema: "${schemaName}"`);
        } catch (error) {
            console.error("❌ Failed to initialize PostgreSQL pool:", error);
            dbPool = null;
            isDbActive = false;
            dbConnectionFailed = true;
            lastConnectionAttemptTime = Date.now();
        }
    }
    return dbPool;
}

export function isDatabaseConnected(): boolean {
    return isDbActive && !dbConnectionFailed && getDbPool() !== null;
}

export function markDatabaseOffline() {
    if (!dbConnectionFailed) {
        console.warn("🔻 Deactivating PostgreSQL and falling back to in-memory sandbox.");
        dbConnectionFailed = true;
        isDbActive = false;
        lastConnectionAttemptTime = Date.now();
        if (dbPool) {
            try {
                dbPool.end().catch(() => {});
            } catch (e) {}
            dbPool = null;
        }
    }
}

function safeDecode(val: string): string {
    try {
        return decodeURIComponent(val);
    } catch {
        return val;
    }
}

/**
 * Safe parser for PostgreSQL URLs to handle passwords containing '@' or special characters
 */
function parsePgUrl(urlStr: string) {
    try {
        const doubleSlashIdx = urlStr.indexOf('://');
        if (doubleSlashIdx === -1) return null;
        
        const protocols = urlStr.substring(0, doubleSlashIdx);
        const rest = urlStr.substring(doubleSlashIdx + 3);
        
        const firstSlashInRest = rest.indexOf('/');
        const authority = firstSlashInRest === -1 ? rest : rest.substring(0, firstSlashInRest);
        let dbName = firstSlashInRest === -1 ? '' : rest.substring(firstSlashInRest + 1);
        
        // Strip out any URL query parameters (like ?sslmode=require) from dbName
        const qIdx = dbName.indexOf('?');
        if (qIdx !== -1) {
            dbName = dbName.substring(0, qIdx);
        }
        
        const lastAtIdx = authority.lastIndexOf('@');
        let credentials = '';
        let hostPort = '';
        if (lastAtIdx === -1) {
            hostPort = authority;
        } else {
            credentials = authority.substring(0, lastAtIdx);
            hostPort = authority.substring(lastAtIdx + 1);
        }
        
        let user = '';
        let password = '';
        const colonInCreds = credentials.indexOf(':');
        if (colonInCreds === -1) {
            user = credentials;
        } else {
            user = credentials.substring(0, colonInCreds);
            password = credentials.substring(colonInCreds + 1);
        }
        
        let host = '';
        let port = 5432;
        const lastColonInHostPort = hostPort.lastIndexOf(':');
        if (lastColonInHostPort === -1) {
            host = hostPort;
        } else {
            host = hostPort.substring(0, lastColonInHostPort);
            const p = parseInt(hostPort.substring(lastColonInHostPort + 1), 10);
            if (!isNaN(p)) {
                port = p;
            }
        }
        
        return { 
            user: safeDecode(user), 
            password: safeDecode(password), 
            rawPassword: password,
            host, 
            port, 
            dbName: safeDecode(dbName) 
        };
    } catch (e) {
        return null;
    }
}

/**
 * Low-level TCP port probe to verify network reachability and isolate firewall blocks
 */
function testTcpPort(host: string, port: number, timeoutMs = 4000): Promise<{ ok: boolean; error?: string }> {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        
        socket.setTimeout(timeoutMs);
        
        socket.on('connect', () => {
            socket.destroy();
            resolve({ ok: true });
        });
        
        socket.on('timeout', () => {
            socket.destroy();
            resolve({ ok: false, error: 'TIMEOUT - No response packet. The server/firewall at ' + host + ':' + port + ' did not reply to connection requests within ' + timeoutMs + 'ms. This is highly indicative of a firewall dropping external routing packets.' });
        });
        
        socket.on('error', (err: any) => {
            socket.destroy();
            if (err.code === 'ECONNREFUSED') {
                resolve({ ok: false, error: 'CONNECTION REFUSED - The server at ' + host + ':' + port + ' actively rejected the connection. This means the server is online but port ' + port + ' is closed, not listening on public interfaces, or the PG service is inactive.' });
            } else {
                resolve({ ok: false, error: err.message || 'SOCKET ERROR - Network connection was interrupted.' });
            }
        });
        
        socket.connect(port, host);
    });
}

/**
 * Test a custom connection string on-demand to diagnose connectivity issues before applying it
 */
export async function testCustomConnectionString(connectionString: string): Promise<{ success: boolean; error?: string; version?: string }> {
    if (!connectionString) {
        return { success: false, error: "Empty database URL string provided." };
    }

    const parsed = parsePgUrl(connectionString);
    if (!parsed) {
        return { 
            success: false, 
            error: "MALFORMED URL: Ensure your connection string starts with 'postgresql://' or 'postgres://'." 
        };
    }

    const { host, port, user, password, rawPassword, dbName } = parsed;

    // Phase 1: TCP Probe
    console.log(`🔍 Probing connection: TCP socket connection to ${host}:${port}...`);
    const tcpResult = await testTcpPort(host, port, 4000);
    if (!tcpResult.ok) {
        return {
            success: false,
            error: `❌ Network connection failed!\nLink Status: OFFLINE\nDiagnostic: ${tcpResult.error}\n\nHelp: Since our hosting runs in Cloud Run sandbox, secure your PostgreSQL firewall by whitelisting inbound port ${port} traffic from all sources (0.0.0.0/0) or verify your host and router setups.`
        };
    }

    // Phase 2: PostgreSQL Client Login Verification (Attempt 1: Decoded password)
    console.log(`🔌 TCP port ${port} is open! Initiating PostgreSQL protocol authentication handshake...`);
    
    let authenticated = false;
    let authError: any = null;
    let version = '';
    let successfulPassword = password;

    const testPoolDecoded = new Pool({
        user,
        password,
        host,
        port,
        database: dbName,
        connectionTimeoutMillis: 5000,
        ssl: connectionString.includes('localhost') || connectionString.includes('127.0.0.1') ? false : { rejectUnauthorized: false }
    });

    try {
        const client = await testPoolDecoded.connect();
        try {
            const res = await client.query('SELECT version();');
            version = res.rows[0]?.version || 'PostgreSQL Connection Successful';
            authenticated = true;
            successfulPassword = password;
            console.log("✔️ PostgreSQL handshake authenticated successfully.");
        } finally {
            client.release();
        }
    } catch (err: any) {
        authError = err;
    } finally {
        await testPoolDecoded.end().catch(() => {});
    }

    // Attempt 2: If attempt 1 fails and we have a different raw password (e.g., literally has %40)
    if (!authenticated && rawPassword && rawPassword !== password) {
        const testPoolRaw = new Pool({
            user,
            password: rawPassword,
            host,
            port,
            database: dbName,
            connectionTimeoutMillis: 5000,
            ssl: connectionString.includes('localhost') || connectionString.includes('127.0.0.1') ? false : { rejectUnauthorized: false }
        });

        try {
            const client = await testPoolRaw.connect();
            try {
                const res = await client.query('SELECT version();');
                version = res.rows[0]?.version || 'PostgreSQL Connection Successful';
                authenticated = true;
                successfulPassword = rawPassword;
                console.log("✔️ PostgreSQL handshake authenticated successfully using raw password option.");
            } finally {
                client.release();
            }
        } catch (err: any) {
            // Keep original decoded error for debugging unless completely different
        } finally {
            await testPoolRaw.end().catch(() => {});
        }
    }

    if (authenticated) {
        // If the tested string matches the active env, dynamically reboot the active pools
        if (connectionString === process.env.DATABASE_URL) {
            approvedPasswordOverride = successfulPassword;
            dbConnectionFailed = false;
            isDbActive = false;
            if (dbPool) {
                await dbPool.end().catch(() => {});
                dbPool = null;
            }
        }
        return { success: true, version };
    }

    // Handshake failed completely
    const err = authError || new Error("Password authentication handshake rejected.");
    let authHint = "";
    const containsAtInPassword = password && password.includes('@');
    if (containsAtInPassword && !connectionString.includes('%40')) {
        authHint = "\n\n💡 REACTIONARY ADVICE: We detected an unencoded '@' character in your database password credentials! " +
                   "In PostgreSQL URLs, passwords with '@' must be URL-encoded as '%40' to prevent URL parser confusion. " +
                   "Try replacing '@' in your password with '%40' and attempt the test again.";
    } else if (err.message && err.message.includes('password authentication failed')) {
        authHint = "\n\n💡 USER ADVICE: The database server rejected your credentials. Verify that the username and password are correct.";
    } else if (err.message && err.message.includes('database') && err.message.includes('does not exist')) {
        authHint = "\n\n💡 DATABASE ADVICE: The login credentials succeeded, but the specific database name in your URL path does not exist on that Postgres server. Create the database first or check your spelling.";
    }

    return { 
        success: false, 
        error: `✔️ Network connection established (TCP Port ${port} is OPEN), but PostgreSQL database handshake failed!\nAuthentication Error: ${err.message}${authHint}` 
    };
}

/**
 * Automate basic schema verification/checks on startup if DATABASE_URL is set
 */
export async function initializeDatabaseSchema() {
    if (!process.env.DATABASE_URL) {
        return;
    }
    
    let pool = getDbPool();
    if (!pool) return;

    let success = false;
    let client: pg.PoolClient | null = null;
    let fallbackAttempted = false;

    try {
        console.log("🚀 Verifying schema states in connected PostgreSQL...");
        client = await pool.connect();
        success = true;
    } catch (err: any) {
        // Handle password auth dual fallback directly inside schema validator
        const parsed = parsePgUrl(process.env.DATABASE_URL || '');
        if (err.message && err.message.includes('password authentication failed') && parsed && parsed.rawPassword && parsed.rawPassword !== parsed.password) {
            approvedPasswordOverride = parsed.rawPassword;
            fallbackAttempted = true;
            // Dispose current pool and replace
            if (dbPool) {
                await dbPool.end().catch(() => {});
            }
            dbPool = new Pool({
                user: parsed.user,
                password: parsed.rawPassword,
                host: parsed.host,
                port: parsed.port,
                database: parsed.dbName,
                ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false },
                connectionTimeoutMillis: 5000
            });
            pool = dbPool;
            try {
                client = await pool.connect();
                success = true;
                console.log("✔️ PostgreSQL connection active using raw password fallback.");
            } catch (retryErr: any) {
                err = retryErr;
            }
        }

        if (!success) {
            console.warn("🔌 Note: PostgreSQL database is configured but currently offline or unreachable. " +
                         "Deactivating DB pool connection and falling back gracefully to interactive sandbox mode.");
            let hint = "";
            if (err.message && err.message.includes('EAI_AGAIN')) {
                hint = " 💡 HINT: This is a DNS lookup failure (getaddrinfo timed out or host could not resolve). Ensure your hostname is a valid public IP or domain name, and ensure any '@' characters in password credentials are URL-encoded as '%40'.";
                if (err.message.includes('base')) {
                    hint += "\n❓ DETECTED INVALID HOSTNAME 'base': It looks like your DATABASE_URL connection string contains 'base' as the hostname (or inside a placeholder). This is common if a placeholder like 'postgresql://username:password@base:5432' has been used instead of your real public IP or database hostname. Please verify your DATABASE_URL in settings!";
                }
            }
            console.info(`ℹ️ Connect error details: ${err.message}${hint}`);
            markDatabaseOffline();
            return;
        }
    }

    if (success && client) {
        try {
            // Apply isolated user schema first
            const schemaName = getIsolatedSchemaName();
            if (schemaName !== 'public') {
                console.log(`🔨 Directing connection search_path to isolated schema namespace: "${schemaName}"`);
                await client.query(`CREATE SCHEMA IF NOT EXISTS ${schemaName};`);
                await client.query(`SET search_path TO ${schemaName}, public;`);
            }

            // Check if all expected tables are already present and readable
            let tablesExistAndAccessible = false;
            try {
                await client.query('SELECT 1 FROM users LIMIT 1;');
                await client.query('SELECT 1 FROM character_vault LIMIT 1;');
                await client.query('SELECT 1 FROM projects LIMIT 1;');
                await client.query('SELECT 1 FROM project_casting LIMIT 1;');
                tablesExistAndAccessible = true;
                console.log("🟢 Verified: Database tables already exist and are fully accessible. Skipping table schema creation to avoid ownership conflicts.");
            } catch (checkErr) {
                console.info("ℹ️ Some database tables are missing or inaccessible. Beginning lazy structure generation...");
            }

            if (!tablesExistAndAccessible) {
                // Try creating extension
                try {
                    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
                } catch (extErr: any) {
                    console.warn(`⚠️ Warning: Could not create uuid-ossp extension (${extErr.message}). Continuing schema creation.`);
                }
                
                // Create users table
                try {
                    await client.query(`
                        CREATE TABLE IF NOT EXISTS users (
                            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                            email VARCHAR(255) UNIQUE NOT NULL,
                            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                        );
                    `);
                } catch (tblErr: any) {
                    console.error(`❌ Error creating users table: ${tblErr.message}`);
                    throw tblErr; // Users table is critical
                }

                // Create character_vault table
                try {
                    await client.query(`
                        CREATE TABLE IF NOT EXISTS character_vault (
                            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                            character_name VARCHAR(100) NOT NULL,
                            role_type VARCHAR(50) NOT NULL,
                            description TEXT,
                            image_url TEXT,
                            spatial_vectors JSONB,
                            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                        );
                    `);
                } catch (tblErr: any) {
                    console.error(`❌ Error creating character_vault table: ${tblErr.message}`);
                    throw tblErr;
                }

                // Create projects table
                try {
                    await client.query(`
                        CREATE TABLE IF NOT EXISTS projects (
                            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                            title VARCHAR(255) NOT NULL,
                            genre VARCHAR(50) NOT NULL,
                            language VARCHAR(50) NOT NULL,
                            current_page INT DEFAULT 1,
                            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                        );
                    `);
                } catch (tblErr: any) {
                    console.error(`❌ Error creating projects table: ${tblErr.message}`);
                    throw tblErr;
                }

                // Create project_casting table
                try {
                    await client.query(`
                        CREATE TABLE IF NOT EXISTS project_casting (
                            project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
                            character_id UUID REFERENCES character_vault(id) ON DELETE CASCADE,
                            PRIMARY KEY (project_id, character_id)
                        );
                    `);
                } catch (tblErr: any) {
                    console.error(`❌ Error creating project_casting table: ${tblErr.message}`);
                    throw tblErr;
                }

                // Index creation block (typically requires table ownership, so catch separately)
                try {
                    await client.query(`CREATE INDEX IF NOT EXISTS idx_character_vault_user ON character_vault(user_id);`);
                } catch (idxErr: any) {
                    console.warn(`⚠️ Warning: Could not create index on character_vault (${idxErr.message}). Database will continue running.`);
                }

                try {
                    await client.query(`CREATE INDEX IF NOT EXISTS idx_projects_user ON projects(user_id);`);
                } catch (idxErr: any) {
                    console.warn(`⚠️ Warning: Could not create index on projects (${idxErr.message}). Database will continue running.`);
                }

                console.log("✅ Schema validated and structures prepared.");
            }
        } catch (schemaErr: any) {
            console.error("❌ Failed to validate or prepare table structures in connected database:", schemaErr.message);
            // Double check if tables are accessible now anyway
            try {
                await client.query('SELECT 1 FROM users LIMIT 1;');
                await client.query('SELECT 1 FROM character_vault LIMIT 1;');
                console.log("🟢 Tables are queryable despite schema errors. Maintaining database connection active.");
            } catch (finalCheckErr) {
                markDatabaseOffline();
            }
        } finally {
            client.release();
        }
    }
}
