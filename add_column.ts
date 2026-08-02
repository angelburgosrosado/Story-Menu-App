import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
async function main() {
  await pool.query(`ALTER TABLE personas ADD COLUMN IF NOT EXISTS referenceimageid TEXT;`);
  console.log("Column added.");
  await pool.end();
}
main();
