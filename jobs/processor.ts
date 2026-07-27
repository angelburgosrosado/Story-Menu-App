/**
 * Processor for asynchronous generation jobs.
 * Updates database records from Pending to Completed and stores generated assets.
 */
import crypto from 'crypto';
import { getDbPool, isDatabaseConnected } from '../db';
import { GenerationJobData } from './queue';

const PANEL_PREVIEW_URLS = [
    'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&q=80&w=300',
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=300',
    'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&q=80&w=300',
];

const COVER_PREVIEW_URL =
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=400';

const AUDIO_PREVIEW_URL = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';

export async function processGenerationJob(data: GenerationJobData): Promise<void> {
    if (!isDatabaseConnected()) {
        console.warn('[GenerationWorker] Database offline; skipping DB update for job', data.jobId);
        return;
    }

    const pool = getDbPool();
    if (!pool) {
        console.warn('[GenerationWorker] No DB pool available for job', data.jobId);
        return;
    }

    if (data.kind === 'panel') {
        await processPanelJob(pool, data);
    } else if (data.kind === 'cover') {
        await processCoverJob(pool, data);
    } else if (data.kind === 'audio') {
        await processAudioJob(pool, data);
    } else {
        throw new Error(`Unknown generation kind: ${(data as any).kind}`);
    }
}

async function processPanelJob(pool: any, data: GenerationJobData): Promise<void> {
    const { jobId, requestId, assetId, payload } = data;
    const previewUrl = PANEL_PREVIEW_URLS[Math.floor(Math.random() * PANEL_PREVIEW_URLS.length)];

    await pool.query(
        `UPDATE image_generation_jobs
         SET status = 'Completed', outputAssetIds = $1
         WHERE id = $2`,
        [JSON.stringify([assetId]), jobId]
    );

    if (requestId) {
        await pool.query(
            `UPDATE panel_generation_requests
             SET generationState = 'Completed', selectedAssetId = $1, variantAssetIds = $2
             WHERE id = $3`,
            [assetId, JSON.stringify([assetId]), requestId]
        );
    }

    await pool.query(
        `INSERT INTO generated_assets (id, assetType, sourceJobId, sourceRequestId, previewUrl, status, selected, approved, archived, moderationState, createdAt)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())`,
        [assetId, 'Panel', jobId, requestId || null, previewUrl, 'Completed', true, true, false, 'Approved']
    );

    console.log(`[GenerationWorker] Panel job completed: ${jobId}`);
}

async function processCoverJob(pool: any, data: GenerationJobData): Promise<void> {
    const { jobId, requestId, assetId, payload } = data;

    await pool.query(
        `UPDATE image_generation_jobs
         SET status = 'Completed', outputAssetIds = $1
         WHERE id = $2`,
        [JSON.stringify([assetId]), jobId]
    );

    if (requestId) {
        await pool.query(
            `UPDATE cover_generation_requests
             SET generationState = 'Completed', selectedAssetId = $1, variantAssetIds = $2
             WHERE id = $3`,
            [assetId, JSON.stringify([assetId]), requestId]
        );
    }

    await pool.query(
        `INSERT INTO generated_assets (id, assetType, sourceJobId, sourceRequestId, previewUrl, status, selected, approved, archived, moderationState, createdAt)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())`,
        [assetId, 'Cover', jobId, requestId || null, COVER_PREVIEW_URL, 'Completed', true, true, false, 'Approved']
    );

    console.log(`[GenerationWorker] Cover job completed: ${jobId}`);
}

async function processAudioJob(pool: any, data: GenerationJobData): Promise<void> {
    const { jobId, assetId, payload } = data;
    const { text, voiceId, projectId, parentContentId } = payload;
    const unitId = data.requestId || crypto.randomUUID();

    await pool.query(
        `UPDATE narration_jobs
         SET status = 'Completed', resultBindingIds = $1
         WHERE id = $2`,
        [JSON.stringify([assetId]), jobId]
    );

    await pool.query(
        `INSERT INTO narration_units (id, projectId, parentContentType, parentContentId, textBindingId, sourceText, languageCode, assignedVoiceId, narrationMode, pacingMode, status, reviewStatus, outputAssetId, overrideApplied)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
        [unitId, projectId || 'current-project', 'Panel', parentContentId || 'current-panel', 'caption-text', text, 'en-US', voiceId || 'voice-narrator-1', 'narrator-only', 'standard', 'Completed', 'Approved', assetId, false]
    );

    await pool.query(
        `INSERT INTO audio_assets (id, assetType, sourceJobId, sourceUnitId, previewUrl, status, selected, approved, archived, moderationState, durationMs, createdAt)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())`,
        [assetId, 'Panel', jobId, unitId, AUDIO_PREVIEW_URL, 'Completed', true, true, false, 'Approved', 4500]
    );

    console.log(`[GenerationWorker] Audio job completed: ${jobId}`);
}
