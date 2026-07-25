/**
 * Error Tracker — Task 1.5
 * Lightweight error capture with structured output.
 * Drop-in ready for Sentry SDK swap when ready.
 */

import { logger } from './logger';

interface ErrorContext {
    requestId?: string;
    userId?: string;
    endpoint?: string;
    tags?: Record<string, string>;
    extra?: Record<string, any>;
}

class ErrorTracker {
    private queue: Array<{ error: Error; context: ErrorContext; timestamp: string }> = [];
    private flushInterval: ReturnType<typeof setInterval> | null = null;

    constructor() {
        // Flush every 30 seconds if there are buffered errors
        this.flushInterval = setInterval(() => this.flush(), 30000);
    }

    captureError(error: Error, context: ErrorContext = {}) {
        const entry = {
            error,
            context,
            timestamp: new Date().toISOString(),
        };

        logger.error('Captured error', {
            message: error.message,
            stack: error.stack,
            ...context,
        });

        this.queue.push(entry);

        // Immediate flush for critical errors
        if (this.isCritical(error)) {
            this.flush();
        }
    }

    private isCritical(error: Error): boolean {
        const msg = error.message.toLowerCase();
        return msg.includes('econnrefused') || 
               msg.includes('enotfound') || 
               msg.includes('out of memory') ||
               msg.includes('fatal');
    }

    private async flush() {
        if (this.queue.length === 0) return;
        
        const batch = this.queue.splice(0);
        
        // Currently logs to structured output.
        // To enable Sentry: import * as Sentry from '@sentry/node'; Sentry.init({ dsn: ... });
        // Then replace this block with: batch.forEach(({ error, context }) => Sentry.captureException(error, { extra: context }));
        
        for (const { error, context, timestamp } of batch) {
            logger.error('Error batch entry', {
                message: error.message,
                timestamp,
                ...context,
            });
        }
    }

    // Express error handling middleware
    errorHandler(err: any, req: any, res: any, _next: any) {
        this.captureError(err, {
            requestId: req.requestId,
            endpoint: req.path,
            method: req.method,
        });

        const statusCode = err.statusCode || err.status || 500;
        res.status(statusCode).json({
            error: statusCode === 500 ? 'Internal server error' : err.message,
            requestId: req.requestId,
        });
    }
}

export const errorTracker = new ErrorTracker();
