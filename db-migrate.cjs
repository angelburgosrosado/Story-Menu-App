require('dotenv').config();
const fs = require('fs');
const { Client } = require('pg');

const rawUrl = process.env.DATABASE_URL || "postgresql://angelburgosrosado:75727572Ab%21@34.148.244.49:5432/comics-v1";

async function runMigration() {
    console.log("Starting DB Migration...");
    const client = new Client({
        connectionString: rawUrl,
        ssl: { rejectUnauthorized: false }
    });
    
    try {
        await client.connect();
        console.log("Connected to database.");
        
        const schemaPath = require('path').join(__dirname, 'schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        
        await client.query(schemaSql);
        console.log("Migration executed successfully.");
    } catch (e) {
        console.error("Migration failed:", e);
    } finally {
        await client.end();
    }
}

runMigration();
