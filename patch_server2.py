with open('server.ts', 'r') as f:
    content = f.read()

target = """                        stripe_subscription_id = EXCLUDED.stripe_subscription_id
                `, [userId, tier, subscriptionId]);
            } catch(e) {"""

replacement = """                        stripe_subscription_id = EXCLUDED.stripe_subscription_id
                `, [userId, tier, subscriptionId]);
                
                // Keep the users table legacy mapping in sync for AdminDashboard
                await pool.query(`UPDATE users SET tier = $1, subscription_id = $2, payment_method = $3 WHERE id = $4`, [tier, subscriptionId, paymentMethod, userId]);
            } catch(e) {"""

if target in content:
    content = content.replace(target, replacement)
    with open('server.ts', 'w') as f:
        f.write(content)
    print("Patched users table sync in server.ts")
else:
    print("Could not find target block")

