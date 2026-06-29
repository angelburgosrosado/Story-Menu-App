import re

with open('server.ts', 'r') as f:
    code = f.read()

# 1. Add ai_cost_analytics table creation to the pool startup if it's there
# We'll just hook into the /api/admin/settings route where app_settings is created, OR better yet, add a function to log costs that creates the table if it doesn't exist on first run (lazy init).
# Actually, let's create a dedicated utility function block.

analytics_utils = """
// ==========================================
// AI COST ANALYTICS SYSTEM
// ==========================================

const calculateFiatCost = (provider: string, model: string, inputTokens: number, outputTokens: number = 0): number => {
    // Returns cost in USD cents
    if (provider === 'gemini') {
        if (model.includes('gemini-1.5-pro')) {
            return (inputTokens / 1000000) * 125.0 + (outputTokens / 1000000) * 500.0;
        } else if (model.includes('tts') || model.includes('audio')) {
            // Roughly 0.1 cents per generation
            return 0.1;
        } else {
            // Default to Gemini 2.5/3.5 Flash pricing
            return (inputTokens / 1000000) * 7.5 + (outputTokens / 1000000) * 30.0;
        }
    } else if (provider === 'leonardo') {
        return 1.0; // Assume ~1 cent per image generation
    } else if (provider === 'elevenlabs') {
        return (inputTokens / 1000) * 30.0; // 30 cents per 1k characters
    }
    return 0.1;
};

const logAICost = async (userEmail: string, provider: string, model: string, inputCount: number, outputCount: number = 0) => {
    if (!userEmail) return;
    try {
        const pool = getDbPool();
        if (!pool) return;
        
        await pool.query(`CREATE TABLE IF NOT EXISTS ai_cost_analytics (
            id SERIAL PRIMARY KEY,
            user_email VARCHAR(255) NOT NULL,
            provider VARCHAR(50) NOT NULL,
            model_used VARCHAR(100) NOT NULL,
            input_metric INT DEFAULT 0,
            output_metric INT DEFAULT 0,
            cost_usd_cents FLOAT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);
        
        const cost = calculateFiatCost(provider, model, inputCount, outputCount);
        
        await pool.query(
            `INSERT INTO ai_cost_analytics (user_email, provider, model_used, input_metric, output_metric, cost_usd_cents) VALUES ($1, $2, $3, $4, $5, $6)`,
            [userEmail, provider, model, inputCount, outputCount, cost]
        );
    } catch (e: any) {
        console.error("Failed to log AI cost:", e.message);
    }
};

"""

# Inject before callGeminiSafely
old_call_gemini = r"async function callGeminiSafely\(ai: any, reqPayload: any\)"
code = re.sub(old_call_gemini, analytics_utils + old_call_gemini, code)

# 2. Inject into Gemini routes. We need to parse usageMetadata if available.
# Search for `const text = response.text?.trim()` and inject cost logging.
def replace_gemini_calls(match):
    original = match.group(0)
    # Extract the route to find the model and userEmail, but it's hard with regex. 
    # Let's do it differently.
    pass

# We will just write a custom replacer for the routes.

with open('server.ts', 'w') as f:
    f.write(code)

print("Analytics utils injected")
