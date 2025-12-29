import { defineConfig, devices } from '@playwright/test';

/**
 * ProductionOS Playwright Test Configuration
 *
 * Run all tests: npx playwright test
 * Run specific file: npx playwright test tests/e2e/critical-flows.spec.js
 * Run with UI: npx playwright test --ui
 * Generate report: npx playwright show-report
 */

export default defineConfig({
    testDir: './tests/e2e',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: [
        ['list'],
        ['html', { outputFolder: 'test-results/html-report' }],
    ],
    outputDir: 'test-results',

    use: {
        baseURL: process.env.TEST_URL || 'http://localhost:5173',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
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
        {
            name: 'Mobile Chrome',
            use: { ...devices['Pixel 5'] },
        },
        {
            name: 'Mobile Safari',
            use: { ...devices['iPhone 12'] },
        },
    ],

    // Run local dev server before tests if not testing production
    webServer: process.env.TEST_URL ? undefined : {
        command: 'npm run dev',
        url: 'http://localhost:5173',
        reuseExistingServer: !process.env.CI,
        timeout: 120000,
    },
});
