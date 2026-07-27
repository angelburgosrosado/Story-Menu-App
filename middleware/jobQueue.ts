/**
 * Background Job Queue — Task 7.8
 * In-memory job queue with retry logic and priority support.
 * For production: swap with Cloud Tasks or BullMQ + Redis.
 */

interface Job {
    id: string;
    type: string;
    payload: any;
    priority: number;       // 0 = highest, 10 = lowest
    status: 'pending' | 'processing' | 'completed' | 'failed';
    attempts: number;
    maxAttempts: number;
    createdAt: string;
    processedAt?: string;
    completedAt?: string;
    error?: string;
}

type JobHandler = (payload: any) => Promise<void>;

class JobQueue {
    private queue: Job[] = [];
    private handlers = new Map<string, JobHandler>();
    private processing = false;
    private processInterval: ReturnType<typeof setInterval> | null = null;

    /**
     * Register a handler for a job type.
     */
    on(type: string, handler: JobHandler): void {
        this.handlers.set(type, handler);
    }

    /**
     * Add a job to the queue.
     */
    enqueue(type: string, payload: any, options: { priority?: number; maxAttempts?: number } = {}): string {
        const job: Job = {
            id: `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            type,
            payload,
            priority: options.priority ?? 5,
            status: 'pending',
            attempts: 0,
            maxAttempts: options.maxAttempts ?? 3,
            createdAt: new Date().toISOString(),
        };

        // Insert sorted by priority (lower number = higher priority)
        const insertIdx = this.queue.findIndex(j => j.priority > job.priority);
        if (insertIdx === -1) this.queue.push(job);
        else this.queue.splice(insertIdx, 0, job);

        console.log(`[JobQueue] Enqueued: ${type} (${job.id}) priority=${job.priority}`);
        this.startProcessing();
        return job.id;
    }

    /**
     * Process next job in queue.
     */
    private async processNext(): Promise<void> {
        if (this.processing) return;
        this.processing = true;

        const job = this.queue.find(j => j.status === 'pending');
        if (!job) {
            this.processing = false;
            this.stopProcessing();
            return;
        }

        const handler = this.handlers.get(job.type);
        if (!handler) {
            job.status = 'failed';
            job.error = `No handler for job type: ${job.type}`;
            this.processing = false;
            return;
        }

        job.status = 'processing';
        job.attempts++;
        job.processedAt = new Date().toISOString();

        try {
            await handler(job.payload);
            job.status = 'completed';
            job.completedAt = new Date().toISOString();
            console.log(`[JobQueue] Completed: ${job.type} (${job.id})`);
        } catch (err: any) {
            if (job.attempts >= job.maxAttempts) {
                job.status = 'failed';
                job.error = err.message;
                console.error(`[JobQueue] Failed permanently: ${job.type} (${job.id}): ${err.message}`);
            } else {
                job.status = 'pending'; // Retry
                console.warn(`[JobQueue] Retrying: ${job.type} (${job.id}) attempt ${job.attempts}/${job.maxAttempts}`);
            }
        }

        this.processing = false;
    }

    /**
     * Start background processing.
     */
    private startProcessing(): void {
        if (this.processInterval) return;
        this.processInterval = setInterval(() => this.processNext(), 1000);
    }

    /**
     * Stop background processing.
     */
    private stopProcessing(): void {
        if (this.processInterval) {
            clearInterval(this.processInterval);
            this.processInterval = null;
        }
    }

    /**
     * Get all jobs in queue (for status lookups).
     */
    getJobs(): Job[] {
        return [...this.queue];
    }

    /**
     * Get queue status (for admin dashboard).
     */
    getStatus(): { pending: number; processing: number; completed: number; failed: number; total: number } {
        return {
            pending: this.queue.filter(j => j.status === 'pending').length,
            processing: this.queue.filter(j => j.status === 'processing').length,
            completed: this.queue.filter(j => j.status === 'completed').length,
            failed: this.queue.filter(j => j.status === 'failed').length,
            total: this.queue.length,
        };
    }

    /**
     * Get failed jobs (for retry).
     */
    getFailedJobs(): Job[] {
        return this.queue.filter(j => j.status === 'failed');
    }

    /**
     * Retry a failed job.
     */
    retryJob(jobId: string): boolean {
        const job = this.queue.find(j => j.id === jobId && j.status === 'failed');
        if (!job) return false;
        job.status = 'pending';
        job.attempts = 0;
        job.error = undefined;
        this.startProcessing();
        return true;
    }

    /**
     * Clear completed jobs.
     */
    clearCompleted(): number {
        const before = this.queue.length;
        this.queue = this.queue.filter(j => j.status !== 'completed');
        return before - this.queue.length;
    }
}

export const jobQueue = new JobQueue();

// ─── Pre-defined Job Types ─────────────────────────────────────────────

// Email sending
jobQueue.on('send-email', async (payload: { to: string; subject: string; html: string }) => {
    const { emailService } = require('./emailService');
    await emailService.send(payload);
});

// Data export
jobQueue.on('export-user-data', async (payload: { email: string }) => {
    // Generate export and send email when ready
    console.log(`[JobQueue] Processing data export for ${payload.email}`);
});

// Content moderation
jobQueue.on('moderate-content', async (payload: { text: string; contentId: string }) => {
    // Run moderation check
    console.log(`[JobQueue] Moderating content ${payload.contentId}`);
});

// Cleanup stale presence
jobQueue.on('cleanup-presence', async (payload: { storyId: string }) => {
    const { cleanupStalePresence } = require('./collaboration');
    await cleanupStalePresence(payload.storyId);
});
