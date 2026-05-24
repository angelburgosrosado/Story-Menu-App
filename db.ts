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

export function getDbPool(): pg.Pool | null {
    if (!process.env.DATABASE_URL) {
        if (!isDbActive) {
            console.warn("⚠️ No DATABASE_URL found. Running applet with safe local-storage and in-memory fallback databases.");
            isDbActive = false;
        }
        return null;
    }

    if (dbConnectionFailed) {
        return null;
    }

    if (!dbPool) {
        try {
            dbPool = new Pool({
                connectionString: process.env.DATABASE_URL,
                ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false },
                connectionTimeoutMillis: 5000 // 5-second fast failover for timeouts
            });
            
            // Listen for unexpected errors on idle clients to prevent Node server crashes
            dbPool.on('error', (err) => {
                console.error("📋 Unexpected database pool state transition error:", err.message);
                markDatabaseOffline();
            });

            isDbActive = true;
            console.log("🔌 Connected to PostgreSQL Database Pool successfully.");
        } catch (error) {
            console.error("❌ Failed to initialize PostgreSQL pool:", error);
            dbPool = null;
            isDbActive = false;
            dbConnectionFailed = true;
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
        if (dbPool) {
            try {
                dbPool.end().catch(() => {});
            } catch (e) {}
            dbPool = null;
        }
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
        const dbName = firstSlashInRest === -1 ? '' : rest.substring(firstSlashInRest + 1);
        
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
        
        return { user, password, host, port, dbName };
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

    const { host, port, user, password } = parsed;

    // Phase 1: TCP Probe
    console.log(`🔍 Probing connection: TCP socket connection to ${host}:${port}...`);
    const tcpResult = await testTcpPort(host, port, 4000);
    if (!tcpResult.ok) {
        return {
            success: false,
            error: `❌ Network connection failed!\nLink Status: OFFLINE\nDiagnostic: ${tcpResult.error}\n\nHelp: Since our hosting runs in Cloud Run sandbox, secure your PostgreSQL firewall by whitelisting inbound port ${port} traffic from all sources (0.0.0.0/0) or verify your host and router setups.`
        };
    }

    // Phase 2: PostgreSQL Client Login Verification
    console.log(`🔌 TCP port ${port} is open! Initiating PostgreSQL protocol authentication handshake...`);
    const testPool = new Pool({
        connectionString,
        connectionTimeoutMillis: 5000,
        ssl: connectionString.includes('localhost') || connectionString.includes('127.0.0.1') ? false : { rejectUnauthorized: false }
    });

    try {
        const client = await testPool.connect();
        try {
            const res = await client.query('SELECT version();');
            const version = res.rows[0]?.version || 'PostgreSQL Connection Successful';
            return { success: true, version };
        } finally {
            client.release();
        }
    } catch (err: any) {
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
    } finally {
        await testPool.end().catch(() => {});
    }
}

/**
 * Automate basic schema verification/checks on startup if DATABASE_URL is set
 */
export async function initializeDatabaseSchema() {
    if (!process.env.DATABASE_URL) {
        return;
    }
    
    const pool = getDbPool();
    if (!pool) return;

    try {
        console.log("🚀 Verifying schema states in connected PostgreSQL...");
        const client = await pool.connect();
        try {
            await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
            
            await client.query(`
                CREATE TABLE IF NOT EXISTS users (
                    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                    email VARCHAR(255) UNIQUE NOT NULL,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                );
            `);

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

            await client.query(`
                CREATE TABLE IF NOT EXISTS project_casting (
                    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
                    character_id UUID REFERENCES character_vault(id) ON DELETE CASCADE,
                    PRIMARY KEY (project_id, character_id)
                );
            `);

            await client.query(`CREATE INDEX IF NOT EXISTS idx_character_vault_user ON character_vault(user_id);`);
            await client.query(`CREATE INDEX IF NOT EXISTS idx_projects_user ON projects(user_id);`);

            console.log("✅ Schema validated and indexes prepared.");
        } finally {
            client.release();
        }
    } catch (err: any) {
        console.warn("🔌 Note: PostgreSQL database is configured but currently offline or unreachable. " +
                     "Deactivating DB pool connection and falling back gracefully to interactive sandbox mode.");
        console.info(`ℹ️ Connect error details: ${err.message}`);
        markDatabaseOffline();
    }
}
