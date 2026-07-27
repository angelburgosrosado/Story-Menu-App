/**
 * Subscription Routes — Task 7.7 extension
 * Self-service billing portal and subscription management endpoints.
 */

import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { getDbPool } from '../db';

const router = Router();

async function getSettingValue(key: string): Promise<string | undefined> {
    const pool = getDbPool();
    try {
        const result = await pool.query('SELECT key_value FROM app_settings WHERE key_name = $1', [key]);
        return result.rows[0]?.key_value;
    } catch (err) {
        return process.env[key.toUpperCase()];
    }
}

/**
 * POST /api/subscription/portal
 * Creates a Stripe Customer Portal session for the authenticated user.
 * Body: { email: string, returnUrl?: string }
 */
router.post('/portal', async (req: Request, res: Response): Promise<any> => {
    const { email, returnUrl } = req.body;

    if (!email || typeof email !== 'string') {
        return res.status(400).json({ error: 'Email is required' });
    }

    const stripeKey = await getSettingValue('stripe_secret_key');
    if (!stripeKey) {
        return res.status(500).json({ error: 'Stripe is not configured' });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: '2025-02-24.acacia' as any });

    try {
        // Resolve Stripe customer ID from local records
        const pool = getDbPool();
        let customerId: string | undefined;

        try {
            const result = await pool.query(
                'SELECT stripe_customer_id FROM users WHERE email = $1 LIMIT 1',
                [email]
            );
            customerId = result.rows[0]?.stripe_customer_id;
        } catch (dbErr: any) {
            console.warn('[Subscription Portal] DB lookup failed:', dbErr.message);
        }

        // Fallback: search Stripe customers by email
        if (!customerId) {
            const customers = await stripe.customers.list({ email, limit: 1 });
            if (customers.data.length > 0) {
                customerId = customers.data[0].id;
            }
        }

        if (!customerId) {
            return res.status(404).json({ error: 'No Stripe customer found for this email' });
        }

        const session = await stripe.billingPortal.sessions.create({
            customer: customerId,
            return_url: returnUrl || `${req.headers.origin || 'https://storymenu.app'}/account`,
        });

        return res.json({ url: session.url });
    } catch (err: any) {
        console.error('[Subscription Portal] Error creating portal session:', err.message);
        return res.status(500).json({ error: `Failed to create billing portal session: ${err.message}` });
    }
});

export default router;
