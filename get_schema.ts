import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
async function main() {
  const res = await pool.query(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = 'personas';
  `);
  console.log(res.rows.map(r => r.column_name).join(', '));
  await pool.end();
}
main();
