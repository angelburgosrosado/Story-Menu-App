const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function run() {
  try {
    console.log("Dropping and recreating subscription_plans table...");
    await pool.query('DROP TABLE IF EXISTS subscription_plans');
    await pool.query(`CREATE TABLE subscription_plans (id SERIAL PRIMARY KEY, name VARCHAR(255), description TEXT, price_subscription DECIMAL(10,2), price_one_time DECIMAL(10,2), features JSONB, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
    console.log("Table created.");
  } catch (e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
run();
