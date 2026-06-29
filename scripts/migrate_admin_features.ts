import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load .env
const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
}

async function migrate() {
    if (!process.env.DATABASE_URL) {
        console.error('❌ DATABASE_URL is not set in .env');
        process.exit(1);
    }

    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log('Connecting to Postgres...');
        await pool.query('SELECT 1');

        console.log('Altering character_vault...');
        try {
            await pool.query(`ALTER TABLE character_vault ADD COLUMN is_global BOOLEAN DEFAULT false;`);
            console.log('✅ Added is_global to character_vault.');
        } catch (e: any) {
            if (e.message.includes('already exists') || e.code === '42701') {
                console.log('⚠️ is_global already exists on character_vault.');
            } else {
                throw e;
            }
        }

        console.log('Creating webhook_logs table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS webhook_logs (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                provider VARCHAR(50) NOT NULL,
                event_type VARCHAR(100),
                payload JSONB,
                status VARCHAR(50),
                error_message TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ Created webhook_logs table.');

        console.log('Updating schema.sql to match...');
        const schemaPath = path.join(process.cwd(), 'schema.sql');
        if (fs.existsSync(schemaPath)) {
            let schema = fs.readFileSync(schemaPath, 'utf8');
            if (!schema.includes('is_global BOOLEAN')) {
                schema = schema.replace(
                    'created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP',
                    'is_global BOOLEAN DEFAULT false,\n    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP'
                );
            }
            if (!schema.includes('webhook_logs')) {
                schema += `\n-- 9. WEBHOOK LOGS (System health and external events)
CREATE TABLE IF NOT EXISTS webhook_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider VARCHAR(50) NOT NULL,
    event_type VARCHAR(100),
    payload JSONB,
    status VARCHAR(50),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);\n`;
            }
            fs.writeFileSync(schemaPath, schema);
            console.log('✅ Updated schema.sql');
        }

        console.log('🎉 Migration completed successfully!');
    } catch (e) {
        console.error('❌ Migration failed:', e);
    } finally {
        await pool.end();
    }
}

migrate();
