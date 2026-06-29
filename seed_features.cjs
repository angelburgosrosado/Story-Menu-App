const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const features = [
  { key: 'feature_visual_engine_hd', desc: 'Premium HD Image Generation (4K)' },
  { key: 'feature_visual_engine_premium_styles', desc: 'Premium Art Styles (Anime, Watercolor, Realistic)' },
  { key: 'feature_audio_premium_voices', desc: 'High-Fidelity Voice Acting & Cast (ElevenLabs)' },
  { key: 'feature_custom_persona_gen', desc: 'Custom Persona Generation (Create-a-Character)' },
  { key: 'feature_epic_campaigns', desc: 'Epic Campaigns (Unlimited Pages)' },
  { key: 'feature_narrative_rewind', desc: 'Narrative Rewind (Undo death/bad choices)' },
  { key: 'feature_custom_universes', desc: 'Custom Universes (Custom Theme Prompting)' },
  { key: 'feature_premium_exports', desc: 'Premium Exports (Watermark-free PDF & Rights)' }
];

const plans = [
  {
    name: "Free Plan",
    desc: "Experience the interactive story with standard capabilities.",
    priceSub: 0,
    priceOne: 0,
    features: []
  },
  {
    name: "Entry Plan",
    desc: "Unlock extended campaigns, custom personas, and narrative rewinds.",
    priceSub: 9.99,
    priceOne: 19.99,
    features: ['feature_custom_persona_gen', 'feature_epic_campaigns', 'feature_narrative_rewind']
  },
  {
    name: "High User Plan",
    desc: "The ultimate experience with HD art, premium voice acting, custom universes, and full export rights.",
    priceSub: 29.99,
    priceOne: 49.99,
    features: features.map(f => f.key)
  }
];

async function run() {
  try {
    // 1. Add feature flags to app_settings
    console.log("Seeding app_settings features...");
    for (const f of features) {
      await pool.query(
        'INSERT INTO app_settings (key_name, key_value, is_secret, description) VALUES ($1, $2, $3, $4) ON CONFLICT (key_name) DO NOTHING',
        [f.key, 'true', false, f.desc]
      );
    }

    // 2. Clear old plans and add new plans
    console.log("Seeding subscription_plans...");
    await pool.query('DELETE FROM subscription_plans');
    for (const p of plans) {
      await pool.query(
        'INSERT INTO subscription_plans (name, description, price_subscription, price_one_time, features) VALUES ($1, $2, $3, $4, $5)',
        [p.name, p.desc, p.priceSub, p.priceOne, JSON.stringify(p.features)]
      );
    }
    console.log("Done!");
  } catch (e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
run();
