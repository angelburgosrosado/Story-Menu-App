const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function run() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS webhook_logs (
          id SERIAL PRIMARY KEY,
          source VARCHAR(255),
          event_type VARCHAR(255),
          payload TEXT,
          error_message TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Insert a dummy error log
    await pool.query(
      'INSERT INTO webhook_logs (source, event_type, payload, error_message) VALUES ($1, $2, $3, $4)',
      ['Stripe Webhook', 'payment_intent.payment_failed', '{"id":"pi_123"}', 'Card declined.']
    );
    console.log("Inserted dummy log.");
    
    // Fetch it
    const res = await pool.query('SELECT * FROM webhook_logs ORDER BY created_at DESC LIMIT 1');
    console.log("Log fetched:", res.rows[0]);
  } catch (e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
run();
