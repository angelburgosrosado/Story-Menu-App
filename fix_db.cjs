const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function run() {
  try {
    const { rows: cols } = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='admin_users'
    `);
    console.log("Existing columns:", cols.map(c => c.column_name));
    
    // Add columns manually
    for (const col of ['password_hash', 'salt']) {
      if (!cols.find(c => c.column_name === col)) {
        console.log(`Adding ${col}...`);
        await pool.query(`ALTER TABLE admin_users ADD COLUMN ${col} TEXT`);
        console.log(`Added ${col}`);
      }
    }
  } catch (e) {
    console.error("Error:", e);
  } finally {
    pool.end();
  }
}
run();
