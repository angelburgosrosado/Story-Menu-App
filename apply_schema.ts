import fs from 'fs';
import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function main() {
  const sql = fs.readFileSync('schema.sql', 'utf8');
  console.log("Applying schema...");
  try {
    await pool.query(sql);
    console.log("Schema applied successfully.");
  } catch (e) {
    console.error("Error applying schema:", e);
  }
  await pool.end();
}
main();
