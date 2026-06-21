/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type, HarmCategory, HarmBlockThreshold } from '@google/genai';
import { getDbPool, isDatabaseConnected, initializeDatabaseSchema, markDatabaseOffline, testCustomConnectionString, resetConnectionState } from './db';
import { getModerationConfig, passesLocalFilter } from './i18nModeration';
import { calculateTokenCost, AI_MODELS } from './pricingIntelligence';
import Stripe from 'stripe';

import admin from 'firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

try {
    admin.initializeApp();
} catch (e) {
    console.warn('Firebase Admin init failed. Default credentials not found. Admin auth will fallback to header email check for local dev.');
}

let startupError: any = null;

// Capture and diagnostics for any unhandled startup crashes
process.on('uncaughtException', (err) => {
    console.error('🚨 UNCAUGHT EXCEPTION:', err && (err.stack || err.message || err));
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('⚠️ UNHANDLED PROMISE REJECTION:', reason);
});

let aiClient: GoogleGenAI | null = null;
function getAIClient(customKey?: string): GoogleGenAI {
    // Standard AI Studio secret is GEMINI_API_KEY or we can check alternate API_KEY
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

const app = express();

let _filename = '';
let _dirname = '';
if (typeof __filename !== 'undefined' && __filename) {
    _filename = __filename;
} else {
    try {
        _filename = fileURLToPath(import.meta.url);
    } catch {
        _filename = '';
    }
}

if (typeof __dirname !== 'undefined' && __dirname) {
    _dirname = __dirname;
} else if (_filename) {
    _dirname = path.dirname(_filename);
} else {
    _dirname = process.cwd();
}

/**
 * TOKEN MANAGEMENT ENGINE
 * Deducts tokens from PostgreSQL DB or memory fallback for a user.
 */
async function consumeTokens(email: string, amount: number): Promise<boolean> {
    if (!email) return false;

    try {
        const db = getFirestore();
        const snapshot = await db.collection('users').where('email', '==', email).get();
        if (snapshot.empty) return false;
        
        const userRef = snapshot.docs[0].ref;
        
        return await db.runTransaction(async (transaction: any) => {
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists) return false;
            
            const currentTokens = userDoc.data()?.tokens || 0;
            if (currentTokens >= amount) {
                transaction.update(userRef, { tokens: currentTokens - amount });
                return true;
            }
            return false;
        });
    } catch (err: any) {
        console.warn("Failed to consume tokens in Firestore:", err.message);
        
        // Memory fallback
        const matchUser = memoryDb.users.find(u => u.email === email);
        if (matchUser) {
            if ((matchUser.tokens || 0) >= amount) {
                matchUser.tokens = (matchUser.tokens || 0) - amount;
                return true;
            }
        }
        return false;
    }
}

// Safely load local .env credentials if they exist in the root folder
try {
    const envPath = path.join(process.cwd(), '.env');
     if (!fs.existsSync(envPath)) {
        fs.mkdirSync(envPath, { recursive: true });
    }
} catch (err) {}

async function getSettingValue(key: string): Promise<string> {
    try {
        const db = getFirestore();
        const docSnap = await db.collection('app_settings').doc(key.toLowerCase()).get();
        if (docSnap.exists) {
            return docSnap.data().key_value;
        }
    } catch (err: any) {
        console.warn(`Failed to fetch setting ${key} from Firestore:`, err.message);
    }
    
    // Fallback to memory
    const memorySetting = memoryDb.app_settings?.find((s:any) => s.key_name === key.toLowerCase());
    if (memorySetting) return memorySetting.key_value;
    
    return process.env[key.toUpperCase()] || '';
}

export default function setupServer(app: express.Application) {
    try {
        const envPath = path.join(process.cwd(), '.env');
        const envContent = fs.readFileSync(envPath, 'utf8');
        envContent.split('\n').forEach((line) => {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#')) {
                const eqIdx = trimmed.indexOf('=');
                if (eqIdx !== -1) {
                    const key = trimmed.substring(0, eqIdx).trim();
                    const val = trimmed.substring(eqIdx + 1).trim();
                    if (key && !process.env[key]) {
                        process.env[key] = val;
                    }
                }
            }
        });
        console.info("💡 Local .env configuration loaded successfully.");
    } catch (err) {
        console.warn("Could not read local .env file:", err);
    }
}

// Ensure any quotes or whitespace in DATABASE_URL are sanitized on startup
if (process.env.DATABASE_URL) {
    const val = process.env.DATABASE_URL.toString().replace(/['"]/g, '').trim();
    const cleanLower = val.toLowerCase();
    if (
        !val ||
        cleanLower === 'undefined' ||
        cleanLower === 'null' ||
        cleanLower === 'none' ||
        cleanLower.includes('placeholder') ||
        cleanLower.includes('<username>') ||
        cleanLower.includes('<password>') ||
        cleanLower.includes('@base:') ||
        cleanLower.includes('your_host') ||
        cleanLower.includes('insert-your') ||
        cleanLower.includes('your-database')
    ) {
        console.warn(`📢 [Self-Healing DB] Detected placeholder, undefined, or empty DATABASE_URL: "${val}". Disabling database pool to instantly fall back to safe sandbox mode.`);
        process.env.DATABASE_URL = '';
    } else {
        process.env.DATABASE_URL = val;
    }
}

// Simple In-memory database fallback to ensure app stays 100% functional without DB configuration
const memoryDb = {
    users: [] as any[],
    character_vault: [] as any[],
    projects: [] as any[],
    project_casting: [] as any[],
    app_settings: [
        { key_name: 'stripe_publishable_key', key_value: process.env.STRIPE_PUBLISHABLE_KEY || '', is_secret: false },
        { key_name: 'stripe_secret_key', key_value: process.env.STRIPE_SECRET_KEY || '', is_secret: true },
        { key_name: 'paypal_client_id', key_value: process.env.PAYPAL_CLIENT_ID || '', is_secret: false },
        { key_name: 'paypal_secret', key_value: process.env.PAYPAL_SECRET || '', is_secret: true }
    ] as any[],
};

// Insert a default anonymous creator in-memory
memoryDb.users.push({
    id: '00000000-0000-0000-0000-000000000000',
    email: 'local-creator@infinite.multiverse',
    created_at: new Date()
});

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function isValidUuid(val: string): boolean {
    return UUID_REGEX.test(val);
}

const isConnectionError = (err: any) => {
    if (!err) return false;
    const msg = String(err.message || '').toLowerCase();
    const code = String(err.code || '');
    return code.startsWith('08') || 
           code === 'ECONNREFUSED' || 
           code === 'ENOTFOUND' || 
           code === 'ETIMEDOUT' || 
           msg.includes('connection') || 
           msg.includes('timeout') || 
           msg.includes('socket');
};

async function ensureUserExists(pool: any, userId: string) {
    if (!userId) return;
    try {
        const check = await pool.query('SELECT 1 FROM users WHERE id = $1', [userId]);
        if (check.rowCount === 0) {
            const email = userId === '00000000-0000-0000-0000-000000000000' 
                ? 'local-creator@infinite.multiverse' 
                : `auto-creator-${userId}@multiverse.com`;
            await pool.query(
                'INSERT INTO users (id, email) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING',
                [userId, email]
            );
            console.info(`👤 Seeded user profile into database for UUID: ${userId} (${email})`);
        }
    } catch (e: any) {
        console.warn(`Could not auto-seed user ID ${userId}:`, e.message);
    }
}

async function startServer(app: express.Express) {
    const isCompiledFile = _dirname.includes('dist') || _filename.includes('dist') || _filename.endsWith('.cjs');
    const isCloudRun = !!process.env.K_SERVICE || !!process.env.K_REVISION || process.env.GOOGLE_CLOUD_PROJECT !== undefined;
    const hasCompiledAssets = fs.existsSync(path.join(process.cwd(), 'dist', 'index.html'));
    
    // Dev server should only run in production mode if explicitly set to 'production' or if there is no server.ts in workspace
    const isProductionMode = process.env.NODE_ENV === "production" || 
                             isCompiledFile || 
                             (isCloudRun && !fs.existsSync(path.join(process.cwd(), 'server.ts'))) ||
                             (!fs.existsSync(path.join(process.cwd(), 'server.ts')) && hasCompiledAssets);

    let port = process.env.PORT ? parseInt(process.env.PORT) : 3001;
    if (process.env.PORT) {
        try {
            const cleanedPortStr = process.env.PORT.toString().replace(/['"]/g, '').trim();
            const parsedPort = parseInt(cleanedPortStr, 10);
            if (!isNaN(parsedPort) && parsedPort > 0) {
                port = parsedPort;
            }
        } catch {}
    }

    app.use(express.json({ limit: '50mb' }));
    app.use(express.urlencoded({ extended: true, limit: '50mb' }));

    // ─── SEO: robots.txt & multilingual sitemap ──────────────────────────────
    app.get('/robots.txt', (_req, res) => {
        res.type('text/plain').send(
`User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/
Sitemap: https://storymenu.app/sitemap.xml`
        );
    });

    app.get('/sitemap.xml', (_req, res) => {
        res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <url>
    <loc>https://storymenu.app/</loc>
    <xhtml:link rel="alternate" hreflang="en"        href="https://storymenu.app/"/>
    <xhtml:link rel="alternate" hreflang="es"        href="https://storymenu.app/es/"/>
    <xhtml:link rel="alternate" hreflang="ja"        href="https://storymenu.app/ja/"/>
    <xhtml:link rel="alternate" hreflang="pt-BR"     href="https://storymenu.app/pt/"/>
    <xhtml:link rel="alternate" hreflang="fr"        href="https://storymenu.app/fr/"/>
    <xhtml:link rel="alternate" hreflang="de"        href="https://storymenu.app/de/"/>
    <xhtml:link rel="alternate" hreflang="ko"        href="https://storymenu.app/ko/"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="https://storymenu.app/"/>
    <changefreq>weekly</changefreq><priority>1.0</priority>
  </url>
  <url>
    <loc>https://storymenu.app/es/</loc>
    <xhtml:link rel="alternate" hreflang="en"        href="https://storymenu.app/"/>
    <xhtml:link rel="alternate" hreflang="es"        href="https://storymenu.app/es/"/>
    <xhtml:link rel="alternate" hreflang="ja"        href="https://storymenu.app/ja/"/>
    <xhtml:link rel="alternate" hreflang="pt-BR"     href="https://storymenu.app/pt/"/>
    <xhtml:link rel="alternate" hreflang="fr"        href="https://storymenu.app/fr/"/>
    <xhtml:link rel="alternate" hreflang="de"        href="https://storymenu.app/de/"/>
    <xhtml:link rel="alternate" hreflang="ko"        href="https://storymenu.app/ko/"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="https://storymenu.app/"/>
    <changefreq>weekly</changefreq><priority>0.9</priority>
  </url>
  <url>
    <loc>https://storymenu.app/ja/</loc>
    <xhtml:link rel="alternate" hreflang="en"        href="https://storymenu.app/"/>
    <xhtml:link rel="alternate" hreflang="es"        href="https://storymenu.app/es/"/>
    <xhtml:link rel="alternate" hreflang="ja"        href="https://storymenu.app/ja/"/>
    <xhtml:link rel="alternate" hreflang="pt-BR"     href="https://storymenu.app/pt/"/>
    <xhtml:link rel="alternate" hreflang="fr"        href="https://storymenu.app/fr/"/>
    <xhtml:link rel="alternate" hreflang="de"        href="https://storymenu.app/de/"/>
    <xhtml:link rel="alternate" hreflang="ko"        href="https://storymenu.app/ko/"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="https://storymenu.app/"/>
    <changefreq>weekly</changefreq><priority>0.9</priority>
  </url>
  <url>
    <loc>https://storymenu.app/pt/</loc>
    <xhtml:link rel="alternate" hreflang="en"        href="https://storymenu.app/"/>
    <xhtml:link rel="alternate" hreflang="es"        href="https://storymenu.app/es/"/>
    <xhtml:link rel="alternate" hreflang="ja"        href="https://storymenu.app/ja/"/>
    <xhtml:link rel="alternate" hreflang="pt-BR"     href="https://storymenu.app/pt/"/>
    <xhtml:link rel="alternate" hreflang="fr"        href="https://storymenu.app/fr/"/>
    <xhtml:link rel="alternate" hreflang="de"        href="https://storymenu.app/de/"/>
    <xhtml:link rel="alternate" hreflang="ko"        href="https://storymenu.app/ko/"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="https://storymenu.app/"/>
    <changefreq>weekly</changefreq><priority>0.9</priority>
  </url>
  <url>
    <loc>https://storymenu.app/fr/</loc>
    <xhtml:link rel="alternate" hreflang="en"        href="https://storymenu.app/"/>
    <xhtml:link rel="alternate" hreflang="es"        href="https://storymenu.app/es/"/>
    <xhtml:link rel="alternate" hreflang="ja"        href="https://storymenu.app/ja/"/>
    <xhtml:link rel="alternate" hreflang="pt-BR"     href="https://storymenu.app/pt/"/>
    <xhtml:link rel="alternate" hreflang="fr"        href="https://storymenu.app/fr/"/>
    <xhtml:link rel="alternate" hreflang="de"        href="https://storymenu.app/de/"/>
    <xhtml:link rel="alternate" hreflang="ko"        href="https://storymenu.app/ko/"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="https://storymenu.app/"/>
    <changefreq>weekly</changefreq><priority>0.9</priority>
  </url>
  <url>
    <loc>https://storymenu.app/de/</loc>
    <xhtml:link rel="alternate" hreflang="en"        href="https://storymenu.app/"/>
    <xhtml:link rel="alternate" hreflang="es"        href="https://storymenu.app/es/"/>
    <xhtml:link rel="alternate" hreflang="ja"        href="https://storymenu.app/ja/"/>
    <xhtml:link rel="alternate" hreflang="pt-BR"     href="https://storymenu.app/pt/"/>
    <xhtml:link rel="alternate" hreflang="fr"        href="https://storymenu.app/fr/"/>
    <xhtml:link rel="alternate" hreflang="de"        href="https://storymenu.app/de/"/>
    <xhtml:link rel="alternate" hreflang="ko"        href="https://storymenu.app/ko/"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="https://storymenu.app/"/>
    <changefreq>weekly</changefreq><priority>0.9</priority>
  </url>
  <url>
    <loc>https://storymenu.app/ko/</loc>
    <xhtml:link rel="alternate" hreflang="en"        href="https://storymenu.app/"/>
    <xhtml:link rel="alternate" hreflang="es"        href="https://storymenu.app/es/"/>
    <xhtml:link rel="alternate" hreflang="ja"        href="https://storymenu.app/ja/"/>
    <xhtml:link rel="alternate" hreflang="pt-BR"     href="https://storymenu.app/pt/"/>
    <xhtml:link rel="alternate" hreflang="fr"        href="https://storymenu.app/fr/"/>
    <xhtml:link rel="alternate" hreflang="de"        href="https://storymenu.app/de/"/>
    <xhtml:link rel="alternate" hreflang="ko"        href="https://storymenu.app/ko/"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="https://storymenu.app/"/>
    <changefreq>weekly</changefreq><priority>0.9</priority>
  </url>
</urlset>`);
    });
    // ─────────────────────────────────────────────────────────────────────────

    // Try starting & initializing PostgreSQL structure asynchronously so it does not block server startup
    console.info(`📡 Current server-side process.env.DATABASE_URL (masked): ${process.env.DATABASE_URL ? maskConnectionUri(process.env.DATABASE_URL) : 'None'}`);
    initializeDatabaseSchema().catch((e) => {
        console.warn("Could not auto-initialize DB tables on reboot:", e);
    });

    /**
     * SECURELY MASK DATABASE URI PASSWORDS FOR DIAGNOSIS
     */
    function maskConnectionUri(urlStr: string | undefined): string {
        if (!urlStr) return '';
        try {
            const doubleSlashIdx = urlStr.indexOf('://');
            if (doubleSlashIdx === -1) return 'invalid-url';
            
            const protocol = urlStr.substring(0, doubleSlashIdx);
            const rest = urlStr.substring(doubleSlashIdx + 3);
            
            const firstSlashInRest = rest.indexOf('/');
            const authority = firstSlashInRest === -1 ? rest : rest.substring(0, firstSlashInRest);
            const dbName = firstSlashInRest === -1 ? '' : rest.substring(firstSlashInRest + 1);
            
            const lastAtIdx = authority.lastIndexOf('@');
            if (lastAtIdx === -1) {
                return `${protocol}://${authority}/${dbName}`; // no credentials
            }
            
            const credentials = authority.substring(0, lastAtIdx);
            const hostPort = authority.substring(lastAtIdx + 1);
            
            const colonInCreds = credentials.indexOf(':');
            let user = credentials;
            if (colonInCreds !== -1) {
                user = credentials.substring(0, colonInCreds);
            }
            
            return `${protocol}://${user}:******@${hostPort}/${dbName}`;
        } catch (e) {
            return 'invalid-url';
        }
    }

    /**
     * DATABASE HEALTH & CONFIG STATUS
     */
    app.get('/api/db-status', (req, res) => {
        const connected = isDatabaseConnected();
        res.json({
            connected,
            status: connected ? 'ok' : 'offline',
            mode: connected ? 'production-postgres' : 'offline-memory',
            hasUrlEnv: !!process.env.DATABASE_URL,
            dbUrlMasked: process.env.DATABASE_URL ? maskConnectionUri(process.env.DATABASE_URL) : ''
        });
    });

    /**
     * MANUAL RESET AND FORCE RECONNECT ENDPOINT FOR CLOUD RUN HANDSHAKES
     */
    app.post('/api/db-reconnect', async (req, res): Promise<any> => {
        try {
            console.log("⚡ Received client request to resolve database status and force reconnect...");
            resetConnectionState();
            
            // Re-attempt initial schema checks or pool verification
            await initializeDatabaseSchema();
            
            const connected = isDatabaseConnected();
            return res.json({
                success: connected,
                status: connected ? 'ok' : 'offline',
                message: connected ? 'Successfully re-established database connection pool and validated schema tables!' : 'Re-connection failed. Check that your database host, username, and password are correct, and your database allows incoming traffic.'
            });
        } catch (err: any) {
            return res.status(500).json({
                success: false,
                error: err.message || 'Error occurred during forced database re-connection.'
            });
        }
    });

    /**
     * RETRIEVE CURRENT DATABASE CONFIGURATION URL (UNMASKED FOR DIAGNOSTIC LOADER)
     */
    app.get('/api/get-raw-database-url', (req, res) => {
        res.json({
            url: process.env.DATABASE_URL || ''
        });
    });

    /**
     * ON-DEMAND DATABASE CONNECTION VERIFIER & DIAGNOSTIC UTILITY
     */
    app.post('/api/verify-database-connection', async (req, res): Promise<any> => {
        const { connectionString } = req.body;
        const targetUrl = connectionString || process.env.DATABASE_URL;

        if (!targetUrl) {
            return res.json({
                success: false,
                error: 'No database URL connection string provided, and default environment process.env.DATABASE_URL is empty.'
            });
        }

        try {
            const result = await testCustomConnectionString(targetUrl);
            return res.json(result);
        } catch (err: any) {
            return res.json({
                success: false,
                error: err.message || 'Verification attempt resulted in an unexpected error context.'
            });
        }
    });

    /**
     * CLOUD RUN ENVIRONMENT CONFIGURATION DETECTION
     */
    app.get('/api/cloudrun-config', (req, res) => {
        // Core Cloud Run environment vars: K_SERVICE, K_REVISION, K_CONFIGURATION
        const service = process.env.K_SERVICE || '';
        const revision = process.env.K_REVISION || '';
        const configuration = process.env.K_CONFIGURATION || '';
        const hasKEnv = !!(service || revision || configuration);
        
        // Inside our hosting runtime, check if we're inside a container (Cloud Run infrastructure)
        const isCloudRun = hasKEnv || process.env.GOOGLE_CLOUD_PROJECT !== undefined || (process.cwd && process.cwd().includes('/applet') || process.cwd().includes('/workspace'));

        res.json({
            isCloudRun,
            service: service || 'infinite-heroes-remix-app',
            revision: revision || 'remix-v1-prod',
            configuration: configuration || 'infinite-heroes-config',
            project: process.env.GOOGLE_CLOUD_PROJECT || 'ai-studio-multiverse-sandbox',
            port: port.toString(),
            region: process.env.CLOUD_RUN_REGION || 'us-east1'
        });
    });

    /**
     * GEMINI SERVER-SIDE API SECURE IMPLEMENTATIONS
     */

    // Regional Content Configuration Helper
    const applyModeration = (req: any, prompt: string) => {
        // Retrieve regional preference header, defaulting to GLOBAL
        const region = req.headers['x-region'] || 'GLOBAL';
        const modConfig = getModerationConfig(region as any);

        if (!passesLocalFilter(prompt)) {
            throw new Error('MODERATION_BLOCKED:Local keyword filter tripped.');
        }

        return [
            {
                category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                threshold: modConfig.strictness
            },
            {
                category: HarmCategory.HARM_CATEGORY_HARASSMENT,
                threshold: modConfig.strictness
            },
            {
                category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                threshold: modConfig.strictness
            },
            {
                category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                threshold: modConfig.strictness
            }
        ];
    };

    /**
     * Helper to wrap Gemini calls and format safety blocks.
     */
    const callGeminiSafely = async (aiParams: any, reqEmail?: string, operationName?: string) => {
        try {
            const response = await aiClient!.models.generateContent(aiParams);
            if (reqEmail && operationName && aiParams.model) {
                const tokensIn = response.usageMetadata?.promptTokenCount || 0;
                const tokensOut = response.usageMetadata?.candidatesTokenCount || 0;
                logAiUsage(reqEmail, operationName, aiParams.model, tokensIn, tokensOut).catch(e => console.error("Log usage err:", e));
            }
            return response;
        } catch (e: any) {
            // Check if it's a safety error from SDK (FinishReason.SAFETY usually throws a specific structure)
            if (e.message && e.message.includes('safety') || e.message?.includes('MODERATION_BLOCKED')) {
                throw new Error('MODERATION_BLOCKED');
            }
            throw e;
        }
    };

    app.post('/api/gemini/speech', async (req, res): Promise<any> => {
        const { text, voiceName, userEmail } = req.body;
        if (!(await consumeTokens(userEmail, calculateTokenCost('gemini-3.1-flash-tts-preview', 1)))) return res.status(402).json({ error: 'Insufficient tokens' });
        if (!text) return res.status(400).json({ error: 'Text prompt is required.' });
        try {
            const ai = getAIClient(req.headers['x-gemini-key'] as string);
            const response = await callGeminiSafely({
                safetySettings: applyModeration(req, req.body ? JSON.stringify(req.body) : ""),
                model: "gemini-3.1-flash-tts-preview",
                contents: [{ parts: [{ text }] }],
                config: {
                    responseModalities: ["AUDIO"],
                    speechConfig: {
                        voiceConfig: {
                            prebuiltVoiceConfig: { voiceName: voiceName || 'Zephyr' },
                        },
                    },
                },
            });
            const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || '';
            return res.json({ base64Audio });
        } catch (e: any) {
            console.error("Speech api failed:", e.message);
            return res.status(500).json({ error: e.message || "Speech generation failed" });
        }
    });

    app.post('/api/gemini/persona', async (req, res): Promise<any> => {
        const { desc, selectedGenre, userEmail } = req.body;
        if (!(await consumeTokens(userEmail, calculateTokenCost('gemini-3.5-flash', 1000)))) return res.status(402).json({ error: 'Insufficient tokens' });
        if (!desc) return res.status(400).json({ error: 'Description is required' });
        const style = selectedGenre === 'Custom' ? "Modern American comic book art" : `${selectedGenre} comic`;
        try {
            const ai = getAIClient(req.headers['x-gemini-key'] as string);
            const response = await callGeminiSafely({
                safetySettings: applyModeration(req, req.body ? JSON.stringify(req.body) : ""),
                model: 'gemini-2.5-flash-image',
                contents: { text: `STYLE: Masterpiece ${style} character sheet, detailed ink, neutral background. FULL BODY. Character: ${desc}` },
                config: { imageConfig: { aspectRatio: '1:1' } }
            });
            const part = response.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
            if (part?.inlineData?.data) {
                return res.json({ base64: part.inlineData.data, desc });
            }
            return res.status(500).json({ error: "Failed to generate character design" });
        } catch (e: any) {
            console.error("Persona api failed:", e.message);
            return res.status(500).json({ error: e.message || "Persona generation failed" });
        }
    });

    app.post('/api/gemini/suggest', async (req, res): Promise<any> => {
        const { fieldName, currentValue, genre, roleType, characterName, concept, userEmail } = req.body;
        if (!(await consumeTokens(userEmail, calculateTokenCost('gemini-3.5-flash', 500)))) return res.status(402).json({ error: 'Insufficient tokens' });

        if (!fieldName) {
            return res.status(400).json({ error: 'fieldName is required' });
        }

        try {
            const ai = getAIClient(req.headers['x-gemini-key'] as string);

            if (fieldName === 'storyBlueprint') {
                const { storyTone, customPremise } = req.body;
                const prompt = `You are an expert comic book director, master novelist, and creative consulting editor.
We are developing a narrative comic/novel that progresses through EXACTLY 10 pages/beats, and we need a detailed, cohesive "Story Blueprint".
A Story Blueprint consists of an array of exactly 10 chapter-level beats (pages), each having:
- "chapterNum": (from 1 to 10)
- "title": A short, intriguing visual title or scene title (max 5 words).
- "goal": A clear, dramatic target narrative event or objective for that page/beat (max 30 words), specifying how the plot or character relationships develop.

Saga Context:
- GENRE: ${genre || 'Adventure'}
- CUSTOM PREMISE / CORE DRIVER: ${customPremise || '(None)'}
- TONE: ${storyTone || 'Exciting'}

Please draft a cohesive, highly engaging plot arc of 10 pages. Ensure that:
- Chapter 1: Inciting incident that introduces the protagonists and establishes the conflict.
- Chapter 3: Setting up the dramatic decision.
- Chapter 4-8: Escalating complications, rising actions, rising tension, secrets revealed, and stakes raised.
- Chapter 9: The ultimate climax and focal confrontation.
- Chapter 10: The resolution, cliffhanger, or final choice result.

Provide a JSON array containing the 10 finalized chapter-level goals, adhering EXACTLY to this JSON structure:
[
  {
    "chapterNum": 1,
    "title": "A short creative title",
    "goal": "Introduce the protagonist and first confrontation with the main conflict."
  }
]

Ensure the output is valid, solid JSON, and contains ONLY the JSON block, no markdown formatting blocks like \`\`\`json or trailing characters.`;

                const response = await callGeminiSafely({
                safetySettings: applyModeration(req, req.body ? JSON.stringify(req.body) : ""),
                    model: 'gemini-2.5-flash',
                    contents: { text: prompt }
                });
                const responseText = response.text?.trim() || "[]";
                const cleanJson = responseText.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
                try {
                    const parsed = JSON.parse(cleanJson);
                    return res.json({ blueprint: parsed });
                } catch (jsonErr) {
                    console.warn("JSON parse failed for storyBlueprint suggest, returning manual fallback:", responseText);
                    const fallback = Array.from({ length: 10 }, (_, i) => ({
                        chapterNum: i + 1,
                        title: `Beat ${i + 1}`,
                        goal: `Continue the ${genre || 'Custom'} story with escalating drama and character development.`
                    }));
                    return res.json({ blueprint: fallback });
                }
            }

            if (fieldName === 'personaBrainstorm') {
                const prompt = `You are an expert game designer, character designer, and comic book developer.
We need a deep, rich, and highly compelling character concept sheet for a ${roleType || 'Hero'} in a ${genre || 'adventure'} story.
User provided name/clue: "${characterName || ''}"
User provided bio/concept hint: "${concept || ''}"

Provide a JSON object containing the finalized suggestions for this character's persona development, adhering EXACTLY to this JSON structure:
{
  "name": "The finalized name of the character",
  "description": "A compelling 2-3 sentence character bio/description emphasizing personality, core motivations, and role in the narrative.",
  "visuals": "A high-fidelity prompt description of their hair, clothing, physical aesthetics, and distinct items (e.g., 'slick silver-blue hair, a rugged brass-plated duster coat, tactical cargo pants and metallic boots'). Max 25 words.",
  "powers": "A brief description of their core powers, source of energy, or special talents (e.g., 'cellular gravity synthesis, absorbing electromagnetic spectrum energy')",
  "identitySchema": {
    "persistence_layer": {
      "biometric_backbone": "A descriptive phase detailing their core unchanging physical attributes: face shape, details, hair color/style, specific eye shape and color, and age.",
      "structural_constants": "A description of unchanging structural identifiers (e.g., specific distinct scar, face painting patterns, mechanical gears, unique constant jewelry).",
      "chromatic_anchor": "Color ambiance guidelines, shadow contrast characteristics, and highlighting aesthetic for rendering (e.g. cold neon backlight reflections, heavy ink shadows)."
    },
    "adaptive_layer": {
      "sartorial_style": "The general fashion genre or design style (e.g. vintage gothic tactical steampunk, sleek high-society cybernetic cloak).",
      "active_wardrobe": "A high-fidelity detailing of the primary apparel, armor, or vestments worn by this character in the current saga."
    },
    "rendering_directives": {
      "art_style_lock": "A solid, specific stylistic lock statement to align visual styles (e.g., Deep Inkwash Gothic Novel, Neon Noir Comic Art).",
      "continuity_weight": "HIGH"
    }
  }
}

Ensure the output is valid, solid JSON, and contains ONLY the JSON block, no markdown formatting blocks like \`\`\`json or trailing characters.`;

                const response = await callGeminiSafely({
                safetySettings: applyModeration(req, req.body ? JSON.stringify(req.body) : ""),
                    model: 'gemini-2.5-flash',
                    contents: { text: prompt }
                });
                const responseText = response.text?.trim() || "{}";
                const cleanJson = responseText.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
                try {
                    const parsed = JSON.parse(cleanJson);
                    return res.json(parsed);
                } catch (jsonErr) {
                    console.warn("JSON parse failed, returning raw backup text:", responseText);
                    return res.json({
                        name: characterName || "Alpha Champion",
                        description: concept || "A mysterious force of the multiverse.",
                        visuals: "Distinct apparel aligned with the chosen story path.",
                        powers: "Latent reality bending properties."
                    });
                }
            }

            let promptField = `You are a professional comic book writer and creative consultant.
Optimize and improve the text for the field: "${fieldName}" to make it extremely creative, high-fidelity, and fitting for a ${genre || 'Comic Book'} story.

Current Value: "${currentValue || '(none - generate from scratch)'}"

Provide a single, polished, exceptionally creative, and ready-to-use recommendation.
Rules:
1. Return ONLY the finalized suggested text itself. Do not provide any commentary, quotes, explanations, or introductory text.
2. Ensure the tone matches the ${genre || 'Comic book'} genre.
3. For hair/clothing visual designs, use descriptive visual language suitable for an image generator.
4. For plot/story directives, offer a compelling narrative direction.
5. Max 35 words. Keep it concise, focused, and punchy.`;

            const response = await callGeminiSafely({
                safetySettings: applyModeration(req, req.body ? JSON.stringify(req.body) : ""),
                model: 'gemini-2.5-flash',
                contents: { text: promptField }
            });
            const text = response.text?.trim() || "";
            return res.json({ suggestion: text });
        } catch (e: any) {
            console.error("Suggest API failed:", e.message);
            return res.status(500).json({ error: e.message || "Suggestion generation failed" });
        }
    });

    app.post('/api/gemini/enhance-kid-story', async (req, res): Promise<any> => {
        const { rawText, userEmail } = req.body;
        if (!(await consumeTokens(userEmail, calculateTokenCost('gemini-2.5-flash', 500)))) return res.status(402).json({ error: 'Insufficient tokens' });
        if (!rawText) return res.status(400).json({ error: "Missing rawText" });

        try {
            const promptField = `
You are a creative writing coach for children. The user has dictated a story idea using speech-to-text, which might contain grammatical errors, run-on sentences, or disjointed thoughts.

Raw Dictation: "${rawText}"

Your task:
1. Fix grammar and clarify the narrative.
2. Enhance the story to be imaginative and cohesive, but keep it in the voice of a young author.
3. Incentivize the kid by making the story sound epic and structured, showing them how their raw thoughts can turn into a real story!
4. Return ONLY the final enhanced story paragraph, no introductory text, no quotes. Make it a few sentences long (max 50 words).
`;

            const response = await callGeminiSafely({
                safetySettings: applyModeration(req, req.body ? JSON.stringify(req.body) : ""),
                model: 'gemini-2.5-flash',
                contents: { text: promptField }
            });
            const text = response.text?.trim() || "";
            return res.json({ enhancedStory: text });
        } catch (e: any) {
            console.error("Enhance Kid Story API failed:", e.message);
            return res.status(500).json({ error: e.message || "Enhancement failed" });
        }
    });
 
    interface CharacterIdentitySchema {
      actor_id: string;
      archetype_role: 'Hero' | 'Co-Star' | 'Nemesis';
      persistence_layer: {
        biometric_backbone: string;
        structural_constants: string;
        chromatic_anchor: string;
      };
      adaptive_layer: {
        sartorial_style: string;
        active_wardrobe: string;
      };
      rendering_directives: {
        art_style_lock: string;
        continuity_weight: 'LOW' | 'MEDIUM' | 'HIGH';
      };
    }

    function compileSystemPrompt(character: CharacterIdentitySchema, environmentContext: string): string {
      const { persistence_layer, adaptive_layer, rendering_directives } = character;
      
      // Enforce rigid emphasis syntax on biometrics to maintain likeness cohesion
      const weight = rendering_directives.continuity_weight === 'HIGH' ? '1.4' : '1.1';

      return `
    [SYSTEM DIRECTIVE: CORE CHARACTER COHESION CRITICAL]
    You must enforce absolute visual continuity for the character ID: ${character.actor_id}.
    
    1. IMMUTABLE BIOMETRICS:
       - Core Likeness: (${persistence_layer.biometric_backbone}:${weight})
       - Structural Visual Anchors: (${persistence_layer.structural_constants}:${weight})
       - Core Highlights: ${persistence_layer.chromatic_anchor}
    
    2. ADAPTIVE CONTEXT:
       - Base Fashion Style: ${adaptive_layer.sartorial_style}
       - Current Frame Wardrobe: ${adaptive_layer.active_wardrobe}
    
    3. RENDERING ENGINE PARAMS:
       - Esthetic Style: ${rendering_directives.art_style_lock}
       - Environment Synapse Integration: ${environmentContext}
       
    EXECUTION RULE: Do not allow background color bleeds to alter core physical anchors. Face, hair texture, and physical markers must remain identical from frame to frame.
      `.trim();
    }

    app.post('/api/gemini/beat', async (req, res): Promise<any> => {
        if (!(await consumeTokens(req.body.userEmail, calculateTokenCost('gemini-2.5-flash', 2000)))) return res.status(402).json({ error: 'Insufficient tokens' });
        const {
            history = [],
            pageNum,
            isDecisionPage,
            selectedGenre,
            selectedLanguage,
            storyTone,
            customPremise,
            creativeDirectives,
            richMode,
            heroVisuals,
            friendVisuals,
            villainVisuals,
            villainDna = "",
            nemesisDNA,
            soundPrompt = "",
            friendInstruction,
            villainInstruction,
            langName,
            storyBlueprint
        } = req.body;

        const isFinalPage = pageNum === 10; // MAX_STORY_PAGES = 10

        const historyText = history.map((p: any) => 
          `[Page ${p.pageIndex}] [Focus: ${p.narrative?.focus_char}] (Caption: "${p.narrative?.caption || ''}") (Dialogue: "${p.narrative?.dialogue || ''}") (Scene: ${p.narrative?.scene}) ${p.resolvedChoice ? `-> USER CHOICE: "${p.resolvedChoice}"` : ''}`
         ).join('\n');

        // Determine Core Story Driver (Genre vs Custom Premise)
        let coreDriver = `GENRE: ${selectedGenre}. TONE: ${storyTone}.`;
        if (selectedGenre === 'Custom') {
            coreDriver = `STORY PREMISE: ${customPremise || "A totally unique, unpredictable adventure"}. (Follow this premise strictly over standard genre tropes).`;
        }
        if (soundPrompt && soundPrompt.trim()) {
            coreDriver += ` SONIC TONE / AUDITORY WORLD: ${soundPrompt.trim()}.`;
        }
        
        const guardrails = `
        NEGATIVE CONSTRAINTS:
        1. UNLESS GENRE IS "Dark Sci-Fi" OR "Superhero Action" OR "Custom": DO NOT use technical jargon like "Quantum", "Timeline", "Portal", "Multiverse", or "Singularity".
        2. IF GENRE IS "Teen Drama" OR "Lighthearted Comedy": The "stakes" must be SOCIAL, EMOTIONAL, or PERSONAL (e.g., a rumor, a competition, a broken promise, being late, embarrassing oneself). Do NOT make it life-or-death. Keep it grounded.
        3. Avoid "The artifact" or "The device" unless established earlier.
        `;

        const safeLangName = langName || 'English';
        let instruction = `Continue the story. ALL OUTPUT TEXT (Captions, Dialogue, Choices) MUST BE IN ${safeLangName.toUpperCase()}. ${coreDriver} ${guardrails}`;
        if (richMode) {
            instruction += " RICH/NOVEL MODE ENABLED. Prioritize deeper character thoughts, descriptive captions, and meaningful dialogue exchanges over short punchlines.";
        }

        if (creativeDirectives?.trim()) {
            instruction += `\nADDITIONAL MULTIVERSE DIRECTIONS/CONTEXT (USER PROVIDED): ${creativeDirectives}. Weve this specific guidance and context smoothly into this page's plot events and dialogue!`;
        }

        const parsedBlueprint = Array.isArray(storyBlueprint) ? storyBlueprint : [];
        const activeBlueprintNode = parsedBlueprint.find((b: any) => b.chapterNum === pageNum);
        if (activeBlueprintNode && activeBlueprintNode.goal?.trim()) {
            instruction += `\n🎯 CHAPTER ${pageNum} DIRECT GOAL & NARRATIVE GUIDELINE: "${activeBlueprintNode.title ? activeBlueprintNode.title + ' - ' : ''}${activeBlueprintNode.goal}". You MUST focus this page's script, events, dialogue, and caption to fulfill this specific goal seamlessly!`;
        }

        if (isFinalPage) {
            instruction += " FINAL PAGE. KARMIC CLIFFHANGER REQUIRED. You MUST explicitly reference the User's choice from PAGE 3 in the narrative and show how that specific philosophy led to this conclusion. Text must end with 'TO BE CONTINUED...' (or localized equivalent).";
        } else if (isDecisionPage) {
            instruction += " End with a PSYCHOLOGICAL choice about VALUES, RELATIONSHIPS, or RISK. (e.g., Truth vs. Safety, Forgive vs. Avenge). The options must NOT be simple physical actions like 'Go Left'.";
        } else {
            if (pageNum === 1) {
                instruction += " INCITING INCIDENT. An event disrupts the status quo. Establish the genre's intended mood. (If Slice of Life: A social snag/surprise. If Adventure: A call to action).";
            } else if (pageNum <= 4) {
                instruction += " RISING ACTION. The heroes engage with the new situation. Focus on dialogue, character dynamics, and initial challenges.";
            } else if (pageNum <= 8) {
                instruction += " COMPLICATION. A twist occurs! A secret is revealed, a misunderstanding deepens, or the path is blocked. (Keep intensity appropriate to Genre - e.g. Social awkwardness for Comedy, Danger for Horror).";
            } else {
                instruction += " CLIMAX. The confrontation with the main conflict. The truth comes out, the contest ends, or the battle is fought.";
            }
        }

        const capLimit = richMode ? "max 35 words. Detailed narration or internal monologue" : "max 15 words";
        const diaLimit = richMode ? "max 30 words. Rich, character-driven speech" : "max 12 words";

        let characterCohesionDirectives = "";
        try {
            if (nemesisDNA) {
                const parsedDNA = typeof nemesisDNA === 'string' ? JSON.parse(nemesisDNA) : nemesisDNA;
                if (parsedDNA && parsedDNA.persistence_layer) {
                    characterCohesionDirectives = "\n" + compileSystemPrompt(parsedDNA, coreDriver);
                }
            }
        } catch (err) {
            console.warn("Could not parse or compile nemesisDNA in backend:", err);
        }

        const prompt = `
You are writing a comic book script. PAGE ${pageNum} of 10.
TARGET LANGUAGE FOR TEXT: ${langName} (CRITICAL: CAPTIONS, DIALOGUE, CHOICES MUST BE IN THIS LANGUAGE).
${coreDriver}

CHARACTERS (VISUALS & LIKENESSES):
- HERO: Active. (Dressing/Hair style: ${heroVisuals || "Standard costume"})
- CO-STAR: ${friendInstruction} (Dressing/Hair style: ${friendVisuals || "Standard companion outfit"})
- ARC-RIVAL / VILLAIN: ${villainInstruction} (Dressing/Hair style: ${villainVisuals || "Regal adversary suit"}${villainDna ? `. SPECIAL DNA / CORE POWER SOURCE: ${villainDna}` : ""})
${characterCohesionDirectives}

PREVIOUS PANELS (READ CAREFULLY):
${historyText.length > 0 ? historyText : "Start the adventure."}

RULES:
1. NO REPETITION. Do not use the same captions or dialogue from previous pages.
2. IF CO-STAR IS ACTIVE, THEY MUST APPEAR FREQUENTLY.
3. VARIETY. If page ${pageNum-1} was an action shot, make this one a reaction or wide shot.
4. LANGUAGE: All user-facing text MUST be in ${langName}.
5. Avoid saying "CO-star" and "hero" in the text captions. Use names if established, or generic descriptors.

INSTRUCTION: ${instruction}

OUTPUT STRICT JSON ONLY (No markdown formatting):
{
  "caption": "Unique narrator text in ${langName}. (${capLimit}).",
  "dialogue": "Unique speech in ${langName}. (${diaLimit}). Optional.",
  "scene": "Vivid visual description (ALWAYS IN ENGLISH for the artist model). MUST mention 'HERO', 'CO-STAR', or 'ARC-RIVAL'/'VILLAIN' if they are present.",
  "focus_char": "hero" OR "friend" OR "villain" OR "other",
  "choices": ["Option A in ${langName}", "Option B in ${langName}"] (Only if decision page)
}
`;

        try {
            const ai = getAIClient(req.headers['x-gemini-key'] as string);
            const resObj = await callGeminiSafely({
                safetySettings: applyModeration(req, req.body ? JSON.stringify(req.body) : ""),
                model: "gemini-3.5-flash",
                contents: prompt,
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            caption: { type: Type.STRING },
                            dialogue: { type: Type.STRING },
                            scene: { type: Type.STRING },
                            focus_char: { type: Type.STRING },
                            choices: {
                                type: Type.ARRAY,
                                items: { type: Type.STRING }
                            }
                        },
                        required: ["caption", "scene", "focus_char"]
                    }
                }
            });
            let rawText = resObj.text || "{}";
            rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(rawText);
            return res.json(parsed);
        } catch (e: any) {
            console.error("Beat generation api failed:", e.message);
            return res.status(500).json({ error: e.message || "Beat generation failed" });
        }
    });

    app.post('/api/gemini/image', async (req, res): Promise<any> => {
        if (!(await consumeTokens(req.body.userEmail, calculateTokenCost('gemini-2.5-flash-image', 1)))) return res.status(402).json({ error: 'Insufficient tokens' });
        const {
            beat,
            type,
            styleEra,
            heroVisuals,
            friendVisuals,
            villainVisuals,
            selectedGenre,
            selectedLanguage,
            heroRef,
            friendRef,
            villainRef,
            provider
        } = req.body;

        const contents = [];
        if (heroRef?.base64) {
            contents.push({ text: "REFERENCE 1 [HERO PRIMARY AVATAR]:" });
            contents.push({ inlineData: { mimeType: 'image/jpeg', data: heroRef.base64 } });
            if (heroRef.headBase64) {
                contents.push({ text: "HERO HAIR STYLE & HEAD REFERENCE:" });
                contents.push({ inlineData: { mimeType: 'image/jpeg', data: heroRef.headBase64 } });
            }
            if (heroRef.clothesBase64) {
                contents.push({ text: "HERO CLOTHING & APPAREL DESIGN REFERENCE:" });
                contents.push({ inlineData: { mimeType: 'image/jpeg', data: heroRef.clothesBase64 } });
            }
        }
        if (friendRef?.base64) {
            contents.push({ text: "REFERENCE 2 [CO-STAR PRIMARY AVATAR]:" });
            contents.push({ inlineData: { mimeType: 'image/jpeg', data: friendRef.base64 } });
            if (friendRef.headBase64) {
                contents.push({ text: "CO-STAR HAIR STYLE & HEAD REFERENCE:" });
                contents.push({ inlineData: { mimeType: 'image/jpeg', data: friendRef.headBase64 } });
            }
            if (friendRef.clothesBase64) {
                contents.push({ text: "CO-STAR CLOTHING & APPAREL DESIGN REFERENCE:" });
                contents.push({ inlineData: { mimeType: 'image/jpeg', data: friendRef.clothesBase64 } });
            }
        }
        if (villainRef?.base64) {
            contents.push({ text: "REFERENCE 3 [ARC-RIVAL PRIMARY AVATAR]:" });
            contents.push({ inlineData: { mimeType: 'image/jpeg', data: villainRef.base64 } });
            if (villainRef.headBase64) {
                contents.push({ text: "ARC-RIVAL HAIR STYLE & HEAD REFERENCE:" });
                contents.push({ inlineData: { mimeType: 'image/jpeg', data: villainRef.headBase64 } });
            }
            if (villainRef.clothesBase64) {
                contents.push({ text: "ARC-RIVAL CLOTHING & APPAREL DESIGN REFERENCE:" });
                contents.push({ inlineData: { mimeType: 'image/jpeg', data: villainRef.clothesBase64 } });
            }
        }

        let promptText = `STYLE: ${styleEra || selectedGenre} comic book art, detailed ink, vibrant colors. `;
        
        if (heroVisuals?.trim()) {
            promptText += `HERO GUIDELINES (Use Hero references to align likeness, hair/head suggestions and clothing style): ${heroVisuals}. `;
        }
        if (friendVisuals?.trim() && friendRef) {
            promptText += `CO-STAR GUIDELINES (Use Co-star references to align likeness, hair/head suggestions and clothing style): ${friendVisuals}. `;
        }
        if (villainVisuals?.trim() && villainRef) {
            promptText += `VILLAIN GUIDELINES (Use Arc-rival references to align likeness, hair/head suggestions and clothing style): ${villainVisuals}. `;
        }
        
        if (type === 'cover') {
            promptText += `TYPE: Comic Book Cover. TITLE: "INFINITE HEROES" (OR LOCALIZED TRANSLATION IN ${selectedLanguage || 'EN'}). Main visual: Dynamic action shot of [HERO] following the primary avatar, hair suggestion and clothing detail references.`;
            if (villainRef) {
                promptText += ` Looming threateningly in back, we see ARC-RIVAL [VILLAIN] following the primary avatar, hair suggestion and clothing detail references.`;
            }
        } else if (type === 'back_cover') {
            promptText += `TYPE: Comic Back Cover. FULL PAGE VERTICAL ART. Dramatic teaser. Text: "NEXT ISSUE SOON".`;
        } else {
            promptText += `TYPE: Vertical comic panel. SCENE: ${beat?.scene}. `;
            promptText += `INSTRUCTIONS: Maintain strict character likeness. If scene mentions 'HERO', you MUST use the HERO references (Primary, hair/head reference, and clothing reference). If scene mentions 'CO-STAR' or 'SIDEKICK', you MUST use the CO-STAR references (Primary, hair/head reference, and clothing reference). If scene mentions 'ARC-RIVAL' or 'VILLAIN' or 'NEMESIS', you MUST use the ARC-RIVAL references (Primary, hair/head reference, and clothing reference). `;
            
            if (beat?.caption) promptText += ` INCLUDE CAPTION BOX: "${beat.caption}"`;
            if (beat?.dialogue) promptText += ` INCLUDE SPEECH BUBBLE: "${beat.dialogue}"`;
        }

        contents.push({ text: promptText });

        // 1. LLAMAGEN.AI INTEGRATION (Dedicated Comic API)
        if (provider === 'llamagen') {
            console.log("Image generation request routed to LlamaGen.ai Comic API");
            const apiKey = process.env.LLAMAGEN_API_KEY;
            if (!apiKey) {
                console.warn("LLAMAGEN_API_KEY is not defined. Falling back to mock generator.");
                return res.json({ 
                    imageUrl: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=500&q=80",
                    info: "Mocked: LLAMAGEN_API_KEY is required to trigger actual LlamaGen generations." 
                });
            }
            try {
                let llamagenResult: string | null = null;
                try {
                    const comicPkg = require('comic');
                    const generator = new comicPkg.ComicGenerator({ apiKey });
                    const comicResponse = await generator.create({
                        panels: [{ prompt: promptText, characterReference: heroRef?.base64 }],
                        style: styleEra || selectedGenre,
                        resolution: "1024x1024"
                    });
                    llamagenResult = comicResponse.panels?.[0]?.imageUrl || comicResponse.imageUrl;
                } catch (pkgErr) {
                    console.log("Native 'comic' npm package not loaded, calling LlamaGen REST endpoint directly...");
                    const fetchRes = await fetch("https://api.llamagen.ai/v1/comic/generate", {
                        method: "POST",
                        headers: {
                            "Authorization": `Bearer ${apiKey}`,
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            prompt: promptText,
                            style: styleEra || selectedGenre,
                            character_references: heroRef?.base64 ? [heroRef.base64] : []
                        })
                    });
                    if (fetchRes.ok) {
                        const data: any = await fetchRes.json();
                        llamagenResult = data.imageUrl || data.url;
                    } else {
                        throw new Error(`LlamaGen REST failed with status: ${fetchRes.status}`);
                    }
                }

                if (llamagenResult) {
                    return res.json({ imageUrl: llamagenResult });
                }
                throw new Error("LlamaGen returned empty result");
            } catch (err: any) {
                console.error("LlamaGen API error:", err.message);
                return res.status(500).json({ error: `LlamaGen failed: ${err.message}` });
            }
        }

        // 2. STABLE DIFFUSION (ComfyUI Workflow API)
        if (provider === 'comfyui') {
            console.log("Image generation request routed to ComfyUI Workflow Engine");
            const comfyUrl = process.env.COMFYUI_API_URL || "http://127.0.0.1:8188";
            try {
                const comfyPromptPayload = {
                    prompt: {
                        "3": {
                            "class_type": "KSampler",
                            "inputs": {
                                "seed": Math.floor(Math.random() * 1000000),
                                "steps": 20,
                                "cfg": 7,
                                "sampler_name": "euler",
                                "scheduler": "normal",
                                "denoise": 1,
                                "model": ["4", 0],
                                "positive": ["6", 0],
                                "negative": ["7", 0],
                                "latent_image": ["5", 0]
                            }
                        },
                        "4": {
                            "class_type": "CheckpointLoaderSimple",
                            "inputs": {
                                "ckpt_name": "sd_xl_base_1.0.safetensors"
                            }
                        },
                        "5": {
                            "class_type": "EmptyLatentImage",
                            "inputs": {
                                "width": 512,
                                "height": 768,
                                "batch_size": 1
                            }
                        },
                        "6": {
                            "class_type": "CLIPTextEncode",
                            "inputs": {
                                "text": promptText,
                                "clip": ["4", 1]
                            }
                        },
                        "7": {
                            "class_type": "CLIPTextEncode",
                            "inputs": {
                                "text": "blurry, low quality, bad hands, distorted",
                                "clip": ["4", 1]
                            }
                        },
                        "9": {
                            "class_type": "VAEDecode",
                            "inputs": {
                                "samples": ["3", 0],
                                "vae": ["4", 2]
                            }
                        },
                        "10": {
                            "class_type": "SaveImage",
                            "inputs": {
                                "filename_prefix": "story_menu_output",
                                "images": ["9", 0]
                            }
                        }
                    }
                };

                const comfyResponse = await fetch(`${comfyUrl}/prompt`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(comfyPromptPayload)
                });

                if (!comfyResponse.ok) {
                    throw new Error(`ComfyUI connection failed at ${comfyUrl}`);
                }

                const comfyData: any = await comfyResponse.json();
                return res.json({ 
                    imageUrl: "https://images.unsplash.com/photo-1509281373149-e957c6296406?auto=format&fit=crop&w=500&q=80",
                    info: `ComfyUI Queue Accepted. Prompt ID: ${comfyData.prompt_id}`
                });
            } catch (err: any) {
                console.warn("ComfyUI server offline. Error:", err.message);
                return res.status(500).json({ error: `ComfyUI offline: ${err.message}` });
            }
        }

        // 3. LEONARDO.AI INTEGRATION (Character Reference API)
        if (provider === 'leonardo') {
            console.log("Image generation request routed to Leonardo.ai Platform API");
            const apiKey = process.env.LEONARDO_API_KEY;
            if (!apiKey) {
                console.warn("LEONARDO_API_KEY is not defined. Falling back to mock generator.");
                return res.json({ 
                    imageUrl: "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=500&q=80",
                    info: "Mocked: LEONARDO_API_KEY is required to trigger actual Leonardo generations." 
                });
            }
            try {
                const response = await fetch("https://cloud.leonardo.ai/api/rest/v1/generations", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${apiKey}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        prompt: promptText,
                        modelId: "b2449217-0e93-4096-8ac4-a0141e8d0892",
                        width: 512,
                        height: 768,
                        num_images: 1,
                        promptMagic: true,
                        controlnets: heroRef?.base64 ? [
                            {
                                initImageId: heroRef.base64.substring(0, 30),
                                strengthType: "CharacterReference",
                                weight: 0.85
                            }
                        ] : []
                    })
                });

                if (response.ok) {
                    const data: any = await response.json();
                    return res.json({ 
                        imageUrl: data.sdGenerationJob?.generated_images?.[0]?.url || "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=500&q=80",
                        jobId: data.sdGenerationJob?.generationId 
                    });
                }
                throw new Error(`Leonardo API returned code: ${response.status}`);
            } catch (err: any) {
                console.error("Leonardo.ai API error:", err.message);
                return res.status(500).json({ error: `Leonardo failed: ${err.message}` });
            }
        }

        try {
            const ai = getAIClient(req.headers['x-gemini-key'] as string);
            const resObj = await callGeminiSafely({
                safetySettings: applyModeration(req, req.body ? JSON.stringify(req.body) : ""),
              model: 'gemini-2.5-flash-image',
              contents: contents,
              config: { imageConfig: { aspectRatio: '2:3' } }
            });
            const part = resObj.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
            if (part?.inlineData?.data) {
                return res.json({ imageUrl: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}` });
            }
            return res.status(500).json({ error: "Failed to generate comic image" });
        } catch (e: any) {
            console.error("Image generation api failed:", e.message);
            return res.status(500).json({ error: e.message || "Image generation failed" });
        }
    });

    /**
     * 1. CREATE USER / CREATOR PROFILE
     */
    app.post('/api/users', async (req, res): Promise<any> => {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: 'Email parameter is required' });
        }

        const pool = getDbPool();
        if (pool) {
            try {
                // Upsert user based on email
                const result = await pool.query(
                    'INSERT INTO users (email) VALUES ($1) ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email RETURNING *',
                    [email]
                );
                return res.json(result.rows[0]);
            } catch (err: any) {
                console.warn("Database user query soft-fallback:", err.message);
                if (isConnectionError(err)) {
                    markDatabaseOffline();
                }
            }
        }
        
        // Memory Fallback
        let existing = memoryDb.users.find(u => u.email === email);
        if (!existing) {
            existing = {
                id: '00000000-0000-0000-0000-000000000000',
                email,
                created_at: new Date()
            };
            memoryDb.users.push(existing);
        }
        return res.json(existing);
    });

    /**
     * FETCH REGISTERED CREATORS list (for administrative dropdowns)
     */
    app.get('/api/users', async (req, res) => {
        const pool = getDbPool();
        if (pool) {
            try {
                const result = await pool.query('SELECT * FROM users ORDER BY created_at DESC');
                return res.json(result.rows);
            } catch (err: any) {
                console.warn("Database list users query soft-fallback:", err.message);
                if (isConnectionError(err)) {
                    markDatabaseOffline();
                }
            }
        }
        return res.json(memoryDb.users);
    });

    /**
     * FETCH SECURE TOKEN BALANCE
     */
    app.get('/api/user/tokens', async (req, res) => {
        const { email } = req.query;
        if (!email) {
            return res.status(400).json({ error: 'Missing email parameter' });
        }

        try {
            const db = getFirestore();
            const snapshot = await db.collection('users').where('email', '==', email).get();
            if (!snapshot.empty) {
                return res.json({ tokens: snapshot.docs[0].data()?.tokens || 0 });
            }
        } catch (err: any) {
            console.warn("Database get tokens soft-fallback:", err.message);
        }
        
        // Fallback to memory
        const matchUser = memoryDb.users.find(u => u.email === email);
        return res.json({ tokens: matchUser?.tokens || 0 });
    });

    /**
     * 1.1 SUBSCRIPTION CHECKOUT GATEWAY (Stripe & PayPal)
     */
    app.get('/api/checkout/config', async (req, res) => {
        const pubKey = await getSettingValue('stripe_publishable_key');
        res.json({ publishableKey: pubKey });
    });

    app.post('/api/checkout/intent', async (req, res): Promise<any> => {
        const { amountCents } = req.body;
        if (!amountCents) return res.status(400).json({ error: 'Amount is required' });

        const stripeKey = await getSettingValue('stripe_secret_key');

        if (!stripeKey) {
            return res.status(500).json({ error: 'Stripe Gateway is not configured.' });
        }

        try {
            const stripeClient = new Stripe(stripeKey, { apiVersion: '2025-02-24.acacia' });
            const paymentIntent = await stripeClient.paymentIntents.create({
                amount: amountCents,
                currency: 'usd',
                automatic_payment_methods: {
                    enabled: true,
                },
            });

            res.json({ clientSecret: paymentIntent.client_secret });
        } catch (e: any) {
            console.error("Stripe Intent error", e);
            res.status(400).json({ error: e.message });
        }
    });

    app.post('/api/checkout', async (req, res): Promise<any> => {
        const { email, tier, paymentMethod, paypalEmail, type, tokensAwarded } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email coordinate is required for checkout verification' });
        }
        if (!tier) {
            return res.status(400).json({ error: 'Subscription tier choice is required' });
        }
        if (!paymentMethod || !['Stripe', 'PayPal'].includes(paymentMethod)) {
            return res.status(400).json({ error: 'Valid payment method (Stripe or PayPal) is required' });
        }

        console.info(`💳 [Gateway Initiated] New subscription request for "${email}" choosing "${tier}" via ${paymentMethod}`);

        const stripeKey = await getSettingValue('stripe_secret_key');
        const paypalClientId = await getSettingValue('paypal_client_id');
        const paypalSecret = await getSettingValue('paypal_secret');

        const amountCents = type === 'subscription' ? (tier.includes('Publisher') ? 2900 : 1200) : (tokensAwarded * 1);
        let subscriptionId = '';

        if (paymentMethod === 'Stripe') {
            if (stripeKey) {
                try {
                    // For Stripe, the frontend now uses Stripe Elements and confirms the payment intent directly.
                    // The frontend passes the paymentIntentId (which starts with pi_) to the backend after successful confirmation.
                    const paymentIntentId = req.body.paymentIntentId;
                    if (!paymentIntentId) {
                         return res.status(400).json({ error: 'Stripe paymentIntentId is required.' });
                    }
                    
                    const stripeClient = new Stripe(stripeKey, { apiVersion: '2025-02-24.acacia' });
                    const intent = await stripeClient.paymentIntents.retrieve(paymentIntentId);
                    
                    if (intent.status !== 'succeeded') {
                         return res.status(400).json({ error: `Stripe transaction is not successful. Current status: ${intent.status}` });
                    }
                    
                    subscriptionId = intent.id;
                } catch (stripeErr: any) {
                    console.warn(`[Stripe] Error using API: ${stripeErr.message}`);
                    return res.status(400).json({ error: `Stripe transaction validation failed: ${stripeErr.message}` });
                }
            } else {
                return res.status(500).json({ error: 'Stripe transaction failed: Gateway is not configured.' });
            }
        } else if (paymentMethod === 'PayPal') {
            if (paypalClientId && paypalSecret) {
                try {
                    const paypalBaseUrl = process.env.NODE_ENV === 'production' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
                    const auth = Buffer.from(`${paypalClientId}:${paypalSecret}`).toString('base64');
                    const tokenRes = await fetch(`${paypalBaseUrl}/v1/oauth2/token`, {
                        method: 'POST',
                        body: 'grant_type=client_credentials',
                        headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' }
                    });
                    const tokenData = await tokenRes.json();
                    if (!tokenRes.ok) throw new Error(tokenData.error_description || 'Auth failed');
                    
                    const orderRes = await fetch(`${paypalBaseUrl}/v2/checkout/orders`, {
                        method: 'POST',
                        headers: { Authorization: `Bearer ${tokenData.access_token}`, 'Content-Type': 'application/json' },
                        body: JSON.stringify({ intent: 'CAPTURE', purchase_units: [{ amount: { currency_code: 'USD', value: (amountCents / 100).toFixed(2) } }] })
                    });
                    const orderData = await orderRes.json();
                    if (!orderRes.ok) throw new Error(orderData.message || 'Order failed');
                    subscriptionId = orderData.id;
                } catch (paypalErr: any) {
                    console.warn(`[PayPal] Error using API: ${paypalErr.message}`);
                    return res.status(400).json({ error: `PayPal transaction failed: ${paypalErr.message}` });
                }
            } else {
                return res.status(500).json({ error: 'PayPal transaction failed: Gateway is not configured.' });
            }
        } else {
            return res.status(400).json({ error: 'Unsupported payment method.' });
        }

        const pMethodName = paymentMethod;

        // Persist subscription status in pool if connected
        const pool = getDbPool();
        if (pool) {
            try {
                // Check if users has columns: tier, subscription_id, etc.
                // Let's dynamically add those column definitions to PG to keep SQL DB completely synchronized
                await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS tier VARCHAR(100);');
                await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_id VARCHAR(100);');
                await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);');
                await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS tokens INTEGER DEFAULT 0;');

                // Update the user's tier details
                await pool.query(
                    'UPDATE users SET tier = $1, subscription_id = $2, payment_method = $3 WHERE email = $4',
                    [tier, subscriptionId, pMethodName, email]
                );
                
                // Add tokens if awarded
                if (tokensAwarded > 0) {
                    await pool.query(
                        'UPDATE users SET tokens = COALESCE(tokens, 0) + $1 WHERE email = $2',
                        [tokensAwarded, email]
                    );
                }
                
                console.info(`🔥 [Postgres] Synced subscription details for ${email} directly in SQL DB.`);
            } catch (pgErr: any) {
                console.warn("⚠️ Soft-fail on PostgreSQL subscription persist:", pgErr.message);
                if (isConnectionError(pgErr)) {
                    markDatabaseOffline();
                }
            }
        }

        // Parallelize saving in-memory profile representation
        const matchUser = memoryDb.users.find(u => u.email === email);
        if (matchUser) {
            matchUser.tier = tier;
            matchUser.subscriptionId = subscriptionId;
            matchUser.paymentMethod = pMethodName;
            if (tokensAwarded > 0) {
                matchUser.tokens = (matchUser.tokens || 0) + tokensAwarded;
            }
        } else {
            memoryDb.users.push({
                id: '00000000-0000-0000-0000-000000000000',
                email,
                tier,
                subscriptionId,
                paymentMethod: pMethodName,
                created_at: new Date()
            });
        }

        return res.json({
            success: true,
            email,
            tier,
            subscriptionId,
            paymentMethod: pMethodName,
            type: type || 'subscription',
            tokensAwarded: tokensAwarded || 0,
            timestamp: new Date().toISOString(),
            message: `Checkout Successful! Welcome to story.menu's "${tier}" subscription tier.`
        });
    });

    /**
     * 1.2 ADMINISTRATIVE SAAS API ENDPOINTS
     */

    
    const requireAdmin = async (req: any, res: any, next: any) => {
    try {
        const authHeader = req.headers.authorization;
        const fallbackEmail = req.headers['x-admin-email'];
        console.log(`[requireAdmin] Checking auth. authHeader=${!!authHeader}, fallbackEmail=${fallbackEmail}`);
        
        let isCustomAdmin = false;
        let email = '';

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split('Bearer ')[1];

            // 1. Check custom admin session first
            if (isDatabaseConnected()) {
                const pool = getDbPool();
                if (pool) {
                    const sessionCheck = await pool.query('SELECT username FROM admin_sessions WHERE token = $1 AND expires_at > NOW()', [token]);
                    if (sessionCheck.rows.length > 0) {
                        isCustomAdmin = true;
                        email = sessionCheck.rows[0].username;
                        console.log(`[requireAdmin] Custom session matched in DB for user: ${email}`);
                    }
                }
            } else {
                 const session = memoryDb.admin_sessions?.find((s: any) => s.token === token);
                 if (session && new Date(session.expires_at) > new Date()) {
                     isCustomAdmin = true;
                     email = session.username; // For custom admin, email field holds username
                     console.log(`[requireAdmin] Custom session matched in Memory for user: ${email}`);
                 }
            }

            // 2. Fallback to Firebase JWT
            if (!isCustomAdmin) {
                try {
                    const decoded = await getAuth().verifyIdToken(token);
                    email = decoded.email || '';
                    console.log(`[requireAdmin] Firebase JWT verified. email=${email}`);
                } catch (e: any) {
                    console.log(`[requireAdmin] Firebase verify failed: ${e.message}`);
                    if (process.env.NODE_ENV !== 'production' && fallbackEmail) {
                        email = fallbackEmail;
                        console.log(`[requireAdmin] Using fallbackEmail=${email}`);
                    } else {
                        console.log(`[requireAdmin] Rejecting: Invalid token`);
                        return res.status(401).json({ error: 'Unauthorized: Invalid token' });
                    }
                }
            }
        } else {
            console.log(`[requireAdmin] Rejecting: No auth header`);
            return res.status(401).json({ error: 'Unauthorized: No token provided' });
        }

        // 3. Final validation
        if (isCustomAdmin) {
             (req as any).adminEmail = email;
             return next();
        }

        const superAdminEnv = process.env.ADMIN_EMAIL || '';
        const superAdmins = superAdminEnv.split(',').map(e => e.trim().toLowerCase());
        console.log(`[requireAdmin] Comparing email=${email} with superAdmins=[${superAdmins.join(', ')}]`);
        
        if (superAdmins.includes(email.toLowerCase())) {
            (req as any).adminEmail = email;
            return next();
        }

        console.log(`[requireAdmin] Rejecting: Forbidden access`);
        return res.status(403).json({ error: 'Forbidden: Admin access required' });
    } catch (err: any) {
        console.error(`[requireAdmin] Error: ${err.message}`);
        return res.status(500).json({ error: 'Internal Server Error during auth' });
    }
};

    // --- CUSTOM ADMIN AUTH ---
    function hashPassword(password: string, salt: string) {
        return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    }

    app.post('/api/admin/login', async (req, res) => {
        const { username, password } = req.body;
        if (!username || !password) return res.status(400).json({ error: 'Missing username or password' });

        try {
            let userResult;
            if (isDatabaseConnected()) {
                const pool = getDbPool();
                if (pool) {
                    const { rows } = await pool.query('SELECT * FROM admin_users WHERE username = $1', [username]);
                    userResult = rows[0];
                }
            } else {
                userResult = memoryDb.admin_users?.find((u:any) => u.username === username);
            }

            if (!userResult) return res.status(401).json({ error: 'Invalid credentials' });

            const hashedAttempt = hashPassword(password, userResult.salt);
            if (hashedAttempt !== userResult.password_hash) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            const token = crypto.randomBytes(32).toString('hex');
            const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

            if (isDatabaseConnected()) {
                const pool = getDbPool();
                if (pool) {
                    await pool.query('INSERT INTO admin_sessions (token, username, expires_at) VALUES ($1, $2, $3)', [token, username, expiresAt]);
                }
            } else {
                memoryDb.admin_sessions = memoryDb.admin_sessions || [];
                memoryDb.admin_sessions.push({ token, username, expires_at: expiresAt.toISOString() });
            }

            res.json({ token, username });
        } catch (e) {
            console.error(e);
            res.status(500).json({ error: 'Server error' });
        }
    });

    app.get('/api/admin/system/users', requireAdmin, async (req, res) => {
        try {
            if (isDatabaseConnected()) {
                const pool = getDbPool();
                if (pool) {
                    const { rows } = await pool.query('SELECT username, role, created_at FROM admin_users');
                    return res.json(rows);
                }
            } else {
                return res.json((memoryDb.admin_users || []).map((u:any) => ({ username: u.username, role: u.role, created_at: u.created_at })));
            }
            res.json([]);
        } catch(e) {
            res.status(500).json({ error: 'Server error' });
        }
    });

    app.post('/api/admin/system/users', requireAdmin, async (req, res) => {
        const { username, password } = req.body;
        if (!username || !password) return res.status(400).json({ error: 'Missing username or password' });
        
        try {
            const salt = crypto.randomBytes(16).toString('hex');
            const hash = hashPassword(password, salt);
            
            if (isDatabaseConnected()) {
                const pool = getDbPool();
                if (pool) {
                    await pool.query('INSERT INTO admin_users (username, password_hash, salt) VALUES ($1, $2, $3)', [username, hash, salt]);
                }
            } else {
                memoryDb.admin_users = memoryDb.admin_users || [];
                memoryDb.admin_users.push({ username, password_hash: hash, salt, role: 'admin', created_at: new Date().toISOString() });
            }
            res.json({ success: true });
        } catch(e) {
            console.error(e);
            res.status(500).json({ error: 'Server error or user exists' });
        }
    });

    app.delete('/api/admin/system/users/:username', requireAdmin, async (req, res) => {
        const { username } = req.params;
        try {
            if (isDatabaseConnected()) {
                const pool = getDbPool();
                if (pool) {
                    await pool.query('DELETE FROM admin_users WHERE username = $1', [username]);
                }
            } else {
                memoryDb.admin_users = (memoryDb.admin_users || []).filter((u:any) => u.username !== username);
            }
            res.json({ success: true });
        } catch(e) {
            console.error(e);
            res.status(500).json({ error: 'Server error' });
        }
    });

    // --- REQUIRE ADMIN MIDDLEWARE ---


    app.use('/api/admin', requireAdmin);

    // View SaaS Customers and checkout tracking
    
    app.post('/api/admin/customers', async (req, res): Promise<any> => {
        try {
            const { email, tier, firstName, lastName, phone, company, internalNotes } = req.body;
            if (!email) return res.status(400).json({ error: 'Email required' });
            
            const db = getFirestore();
            const newCustomer = {
                email,
                subscriptionTier: tier || 'Free',
                tokens: 0,
                created_at: new Date().toISOString(),
                firstName: firstName || '',
                lastName: lastName || '',
                phone: phone || '',
                company: company || '',
                internalNotes: internalNotes || ''
            };
            
            try {
                await db.collection('users').doc(email).set(newCustomer, { merge: true });
            } catch (err: any) {
                // Fallback to memory
                const existingIdx = memoryDb.users.findIndex((u:any) => u.email === email);
                if (existingIdx >= 0) {
                    memoryDb.users[existingIdx] = { ...memoryDb.users[existingIdx], ...newCustomer };
                } else {
                    memoryDb.users.push(newCustomer);
                }
            }
            
            return res.json({ success: true, customer: newCustomer });
        } catch (error: any) {
            console.error("Admin API Error - Add Customer:", error);
            return res.status(500).json({ error: error.message });
        }
    });
app.get('/api/admin/customers', async (req, res): Promise<any> => {
        const pool = getDbPool();
        if (pool) {
            try {
                // Ensure columns exist first
                await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS tier VARCHAR(100);');
                await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_id VARCHAR(100);');
                await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);');
                
                const result = await pool.query('SELECT id, email, tier, subscription_id as "subscriptionId", payment_method as "paymentMethod", created_at as "createdAt" FROM users ORDER BY created_at DESC');
                return res.json(result.rows);
            } catch (err: any) {
                console.warn("Database admin customers fallback:", err.message);
                if (isConnectionError(err)) {
                    markDatabaseOffline();
                }
            }
        }
        
        // Fallback to memory DB
        const mappedMemory = memoryDb.users.map(u => ({
            id: u.id,
            email: u.email,
            tier: u.tier || null,
            subscriptionId: u.subscriptionId || null,
            paymentMethod: u.paymentMethod || null,
            createdAt: u.created_at || new Date()
        }));
        return res.json(mappedMemory);
    });

    // Update Customer subscription status manually
    app.put('/api/admin/customers/:email', async (req, res): Promise<any> => {
        const { email } = req.params;
        const { tier, subscriptionId, paymentMethod } = req.body;
        
        console.info(`🔧 [Admin Action] Overriding subscription details for ${email} to tier: ${tier}`);

        const pool = getDbPool();
        if (pool) {
            try {
                await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS tier VARCHAR(100);');
                await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_id VARCHAR(100);');
                await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);');

                await pool.query(
                    'UPDATE users SET tier = $1, subscription_id = $2, payment_method = $3 WHERE email = $4',
                    [tier || null, subscriptionId || null, paymentMethod || null, email]
                );
            } catch (err: any) {
                console.warn("Database admin put fallback:", err.message);
                if (isConnectionError(err)) {
                    markDatabaseOffline();
                }
            }
        }

        // Update memory DB
        const matchUser = memoryDb.users.find(u => u.email === email);
        if (matchUser) {
            matchUser.tier = tier || undefined;
            matchUser.subscriptionId = subscriptionId || undefined;
            matchUser.paymentMethod = paymentMethod || undefined;
        } else {
            // Check if user should be created
            memoryDb.users.push({
                id: '00000000-0000-0000-0000-000000000000',
                email,
                tier: tier || undefined,
                subscriptionId: subscriptionId || undefined,
                paymentMethod: paymentMethod || undefined,
                created_at: new Date()
            });
        }

        return res.json({ success: true, message: `Successfully updated user "${email}" in administration records.` });
    });

    // Delete customer profile manually
    app.delete('/api/admin/customers/:email', async (req, res): Promise<any> => {
        const { email } = req.params;
        console.info(`🟥 [Admin Action] Deleting user profile and credentials for ${email}`);
        
        const pool = getDbPool();
        if (pool) {
            try {
                await pool.query('DELETE FROM users WHERE email = $1', [email]);
            } catch (err: any) {
                console.warn("Database admin delete fallback:", err.message);
                if (isConnectionError(err)) {
                    markDatabaseOffline();
                }
            }
        }

                        // Memory delete
        memoryDb.users = memoryDb.users.filter(u => u.email !== email);
        return res.json({ success: true, message: `Successfully deleted user "${email}" from Saas registration.` });
    });

    // Grant or Set Tokens for a specific user (Tier Economies)
    app.post('/api/admin/customers/:email/tokens', async (req, res): Promise<any> => {
        const { email } = req.params;
        const { amount, action } = req.body; // action: 'add', 'set'

        const pool = getDbPool();
        if (!pool) return res.status(500).json({ error: 'DB not connected' });

        try {
            const userRes = await pool.query('SELECT tokens FROM users WHERE email = $1', [email]);
            if (userRes.rows.length === 0) return res.status(404).json({ error: 'User not found' });

            let newBalance = userRes.rows[0].tokens;
            if (action === 'set') {
                newBalance = parseInt(amount);
            } else {
                newBalance += parseInt(amount);
            }

            await pool.query('UPDATE users SET tokens = $1 WHERE email = $2', [newBalance, email]);
            return res.json({ success: true, tokens: newBalance, message: `Successfully updated token balance to ${newBalance}` });
        } catch (e: any) {
            console.error("Token update error:", e);
            return res.status(500).json({ error: 'Database error' });
        }
    });

    // View AI Cost Analytics
    app.get('/api/admin/analytics/costs', async (req, res): Promise<any> => {
        const pool = getDbPool();
        if (!pool) return res.status(500).json({ error: 'DB not connected' });

        try {
            // Aggregate totals
            const totalsRes = await pool.query('SELECT SUM(tokens_in) as total_in, SUM(tokens_out) as total_out, SUM(cost_usd) as total_cost FROM ai_usage_logs');
            const totals = totalsRes.rows[0];

            // Recent logs
            const logsRes = await pool.query('SELECT user_email, operation, model, tokens_in, tokens_out, cost_usd, created_at FROM ai_usage_logs ORDER BY created_at DESC LIMIT 100');

            return res.json({
                totals: {
                    tokensIn: parseInt(totals.total_in || '0'),
                    tokensOut: parseInt(totals.total_out || '0'),
                    totalCostUsd: parseFloat(totals.total_cost || '0')
                },
                logs: logsRes.rows
            });
        } catch (e: any) {
            console.error("Analytics fetch error:", e);
            return res.status(500).json({ error: 'Database error' });
        }
    });

    // --- DIAGNOSTIC ENDPOINT (PUBLIC) ---
    app.get('/api/public/debug-env', (req, res) => {
        return res.json({
            timestamp: new Date().toISOString(),
            adminEmailStatus: process.env.ADMIN_EMAIL ? `Loaded (${process.env.ADMIN_EMAIL.length} chars)` : 'MISSING',
            adminEmailPreview: process.env.ADMIN_EMAIL ? process.env.ADMIN_EMAIL.substring(0, 10) + '...' : '',
            geminiKeyStatus: process.env.GEMINI_API_KEY ? 'Loaded' : 'MISSING',
            stripeKeyStatus: process.env.STRIPE_SECRET_KEY ? 'Loaded' : 'MISSING'
        });
    });

    // --- DYNAMIC LANDING PAGE ---
    app.get('/api/public/landing', async (req, res): Promise<any> => {
        try {
            const db = getFirestore();
            const docSnap = await db.collection('app_settings').doc('landing_page_config').get();
            if (docSnap.exists) {
                return res.json(docSnap.data());
            }
        } catch (e: any) {
            console.warn("Failed to fetch landing_page_config from Firestore:", e.message);
        }
        return res.json({});
    });

    app.post('/api/admin/landing', requireAdmin, async (req, res): Promise<any> => {
        try {
            const db = getFirestore();
            await db.collection('app_settings').doc('landing_page_config').set(req.body, { merge: true });
            return res.json({ success: true });
        } catch (e: any) {
            console.error("Failed to update landing config:", e);
            return res.status(500).json({ error: 'Database error' });
        }
    });

    // --- INTEGRATIONS AND SETTINGS ---
    app.get('/api/admin/settings', async (req, res): Promise<any> => {
        if (!isDatabaseConnected()) {
            return res.json((memoryDb.app_settings || []).map((s:any) => ({ keyName: s.key_name, keyValue: s.key_value, isSecret: s.is_secret })));
        }
        const pool = getDbPool();
        if (!pool) return res.status(500).json({ error: 'DB not connected' });
        try {
            await pool.query(`CREATE TABLE IF NOT EXISTS app_settings (key_name VARCHAR(100) PRIMARY KEY, key_value TEXT NOT NULL, is_secret BOOLEAN DEFAULT false, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
            const result = await pool.query('SELECT key_name as "keyName", key_value as "keyValue", is_secret as "isSecret" FROM app_settings');
            return res.json(result.rows);
        } catch (e: any) {
            return res.status(500).json({ error: e.message });
        }
    });

    app.post('/api/admin/settings', async (req, res): Promise<any> => {
        const { keyName, keyValue, isSecret } = req.body;
        
        // Always persist to process.env and .env for fail-safe sandbox mode
        process.env[keyName.toUpperCase()] = keyValue;
        try {
            const envPath = path.join(process.cwd(), '.env');
            let envContent = '';
            if (fs.existsSync(envPath)) {
                envContent = fs.readFileSync(envPath, 'utf8');
            }
            const lines = envContent.split('\n');
            let found = false;
            const newLines = lines.map(line => {
                if (line.trim().startsWith(keyName.toUpperCase() + '=')) {
                    found = true;
                    return `${keyName.toUpperCase()}=${keyValue}`;
                }
                return line;
            });
            if (!found) {
                newLines.push(`${keyName.toUpperCase()}=${keyValue}`);
            }
            fs.writeFileSync(envPath, newLines.join('\n'));
        } catch (e) {
            console.error("Could not write to .env file", e);
        }

        if (!isDatabaseConnected()) {
            memoryDb.app_settings = memoryDb.app_settings || [];
            const existing = memoryDb.app_settings.find((s:any) => s.key_name === keyName);
            if (existing) {
                existing.key_value = keyValue;
                existing.is_secret = isSecret || false;
            } else {
                memoryDb.app_settings.push({ key_name: keyName, key_value: keyValue, is_secret: isSecret || false });
            }
            return res.json({ success: true });
        }
        const pool = getDbPool();
        if (!pool) return res.status(500).json({ error: 'DB not connected' });
        try {
            await pool.query(`
                INSERT INTO app_settings (key_name, key_value, is_secret) 
                VALUES ($1, $2, $3) 
                ON CONFLICT (key_name) DO UPDATE SET key_value = EXCLUDED.key_value, is_secret = EXCLUDED.is_secret, updated_at = CURRENT_TIMESTAMP
            `, [keyName, keyValue, isSecret || false]);
            return res.json({ success: true });
        } catch (e: any) {
            return res.status(500).json({ error: e.message });
        }
    });

    // --- SUBSCRIPTION PLANS (FIRESTORE) ---
    app.get('/api/public/plans', async (req, res): Promise<any> => {
        try {
            const snapshot = await getFirestore().collection('subscription_plans').get();
            const plans = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            return res.json(plans);
        } catch (e: any) {
            console.error("Failed to load public plans from Firestore", e);
            return res.json([]);
        }
    });

    app.get('/api/admin/plans', async (req, res): Promise<any> => {
        try {
            const snapshot = await getFirestore().collection('subscription_plans').get();
            const plans = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            return res.json(plans);
        } catch (e: any) {
            console.error("Failed to load admin plans from Firestore", e);
            return res.json([]);
        }
    });

    app.post('/api/admin/plans', async (req, res): Promise<any> => {
        try {
            const { name, priceSubscription, priceOneTime, features } = req.body;
            const newPlan = {
                name,
                priceSubscription: Number(priceSubscription) || 0,
                priceOneTime: Number(priceOneTime) || 0,
                features: features || [],
                createdAt: FieldValue.serverTimestamp()
            };
            const docRef = await getFirestore().collection('subscription_plans').add(newPlan);
            return res.json({ success: true, id: docRef.id });
        } catch (e: any) {
            return res.status(500).json({ error: e.message });
        }
    });
    
    app.delete('/api/admin/plans/:id', async (req, res): Promise<any> => {
        try {
            await getFirestore().collection('subscription_plans').doc(req.params.id).delete();
            return res.json({ success: true });
        } catch (e: any) {
            return res.status(500).json({ error: e.message });
        }
    });

    app.get('/api/admin/categories', async (req, res): Promise<any> => {
        const pool = getDbPool();
        if (pool) {
            try {
                const result = await pool.query(`SELECT * FROM content_categories ORDER BY created_at DESC`);
                return res.json(result.rows);
            } catch(e) { }
        }
        return res.json([
            { id: '1', category_type: 'Genre', name: 'Sci-Fi Cyberpunk' },
            { id: '2', category_type: 'Style', name: 'Cell-Shaded Anime' }
        ]);
    });

    app.post('/api/admin/categories', async (req, res): Promise<any> => {
        const { name, category_type } = req.body;
        const pool = getDbPool();
        if (pool) {
            try {
                await pool.query(`INSERT INTO content_categories (name, category_type) VALUES ($1, $2)`, [name, category_type]);
            } catch(e) { }
        }
        return res.json({ success: true });
    });

    
    app.put('/api/admin/categories/:id', async (req, res): Promise<any> => {
        try {
            const id = req.params.id;
            const updates = req.body;
            const db = getFirestore();
            try {
                await db.collection('categories').doc(id).update(updates);
            } catch (err: any) {
                const idx = memoryDb.categories.findIndex((c:any) => c.id === id);
                if (idx >= 0) {
                    memoryDb.categories[idx] = { ...memoryDb.categories[idx], ...updates };
                }
            }
            return res.json({ success: true });
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    });

    app.post('/api/admin/categories/suggest', async (req, res): Promise<any> => {
        try {
            const { currentCategories } = req.body;
            const ai = getAIClient();
            const model = ai.models.get({ model: "gemini-2.5-flash" });
            const prompt = `Analyze these current categories and suggest 5 new relevant tags or genres to expand the catalog. Return ONLY a JSON array of strings. Current: ${JSON.stringify(currentCategories)}`;
            const response = await model.generateContent(prompt);
            let text = response.text || "[]";
            text = text.replace(/```json/g, '').replace(/```/g, '').trim();
            const suggestions = JSON.parse(text);
            return res.json({ suggestions });
        } catch (error: any) {
            return res.status(500).json({ error: error.message, suggestions: [] });
        }
    });
app.delete('/api/admin/categories/:id', async (req, res): Promise<any> => {
        const pool = getDbPool();
        if (pool) {
            try {
                await pool.query(`DELETE FROM content_categories WHERE id = $1`, [req.params.id]);
            } catch(e) { }
        }
        return res.json({ success: true });
    });

    app.get('/api/admin/moderation', async (req, res): Promise<any> => {
        const pool = getDbPool();
        if (pool) {
            try {
                const result = await pool.query(`SELECT * FROM moderation_flags WHERE status = 'pending' ORDER BY created_at DESC`);
                return res.json(result.rows);
            } catch(e) { }
        }
        return res.json([
            { id: 'flag-1', severity: 'high', reason: 'Automated NSFW detection triggered on image.', target_id: 'proj-123', target_type: 'published_work' }
        ]);
    });

    app.post('/api/admin/moderation/:id/resolve', async (req, res): Promise<any> => {
        const { action } = req.body; // 'safe' or 'remove'
        const status = action === 'safe' ? 'resolved_safe' : 'resolved_removed';
        const pool = getDbPool();
        if (pool) {
            try {
                await pool.query(`UPDATE moderation_flags SET status = $1 WHERE id = $2`, [status, req.params.id]);
            } catch(e) { }
        }
        return res.json({ success: true });
    });

    // SaaS Analytics stats
    app.get('/api/admin/health', async (req, res): Promise<any> => {
        const start = Date.now();
        const health: any = {
            status: 'ok',
            database: { status: 'offline', message: 'Sandbox Mode' },
            storage: { status: 'unknown' },
            integrations: {
                gemini: { status: 'missing', message: 'API Key not configured in .env' },
                stripe: { status: 'missing', message: 'Not configured' },
                paypal: { status: 'missing', message: 'Not configured' }
            },
            environment: {
                port: port,
                nodeEnv: process.env.NODE_ENV || 'development',
                memoryUsage: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB'
            }
        };

        const pool = getDbPool();
        if (pool) {
            try {
                const client = await pool.connect();
                await client.query('SELECT 1');
                client.release();
                health.database = { status: 'ok', message: 'Connected to PostgreSQL' };
            } catch (e: any) {
                health.database = { status: 'error', message: e.message };
                health.status = 'warning';
            }
        } else {
            health.status = 'warning';
        }

        if (process.env.GEMINI_API_KEY || process.env.API_KEY) health.integrations.gemini = { status: 'ok', message: 'Configured in .env' };
        if (process.env.STRIPE_SECRET_KEY) health.integrations.stripe = { status: 'ok', message: 'Configured in .env' };
        if (process.env.PAYPAL_CLIENT_ID) health.integrations.paypal = { status: 'ok', message: 'Configured in .env' };

        if (pool && health.database.status === 'ok') {
            try {
               const settingsRes = await pool.query("SELECT key_name, key_value FROM app_settings WHERE key_name IN ('stripe_secret_key', 'paypal_client_id', 'gemini_api_key')");
               settingsRes.rows.forEach(r => {
                   if (r.key_value && r.key_value.trim() !== '') {
                       const key = r.key_name.replace('_secret_key', '').replace('_client_id', '').replace('_access_token', '').replace('_api_key', '');
                       if (health.integrations[key]) {
                           health.integrations[key] = { status: 'ok', message: 'Configured in DB' };
                       }
                   }
               });
            } catch(e) {}
        } else if (!isDatabaseConnected() && memoryDb.app_settings) {
            memoryDb.app_settings.forEach((s:any) => {
                if (s.key_value && s.key_value.trim() !== '') {
                    const key = s.key_name.replace('_secret_key', '').replace('_client_id', '').replace('_access_token', '').replace('_api_key', '');
                    if (health.integrations[key]) {
                        health.integrations[key] = { status: 'ok', message: 'Configured in MemoryDb' };
                    }
                }
            });
        }

        try {
            const geminiKey = await getSettingValue('gemini_api_key');
            if (geminiKey) {
                const ai = new GoogleGenAI({ apiKey: geminiKey });
                await ai.models.generateContent({ model: 'gemini-flash-latest', contents: 'test' });
                health.integrations.gemini = { status: 'ok', message: 'API connection successful' };
            }
        } catch (e: any) {
            health.integrations.gemini = { status: 'error', message: `Gemini API Error: ${e.message}` };
            health.status = 'warning';
        }

        try {
            const stripeSecret = await getSettingValue('stripe_secret_key');
            if (stripeSecret) {
                const stripe = new Stripe(stripeSecret, { apiVersion: '2024-06-20' as any });
                await stripe.balance.retrieve();
                health.integrations.stripe = { status: 'ok', message: 'API connection successful' };
            }
        } catch (e: any) {
            health.integrations.stripe = { status: 'error', message: `Stripe API Error: ${e.message}` };
            health.status = 'warning';
        }

        try {
            const fs = await import('fs/promises');
            const path = await import('path');
            const testFile = path.join(process.cwd(), 'health_check.tmp');
            await fs.writeFile(testFile, 'ok');
            await fs.unlink(testFile);
            health.storage = { status: 'ok', message: 'Read/Write access verified' };
        } catch (e: any) {
            health.storage = { status: 'error', message: e.message };
            health.status = 'error';
        }

        health.uptime = Math.round(process.uptime()) + 's';
        health.responseTimeMs = Date.now() - start;

        res.json(health);
    });

    app.get('/api/admin/stats', async (req, res): Promise<any> => {
        let customersList: any[] = [];
        const pool = getDbPool();
        
        if (pool) {
            try {
                await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS tier VARCHAR(100);');
                await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_id VARCHAR(100);');
                await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);');
                
                const result = await pool.query('SELECT id, email, tier, subscription_id, payment_method FROM users');
                customersList = result.rows.map(r => ({
                    email: r.email,
                    tier: r.tier,
                    paymentMethod: r.payment_method
                }));
            } catch (err: any) {
                console.warn("Database admin stats fallback:", err.message);
                if (isConnectionError(err)) {
                    markDatabaseOffline();
                }
            }
        }
        
        if (customersList.length === 0) {
            customersList = memoryDb.users.map(u => ({
                email: u.email,
                tier: u.tier,
                paymentMethod: u.paymentMethod
            }));
        }

        const stats = {
            totalUsers: customersList.length,
            proUsers: customersList.filter(u => u.tier && u.tier.includes('Pro')).length,
            enterpriseUsers: customersList.filter(u => u.tier && u.tier.includes('Enterprise')).length,
            freeUsers: customersList.filter(u => !u.tier || (!u.tier.includes('Pro') && !u.tier.includes('Enterprise'))).length,
            mrrEstimate: 0,
            stripePayments: customersList.filter(u => u.paymentMethod === 'Stripe').length,
            paypalPayments: customersList.filter(u => u.paymentMethod === 'PayPal').length,
            manualPayments: customersList.filter(u => u.paymentMethod === 'Manual Admin').length,
        };

        stats.mrrEstimate = (stats.proUsers * 19) + (stats.enterpriseUsers * 79);

        return res.json(stats);
    });

    /**
     * 2. SEARCH & LIST CHARACTER VAULT
     */
    app.get('/api/characters', async (req, res) => {
        const { userId } = req.query;
        const pool = getDbPool();

        if (pool) {
            try {
                let query = 'SELECT * FROM character_vault';
                const params: any[] = [];
                if (userId && isValidUuid(String(userId))) {
                    query += ' WHERE user_id = $1';
                    params.push(userId);
                }
                query += ' ORDER BY created_at DESC';
                const result = await pool.query(query, params);
                return res.json(result.rows);
            } catch (err: any) {
                console.warn("Database list characters query soft-fallback:", err.message);
                if (isConnectionError(err)) {
                    markDatabaseOffline();
                }
            }
        }
        
        let filtered = memoryDb.character_vault;
        if (userId) {
            filtered = memoryDb.character_vault.filter(c => c.user_id === userId);
        }
        return res.json(filtered);
    });

    /**
     * ADD CHARACTER TO COHERENT VAULT
     */
    app.post('/api/characters', async (req, res): Promise<any> => {
        const { userId, name, roleType, description, imageUrl, spatialVectors } = req.body;
        if (!userId || !name || !roleType) {
            return res.status(400).json({ error: 'userId, name, and roleType are required fields' });
        }

        const pool = getDbPool();
        if (pool) {
            try {
                if (isValidUuid(userId)) {
                    await ensureUserExists(pool, userId);
                }
                const result = await pool.query(
                    `INSERT INTO character_vault (user_id, character_name, role_type, description, image_url, spatial_vectors)
                     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
                    [userId, name, roleType, description, imageUrl, spatialVectors ? JSON.stringify(spatialVectors) : null]
                );
                return res.json(result.rows[0]);
            } catch (err: any) {
                console.warn("Database add character query soft-fallback:", err.message);
                if (isConnectionError(err)) {
                    markDatabaseOffline();
                }
            }
        }
        
        const newItem = {
            id: crypto.randomUUID(),
            user_id: userId,
            character_name: name,
            role_type: roleType,
            description,
            image_url: imageUrl,
            spatial_vectors: spatialVectors || null,
            created_at: new Date()
        };
        memoryDb.character_vault.push(newItem);
        return res.json(newItem);
    });

    /**
     * DELETE Vault character
     */
    app.delete('/api/characters/:id', async (req, res): Promise<any> => {
        const { id } = req.params;
        const pool = getDbPool();

        if (pool) {
            try {
                await pool.query('DELETE FROM character_vault WHERE id = $1', [id]);
                return res.json({ success: true });
            } catch (err: any) {
                console.warn("Database delete character query soft-fallback:", err.message);
                if (isConnectionError(err)) {
                    markDatabaseOffline();
                }
            }
        }
        
        const index = memoryDb.character_vault.findIndex(c => c.id === id);
        if (index !== -1) {
            memoryDb.character_vault.splice(index, 1);
        }
        return res.json({ success: true });
    });

    /**
     * 3. PROJECTS STORES / HISTORY
     */
    app.post('/api/projects', async (req, res): Promise<any> => {
        const { userId, title, genre, language, comicFaces } = req.body;
        if (!userId || !title || !genre || !language) {
            return res.status(400).json({ error: 'userId, title, genre, and language are required fields' });
        }

        const facesStr = comicFaces ? (typeof comicFaces === 'string' ? comicFaces : JSON.stringify(comicFaces)) : null;

        const pool = getDbPool();
        if (pool) {
            try {
                if (isValidUuid(userId)) {
                    await ensureUserExists(pool, userId);
                }
                const result = await pool.query(
                    'INSERT INTO projects (user_id, title, genre, language, current_page, comic_faces) VALUES ($1, $2, $3, $4, 1, $5) RETURNING *',
                    [userId, title, genre, language, facesStr]
                );
                return res.json(result.rows[0]);
            } catch (err: any) {
                console.warn("Database add project query soft-fallback:", err.message);
                if (isConnectionError(err)) {
                    markDatabaseOffline();
                }
            }
        }
        
        const newProject = {
            id: crypto.randomUUID(),
            user_id: userId,
            title,
            genre,
            language,
            current_page: 1,
            comic_faces: facesStr,
            created_at: new Date()
        };
        memoryDb.projects.push(newProject);
        return res.json(newProject);
    });

    app.put('/api/projects/:id', async (req, res): Promise<any> => {
        const { id } = req.params;
        const { title, comicFaces, currentPage } = req.body;
        
        const facesStr = comicFaces ? (typeof comicFaces === 'string' ? comicFaces : JSON.stringify(comicFaces)) : null;

        const pool = getDbPool();
        if (pool) {
            try {
                let query = 'UPDATE projects SET ';
                const params: any[] = [];
                let paramIndex = 1;
                const setClauses: string[] = [];

                if (title !== undefined) {
                    setClauses.push(`title = $${paramIndex++}`);
                    params.push(title);
                }
                if (facesStr !== undefined) {
                    setClauses.push(`comic_faces = $${paramIndex++}`);
                    params.push(facesStr);
                }
                if (currentPage !== undefined) {
                    setClauses.push(`current_page = $${paramIndex++}`);
                    params.push(currentPage);
                }

                if (setClauses.length > 0) {
                    query += setClauses.join(', ') + ` WHERE id = $${paramIndex} RETURNING *`;
                    params.push(id);
                    const result = await pool.query(query, params);
                    if (result.rowCount > 0) {
                        return res.json(result.rows[0]);
                    }
                }
            } catch (err: any) {
                console.warn("Database update project query soft-fallback:", err.message);
                if (isConnectionError(err)) {
                    markDatabaseOffline();
                }
            }
        }

        const project = memoryDb.projects.find(p => p.id === id);
        if (project) {
            if (title !== undefined) project.title = title;
            if (facesStr !== undefined) project.comic_faces = facesStr;
            if (currentPage !== undefined) project.current_page = currentPage;
            return res.json(project);
        }
        return res.status(404).json({ error: 'Project not found' });
    });

    app.delete('/api/projects/:id', async (req, res): Promise<any> => {
        const { id } = req.params;
        const pool = getDbPool();
        if (pool) {
            try {
                await pool.query('DELETE FROM projects WHERE id = $1', [id]);
                return res.json({ success: true });
            } catch (err: any) {
                console.warn("Database delete project query soft-fallback:", err.message);
                if (isConnectionError(err)) {
                    markDatabaseOffline();
                }
            }
        }

        const index = memoryDb.projects.findIndex(p => p.id === id);
        if (index !== -1) {
            memoryDb.projects.splice(index, 1);
        }
        return res.json({ success: true });
    });

    app.get('/api/projects', async (req, res) => {
        const { userId } = req.query;
        const pool = getDbPool();

        if (pool) {
            try {
                let query = 'SELECT * FROM projects';
                const params: any[] = [];
                if (userId && isValidUuid(String(userId))) {
                    query += ' WHERE user_id = $1';
                    params.push(userId);
                }
                query += ' ORDER BY created_at DESC';
                const result = await pool.query(query, params);
                return res.json(result.rows);
            } catch (err: any) {
                console.warn("Database list projects query soft-fallback:", err.message);
                if (isConnectionError(err)) {
                    markDatabaseOffline();
                }
            }
        }
        
        let filtered = memoryDb.projects;
        if (userId) {
            filtered = memoryDb.projects.filter(p => p.user_id === userId);
        }
        return res.json(filtered);
    });

    /**
     * 4. PROJECT CASTING RELATIONS
     */
    app.post('/api/project-casting', async (req, res): Promise<any> => {
        const { projectId, characterId } = req.body;
        if (!projectId || !characterId) {
            return res.status(400).json({ error: 'projectId and characterId are required' });
        }

        const pool = getDbPool();
        if (pool) {
            try {
                await pool.query(
                    'INSERT INTO project_casting (project_id, character_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                    [projectId, characterId]
                );
                return res.json({ success: true });
            } catch (err: any) {
                console.warn("Database add project casting query soft-fallback:", err.message);
                if (isConnectionError(err)) {
                    markDatabaseOffline();
                }
            }
        }
        
        memoryDb.project_casting.push({ project_id: projectId, character_id: characterId });
        return res.json({ success: true });
    });

    // PAYMENT GATEWAY INTEGRATIONS

    app.post('/api/payments/stripe/create-checkout', async (req, res) => {
        try {
            const secretKey = await getSettingValue('stripe_secret_key');
            if (!secretKey) return res.status(400).json({ error: 'Stripe is not configured' });
            
            const stripe = new Stripe(secretKey, { apiVersion: '2025-02-24.acacia' });
            const { tier, price } = req.body;
            
            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: [{
                    price_data: { currency: 'usd', product_data: { name: `${tier} Subscription` }, unit_amount: Math.round(price * 100) },
                    quantity: 1,
                }],
                mode: 'payment',
                success_url: `${req.headers.origin}?payment=success`,
                cancel_url: `${req.headers.origin}?payment=cancelled`,
            });
            res.json({ url: session.url });
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    });

    app.post('/api/payments/paypal/create-order', async (req, res) => {
        try {
            const clientId = await getSettingValue('paypal_client_id');
            const secret = await getSettingValue('paypal_secret');
            if (!clientId || !secret) return res.status(400).json({ error: 'PayPal is not configured' });
            
            const auth = Buffer.from(`${clientId}:${secret}`).toString('base64');
            const authRes = await fetch('https://api-m.sandbox.paypal.com/v1/oauth2/token', {
                method: 'POST',
                body: 'grant_type=client_credentials',
                headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' }
            });
            const authData = await authRes.json();
            if (!authData.access_token) throw new Error('Failed to authenticate with PayPal');

            const { price } = req.body;
            const orderRes = await fetch('https://api-m.sandbox.paypal.com/v2/checkout/orders', {
                method: 'POST',
                headers: { Authorization: `Bearer ${authData.access_token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    intent: 'CAPTURE',
                    purchase_units: [{ amount: { currency_code: 'USD', value: price.toString() } }]
                })
            });
            const orderData = await orderRes.json();
            res.json(orderData);
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    });




    // Setup Vite middleware / client delivery
    if (!isProductionMode) {
        console.info("🛠️ [Setup] Server starting in DEVELOPMENT Mode. Initializing Vite dev server middleware...");
        try {
            const viteModule = await Function('return import("vite")')();
            const { createServer: createViteServer } = viteModule;
            const vite = await createViteServer({
                server: { middlewareMode: true },
                appType: 'spa'
            });
            app.use(vite.middlewares);
        } catch (viteImportErr: any) {
            console.error("🚨 Failed to dynamically load Vite in dev mode:", viteImportErr.message || viteImportErr);
            console.info("🩹 Fallback Action: Attuning to production-grade asset delivery to prevent startup crash.");
            let distPath = path.join(process.cwd(), 'dist');
            if (!fs.existsSync(path.join(distPath, 'index.html')) && fs.existsSync(path.join(_dirname, 'index.html'))) {
                distPath = _dirname;
            }
            if (fs.existsSync(path.join(distPath, 'index.html'))) {
                console.info(`📂 Serving static files from verified directory: "${distPath}"`);
                app.use(express.static(distPath));
                app.use((req, res) => {
                    res.sendFile(path.join(distPath, 'index.html'));
                });
            } else {
                console.error("🚨 Fallback failed: 'dist/index.html' not found under either directory path.");
                throw viteImportErr;
            }
        }
    } else {
        console.info("🌐 [Setup] Server starting in PRODUCTION Mode. Serving compiled static assets...");
        let distPath = path.join(process.cwd(), 'dist');
        
        // Dynamic fallback matching compile location inside 'dist' folder
        if (!fs.existsSync(path.join(distPath, 'index.html'))) {
            if (fs.existsSync(path.join(_dirname, 'index.html'))) {
                distPath = _dirname;
            }
        }

        if (fs.existsSync(path.join(distPath, 'index.html'))) {
            console.info(`📂 Serving static files from verified directory: "${distPath}"`);
            app.use(express.static(distPath));
            app.use((req, res) => {
                res.sendFile(path.join(distPath, 'index.html'));
            });
        } else {
            console.error(`🚨 CRITICAL ERROR: 'dist/index.html' not found under root "${process.cwd()}" or location "${_dirname}". Starting a safe fallback response to ensure health checks pass.`);
            app.use((req, res) => {
                res.status(500).send(`
                    <html>
                        <head>
                            <title>Configuration or Deployment Error</title>
                            <style>body { font-family: sans-serif; padding: 40px; background: #0f172a; color: #f8fafc; line-height: 1.6; max-width: 600px; margin: 0 auto; }</style>
                        </head>
                        <body>
                            <h2>🚨 Build / Deployment Configuration Notice</h2>
                            <p>Express server is active and listening on port ${port}, but compiled frontend files are missing.</p>
                            <p><strong>Diagnosis:</strong> The 'dist' front-end directory or 'dist/index.html' was not found.</p>
                            <p><strong>Solution:</strong> Ensure that <code>npm run build</code> runs as part of your deployment build phase so the Vite client is compiled.</p>
                        </body>
                    </html>
                `);
            });
        }
    }

    // Start listening on port only when all API endpoints and static assets are fully configured

    try {

        const serverInstance = app.listen(port, "0.0.0.0", () => {

            console.log(`🌐 Resilient Express Server listening on http://0.0.0.0:${port} (Vite port context: ${process.env.PORT || 'none (default 3001)'})`);
        });

        serverInstance.on('error', (err: any) => {
            console.error("🚨 Resilient Server binding error event:", err);
            if (err.code === 'EADDRINUSE') {
                console.error(`💡 HINT: Host port ${port} is already in use by another active process. Check system metrics.`);
            }
        });
    } catch (listenError: any) {
        console.error("🚨 CRITICAL: Synchronous error during app.listen():", listenError.message || listenError);
        process.exit(1);
    }

}

startServer(app).catch((err) => {
    console.error("🚨 CRITICAL ERROR DURING startServer():", err);
    process.exit(1);
});
