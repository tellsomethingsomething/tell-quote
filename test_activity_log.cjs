const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    console.log('Navigating to app...');
    await page.goto('http://localhost:5173/');
    await page.waitForTimeout(2000);
    
    // Take screenshot of initial page
    await page.screenshot({ path: '/tmp/activity_test_1_initial.png' });
    console.log('✓ Initial page loaded');
    
    // Check for login - look for password input
    const passwordInput = await page.$('input[type="password"]');
    if (passwordInput) {
        console.log('Found login page, entering password...');
        await passwordInput.fill('tell2024');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(2000);
        await page.screenshot({ path: '/tmp/activity_test_2_after_login.png' });
        console.log('✓ Logged in');
    }
    
    // Go to Editor view to make some changes
    console.log('Looking for Editor navigation...');
    
    // Look for Editor button in nav
    const editorNav = await page.$('nav >> text=Editor');
    if (editorNav) {
        await editorNav.click();
        await page.waitForTimeout(1500);
        console.log('✓ Clicked Editor nav');
    }
    
    await page.screenshot({ path: '/tmp/activity_test_3_editor.png' });
    
    // Make a change to client company name
    console.log('Making changes to trigger activity logging...');
    
    // Find company name input
    const companyInput = await page.$('input[placeholder*="search or add new client"]');
    if (companyInput) {
        await companyInput.fill('');
        await companyInput.type('Test Activity Company');
        await page.waitForTimeout(500);
        console.log('✓ Changed company name');
    }
    
    // Find project title input
    const titleInput = await page.$('input[placeholder*="Shopee"]');
    if (titleInput) {
        await titleInput.fill('Test Project for Activity Log');
        await page.waitForTimeout(500);
        console.log('✓ Changed project title');
    }
    
    await page.screenshot({ path: '/tmp/activity_test_4_changes.png' });
    
    // Now go to Settings to check Activity Log
    console.log('Navigating to Settings...');
    const settingsNav = await page.$('nav >> text=Settings');
    if (settingsNav) {
        await settingsNav.click();
        await page.waitForTimeout(1500);
        console.log('✓ Clicked Settings nav');
    }
    
    await page.screenshot({ path: '/tmp/activity_test_5_settings.png' });
    
    // Look for Activity Log tab
    console.log('Looking for Activity Log tab...');
    const activityTab = await page.$('button:has-text("Activity Log")');
    if (activityTab) {
        await activityTab.click();
        await page.waitForTimeout(1500);
        console.log('✓ Clicked Activity Log tab');
    } else {
        // Try scrolling to find it
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.waitForTimeout(500);
        const tabs = await page.$$('button');
        for (const tab of tabs) {
            const text = await tab.textContent();
            if (text && text.includes('Activity')) {
                await tab.click();
                await page.waitForTimeout(1500);
                console.log('✓ Found and clicked Activity tab');
                break;
            }
        }
    }
    
    await page.screenshot({ path: '/tmp/activity_test_6_activity_log.png', fullPage: true });
    
    // Check for activity entries
    const pageContent = await page.content();
    
    if (pageContent.includes('client.company') || pageContent.includes('project.title') || pageContent.includes('Changed')) {
        console.log('✓ Activity log entries found!');
    } else if (pageContent.includes('No activity')) {
        console.log('⚠ Activity log shows "No activity" - entries may not have been created');
    } else {
        console.log('⚠ Could not verify activity log entries');
    }
    
    // Get activity log count
    const logEntries = await page.$$('[class*="activity"], [class*="log"] > div');
    console.log(`Found ${logEntries.length} potential log entry elements`);
    
    await browser.close();
    console.log('\nTest completed! Screenshots saved to /tmp/activity_test_*.png');
})();
