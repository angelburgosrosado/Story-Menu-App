/**
 * Generation job queue abstraction.
 * Uses BullMQ + Redis when REDIS_URL is present, otherwise falls back to the
 * in-memory JobQueue so local dev works without Redis.
 */
import { Queue, Worker, Job } from 'bullmq';
import { jobQueue } from '../middleware/jobQueue';
import { processGenerationJob } from './processor';

const QUEUE_NAME = 'generation-queue';

function getRedisConnection() {
    const url = process.env.REDIS_URL || process.env.REDIS_URI;
    if (!url) return null;
    return { url };
}

const connection = getRedisConnection();
let bullQueue: Queue | null = null;
let bullWorker: Worker | null = null;

function ensureBullQueue(): Queue {
    if (!bullQueue) {
        bullQueue = new Queue(QUEUE_NAME, { connection: connection! });
    }
    return bullQueue;
}

export type GenerationKind = 'panel' | 'cover' | 'audio';

export interface GenerationJobData {
    kind: GenerationKind;
    jobId: string;
    requestId?: string;
    assetId: string;
    projectId?: string;
    userEmail?: string;
    payload: Record<string, any>;
}

function isGenerationJobData(data: any): data is GenerationJobData {
    return data && typeof data.kind === 'string' && typeof data.jobId === 'string';
}

export async function enqueueGenerationJob(data: GenerationJobData): Promise<string> {
    if (connection) {
        const queue = ensureBullQueue();
        const bullJob = await queue.add(data.kind, data, { jobId: data.jobId });
        return bullJob.id ?? data.jobId;
    }

    // Fallback to in-memory job queue
    const type = data.kind === 'audio' ? 'generate-audio' : 'generate-image';
    return jobQueue.enqueue(type, data, { priority: 5, maxAttempts: 3 });
}

export async function getGenerationJobStatus(id: string): Promise<{ id: string; status: string; result?: any; error?: string } | null> {
    if (connection) {
        const queue = ensureBullQueue();
        const job = await queue.getJob(id);
        if (!job) return null;
        const state = await job.getState();
        return {
            id: job.id as string,
            status: state,
            result: job.returnvalue,
            error: job.failedReason,
        };
    }

    const j = jobQueue.getJobs().find((x: any) => x.id === id);
    if (!j) return { id, status: 'unknown' };
    return { id, status: j.status, error: j.error };
}

export async function startGenerationWorker(): Promise<void> {
    if (!connection) return;

    bullWorker = new Worker(
        QUEUE_NAME,
        async (job: Job) => {
            if (!isGenerationJobData(job.data)) {
                throw new Error(`Invalid job data for ${job.id}`);
            }
            await processGenerationJob(job.data);
            return { completedAt: new Date().toISOString() };
        },
        { connection, concurrency: 3 }
    );

    bullWorker.on('completed', (job) => {
        console.log(`[BullMQ] Completed job ${job.id} (${job.data.kind})`);
    });

    bullWorker.on('failed', (job, err) => {
        console.error(`[BullMQ] Failed job ${job?.id} (${job?.data?.kind}):`, err.message);
    });
}

export async function closeGenerationQueue(): Promise<void> {
    if (bullWorker) await bullWorker.close();
    if (bullQueue) await bullQueue.close();
}
