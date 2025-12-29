#!/usr/bin/env node

/**
 * ProductionOS Quick Test Script
 *
 * Runs rapid sanity checks on critical user paths.
 * Usage: node scripts/quick-test.js [--production]
 */

import { chromium } from 'playwright';

const isProduction = process.argv.includes('--production') || process.argv.includes('--prod');
const BASE_URL = isProduction ? 'https://productionos.io' : 'http://localhost:5173';

console.log(`\n🧪 ProductionOS Quick Test Suite`);
console.log(`📍 Testing: ${BASE_URL}`);
console.log(`${'─'.repeat(50)}\n`);

const results = [];

async function runTest(name, testFn) {
    process.stdout.write(`  ${name}... `);
    const start = Date.now();
    try {
        await testFn();
        const duration = Date.now() - start;
        console.log(`✅ (${duration}ms)`);
        results.push({ name, status: 'pass', duration });
        return true;
    } catch (error) {
        const duration = Date.now() - start;
        console.log(`❌ FAILED (${duration}ms)`);
        console.log(`     └─ ${error.message}`);
        results.push({ name, status: 'fail', duration, error: error.message });
        return false;
    }
}

async function main() {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    console.log('🔍 Testing Public Pages\n');

    // Test landing page
    await runTest('Landing page loads', async () => {
        const response = await page.goto(BASE_URL, { timeout: 30000 });
        if (!response || response.status() >= 400) {
            throw new Error(`HTTP ${response?.status()}`);
        }
    });

    // Test pricing page
    await runTest('Pricing page loads', async () => {
        const response = await page.goto(`${BASE_URL}/pricing`, { timeout: 30000 });
        if (!response || response.status() >= 400) {
            throw new Error(`HTTP ${response?.status()}`);
        }
        // Wait for page to render
        await page.waitForTimeout(1500);
        // Check for plan names in various ways
        const hasIndividual = await page.getByText('Individual').first().count() > 0;
        const hasTeam = await page.getByText('Team').first().count() > 0;
        const hasFree = await page.getByText('Free').first().count() > 0;
        if (!hasIndividual && !hasTeam && !hasFree) {
            throw new Error('Plan names not found');
        }
    });

    // Test pricing toggle
    await runTest('Pricing toggle works', async () => {
        await page.goto(`${BASE_URL}/pricing`);
        const annualText = await page.getByText('Annual').first();
        if (await annualText.count() > 0) {
            // Find and click the toggle
            const toggle = page.locator('button').filter({ has: page.locator('[class*="rounded-full"]') }).first();
            if (await toggle.count() > 0) {
                await toggle.click();
                await page.waitForTimeout(500);
            }
        }
    });

    // Test regional pricing
    await runTest('Regional pricing (Singapore)', async () => {
        await page.goto(`${BASE_URL}/pricing?country=SG`, { timeout: 30000 });
        await page.waitForTimeout(2000);
        const content = await page.content();
        if (!content.includes('S$') && !content.includes('SGD') && !content.includes('Regional')) {
            throw new Error('Singapore pricing not detected');
        }
    });

    // Test login page
    await runTest('Login page loads', async () => {
        const response = await page.goto(`${BASE_URL}/auth/login`, { timeout: 30000 });
        if (!response || response.status() >= 400) {
            throw new Error(`HTTP ${response?.status()}`);
        }
        const emailInput = page.getByLabel(/email/i);
        if (await emailInput.count() === 0) {
            throw new Error('Email input not found');
        }
    });

    // Test signup page
    await runTest('Signup page loads', async () => {
        const response = await page.goto(`${BASE_URL}/auth/signup`, { timeout: 30000 });
        if (!response || response.status() >= 400) {
            throw new Error(`HTTP ${response?.status()}`);
        }
    });

    // Test legal pages
    console.log('\n🔍 Testing Legal Pages\n');

    await runTest('Terms of Service', async () => {
        const response = await page.goto(`${BASE_URL}/legal/terms`, { timeout: 30000 });
        if (!response || response.status() >= 400) {
            throw new Error(`HTTP ${response?.status()}`);
        }
    });

    await runTest('Privacy Policy', async () => {
        const response = await page.goto(`${BASE_URL}/legal/privacy`, { timeout: 30000 });
        if (!response || response.status() >= 400) {
            throw new Error(`HTTP ${response?.status()}`);
        }
    });

    await runTest('GDPR Page', async () => {
        const response = await page.goto(`${BASE_URL}/legal/gdpr`, { timeout: 30000 });
        if (!response || response.status() >= 400) {
            throw new Error(`HTTP ${response?.status()}`);
        }
    });

    // Test 404 handling
    console.log('\n🔍 Testing Error Handling\n');

    await runTest('404 page exists', async () => {
        await page.goto(`${BASE_URL}/this-does-not-exist-12345`);
        await page.waitForTimeout(2000);
        const content = await page.content();
        // Check for proper 404 page (not just fallback to landing)
        const has404 = content.includes('404') ||
                      content.toLowerCase().includes('not found') ||
                      content.toLowerCase().includes('page doesn\'t exist');
        if (!has404) {
            // Check if it fell back to landing page (known bug)
            // Use multiple possible landing page indicators
            const isLandingPage = content.includes('production companies') ||
                                 content.includes('Start Free Trial') ||
                                 content.includes('ProductionOS') ||
                                 content.includes('making money');
            if (isLandingPage) {
                throw new Error('Shows landing page instead of 404 (BUG-001)');
            }
            throw new Error('404 not handled - unknown state');
        }
    });

    // Test security headers
    console.log('\n🔍 Testing Security\n');

    await runTest('Protected routes redirect to login', async () => {
        await page.goto(`${BASE_URL}/dashboard`);
        await page.waitForTimeout(5000); // Allow time for auth check and redirect
        const url = page.url();
        const content = await page.content();

        // Should redirect to login specifically
        const redirectedToLogin = url.includes('login') || url.includes('auth');
        if (redirectedToLogin) {
            return; // Correct behavior
        }

        // Check if redirected to pricing (known bug)
        if (url.includes('pricing')) {
            throw new Error('Redirects to /pricing instead of /auth/login (BUG-002)');
        }

        // Check if still on dashboard with Loading state (auth checking)
        if (url.includes('dashboard') && content.includes('Loading')) {
            throw new Error('Stuck on loading state - auth check timeout');
        }

        // Check if redirected to home/landing
        const isLandingPage = content.includes('Start Free Trial') ||
                             content.includes('production companies') ||
                             content.includes('Finally know if');
        if (isLandingPage) {
            throw new Error('Redirects to landing/home instead of /auth/login (BUG-002)');
        }

        // Dashboard accessible without auth
        throw new Error(`Protected route not properly secured. URL: ${url.replace(BASE_URL, '')}`);
    });

    // Performance tests
    console.log('\n🔍 Testing Performance\n');

    await runTest('Landing page < 5s', async () => {
        const start = Date.now();
        await page.goto(BASE_URL, { waitUntil: 'networkidle' });
        const duration = Date.now() - start;
        if (duration > 5000) {
            throw new Error(`Took ${duration}ms`);
        }
    });

    await runTest('Pricing page < 5s', async () => {
        const start = Date.now();
        await page.goto(`${BASE_URL}/pricing`, { waitUntil: 'networkidle' });
        const duration = Date.now() - start;
        if (duration > 5000) {
            throw new Error(`Took ${duration}ms`);
        }
    });

    // Mobile viewport test
    console.log('\n🔍 Testing Mobile Viewport\n');

    await page.setViewportSize({ width: 375, height: 667 });

    await runTest('Mobile: Landing page', async () => {
        await page.goto(BASE_URL);
        await page.waitForLoadState('networkidle');
    });

    await runTest('Mobile: Pricing page', async () => {
        await page.goto(`${BASE_URL}/pricing`);
        await page.waitForLoadState('networkidle');
        const content = await page.content();
        if (!content.includes('Individual') && !content.includes('Team')) {
            throw new Error('Plans not visible on mobile');
        }
    });

    await browser.close();

    // Summary
    console.log('\n' + '─'.repeat(50));
    const passed = results.filter(r => r.status === 'pass').length;
    const failed = results.filter(r => r.status === 'fail').length;
    const total = results.length;

    console.log(`\n📊 Results: ${passed}/${total} passed`);

    if (failed > 0) {
        console.log(`\n❌ Failed tests:`);
        results.filter(r => r.status === 'fail').forEach(r => {
            console.log(`   - ${r.name}: ${r.error}`);
        });
        console.log('');
        process.exit(1);
    } else {
        console.log('\n✅ All tests passed!\n');
        process.exit(0);
    }
}

main().catch(err => {
    console.error('\n💥 Test suite crashed:', err.message);
    process.exit(1);
});
