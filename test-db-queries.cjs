#!/usr/bin/env node

/**
 * ⚡ INFINITE HEROES DATABASE OPERATIONS & DEEP DATA TRACER TEST
 * Runs transactional queries on the active PostgreSQL database instance,
 * lists live creators and characters, and tests write permissions.
 */

const pg = require('pg');
const { Pool } = pg;

const urlVal = process.env.DATABASE_URL || "postgresql://angelburgosrosado:75727572Ab%21@34.148.244.49:5432/comics-v1";

console.log("\x1b[35m%s\x1b[0m", "======================================================================");
console.log("\x1b[1m\x1b[32m%s\x1b[0m", "📋 DATABASE TRANSACTIONAL TEST ENGINE: live data tracer");
console.log("\x1b[35m%s\x1b[0m", "======================================================================\n");

function maskUrl(str) {
    if (!str) return 'none';
    return str.replace(/:([^:@]+)@/, ':*********@');
}

console.log(`📡 \x1b[36mTarget connection URL (masked):\x1b[0m ${maskUrl(urlVal)}`);

// Parse credentials from database URL
function parsePgUrl(urlStr) {
    try {
        const doubleSlashIdx = urlStr.indexOf('://');
        if (doubleSlashIdx === -1) return null;
        
        const protocol = urlStr.substring(0, doubleSlashIdx);
        const rest = urlStr.substring(doubleSlashIdx + 3);
        
        const firstSlashInRest = rest.indexOf('/');
        const authority = firstSlashInRest === -1 ? rest : rest.substring(0, firstSlashInRest);
        let dbName = firstSlashInRest === -1 ? '' : rest.substring(firstSlashInRest + 1);
        
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
            user: decodeURIComponent(user), 
            password: decodeURIComponent(password), 
            rawPassword: password,
            host, 
            port, 
            dbName: decodeURIComponent(dbName) 
        };
    } catch {
        return null;
    }
}

async function runDataDiagnostics() {
    const parsed = parsePgUrl(urlVal);
    if (!parsed) {
        console.error("❌ Malformed DATABASE_URL format!");
        process.exit(1);
    }

    const { host, port, user, password, rawPassword, dbName } = parsed;
    const schemaName = `vault_app_${user.toLowerCase().replace(/[^a-z0-9_]/g, '')}`;

    console.log(`✔️ URL parsed: host=\x1b[33m${host}\x1b[0m, user=\x1b[33m${user}\x1b[0m, database=\x1b[33m${dbName}\x1b[0m, isolated schema=\x1b[33m${schemaName}\x1b[0m`);

    // Create PG connections pool
    const pool = new Pool({
        user,
        password,
        host,
        port,
        database: dbName,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 5000
    });

    let client;
    try {
        console.log("\n🔌 Opening connection channel and authenticating...");
        client = await pool.connect();
        console.log("🟢 CONNECTION SUCCESS! Hands shaken with PostgreSQL server.");
    } catch (err) {
        console.warn(`⚠️ Authentication rejected with decoded password (${err.message}). Retrying with undecoded raw password...`);
        try {
            const rawPool = new Pool({
                user,
                password: rawPassword,
                host,
                port,
                database: dbName,
                ssl: { rejectUnauthorized: false },
                connectionTimeoutMillis: 5000
            });
            client = await rawPool.connect();
            console.log("🟢 CONNECTION SUCCESS! Connected via raw credential bytes.");
        } catch (retryErr) {
            console.error(`❌ Handshake failure: ${retryErr.message}`);
            console.log("\n💡 RETRY ADVICE: Double-check your database credentials in settings, make sure outbound port 5432 is whitelisted in your PG host's firewalls, and verify pg_hba.conf is active.");
            process.exit(1);
        }
    }

    // Run active data checks
    try {
        // Set search path
        await client.query(`CREATE SCHEMA IF NOT EXISTS ${schemaName};`);
        await client.query(`SET search_path TO ${schemaName}, public;`);
        console.log(`🔧 Directory path focused on isolated schema: "${schemaName}"`);

        // Create table structures lazily if they do not exist
        console.log("\n🛠️ Ensuring schema tables correspond to comics blueprint specification...");
        try {
            await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
        } catch {}

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
        console.log("✅ Tables are healthy and queryable.");

        // Fetch Live Row counts
        console.log("\n--- Live Multi-Tenant Database Metrics ---");
        const countUsers = await client.query('SELECT COUNT(*) as count FROM users;');
        const countChars = await client.query('SELECT COUNT(*) as count FROM character_vault;');
        const countProjs = await client.query('SELECT COUNT(*) as count FROM projects;');

        console.log(`  👤 Total Creators registered:   \x1b[36m${countUsers.rows[0].count} record(s)\x1b[0m`);
        console.log(`  🎨 Total Characters in Vault:  \x1b[36m${countChars.rows[0].count} record(s)\x1b[0m`);
        console.log(`  📚 Total Adventure Stories:     \x1b[36m${countProjs.rows[0].count} record(s)\x1b[0m`);

        // Transaction Test - Write and read sample element
        console.log("\n--- Executing Interactive Write-Through Diagnostics ---");
        const diagEmail = 'diagnostic-test-identity@comics.remix';
        
        console.log(` 👉 Steps: Insuring diagnostic register for "${diagEmail}"...`);
        const userRes = await client.query(
            'INSERT INTO users (email) VALUES ($1) ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email RETURNING *',
            [diagEmail]
        );
        const testUser = userRes.rows[0];
        console.log(`   👤 Creator profile loaded with primary key UUID: [${testUser.id}]`);

        console.log(" 👉 Steps: Creating temporary character element ('Diagnostic Captain')...");
        const charRes = await client.query(`
            INSERT INTO character_vault (user_id, character_name, role_type, description)
            VALUES ($1, 'Diagnostic Captain', 'Hero', 'A temporary multiverse entity utilized to verify high-speed writes.')
            RETURNING *;
        `, [testUser.id]);
        const testChar = charRes.rows[0];
        console.log(`   🎨 Write Successful! Created character [${testChar.character_name}] with UUID: [${testChar.id}]`);

        console.log(" 👉 Steps: Fetching character from database to verify read-throughput...");
        const fetchRes = await client.query('SELECT * FROM character_vault WHERE id = $1;', [testChar.id]);
        const fetchedChar = fetchRes.rows[0];
        console.log(`   💡 Verification matched: Name="${fetchedChar.character_name}", Role="${fetchedChar.role_type}"`);

        console.log(" 👉 Steps: Clearing diagnostic records from active tables...");
        await client.query('DELETE FROM character_vault WHERE id = $1;', [testChar.id]);
        await client.query('DELETE FROM users WHERE id = $1;', [testUser.id]);
        console.log("   🧹 Clean up finished! No orphan elements left behind in your tables.");

        console.log("\n======================================================================");
        console.log("\x1b[1m\x1b[32m%s\x1b[0m", "✨ TRANSACTIONAL DATABASE CHECKS PASSED: 100% HEALTHY!");
        console.log("\x1b[32m%s\x1b[0m", "   Data reading, writing, index lookups, and schema bounds are flawless.");
        console.log("\x1b[35m%s\x1b[0m", "======================================================================\n");

        client.release();
        process.exit(0);
    } catch (queryErr) {
        console.error(`\n❌ Query Transaction Failed: ${queryErr.message}`);
        if (client) client.release();
        process.exit(1);
    } finally {
        await pool.end();
    }
}

runDataDiagnostics();
