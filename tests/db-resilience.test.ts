import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getDbPool, isConnectionError, isDatabaseConnected } from '../db';

describe('Database Connection Self-Healing & Resilience', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Network Error Identification', () => {
        it('should correctly flag standard connection refusal errors', () => {
            const error = new Error('connect ECONNREFUSED 127.0.0.1:5432');
            expect(isConnectionError(error)).toBe(true);
        });

        it('should correctly flag timeout errors', () => {
            const error = new Error('Connection timeout exceeded');
            expect(isConnectionError(error)).toBe(true);
        });

        it('should correctly flag offline status messages', () => {
            const error = new Error('database is offline');
            expect(isConnectionError(error)).toBe(true);
        });

        it('should not flag standard SQL syntax or logic errors as network connection errors', () => {
            const error = new Error('syntax error at or near "SELECT"');
            expect(isConnectionError(error)).toBe(false);
        });

        it('should handle null or undefined error values gracefully', () => {
            expect(isConnectionError(null)).toBe(false);
            expect(isConnectionError(undefined)).toBe(false);
        });
    });

    describe('Database Connection Assertions', () => {
        it('should report database connection is active under standard operations', () => {
            expect(isDatabaseConnected()).toBe(true);
        });
    });

    describe('Adaptive Pool Factory Fallback', () => {
        it('should return a valid queryable pool instance (mock or real) on invocation', () => {
            const pool = getDbPool();
            expect(pool).toBeDefined();
            expect(typeof pool.query).toBe('function');
        });
    });
});
