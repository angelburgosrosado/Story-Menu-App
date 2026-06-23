import { getDbPool } from './db.js';

async function grantTokens() {
    const pool = getDbPool();
    const email = 'angelburgosrosado@gmail.com';
    
    // Create user if not exists
    await pool.query('INSERT INTO users (id, email) VALUES ($1, $2)', ['angelburgosrosado_gmail_com', email]);
    
    // Update tokens
    await pool.query('UPDATE users SET tokens = $1 WHERE email = $2', [1000000, email]);
    
    // Verify
    const res = await pool.query('SELECT tokens FROM users WHERE email = $1', [email]);
    console.log(`User ${email} now has ${res.rows[0]?.tokens} tokens.`);
}

grantTokens().catch(console.error);
