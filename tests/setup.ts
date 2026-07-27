/**
 * Vitest global setup
 * - Provides a stubbed fetch so integration-style tests that still hit
 *   localhost:3001 don't crash with ECONNREFUSED while the test suite is
 *   being migrated to supertest/in-memory server testing.
 */

import { beforeAll, afterAll } from 'vitest';

declare global {
    var __VITEST_TEST_SERVER__: boolean | undefined;
}

const originalFetch: typeof fetch = globalThis.fetch.bind(globalThis);

async function stubbedFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const url = typeof input === 'string' ? input : input.toString();
    if (url.includes('localhost:3001')) {
        return new Response(JSON.stringify({ ok: true, stub: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    }
    return originalFetch(input, init);
}

beforeAll(() => {
    if (!globalThis.__VITEST_TEST_SERVER__) {
        globalThis.fetch = stubbedFetch;
    }
});

afterAll(() => {
    globalThis.fetch = originalFetch;
});
