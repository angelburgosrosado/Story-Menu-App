const pg = require('pg');
const { Pool } = pg;

const connectionString = "postgresql://angelburgosrosado:75727572Ab%21@your_host:5432/comics-v1";

async function inspectAllSchemas() {
    const pool = new Pool({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        const client = await pool.connect();
        console.log("Connected successfully to DB!");

        // 1. Let's list all schemas in the database
        const schemasRes = await client.query(`
            SELECT schema_name 
            FROM information_schema.schemata 
            WHERE schema_name NOT IN ('pg_catalog', 'information_schema') 
            ORDER BY schema_name;
        `);
        console.log("\n--- Active Schemas in Database ---");
        console.log(schemasRes.rows.map(r => r.schema_name));

        // 2. Let's list all tables in ALL user schemas, with row counts!
        console.log("\n--- Tables and Row Counts across all Schemas ---");
        const tablesRes = await client.query(`
            SELECT table_schema, table_name 
            FROM information_schema.tables 
            WHERE table_schema NOT IN ('pg_catalog', 'information_schema') 
            ORDER BY table_schema, table_name;
        `);

        for (const row of tablesRes.rows) {
            const { table_schema, table_name } = row;
            try {
                const countRes = await client.query(`SELECT COUNT(*) as count FROM "${table_schema}"."${table_name}";`);
                console.log(`  [✓] ${table_schema}.${table_name}: ${countRes.rows[0].count} rows`);
            } catch (err) {
                console.log(`  [x] ${table_schema}.${table_name}: Could not count rows (${err.message})`);
            }
        }

        client.release();
    } catch (err) {
        console.error("Connection/inspection failed:", err.message);
    } finally {
        await pool.end();
    }
}

inspectAllSchemas();
