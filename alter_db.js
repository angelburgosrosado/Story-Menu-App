const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function run() {
  try {
    await pool.query('ALTER TABLE character_vault ADD COLUMN IF NOT EXISTS generation_prompt TEXT;');
    await pool.query('ALTER TABLE character_vault ADD COLUMN IF NOT EXISTS reference_images JSONB;');
    console.log("Database altered successfully.");
  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}

run();
