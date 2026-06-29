const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function run() {
  try {
    await pool.query('DROP TABLE IF EXISTS webhook_logs');
    console.log("Dropped webhook_logs table.");
  } catch (e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
run();
