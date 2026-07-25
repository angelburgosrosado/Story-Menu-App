/**
 * Feature Flags — Task 7.13
 * Simple feature flag system with in-memory store + Firestore sync.
 * Supports percentage rollouts, user targeting, and environment gates.
 */

import { getFirestore } from 'firebase-admin/firestore';

interface FeatureFlag {
    name: string;
    enabled: boolean;
    percentage: number;        // 0-100, percentage of users who see this
    allowedUsers?: string[];   // Specific user IDs/email prefixes
    excludedUsers?: string[];
    environments?: string[];   // ['production', 'staging', 'development']
    description?: string;
    updatedAt: string;
}

class FeatureFlagService {
    private flags = new Map<string, FeatureFlag>();
    private lastSync = 0;
    private syncInterval = 60000; // Sync every 60 seconds

    /**
     * Check if a feature is enabled for a given user/context.
     */
    async isEnabled(
        flagName: string,
        context: { userId?: string; email?: string; environment?: string } = {}
    ): Promise<boolean> {
        await this.syncIfNeeded();

        const flag = this.flags.get(flagName);
        if (!flag) return false; // Unknown flags are disabled by default

        // Environment gate
        if (flag.environments && flag.environments.length > 0) {
            const env = context.environment || process.env.NODE_ENV || 'development';
            if (!flag.environments.includes(env)) return false;
        }

        // Hard disabled
        if (!flag.enabled) return false;

        // Explicit user targeting
        const identifier = context.email || context.userId || '';
        if (flag.excludedUsers?.includes(identifier)) return false;
        if (flag.allowedUsers?.includes(identifier)) return true;

        // Percentage rollout
        if (flag.percentage >= 100) return true;
        if (flag.percentage <= 0) return false;

        // Deterministic hash for consistent rollout
        const hash = this.hashString(identifier + flagName);
        return (hash % 100) < flag.percentage;
    }

    /**
     * Get all flags (for admin dashboard).
     */
    async getAllFlags(): Promise<FeatureFlag[]> {
        await this.syncIfNeeded();
        return Array.from(this.flags.values());
    }

    /**
     * Update a flag (admin operation).
     */
    async setFlag(flag: Partial<FeatureFlag> & { name: string }): Promise<void> {
        const existing = this.flags.get(flag.name);
        const updated: FeatureFlag = {
            name: flag.name,
            enabled: flag.enabled ?? existing?.enabled ?? false,
            percentage: flag.percentage ?? existing?.percentage ?? 0,
            allowedUsers: flag.allowedUsers ?? existing?.allowedUsers ?? [],
            excludedUsers: flag.excludedUsers ?? existing?.excludedUsers ?? [],
            environments: flag.environments ?? existing?.environments ?? [],
            description: flag.description ?? existing?.description ?? '',
            updatedAt: new Date().toISOString(),
        };

        this.flags.set(flag.name, updated);

        // Persist to Firestore
        try {
            const db = getFirestore();
            await db.collection('feature_flags').doc(flag.name).set(updated);
        } catch (err: any) {
            console.error(`[FeatureFlags] Failed to persist ${flag.name}:`, err.message);
        }
    }

    /**
     * Delete a flag.
     */
    async deleteFlag(name: string): Promise<void> {
        this.flags.delete(name);
        try {
            const db = getFirestore();
            await db.collection('feature_flags').doc(name).delete();
        } catch (err: any) {
            console.error(`[FeatureFlags] Failed to delete ${name}:`, err.message);
        }
    }

    /**
     * Sync flags from Firestore.
     */
    private async syncIfNeeded(): Promise<void> {
        const now = Date.now();
        if (now - this.lastSync < this.syncInterval) return;

        try {
            const db = getFirestore();
            const snapshot = await db.collection('feature_flags').get();
            this.flags.clear();
            snapshot.docs.forEach(doc => {
                this.flags.set(doc.id, doc.data() as FeatureFlag);
            });
            this.lastSync = now;
        } catch (err: any) {
            console.warn('[FeatureFlags] Sync failed:', err.message);
        }
    }

    /**
     * Deterministic hash for consistent percentage rollouts.
     */
    private hashString(str: string): number {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash);
    }
}

export const featureFlags = new FeatureFlagService();
