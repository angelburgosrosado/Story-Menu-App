/**
 * Analytics — Task 2.2
 * Lightweight event tracking. Drop-in ready for PostHog/Amplitude swap.
 * Tracks: signups, story creations, format selections, payment events.
 */

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

    constructor() {
        this.flushTimer = setInterval(() => this.flush(), 10000);
    }

    track(event: string, data: Record<string, any> = {}) {
        const entry: AnalyticsEvent = {
            event,
            userId: data.userId,
            email: data.email,
            properties: data,
            timestamp: new Date().toISOString(),
        };

        // Remove PII from properties
        delete entry.properties.userId;
        delete entry.properties.email;

        this.queue.push(entry);

        // Log for now — swap with PostHog/Amplitude when ready:
        // import PostHog from 'posthog-node'; const client = new PostHog('phc_xxx');
        // client.capture({ event, distinctId: data.userId || data.email, properties: data });
        console.log(JSON.stringify({ level: 'info', type: 'analytics', ...entry }));
    }

    private flush() {
        if (this.queue.length === 0) return;
        const batch = this.queue.splice(0);
        // In production, send batch to analytics provider
        // For now, structured logs are sufficient for Cloud Logging → BigQuery export
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
