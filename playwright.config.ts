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
        baseURL: 'http://localhost:8000',
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
        command: 'npx vite preview --port 8000 --strictPort',
        port: 8000,
        reuseExistingServer: !process.env.CI,
        timeout: 60000,
    },
});
