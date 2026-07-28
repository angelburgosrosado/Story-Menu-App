/**
 * Analytics — Task 2.2
 * Lightweight event tracking. Drop-in ready for PostHog/Amplitude swap.
 * Tracks: signups, story creations, format selections, payment events.
 */

import https from 'https';

interface AnalyticsEvent {
    event: string;
    userId?: string;
    email?: string;
    properties?: Record<string, any>;
    timestamp: string;
}

class Analytics {
    private queue: AnalyticsEvent[] = [];
    private flushTimer: ReturnType<typeof setInterval> | null = null;
    private posthogApiKey = process.env.POSTHOG_API_KEY || '';

    constructor() {
        this.flushTimer = setInterval(() => this.flush(), 10000);
    }

    track(event: string, data: Record<string, any> = {}) {
        const entry: AnalyticsEvent = {
            event,
            userId: data.userId,
            email: data.email,
            properties: { ...data },
            timestamp: new Date().toISOString(),
        };

        // Remove PII from properties
        if (entry.properties) {
            delete entry.properties.userId;
            delete entry.properties.email;
        }

        this.queue.push(entry);

        // Native PostHog Capture Integration (direct HTTPS API)
        if (this.posthogApiKey) {
            this.sendToPostHog(entry);
        }

        console.log(JSON.stringify({ level: 'info', type: 'analytics', ...entry }));
    }

    private sendToPostHog(entry: AnalyticsEvent) {
        const payload = JSON.stringify({
            api_key: this.posthogApiKey,
            event: entry.event,
            properties: {
                distinct_id: entry.userId || entry.email || 'anonymous_server',
                ...entry.properties,
                $timestamp: entry.timestamp,
                $lib: 'story-menu-app-native-node'
            }
        });

        const req = https.request({
            hostname: 'app.posthog.com',
            path: '/capture/',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload)
            }
        }, (res) => {
            res.on('data', () => {}); // consume stream
        });

        req.on('error', (err) => {
            console.error('[Analytics] PostHog dispatch failed:', err.message);
        });

        req.write(payload);
        req.end();
    }

    private flush() {
        if (this.queue.length === 0) return;
        const batch = this.queue.splice(0);
        // Direct batch ingestion can be added here if desired, otherwise sendToPostHog captures immediate events
    }

    // ─── Pre-defined events ────────────────────────────────────────────

    userSignup(userId: string, method: string) {
        this.track('user_signup', { userId, method });
    }

    userLogin(userId: string, method: string) {
        this.track('user_login', { userId, method });
    }

    storyCreated(userId: string, format: string, genre: string) {
        this.track('story_created', { userId, format, genre });
    }

    storyViewed(storyId: string, viewerId?: string) {
        this.track('story_viewed', { storyId, viewerId });
    }

    paymentInitiated(userId: string, tier: string, amount: number) {
        this.track('payment_initiated', { userId, tier, amount });
    }

    paymentCompleted(userId: string, tier: string, amount: number) {
        this.track('payment_completed', { userId, tier, amount });
    }

    subscriptionActivated(userId: string, tier: string) {
        this.track('subscription_activated', { userId, tier });
    }

    subscriptionDeactivated(userId: string, reason: string) {
        this.track('subscription_deactivated', { userId, reason });
    }

    aiGeneration(userId: string, model: string, tokensUsed: number) {
        this.track('ai_generation', { userId, model, tokensUsed });
    }

    exportRequested(userId: string, format: string) {
        this.track('export_requested', { userId, format });
    }
}

export const analytics = new Analytics();
