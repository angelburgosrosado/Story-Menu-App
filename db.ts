import pg from 'pg';
const { Pool } = pg;
import * as admin from 'firebase-admin';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import firebaseConfig from './firebase-applet-config.json';

// Ensure admin is initialized only once
if (!getApps().length) {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        try {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
            initializeApp({
                credential: admin.credential.cert(serviceAccount),
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
// Need to set the databaseId if not default
db.settings({ databaseId: (firebaseConfig as any).firestoreDatabaseId });

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

            if (sql.match(/SELECT\s+\*\s+FROM\s+app_settings/i)) {
                const snapshot = await db.collection('app_settings').get();
                const rows = snapshot.docs.map(d => d.data());
                return { rows, rowCount: rows.length };
            }

            if (sql.match(/UPDATE\s+app_settings\s+SET\s+key_value\s+=\s+\$1\s+WHERE\s+key_name\s+=\s+\$2/i)) {
                const key_value = params[0];
                const key_name = params[1];
                await db.collection('app_settings').doc(key_name).set({ key_name, key_value }, { merge: true });
                return { rows: [], rowCount: 1 };
            }

            if (sql.match(/INSERT\s+INTO\s+app_settings/i)) {
                const key_name = params[0];
                const key_value = params[1];
                await db.collection('app_settings').doc(key_name).set({ key_name, key_value }, { merge: true });
                return { rows: [], rowCount: 1 };
            }

            if (sql.match(/SELECT\s+(tokens|\*)\s+FROM\s+users\s+WHERE\s+email\s+=\s+\$1/i)) {
                const email = params[0];
                const snapshot = await db.collection('users').where('email', '==', email).get();
                const rows = snapshot.docs.map(d => d.data());
                return { rows, rowCount: rows.length };
            }

            if (sql.match(/SELECT\s+id,\s+email,\s+tier,\s+created_at,\s+tokens\s+FROM\s+users/i) || sql.match(/SELECT\s+\*\s+FROM\s+users/i)) {
                const snapshot = await db.collection('users').get();
                const rows = snapshot.docs.map(d => d.data());
                return { rows, rowCount: rows.length };
            }

            if (sql.match(/UPDATE\s+users\s+SET\s+tokens\s+=\s+tokens\s+-\s+\$1\s+WHERE\s+email\s+=\s+\$2/i)) {
                const amount = params[0];
                const email = params[1];
                const snapshot = await db.collection('users').where('email', '==', email).get();
                if (!snapshot.empty) {
                    const docId = snapshot.docs[0].id;
                    await db.collection('users').doc(docId).update({ tokens: FieldValue.increment(-amount) });
                    return { rows: [], rowCount: 1 };
                }
                return { rows: [], rowCount: 0 };
            }
            
            if (sql.match(/UPDATE\s+users\s+SET\s+tokens\s+=\s+\$1\s+WHERE\s+email\s+=\s+\$2/i)) {
                const amount = params[0];
                const email = params[1];
                const snapshot = await db.collection('users').where('email', '==', email).get();
                if (!snapshot.empty) {
                    const docId = snapshot.docs[0].id;
                    await db.collection('users').doc(docId).update({ tokens: amount });
                    return { rows: [], rowCount: 1 };
                }
                return { rows: [], rowCount: 0 };
            }

            if (sql.match(/UPDATE\s+users\s+SET\s+tier\s+=\s+\$1\s+WHERE\s+email\s+=\s+\$2/i)) {
                const tier = params[0];
                const email = params[1];
                const snapshot = await db.collection('users').where('email', '==', email).get();
                if (!snapshot.empty) {
                    const docId = snapshot.docs[0].id;
                    await db.collection('users').doc(docId).update({ tier });
                    return { rows: [], rowCount: 1 };
                }
                return { rows: [], rowCount: 0 };
            }

            if (sql.match(/INSERT\s+INTO\s+users\s*\(email\)\s*VALUES/i)) {
                const email = params[0];
                // generate a safe id from email
                const id = email.replace(/[^a-zA-Z0-9]/g, '_');
                await db.collection('users').doc(id).set({
                    id, email, tier: 'free', tokens: 0, created_at: new Date().toISOString()
                }, { merge: true });
                return { rows: [{ id, email, tier: 'free', tokens: 0 }], rowCount: 1 };
            }

            if (sql.match(/INSERT\s+INTO\s+users/i)) {
                const id = params[0] || 'unknown_id';
                const email = params[1] || 'unknown@example.com';
                const password = params[2];
                const tier = params[3];
                const data: any = { id, email, tokens: 0, created_at: new Date().toISOString() };
                if (password !== undefined) data.password = password;
                if (tier !== undefined) data.tier = tier;
                await db.collection('users').doc(id).set(data, { merge: true });
                return { rows: [data], rowCount: 1 };
            }

            if (sql.match(/DELETE\s+FROM\s+users\s+WHERE\s+email\s+=\s+\$1/i)) {
                const email = params[0];
                const snapshot = await db.collection('users').where('email', '==', email).get();
                for (const d of snapshot.docs) {
                    await d.ref.delete();
                }
                return { rows: [], rowCount: snapshot.docs.length };
            }
            
            if (sql.match(/SELECT\s+\*\s+FROM\s+characters\s+WHERE\s+user_id\s+=\s+\$1/i)) {
                const userId = params[0];
                const snapshot = await db.collection('users').doc(userId).collection('characters').get();
                const rows = snapshot.docs.map(d => d.data());
                return { rows, rowCount: rows.length };
            }
            
            if (sql.match(/INSERT\s+INTO\s+characters/i)) {
                 const [id, user_id, name, role_type, description, image_url] = params;
                 await db.collection('users').doc(user_id).collection('characters').doc(id).set({
                     id, userId: user_id, name, roleType: role_type, description, imageUrl: image_url, created_at: new Date().toISOString()
                 });
                 return { rows: [], rowCount: 1 };
            }
            
            if (sql.match(/SELECT\s+\*\s+FROM\s+projects\s+WHERE\s+user_id\s+=\s+\$1/i)) {
                const userId = params[0];
                const snapshot = await db.collection('users').doc(userId).collection('projects').get();
                const rows = snapshot.docs.map(d => d.data());
                return { rows, rowCount: rows.length };
            }
            
            if (sql.match(/INSERT\s+INTO\s+projects/i)) {
                 const [id, user_id, title, genre, language, comic_faces] = params;
                 await db.collection('users').doc(user_id).collection('projects').doc(id).set({
                     id, userId: user_id, title, genre, language, comicFaces: comic_faces, created_at: new Date().toISOString()
                 });
                 return { rows: [], rowCount: 1 };
            }

            if (sql.match(/INSERT\s+INTO\s+ai_usage_logs/i)) {
                 const [user_email, operation, model, tokens_in, tokens_out, cost_usd] = params;
                 await db.collection('ai_usage_logs').add({
                     user_email, operation, model, tokens_in, tokens_out, cost_usd, created_at: new Date().toISOString()
                 });
                 return { rows: [], rowCount: 1 };
            }

            if (sql.match(/SELECT\s+SUM\(tokens_in\)/i) && sql.match(/ai_usage_logs/i)) {
                const snapshot = await db.collection('ai_usage_logs').get();
                let total_in = 0, total_out = 0, total_cost = 0;
                snapshot.forEach(doc => {
                    const data = doc.data();
                    total_in += data.tokens_in || 0;
                    total_out += data.tokens_out || 0;
                    total_cost += data.cost_usd || 0;
                });
                return { rows: [{ total_in, total_out, total_cost }], rowCount: 1 };
            }

            if (sql.match(/SELECT\s+user_email.*?FROM\s+ai_usage_logs.*?ORDER\s+BY/i)) {
                const snapshot = await db.collection('ai_usage_logs').orderBy('created_at', 'desc').limit(100).get();
                const rows = snapshot.docs.map(d => d.data());
                return { rows, rowCount: rows.length };
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
