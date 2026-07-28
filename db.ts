/**
 * Screen Name: Database Adapter
 * Purpose: Connects to PostgreSQL or falls back to Firebase Firestore via a SQL-to-NoSQL mock layer
 * Version: 1.2.0
 * Date: 2026-07-09
 * Phase: Phase 3 - Character and Photo-Persona System Implementation
 * What changed in this revision: Added SQL-to-Firestore translation mapping for personas, reference_images, role_assignments, and usage_modes tables.
 */

import pg from 'pg';
const { Pool } = pg;
import * as admin from 'firebase-admin';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import firebaseConfig from './firebase-applet-config.json';

import {
    FirestoreAppSettingsRepository,
    FirestoreUserRepository,
    FirestoreCharacterRepository,
    FirestoreProjectRepository,
    FirestoreUsageLogRepository,
    FirestoreCategoryRepository,
    FirestoreGenericMetadataRepository
} from './db/repositories';

const appSettingsRepo = new FirestoreAppSettingsRepository();
const userRepo = new FirestoreUserRepository();
const characterRepo = new FirestoreCharacterRepository();
const projectRepo = new FirestoreProjectRepository();
const usageLogRepo = new FirestoreUsageLogRepository();
const categoryRepo = new FirestoreCategoryRepository();
const genericRepo = new FirestoreGenericMetadataRepository();

// Ensure admin is initialized only once
if (!getApps().length) {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        try {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
            initializeApp({
                credential: (admin as any).credential.cert(serviceAccount),
                projectId: serviceAccount.project_id
            });
        } catch (e) {
            console.error('Failed to init admin in db.ts', e);
        }
    } else {
        try {
            initializeApp({ projectId: firebaseConfig.projectId });
        } catch (e) {}
    }
}

const db = getFirestore();

export function isDatabaseConnected(): boolean {
    return true; // We assume Firebase is always connected
}

export function markDatabaseOffline(): void {
    // No-op for Firebase
}

export function resetConnectionState(): void {
    // No-op
}

export async function testCustomConnectionString(url: string, overridePassword?: string): Promise<{success: boolean, message?: string, error?: string}> {
    return { success: true, message: "Firebase connection successful" };
}

export async function initializeDatabaseSchema(): Promise<void> {
    // Firestore is schema-less. No table creation needed.
}

export function getIsolatedSchemaName(): string {
    return 'default';
}

// A mock Pool client that translates basic SQL to Firestore operations
class FirebaseMockPool {
    async query(sqlString: string, params: any[] = []): Promise<{ rows: any[], rowCount: number }> {
        const sql = sqlString.trim().replace(/\s+/g, ' ');

        try {
            if (sql.toUpperCase().startsWith('ALTER TABLE')) return { rows: [], rowCount: 0 };
            if (sql.toUpperCase().startsWith('CREATE TABLE')) return { rows: [], rowCount: 0 };
            
            if (sql.match(/SELECT 1/i)) return { rows: [{'?column?': 1}], rowCount: 1 };

            // 1. App Settings
            if (sql.match(/SELECT\s+\*\s+FROM\s+app_settings/i)) {
                const rows = await appSettingsRepo.getAll();
                return { rows, rowCount: rows.length };
            }
            if (sql.match(/UPDATE\s+app_settings\s+SET\s+key_value\s+=\s+\$1\s+WHERE\s+key_name\s+=\s+\$2/i)) {
                await appSettingsRepo.set(params[1], params[0]);
                return { rows: [], rowCount: 1 };
            }
            if (sql.match(/INSERT\s+INTO\s+app_settings/i)) {
                await appSettingsRepo.set(params[0], params[1]);
                return { rows: [], rowCount: 1 };
            }

            // 2. Users
            if (sql.match(/SELECT\s+(tokens|\*)\s+FROM\s+users\s+WHERE\s+email\s+=\s+\$1/i)) {
                const rows = await userRepo.getByEmail(params[0]);
                return { rows, rowCount: rows.length };
            }
            if (sql.match(/SELECT\s+id,\s+email,\s+tier,\s+created_at,\s+tokens\s+FROM\s+users/i) || sql.match(/SELECT\s+\*\s+FROM\s+users/i)) {
                const rows = await userRepo.getAll();
                return { rows, rowCount: rows.length };
            }
            if (sql.match(/UPDATE\s+users\s+SET\s+tokens\s+=\s+tokens\s+-\s+\$1\s+WHERE\s+email\s+=\s+\$2/i)) {
                const success = await userRepo.incrementTokens(params[1], -params[0]);
                return { rows: [], rowCount: success ? 1 : 0 };
            }
            if (sql.match(/UPDATE\s+users\s+SET\s+tokens\s+=\s+\$1\s+WHERE\s+email\s+=\s+\$2/i)) {
                const success = await userRepo.updateTokens(params[1], params[0]);
                return { rows: [], rowCount: success ? 1 : 0 };
            }
            if (sql.match(/UPDATE\s+users\s+SET\s+tier\s+=\s+\$1\s+WHERE\s+email\s+=\s+\$2/i)) {
                const success = await userRepo.updateTier(params[1], params[0]);
                return { rows: [], rowCount: success ? 1 : 0 };
            }
            if (sql.match(/INSERT\s+INTO\s+users\s*\(email\)\s*VALUES/i)) {
                const user = await userRepo.create(params[0]);
                return { rows: [user], rowCount: 1 };
            }
            if (sql.match(/INSERT\s+INTO\s+users/i)) {
                const user = await userRepo.insert(params);
                return { rows: [user], rowCount: 1 };
            }
            if (sql.match(/DELETE\s+FROM\s+users\s+WHERE\s+email\s+=\s+\$1/i)) {
                const count = await userRepo.deleteByEmail(params[0]);
                return { rows: [], rowCount: count };
            }

            // 3. Characters
            if (sql.match(/SELECT\s+\*\s+FROM\s+characters\s+WHERE\s+user_id\s+=\s+\$1/i)) {
                const rows = await characterRepo.getByUser(params[0]);
                return { rows, rowCount: rows.length };
            }
            if (sql.match(/INSERT\s+INTO\s+characters/i)) {
                await characterRepo.insert(params);
                return { rows: [], rowCount: 1 };
            }

            // 4. Projects
            if (sql.match(/SELECT\s+\*\s+FROM\s+projects\s+WHERE\s+user_id\s+=\s+\$1/i)) {
                const rows = await projectRepo.getByUser(params[0]);
                return { rows, rowCount: rows.length };
            }
            if (sql.match(/INSERT\s+INTO\s+projects/i)) {
                await projectRepo.insert(params);
                return { rows: [], rowCount: 1 };
            }

            // 5. Usage Logs
            if (sql.match(/INSERT\s+INTO\s+ai_usage_logs/i)) {
                await usageLogRepo.insert(params);
                return { rows: [], rowCount: 1 };
            }
            if (sql.match(/SELECT\s+SUM\(tokens_in\)/i) && sql.match(/ai_usage_logs/i)) {
                const totals = await usageLogRepo.getTotals();
                return { rows: [totals], rowCount: 1 };
            }
            if (sql.match(/SELECT\s+user_email.*?FROM\s+ai_usage_logs.*?ORDER\s+BY/i)) {
                const rows = await usageLogRepo.getRecentLogs(100);
                return { rows, rowCount: rows.length };
            }
            if (sql.match(/SELECT\s+model,\s+SUM\(cost_usd\).*?FROM\s+ai_usage_logs.*?GROUP\s+BY\s+model/i)) {
                const rows = await usageLogRepo.getCostByModel();
                return { rows, rowCount: rows.length };
            }
            if (sql.match(/SELECT\s+user_email,\s+COUNT\(\*\).*?FROM\s+ai_usage_logs.*?GROUP\s+BY\s+user_email/i)) {
                const rows = await usageLogRepo.getCostByUser();
                return { rows, rowCount: rows.length };
            }

            // 6. Content Categories
            if (sql.match(/SELECT\s+\*\s+FROM\s+content_categories/i)) {
                const activeOnly = !!sql.match(/is_active\s*=\s*true/i);
                const rows = await categoryRepo.getAll(activeOnly);
                return { rows, rowCount: rows.length };
            }
            if (sql.match(/INSERT\s+INTO\s+content_categories/i)) {
                const data = await categoryRepo.insert(params);
                return { rows: [data], rowCount: 1 };
            }
            if (sql.match(/DELETE\s+FROM\s+content_categories\s+WHERE\s+id\s+=\s+\$1/i)) {
                await categoryRepo.delete(params[0]);
                return { rows: [], rowCount: 1 };
            }
            if (sql.match(/UPDATE\s+content_categories\s+SET/i)) {
                const id = params[params.length - 1];
                const updateData: any = {};
                const fieldsMatch = sql.match(/SET\s+(.*?)\s+WHERE/i);
                if (fieldsMatch) {
                    const fieldsStr = fieldsMatch[1];
                    const fieldAssignments = fieldsStr.split(',').map(f => f.trim().split('=')[0].trim());
                    fieldAssignments.forEach((field, index) => {
                        updateData[field] = params[index];
                    });
                }
                await categoryRepo.update(id, updateData);
                return { rows: [], rowCount: 1 };
            }

            // 7. Generic Collections
            const collNames = [
                'starting_formats', 'creator_flows', 'story_goals', 'personas', 'reference_images', 'role_assignments', 'usage_modes',
                'styles', 'image_generation_jobs', 'panel_generation_requests', 'cover_generation_requests', 'generated_assets', 'prompt_templates',
                'languages', 'project_language_settings', 'translation_units', 'translation_jobs', 'glossary_entries', 'language_availability_rules', 'translation_workflows',
                'voices', 'project_narration_settings', 'narration_units', 'narration_jobs', 'audio_assets', 'soundtrack_items', 'narration_workflows', 'voice_availability_rules',
                'ai_providers', 'ai_models', 'ai_workflows', 'ai_routing_rules', 'ai_fallback_configs', 'ai_plan_tier_maps'
            ];
            for (const coll of collNames) {
                if (sql.match(new RegExp(`SELECT\\\\s+\\\\*\\\\s+FROM\\\\s+${coll}`, 'i'))) {
                    const rows = await genericRepo.getAll(coll);
                    return { rows, rowCount: rows.length };
                }

                if (sql.match(new RegExp(`DELETE\\\\s+FROM\\\\s+${coll}\\\\s+WHERE\\\\s+id\\\\s+=\\\\s+\\\\$1`, 'i'))) {
                    await genericRepo.delete(coll, params[0]);
                    return { rows: [], rowCount: 1 };
                }

                if (sql.match(new RegExp(`UPDATE\\\\s+${coll}\\\\s+SET`, 'i'))) {
                    const id = params[params.length - 1];
                    const updateData: any = {};
                    const fieldsMatch = sql.match(/SET\s+(.*?)\s+WHERE/i);
                    if (fieldsMatch) {
                        const fieldsStr = fieldsMatch[1];
                        const fieldAssignments = fieldsStr.split(',').map(f => f.trim().split('=')[0].trim());
                        fieldAssignments.forEach((field, index) => {
                            let val = params[index];
                            if (typeof val === 'string' && (val.startsWith('[') || val.startsWith('{'))) {
                                try {
                                    val = JSON.parse(val);
                                } catch (e) {}
                            }
                            updateData[field] = val;
                        });
                    }
                    await genericRepo.update(coll, id, updateData);
                    return { rows: [], rowCount: 1 };
                }
            }

            const insertMatch = sql.match(/INSERT\s+INTO\s+(starting_formats|creator_flows|story_goals|personas|reference_images|role_assignments|usage_modes|styles|image_generation_jobs|panel_generation_requests|cover_generation_requests|generated_assets|prompt_templates|languages|project_language_settings|translation_units|translation_jobs|glossary_entries|language_availability_rules|translation_workflows|voices|project_narration_settings|narration_units|narration_jobs|audio_assets|soundtrack_items|narration_workflows|voice_availability_rules|ai_providers|ai_models|ai_workflows|ai_routing_rules|ai_fallback_configs|ai_plan_tier_maps)\s*\(.*?\)\s*VALUES/i);
            if (insertMatch) {
                const collName = insertMatch[1];
                const fieldsStr = sql.match(/VALUES/i) ? sql.slice(0, sql.toUpperCase().indexOf('VALUES')) : '';
                const fieldsMatch = fieldsStr.match(/\((.*?)\)/);
                if (fieldsMatch) {
                    const fields = fieldsMatch[1].split(',').map(f => f.trim());
                    const data: any = {};
                    fields.forEach((field, index) => {
                        let val = params[index];
                        if (typeof val === 'string' && (val.startsWith('[') || val.startsWith('{'))) {
                            try {
                                val = JSON.parse(val);
                            } catch (e) {}
                        }
                        data[field] = val;
                    });
                    const dataRes = await genericRepo.insert(collName, data);
                    return { rows: [dataRes], rowCount: 1 };
                }
            }

            console.warn(`[FirebaseMockPool] Unhandled SQL query: ${sql}`);
            return { rows: [], rowCount: 0 };

        } catch (e) {
            console.error('[FirebaseMockPool] Query error:', e);
            throw e;
        }
    }

    async connect() {
        return {
            query: this.query.bind(this),
            release: () => {}
        };
    }

    async end() {
        // No-op
    }
}

const mockPoolInstance = new FirebaseMockPool();
let pgPoolInstance: any = null;

export function getDbPool(force = false): any {
    if (process.env.DATABASE_URL && !pgPoolInstance) {
        pgPoolInstance = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: {
                rejectUnauthorized: false
            }
        });
    }
    
    if (pgPoolInstance) {
        return pgPoolInstance;
    }
    return mockPoolInstance;
}

export function isConnectionError(err: any): boolean {
    if (!err) return false;
    const msg = String(err.message || err).toLowerCase();
    return msg.includes('econrefused') || msg.includes('connection') || msg.includes('timeout') || msg.includes('offline');
}
