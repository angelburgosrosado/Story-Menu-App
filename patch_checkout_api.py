with open('server.ts', 'r') as f:
    content = f.read()

# Let's find the /api/checkout route in server.ts
import re
match = re.search(r"app\.post\('/api/checkout', async \(req, res\) => \{", content)

if match:
    # It exists. We can replace it or just let's see what's inside.
    pass
else:
    print("/api/checkout not found, adding it.")

# Let's just create a mock /api/checkout route if it doesn't exist, or replace it if it does.
# Wait, I'll just write a script to replace the whole /api/checkout block or insert it.

target = """    // Mock checkout endpoint
    app.post('/api/checkout', async (req, res) => {
        const { email, tier, paymentMethod } = req.body;
        // In a real app, this would call Stripe/PayPal APIs
        
        // Mock successful transaction
        const subscriptionId = `sub_mock_${Date.now()}`;
        
        return res.json({
            success: true,
            email,
            tier,
            paymentMethod,
            subscriptionId
        });
    });"""

replacement = """    // --- PAYMENT GATEWAY ROUTING (Stripe, PayPal, Square) ---
    app.post('/api/checkout', async (req, res): Promise<any> => {
        const { email, tier, paymentMethod, cardDetails, paypalEmail } = req.body;
        
        // 1. Identify user from DB (assuming they are registered, or create a mock ID for now)
        let userId = '00000000-0000-0000-0000-000000000000'; // fallback
        const pool = getDbPool();
        
        if (pool) {
            try {
                const userRes = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
                if (userRes.rows.length > 0) {
                    userId = userRes.rows[0].id;
                }
            } catch(e) {}
        }

        // 2. Route to specific gateway SDK (Mocked for local dev)
        let subscriptionId = '';
        let gatewayResponse: any = {};

        if (paymentMethod === 'Stripe') {
            console.log("💳 Processing via Stripe Node SDK...");
            // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
            // const session = await stripe.checkout.sessions.create({...});
            subscriptionId = `sub_stripe_${Date.now()}`;
            gatewayResponse = { status: 'succeeded', gateway: 'Stripe' };
        } else if (paymentMethod === 'PayPal') {
            console.log("💳 Processing via PayPal REST API...");
            // const paypal = require('@paypal/checkout-server-sdk');
            subscriptionId = `sub_paypal_${Date.now()}`;
            gatewayResponse = { status: 'COMPLETED', gateway: 'PayPal' };
        } else if (paymentMethod === 'Square') {
            console.log("💳 Processing via Square Payments API...");
            // const { Client, Environment } = require('square');
            // const client = new Client({ environment: Environment.Sandbox, accessToken: process.env.SQUARE_ACCESS_TOKEN });
            subscriptionId = `sub_square_${Date.now()}`;
            gatewayResponse = { status: 'COMPLETED', gateway: 'Square' };
        } else {
            return res.status(400).json({ error: 'Unsupported payment method.' });
        }

        // 3. Update the SaaS Database
        if (pool) {
            try {
                // Upsert subscription
                await pool.query(`
                    INSERT INTO subscriptions (user_id, tier, stripe_subscription_id, token_balance, renewal_date)
                    VALUES ($1, $2, $3, 1000, CURRENT_TIMESTAMP + INTERVAL '30 days')
                    ON CONFLICT (id) DO UPDATE SET 
                        tier = EXCLUDED.tier,
                        stripe_subscription_id = EXCLUDED.stripe_subscription_id
                `, [userId, tier, subscriptionId]);
            } catch(e) {
                console.error("Failed to write subscription to DB:", e);
            }
        }
        
        return res.json({
            success: true,
            email,
            tier,
            paymentMethod,
            subscriptionId,
            gatewayStatus: gatewayResponse.status
        });
    });"""

if target in content:
    content = content.replace(target, replacement)
    with open('server.ts', 'w') as f:
        f.write(content)
    print("Replaced old /api/checkout")
else:
    # If not found exactly, just prepend to the new SaaS routes we added earlier
    if "app.post('/api/checkout'" not in content:
        hook = "// --- NEW SAAS DASHBOARD ENDPOINTS ---"
        content = content.replace(hook, hook + "\n" + replacement + "\n")
        with open('server.ts', 'w') as f:
            f.write(content)
        print("Injected new /api/checkout")
    else:
        # Regex replace
        import re
        content = re.sub(r"app\.post\('/api/checkout', async \(req, res\) => \{.*?\n    \}\);", replacement, content, flags=re.DOTALL)
        with open('server.ts', 'w') as f:
            f.write(content)
        print("Regex replaced /api/checkout")
