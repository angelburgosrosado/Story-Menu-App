const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/storymenu',
});

async function seed() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS subscription_plans (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        price NUMERIC NOT NULL,
        billing_cycle VARCHAR(50) NOT NULL,
        features JSONB NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`TRUNCATE TABLE subscription_plans`);

    await pool.query(`
      INSERT INTO subscription_plans (name, price, billing_cycle, features, is_active)
      VALUES 
      ($1, $2, $3, $4, $5),
      ($6, $7, $8, $9, $10),
      ($11, $12, $13, $14, $15)
    `, [
      // Free
      'Free', 0, 'monthly', 
      JSON.stringify([
        '50 Credits / month (~5 comics)',
        'Basic Art Styles',
        'Max 4 Panels per Comic',
        'Standard Generation Speed',
        'Watermarked Exports'
      ]), true,
      
      // Creator
      'Creator', 12, 'monthly',
      JSON.stringify([
        '1,200 Credits / month (~120 comics)',
        'No Watermarks',
        '10 Custom Characters (Consistency AI)',
        'Advanced Layout Prototyping',
        'High-Res Exports (PDF, PNG)',
        'Commercial Usage Rights'
      ]), true,
      
      // Pro / Publisher
      'Pro', 29, 'monthly',
      JSON.stringify([
        '4,000 Credits / month (~400 comics)',
        'Unlimited Custom Characters',
        'Priority GPU Processing (Instant)',
        'Premium LLMs (GPT-4o / Claude 3.5)',
        'Team Collaboration (1 extra seat)',
        'Vector & Editable Exports'
      ]), true
    ]);

    console.log('Seeded subscription_plans successfully.');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await pool.end();
  }
}

seed();
