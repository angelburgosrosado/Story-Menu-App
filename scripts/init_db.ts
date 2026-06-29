import pg from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
const { Pool } = pg;

dotenv.config();

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl || dbUrl.includes('[YOUR-PASSWORD]')) {
    console.error("❌ ERROR: DATABASE_URL is not set or contains the placeholder '[YOUR-PASSWORD]'.");
    console.error("Please update your .env file with the real password and try again.");
    process.exit(1);
}

const pool = new Pool({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }
});

async function init() {
    console.log("Connecting to Postgres...");
    
    // Read the existing schema
    let schemaSql = fs.readFileSync(path.join(process.cwd(), 'schema.sql'), 'utf-8');
    
    // Add the missing tables that were previously mocked
    schemaSql += `
        -- Missing Admin Tables
        CREATE TABLE IF NOT EXISTS admin_users (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            username VARCHAR(255) UNIQUE NOT NULL,
            role VARCHAR(50) DEFAULT 'admin',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS admin_sessions (
            token VARCHAR(255) PRIMARY KEY,
            username VARCHAR(255) NOT NULL,
            expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        -- Missing AI Usage Logs
        CREATE TABLE IF NOT EXISTS ai_usage_logs (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_email VARCHAR(255) NOT NULL,
            operation VARCHAR(100) NOT NULL,
            model VARCHAR(100) NOT NULL,
            tokens_in INT DEFAULT 0,
            tokens_out INT DEFAULT 0,
            cost_usd NUMERIC(10, 5) DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
    `;

    try {
        console.log("Executing schema SQL...");
        await pool.query(schemaSql);
        console.log("✅ Database schema initialized successfully!");
    } catch (e) {
        console.error("❌ Failed to initialize schema:");
        console.error(e);
    } finally {
        await pool.end();
    }
}

init();
