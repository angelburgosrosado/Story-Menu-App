/**
 * Database Migrations — Task 5.3
 * Versioned migration runner for PostgreSQL schema changes.
 * Run with: npx tsx db/migrate.ts
 */

import { Pool } from 'pg';

interface Migration {
    version: number;
    name: string;
    up: string;
    down: string;
}

const migrations: Migration[] = [
    {
        version: 1,
        name: 'add_user_roles',
        up: `
            ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'viewer';
            ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) DEFAULT 'active';
            ALTER TABLE users ADD COLUMN IF NOT EXISTS last_payment_at TIMESTAMP;
            CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
            CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
        `,
        down: `
            DROP INDEX IF EXISTS idx_users_email;
            DROP INDEX IF EXISTS idx_users_role;
            ALTER TABLE users DROP COLUMN IF EXISTS last_payment_at;
            ALTER TABLE users DROP COLUMN IF EXISTS subscription_status;
            ALTER TABLE users DROP COLUMN IF EXISTS role;
        `
    },
    {
        version: 2,
        name: 'add_deletion_requests',
        up: `
            CREATE TABLE IF NOT EXISTS deletion_requests (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) NOT NULL,
                reason TEXT,
                status VARCHAR(50) DEFAULT 'pending',
                requested_at TIMESTAMP DEFAULT NOW(),
                processed_at TIMESTAMP,
                processed_by VARCHAR(255)
            );
            CREATE INDEX IF NOT EXISTS idx_deletion_requests_status ON deletion_requests(status);
        `,
        down: `
            DROP INDEX IF EXISTS idx_deletion_requests_status;
            DROP TABLE IF EXISTS deletion_requests;
        `
    },
    {
        version: 3,
        name: 'add_audit_log',
        up: `
            CREATE TABLE IF NOT EXISTS audit_log (
                id SERIAL PRIMARY KEY,
                actor_email VARCHAR(255) NOT NULL,
                action VARCHAR(100) NOT NULL,
                target_type VARCHAR(50),
                target_id VARCHAR(255),
                metadata JSONB,
                created_at TIMESTAMP DEFAULT NOW()
            );
            CREATE INDEX IF NOT EXISTS idx_audit_log_actor ON audit_log(actor_email);
            CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);
            CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at);
        `,
        down: `
            DROP INDEX IF EXISTS idx_audit_log_created;
            DROP INDEX IF EXISTS idx_audit_log_action;
            DROP INDEX IF EXISTS idx_audit_log_actor;
            DROP TABLE IF EXISTS audit_log;
        `
    }
];

async function runMigrations() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        // Create migrations tracking table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS _migrations (
                version INTEGER PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                applied_at TIMESTAMP DEFAULT NOW()
            );
        `);

        // Get applied migrations
        const applied = await pool.query('SELECT version FROM _migrations ORDER BY version');
        const appliedVersions = new Set(applied.rows.map(r => r.version));

        // Run pending migrations
        for (const migration of migrations) {
            if (appliedVersions.has(migration.version)) {
                console.log(`⏭️  v${migration.version} "${migration.name}" — already applied`);
                continue;
            }

            console.log(`🔄 v${migration.version} "${migration.name}" — applying...`);
            await pool.query('BEGIN');
            try {
                await pool.query(migration.up);
                await pool.query(
                    'INSERT INTO _migrations (version, name) VALUES ($1, $2)',
                    [migration.version, migration.name]
                );
                await pool.query('COMMIT');
                console.log(`✅ v${migration.version} "${migration.name}" — done`);
            } catch (err: any) {
                await pool.query('ROLLBACK');
                console.error(`❌ v${migration.version} "${migration.name}" — failed: ${err.message}`);
                throw err;
            }
        }

        console.log('\n✅ All migrations complete');
    } finally {
        await pool.end();
    }
}

async function rollbackMigration(targetVersion: number) {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        const applied = await pool.query('SELECT version FROM _migrations ORDER BY version DESC');
        
        for (const row of applied.rows) {
            if (row.version <= targetVersion) break;
            
            const migration = migrations.find(m => m.version === row.version);
            if (!migration) continue;

            console.log(`⏪ v${migration.version} "${migration.name}" — rolling back...`);
            await pool.query('BEGIN');
            try {
                await pool.query(migration.down);
                await pool.query('DELETE FROM _migrations WHERE version = $1', [migration.version]);
                await pool.query('COMMIT');
                console.log(`✅ v${migration.version} "${migration.name}" — rolled back`);
            } catch (err: any) {
                await pool.query('ROLLBACK');
                console.error(`❌ v${migration.version} "${migration.name}" — rollback failed: ${err.message}`);
                throw err;
            }
        }
    } finally {
        await pool.end();
    }
}

// CLI
const args = process.argv.slice(2);
if (args[0] === 'rollback') {
    const target = parseInt(args[1] || '0', 10);
    rollbackMigration(target).catch(console.error);
} else {
    runMigrations().catch(console.error);
}
