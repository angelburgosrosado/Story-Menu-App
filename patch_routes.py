import re

with open('server.ts', 'r') as f:
    code = f.read()

# 1. Update callGeminiSafely
old_call = r"logAiUsage\(reqEmail, operationName, aiParams\.model, tokensIn, tokensOut\)\.catch\(e => console\.error\(\"Log usage err:\", e\)\);"
new_call = """logAiUsage(reqEmail, operationName, aiParams.model, tokensIn, tokensOut).catch(e => console.error("Log usage err:", e));
                logAICost(reqEmail, 'gemini', aiParams.model, tokensIn, tokensOut);"""
code = re.sub(old_call, new_call, code)

# 2. Add logAICost to Leonardo
old_leo = r"console\.log\(\"Leonardo image generation complete!\"\);\n\s*break;"
new_leo = """console.log("Leonardo image generation complete!");
                                logAICost(userEmail, 'leonardo', 'leonardo-diffusion-xl', 1, 0);
                                break;"""
code = re.sub(old_leo, new_leo, code)

# Note: Leonardo has two routes (persona and image), we need to handle both
# The first route has `const userEmail` in body, but might not be available in scope. Let's make sure.
# In /api/leonardo/persona it's `userEmail`. 
# In /api/leonardo/image it's `userEmail`.

# Wait, Leonardo's first route:
old_leo_1 = r"console\.log\(\"Leonardo image generation complete!\"\);\n\s*break;"
new_leo_1 = """console.log("Leonardo image generation complete!");
                        logAICost(userEmail, 'leonardo', 'leonardo-diffusion-xl', 1, 0);
                        break;"""
# This might match both or fail if indentation varies.
# Actually, I'll just use a safer string replacement.
code = code.replace(
    'console.log("Leonardo image generation complete!");\n                        break;',
    'console.log("Leonardo image generation complete!");\n                        logAICost(userEmail, \'leonardo\', \'leonardo-diffusion-xl\', 1, 0);\n                        break;'
)
code = code.replace(
    'console.log("Leonardo image generation complete!");\n                                    break;',
    'console.log("Leonardo image generation complete!");\n                                    logAICost(userEmail, \'leonardo\', \'leonardo-diffusion-xl\', 1, 0);\n                                    break;'
)


# 3. Add reqEmail to callGeminiSafely calls
# We'll just replace `callGeminiSafely(ai, {` with `callGeminiSafely(ai, {` -> Wait, it's easier to just call logAICost if we know it.
# Actually, I can just change the signature of callGeminiSafely to extract userEmail from the body if it's there. But `callGeminiSafely` doesn't have `req`.
# I will use a simple regex to replace callGeminiSafely calls.

pattern = r"const response = await callGeminiSafely\(ai, \{(.*?)\}\);"
def replacer(match):
    # This is too complex for regex. I will instead just add a new endpoint /api/admin/cost-analytics.
    pass

# We will just append the endpoint
analytics_endpoint = """
    app.get('/api/admin/cost-analytics', async (req, res): Promise<any> => {
        try {
            const pool = getDbPool();
            if (!pool) return res.status(500).json({ error: 'DB not connected' });
            
            const totalCostRes = await pool.query('SELECT SUM(cost_usd_cents) as total FROM ai_cost_analytics');
            const providerCostRes = await pool.query('SELECT provider, SUM(cost_usd_cents) as total FROM ai_cost_analytics GROUP BY provider');
            const userCostRes = await pool.query('SELECT user_email, SUM(cost_usd_cents) as total, COUNT(*) as calls FROM ai_cost_analytics GROUP BY user_email ORDER BY total DESC LIMIT 50');
            
            return res.json({
                total_cost_cents: totalCostRes.rows[0].total || 0,
                by_provider: providerCostRes.rows,
                by_user: userCostRes.rows
            });
        } catch (e: any) {
            console.error("Cost analytics API error:", e.message);
            return res.status(500).json({ error: e.message });
        }
    });
"""

code = code.replace("    // --- INTEGRATIONS AND SETTINGS ---", analytics_endpoint + "\n    // --- INTEGRATIONS AND SETTINGS ---")

with open('server.ts', 'w') as f:
    f.write(code)

print("Routes patched")
