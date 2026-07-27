/**
 * Shared helpers for admin route modules.
 * Copies of functions originally in server.ts to avoid circular imports.
 */
import crypto from 'crypto';
import { GoogleGenAI } from '@google/genai';
import { getDbPool } from './db';
import { getFirestore } from 'firebase-admin/firestore';
import { calculateTokenCost } from './pricingIntelligence';

let memoryDb: any = {};
export function setMemoryDb(db: any) { memoryDb = db; }

let aiClient: GoogleGenAI | null = null;

export function getAIClient(customKey?: string): GoogleGenAI {
    const key = customKey || process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!key) {
        throw new Error('GEMINI_API_KEY environment variable is required. Please set it in Settings > Secrets.');
    }

    if (customKey) {
        return new GoogleGenAI({
            apiKey: key,
            httpOptions: {
                headers: {
                    'User-Agent': 'aistudio-build',
                }
            }
        });
    }

    if (!aiClient) {
        aiClient = new GoogleGenAI({
            apiKey: key,
            httpOptions: {
                headers: {
                    'User-Agent': 'aistudio-build',
                }
            }
        });
    }
    return aiClient;
}

export function resolveAIRoute(
    workflowSlug: string,
    userTier: string = 'Free',
    env: string = 'production'
): any {
    const tiers = [userTier, 'Free'];
    const rules: any[] = memoryDb.ai_routing_rules || [];

    for (const tier of tiers) {
        const match = rules
            .filter((r: any) =>
                r.workflowSlug === workflowSlug &&
                r.planTier === tier &&
                (r.environment === env || r.environment === 'production') &&
                r.status === 'Active'
            )
            .sort((a: any, b: any) => (a.priority ?? 99) - (b.priority ?? 99))[0];

        if (match) {
            const model = (memoryDb.ai_models || []).find((m: any) => m.id === match.modelId);
            const provider = (memoryDb.ai_providers || []).find((p: any) => p.id === match.providerId);
            return {
                providerId: match.providerId,
                modelId: match.modelId,
                modelSlug: model?.slug || match.modelId,
                providerSlug: provider?.slug || match.providerId,
                resolvedBy: 'rule'
            };
        }
    }

    const workflow = (memoryDb.ai_workflows || []).find((w: any) => w.slug === workflowSlug);
    if (workflow?.defaultModelId) {
        const model = (memoryDb.ai_models || []).find((m: any) => m.id === workflow.defaultModelId);
        const provider = (memoryDb.ai_providers || []).find((p: any) => p.id === workflow.defaultProviderId);
        return {
            providerId: workflow.defaultProviderId || 'prov-google',
            modelId: workflow.defaultModelId,
            modelSlug: model?.slug || 'gemini-2.5-flash',
            providerSlug: provider?.slug || 'google-ai',
            resolvedBy: 'workflow_default'
        };
    }

    const isImageWorkflow = workflowSlug.includes('image') || workflowSlug.includes('cover') || workflowSlug.includes('character');
    const isAudioWorkflow = workflowSlug.includes('narration');
    return {
        providerId: 'prov-google',
        modelId: isAudioWorkflow ? 'model-gemini-tts' : isImageWorkflow ? 'model-gemini-image' : 'model-gemini-flash',
        modelSlug: isAudioWorkflow ? 'gemini-3.1-flash-tts-preview' : isImageWorkflow ? 'gemini-2.5-flash-image' : 'gemini-2.5-flash',
        providerSlug: 'google-ai',
        resolvedBy: 'hardcoded_fallback'
    };
}

export async function getSettingValue(key: string): Promise<string> {
    try {
        const db = getFirestore();
        const docSnap = await db.collection('app_settings').doc(key.toLowerCase()).get();
        if (docSnap.exists) {
            return docSnap.data()?.key_value || '';
        }
    } catch (err: any) {
        console.warn(`Failed to fetch setting ${key} from Firestore:`, err.message);
    }

    const memorySetting = memoryDb.app_settings?.find((s: any) => s.key_name === key.toLowerCase());
    if (memorySetting) return memorySetting.key_value;

    return process.env[key.toUpperCase()] || '';
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function isValidUuid(val: string): boolean {
    return UUID_REGEX.test(val);
}

export function hashPassword(password: string, salt: string) {
    return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
}
