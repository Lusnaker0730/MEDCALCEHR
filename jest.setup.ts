// jest.setup.ts
// Polyfill APIs for jsdom test environment
import { webcrypto } from 'crypto';
import { TextEncoder, TextDecoder } from 'util';

// Polyfill TextEncoder/TextDecoder (not available in older jsdom)
if (typeof globalThis.TextEncoder === 'undefined') {
    Object.defineProperty(globalThis, 'TextEncoder', {
        value: TextEncoder,
        writable: true,
        configurable: true
    });
}
if (typeof globalThis.TextDecoder === 'undefined') {
    Object.defineProperty(globalThis, 'TextDecoder', {
        value: TextDecoder,
        writable: true,
        configurable: true
    });
}

// Polyfill Response (not available in jsdom, needed for Cache API tests)
if (typeof globalThis.Response === 'undefined') {
    class MockResponse {
        body: string;
        headers: Headers;
        ok = true;
        status = 200;
        constructor(body?: string, init?: { headers?: Record<string, string> }) {
            this.body = body || '';
            this.headers = new Headers(init?.headers);
        }
        async json() { return JSON.parse(this.body); }
        async text() { return this.body; }
        clone() { return new MockResponse(this.body, { headers: Object.fromEntries(this.headers.entries()) }); }
    }
    Object.defineProperty(globalThis, 'Response', {
        value: MockResponse,
        writable: true,
        configurable: true
    });
}

// Polyfill Web Crypto API (jsdom has getRandomValues but not subtle)
const wc = webcrypto as unknown as Crypto;
Object.defineProperty(globalThis, 'crypto', {
    value: wc,
    writable: true,
    configurable: true
});
