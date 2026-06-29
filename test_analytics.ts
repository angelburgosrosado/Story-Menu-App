import { getDbPool } from './db.js';
async function test() {
    const pool = getDbPool();
    await pool.query("INSERT INTO ai_usage_logs (user_email, operation, model, tokens_in, tokens_out, cost_usd) VALUES ($1, $2, $3, $4, $5, $6)", ["admin@test.com", "test", "gemini", 100, 200, 0.05]);
    const costs = await pool.query("SELECT SUM(tokens_in) as total_in, SUM(tokens_out) as total_out, SUM(cost_usd) as total_cost FROM ai_usage_logs");
    console.log("Costs:", costs.rows);
    const history = await pool.query("SELECT user_email, operation, model, tokens_in, tokens_out, cost_usd, created_at FROM ai_usage_logs ORDER BY created_at DESC LIMIT 100");
    console.log("History length:", history.rows.length);
}
test();
