/**
 * Firestore Repositories - Dual-DB Repository Pattern Implementation
 * Eliminates direct SQL query regex parsing by encapsulating Firestore operations.
 */
import * as admin from 'firebase-admin';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import firebaseConfig from '../firebase-applet-config.json';

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
            console.error('Failed to init admin in db/repositories.ts', e);
        }
    } else {
        try {
            initializeApp({ projectId: firebaseConfig.projectId });
        } catch (e) {}
    }
}

const firestoreDb = getFirestore();
firestoreDb.settings({ databaseId: (firebaseConfig as any).firestoreDatabaseId });

export interface IAppSettingsRepository {
    getAll(): Promise<any[]>;
    set(key_name: string, key_value: any): Promise<void>;
}

export interface IUserRepository {
    getByEmail(email: string): Promise<any[]>;
    getAll(): Promise<any[]>;
    incrementTokens(email: string, amount: number): Promise<boolean>;
    updateTokens(email: string, amount: number): Promise<boolean>;
    updateTier(email: string, tier: string): Promise<boolean>;
    create(email: string): Promise<any>;
    insert(params: any[]): Promise<any>;
    deleteByEmail(email: string): Promise<number>;
}

export interface ICharacterRepository {
    getByUser(userId: string): Promise<any[]>;
    insert(params: any[]): Promise<void>;
}

export interface IProjectRepository {
    getByUser(userId: string): Promise<any[]>;
    insert(params: any[]): Promise<void>;
}

export interface IUsageLogRepository {
    insert(params: any[]): Promise<void>;
    getTotals(): Promise<any>;
    getRecentLogs(limit: number): Promise<any[]>;
    getCostByModel(): Promise<any[]>;
    getCostByUser(): Promise<any[]>;
}

export interface ICategoryRepository {
    getAll(activeOnly: boolean): Promise<any[]>;
    insert(params: any[]): Promise<any>;
    delete(id: string): Promise<void>;
    update(id: string, updateData: any): Promise<void>;
}

export interface IGenericMetadataRepository {
    getAll(collection: string): Promise<any[]>;
    delete(collection: string, id: string): Promise<void>;
    update(collection: string, id: string, updateData: any): Promise<void>;
    insert(collection: string, data: any): Promise<any>;
}

// Concrete Firestore Implementations

export class FirestoreAppSettingsRepository implements IAppSettingsRepository {
    async getAll(): Promise<any[]> {
        const snapshot = await firestoreDb.collection('app_settings').get();
        return snapshot.docs.map(d => d.data());
    }
    async set(key_name: string, key_value: any): Promise<void> {
        await firestoreDb.collection('app_settings').doc(key_name).set({ key_name, key_value }, { merge: true });
    }
}

export class FirestoreUserRepository implements IUserRepository {
    async getByEmail(email: string): Promise<any[]> {
        const snapshot = await firestoreDb.collection('users').where('email', '==', email).get();
        return snapshot.docs.map(d => d.data());
    }
    async getAll(): Promise<any[]> {
        const snapshot = await firestoreDb.collection('users').get();
        return snapshot.docs.map(d => d.data());
    }
    async incrementTokens(email: string, amount: number): Promise<boolean> {
        const snapshot = await firestoreDb.collection('users').where('email', '==', email).get();
        if (snapshot.empty) return false;
        const docId = snapshot.docs[0].id;
        await firestoreDb.collection('users').doc(docId).update({ tokens: FieldValue.increment(amount) });
        return true;
    }
    async updateTokens(email: string, amount: number): Promise<boolean> {
        const snapshot = await firestoreDb.collection('users').where('email', '==', email).get();
        if (snapshot.empty) return false;
        const docId = snapshot.docs[0].id;
        await firestoreDb.collection('users').doc(docId).update({ tokens: amount });
        return true;
    }
    async updateTier(email: string, tier: string): Promise<boolean> {
        const snapshot = await firestoreDb.collection('users').where('email', '==', email).get();
        if (snapshot.empty) return false;
        const docId = snapshot.docs[0].id;
        await firestoreDb.collection('users').doc(docId).update({ tier });
        return true;
    }
    async create(email: string): Promise<any> {
        const id = email.replace(/[^a-zA-Z0-9]/g, '_');
        const data = { id, email, tier: 'free', tokens: 0, created_at: new Date().toISOString() };
        await firestoreDb.collection('users').doc(id).set(data, { merge: true });
        return data;
    }
    async insert(params: any[]): Promise<any> {
        const id = params[0] || 'unknown_id';
        const email = params[1] || 'unknown@example.com';
        const password = params[2];
        const tier = params[3];
        const data: any = { id, email, tokens: 0, created_at: new Date().toISOString() };
        if (password !== undefined) data.password = password;
        if (tier !== undefined) data.tier = tier;
        await firestoreDb.collection('users').doc(id).set(data, { merge: true });
        return data;
    }
    async deleteByEmail(email: string): Promise<number> {
        const snapshot = await firestoreDb.collection('users').where('email', '==', email).get();
        for (const d of snapshot.docs) {
            await d.ref.delete();
        }
        return snapshot.docs.length;
    }
}

export class FirestoreCharacterRepository implements ICharacterRepository {
    async getByUser(userId: string): Promise<any[]> {
        const snapshot = await firestoreDb.collection('users').doc(userId).collection('characters').get();
        return snapshot.docs.map(d => d.data());
    }
    async insert(params: any[]): Promise<void> {
        const [id, user_id, name, role_type, description, image_url] = params;
        await firestoreDb.collection('users').doc(user_id).collection('characters').doc(id).set({
            id, userId: user_id, name, roleType: role_type, description, imageUrl: image_url, created_at: new Date().toISOString()
        });
    }
}

export class FirestoreProjectRepository implements IProjectRepository {
    async getByUser(userId: string): Promise<any[]> {
        const snapshot = await firestoreDb.collection('users').doc(userId).collection('projects').get();
        return snapshot.docs.map(d => d.data());
    }
    async insert(params: any[]): Promise<void> {
        const [id, user_id, title, genre, language, comic_faces] = params;
        await firestoreDb.collection('users').doc(user_id).collection('projects').doc(id).set({
            id, userId: user_id, title, genre, language, comicFaces: comic_faces, created_at: new Date().toISOString()
        });
    }
}

export class FirestoreUsageLogRepository implements IUsageLogRepository {
    async insert(params: any[]): Promise<void> {
        const [user_email, operation, model, tokens_in, tokens_out, cost_usd] = params;
        await firestoreDb.collection('ai_usage_logs').add({
            user_email, operation, model, tokens_in, tokens_out, cost_usd, created_at: new Date().toISOString()
        });
    }
    async getTotals(): Promise<any> {
        const snapshot = await firestoreDb.collection('ai_usage_logs').get();
        let total_in = 0, total_out = 0, total_cost = 0;
        snapshot.forEach(doc => {
            const data = doc.data();
            total_in += data.tokens_in || 0;
            total_out += data.tokens_out || 0;
            total_cost += data.cost_usd || 0;
        });
        return { total_in, total_out, total_cost };
    }
    async getRecentLogs(limit: number): Promise<any[]> {
        const snapshot = await firestoreDb.collection('ai_usage_logs').orderBy('created_at', 'desc').limit(limit).get();
        return snapshot.docs.map(d => d.data());
    }
    async getCostByModel(): Promise<any[]> {
        const snapshot = await firestoreDb.collection('ai_usage_logs').get();
        const modelMap: Record<string, number> = {};
        snapshot.forEach(doc => {
            const data = doc.data();
            const model = data.model || 'unknown';
            modelMap[model] = (modelMap[model] || 0) + (data.cost_usd || 0);
        });
        return Object.entries(modelMap).map(([model, total_cost]) => ({
            model,
            total_cost
        }));
    }
    async getCostByUser(): Promise<any[]> {
        const snapshot = await firestoreDb.collection('ai_usage_logs').get();
        const userMap: Record<string, { calls: number, total_cost: number }> = {};
        snapshot.forEach(doc => {
            const data = doc.data();
            const email = data.user_email || 'anonymous';
            if (!userMap[email]) userMap[email] = { calls: 0, total_cost: 0 };
            userMap[email].calls++;
            userMap[email].total_cost += (data.cost_usd || 0);
        });
        return Object.entries(userMap).map(([user_email, stats]) => ({
            user_email,
            calls: stats.calls,
            total_cost: stats.total_cost
        }));
    }
}

export class FirestoreCategoryRepository implements ICategoryRepository {
    async getAll(activeOnly: boolean): Promise<any[]> {
        const snapshot = await firestoreDb.collection('content_categories').get();
        let rows = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        rows.sort((a: any, b: any) => {
            const tA = a.created_at ? new Date(a.created_at).getTime() : 0;
            const tB = b.created_at ? new Date(b.created_at).getTime() : 0;
            return tB - tA;
        });
        if (activeOnly) {
            rows = rows.filter((r: any) => r.is_active !== false);
        }
        return rows;
    }
    async insert(params: any[]): Promise<any> {
        const name = params[0];
        const category_type = params[1];
        const emoji = params[2];
        const prompt_instruction = params[3];
        const is_featured = params[4] || false;
        const docId = firestoreDb.collection('content_categories').doc().id;
        const data = {
            id: docId,
            name,
            category_type,
            emoji,
            prompt_instruction,
            is_featured,
            is_active: true,
            created_at: new Date().toISOString()
        };
        await firestoreDb.collection('content_categories').doc(docId).set(data);
        return data;
    }
    async delete(id: string): Promise<void> {
        await firestoreDb.collection('content_categories').doc(id).delete();
    }
    async update(id: string, updateData: any): Promise<void> {
        await firestoreDb.collection('content_categories').doc(id).update(updateData);
    }
}

export class FirestoreGenericMetadataRepository implements IGenericMetadataRepository {
    async getAll(collection: string): Promise<any[]> {
        const snapshot = await firestoreDb.collection(collection).get();
        const rows = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        rows.sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0));
        return rows;
    }
    async delete(collection: string, id: string): Promise<void> {
        await firestoreDb.collection(collection).doc(id).delete();
    }
    async update(collection: string, id: string, updateData: any): Promise<void> {
        await firestoreDb.collection(collection).doc(id).set(updateData, { merge: true });
    }
    async insert(collection: string, data: any): Promise<any> {
        const docId = data.id || firestoreDb.collection(collection).doc().id;
        data.id = docId;
        if (!data.created_at) data.created_at = new Date().toISOString();
        await firestoreDb.collection(collection).doc(docId).set(data, { merge: true });
        return data;
    }
}
