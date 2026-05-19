import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './e2e/tests',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 1 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: process.env.CI
        ? [['github'], ['html', { open: 'never' }]]
        : [['html', { open: 'on-failure' }]],

    use: {
        // Use vite preview's default port (4173) rather than the more common
        // 8000 to avoid clashing with other local dev servers (e.g. python
        // http.server, uvicorn). Playwright's `reuseExistingServer: true` in
        // dev mode otherwise binds to whatever is already on the port and
        // every test returns 404 / wrong-app responses.
        baseURL: 'http://localhost:4173',
        // Bypass CSP so our mock FHIR endpoint (https://mock-fhir.test.local)
        // can be fetched by the bundled fhirclient even though it is not in
        // production's `connect-src` allowlist. CSP fires before any
        // page.route handler, so without this flag every FHIR call is blocked
        // at the browser before Playwright can intercept it.
        bypassCSP: true,
        // Block service workers by default. The SW intercepts FHIR calls via
        // its own `fetch()`, which `page.route` does not reliably proxy, so
        // the mock-FHIR server stops working in any test that lets the SW
        // register. The offline-mode spec opts back in with
        // `test.use({ serviceWorkers: 'allow' })`.
        serviceWorkers: 'block',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
    },

    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
        {
            name: 'firefox',
            use: { ...devices['Desktop Firefox'] },
        },
        {
            name: 'webkit',
            use: { ...devices['Desktop Safari'] },
        },
    ],

    webServer: {
        // Use `vite preview` (serves `dist/`) rather than `http-server`.
        // http-server's HTTP/1.1 keep-alive handling causes
        // NS_ERROR_NET_EMPTY_RESPONSE on Firefox + Playwright on CI runners;
        // vite preview is the Playwright-recommended dev server and is
        // closer to what the production Nginx container serves.
        command: 'npx vite preview --port 4173 --strictPort',
        port: 4173,
        reuseExistingServer: !process.env.CI,
        timeout: 60000,
    },
});
