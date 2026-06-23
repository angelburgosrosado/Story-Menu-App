const pg = require('pg');
const { Pool } = pg;

const urlVal = process.env.DATABASE_URL || "postgresql://angelburgosrosado:75727572Ab%21@34.148.244.49:5432/comics-v1";

const pool = new Pool({
    connectionString: urlVal,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 10000
});

async function run() {
    try {
        const client = await pool.connect();
        
        // Ensure tokens column exists
        await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS tokens INTEGER DEFAULT 0;');
        
        const email = 'abglco@protonmail.com';
        
        // Ensure user exists
        const checkUser = await client.query('SELECT email FROM users WHERE email = $1', [email]);
        if (checkUser.rows.length === 0) {
            const id = email.replace(/[^a-zA-Z0-9]/g, '_');
            await client.query('INSERT INTO users (id, email, tokens, tier) VALUES ($1, $2, $3, $4)', [id, email, 1000000, 'free']);
            console.log(`Created user ${email} with 1,000,000 tokens`);
        } else {
            await client.query('UPDATE users SET tokens = $1 WHERE email = $2', [1000000, email]);
            console.log(`Updated user ${email} to 1,000,000 tokens`);
        }

        const res = await client.query('SELECT * FROM users WHERE email = $1', [email]);
        console.log("User record:", res.rows[0]);
        
        client.release();
    } catch (e) {
        console.error("Error:", e);
    } finally {
        await pool.end();
    }
}

run();
