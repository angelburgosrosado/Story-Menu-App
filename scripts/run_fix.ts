import pg from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
const { Pool } = pg;
dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    let sql = fs.readFileSync(path.join(process.cwd(), 'fix_types.sql'), 'utf-8');
    try {
        await pool.query(sql);
        console.log("✅ Fix executed successfully!");
    } catch (e) {
        console.error("❌ Failed to execute:");
        console.error(e);
    } finally {
        await pool.end();
    }
}
run();
