/**
 * Subscription Management — Task 7.7
 * Handles subscription lifecycle: upgrade, downgrade, cancel, reactivate.
 * Integrates with Stripe for payment processing.
 */

import { getFirestore } from 'firebase-admin/firestore';
import Stripe from 'stripe';

interface SubscriptionPlan {
    id: string;
    name: string;
    priceMonthly: number;      // cents
    priceYearly: number;       // cents
    tokensIncluded: number;
    features: string[];
}

interface UserSubscription {
    userId: string;
    email: string;
    planId: string;
    status: 'active' | 'canceled' | 'past_due' | 'trialing';
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    currentPeriodStart: string;
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
    createdAt: string;
}

const PLANS: SubscriptionPlan[] = [
    {
        id: 'free',
        name: 'Free',
        priceMonthly: 0,
        priceYearly: 0,
        tokensIncluded: 50,
        features: ['5 stories/month', 'Basic genres', 'Standard quality'],
    },
    {
        id: 'pro',
        name: 'Pro',
        priceMonthly: 999,
        priceYearly: 9999,
        tokensIncluded: 500,
        features: ['Unlimited stories', 'All genres', 'HD quality', 'PDF export', 'No watermarks'],
    },
    {
        id: 'studio',
        name: 'Studio',
        priceMonthly: 2499,
        priceYearly: 24999,
        tokensIncluded: 2000,
        features: ['Everything in Pro', 'API access', 'Priority support', 'Custom branding', 'Team collaboration'],
    },
];

class SubscriptionService {
    /**
     * Get all available plans.
     */
    getPlans(): SubscriptionPlan[] {
        return PLANS;
    }

    /**
     * Get a user's current subscription.
     */
    async getUserSubscription(email: string): Promise<UserSubscription | null> {
        try {
            const db = getFirestore();
            const snapshot = await db.collection('subscriptions').where('email', '==', email).limit(1).get();
            if (snapshot.empty) return null;
            return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as any;
        } catch (err: any) {
            console.error('[Subscription] Get failed:', err.message);
            return null;
        }
    }

    /**
     * Create a new subscription (after successful payment).
     */
    async createSubscription(
        email: string,
        planId: string,
        stripeCustomerId: string,
        stripeSubscriptionId: string
    ): Promise<UserSubscription> {
        const plan = PLANS.find(p => p.id === planId);
        if (!plan) throw new Error(`Invalid plan: ${planId}`);

        const now = new Date();
        const periodEnd = new Date(now);
        periodEnd.setMonth(periodEnd.getMonth() + 1);

        const subscription: UserSubscription = {
            userId: email,
            email,
            planId,
            status: 'active',
            stripeCustomerId,
            stripeSubscriptionId,
            currentPeriodStart: now.toISOString(),
            currentPeriodEnd: periodEnd.toISOString(),
            cancelAtPeriodEnd: false,
            createdAt: now.toISOString(),
        };

        try {
            const db = getFirestore();
            await db.collection('subscriptions').doc(email).set(subscription);
        } catch (err: any) {
            console.error('[Subscription] Create failed:', err.message);
        }

        return subscription;
    }

    /**
     * Upgrade or downgrade a subscription.
     */
    async changePlan(email: string, newPlanId: string): Promise<{ success: boolean; error?: string }> {
        const subscription = await this.getUserSubscription(email);
        if (!subscription) return { success: false, error: 'No active subscription' };

        const newPlan = PLANS.find(p => p.id === newPlanId);
        if (!newPlan) return { success: false, error: 'Invalid plan' };

        // Update in Stripe
        if (subscription.stripeSubscriptionId) {
            try {
                const stripeKey = process.env.STRIPE_SECRET_KEY;
                if (stripeKey) {
                    const stripe = new Stripe(stripeKey, { apiVersion: '2025-02-24.acacia' as any });
                    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
                        items: [{ price: newPlanId === 'free' ? undefined : `${newPlanId}_monthly` }],
                        proration_behavior: 'create_prorations',
                    });
                }
            } catch (err: any) {
                return { success: false, error: `Stripe error: ${err.message}` };
            }
        }

        // Update locally
        try {
            const db = getFirestore();
            await db.collection('subscriptions').doc(email).update({
                planId: newPlanId,
                status: 'active',
            });
        } catch (err: any) {
            console.error('[Subscription] Local update failed:', err.message);
        }

        return { success: true };
    }

    /**
     * Cancel a subscription (at period end).
     */
    async cancelSubscription(email: string): Promise<{ success: boolean; error?: string }> {
        const subscription = await this.getUserSubscription(email);
        if (!subscription) return { success: false, error: 'No active subscription' };

        // Cancel in Stripe
        if (subscription.stripeSubscriptionId) {
            try {
                const stripeKey = process.env.STRIPE_SECRET_KEY;
                if (stripeKey) {
                    const stripe = new Stripe(stripeKey, { apiVersion: '2025-02-24.acacia' as any });
                    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
                        cancel_at_period_end: true,
                    });
                }
            } catch (err: any) {
                return { success: false, error: `Stripe error: ${err.message}` };
            }
        }

        // Update locally
        try {
            const db = getFirestore();
            await db.collection('subscriptions').doc(email).update({
                cancelAtPeriodEnd: true,
            });
        } catch (err: any) {
            console.error('[Subscription] Cancel failed:', err.message);
        }

        return { success: true };
    }

    /**
     * Reactivate a canceled subscription.
     */
    async reactivateSubscription(email: string): Promise<{ success: boolean; error?: string }> {
        const subscription = await this.getUserSubscription(email);
        if (!subscription) return { success: false, error: 'No subscription found' };

        // Reactivate in Stripe
        if (subscription.stripeSubscriptionId) {
            try {
                const stripeKey = process.env.STRIPE_SECRET_KEY;
                if (stripeKey) {
                    const stripe = new Stripe(stripeKey, { apiVersion: '2025-02-24.acacia' as any });
                    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
                        cancel_at_period_end: false,
                    });
                }
            } catch (err: any) {
                return { success: false, error: `Stripe error: ${err.message}` };
            }
        }

        // Update locally
        try {
            const db = getFirestore();
            await db.collection('subscriptions').doc(email).update({
                cancelAtPeriodEnd: false,
                status: 'active',
            });
        } catch (err: any) {
            console.error('[Subscription] Reactivate failed:', err.message);
        }

        return { success: true };
    }
}

export const subscriptionService = new SubscriptionService();
