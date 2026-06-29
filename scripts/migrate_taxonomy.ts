import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function runMigration() {
    try {
        console.log("Adding new taxonomy columns to content_categories...");
        
        await pool.query(`
            ALTER TABLE content_categories 
            ADD COLUMN IF NOT EXISTS emoji VARCHAR(10),
            ADD COLUMN IF NOT EXISTS prompt_instruction TEXT,
            ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false
        `);

        // Also add some default instructions/emojis for the fallback rows that were previously inserted
        await pool.query(`UPDATE content_categories SET emoji = '🚀', prompt_instruction = 'cyberpunk, grimdark, neon glow, intricate mechanical details, moody atmosphere, futuristic dystopian' WHERE name = 'Sci-Fi Cyberpunk' AND emoji IS NULL`);
        await pool.query(`UPDATE content_categories SET emoji = '🖍️', prompt_instruction = 'anime style, cel-shaded, large expressive eyes, dynamic action lines, colorful hair, japanese animation aesthetic, vibrant' WHERE name = 'Cell-Shaded Anime' AND emoji IS NULL`);

        console.log("Migration successful!");
    } catch (e) {
        console.error("Migration failed:", e);
    } finally {
        await pool.end();
    }
}

runMigration();
