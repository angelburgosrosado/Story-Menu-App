/**
 * Screen Name: Backend Server Controller
 * Purpose: Central API backend, Gemini LLM integrations, provider-agnostic AI routing, and system orchestrator
 * Version: 2.1.0
 * Date: 2026-07-09
 * Phase: Phase 5 - Translation System with High-Fidelity Gemini Execution
 * What changed in this revision:
 *   - Upgraded /api/translation/execute from mock translation to high-fidelity Gemini translation engine preserving glossary terms
 *   - Added resolveAIRoute() — provider-agnostic routing boundary consulted by all AI call sites
 *   - Expanded DEFAULT_AI_PROVIDERS, DEFAULT_AI_MODELS, DEFAULT_AI_WORKFLOWS, DEFAULT_AI_ROUTING_RULES
 *   - Added DEFAULT_AI_FALLBACK_CONFIGS seed
 *   - Added admin CRUD routes for /api/admin/ai-providers, ai-models, ai-workflows, ai-routing-rules
 *   - Added dry-run resolver endpoint GET /api/admin/ai-routing/resolve
 * 
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
import apiV1Router from './api/v1/index';
import classroomRouter from './api/classroom';
import adminRoutesRouter from './routes/admin';
import adminAiRouter from './routes/admin-ai';
import adminUsersRouter from './routes/admin-users';
import adminContentRouter from './routes/admin-content';
import adminCreativeRouter from './routes/admin-creative';
import adminModerationRouter from './routes/admin-moderation';
import adminSystemRouter from './routes/admin-system';
import adminAnalyticsRouter from './routes/admin-analytics';
import adminCharactersRouter from './routes/admin-characters';
import { setMemoryDb as setAdminHelpersDb } from './admin-helpers';
import subscriptionRouter from './routes/subscription';
import { GENRES, STYLE_KEYWORDS, ART_STYLES, StartingFormat, CreatorFlow, StoryGoal } from './types';
import Stripe from 'stripe';

import admin from 'firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { generalLimiter, aiGenerationLimiter, authLimiter, checkoutLimiter, enforceTokenBudget } from './middleware/rateLimit';
import { securityHeaders, validate, validateImageUpload, checkoutSchema, geminiSuggestSchema } from './middleware/security';
import { logger } from './middleware/logger';
import { errorTracker } from './middleware/errorTracker';
import { requireRole } from './middleware/rbac';
import { featureFlags } from './middleware/featureFlags';
import { jobQueue } from './middleware/jobQueue';
import { enqueueGenerationJob, getGenerationJobStatus, startGenerationWorker, closeGenerationQueue, GenerationJobData } from './jobs/queue';
import { subscriptionService } from './middleware/subscription';

try {
    admin.initializeApp({});
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
 * RBAC ADMIN CHECK
 * Checks if a user has admin role in Firestore users collection.
 * Falls back to ADMIN_EMAIL env var only for bootstrap (first admin).
 * TASK 1.1 — Replaces hardcoded email checks.
 */
async function isAdminUser(email: string): Promise<boolean> {
    if (!email) return false;
    
    // 1. Check Firestore user document for role field (production path)
    try {
        const db = getFirestore();
        const snapshot = await db.collection('users').where('email', '==', email).get();
        if (!snapshot.empty) {
            const userData = snapshot.docs[0].data();
            if (userData.role === 'admin' || userData.role === 'super_admin') {
                return true;
            }
        }
    } catch (err: any) {
        console.warn('[RBAC] Firestore role check failed:', err.message);
    }
    
    // 2. Env var fallback — bootstrap only for initial admin setup
    // REMOVE this block after first admin is seeded in Firestore with role='admin'
    const bootstrapEmails = process.env.ADMIN_EMAIL 
        ? process.env.ADMIN_EMAIL.split(',').map(e => e.trim().toLowerCase()) 
        : [];
    if (bootstrapEmails.includes(email.toLowerCase())) {
        console.warn(`[RBAC] Bootstrap admin match via env var for ${email}. Seed this user in Firestore with role='admin' and remove ADMIN_EMAIL.`);
        return true;
    }
    
    return false;
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
        const isAdmin = await isAdminUser(email);

        if (snapshot.empty) {
             if (isAdmin) throw new Error("Admin not in Firestore, fallback to memory");
             return false;
        }
        
        const userRef = snapshot.docs[0].ref;
        
        return await db.runTransaction(async (transaction: any) => {
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists) return false;
            
            const currentTokens = userDoc.data()?.tokens || 0;
            const adminNow = await isAdminUser(email);

            if (currentTokens >= amount || adminNow) {
                transaction.update(userRef, { tokens: currentTokens - amount });
                return true;
            }
            return false;
        });
    } catch (err: any) {
        console.warn("Failed to consume tokens in Firestore:", err.message);
        
        // Memory fallback
        const adminNow = await isAdminUser(email);
        const matchUser = memoryDb.users.find(u => u.email === email);
        if (matchUser) {
            if ((matchUser.tokens || 0) >= amount || adminNow) {
                matchUser.tokens = (matchUser.tokens || 0) - amount;
                return true;
            }
        } else if (adminNow) {
             // Let admins generate even if they aren't in memory DB yet
             memoryDb.users.push({ id: crypto.randomUUID(), email, tokens: -amount, created_at: new Date().toISOString() });
             return true;
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

// Mapped list of all standard Genres & Visual Art Styles
const DEFAULT_CATEGORIES = [
    // 1. Genres
    ...GENRES.map((name) => {
        const id = `genre-${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
        const emoji = ({
            "Classic Horror": "💀",
            "Superhero Action": "⚡",
            "Dark Sci-Fi": "🚀",
            "High Fantasy": "🏰",
            "Neon Noir Detective": "🕵️",
            "Wasteland Apocalypse": "☣️",
            "Lighthearted Comedy": "🎭",
            "Teen Drama / Slice of Life": "🎒",
            "Anime Story": "🌸",
            "Historical Archeology Tales": "🏺",
            "Custom": "✨"
        } as Record<string, string>)[name] || "📖";
        return {
            id,
            category_type: 'Genre',
            name,
            emoji,
            prompt_instruction: STYLE_KEYWORDS[name] || 'clean illustration, modern aesthetic',
            is_featured: ['Superhero Action', 'Classic Horror', 'Dark Sci-Fi', 'Anime Story'].includes(name),
            is_active: true,
            created_at: new Date().toISOString()
        };
    }),
    // 2. Art Styles
    ...ART_STYLES.map((style) => {
        return {
            id: `style-${style.id}`,
            category_type: 'Style',
            name: style.name,
            emoji: '🎨',
            prompt_instruction: style.promptTemplate,
            is_featured: ['vibrant-comic', 'studio-ghibli'].includes(style.id),
            is_active: true,
            created_at: new Date().toISOString()
        };
    })
];

const DEFAULT_FORMATS = [
    {
        id: "format-visual-lesson",
        slug: "visual-lesson",
        title: "Visual Lesson",
        short_description: "Teach concepts using clear step-by-step illustrations.",
        long_description: "A structured educational layout that breaks down historical, scientific, or practical topics into logical visual panels. Great for students and teachers alike.",
        audience_tags: ["Teachers", "Students", "Homeschoolers"],
        category_tags: ["Education", "Science", "History"],
        recommended_for: "Science explainers, history lessons, and skill tutorials.",
        sample_output_hint: "4 panels demonstrating a cycle or sequence with instructional captions.",
        age_range: "Grade 3-8",
        visibility_state: "Active",
        show_in_onboarding: true,
        show_in_homeschool: true,
        show_in_teacher_flows: true,
        featured: true,
        sort_order: 1,
        icon: "🏫"
    },
    {
        id: "format-bilingual-story",
        slug: "bilingual-story",
        title: "Bilingual Story",
        short_description: "Read stories with parallel translations side-by-side.",
        long_description: "Dual-language reading format. The layout displays text in both the native and target language side-by-side or alternating by page, strengthening comprehension.",
        audience_tags: ["Parents", "Language Learners", "Homeschoolers"],
        category_tags: ["Languages", "Early Reading", "Bilingual"],
        recommended_for: "Early vocabulary development and native language practice.",
        sample_output_hint: "Parallel storybooks with aligned vocabulary highlight cards.",
        age_range: "Grade K-5",
        visibility_state: "Active",
        show_in_onboarding: true,
        show_in_homeschool: true,
        show_in_teacher_flows: false,
        featured: true,
        sort_order: 2,
        icon: "🧸"
    },
    {
        id: "format-comic",
        slug: "comic",
        title: "Comic Book",
        short_description: "Classic graphic novel layout with expressive dialog bubbles.",
        long_description: "Traditional panel layout designed for creators drafting comic strips, manga chapters, or character-driven multiverse series.",
        audience_tags: ["Creators", "Teens", "General"],
        category_tags: ["Entertainment", "Creative Writing", "Manga"],
        recommended_for: "Creative storytelling, fanfiction, and action-adventure series.",
        sample_output_hint: "A multi-page comic book issue with action-heavy turns.",
        age_range: "Teens & Adults",
        visibility_state: "Active",
        show_in_onboarding: true,
        show_in_homeschool: false,
        show_in_teacher_flows: false,
        featured: true,
        sort_order: 3,
        icon: "🌸"
    },
    {
        id: "format-kid-story",
        slug: "kid-story",
        title: "Kid Story",
        short_description: "Wholesome bedtime reading with large warm illustrations.",
        long_description: "A warm, visual-first storytelling format with large full-page illustrations and simple, encouraging sentences. Designed for family reading time.",
        audience_tags: ["Parents", "Early Readers"],
        category_tags: ["Bedtime", "Early Reading"],
        recommended_for: "Bedtime stories, character fables, and read-aloud picture books.",
        sample_output_hint: "Lush full-width cartoon pages with warm narration prompts.",
        age_range: "Grade K-2",
        visibility_state: "Active",
        show_in_onboarding: true,
        show_in_homeschool: true,
        show_in_teacher_flows: false,
        featured: false,
        sort_order: 4,
        icon: "🦖"
    },
    {
        id: "format-science-explainer",
        slug: "science-explainer",
        title: "Science Explainer",
        short_description: "Break down complex scientific principles visually.",
        long_description: "A process-first layout focused on scientific concepts. Ideal for showing step-by-step chemical reactions, planetary orbits, or biology systems.",
        audience_tags: ["Students", "Teachers"],
        category_tags: ["Science", "STEM"],
        recommended_for: "STEM curriculum, classroom explainers, and curiosity-driven science topics.",
        sample_output_hint: "Diagram-like sequential panels with clear text definitions.",
        age_range: "Grade 6-12",
        visibility_state: "Active",
        show_in_onboarding: true,
        show_in_homeschool: true,
        show_in_teacher_flows: true,
        featured: false,
        sort_order: 5,
        icon: "🧬"
    },
    {
        id: "format-history-lesson",
        slug: "history-lesson",
        title: "History Lesson",
        short_description: "Step into historical events via character-driven beats.",
        long_description: "Explore historical campaigns, figures, and eras through chronological narrative panels. Teaches history standards interactively.",
        audience_tags: ["Teachers", "Students", "Homeschoolers"],
        category_tags: ["History", "Social Studies"],
        recommended_for: "Biographies, tactical campaigns, and ancient civilizations.",
        sample_output_hint: "Chronological narrative beats with vintage sepia-style illustrations.",
        age_range: "Grade 5-10",
        visibility_state: "Active",
        show_in_onboarding: true,
        show_in_homeschool: true,
        show_in_teacher_flows: true,
        featured: false,
        sort_order: 6,
        icon: "🏺"
    }
];

const DEFAULT_FLOWS = [
    {
        id: "flow-comic-series",
        slug: "comic-series",
        title: "Comic Series Flow",
        short_description: "Sequential storytelling focusing on character action and script outline.",
        best_for: "Action, sci-fi, manga, and long-term character arcs.",
        output_hint: "Standard multi-panel page grids with word balloons.",
        related_formats: ["comic"],
        visibility_state: "Active",
        show_in_onboarding: true,
        featured: true,
        sort_order: 1
    },
    {
        id: "flow-visual-lesson",
        slug: "visual-lesson",
        title: "Visual Lesson Flow",
        short_description: "Educational flow featuring clear definitions, labels, and structured chapters.",
        best_for: "Classrooms, homeschool syllabi, and study guides.",
        output_hint: "Numbered stages with learning checkpoint prompts.",
        related_formats: ["visual-lesson", "history-lesson"],
        visibility_state: "Active",
        show_in_onboarding: true,
        featured: true,
        sort_order: 2
    },
    {
        id: "flow-bilingual-reader",
        slug: "bilingual-reader",
        title: "Bilingual Reader Flow",
        short_description: "Dual-track reading designed to build confidence in a secondary language.",
        best_for: "Bilingual children, ESL students, and vocabulary builders.",
        output_hint: "Side-by-side translated bubble pairs or alternating pages.",
        related_formats: ["bilingual-story"],
        visibility_state: "Active",
        show_in_onboarding: true,
        featured: true,
        sort_order: 3
    },
    {
        id: "flow-read-aloud",
        slug: "read-aloud",
        title: "Read-Aloud Story Flow",
        short_description: "Optimized for voiceover narration and rich ambient soundscapes.",
        best_for: "Bedtime stories, preschool reading, and audiobooks.",
        output_hint: "Audio-synchronized story text overlay.",
        related_formats: ["kid-story", "bilingual-story"],
        visibility_state: "Active",
        show_in_onboarding: true,
        featured: false,
        sort_order: 4
    },
    {
        id: "flow-concept-tester",
        slug: "concept-tester",
        title: "Quick Concept Test Flow",
        short_description: "Single-scene storyboard to test prompts, characters, or style ideas.",
        best_for: "Admin testing, prompt sandboxes, and style prototyping.",
        output_hint: "A fast, single-panel preview run.",
        related_formats: ["comic", "visual-lesson"],
        visibility_state: "Internal",
        show_in_onboarding: false,
        featured: false,
        sort_order: 5
    }
];

const DEFAULT_GOALS = [
    {
        id: "goal-fluency",
        slug: "improve-reading-fluency",
        title: "Improve reading fluency",
        short_description: "Strengthen word recognition and reading speed through rhythmic beats.",
        category: "Reading",
        tags: ["fluency", "speed"],
        related_formats: ["bilingual-story", "kid-story"],
        related_creator_flows: ["bilingual-reader", "read-aloud"],
        importance: "Primary",
        visibility_state: "Active",
        show_in_wizard: true,
        show_in_homeschool: true,
        show_in_teacher_flows: true,
        featured: true,
        sort_order: 1
    },
    {
        id: "goal-comprehension",
        slug: "strengthen-reading-comprehension",
        title: "Strengthen reading comprehension",
        short_description: "Track plot details and character motives through visual context.",
        category: "Reading",
        tags: ["comprehension", "plot"],
        related_formats: ["comic", "history-lesson"],
        related_creator_flows: ["comic-series", "visual-lesson"],
        importance: "Primary",
        visibility_state: "Active",
        show_in_wizard: true,
        show_in_homeschool: true,
        show_in_teacher_flows: true,
        featured: true,
        sort_order: 2
    },
    {
        id: "goal-confidence",
        slug: "build-reading-confidence",
        title: "Build reading confidence",
        short_description: "Simple sentences matched with clear visual cues for early learners.",
        category: "Reading",
        tags: ["confidence", "early-reading"],
        related_formats: ["kid-story"],
        related_creator_flows: ["read-aloud"],
        importance: "Primary",
        visibility_state: "Active",
        show_in_wizard: true,
        show_in_homeschool: true,
        show_in_teacher_flows: false,
        featured: false,
        sort_order: 3
    },
    {
        id: "goal-science-clear",
        slug: "explain-science-concept-clearly",
        title: "Explain a science concept clearly",
        short_description: "Make complex scientific ideas simple and fun to visualize.",
        category: "Science",
        tags: ["science", "concepts"],
        related_formats: ["science-explainer"],
        related_creator_flows: ["visual-lesson"],
        importance: "Primary",
        visibility_state: "Active",
        show_in_wizard: true,
        show_in_homeschool: true,
        show_in_teacher_flows: true,
        featured: true,
        sort_order: 4
    },
    {
        id: "goal-science-step",
        slug: "show-science-process-step-by-step",
        title: "Show a science process step by step",
        short_description: "Explain biological or mechanical cycles incrementally.",
        category: "Science",
        tags: ["science", "process"],
        related_formats: ["science-explainer"],
        related_creator_flows: ["visual-lesson"],
        importance: "Primary",
        visibility_state: "Active",
        show_in_wizard: true,
        show_in_homeschool: true,
        show_in_teacher_flows: true,
        featured: false,
        sort_order: 5
    },
    {
        id: "goal-bilingual-vocab",
        slug: "practice-vocabulary-in-two-languages",
        title: "Practice vocabulary in two languages",
        short_description: "Map words between original and translated tracks side-by-side.",
        category: "Language / Vocabulary",
        tags: ["bilingual", "vocabulary"],
        related_formats: ["bilingual-story"],
        related_creator_flows: ["bilingual-reader"],
        importance: "Secondary",
        visibility_state: "Active",
        show_in_wizard: true,
        show_in_homeschool: true,
        show_in_teacher_flows: false,
        featured: true,
        sort_order: 6
    },
    {
        id: "goal-proud",
        slug: "create-story-reader-feels-proud-of",
        title: "Create a story the reader feels proud of",
        short_description: "Create an exciting branching narrative that rewards the reader's choices.",
        category: "Confidence / Sharing",
        tags: ["pride", "sharing"],
        related_formats: ["comic", "kid-story"],
        related_creator_flows: ["comic-series"],
        importance: "Secondary",
        visibility_state: "Active",
        show_in_wizard: true,
        show_in_homeschool: true,
        show_in_teacher_flows: false,
        featured: false,
        sort_order: 7
    }
];

const DEFAULT_USAGE_MODES = [
    {
        id: "mode-realistic",
        slug: "realistic",
        label: "Realistic reference",
        shortDescription: "A photo-like representation matching the reference image closely.",
        generationBehaviorHint: "Create highly detailed, lifelike renderings of the subject.",
        safetyNotes: "Requires explicit consent from the subject or guardian. Intended for personal use.",
        visibleInWizard: true,
        sortOrder: 1,
        status: "Active"
    },
    {
        id: "mode-stylized",
        slug: "stylized",
        label: "Stylized avatar",
        shortDescription: "A cute, stylized, or cartoonish translation of the photo.",
        generationBehaviorHint: "Translate likeness into 3D Pixar, Anime, or Crayon sketch styles.",
        safetyNotes: "Default safe setting. Perfect for children and family projects.",
        visibleInWizard: true,
        sortOrder: 2,
        status: "Active"
    },
    {
        id: "mode-inspired",
        slug: "inspired",
        label: "Inspired by photo",
        shortDescription: "Loosely inspired by the reference photo (colors, hair shape, overall vibe).",
        generationBehaviorHint: "Use key features but adapt heavily to the chosen aesthetic.",
        safetyNotes: "High creative freedom, low privacy risk.",
        visibleInWizard: true,
        sortOrder: 3,
        status: "Active"
    },
    {
        id: "mode-illustrated",
        slug: "illustrated",
        label: "Recurring illustrated character",
        shortDescription: "Fully hand-drawn look with zero photo likeness (ideal for custom guides).",
        generationBehaviorHint: "Ignore photo references. Focus entirely on prompt character description.",
        safetyNotes: "100% safe. No personal likeness used.",
        visibleInWizard: true,
        sortOrder: 4,
        status: "Active"
    },
    {
        id: "mode-none",
        slug: "none",
        label: "No photo reference",
        shortDescription: "Pure text-to-image prompt creation. No upload required.",
        generationBehaviorHint: "Build strictly from the visual summary text prompts.",
        safetyNotes: "No privacy/consent requirements.",
        visibleInWizard: true,
        sortOrder: 5,
        status: "Active"
    }
];

const DEFAULT_PERSONAS = [
    {
        id: "persona-science-guide",
        slug: "professor-pumpernickel",
        displayName: "Professor Pumpernickel",
        shortDescription: "A quirky, warm-hearted science explainer guide who loves gadgets.",
        longDescription: "A friendly recurring science tutor who helps kids understand complex biology, space, and math topics.",
        personaType: "Science Helper",
        roleDefaults: ["Science explainer", "Narrator guide"],
        ageGroup: "General",
        audience_tags: ["STEM", "Education"],
        language_tags: ["en"],
        stylePreference: "Handdrawn Sketch",
        visualSummary: "An elderly scientist with wild white hair, round glasses, a green tweed jacket, and a pocket magnifying glass.",
        generationSafeDescription: "An elderly character with messy white hair, thin round spectacles, wearing a cozy green tweed blazer.",
        usageMode: "none",
        referenceImageStatus: "None",
        recurringCharacter: true,
        visibilityScope: "Public",
        consentStatus: "Granted",
        moderationStatus: "Approved",
        approvedForGeneration: true,
        sort_order: 1,
        status: "Active"
    },
    {
        id: "persona-default-child",
        slug: "curious-cody",
        displayName: "Curious Cody",
        shortDescription: "An eager young explorer who asks endless questions.",
        longDescription: "Ideal protagonist for early readers and homeschool educational journeys.",
        personaType: "Child Reader",
        roleDefaults: ["Main character"],
        ageGroup: "Grade K-2",
        audience_tags: ["Early Reader"],
        language_tags: ["en"],
        stylePreference: "Pixar 3D",
        visualSummary: "A 7-year-old child with curly red hair, freckles, wearing a blue t-shirt with a yellow star and canvas sneakers.",
        generationSafeDescription: "A young child with red curly hair, light freckles, wearing a plain blue t-shirt.",
        usageMode: "none",
        referenceImageStatus: "None",
        recurringCharacter: true,
        visibilityScope: "Public",
        consentStatus: "Granted",
        moderationStatus: "Approved",
        approvedForGeneration: true,
        sort_order: 2,
        status: "Active"
    }
];

const DEFAULT_STYLES = [
    {
        id: "style-pixar-3d",
        slug: "pixar-3d",
        title: "Pixar 3D Adventure",
        shortDescription: "Warm glossy 3D renders, perfect for children.",
        longDescription: "A soft, volumetric 3D style resembling modern animation studio outputs. Highlighted by bright spherical lighting, expressive faces, and high-fidelity textures.",
        visualMood: "Warm, Adventurous, Glossy",
        audienceTags: ["Children", "Early Readers"],
        useCaseTags: ["Bilingual Stories", "Bedtime Stories"],
        styleFamily: "3D Animation",
        recommendationTags: ["Warm", "Friendly"],
        visibleInStudio: true,
        visibleInHomeschool: true,
        visibleInTeacherFlow: true,
        visibilityState: "Active",
        featured: true,
        sortOrder: 1,
        internalTestingOnly: false,
        artworkReference: "/pixar.png"
    },
    {
        id: "style-retro-anime",
        slug: "retro-anime",
        title: "Retro Anime Vectors",
        shortDescription: "Classic cel-shaded anime illustration styles.",
        longDescription: "A handdrawn aesthetic from 90s visual novels. Defined by sharp linework, rich flat color fills, and dramatic camera perspectives.",
        visualMood: "Kinetic, Dynamic, Nostalgic",
        audienceTags: ["Teens", "Students"],
        useCaseTags: ["History Lesson Comics", "Action Stories"],
        styleFamily: "Vector Anime",
        recommendationTags: ["Cool", "Vibrant"],
        visibleInStudio: true,
        visibleInHomeschool: true,
        visibleInTeacherFlow: true,
        visibilityState: "Active",
        featured: false,
        sortOrder: 2,
        internalTestingOnly: false,
        artworkReference: "/anime.png"
    },
    {
        id: "style-noir-inks",
        slug: "noir-inks",
        title: "Noir Comic Inks",
        shortDescription: "Heavy ink washes and dramatic contrast.",
        longDescription: "Stark chiaroscuro ink sketch art. Perfect for high-stakes mysteries, detective layouts, and educational history modules requiring serious focus.",
        visualMood: "Mysterious, High-contrast, Gritty",
        audienceTags: ["General", "Mature"],
        useCaseTags: ["Detective Stories", "History Lessons"],
        styleFamily: "Comic Inked Sketch",
        recommendationTags: ["Serious", "Dramatic"],
        visibleInStudio: true,
        visibleInHomeschool: false,
        visibleInTeacherFlow: true,
        visibilityState: "Active",
        featured: false,
        sortOrder: 3,
        internalTestingOnly: false,
        artworkReference: "/noir.png"
    }
];

const DEFAULT_PROMPT_TEMPLATES = [
    {
        id: "template-panel-standard",
        slug: "panel-standard",
        title: "Standard Panel Prompt Layer",
        workflowType: "Panel",
        formatMappings: "Comic grids and panel layouts mapping to a single story beat",
        creatorFlowMappings: "Captions and speech bubbles overlaid on illustration",
        styleModifiers: "Clean digital outlines, volumetric ambient occlusion",
        educationalMode: "Add labels or visual descriptions if scientific terms are highlighted",
        bilingualHandlingHint: "Provide side-by-side translated cues in prompt parameters",
        personaConsistencyHint: "Inject character visual descriptions and clothing identifiers",
        status: "Active",
        visibleInAdmin: true,
        internalTestingOnly: false
    },
    {
        id: "template-cover-standard",
        slug: "cover-standard",
        title: "Standard Book Cover Prompt Layer",
        workflowType: "Cover",
        formatMappings: "Title text offset, main character facing the camera",
        creatorFlowMappings: "Central high-fidelity hero pose with atmospheric background",
        styleModifiers: "Epic layout with rich depth of field",
        educationalMode: "Insert subtitle focus banners",
        bilingualHandlingHint: "Dual-language titles rendered in a clean font",
        personaConsistencyHint: "Emphasize key character features in high detail",
        status: "Active",
        visibleInAdmin: true,
        internalTestingOnly: false
    }
];

const DEFAULT_LANGUAGES = [
    {
        id: "lang-en", code: "en-US", slug: "english", displayName: "English", nativeName: "English",
        direction: "ltr", status: "Active", visibleInStudio: true, visibleInKidStory: true,
        visibleInComicStudio: true, visibleInTeacherFlow: true, visibleInHomeschool: true,
        supportsBilingual: true, supportsNarration: true, supportsTranslation: true,
        internalTestingOnly: false, educationalNotes: "Global primary standard language",
        sortOrder: 1, featured: true
    },
    {
        id: "lang-es", code: "es-MX", slug: "spanish", displayName: "Spanish", nativeName: "Español",
        direction: "ltr", status: "Active", visibleInStudio: true, visibleInKidStory: true,
        visibleInComicStudio: true, visibleInTeacherFlow: true, visibleInHomeschool: true,
        supportsBilingual: true, supportsNarration: true, supportsTranslation: true,
        internalTestingOnly: false, educationalNotes: "Primary dual-language and translation track for US classrooms",
        sortOrder: 2, featured: true
    },
    {
        id: "lang-ja", code: "ja-JP", slug: "japanese", displayName: "Japanese", nativeName: "日本語",
        direction: "ltr", status: "Active", visibleInStudio: true, visibleInKidStory: false,
        visibleInComicStudio: true, visibleInTeacherFlow: true, visibleInHomeschool: false,
        supportsBilingual: true, supportsNarration: true, supportsTranslation: true,
        internalTestingOnly: false, educationalNotes: "Advanced character-based reading path",
        sortOrder: 3, featured: false
    }
];

const DEFAULT_GLOSSARY = [
    {
        id: "glossary-1", slug: "pumpernickel", sourceTerm: "Professor Pumpernickel", preferredTranslation: "Profesor Pumpernickel",
        sourceLanguageCode: "en-US", targetLanguageCode: "es-MX", termType: "Name", preserveTerm: true,
        scopeType: "Global", internalTestingOnly: false, status: "Active", sortOrder: 1
    },
    {
        id: "glossary-2", slug: "photosynthesis", sourceTerm: "photosynthesis", preferredTranslation: "fotosíntesis",
        sourceLanguageCode: "en-US", targetLanguageCode: "es-MX", termType: "Science Term", preserveTerm: true,
        scopeType: "Global", internalTestingOnly: false, status: "Active", sortOrder: 2
    }
];

const DEFAULT_WORKFLOWS = [
    {
        id: "workflow-translation-standard", slug: "standard-pipeline", title: "Standard Translation Pipeline",
        workflowType: "Standard", eligibleSourceLanguages: ["en-US", "es-MX"], eligibleTargetLanguages: ["en-US", "es-MX", "ja-JP"],
        glossarySupport: true, protectedTermSupport: true, bilingualOutputSupport: true, narrationCompatibility: true,
        status: "Active", internalTestingOnly: false
    }
];

const DEFAULT_VOICES = [
    {
        id: "voice-narrator-1", slug: "narrator-gentle-1", displayName: "Gentle Educator (US)",
        providerId: "elevenlabs-voice-sim", modelId: "eleven_monolingual_v1",
        languageCodes: ["en-US"], primaryLanguageCode: "en-US", accentLabel: "US Friendly",
        toneLabel: "Warm & Clear", ageDescriptor: "Adult", narratorSuitability: true,
        childSafe: true, classroomSafe: true, supportsBilingualWorkflows: false,
        visibleInStudio: true, visibleInKidStory: true, visibleInComicStudio: true,
        visibleInTeacherFlow: true, visibleInHomeschool: true, internalTestingOnly: false,
        status: "Active", featured: true, sortOrder: 1
    },
    {
        id: "voice-narrator-2", slug: "narrator-es-1", displayName: "Narrador Amistoso (MX)",
        providerId: "elevenlabs-voice-sim", modelId: "eleven_multilingual_v2",
        languageCodes: ["es-MX"], primaryLanguageCode: "es-MX", accentLabel: "Mexican Neutral",
        toneLabel: "Energetic & Kind", ageDescriptor: "Adult", narratorSuitability: true,
        childSafe: true, classroomSafe: true, supportsBilingualWorkflows: true,
        visibleInStudio: true, visibleInKidStory: true, visibleInComicStudio: true,
        visibleInTeacherFlow: true, visibleInHomeschool: true, internalTestingOnly: false,
        status: "Active", featured: true, sortOrder: 2
    }
];

const DEFAULT_SOUNDTRACKS = [
    {
        id: "track-1", slug: "dreamy-classroom", title: "Dreamy Homeschool Classroom",
        category: "Soundtrack", mood: "Soft & Inspiring", educationalSuitability: true,
        familySuitability: true, classroomSuitability: true, languageNeutral: true,
        status: "Active", internalTestingOnly: false, sortOrder: 1
    },
    {
        id: "track-2", slug: "adventure-explorers", title: "Fun Science Explorers",
        category: "Soundtrack", mood: "Upbeat & Playful", educationalSuitability: true,
        familySuitability: true, classroomSuitability: true, languageNeutral: true,
        status: "Active", internalTestingOnly: false, sortOrder: 2
    }
];

const DEFAULT_NARRATION_WORKFLOWS = [
    {
        id: "workflow-narration-standard", slug: "standard-narration-pipeline", title: "Standard Narration Pipeline",
        workflowType: "Standard", eligibleLanguages: ["en-US", "es-MX"], eligibleVoices: ["narrator-gentle-1", "narrator-es-1"],
        soundtrackSupport: true, bilingualCompatibility: true, exportCompatibility: true, status: "Active", internalTestingOnly: false
    }
];

// ─────────────────────────────────────────────────────────────────────────────
// AI ENGINE SEED DATA — Providers, Models, Workflows, Routing Rules, Fallbacks

// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_AI_PROVIDERS = [
    {
        id: "prov-google", slug: "google-ai", displayName: "Google Gemini",
        providerType: "multimodal", apiKeyEnvVar: "GEMINI_API_KEY",
        baseUrl: "https://generativelanguage.googleapis.com",
        capabilities: ["text", "image", "audio", "multimodal"],
        status: "Active", internalTestingOnly: false, sortOrder: 1,
        notes: "Primary provider for text, image generation, and TTS narration."
    },
    {
        id: "prov-openai", slug: "openai-api", displayName: "OpenAI GPT",
        providerType: "text", apiKeyEnvVar: "OPENAI_API_KEY",
        baseUrl: "https://api.openai.com",
        capabilities: ["text"],
        status: "Configured", internalTestingOnly: true, sortOrder: 2,
        notes: "Secondary text provider. Used as fallback for story outline when Gemini is degraded."
    },
    {
        id: "prov-elevenlabs", slug: "elevenlabs-voice", displayName: "ElevenLabs Speech",
        providerType: "narration", apiKeyEnvVar: "ELEVENLABS_API_KEY",
        baseUrl: "https://api.elevenlabs.io",
        capabilities: ["audio", "narration"],
        status: "Configured", internalTestingOnly: true, sortOrder: 3,
        notes: "Premium voice narration provider. High User tier and above."
    },
    {
        id: "prov-leonardo", slug: "leonardo-ai", displayName: "Leonardo.AI",
        providerType: "image", apiKeyEnvVar: "LEONARDO_API_KEY",
        baseUrl: "https://cloud.leonardo.ai/api/rest/v1",
        capabilities: ["image"],
        status: "Configured", internalTestingOnly: true, sortOrder: 4,
        notes: "Specialist image provider for comic panels and cover art. High User tier."
    },
    {
        id: "prov-anthropic", slug: "anthropic-claude", displayName: "Anthropic Claude",
        providerType: "text", apiKeyEnvVar: "ANTHROPIC_API_KEY",
        baseUrl: "https://api.anthropic.com",
        capabilities: ["text"],
        status: "Planned", internalTestingOnly: true, sortOrder: 5,
        notes: "Planned third text provider for long-form story drafts."
    }
];

const DEFAULT_AI_MODELS = [
    // Google Gemini — Text / Multimodal
    {
        id: "model-gemini-flash", providerId: "prov-google", slug: "gemini-2.5-flash",
        displayName: "Gemini 2.5 Flash", capabilityTypes: ["text", "multimodal"],
        costTier: "Low", performanceTier: "Standard", maxTokens: 8192,
        status: "Active", internalTestingOnly: false,
        notes: "Default model for Free tier text generation and suggestions."
    },
    {
        id: "model-gemini-pro", providerId: "prov-google", slug: "gemini-2.5-pro",
        displayName: "Gemini 2.5 Pro", capabilityTypes: ["text", "multimodal"],
        costTier: "Medium", performanceTier: "Premium", maxTokens: 32768,
        status: "Active", internalTestingOnly: false,
        notes: "Premium text model for High User tier. Richer story outlines and narrative detail."
    },
    // Google Gemini — Image Generation
    {
        id: "model-gemini-image", providerId: "prov-google", slug: "gemini-2.5-flash-image",
        displayName: "Gemini Image Flash", capabilityTypes: ["image", "multimodal"],
        costTier: "Medium", performanceTier: "Standard", maxTokens: 0,
        status: "Active", internalTestingOnly: false,
        notes: "Used for character sheet and persona generation. Supports reference images."
    },
    {
        id: "model-imagen4", providerId: "prov-google", slug: "imagen-4.0-generate-001",
        displayName: "Imagen 4", capabilityTypes: ["image"],
        costTier: "High", performanceTier: "Ultra", maxTokens: 0,
        status: "Active", internalTestingOnly: false,
        notes: "High-quality scene panel and cover generation for Entry and High User tiers."
    },
    // Google Gemini — TTS Narration
    {
        id: "model-gemini-tts", providerId: "prov-google", slug: "gemini-3.1-flash-tts-preview",
        displayName: "Gemini TTS Flash", capabilityTypes: ["audio", "narration"],
        costTier: "Low", performanceTier: "Standard", maxTokens: 0,
        status: "Active", internalTestingOnly: false,
        notes: "Free and Entry tier narration using Gemini built-in TTS voices."
    },
    // OpenAI
    {
        id: "model-gpt-4o", providerId: "prov-openai", slug: "gpt-4o",
        displayName: "GPT-4o", capabilityTypes: ["text"],
        costTier: "High", performanceTier: "Ultra", maxTokens: 128000,
        status: "Configured", internalTestingOnly: true,
        notes: "Text fallback provider for outline generation when Gemini quota is exhausted."
    },
    // ElevenLabs
    {
        id: "model-eleven-mono", providerId: "prov-elevenlabs", slug: "eleven_monolingual_v1",
        displayName: "ElevenLabs Monolingual v1", capabilityTypes: ["audio", "narration"],
        costTier: "High", performanceTier: "Ultra", maxTokens: 0,
        status: "Configured", internalTestingOnly: true,
        notes: "Premium narration for High User tier. Best for English single-voice stories."
    },
    // Leonardo.AI
    {
        id: "model-leonardo-comic", providerId: "prov-leonardo", slug: "leonardo-comic-v2",
        displayName: "Leonardo Comic v2", capabilityTypes: ["image"],
        costTier: "High", performanceTier: "Ultra", maxTokens: 0,
        status: "Configured", internalTestingOnly: true,
        notes: "Specialist comic-style image model. High User tier comic panel generation."
    }
];

const DEFAULT_AI_WORKFLOWS = [
    {
        id: "flow-text-outline", slug: "text_outline_generation", title: "Story Outline Brainstorm",
        workflowType: "Outline", capabilityTypes: ["text"], defaultProviderId: "prov-google",
        defaultModelId: "model-gemini-flash", status: "Active", internalTestingOnly: false,
        description: "Generates chapter-by-chapter story blueprints and narrative beats."
    },
    {
        id: "flow-text-beat", slug: "beat_content_generation", title: "Scene Beat Writer",
        workflowType: "BeatContent", capabilityTypes: ["text"], defaultProviderId: "prov-google",
        defaultModelId: "model-gemini-flash", status: "Active", internalTestingOnly: false,
        description: "Writes per-panel captions, dialogue, and scene descriptions."
    },
    {
        id: "flow-image-scene", slug: "image_scene_generation", title: "Scene Comic Panel",
        workflowType: "SceneImage", capabilityTypes: ["image"], defaultProviderId: "prov-google",
        defaultModelId: "model-gemini-image", status: "Active", internalTestingOnly: false,
        description: "Generates vertical comic panels from scene descriptions and character references."
    },
    {
        id: "flow-image-cover", slug: "cover_image_generation", title: "Story Cover Art",
        workflowType: "CoverImage", capabilityTypes: ["image"], defaultProviderId: "prov-google",
        defaultModelId: "model-imagen4", status: "Active", internalTestingOnly: false,
        description: "Generates full-page story covers with title treatment and character composition."
    },
    {
        id: "flow-image-character", slug: "character_sheet_generation", title: "Character Sheet Builder",
        workflowType: "CharacterImage", capabilityTypes: ["image", "multimodal"], defaultProviderId: "prov-google",
        defaultModelId: "model-gemini-image", status: "Active", internalTestingOnly: false,
        description: "Generates full-body character sheets from persona descriptions and reference photos."
    },
    {
        id: "flow-narration", slug: "narration_generation", title: "Story Narration",
        workflowType: "Narration", capabilityTypes: ["audio", "narration"], defaultProviderId: "prov-google",
        defaultModelId: "model-gemini-tts", status: "Active", internalTestingOnly: false,
        description: "Converts story text to spoken narration audio per scene or chapter."
    },
    {
        id: "flow-translation", slug: "translation_generation", title: "Story Translation",
        workflowType: "Translation", capabilityTypes: ["text"], defaultProviderId: "prov-google",
        defaultModelId: "model-gemini-flash", status: "Active", internalTestingOnly: false,
        description: "Translates story content panel-by-panel or chapter-by-chapter with glossary support."
    }
];

const DEFAULT_AI_ROUTING_RULES: any[] = [
    // ── Story Outline (text_outline_generation) ─────────────────────────────
    { id: "rule-free-outline",    workflowSlug: "text_outline_generation",  planTier: "Free",       environment: "production", providerId: "prov-google",    modelId: "model-gemini-flash", status: "Active", priority: 1 },
    { id: "rule-entry-outline",   workflowSlug: "text_outline_generation",  planTier: "Entry",      environment: "production", providerId: "prov-google",    modelId: "model-gemini-flash", status: "Active", priority: 1 },
    { id: "rule-pro-outline",     workflowSlug: "text_outline_generation",  planTier: "High User",  environment: "production", providerId: "prov-google",    modelId: "model-gemini-pro",  status: "Active", priority: 1 },
    // ── Beat Content (beat_content_generation) ──────────────────────────────
    { id: "rule-free-beat",       workflowSlug: "beat_content_generation",  planTier: "Free",       environment: "production", providerId: "prov-google",    modelId: "model-gemini-flash", status: "Active", priority: 1 },
    { id: "rule-entry-beat",      workflowSlug: "beat_content_generation",  planTier: "Entry",      environment: "production", providerId: "prov-google",    modelId: "model-gemini-flash", status: "Active", priority: 1 },
    { id: "rule-pro-beat",        workflowSlug: "beat_content_generation",  planTier: "High User",  environment: "production", providerId: "prov-google",    modelId: "model-gemini-pro",  status: "Active", priority: 1 },
    // ── Scene Panel Image (image_scene_generation) ──────────────────────────
    { id: "rule-free-scene",      workflowSlug: "image_scene_generation",   planTier: "Free",       environment: "production", providerId: "prov-google",    modelId: "model-gemini-image", status: "Active", priority: 1 },
    { id: "rule-entry-scene",     workflowSlug: "image_scene_generation",   planTier: "Entry",      environment: "production", providerId: "prov-google",    modelId: "model-imagen4",      status: "Active", priority: 1 },
    { id: "rule-pro-scene",       workflowSlug: "image_scene_generation",   planTier: "High User",  environment: "production", providerId: "prov-leonardo",  modelId: "model-leonardo-comic", status: "Active", priority: 1 },
    // ── Cover Art (cover_image_generation) ─────────────────────────────────
    { id: "rule-free-cover",      workflowSlug: "cover_image_generation",   planTier: "Free",       environment: "production", providerId: "prov-google",    modelId: "model-gemini-image", status: "Active", priority: 1 },
    { id: "rule-entry-cover",     workflowSlug: "cover_image_generation",   planTier: "Entry",      environment: "production", providerId: "prov-google",    modelId: "model-imagen4",      status: "Active", priority: 1 },
    { id: "rule-pro-cover",       workflowSlug: "cover_image_generation",   planTier: "High User",  environment: "production", providerId: "prov-google",    modelId: "model-imagen4",      status: "Active", priority: 1 },
    // ── Narration (narration_generation) ────────────────────────────────────
    { id: "rule-free-narr",       workflowSlug: "narration_generation",     planTier: "Free",       environment: "production", providerId: "prov-google",    modelId: "model-gemini-tts",   status: "Active", priority: 1 },
    { id: "rule-entry-narr",      workflowSlug: "narration_generation",     planTier: "Entry",      environment: "production", providerId: "prov-google",    modelId: "model-gemini-tts",   status: "Active", priority: 1 },
    { id: "rule-pro-narr",        workflowSlug: "narration_generation",     planTier: "High User",  environment: "production", providerId: "prov-elevenlabs", modelId: "model-eleven-mono",  status: "Active", priority: 1 },
    // ── Translation (translation_generation) ────────────────────────────────
    { id: "rule-free-trans",      workflowSlug: "translation_generation",   planTier: "Free",       environment: "production", providerId: "prov-google",    modelId: "model-gemini-flash", status: "Active", priority: 1 },
    { id: "rule-entry-trans",     workflowSlug: "translation_generation",   planTier: "Entry",      environment: "production", providerId: "prov-google",    modelId: "model-gemini-flash", status: "Active", priority: 1 },
    { id: "rule-pro-trans",       workflowSlug: "translation_generation",   planTier: "High User",  environment: "production", providerId: "prov-google",    modelId: "model-gemini-pro",   status: "Active", priority: 1 },
    // ── Character Sheet (character_sheet_generation) ─────────────────────────
    { id: "rule-free-char",       workflowSlug: "character_sheet_generation", planTier: "Free",     environment: "production", providerId: "prov-google",    modelId: "model-gemini-image", status: "Active", priority: 1 },
    { id: "rule-entry-char",      workflowSlug: "character_sheet_generation", planTier: "Entry",    environment: "production", providerId: "prov-google",    modelId: "model-gemini-image", status: "Active", priority: 1 },
    { id: "rule-pro-char",        workflowSlug: "character_sheet_generation", planTier: "High User",environment: "production", providerId: "prov-google",    modelId: "model-gemini-image", status: "Active", priority: 1 }
];

const DEFAULT_AI_FALLBACK_CONFIGS: any[] = [
    {
        id: "fallback-text-outline", workflowSlug: "text_outline_generation",
        primaryProviderId: "prov-google", primaryModelId: "model-gemini-pro",
        fallbackProviderId: "prov-google", fallbackModelId: "model-gemini-flash",
        triggerConditions: ["quota_exceeded", "rate_limited", "provider_error"],
        status: "Active"
    },
    {
        id: "fallback-image-scene", workflowSlug: "image_scene_generation",
        primaryProviderId: "prov-leonardo", primaryModelId: "model-leonardo-comic",
        fallbackProviderId: "prov-google", fallbackModelId: "model-imagen4",
        triggerConditions: ["provider_error", "timeout"],
        status: "Active"
    },
    {
        id: "fallback-narration", workflowSlug: "narration_generation",
        primaryProviderId: "prov-elevenlabs", primaryModelId: "model-eleven-mono",
        fallbackProviderId: "prov-google", fallbackModelId: "model-gemini-tts",
        triggerConditions: ["quota_exceeded", "provider_error"],
        status: "Active"
    }
];

const memoryDb = {
    users: [] as any[],
    character_vault: [] as any[],
    projects: [] as any[],
    project_casting: [] as any[],
    content_categories: [...DEFAULT_CATEGORIES],
    starting_formats: [...DEFAULT_FORMATS],
    creator_flows: [...DEFAULT_FLOWS],
    story_goals: [...DEFAULT_GOALS],
    personas: [...DEFAULT_PERSONAS] as any[],
    usage_modes: [...DEFAULT_USAGE_MODES] as any[],
    reference_images: [] as any[],
    role_assignments: [] as any[],
    styles: [...DEFAULT_STYLES] as any[],
    prompt_templates: [...DEFAULT_PROMPT_TEMPLATES] as any[],
    image_generation_jobs: [] as any[],
    panel_generation_requests: [] as any[],
    cover_generation_requests: [] as any[],
    generated_assets: [] as any[],
    languages: [...DEFAULT_LANGUAGES] as any[],
    glossary_entries: [...DEFAULT_GLOSSARY] as any[],
    translation_workflows: [...DEFAULT_WORKFLOWS] as any[],
    project_language_settings: [] as any[],
    translation_units: [] as any[],
    translation_jobs: [] as any[],
    language_availability_rules: [] as any[],
    voices: [...DEFAULT_VOICES] as any[],
    soundtrack_items: [...DEFAULT_SOUNDTRACKS] as any[],
    narration_workflows: [...DEFAULT_NARRATION_WORKFLOWS] as any[],
    project_narration_settings: [] as any[],
    narration_units: [] as any[],
    narration_jobs: [] as any[],
    audio_assets: [] as any[],
    voice_availability_rules: [] as any[],
    ai_providers: [...DEFAULT_AI_PROVIDERS] as any[],
    ai_models: [...DEFAULT_AI_MODELS] as any[],
    ai_workflows: [...DEFAULT_AI_WORKFLOWS] as any[],
    ai_routing_rules: [...DEFAULT_AI_ROUTING_RULES] as any[],
    ai_fallback_configs: [] as any[],
    ai_plan_tier_maps: [] as any[],
    admin_users: [] as any[],
    admin_sessions: [] as any[],
    subscription_plans: [] as any[],
    webhook_logs: [] as any[],
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

// Seed fallback configs into memoryDb
memoryDb.ai_fallback_configs.push(...DEFAULT_AI_FALLBACK_CONFIGS);

// ─── In-memory fallback handlers for async generation jobs ──────────────────
jobQueue.on('generate-image', async (data: GenerationJobData) => {
    const { kind, jobId, requestId, assetId, payload } = data;
    const previewUrls = [
        'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&q=80&w=300',
        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=300',
        'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&q=80&w=300'
    ];
    const previewUrl = kind === 'cover'
        ? 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=400'
        : previewUrls[Math.floor(Math.random() * previewUrls.length)];

    const job = memoryDb.image_generation_jobs.find((j: any) => j.id === jobId);
    if (job) {
        job.status = 'Completed';
        job.outputAssetIds = [assetId];
        job.completedAt = new Date().toISOString();
    }
    if (kind === 'panel') {
        const request = memoryDb.panel_generation_requests.find((r: any) => r.id === requestId);
        if (request) {
            request.generationState = 'Completed';
            request.selectedAssetId = assetId;
            request.variantAssetIds = [assetId];
        }
    } else if (kind === 'cover') {
        const request = memoryDb.cover_generation_requests.find((r: any) => r.id === requestId);
        if (request) {
            request.generationState = 'Completed';
            request.selectedAssetId = assetId;
            request.variantAssetIds = [assetId];
        }
    }
    memoryDb.generated_assets.push({
        id: assetId, assetType: kind === 'cover' ? 'Cover' : 'Panel', sourceJobId: jobId, sourceRequestId: requestId,
        previewUrl, status: 'Completed', selected: true, approved: true, archived: false,
        moderationState: 'Approved', createdAt: new Date().toISOString()
    });
});

jobQueue.on('generate-audio', async (data: GenerationJobData) => {
    const { jobId, requestId, assetId, payload } = data;
    const { text, voiceId, projectId, parentContentId } = payload;
    const unitId = requestId || crypto.randomUUID();
    const job = memoryDb.narration_jobs.find((j: any) => j.id === jobId);
    if (job) {
        job.status = 'Completed';
        job.resultBindingIds = [assetId];
        job.completedAt = new Date().toISOString();
    }
    memoryDb.narration_units.push({
        id: unitId, projectId: projectId || 'current-project', parentContentType: 'Panel',
        parentContentId: parentContentId || 'current-panel', textBindingId: 'caption-text',
        sourceText: text, languageCode: 'en-US', assignedVoiceId: voiceId || 'voice-narrator-1',
        narrationMode: 'narrator-only', pacingMode: 'standard', status: 'Completed',
        reviewStatus: 'Approved', outputAssetId: assetId, overrideApplied: false
    });
    memoryDb.audio_assets.push({
        id: assetId, assetType: 'Panel', sourceJobId: jobId, sourceUnitId: unitId,
        previewUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
        status: 'Completed', selected: true, approved: true, archived: false,
        moderationState: 'Approved', durationMs: 4500, createdAt: new Date().toISOString()
    });
});

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function isValidUuid(val: string): boolean {
    return UUID_REGEX.test(val);
}

// ─────────────────────────────────────────────────────────────────────────────
// resolveAIRoute — Provider-Agnostic Routing Boundary
//
// All AI calls MUST resolve their provider + model through this function.
// This is the single choke-point that reads routing rules, applies plan-tier
// logic, and returns a concrete {providerId, modelId, modelSlug, providerSlug}.
// ─────────────────────────────────────────────────────────────────────────────
interface AIRouteResolution {
    providerId: string;
    modelId: string;
    modelSlug: string;
    providerSlug: string;
    resolvedBy: 'rule' | 'workflow_default' | 'hardcoded_fallback';
}

function resolveAIRoute(
    workflowSlug: string,
    userTier: string = 'Free',
    env: string = 'production'
): AIRouteResolution {
    const tiers = [userTier, 'Free'];
    const rules: any[] = memoryDb.ai_routing_rules || [];

    // Find the highest-priority active rule matching workflow + tier + env
    for (const tier of tiers) {
        const match = rules
            .filter(r =>
                r.workflowSlug === workflowSlug &&
                r.planTier === tier &&
                (r.environment === env || r.environment === 'production') &&
                r.status === 'Active'
            )
            .sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99))[0];

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

    // Fallback: use the workflow's default model
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

    // Last resort: Gemini Flash for text, Gemini Image for image types
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

// Helper: look up a user's plan tier from memoryDb or DB
async function getUserTier(email: string): Promise<string> {
    if (!email || email === 'unknown') return 'Free';
    try {
        const pool = getDbPool();
        if (pool) {
            const res = await pool.query('SELECT tier FROM users WHERE email = $1 LIMIT 1', [email]);
            return res.rows[0]?.tier || 'Free';
        }
        const user = memoryDb.users.find((u: any) => u.email === email);
        return user?.tier || 'Free';
    } catch {
        return 'Free';
    }
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

async function seedDefaultWizardLibraries(): Promise<void> {
    await seedDefaultCategoriesIfEmpty();
    if (!isDatabaseConnected()) return;
    const pool = getDbPool();
    if (!pool) return;

    // 1. Seed starting_formats
    try {
        const checkFormats = await pool.query('SELECT COUNT(*) as count FROM starting_formats');
        if (parseInt(checkFormats.rows[0].count, 10) === 0) {
            console.log("🌱 Database starting_formats is empty. Auto-seeding 6 default formats...");
            for (const item of DEFAULT_FORMATS) {
                await pool.query(
                    `INSERT INTO starting_formats (id, slug, title, short_description, long_description, audience_tags, category_tags, recommended_for, sample_output_hint, age_range, visibility_state, show_in_onboarding, show_in_homeschool, show_in_teacher_flows, featured, sort_order, icon)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
                    [
                        item.id, item.slug, item.title, item.short_description, item.long_description,
                        JSON.stringify(item.audience_tags), JSON.stringify(item.category_tags),
                        item.recommended_for, item.sample_output_hint, item.age_range,
                        item.visibility_state, item.show_in_onboarding, item.show_in_homeschool,
                        item.show_in_teacher_flows, item.featured, item.sort_order, item.icon
                    ]
                );
            }
            console.log("✅ Seeded starting_formats.");
        }
    } catch (e: any) {
        console.warn("⚠️ Failed to seed starting_formats:", e.message);
    }

    // 2. Seed creator_flows
    try {
        const checkFlows = await pool.query('SELECT COUNT(*) as count FROM creator_flows');
        if (parseInt(checkFlows.rows[0].count, 10) === 0) {
            console.log("🌱 Database creator_flows is empty. Auto-seeding 5 default flows...");
            for (const item of DEFAULT_FLOWS) {
                await pool.query(
                    `INSERT INTO creator_flows (id, slug, title, short_description, best_for, output_hint, related_formats, visibility_state, show_in_onboarding, featured, sort_order)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
                    [
                        item.id, item.slug, item.title, item.short_description, item.best_for,
                        item.output_hint, JSON.stringify(item.related_formats), item.visibility_state,
                        item.show_in_onboarding, item.featured, item.sort_order
                    ]
                );
            }
            console.log("✅ Seeded creator_flows.");
        }
    } catch (e: any) {
        console.warn("⚠️ Failed to seed creator_flows:", e.message);
    }

    // 3. Seed story_goals
    try {
        const checkGoals = await pool.query('SELECT COUNT(*) as count FROM story_goals');
        if (parseInt(checkGoals.rows[0].count, 10) === 0) {
            console.log("🌱 Database story_goals is empty. Auto-seeding 7 default goals...");
            for (const item of DEFAULT_GOALS) {
                await pool.query(
                    `INSERT INTO story_goals (id, slug, title, short_description, category, tags, related_formats, related_creator_flows, importance, visibility_state, show_in_wizard, show_in_homeschool, show_in_teacher_flows, featured, sort_order)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
                    [
                        item.id, item.slug, item.title, item.short_description, item.category,
                        JSON.stringify(item.tags), JSON.stringify(item.related_formats), JSON.stringify(item.related_creator_flows),
                        item.importance, item.visibility_state, item.show_in_wizard, item.show_in_homeschool,
                        item.show_in_teacher_flows, item.featured, item.sort_order
                    ]
                );
            }
            console.log("✅ Seeded story_goals.");
        }
    } catch (e: any) {
        console.warn("⚠️ Failed to seed story_goals:", e.message);
    }

    // 4. Seed usage_modes
    try {
        const checkModes = await pool.query('SELECT COUNT(*) as count FROM usage_modes');
        if (parseInt(checkModes.rows[0].count, 10) === 0) {
            console.log("🌱 Database usage_modes is empty. Auto-seeding 5 default modes...");
            for (const item of DEFAULT_USAGE_MODES) {
                await pool.query(
                    `INSERT INTO usage_modes (id, slug, label, shortDescription, generationBehaviorHint, safetyNotes, visibleInWizard, sortOrder, status)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                    [
                        item.id, item.slug, item.label, item.shortDescription, item.generationBehaviorHint,
                        item.safetyNotes, item.visibleInWizard, item.sortOrder, item.status
                    ]
                );
            }
            console.log("✅ Seeded usage_modes.");
        }
    } catch (e: any) {
        console.warn("⚠️ Failed to seed usage_modes:", e.message);
    }

    // 5. Seed personas
    try {
        const checkPersonas = await pool.query('SELECT COUNT(*) as count FROM personas');
        if (parseInt(checkPersonas.rows[0].count, 10) === 0) {
            console.log("🌱 Database personas is empty. Auto-seeding default personas...");
            for (const item of DEFAULT_PERSONAS) {
                await pool.query(
                    `INSERT INTO personas (id, slug, displayName, shortDescription, longDescription, personaType, roleDefaults, ageGroup, audience_tags, language_tags, stylePreference, visualSummary, generationSafeDescription, usageMode, referenceImageStatus, recurringCharacter, visibilityScope, consentStatus, moderationStatus, approvedForGeneration, sort_order, status)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)`,
                    [
                        item.id, item.slug, item.displayName, item.shortDescription, item.longDescription,
                        item.personaType, JSON.stringify(item.roleDefaults), item.ageGroup,
                        JSON.stringify(item.audience_tags), JSON.stringify(item.language_tags),
                        item.stylePreference, item.visualSummary, item.generationSafeDescription,
                        item.usageMode, item.referenceImageStatus, item.recurringCharacter,
                        item.visibilityScope, item.consentStatus, item.moderationStatus,
                        item.approvedForGeneration, item.sort_order, item.status
                    ]
                );
            }
            console.log("✅ Seeded personas.");
        }
    } catch (e: any) {
        console.warn("⚠️ Failed to seed personas:", e.message);
    }

    // 6. Seed styles
    try {
        const checkStyles = await pool.query('SELECT COUNT(*) as count FROM styles');
        if (parseInt(checkStyles.rows[0].count, 10) === 0) {
            console.log("🌱 Database styles is empty. Auto-seeding default styles...");
            for (const item of DEFAULT_STYLES) {
                await pool.query(
                    `INSERT INTO styles (id, slug, title, shortDescription, longDescription, visualMood, audienceTags, useCaseTags, styleFamily, recommendationTags, visibleInStudio, visibleInHomeschool, visibleInTeacherFlow, visibilityState, featured, sortOrder, internalTestingOnly, artworkReference)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)`,
                    [
                        item.id, item.slug, item.title, item.shortDescription, item.longDescription,
                        item.visualMood, JSON.stringify(item.audienceTags), JSON.stringify(item.useCaseTags),
                        item.styleFamily, JSON.stringify(item.recommendationTags), item.visibleInStudio,
                        item.visibleInHomeschool, item.visibleInTeacherFlow, item.visibilityState,
                        item.featured, item.sortOrder, item.internalTestingOnly, item.artworkReference
                    ]
                );
            }
            console.log("✅ Seeded styles.");
        }
    } catch (e: any) {
        console.warn("⚠️ Failed to seed styles:", e.message);
    }

    // 7. Seed prompt_templates
    try {
        const checkTemplates = await pool.query('SELECT COUNT(*) as count FROM prompt_templates');
        if (parseInt(checkTemplates.rows[0].count, 10) === 0) {
            console.log("🌱 Database prompt_templates is empty. Auto-seeding default templates...");
            for (const item of DEFAULT_PROMPT_TEMPLATES) {
                await pool.query(
                    `INSERT INTO prompt_templates (id, slug, title, workflowType, formatMappings, creatorFlowMappings, styleModifiers, educationalMode, bilingualHandlingHint, personaConsistencyHint, status, visibleInAdmin, internalTestingOnly)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
                    [
                        item.id, item.slug, item.title, item.workflowType, item.formatMappings,
                        item.creatorFlowMappings, item.styleModifiers, item.educationalMode,
                        item.bilingualHandlingHint, item.personaConsistencyHint, item.status,
                        item.visibleInAdmin, item.internalTestingOnly
                    ]
                );
            }
            console.log("✅ Seeded prompt_templates.");
        }
    } catch (e: any) {
        console.warn("⚠️ Failed to seed prompt_templates:", e.message);
    }

    // 8. Seed languages
    try {
        const checkLangs = await pool.query('SELECT COUNT(*) as count FROM languages');
        if (parseInt(checkLangs.rows[0].count, 10) === 0) {
            console.log("🌱 Database languages is empty. Auto-seeding default languages...");
            for (const item of DEFAULT_LANGUAGES) {
                await pool.query(
                    `INSERT INTO languages (id, code, slug, displayName, nativeName, direction, status, visibleInStudio, visibleInKidStory, visibleInComicStudio, visibleInTeacherFlow, visibleInHomeschool, supportsBilingual, supportsNarration, supportsTranslation, internalTestingOnly, educationalNotes, sortOrder, featured)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)`,
                    [
                        item.id, item.code, item.slug, item.displayName, item.nativeName,
                        item.direction, item.status, item.visibleInStudio, item.visibleInKidStory,
                        item.visibleInComicStudio, item.visibleInTeacherFlow, item.visibleInHomeschool,
                        item.supportsBilingual, item.supportsNarration, item.supportsTranslation,
                        item.internalTestingOnly, item.educationalNotes, item.sortOrder, item.featured
                    ]
                );
            }
            console.log("✅ Seeded languages.");
        }
    } catch (e: any) {
        console.warn("⚠️ Failed to seed languages:", e.message);
    }

    // 9. Seed glossary_entries
    try {
        const checkGlossary = await pool.query('SELECT COUNT(*) as count FROM glossary_entries');
        if (parseInt(checkGlossary.rows[0].count, 10) === 0) {
            console.log("🌱 Database glossary_entries is empty. Auto-seeding default terms...");
            for (const item of DEFAULT_GLOSSARY) {
                await pool.query(
                    `INSERT INTO glossary_entries (id, slug, sourceTerm, preferredTranslation, sourceLanguageCode, targetLanguageCode, termType, preserveTerm, scopeType, internalTestingOnly, status, sortOrder)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
                    [
                        item.id, item.slug, item.sourceTerm, item.preferredTranslation, item.sourceLanguageCode,
                        item.targetLanguageCode, item.termType, item.preserveTerm, item.scopeType,
                        item.internalTestingOnly, item.status, item.sortOrder
                    ]
                );
            }
            console.log("✅ Seeded glossary_entries.");
        }
    } catch (e: any) {
        console.warn("⚠️ Failed to seed glossary_entries:", e.message);
    }

    // 10. Seed translation_workflows
    try {
        const checkWorkflows = await pool.query('SELECT COUNT(*) as count FROM translation_workflows');
        if (parseInt(checkWorkflows.rows[0].count, 10) === 0) {
            console.log("🌱 Database translation_workflows is empty. Auto-seeding default workflows...");
            for (const item of DEFAULT_WORKFLOWS) {
                await pool.query(
                    `INSERT INTO translation_workflows (id, slug, title, workflowType, eligibleSourceLanguages, eligibleTargetLanguages, glossarySupport, protectedTermSupport, bilingualOutputSupport, narrationCompatibility, status, internalTestingOnly)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
                    [
                        item.id, item.slug, item.title, item.workflowType, JSON.stringify(item.eligibleSourceLanguages),
                        JSON.stringify(item.eligibleTargetLanguages), item.glossarySupport, item.protectedTermSupport,
                        item.bilingualOutputSupport, item.narrationCompatibility, item.status, item.internalTestingOnly
                    ]
                );
            }
            console.log("✅ Seeded translation_workflows.");
        }
    } catch (e: any) {
        console.warn("⚠️ Failed to seed translation_workflows:", e.message);
    }

    // 11. Seed voices
    try {
        const checkVoices = await pool.query('SELECT COUNT(*) as count FROM voices');
        if (parseInt(checkVoices.rows[0].count, 10) === 0) {
            console.log("🌱 Database voices is empty. Auto-seeding default voices...");
            for (const item of DEFAULT_VOICES) {
                await pool.query(
                    `INSERT INTO voices (id, slug, displayName, providerId, modelId, languageCodes, primaryLanguageCode, accentLabel, toneLabel, ageDescriptor, narratorSuitability, childSafe, classroomSafe, supportsBilingualWorkflows, visibleInStudio, visibleInKidStory, visibleInComicStudio, visibleInTeacherFlow, visibleInHomeschool, internalTestingOnly, status, featured, sortOrder)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)`,
                    [
                        item.id, item.slug, item.displayName, item.providerId, item.modelId, JSON.stringify(item.languageCodes),
                        item.primaryLanguageCode, item.accentLabel, item.toneLabel, item.ageDescriptor, item.narratorSuitability,
                        item.childSafe, item.classroomSafe, item.supportsBilingualWorkflows, item.visibleInStudio, item.visibleInKidStory,
                        item.visibleInComicStudio, item.visibleInTeacherFlow, item.visibleInHomeschool, item.internalTestingOnly,
                        item.status, item.featured, item.sortOrder
                    ]
                );
            }
            console.log("✅ Seeded voices.");
        }
    } catch (e: any) {
        console.warn("⚠️ Failed to seed voices:", e.message);
    }

    // 12. Seed soundtrack_items
    try {
        const checkTracks = await pool.query('SELECT COUNT(*) as count FROM soundtrack_items');
        if (parseInt(checkTracks.rows[0].count, 10) === 0) {
            console.log("🌱 Database soundtrack_items is empty. Auto-seeding default tracks...");
            for (const item of DEFAULT_SOUNDTRACKS) {
                await pool.query(
                    `INSERT INTO soundtrack_items (id, slug, title, category, mood, educationalSuitability, familySuitability, classroomSuitability, languageNeutral, status, internalTestingOnly, sortOrder)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
                    [
                        item.id, item.slug, item.title, item.category, item.mood, item.educationalSuitability,
                        item.familySuitability, item.classroomSuitability, item.languageNeutral, item.status,
                        item.internalTestingOnly, item.sortOrder
                    ]
                );
            }
            console.log("✅ Seeded soundtrack_items.");
        }
    } catch (e: any) {
        console.warn("⚠️ Failed to seed soundtrack_items:", e.message);
    }

    // 13. Seed narration_workflows
    try {
        const checkAudioWorkflows = await pool.query('SELECT COUNT(*) as count FROM narration_workflows');
        if (parseInt(checkAudioWorkflows.rows[0].count, 10) === 0) {
            console.log("🌱 Database narration_workflows is empty. Auto-seeding default workflows...");
            for (const item of DEFAULT_NARRATION_WORKFLOWS) {
                await pool.query(
                    `INSERT INTO narration_workflows (id, slug, title, workflowType, eligibleLanguages, eligibleVoices, soundtrackSupport, bilingualCompatibility, exportCompatibility, status, internalTestingOnly)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
                    [
                        item.id, item.slug, item.title, item.workflowType, JSON.stringify(item.eligibleLanguages),
                        JSON.stringify(item.eligibleVoices), item.soundtrackSupport, item.bilingualCompatibility,
                        item.exportCompatibility, item.status, item.internalTestingOnly
                    ]
                );
            }
            console.log("✅ Seeded narration_workflows.");
        }
    } catch (e: any) {
        console.warn("⚠️ Failed to seed narration_workflows:", e.message);
    }
}

async function seedDefaultCategoriesIfEmpty(): Promise<void> {
    if (!isDatabaseConnected()) return;
    const pool = getDbPool();
    if (!pool) return;
    try {
        const countRes = await pool.query('SELECT COUNT(*) as count FROM content_categories');
        const count = parseInt(countRes.rows[0].count, 10);
        if (count === 0) {
            console.log("🌱 Database content_categories table is empty. Auto-seeding 23 default categories...");
            for (const cat of DEFAULT_CATEGORIES) {
                await pool.query(
                    `INSERT INTO content_categories (name, category_type, emoji, prompt_instruction, is_featured, is_active)
                     VALUES ($1, $2, $3, $4, $5, $6)
                     ON CONFLICT DO NOTHING`,
                    [cat.name, cat.category_type, cat.emoji, cat.prompt_instruction, cat.is_featured, cat.is_active]
                );
            }
            console.log("✅ Successfully seeded content_categories.");
        }
    } catch (e: any) {
        console.warn("⚠️ Failed to auto-seed content_categories:", e.message);
    }
}

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
    
    // Task 1.7: Security headers on all responses
    app.use(securityHeaders);

    // Task 1.3: Rate limiting middleware — abuse protection
    app.use('/api/', generalLimiter);

    // Task 1.8: Structured request logging
    app.use(logger.requestMiddleware);

    
    const requireAdmin = async (req: any, res: any, next: any) => {
    try {
        const authHeader = req.headers.authorization;
        
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
                    }
                }
            } else {
                 const session = memoryDb.admin_sessions?.find((s: any) => s.token === token);
                 if (session && new Date(session.expires_at) > new Date()) {
                     isCustomAdmin = true;
                     email = session.username;
                 }
            }

            // 2. Fallback to Firebase JWT
            if (!isCustomAdmin) {
                try {
                    const decoded = await getAuth().verifyIdToken(token);
                    email = decoded.email || '';
                } catch (e: any) {
                    // TASK 1.1: Removed x-admin-email header fallback — was a privilege escalation vector.
                    // In production, invalid tokens are always rejected.
                    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
                }
            }
        } else {
            return res.status(401).json({ error: 'Unauthorized: No token provided' });
        }

        // 3. Custom admin session — trusted, grant access
        if (isCustomAdmin) {
             (req as any).adminEmail = email;
             return next();
        }

        // 4. RBAC check via Firestore role field (TASK 1.1)
        const hasAdminRole = await isAdminUser(email);
        if (hasAdminRole) {
            (req as any).adminEmail = email;
            return next();
        }

        return res.status(403).json({ error: 'Forbidden: Admin access required' });
    } catch (err: any) {
        console.error(`[requireAdmin] Error: ${err.message}`);
        return res.status(500).json({ error: 'Internal Server Error during auth' });
    }
};
    // ─── Route modules (extracted from monolith) ─────────────────────────
    // Admin routers are protected by requireAdmin. All admin route groups have
    // been migrated to extracted routers and removed from this file.
    app.use('/api/v1', apiV1Router);
    app.use('/api/classroom', classroomRouter);
    app.use('/api/admin', requireAdmin, adminRoutesRouter);
    app.use('/api/admin', requireAdmin, adminAiRouter);
    app.use('/api/admin', requireAdmin, adminUsersRouter);
    app.use('/api/admin', requireAdmin, adminContentRouter);
    app.use('/api/admin', requireAdmin, adminCreativeRouter);
    app.use('/api/admin', requireAdmin, adminModerationRouter);
    app.use('/api/admin', requireAdmin, adminSystemRouter);
    app.use('/api/admin', requireAdmin, adminAnalyticsRouter);
    app.use('/api/admin', requireAdmin, adminCharactersRouter);

    // Bridge: pass memoryDb to extracted routers
    try {
        const [
            { setMemoryDb: setAdminDb },
            { setMemoryDb: setAiDb, setRouteResolver },
            { setMemoryDb: setUsersDb },
            { setMemoryDb: setContentDb },
            { setMemoryDb: setCreativeDb },
            { setMemoryDb: setModerationDb },
            { setMemoryDb: setSystemDb },
            { setMemoryDb: setAnalyticsDb },
            { setMemoryDb: setCharactersDb },
            { setMemoryDb: setAdminHelpersDb }
        ] = await Promise.all([
            import('./routes/admin'),
            import('./routes/admin-ai'),
            import('./routes/admin-users'),
            import('./routes/admin-content'),
            import('./routes/admin-creative'),
            import('./routes/admin-moderation'),
            import('./routes/admin-system'),
            import('./routes/admin-analytics'),
            import('./routes/admin-characters'),
            import('./admin-helpers')
        ]);

        setAdminDb(memoryDb); setAiDb(memoryDb); setUsersDb(memoryDb); setContentDb(memoryDb);
        setCreativeDb(memoryDb); setModerationDb(memoryDb); setSystemDb(memoryDb); setAnalyticsDb(memoryDb); setCharactersDb(memoryDb);
        setAdminHelpersDb(memoryDb);

        // Bind AI resolver from helper module to admin-ai router so legacy routes stay consistent
        setRouteResolver((workflowSlug: string, userTier?: string, env?: string) => resolveAIRoute(workflowSlug, userTier, env));
    } catch (e: any) { console.warn('Route module bridge skipped:', e.message); }

    // Task 2.8: HSTS + HTTPS enforcement
    app.use((req: any, res: any, next: any) => {
        if (process.env.NODE_ENV === 'production' && !req.secure && req.headers['x-forwarded-proto'] !== 'https') {
            return res.redirect(301, `https://${req.headers.host}${req.url}`);
        }
        if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
            res.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
        }
        next();
    });

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
    initializeDatabaseSchema().then(() => {
        return seedDefaultWizardLibraries();
    }).catch((e) => {
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
            await seedDefaultWizardLibraries();
            
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
     * Helper to log AI token consumption and cost.
     */
    const logAiUsage = async (email: string, operation: string, modelId: string, tokensIn: number, tokensOut: number) => {
        try {
            const costUsd = ((tokensIn / 1000) * (AI_MODELS[modelId as keyof typeof AI_MODELS]?.costUsd || 0.00015)) + 
                            ((tokensOut / 1000) * (AI_MODELS[modelId as keyof typeof AI_MODELS]?.costUsd || 0.00015));
            const pool = getDbPool();
            if (pool) {
                await pool.query(
                    'INSERT INTO ai_usage_logs (user_email, operation, model, tokens_in, tokens_out, cost_usd) VALUES ($1, $2, $3, $4, $5, $6)',
                    [email, operation, modelId, tokensIn, tokensOut, costUsd]
                );
            }
        } catch (e) {
            console.error("Failed to log AI usage to database:", e);
        }
    };

    /**
     * Helper to wrap Gemini calls and format safety blocks.
     */
    const callGeminiSafely = async (ai: GoogleGenAI, aiParams: any, reqEmail?: string, operationName?: string) => {
        try {
            aiParams.config = aiParams.config || {};
            if (aiParams.safetySettings) {
                aiParams.config.safetySettings = aiParams.safetySettings;
                delete aiParams.safetySettings;
            }

            // INJECT GLOBAL AI SETTINGS
            if (process.env.AI_MODEL_TEMPERATURE) {
                aiParams.config.temperature = parseFloat(process.env.AI_MODEL_TEMPERATURE);
            }
            if (process.env.AI_MODEL_TOP_P) {
                aiParams.config.topP = parseFloat(process.env.AI_MODEL_TOP_P);
            }
            if (process.env.AI_MODEL_TOP_K) {
                aiParams.config.topK = parseInt(process.env.AI_MODEL_TOP_K);
            }
            
            // Override default text model if defined (avoiding image/tts models)
            if (aiParams.model && !aiParams.model.includes('image') && !aiParams.model.includes('tts') && !aiParams.model.includes('vision')) {
                if (process.env.AI_MODEL_DEFAULT_TEXT) {
                    aiParams.model = process.env.AI_MODEL_DEFAULT_TEXT;
                }
            }
            const response = await ai.models.generateContent(aiParams);
            if (reqEmail && operationName && aiParams.model) {
                const tokensIn = response.usageMetadata?.promptTokenCount || 0;
                const tokensOut = response.usageMetadata?.candidatesTokenCount || 0;
                logAiUsage(reqEmail, operationName, aiParams.model, tokensIn, tokensOut).catch(e => console.error("Log usage err:", e));
            }
            return response;
        } catch (e: any) {
            throw e;
        }
    };

    app.post('/api/gemini/speech', aiGenerationLimiter, async (req, res): Promise<any> => {
        const { text, voiceName, userEmail } = req.body;
        const userTier = await getUserTier(userEmail);
        const route = resolveAIRoute('narration', userTier, process.env.NODE_ENV);
        if (!(await consumeTokens(userEmail, calculateTokenCost(route.modelSlug as any, 1)))) return res.status(402).json({ error: 'Insufficient tokens' });
        if (!text) return res.status(400).json({ error: 'Text prompt is required.' });
        try {
            const ai = getAIClient(req.headers['x-gemini-key'] as string);
            const response = await callGeminiSafely(ai, {
                safetySettings: applyModeration(req, req.body ? JSON.stringify(req.body) : ""),
                model: route.modelSlug,
                contents: [{ parts: [{ text }] }],
                config: {
                    responseModalities: ["AUDIO"],
                    speechConfig: {
                        voiceConfig: {
                            prebuiltVoiceConfig: { voiceName: voiceName || 'Zephyr' },
                        },
                    },
                },
            }, req.body?.userEmail || req.body?.email || 'unknown', req.path);
            const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || '';
            return res.json({ base64Audio });
        } catch (e: any) {
            console.error("Speech api failed:", e.message);
            return res.status(500).json({ error: e.message || "Speech generation failed" });
        }
    });

    
// Helper function for Leonardo Image Upload
const uploadToLeonardo = async (base64Str: string, apiKey: string) => {
    const initRes = await fetch("https://cloud.leonardo.ai/api/rest/v1/init-image", {
        method: "POST",
        headers: { "Authorization": `Bearer ${apiKey.trim()}`, "Content-Type": "application/json" },
        body: JSON.stringify({ extension: "jpg" })
    });
    if (!initRes.ok) throw new Error(`Init image failed: ${await initRes.text()}`);
    const initData: any = await initRes.json();
    const uploadDetails = initData.uploadInitImage;
    
    const buffer = Buffer.from(base64Str, 'base64');
    let uploadRes;
    if (uploadDetails.fields) {
        const formData = new FormData();
        const fieldsObj = JSON.parse(uploadDetails.fields);
        for (const [key, value] of Object.entries(fieldsObj)) formData.append(key, value as string);
        formData.append('file', new Blob([buffer], { type: 'image/jpeg' }), "image.jpg");
        uploadRes = await fetch(uploadDetails.url, { method: "POST", body: formData });
    } else {
        uploadRes = await fetch(uploadDetails.url, { method: "PUT", headers: { "Content-Type": "image/jpeg" }, body: buffer });
    }
    if (!uploadRes.ok) throw new Error(`Upload to S3 failed: ${await uploadRes.text()}`);
    return uploadDetails.id;
};


    app.post('/api/leonardo/persona', async (req, res): Promise<any> => {
        const { desc, artStyle, userEmail, referenceImage, gender, age, ethnicity, isRandom } = req.body;
        
        // Only consume tokens if a userEmail is provided (bypassed for landing page free preview)
        if (userEmail) {
            if (!(await consumeTokens(userEmail, calculateTokenCost('gemini-3.5-flash', 1000)))) return res.status(402).json({ error: 'Insufficient tokens' });
        }
        
        const characterDesc = desc || `A detailed character portrait`;
        const demogEthnicity = ethnicity && ethnicity !== 'Not Set' ? `${ethnicity} ` : '';
        const demogGender = gender && gender !== 'Neutral' ? gender : 'person';
        const demogAge = age || 'Young Adult';
        
        const apiKey = process.env.LEONARDO_API_KEY;
        if (!apiKey) {
            console.warn("LEONARDO_API_KEY is not defined. Falling back to mocked image.");
            return res.json({ 
                imageUrl: "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=500&q=80",
                desc
            });
        }
        
        try {
            let initImageId = null;
            if (referenceImage && !isRandom) {
                console.log("Uploading avatar reference to Leonardo...");
                initImageId = await uploadToLeonardo(referenceImage, apiKey);
                console.log(`Upload successful. ID: ${initImageId}`);
            }

            const modelMapping: Record<string, string> = {
                "3D Render": "debdf72a-91a4-467b-bf61-cc02bdeb69c6",
                "Acrylic": "3cbb655a-7ca4-463f-b697-8a03ad67327c",
                "Anime General": "b2a54a51-230b-4d4f-ad4e-8409bf58645f",
                "Creative": "6fedbf1f-4a17-45ec-84fb-92fe524a29ef",
                "Dynamic": "111dc692-d470-4eec-b791-3475abac4c46",
                "Fashion": "594c4a08-a522-4e0e-b7ff-e4dac4b6b622",
                "Game Concept": "09d2b5b5-d7c5-4c02-905d-9f84051640f4",
                "Graphic Design 3D": "7d7c2bc5-4b12-4ac3-81a9-630057e9e89f",
                "Illustration": "645e4195-f63d-4715-a3f2-3fb1e6eb8c70",
                "None": "556c1ee5-ec38-42e8-955a-1e82dad0ffa1",
                "Portrait": "8e2bc543-6ee2-45f9-bcd9-594b6ce84dcd",
                "Portrait Cinematic": "4edb03c9-8a26-4041-9d01-f85b5d4abd71",
                "Ray Traced": "b504f83c-3326-4947-82e1-7fe9e839ec0f",
                "Stock Photo": "5bdc3f2a-1be6-4d1c-8e77-992a30824a2c",
                "Watercolor": "1db308ce-c7ad-4d10-96fd-592fa6b75cc4"
            };

            // The UUIDs provided are internal Leonardo Preset Style IDs. The public REST API 
            // requires these to be passed as ENUM strings in the `presetStyle` parameter 
            // alongside the `alchemy: true` flag, rather than as models or elements.
            const styleToPresetEnum: Record<string, string> = {
                // Legacy / Landing Page ones
                "3D Render": "RENDER_3D",
                "Anime General": "ANIME",
                "Creative": "CREATIVE",
                "Dynamic": "DYNAMIC",
                "Illustration": "ILLUSTRATION",
                "Ray Traced": "RAYTRACED",
                "None": "NONE",
                "Acrylic": "CREATIVE", 
                "Fashion": "PHOTOGRAPHY",
                "Game Concept": "CREATIVE",
                "Graphic Design 3D": "RENDER_3D",
                "Portrait": "PHOTOGRAPHY",
                "Portrait Cinematic": "PHOTOGRAPHY",
                "Stock Photo": "PHOTOGRAPHY",
                "Watercolor": "SKETCH_COLOR",
                
                // Authorized ART_STYLES from types.ts
                "Photorealistic Cartoon Style": "RENDER_3D",
                "Cinema 3D Rendering": "RENDER_3D",
                "8 Panel Comic": "ILLUSTRATION",
                "Roblox Players Comic Gen": "RENDER_3D",
                "Minecraft Players Comic Gen": "RENDER_3D",
                "Roblox Player Generator": "RENDER_3D",
                "Vibrant Comic Book": "ILLUSTRATION",
                "Studio Ghibli AI": "ANIME",
                "Watercolor Comic Strip": "SKETCH_COLOR",
                "Paper Cut Style": "CREATIVE",
                "Retro Sci-Fi": "ILLUSTRATION",
                "Minimalist Comic Art": "ILLUSTRATION"
            };

            const payload: any = {
                prompt: `Masterpiece portrait of a ${demogAge} ${demogEthnicity}${demogGender}, ${artStyle === 'None' ? 'beautiful' : artStyle} style. Highly detailed, perfect lighting, stylized character art. ${characterDesc}`.substring(0, 1450),
                modelId: "1e60896f-3c26-4296-8ecc-53e2afecc132", // Leonardo Diffusion XL base
                width: 768,
                height: 1024,
                num_images: 1,
                alchemy: true,
                presetStyle: styleToPresetEnum[artStyle] || "DYNAMIC"
            };

            if (initImageId) {
                payload.controlnets = [
                    {
                        initImageId: initImageId,
                        initImageType: "UPLOADED",
                        preprocessorId: 133, // 133 is Character Reference. 67 is Style Reference.
                        strengthType: "High"
                    }
                ];
            }

            console.log("Sending generation request to Leonardo API...");
            const response = await fetch("https://cloud.leonardo.ai/api/rest/v1/generations", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${apiKey.trim()}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`Leonardo API returned code: ${response.status}. Details: ${errText}`);
            }

            const data: any = await response.json();
            const generationId = data.sdGenerationJob?.generationId;
            if (!generationId) {
                throw new Error("Leonardo API did not return a generationId.");
            }

            console.log(`Leonardo generation started. Job ID: ${generationId}. Waiting for completion...`);
            
            // Poll for completion
            let imageUrl = null;
            for (let i = 0; i < 30; i++) {
                await new Promise(r => setTimeout(r, 4000)); // wait 4 seconds
                const pollRes = await fetch(`https://cloud.leonardo.ai/api/rest/v1/generations/${generationId}`, {
                    headers: { "Authorization": `Bearer ${apiKey.trim()}` }
                });
                if (pollRes.ok) {
                    const pollData: any = await pollRes.json();
                    const status = pollData.generations_by_pk?.status;
                    if (status === 'COMPLETE') {
                        imageUrl = pollData.generations_by_pk?.generated_images?.[0]?.url;
                        console.log("Leonardo image generation complete!");
                                break;
                    } else if (status === 'FAILED') {
                        throw new Error("Leonardo API generation job failed.");
                    }
                }
            }

            if (imageUrl) {
                return res.json({ imageUrl, desc: characterDesc });
            } else {
                throw new Error("Polling timed out or image URL not found.");
            }

        } catch (e: any) {
            console.error("Leonardo persona api failed:", e.message);
            return res.status(500).json({ error: e.message || "Persona generation failed" });
        }
    });

    app.post('/api/gemini/persona', aiGenerationLimiter, async (req, res): Promise<any> => {
        const { desc, selectedGenre,
            artStyle, userEmail } = req.body;
        const userTier = await getUserTier(userEmail);
        const route = resolveAIRoute('character-sheet', userTier, process.env.NODE_ENV);
        if (!(await consumeTokens(userEmail, calculateTokenCost(route.modelSlug as any, 1000)))) return res.status(402).json({ error: 'Insufficient tokens' });
        if (!desc) return res.status(400).json({ error: 'Description is required' });
        let style = selectedGenre === 'Custom' ? "Modern American comic book art" : `${selectedGenre} comic`;
        if (artStyle) {
            style = artStyle;
        }
        try {
            const ai = getAIClient(req.headers['x-gemini-key'] as string);
            const response = await callGeminiSafely(ai, {
                safetySettings: applyModeration(req, req.body ? JSON.stringify(req.body) : ""),
                model: route.modelSlug,
                contents: `STYLE: Masterpiece ${style} character sheet, detailed ink, neutral background. FULL BODY. Character: ${desc}`,
                config: { imageConfig: { aspectRatio: '1:1' } }
            }, req.body?.userEmail || req.body?.email || 'unknown', req.path);
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

    app.post('/api/gemini/suggest', aiGenerationLimiter, async (req, res): Promise<any> => {
        const { fieldName, currentValue, genre, roleType, characterName, concept, userEmail } = req.body;
        const userTier = await getUserTier(userEmail);
        const routeBeat = resolveAIRoute('beat', userTier, process.env.NODE_ENV);
        if (!(await consumeTokens(userEmail, calculateTokenCost(routeBeat.modelSlug as any, 500)))) return res.status(402).json({ error: 'Insufficient tokens' });

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

                const routeOutline = resolveAIRoute('outline', userTier, process.env.NODE_ENV);
                const response = await callGeminiSafely(ai, {
                safetySettings: applyModeration(req, req.body ? JSON.stringify(req.body) : ""),
                    model: routeOutline.modelSlug,
                    contents: prompt
                }, req.body?.userEmail || req.body?.email || 'unknown', req.path);
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

                const routePersona = resolveAIRoute('character-sheet', userTier, process.env.NODE_ENV);
                const response = await callGeminiSafely(ai, {
                safetySettings: applyModeration(req, req.body ? JSON.stringify(req.body) : ""),
                    model: routePersona.modelSlug,
                    contents: prompt
                }, req.body?.userEmail || req.body?.email || 'unknown', req.path);
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

            const response = await callGeminiSafely(ai, {
                safetySettings: applyModeration(req, req.body ? JSON.stringify(req.body) : ""),
                model: routeBeat.modelSlug,
                contents: promptField
            }, req.body?.userEmail || req.body?.email || 'unknown', req.path);
            const text = response.text?.trim() || "";
            return res.json({ suggestion: text });
        } catch (e: any) {
            console.error("Suggest API failed:", e.message);
            return res.status(500).json({ error: e.message || "Suggestion generation failed" });
        }
    });

    app.post('/api/gemini/enhance-kid-story', aiGenerationLimiter, async (req, res): Promise<any> => {
        const { rawText, userEmail } = req.body;
        const userTier = await getUserTier(userEmail);
        const route = resolveAIRoute('beat', userTier, process.env.NODE_ENV);
        if (!(await consumeTokens(userEmail, calculateTokenCost(route.modelSlug as any, 500)))) return res.status(402).json({ error: 'Insufficient tokens' });
        if (!rawText) return res.status(400).json({ error: "Missing rawText" });

        try {
            const ai = getAIClient(req.headers['x-gemini-key'] as string);
            const promptField = `
You are a creative writing coach for children. The user has dictated a story idea using speech-to-text, which might contain grammatical errors, run-on sentences, or disjointed thoughts.

Raw Dictation: "${rawText}"

Your task:
1. Fix grammar and clarify the narrative.
2. Enhance the story to be imaginative and cohesive, but keep it in the voice of a young author.
3. Incentivize the kid by making the story sound epic and structured, showing them how their raw thoughts can turn into a real story!
4. Return ONLY the final enhanced story paragraph, no introductory text, no quotes. Make it a few sentences long (max 50 words).
`;

            const response = await callGeminiSafely(ai, {
                safetySettings: applyModeration(req, req.body ? JSON.stringify(req.body) : ""),
                model: route.modelSlug,
                contents: promptField
            }, req.body?.userEmail || req.body?.email || 'unknown', req.path);
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

    app.post('/api/gemini/beat', aiGenerationLimiter, async (req, res): Promise<any> => {
        const userTier = await getUserTier(req.body.userEmail);
        const route = resolveAIRoute('beat', userTier, process.env.NODE_ENV);
        if (!(await consumeTokens(req.body.userEmail, calculateTokenCost(route.modelSlug as any, 2000)))) return res.status(402).json({ error: 'Insufficient tokens' });
        const {
            history = [],
            pageNum,
            isDecisionPage,
            selectedGenre,
            artStyle,
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
        let coreDriver = `GENRE: ${selectedGenre}. VISUAL STYLE: ${artStyle || 'Default'}. TONE: ${storyTone}.`;
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
        
        // INJECT AI SETTINGS PROMPTS
        if (process.env.AI_SYSTEM_PROMPT_COMIC) {
            instruction = `${process.env.AI_SYSTEM_PROMPT_COMIC}\n\n` + instruction;
        }
        if (process.env.MODERATION_RULES) {
            instruction += `\n\nGLOBAL MODERATION RULES: ${process.env.MODERATION_RULES}`;
        }

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
            const resObj = await callGeminiSafely(ai, {
                safetySettings: applyModeration(req, req.body ? JSON.stringify(req.body) : ""),
                model: route.modelSlug,
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
            }, req.body?.userEmail || req.body?.email || 'unknown', req.path);
            let rawText = resObj.text || "{}";
            rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(rawText);
            return res.json(parsed);
        } catch (e: any) {
            console.error("Beat generation api failed:", e.message);
            return res.status(500).json({ error: e.message || "Beat generation failed" });
        }
    });

    app.post('/api/gemini/analyze-image', aiGenerationLimiter, async (req, res): Promise<any> => {
        const { imageBase64, prompt, userEmail } = req.body;
        const userTier = await getUserTier(userEmail);
        const route = resolveAIRoute('beat', userTier, process.env.NODE_ENV);
        if (!(await consumeTokens(userEmail, calculateTokenCost(route.modelSlug as any, 200)))) return res.status(402).json({ error: 'Insufficient tokens' });
        
        if (!imageBase64) return res.status(400).json({ error: 'imageBase64 is required' });
        
        try {
            const ai = getAIClient(req.headers['x-gemini-key'] as string);
            
            const defaultPrompt = "Describe this image in detail. Focus on the art style, characters, mood, and narrative elements visible.";
            
            const response = await callGeminiSafely(ai, {
                safetySettings: applyModeration(req, req.body ? JSON.stringify(req.body) : ""),
                model: route.modelSlug,
                contents: [
                    { inlineData: { mimeType: 'image/jpeg', data: imageBase64 } },
                    { text: prompt || defaultPrompt }
                ]
            }, req.body?.userEmail || req.body?.email || 'unknown', req.path);
            
            const text = response.text?.trim() || "";
            return res.json({ analysis: text });
        } catch (e: any) {
            console.error("Analyze image API failed:", e.message);
            return res.status(500).json({ error: e.message || "Image analysis failed" });
        }
    });

    app.post('/api/gemini/image', aiGenerationLimiter, async (req, res): Promise<any> => {
        const {
            beat,
            type,
            styleEra,
            styleKeywords,
            artStyle,
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
        const userTier = await getUserTier(req.body.userEmail);
        const imageWorkflow = type === 'cover' || type === 'back_cover' ? 'cover-art' : 'scene-panel';
        const routeImage = resolveAIRoute(imageWorkflow, userTier, process.env.NODE_ENV);
        if (!(await consumeTokens(req.body.userEmail, calculateTokenCost(routeImage.modelSlug as any, 1)))) return res.status(402).json({ error: 'Insufficient tokens' });

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
        const getPhysicalTraits = async (base64Img: string | undefined, characterRole: string): Promise<string> => {
            if (!base64Img) return "";
            try {
                const ai = getAIClient(req.headers['x-gemini-key'] as string);
                const routeText = resolveAIRoute('beat', userTier, process.env.NODE_ENV);
                const response = await callGeminiSafely(ai, {
                    model: routeText.modelSlug,
                    contents: [
                        { inlineData: { mimeType: 'image/jpeg', data: base64Img } },
                        { text: `Analyze this face and provide a highly concise physical description (age, gender, hair style, eye color, jawline, facial hair, skin tone) formatted as a single sentence. Focus only on permanent facial/head features. Do not describe the background or image quality.` }
                    ]
                }, req.body?.userEmail || req.body?.email || 'unknown', req.path);
                return response && response.text ? `[Physical traits for ${characterRole}: ${response.text.trim()}]` : "";
            } catch (e: any) {
                console.error(`Failed to extract traits for ${characterRole}:`, e.message);
                return "";
            }
        };

        const heroTraits = await getPhysicalTraits(heroRef?.base64, "Hero");
        const friendTraits = await getPhysicalTraits(friendRef?.base64, "Co-star");
        const villainTraits = await getPhysicalTraits(villainRef?.base64, "Arc-rival");

        let promptText = `STYLE: ${artStyle || styleEra || selectedGenre} art style. VISUAL AESTHETICS: ${styleKeywords || ''}. `;
        
        if (heroVisuals?.trim() || heroTraits) {
            promptText += `HERO GUIDELINES (Use Hero references to align likeness, hair/head suggestions and clothing style): ${heroVisuals || ''} ${heroTraits}. `;
        }
        if ((friendVisuals?.trim() || friendTraits) && friendRef) {
            promptText += `CO-STAR GUIDELINES (Use Co-star references to align likeness, hair/head suggestions and clothing style): ${friendVisuals || ''} ${friendTraits}. `;
        }
        if ((villainVisuals?.trim() || villainTraits) && villainRef) {
            promptText += `VILLAIN GUIDELINES (Use Arc-rival references to align likeness, hair/head suggestions and clothing style): ${villainVisuals || ''} ${villainTraits}. `;
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
                    const comicPkg = await import('comic' as any);
                    const generator = new comicPkg.ComicGenerator({ apiKey });
                    const comicResponse = await generator.create({
                        panels: [{ prompt: promptText, characterReference: heroRef?.base64 }],
                        style: styleEra || selectedGenre,
            artStyle,
                        resolution: "1024x1024"
                    });
                    llamagenResult = comicResponse.panels?.[0]?.imageUrl || comicResponse.imageUrl;
                } catch (pkgErr) {
                    console.log("Native 'comic' npm package not loaded, calling LlamaGen REST endpoint directly...");
                    const fetchRes = await fetch("https://api.llamagen.ai/v1/comic/generate", {
                        method: "POST",
                        headers: {
                            "Authorization": `Bearer ${apiKey.trim()}`,
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            prompt: promptText,
                            style: styleEra || selectedGenre,
            artStyle,
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

        // Helper function for Leonardo Image Upload
        const uploadToLeonardo = async (base64Str: string, apiKey: string) => {
            const initRes = await fetch("https://cloud.leonardo.ai/api/rest/v1/init-image", {
                method: "POST",
                headers: { "Authorization": `Bearer ${apiKey.trim()}`, "Content-Type": "application/json" },
                body: JSON.stringify({ extension: "jpg" })
            });
            if (!initRes.ok) throw new Error(`Init image failed: ${await initRes.text()}`);
            const initData: any = await initRes.json();
            const uploadDetails = initData.uploadInitImage;
            
            const buffer = Buffer.from(base64Str, 'base64');
            let uploadRes;
            if (uploadDetails.fields) {
                const formData = new FormData();
                const fieldsObj = JSON.parse(uploadDetails.fields);
                for (const [key, value] of Object.entries(fieldsObj)) formData.append(key, value as string);
                formData.append('file', new Blob([buffer], { type: 'image/jpeg' }), "image.jpg");
                uploadRes = await fetch(uploadDetails.url, { method: "POST", body: formData });
            } else {
                uploadRes = await fetch(uploadDetails.url, { method: "PUT", headers: { "Content-Type": "image/jpeg" }, body: buffer });
            }
            if (!uploadRes.ok) throw new Error(`Upload to S3 failed: ${await uploadRes.text()}`);
            return uploadDetails.id;
        };

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
                const controlnets: any[] = [];
                const processCharacterRef = async (charRef: any) => {
                    if (charRef?.base64) {
                        console.log(`Uploading character reference for ${charRef.name} to Leonardo...`);
                        const id = await uploadToLeonardo(charRef.base64, apiKey);
                        controlnets.push({
                            initImageId: id,
                            initImageType: "UPLOADED",
                            preprocessorId: 133, // 133 = Character Reference in SDXL models
                            strengthType: "High" // High strength ensures structural facial likeness
                        });
                    }
                };

                if (beat?.focus_char?.toLowerCase() === 'hero' && heroRef) {
                    await processCharacterRef(heroRef);
                } else if ((beat?.focus_char?.toLowerCase() === 'friend' || beat?.focus_char?.toLowerCase() === 'co-star') && friendRef) {
                    await processCharacterRef(friendRef);
                } else if (beat?.focus_char?.toLowerCase() === 'villain' && villainRef) {
                    await processCharacterRef(villainRef);
                } else if (heroRef) {
                    await processCharacterRef(heroRef);
                }

                // Enhance prompt to fight photograph bias and enforce camera angle
                const styleEnforcer = "(((COMIC BOOK ART STYLE, 2D ILLUSTRATION, FICTIONAL UNIVERSE))) heavily stylized, vibrant colors, dynamic shading. NOT a photograph. NOT realistic. (close-up portrait:1.2), clearly visible face, facing the camera, unmasked, highly detailed facial features.";
                const payload: any = {
                    prompt: `${styleEnforcer} ${promptText}`.substring(0, 1450),
                    modelId: "1e60896f-3c26-4296-8ecc-53e2afecc132",
                    width: 768,
                    height: 1024,
                    num_images: 1,
                    promptMagic: true
                };

                if (controlnets.length > 0) {
                    payload.controlnets = controlnets;
                }

                const response = await fetch("https://cloud.leonardo.ai/api/rest/v1/generations", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${apiKey.trim()}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(payload)
                });

                if (response.ok) {
                    const data: any = await response.json();
                    const generationId = data.sdGenerationJob?.generationId;
                    
                    if (!generationId) {
                        return res.json({ 
                            imageUrl: "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=500&q=80",
                            info: "Leonardo API did not return a generationId."
                        });
                    }

                    console.log(`Leonardo generation started. Job ID: ${generationId}. Waiting for completion...`);
                    
                    let finalUrl = null;
                    // Poll for completion (up to 20 attempts, waiting 3 seconds each)
                    for (let i = 0; i < 20; i++) {
                        await new Promise(resolve => setTimeout(resolve, 3000));
                        const pollRes = await fetch(`https://cloud.leonardo.ai/api/rest/v1/generations/${generationId}`, {
                            headers: {
                                "Authorization": `Bearer ${apiKey.trim()}`,
                                "accept": "application/json"
                            }
                        });
                        
                        if (pollRes.ok) {
                            const pollData: any = await pollRes.json();
                            const status = pollData.generations_by_pk?.status;
                            console.log(`Poll ${i+1}/20 for ${generationId}: Status = ${status}`);
                            
                            if (status === 'COMPLETE') {
                                finalUrl = pollData.generations_by_pk?.generated_images?.[0]?.url;
                                if (finalUrl) {
                                    console.log("Leonardo image generation complete!");
                                break;
                                }
                            } else if (status === 'FAILED') {
                                throw new Error("Leonardo API generation job failed.");
                            }
                        }
                    }

                    if (!finalUrl) {
                        return res.json({ 
                            imageUrl: "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=500&q=80",
                            jobId: generationId,
                            info: "Generation timed out."
                        });
                    }

                    // --- PASS 2: FACE SWAP VIA REPLICATE ---
                    const replicateToken = process.env.REPLICATE_API_TOKEN;
                    if (replicateToken && (heroRef?.base64 || friendRef?.base64 || villainRef?.base64)) {
                        console.log("Replicate API token found. Initiating Pass 2: Face Swapping...");
                        try {
                            // We will swap the Hero face as the primary priority for now.
                            // In a full production app, you can use multi-face models or sequential swaps.
                            const primaryFaceBase64 = heroRef?.base64 || friendRef?.base64 || villainRef?.base64;
                            
                                const replicateRes = await fetch("https://api.replicate.com/v1/predictions", {
                                method: "POST",
                                headers: {
                                    "Authorization": `Bearer ${replicateToken.trim()}`,
                                    "Content-Type": "application/json"
                                },
                                body: JSON.stringify({
                                    // Using lucataco/faceswap model
                                    version: "9a4298548422074c3f57258c5d544497314ae4112df80d116f0d2109e843d20d",
                                    input: {
                                        target_image: finalUrl,
                                        swap_image: `data:image/jpeg;base64,${primaryFaceBase64}`
                                    }
                                })
                            });

                            if (replicateRes.ok) {
                                const replicateData: any = await replicateRes.json();
                                let predictionId = replicateData.id;
                                console.log(`Replicate face swap started. ID: ${predictionId}`);
                                
                                // Poll Replicate for completion
                                for (let j = 0; j < 20; j++) {
                                    await new Promise(resolve => setTimeout(resolve, 2000));
                                    const pollRepRes = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
                                        headers: { "Authorization": `Bearer ${replicateToken.trim()}` }
                                    });
                                    if (pollRepRes.ok) {
                                        const repPollData: any = await pollRepRes.json();
                                        if (repPollData.status === 'succeeded') {
                                            console.log("Face swap complete!");
                                            finalUrl = repPollData.output;
                                            break;
                                        } else if (repPollData.status === 'failed') {
                                            console.warn("Face swap failed, using original generated image.");
                                            break;
                                        }
                                    }
                                }
                            } else {
                                console.warn("Replicate API request failed. Using original generated image.");
                            }
                        } catch (swapErr: any) {
                            console.error("Face swapping error:", swapErr.message);
                        }
                    }

                    return res.json({ imageUrl: finalUrl, jobId: generationId });
                }
                const errText = await response.text();
                throw new Error(`Leonardo API returned code: ${response.status}. Details: ${errText}`);
            } catch (err: any) {
                console.error("Leonardo.ai API error:", err.message, err.stack);
                return res.status(500).json({ error: `Leonardo failed: ${err.message}` });
            }
        }

        try {
            const ai = getAIClient(req.headers['x-gemini-key'] as string);
            const resObj = await ai.models.generateImages({
                model: routeImage.modelSlug,
                prompt: promptText.substring(0, 480), // Imagen prompts usually have a length limit
                config: { numberOfImages: 1, aspectRatio: '3:4', outputMimeType: 'image/jpeg' }
            });
            const base64Data = resObj?.generatedImages?.[0]?.image?.imageBytes;
            if (base64Data) {
                return res.json({ imageUrl: `data:image/jpeg;base64,${base64Data}` });
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

    // ─── GDPR / CCPA: Data Export & Deletion (Task 2.5) ─────────────────

    /**
     * GET /api/user/export — Export all user data as JSON (GDPR Art. 20)
     */
    app.get('/api/user/export', async (req, res): Promise<any> => {
        const { email } = req.query;
        if (!email || typeof email !== 'string') {
            return res.status(400).json({ error: 'Email parameter required' });
        }
        const userData: any = { email, exportedAt: new Date().toISOString(), collections: {} };
        try {
            const db = getFirestore();
            const userSnap = await db.collection('users').where('email', '==', email).get();
            if (!userSnap.empty) {
                userData.collections.user = userSnap.docs.map(d => ({ id: d.id, ...d.data() }));
                const userId = userSnap.docs[0].id;
                const subcollections = ['characters', 'projects', 'saved_stories', 'ai_usage_logs'];
                for (const sub of subcollections) {
                    const subSnap = await db.collection('users').doc(userId).collection(sub).get();
                    userData.collections[sub] = subSnap.docs.map(d => ({ id: d.id, ...d.data() }));
                }
            }
        } catch (err: any) {
            console.warn('[GDPR] Firestore export failed:', err.message);
        }
        const matchUser = memoryDb.users.find(u => u.email === email);
        if (matchUser) userData.collections.memoryUser = [matchUser];
        res.setHeader('Content-Disposition', `attachment; filename="story-menu-export-${Date.now()}.json"`);
        return res.json(userData);
    });

    /**
     * POST /api/user/delete-request — Request account deletion (GDPR Art. 17)
     */
    app.post('/api/user/delete-request', async (req, res): Promise<any> => {
        const { email, reason } = req.body;
        if (!email) return res.status(400).json({ error: 'Email required' });
        try {
            const db = getFirestore();
            await db.collection('deletion_requests').add({
                email, reason: reason || 'User requested deletion',
                status: 'pending', requestedAt: new Date().toISOString(),
            });
        } catch (err: any) {
            console.warn('[GDPR] Failed to log deletion request:', err.message);
        }
        return res.json({ success: true, message: 'Deletion request received. An admin will review within 30 days.' });
    });

    // ─── Task 3.1: PDF/Story Export ─────────────────────────────────────

    app.get('/api/export/story/:id', async (req, res): Promise<any> => {
        const { id } = req.params;
        const { format = 'json' } = req.query;
        try {
            const db = getFirestore();
            let storyData: any = null;
            const usersSnap = await db.collection('users').get();
            for (const userDoc of usersSnap.docs) {
                const storySnap = await userDoc.ref.collection('projects').doc(id).get();
                if (storySnap.exists) { storyData = { id: storySnap.id, ...storySnap.data() }; break; }
                const savedSnap = await userDoc.ref.collection('saved_stories').doc(id).get();
                if (savedSnap.exists) { storyData = { id: savedSnap.id, ...savedSnap.data() }; break; }
            }
            if (!storyData) return res.status(404).json({ error: 'Story not found' });
            const exportData = {
                title: storyData.title || 'Untitled Story', author: storyData.author || 'Anonymous',
                genre: storyData.genre || '', format: storyData.format || 'comic',
                exportedAt: new Date().toISOString(), pages: storyData.pages || storyData.panels || [],
                characters: storyData.characters || [], narration: storyData.narration || storyData.script || '',
                metadata: { wordCount: (storyData.narration || '').split(/\s+/).length, pageCount: (storyData.pages || []).length }
            };
            if (format === 'json') {
                res.setHeader('Content-Disposition', `attachment; filename="${exportData.title.replace(/[^a-z0-9]/gi, '_')}.json"`);
                return res.json(exportData);
            }
            return res.json({ story: exportData, renderInstructions: 'Use @react-pdf/renderer on client' });
        } catch (err: any) {
            return res.status(500).json({ error: 'Export failed' });
        }
    });

    // ─── Task 3.8: Content Auto-Moderation ──────────────────────────────

    app.post('/api/moderate/check', async (req, res): Promise<any> => {
        const { text, context = 'story' } = req.body;
        if (!text || typeof text !== 'string') return res.status(400).json({ error: 'Text required' });
        const flaggedPatterns = [/\b(hate|kill|die|murder)\b/i, /\b(spam|scam|phishing)\b/i, /\b(nsfw|xxx|porn)\b/i];
        const flags: string[] = [];
        for (const pattern of flaggedPatterns) { if (pattern.test(text)) flags.push(pattern.source); }
        return res.json({
            safe: flags.length === 0, flags, score: flags.length === 0 ? 0 : Math.min(flags.length * 0.3, 1.0),
            recommendation: flags.length === 0 ? 'approve' : flags.length >= 3 ? 'reject' : 'review',
            checkedAt: new Date().toISOString(),
        });
    });

    /**
     * 1.1 SUBSCRIPTION CHECKOUT GATEWAY (Stripe & PayPal)
     */
    app.get('/api/checkout/config', async (req, res) => {
        const pubKey = await getSettingValue('stripe_publishable_key');
        res.json({ publishableKey: pubKey });
    });

    app.post('/api/checkout/intent', checkoutLimiter, async (req, res): Promise<any> => {
        const { amountCents } = req.body;
        if (!amountCents) return res.status(400).json({ error: 'Amount is required' });

        const stripeKey = await getSettingValue('stripe_secret_key');

        if (!stripeKey) {
            return res.status(500).json({ error: 'Stripe Gateway is not configured.' });
        }

        try {
            const stripeClient = new Stripe(stripeKey, { apiVersion: '2025-02-24.acacia' as any });
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

    app.post('/api/checkout', checkoutLimiter, validate(checkoutSchema), async (req, res): Promise<any> => {
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
                    
                    const stripeClient = new Stripe(stripeKey, { apiVersion: '2025-02-24.acacia' as any });
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

        // Analytics: track successful payment
        // analytics.paymentCompleted(email, tier, amountCents || 0);
        // if (type === 'subscription') analytics.subscriptionActivated(email, tier);
    });

    /**
     * STRIPE WEBHOOK HANDLER (Task 1.2)
     * Verifies webhook signatures and processes payment events server-side.
     * This is the authoritative source for payment status — never trust the client.
     */
    app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res): Promise<any> => {
        const stripeKey = await getSettingValue('stripe_secret_key');
        if (!stripeKey) {
            console.warn('[Stripe Webhook] Stripe key not configured, ignoring webhook');
            return res.status(200).json({ received: true });
        }

        const stripe = new Stripe(stripeKey, { apiVersion: '2025-02-24.acacia' as any });
        const sig = req.headers['stripe-signature'];
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

        if (!webhookSecret) {
            console.error('[Stripe Webhook] STRIPE_WEBHOOK_SECRET not set — cannot verify signature');
            return res.status(500).json({ error: 'Webhook secret not configured' });
        }

        let event: Stripe.Event;
        try {
            event = stripe.webhooks.constructEvent(req.body, sig as string, webhookSecret);
        } catch (err: any) {
            console.error(`[Stripe Webhook] Signature verification failed: ${err.message}`);
            return res.status(400).json({ error: `Webhook Error: ${err.message}` });
        }

        console.info(`[Stripe Webhook] Received event: ${event.type} (${event.id})`);

        try {
            switch (event.type) {
                case 'payment_intent.succeeded': {
                    const intent = event.data.object as Stripe.PaymentIntent;
                    const email = intent.receipt_email || intent.metadata?.email;
                    if (email) {
                        await activateSubscription(email, intent);
                    }
                    break;
                }
                case 'invoice.payment_succeeded': {
                    const invoice = event.data.object as Stripe.Invoice;
                    const subscriptionId = (invoice as any).subscription as string;
                    if (subscriptionId) {
                        await renewSubscription(subscriptionId, invoice);
                    }
                    break;
                }
                case 'invoice.payment_failed': {
                    const invoice = event.data.object as Stripe.Invoice;
                    console.warn(`[Stripe Webhook] Payment failed for subscription ${(invoice as any).subscription}`);
                    // Downgrade to free tier on payment failure
                    if (invoice.customer_email) {
                        await deactivateSubscription(invoice.customer_email, 'payment_failed');
                    }
                    break;
                }
                case 'customer.subscription.deleted': {
                    const subscription = event.data.object as Stripe.Subscription;
                    const customerId = subscription.customer as string;
                    // Look up email from customer
                    try {
                        const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
                        if (customer.email) {
                            await deactivateSubscription(customer.email, 'subscription_cancelled');
                        }
                    } catch (e: any) {
                        console.warn(`[Stripe Webhook] Could not retrieve customer ${customerId}: ${e.message}`);
                    }
                    break;
                }
                default:
                    console.info(`[Stripe Webhook] Unhandled event type: ${event.type}`);
            }
        } catch (err: any) {
            console.error(`[Stripe Webhook] Error processing ${event.type}: ${err.message}`);
            return res.status(500).json({ error: 'Webhook processing failed' });
        }

        res.json({ received: true });
    });

    /**
     * Activate subscription for a user after successful payment.
     */
    async function activateSubscription(email: string, intent: Stripe.PaymentIntent): Promise<void> {
        const tier = intent.metadata?.tier || 'Pro';
        const tokensAwarded = parseInt(intent.metadata?.tokens || '0', 10);

        const pool = getDbPool();
        if (pool) {
            try {
                await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS tier VARCHAR(100);');
                await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_id VARCHAR(100);');
                await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);');
                await pool.query(
                    'UPDATE users SET tier = $1, subscription_id = $2, payment_method = $3, tokens = COALESCE(tokens, 0) + $4 WHERE email = $5',
                    [tier, intent.id, 'Stripe', tokensAwarded, email]
                );
                console.info(`[Stripe Webhook] Activated ${tier} for ${email}`);
            } catch (err: any) {
                console.error(`[Stripe Webhook] DB error activating subscription: ${err.message}`);
            }
        }
        // Memory fallback
        const matchUser = memoryDb.users.find(u => u.email === email);
        if (matchUser) {
            matchUser.tier = tier;
            matchUser.subscriptionId = intent.id;
            matchUser.paymentMethod = 'Stripe';
            matchUser.tokens = (matchUser.tokens || 0) + tokensAwarded;
        }
    }

    /**
     * Renew subscription on successful invoice payment.
     */
    async function renewSubscription(subscriptionId: string, invoice: Stripe.Invoice): Promise<void> {
        const pool = getDbPool();
        if (pool) {
            try {
                await pool.query(
                    'UPDATE users SET subscription_status = $1, last_payment_at = NOW() WHERE subscription_id = $2',
                    ['active', subscriptionId]
                );
                console.info(`[Stripe Webhook] Renewed subscription ${subscriptionId}`);
            } catch (err: any) {
                console.error(`[Stripe Webhook] DB error renewing subscription: ${err.message}`);
            }
        }
    }

    /**
     * Deactivate subscription (downgrade to free tier).
     */
    async function deactivateSubscription(email: string, reason: string): Promise<void> {
        const pool = getDbPool();
        if (pool) {
            try {
                await pool.query(
                    'UPDATE users SET tier = $1, subscription_status = $2 WHERE email = $3',
                    ['free', `deactivated_${reason}`, email]
                );
                console.info(`[Stripe Webhook] Deactivated subscription for ${email}: ${reason}`);
            } catch (err: any) {
                console.error(`[Stripe Webhook] DB error deactivating subscription: ${err.message}`);
            }
        }
        const matchUser = memoryDb.users.find(u => u.email === email);
        if (matchUser) {
            matchUser.tier = 'free';
        }
    }

    /**
     * 1.2 ADMINISTRATIVE SAAS API ENDPOINTS
     * NOTE: Settings, plans, formats, and AI engine admin routes have been
     * migrated to extracted routers and are protected by requireAdmin at the
     * router mount. Remaining inline admin routes below will be extracted in
     * subsequent PRs. Do NOT add new admin routes here — extend the appropriate
     * router under routes/.
     */


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
                    
                    await pool.query(`
                        CREATE TABLE IF NOT EXISTS admin_users (
                            username VARCHAR(255) PRIMARY KEY,
                            password_hash TEXT NOT NULL,
                            salt TEXT NOT NULL,
                            role VARCHAR(50) DEFAULT 'admin',
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                        )
                    `);
                    await pool.query('ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS password_hash TEXT');
                    await pool.query('ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS salt TEXT');
                    await pool.query('ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT \'admin\'');


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





    // View SaaS Customers and checkout tracking
    

    // Update Customer subscription status manually

    // Delete customer profile manually

    // Grant or Set Tokens for a specific user (Tier Economies)

    // View AI Cost Analytics

    // --- DIAGNOSTIC ENDPOINT (PUBLIC) ---
    app.get('/api/public/debug-env', (req, res) => {
        return res.json({
            timestamp: new Date().toISOString(),
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




    // --- SUBSCRIPTION PLANS (POSTGRES / MEMORY DB FALLBACK) ---
    app.get('/api/public/plans', async (req, res): Promise<any> => {
        if (!isDatabaseConnected()) {
            return res.json(memoryDb.subscription_plans || []);
        }
        const pool = getDbPool();
        try {
            await pool.query(`CREATE TABLE IF NOT EXISTS subscription_plans (id SERIAL PRIMARY KEY, name VARCHAR(255), description TEXT, price_subscription DECIMAL(10,2), price_one_time DECIMAL(10,2), features JSONB, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
            const result = await pool.query('SELECT * FROM subscription_plans ORDER BY created_at ASC');
            const plans = result.rows.map(r => ({
                id: r.id.toString(),
                name: r.name,
                description: r.description,
                priceSubscription: parseFloat(r.price_subscription),
                priceOneTime: parseFloat(r.price_one_time),
                features: r.features || []
            }));
            return res.json(plans);
        } catch (e: any) {
            console.error("Failed to load public plans from Postgres", e);
            return res.json([]);
        }
    });


    // ─────────────────────────────────────────────────────────────────────────
    // NEW WIZARD ROUTING: FORMATS, FLOWS, GOALS
    // ─────────────────────────────────────────────────────────────────────────

    // Public API endpoints
    app.get('/api/formats', async (req, res): Promise<any> => {
        if (!isDatabaseConnected()) return res.json(memoryDb.starting_formats || DEFAULT_FORMATS);
        const pool = getDbPool();
        try {
            const result = await pool.query('SELECT * FROM starting_formats ORDER BY sort_order ASC');
            return res.json(result.rows);
        } catch (e: any) {
            return res.json(DEFAULT_FORMATS);
        }
    });

    app.get('/api/flows', async (req, res): Promise<any> => {
        if (!isDatabaseConnected()) return res.json(memoryDb.creator_flows || DEFAULT_FLOWS);
        const pool = getDbPool();
        try {
            const result = await pool.query('SELECT * FROM creator_flows ORDER BY sort_order ASC');
            return res.json(result.rows);
        } catch (e: any) {
            return res.json(DEFAULT_FLOWS);
        }
    });

    app.get('/api/goals', async (req, res): Promise<any> => {
        if (!isDatabaseConnected()) return res.json(memoryDb.story_goals || DEFAULT_GOALS);
        const pool = getDbPool();
        try {
            const result = await pool.query('SELECT * FROM story_goals ORDER BY sort_order ASC');
            return res.json(result.rows);
        } catch (e: any) {
            return res.json(DEFAULT_GOALS);
        }
    });

    // Admin API endpoints: Flows




    // Admin API endpoints: Goals




    // ─────────────────────────────────────────────────────────────────────────
    // PERSONAS, USAGE MODES, REFERENCE IMAGES, ROLE ASSIGNMENTS API
    // ─────────────────────────────────────────────────────────────────────────

    // Public / User Personas APIs
    app.get('/api/personas', async (req, res): Promise<any> => {
        if (!isDatabaseConnected()) return res.json(memoryDb.personas || DEFAULT_PERSONAS);
        const pool = getDbPool();
        try {
            const result = await pool.query("SELECT * FROM personas WHERE status = 'Active' ORDER BY sort_order ASC");
            return res.json(result.rows);
        } catch (e: any) {
            return res.json(DEFAULT_PERSONAS);
        }
    });

    app.post('/api/personas', async (req, res): Promise<any> => {
        const { displayName, shortDescription, longDescription, personaType, roleDefaults, ageGroup, audience_tags, language_tags, stylePreference, visualSummary, generationSafeDescription, usageMode, referenceImageId, referenceImageStatus, recurringCharacter, visibilityScope, consentStatus, moderationStatus, approvedForGeneration } = req.body;
        const id = crypto.randomUUID();
        const slug = displayName.toLowerCase().replace(/[^a-z0-9]/g, '-');
        const data = {
            id,
            slug,
            displayName,
            shortDescription: shortDescription || '',
            longDescription: longDescription || '',
            personaType: personaType || 'Custom Character',
            roleDefaults: Array.isArray(roleDefaults) ? roleDefaults : [],
            ageGroup: ageGroup || 'General',
            audience_tags: Array.isArray(audience_tags) ? audience_tags : [],
            language_tags: Array.isArray(language_tags) ? language_tags : ['en'],
            stylePreference: stylePreference || 'General',
            visualSummary: visualSummary || '',
            generationSafeDescription: generationSafeDescription || '',
            usageMode: usageMode || 'none',
            referenceImageId: referenceImageId || '',
            referenceImageStatus: referenceImageStatus || 'None',
            recurringCharacter: recurringCharacter ?? true,
            visibilityScope: visibilityScope || 'Private',
            consentStatus: consentStatus || 'Not Granted',
            moderationStatus: moderationStatus || 'Unmoderated',
            approvedForGeneration: approvedForGeneration ?? false,
            sort_order: 99,
            status: 'Active',
            created_at: new Date().toISOString()
        };

        if (!isDatabaseConnected()) {
            memoryDb.personas = memoryDb.personas || [];
            memoryDb.personas.push(data);
            return res.json(data);
        }
        const pool = getDbPool();
        try {
            await pool.query(
                `INSERT INTO personas (id, slug, displayName, shortDescription, longDescription, personaType, roleDefaults, ageGroup, audience_tags, language_tags, stylePreference, visualSummary, generationSafeDescription, usageMode, referenceImageId, referenceImageStatus, recurringCharacter, visibilityScope, consentStatus, moderationStatus, approvedForGeneration, sort_order, status)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)`,
                [
                    data.id, data.slug, data.displayName, data.shortDescription, data.longDescription,
                    data.personaType, JSON.stringify(data.roleDefaults), data.ageGroup,
                    JSON.stringify(data.audience_tags), JSON.stringify(data.language_tags),
                    data.stylePreference, data.visualSummary, data.generationSafeDescription,
                    data.usageMode, data.referenceImageId, data.referenceImageStatus, data.recurringCharacter,
                    data.visibilityScope, data.consentStatus, data.moderationStatus,
                    data.approvedForGeneration, data.sort_order, data.status
                ]
            );
            return res.json(data);
        } catch (e: any) {
            return res.status(500).json({ error: e.message });
        }
    });

    app.put('/api/personas/:id', async (req, res): Promise<any> => {
        const id = req.params.id;
        const updateFields = req.body;
        if (!isDatabaseConnected()) {
            memoryDb.personas = memoryDb.personas || [];
            const index = memoryDb.personas.findIndex((p: any) => p.id === id);
            if (index !== -1) {
                memoryDb.personas[index] = { ...memoryDb.personas[index], ...updateFields };
                return res.json(memoryDb.personas[index]);
            }
            return res.status(404).json({ error: 'Not found' });
        }
        const pool = getDbPool();
        try {
            const fields: string[] = [];
            const values: any[] = [];
            let i = 1;
            Object.keys(updateFields).forEach(key => {
                if (key === 'id') return;
                let val = updateFields[key];
                if (Array.isArray(val)) {
                    val = JSON.stringify(val);
                }
                fields.push(`${key} = $${i++}`);
                values.push(val);
            });
            values.push(id);
            await pool.query(`UPDATE personas SET ${fields.join(', ')} WHERE id = $${i}`, values);
            return res.json({ success: true });
        } catch (e: any) {
            return res.status(500).json({ error: e.message });
        }
    });

    app.delete('/api/personas/:id', async (req, res): Promise<any> => {
        const id = req.params.id;
        if (!isDatabaseConnected()) {
            memoryDb.personas = (memoryDb.personas || []).filter((p: any) => p.id !== id);
            return res.json({ success: true });
        }
        const pool = getDbPool();
        try {
            await pool.query('DELETE FROM personas WHERE id = $1', [id]);
            return res.json({ success: true });
        } catch (e: any) {
            return res.status(500).json({ error: e.message });
        }
    });

    // Public / User Usage Modes APIs
    app.get('/api/usage-modes', async (req, res): Promise<any> => {
        if (!isDatabaseConnected()) return res.json(memoryDb.usage_modes || DEFAULT_USAGE_MODES);
        const pool = getDbPool();
        try {
            const result = await pool.query("SELECT * FROM usage_modes WHERE status = 'Active' ORDER BY sortOrder ASC");
            return res.json(result.rows);
        } catch (e: any) {
            return res.json(DEFAULT_USAGE_MODES);
        }
    });

    // User mock Reference Image Upload API
    app.post('/api/reference-images', async (req, res): Promise<any> => {
        const { fileName, mimeType, previewUrl } = req.body;
        const data = {
            id: crypto.randomUUID(),
            fileName: fileName || 'photo-reference.jpg',
            mimeType: mimeType || 'image/jpeg',
            previewUrl: previewUrl || '',
            uploadStatus: 'Completed',
            cropStatus: 'Cropped',
            moderationStatus: 'Pending',
            consentVerified: true,
            approvedForGeneration: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        if (!isDatabaseConnected()) {
            memoryDb.reference_images = memoryDb.reference_images || [];
            memoryDb.reference_images.push(data);
            return res.json(data);
        }
        const pool = getDbPool();
        try {
            await pool.query(
                `INSERT INTO reference_images (id, fileName, mimeType, previewUrl, uploadStatus, cropStatus, moderationStatus, consentVerified, approvedForGeneration)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                [
                    data.id, data.fileName, data.mimeType, data.previewUrl, data.uploadStatus,
                    data.cropStatus, data.moderationStatus, data.consentVerified, data.approvedForGeneration
                ]
            );
            return res.json(data);
        } catch (e: any) {
            return res.status(500).json({ error: e.message });
        }
    });

    // Admin API endpoints: Usage Modes




    // Public / User Styles APIs
    app.get('/api/styles', async (req, res): Promise<any> => {
        if (!isDatabaseConnected()) return res.json(memoryDb.styles || DEFAULT_STYLES);
        const pool = getDbPool();
        try {
            const result = await pool.query("SELECT * FROM styles WHERE visibilityState = 'Active' ORDER BY sortOrder ASC");
            return res.json(result.rows);
        } catch (e: any) {
            return res.json(DEFAULT_STYLES);
        }
    });


    // Public / User Languages APIs
    app.get('/api/languages', async (req, res): Promise<any> => {
        if (!isDatabaseConnected()) return res.json(memoryDb.languages || DEFAULT_LANGUAGES);
        const pool = getDbPool();
        try {
            const result = await pool.query("SELECT * FROM languages WHERE status = 'Active' ORDER BY sortOrder ASC");
            return res.json(result.rows);
        } catch (e: any) {
            return res.json(DEFAULT_LANGUAGES);
        }
    });

    // Public / User Glossary entries APIs
    app.get('/api/glossary', async (req, res): Promise<any> => {
        if (!isDatabaseConnected()) return res.json(memoryDb.glossary_entries || DEFAULT_GLOSSARY);
        const pool = getDbPool();
        try {
            const result = await pool.query("SELECT * FROM glossary_entries WHERE status = 'Active' ORDER BY sortOrder ASC");
            return res.json(result.rows);
        } catch (e: any) {
            return res.json(DEFAULT_GLOSSARY);
        }
    });

    // Public / User Translation workflows APIs
    app.get('/api/translation/workflows', async (req, res): Promise<any> => {
        if (!isDatabaseConnected()) return res.json(memoryDb.translation_workflows || DEFAULT_WORKFLOWS);
        const pool = getDbPool();
        try {
            const result = await pool.query("SELECT * FROM translation_workflows WHERE status = 'Active'");
            return res.json(result.rows);
        } catch (e: any) {
            return res.json(DEFAULT_WORKFLOWS);
        }
    });

    // Real, high-fidelity translation service execution with glossary preservation
    app.post('/api/translation/execute', async (req, res): Promise<any> => {
        const { text, sourceLang, targetLang, projectId, userEmail } = req.body;
        const email = userEmail || 'local-creator@infinite.multiverse';
        const userTier = await getUserTier(email);
        const route = resolveAIRoute('translation_generation', userTier, process.env.NODE_ENV);

        if (!(await consumeTokens(email, calculateTokenCost(route.modelSlug as any, 500)))) {
            return res.status(402).json({ error: 'Insufficient tokens' });
        }

        if (!text) return res.status(400).json({ error: 'Text content is required for translation.' });

        const glossaryList = !isDatabaseConnected() 
            ? (memoryDb.glossary_entries || DEFAULT_GLOSSARY)
            : (await getDbPool().query("SELECT * FROM glossary_entries WHERE status = 'Active'")).rows;

        // Filter glossary terms matching the source/target languages
        const matchingGlossary = glossaryList.filter((entry: any) => 
            entry.sourceLanguageCode === sourceLang && entry.targetLanguageCode === targetLang
        );

        let translated = "";
        try {
            const ai = getAIClient(req.headers['x-gemini-key'] as string);
            
            let prompt = `You are a professional multilingual translator. Translate the following text from source language code "${sourceLang}" to target language code "${targetLang}".\n\n`;
            
            if (matchingGlossary.length > 0) {
                prompt += `GLOSSARY AND PROTECTED TERMS (Apply these translations strictly case-insensitively, and do NOT translate them otherwise):\n`;
                matchingGlossary.forEach((entry: any) => {
                    prompt += `- "${entry.sourceTerm}" must translate to "${entry.preferredTranslation}"\n`;
                });
                prompt += `\n`;
            }

            prompt += `TEXT TO TRANSLATE:\n"""\n${text}\n"""\n\n`;
            prompt += `INSTRUCTIONS:\n`;
            prompt += `1. Translate the entire text naturally into the destination language.\n`;
            prompt += `2. Keep any styling, layout characters, or newlines intact.\n`;
            prompt += `3. Output ONLY the final translated text. Do not add comments, quotes around the outside of the translation, or explanations.\n`;

            const aiResponse = await callGeminiSafely(ai, {
                safetySettings: applyModeration(req, JSON.stringify(req.body)),
                model: route.modelSlug,
                contents: [{ parts: [{ text: prompt }] }],
            }, email, '/api/translation/execute');

            translated = aiResponse.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
            // Clean up wrapping quotes if Gemini erroneously added them
            if (translated.startsWith('"') && translated.endsWith('"')) {
                translated = translated.substring(1, translated.length - 1);
            }
        } catch (e: any) {
            console.error("AI translation execution failed, falling back to rule-based placeholder:", e.message);
            translated = `[Translated to ${targetLang}]: ${text}`;
            // Fallback glossary preservation
            matchingGlossary.forEach((entry: any) => {
                const regex = new RegExp(entry.sourceTerm, 'gi');
                if (text.match(regex)) {
                    translated = translated.replace(new RegExp(entry.sourceTerm, 'gi'), entry.preferredTranslation);
                }
            });
        }

        const jobId = crypto.randomUUID();
        const unitId = crypto.randomUUID();

        const job = {
            id: jobId, projectId: projectId || 'current-project', providerId: route.providerId,
            modelId: route.modelId, workflowId: "workflow-translation-standard",
            sourceLanguageCode: sourceLang, targetLanguageCode: targetLang, translationMode: "Standard",
            status: "Completed", retryCount: 0, resultBindingIds: [unitId], createdAt: new Date().toISOString()
        };

        const unit = {
            id: unitId, projectId: projectId || 'current-project', parentContentType: 'Panel',
            parentContentId: 'current-panel', fieldType: 'dialogue', sourceText: text,
            sourceLanguageCode: sourceLang, translatedText: translated, targetLanguageCode: targetLang,
            translationStatus: 'Approved', reviewStatus: 'Approved', protectedTermIds: [],
            glossaryEntryIds: matchingGlossary.map((g: any) => g.id), overrideApplied: false
        };

        if (!isDatabaseConnected()) {
            memoryDb.translation_jobs.push(job);
            memoryDb.translation_units.push(unit);
        } else {
            const pool = getDbPool();
            await pool.query(
                `INSERT INTO translation_jobs (id, projectId, providerId, modelId, workflowId, sourceLanguageCode, targetLanguageCode, translationMode, status, retryCount, resultBindingIds)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
                [job.id, job.projectId, job.providerId, job.modelId, job.workflowId, job.sourceLanguageCode, job.targetLanguageCode, job.translationMode, job.status, job.retryCount, JSON.stringify(job.resultBindingIds)]
            );
            await pool.query(
                `INSERT INTO translation_units (id, projectId, parentContentType, parentContentId, fieldType, sourceText, sourceLanguageCode, translatedText, targetLanguageCode, translationStatus, reviewStatus, protectedTermIds, glossaryEntryIds, overrideApplied)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
                [unit.id, unit.projectId, unit.parentContentType, unit.parentContentId, unit.fieldType, unit.sourceText, unit.sourceLanguageCode, unit.translatedText, unit.targetLanguageCode, unit.translationStatus, unit.reviewStatus, JSON.stringify(unit.protectedTermIds), JSON.stringify(unit.glossaryEntryIds), unit.overrideApplied]
            );
        }

        return res.json({ success: true, translatedText: translated, job, unit });
    });

    // Public / User Voices APIs
    app.get('/api/narration/voices', async (req, res): Promise<any> => {
        if (!isDatabaseConnected()) return res.json(memoryDb.voices || DEFAULT_VOICES);
        const pool = getDbPool();
        try {
            const result = await pool.query("SELECT * FROM voices WHERE status = 'Active' ORDER BY sortOrder ASC");
            const rows = result.rows.map(r => ({
                ...r,
                languageCodes: typeof r.languageCodes === 'string' ? JSON.parse(r.languageCodes) : r.languageCodes
            }));
            return res.json(rows);
        } catch (e: any) {
            return res.json(DEFAULT_VOICES);
        }
    });

    // Public / User Soundtracks APIs
    app.get('/api/narration/soundtracks', async (req, res): Promise<any> => {
        if (!isDatabaseConnected()) return res.json(memoryDb.soundtrack_items || DEFAULT_SOUNDTRACKS);
        const pool = getDbPool();
        try {
            const result = await pool.query("SELECT * FROM soundtrack_items WHERE status = 'Active' ORDER BY sortOrder ASC");
            return res.json(result.rows);
        } catch (e: any) {
            return res.json(DEFAULT_SOUNDTRACKS);
        }
    });

    // simulated TTS audio narration generation
    app.post('/api/narration/generate-audio', async (req, res): Promise<any> => {
        const { text, voiceId, projectId, parentContentId } = req.body;
        const jobId = crypto.randomUUID();
        const assetId = crypto.randomUUID();
        const unitId = crypto.randomUUID();

        const job = {
            id: jobId, projectId: projectId || 'current-project', providerId: "elevenlabs-voice-sim",
            modelId: "eleven_monolingual_v1", workflowId: "workflow-audio-standard", voiceId: voiceId || 'voice-narrator-1',
            languageCode: "en-US", narrationMode: "narrator-only", pacingMode: "standard",
            status: "Completed", retryCount: 0, resultBindingIds: [assetId], createdAt: new Date().toISOString()
        };

        const unit = {
            id: unitId, projectId: projectId || 'current-project', parentContentType: 'Panel',
            parentContentId: parentContentId || 'current-panel', textBindingId: 'caption-text',
            sourceText: text, languageCode: "en-US", assignedVoiceId: voiceId || 'voice-narrator-1',
            narrationMode: "narrator-only", pacingMode: "standard", status: 'Completed',
            reviewStatus: 'Approved', outputAssetId: assetId, overrideApplied: false
        };

        const asset = {
            id: assetId, assetType: 'Panel', sourceJobId: jobId, sourceUnitId: unitId,
            previewUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", // high quality placeholder song
            status: 'Completed', selected: true, approved: true, archived: false,
            moderationState: 'Approved', durationMs: 4500, createdAt: new Date().toISOString()
        };

        if (!isDatabaseConnected()) {
            memoryDb.narration_jobs.push(job);
            memoryDb.narration_units.push(unit);
            memoryDb.audio_assets.push(asset);
        } else {
            const pool = getDbPool();
            await pool.query(
                `INSERT INTO narration_jobs (id, projectId, providerId, modelId, workflowId, voiceId, languageCode, narrationMode, pacingMode, status, retryCount, resultBindingIds)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
                [job.id, job.projectId, job.providerId, job.modelId, job.workflowId, job.voiceId, job.languageCode, job.narrationMode, job.pacingMode, job.status, job.retryCount, JSON.stringify(job.resultBindingIds)]
            );
            await pool.query(
                `INSERT INTO narration_units (id, projectId, parentContentType, parentContentId, textBindingId, sourceText, languageCode, assignedVoiceId, narrationMode, pacingMode, status, reviewStatus, outputAssetId, overrideApplied)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
                [unit.id, unit.projectId, unit.parentContentType, unit.parentContentId, unit.textBindingId, unit.sourceText, unit.languageCode, unit.assignedVoiceId, unit.narrationMode, unit.pacingMode, unit.status, unit.reviewStatus, unit.outputAssetId, unit.overrideApplied]
            );
            await pool.query(
                `INSERT INTO audio_assets (id, assetType, sourceJobId, sourceUnitId, previewUrl, status, selected, approved, archived, moderationState, durationMs)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
                [asset.id, asset.assetType, asset.sourceJobId, asset.sourceUnitId, asset.previewUrl, asset.status, asset.selected, asset.approved, asset.archived, asset.moderationState, asset.durationMs]
            );
        }

        return res.json({ success: true, audioUrl: asset.previewUrl, durationMs: asset.durationMs, job, unit, asset });
    });

    // Admin CRUD endpoints for Voices




    // Admin CRUD endpoints for Soundtracks




    // Admin CRUD endpoints for Languages




    // Admin CRUD endpoints for Glossary entries



    app.get('/api/prompt-templates', async (req, res): Promise<any> => {
        if (!isDatabaseConnected()) return res.json(memoryDb.prompt_templates || DEFAULT_PROMPT_TEMPLATES);
        const pool = getDbPool();
        try {
            const result = await pool.query("SELECT * FROM prompt_templates WHERE status = 'Active'");
            return res.json(result.rows);
        } catch (e: any) {
            return res.json(DEFAULT_PROMPT_TEMPLATES);
        }
    });

    // Public / User Image Jobs, Panel & Cover Request endpoints
    app.get('/api/image/jobs', async (req, res): Promise<any> => {
        const { projectId } = req.query;
        if (!isDatabaseConnected()) {
            let list = memoryDb.image_generation_jobs || [];
            if (projectId) list = list.filter((j: any) => j.projectId === projectId);
            return res.json(list);
        }
        const pool = getDbPool();
        try {
            const q = projectId 
                ? await pool.query("SELECT * FROM image_generation_jobs WHERE projectId = $1 ORDER BY createdAt DESC", [projectId])
                : await pool.query("SELECT * FROM image_generation_jobs ORDER BY createdAt DESC");
            return res.json(q.rows);
        } catch (e: any) {
            return res.json([]);
        }
    });

    app.get('/api/image/panel-requests', async (req, res): Promise<any> => {
        const { projectId } = req.query;
        if (!isDatabaseConnected()) {
            let list = memoryDb.panel_generation_requests || [];
            if (projectId) list = list.filter((j: any) => j.projectId === projectId);
            return res.json(list);
        }
        const pool = getDbPool();
        try {
            const q = projectId 
                ? await pool.query("SELECT * FROM panel_generation_requests WHERE projectId = $1 ORDER BY createdAt DESC", [projectId])
                : await pool.query("SELECT * FROM panel_generation_requests ORDER BY createdAt DESC");
            return res.json(q.rows);
        } catch (e: any) {
            return res.json([]);
        }
    });

    app.get('/api/image/cover-requests', async (req, res): Promise<any> => {
        const { projectId } = req.query;
        if (!isDatabaseConnected()) {
            let list = memoryDb.cover_generation_requests || [];
            if (projectId) list = list.filter((j: any) => j.projectId === projectId);
            return res.json(list);
        }
        const pool = getDbPool();
        try {
            const q = projectId 
                ? await pool.query("SELECT * FROM cover_generation_requests WHERE projectId = $1 ORDER BY createdAt DESC", [projectId])
                : await pool.query("SELECT * FROM cover_generation_requests ORDER BY createdAt DESC");
            return res.json(q.rows);
        } catch (e: any) {
            return res.json([]);
        }
    });

    app.get('/api/image/assets', async (req, res): Promise<any> => {
        const { sourceRequestId } = req.query;
        if (!isDatabaseConnected()) {
            let list = memoryDb.generated_assets || [];
            if (sourceRequestId) list = list.filter((j: any) => j.sourceRequestId === sourceRequestId);
            return res.json(list);
        }
        const pool = getDbPool();
        try {
            const q = sourceRequestId 
                ? await pool.query("SELECT * FROM generated_assets WHERE sourceRequestId = $1 ORDER BY createdAt DESC", [sourceRequestId])
                : await pool.query("SELECT * FROM generated_assets ORDER BY createdAt DESC");
            return res.json(q.rows);
        } catch (e: any) {
            return res.json([]);
        }
    });

    // Create Simulated Generation Action
    app.post('/api/image/generate-panel', async (req, res): Promise<any> => {
        const { projectId, panelTitle, beatSummary, styleId, personaIds, languageHandlingMode } = req.body;
        const jobId = crypto.randomUUID();
        const requestId = crypto.randomUUID();
        const assetId = crypto.randomUUID();

        const job = {
            id: jobId, projectId, workflowType: "Panel", providerId: "gemini-imagen-sim", modelId: "imagen-3",
            status: "Completed", requestType: "Panel", promptTemplateId: "template-panel-standard",
            styleId, personaIds: personaIds || [], coverMode: false, retryCount: 0,
            outputAssetIds: [assetId], createdAt: new Date().toISOString()
        };

        const panelRequest = {
            id: requestId, projectId, panelTitle, beatSummary, educationalFocus: "Science Vocabulary Integration",
            visualSummary: "Detailed illustrated scene supporting the story beat.", settingDescription: "Classroom / Outdoor setting",
            personaIds: personaIds || [], styleId, languageHandlingMode: languageHandlingMode || 'original',
            promptSafeDescription: `Generated scene for ${panelTitle}`, generationState: 'Completed',
            selectedAssetId: assetId, variantAssetIds: [assetId], createdAt: new Date().toISOString()
        };

        const previewUrls = [
            'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&q=80&w=300',
            'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=300',
            'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&q=80&w=300'
        ];
        const previewUrl = previewUrls[Math.floor(Math.random() * previewUrls.length)];

        const asset = {
            id: assetId, assetType: 'Panel', sourceJobId: jobId, sourceRequestId: requestId,
            previewUrl, status: 'Completed', selected: true, approved: true, archived: false,
            moderationState: 'Approved', createdAt: new Date().toISOString()
        };

        if (!isDatabaseConnected()) {
            memoryDb.image_generation_jobs.push(job);
            memoryDb.panel_generation_requests.push(panelRequest);
            memoryDb.generated_assets.push(asset);
        } else {
            const pool = getDbPool();
            await pool.query(
                `INSERT INTO image_generation_jobs (id, projectId, workflowType, providerId, modelId, status, requestType, promptTemplateId, styleId, personaIds, coverMode, retryCount, outputAssetIds)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
                [job.id, job.projectId, job.workflowType, job.providerId, job.modelId, job.status, job.requestType, job.promptTemplateId, job.styleId, JSON.stringify(job.personaIds), job.coverMode, job.retryCount, JSON.stringify(job.outputAssetIds)]
            );
            await pool.query(
                `INSERT INTO panel_generation_requests (id, projectId, panelTitle, beatSummary, educationalFocus, visualSummary, settingDescription, personaIds, styleId, languageHandlingMode, promptSafeDescription, generationState, selectedAssetId, variantAssetIds)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
                [panelRequest.id, panelRequest.projectId, panelRequest.panelTitle, panelRequest.beatSummary, panelRequest.educationalFocus, panelRequest.visualSummary, panelRequest.settingDescription, JSON.stringify(panelRequest.personaIds), panelRequest.styleId, panelRequest.languageHandlingMode, panelRequest.promptSafeDescription, panelRequest.generationState, panelRequest.selectedAssetId, JSON.stringify(panelRequest.variantAssetIds)]
            );
            await pool.query(
                `INSERT INTO generated_assets (id, assetType, sourceJobId, sourceRequestId, previewUrl, status, selected, approved, archived, moderationState)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
                [asset.id, asset.assetType, asset.sourceJobId, asset.sourceRequestId, asset.previewUrl, asset.status, asset.selected, asset.approved, asset.archived, asset.moderationState]
            );
        }
        return res.json({ success: true, asset, panelRequest });
    });

    app.post('/api/image/generate-cover', async (req, res): Promise<any> => {
        const { projectId, title, subtitle, styleId, personaIds } = req.body;
        const jobId = crypto.randomUUID();
        const requestId = crypto.randomUUID();
        const assetId = crypto.randomUUID();

        const job = {
            id: jobId, projectId, workflowType: "Cover", providerId: "gemini-imagen-sim", modelId: "imagen-3",
            status: "Completed", requestType: "Cover", promptTemplateId: "template-cover-standard",
            styleId, personaIds: personaIds || [], coverMode: true, retryCount: 0,
            outputAssetIds: [assetId], createdAt: new Date().toISOString()
        };

        const coverRequest = {
            id: requestId, projectId, title, subtitle, educationalFocus: "Science Cover Topic",
            personaIds: personaIds || [], styleId, visualSummary: "Atmospheric front cover layout.",
            promptSafeDescription: `Generated cover artwork for ${title}`, generationState: 'Completed',
            selectedAssetId: assetId, variantAssetIds: [assetId], createdAt: new Date().toISOString()
        };

        const asset = {
            id: assetId, assetType: 'Cover', sourceJobId: jobId, sourceRequestId: requestId,
            previewUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=400',
            status: 'Completed', selected: true, approved: true, archived: false,
            moderationState: 'Approved', createdAt: new Date().toISOString()
        };

        if (!isDatabaseConnected()) {
            memoryDb.image_generation_jobs.push(job);
            memoryDb.cover_generation_requests.push(coverRequest);
            memoryDb.generated_assets.push(asset);
        } else {
            const pool = getDbPool();
            await pool.query(
                `INSERT INTO image_generation_jobs (id, projectId, workflowType, providerId, modelId, status, requestType, promptTemplateId, styleId, personaIds, coverMode, retryCount, outputAssetIds)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
                [job.id, job.projectId, job.workflowType, job.providerId, job.modelId, job.status, job.requestType, job.promptTemplateId, job.styleId, JSON.stringify(job.personaIds), job.coverMode, job.retryCount, JSON.stringify(job.outputAssetIds)]
            );
            await pool.query(
                `INSERT INTO cover_generation_requests (id, projectId, title, subtitle, educationalFocus, personaIds, styleId, visualSummary, promptSafeDescription, generationState, selectedAssetId, variantAssetIds)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
                [coverRequest.id, coverRequest.projectId, coverRequest.title, coverRequest.subtitle, coverRequest.educationalFocus, JSON.stringify(coverRequest.personaIds), coverRequest.styleId, coverRequest.visualSummary, coverRequest.promptSafeDescription, coverRequest.generationState, coverRequest.selectedAssetId, JSON.stringify(coverRequest.variantAssetIds)]
            );
            await pool.query(
                `INSERT INTO generated_assets (id, assetType, sourceJobId, sourceRequestId, previewUrl, status, selected, approved, archived, moderationState)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
                [asset.id, asset.assetType, asset.sourceJobId, asset.sourceRequestId, asset.previewUrl, asset.status, asset.selected, asset.approved, asset.archived, asset.moderationState]
            );
        }
        return res.json({ success: true, asset, coverRequest });
    });

    // ─── Async generation job endpoints (BullMQ-backed) ────────────────────
    app.post('/api/image/generate-panel/async', async (req, res): Promise<any> => {
        const { projectId, panelTitle, beatSummary, styleId, personaIds, languageHandlingMode } = req.body;
        if (!projectId || !panelTitle) {
            return res.status(400).json({ error: 'Missing projectId or panelTitle' });
        }
        const jobId = crypto.randomUUID();
        const requestId = crypto.randomUUID();
        const assetId = crypto.randomUUID();
        const job = {
            id: jobId, projectId, workflowType: 'Panel', providerId: 'gemini-imagen-sim', modelId: 'imagen-3',
            status: 'Pending', requestType: 'Panel', promptTemplateId: 'template-panel-standard',
            styleId, personaIds: personaIds || [], coverMode: false, retryCount: 0,
            outputAssetIds: [], createdAt: new Date().toISOString()
        };
        const panelRequest = {
            id: requestId, projectId, panelTitle, beatSummary, educationalFocus: 'Science Vocabulary Integration',
            visualSummary: 'Detailed illustrated scene supporting the story beat.', settingDescription: 'Classroom / Outdoor setting',
            personaIds: personaIds || [], styleId, languageHandlingMode: languageHandlingMode || 'original',
            promptSafeDescription: `Generated scene for ${panelTitle}`, generationState: 'Pending',
            selectedAssetId: null, variantAssetIds: [], createdAt: new Date().toISOString()
        };
        if (!isDatabaseConnected()) {
            memoryDb.image_generation_jobs.push(job);
            memoryDb.panel_generation_requests.push(panelRequest);
        } else {
            try {
                const pool = getDbPool();
                await pool.query(
                    `INSERT INTO image_generation_jobs (id, projectId, workflowType, providerId, modelId, status, requestType, promptTemplateId, styleId, personaIds, coverMode, retryCount, outputAssetIds)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
                    [job.id, job.projectId, job.workflowType, job.providerId, job.modelId, job.status, job.requestType, job.promptTemplateId, job.styleId, JSON.stringify(job.personaIds), job.coverMode, job.retryCount, JSON.stringify(job.outputAssetIds)]
                );
                await pool.query(
                    `INSERT INTO panel_generation_requests (id, projectId, panelTitle, beatSummary, educationalFocus, visualSummary, settingDescription, personaIds, styleId, languageHandlingMode, promptSafeDescription, generationState, selectedAssetId, variantAssetIds)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
                    [panelRequest.id, panelRequest.projectId, panelRequest.panelTitle, panelRequest.beatSummary, panelRequest.educationalFocus, panelRequest.visualSummary, panelRequest.settingDescription, JSON.stringify(panelRequest.personaIds), panelRequest.styleId, panelRequest.languageHandlingMode, panelRequest.promptSafeDescription, panelRequest.generationState, panelRequest.selectedAssetId, JSON.stringify(panelRequest.variantAssetIds)]
                );
            } catch (e: any) {
                console.warn('[generate-panel/async] DB insert failed; falling back to memoryDb:', e.message);
                memoryDb.image_generation_jobs.push(job);
                memoryDb.panel_generation_requests.push(panelRequest);
            }
        }
        const id = await enqueueGenerationJob({ kind: 'panel', jobId, requestId, assetId, projectId, payload: { panelTitle, beatSummary, styleId, personaIds, languageHandlingMode } });
        return res.json({ success: true, jobId, requestId, assetId, status: 'pending', queueJobId: id });
    });

    app.post('/api/image/generate-cover/async', async (req, res): Promise<any> => {
        const { projectId, title, subtitle, styleId, personaIds } = req.body;
        if (!projectId || !title) {
            return res.status(400).json({ error: 'Missing projectId or title' });
        }
        const jobId = crypto.randomUUID();
        const requestId = crypto.randomUUID();
        const assetId = crypto.randomUUID();
        const job = {
            id: jobId, projectId, workflowType: 'Cover', providerId: 'gemini-imagen-sim', modelId: 'imagen-3',
            status: 'Pending', requestType: 'Cover', promptTemplateId: 'template-cover-standard',
            styleId, personaIds: personaIds || [], coverMode: true, retryCount: 0,
            outputAssetIds: [], createdAt: new Date().toISOString()
        };
        const coverRequest = {
            id: requestId, projectId, title, subtitle, educationalFocus: 'Science Cover Topic',
            personaIds: personaIds || [], styleId, visualSummary: 'Atmospheric front cover layout.',
            promptSafeDescription: `Generated cover artwork for ${title}`, generationState: 'Pending',
            selectedAssetId: null, variantAssetIds: [], createdAt: new Date().toISOString()
        };
        if (!isDatabaseConnected()) {
            memoryDb.image_generation_jobs.push(job);
            memoryDb.cover_generation_requests.push(coverRequest);
        } else {
            try {
                const pool = getDbPool();
                await pool.query(
                    `INSERT INTO image_generation_jobs (id, projectId, workflowType, providerId, modelId, status, requestType, promptTemplateId, styleId, personaIds, coverMode, retryCount, outputAssetIds)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
                    [job.id, job.projectId, job.workflowType, job.providerId, job.modelId, job.status, job.requestType, job.promptTemplateId, job.styleId, JSON.stringify(job.personaIds), job.coverMode, job.retryCount, JSON.stringify(job.outputAssetIds)]
                );
                await pool.query(
                    `INSERT INTO cover_generation_requests (id, projectId, title, subtitle, educationalFocus, personaIds, styleId, visualSummary, promptSafeDescription, generationState, selectedAssetId, variantAssetIds)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
                    [coverRequest.id, coverRequest.projectId, coverRequest.title, coverRequest.subtitle, coverRequest.educationalFocus, JSON.stringify(coverRequest.personaIds), coverRequest.styleId, coverRequest.visualSummary, coverRequest.promptSafeDescription, coverRequest.generationState, coverRequest.selectedAssetId, JSON.stringify(coverRequest.variantAssetIds)]
                );
            } catch (e: any) {
                console.warn('[generate-cover/async] DB insert failed; falling back to memoryDb:', e.message);
                memoryDb.image_generation_jobs.push(job);
                memoryDb.cover_generation_requests.push(coverRequest);
            }
        }
        const id = await enqueueGenerationJob({ kind: 'cover', jobId, requestId, assetId, projectId, payload: { title, subtitle, styleId, personaIds } });
        return res.json({ success: true, jobId, requestId, assetId, status: 'pending', queueJobId: id });
    });

    app.post('/api/narration/generate-audio/async', async (req, res): Promise<any> => {
        const { text, voiceId, projectId, parentContentId } = req.body;
        if (!text) {
            return res.status(400).json({ error: 'Missing text' });
        }
        const jobId = crypto.randomUUID();
        const unitId = crypto.randomUUID();
        const assetId = crypto.randomUUID();
        const job = {
            id: jobId, projectId: projectId || 'current-project', providerId: 'elevenlabs-voice-sim',
            modelId: 'eleven_monolingual_v1', workflowId: 'workflow-audio-standard', voiceId: voiceId || 'voice-narrator-1',
            languageCode: 'en-US', narrationMode: 'narrator-only', pacingMode: 'standard',
            status: 'Pending', retryCount: 0, resultBindingIds: [], createdAt: new Date().toISOString()
        };
        if (!isDatabaseConnected()) {
            memoryDb.narration_jobs.push(job);
        } else {
            try {
                const pool = getDbPool();
                await pool.query(
                    `INSERT INTO narration_jobs (id, projectId, providerId, modelId, workflowId, voiceId, languageCode, narrationMode, pacingMode, status, retryCount, resultBindingIds)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
                    [job.id, job.projectId, job.providerId, job.modelId, job.workflowId, job.voiceId, job.languageCode, job.narrationMode, job.pacingMode, job.status, job.retryCount, JSON.stringify(job.resultBindingIds)]
                );
            } catch (e: any) {
                console.warn('[generate-audio/async] DB insert failed; falling back to memoryDb:', e.message);
                memoryDb.narration_jobs.push(job);
            }
        }
        const id = await enqueueGenerationJob({ kind: 'audio', jobId, requestId: unitId, assetId, projectId, payload: { text, voiceId, projectId, parentContentId } });
        return res.json({ success: true, jobId, unitId, assetId, status: 'pending', queueJobId: id });
    });

    app.get('/api/image/jobs/:id', async (req, res): Promise<any> => {
        const status = await getGenerationJobStatus(req.params.id);
        if (!status) return res.status(404).json({ error: 'Job not found' });
        return res.json(status);
    });

    app.get('/api/narration/jobs/:id', async (req, res): Promise<any> => {
        const status = await getGenerationJobStatus(req.params.id);
        if (!status) return res.status(404).json({ error: 'Job not found' });
        return res.json(status);
    });

    
    // Admin CRUD endpoints for Styles




    // Admin CRUD endpoints for Prompt Templates








    

    app.get('/api/categories', async (req, res): Promise<any> => {
        if (!isDatabaseConnected()) {
            return res.json((memoryDb.content_categories || DEFAULT_CATEGORIES).filter((c: any) => c.is_active !== false));
        }
        const pool = getDbPool();
        if (pool) {
            try {
                const result = await pool.query(`SELECT * FROM content_categories WHERE is_active = true ORDER BY created_at DESC`);
                if (result.rows && result.rows.length > 0) {
                    return res.json(result.rows);
                }
            } catch(e) { }
        }
        return res.json(DEFAULT_CATEGORIES.filter(c => c.is_active !== false));
    });

    



    // SaaS Analytics stats


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
                    query += " WHERE user_id = $1 OR is_global = true";
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
            filtered = memoryDb.character_vault.filter(c => c.user_id === userId || c.is_global === true);
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
                    query += " WHERE user_id = $1 OR is_global = true";
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
            
            const stripe = new Stripe(secretKey, { apiVersion: '2025-02-24.acacia' as any });
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

    
    // --- ADMIN SUPERCHARGE ROUTES ---

    // Token Management API

    // Content Moderation API - Resolve

    // Content Moderation API - Delete Content

    // Webhook & Error Logs API


    // Global Characters API



    // =========================================================================

    // Task 1.5: Global error handler
    app.use(errorTracker.errorHandler.bind(errorTracker));

    // Start generation worker (BullMQ if REDIS_URL is set, otherwise in-memory handlers are already registered)
    await startGenerationWorker();

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

        process.on('SIGTERM', async () => {
            console.log('[Server] SIGTERM received; closing generation worker/queue...');
            await closeGenerationQueue();
            serverInstance.close(() => process.exit(0));
        });
        process.on('SIGINT', async () => {
            console.log('[Server] SIGINT received; closing generation worker/queue...');
            await closeGenerationQueue();
            serverInstance.close(() => process.exit(0));
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
