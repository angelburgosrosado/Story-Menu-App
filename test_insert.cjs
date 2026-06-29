const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function run() {
  try {
    await pool.query('INSERT INTO admin_users (username, password_hash, salt) VALUES ($1, $2, $3)', ['testadmin2', 'hash', 'salt']);
    console.log("Insert successful!");
    await pool.query("DELETE FROM admin_users WHERE username='testadmin2'");
  } catch (e) {
    console.error("Error during insert:", e);
  } finally {
    pool.end();
  }
}
run();
