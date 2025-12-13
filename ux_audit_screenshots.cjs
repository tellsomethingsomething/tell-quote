const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function captureScreenshots() {
  const screenshotDir = path.join(__dirname, 'audit_screenshots');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const baseUrl = 'http://localhost:5174';

  // Desktop viewport with localStorage pre-set for auth
  const desktopContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    storageState: {
      cookies: [],
      origins: [{
        origin: baseUrl,
        localStorage: [
          { name: 'tell_auth', value: 'authenticated' }
        ]
      }]
    }
  });
  const desktopPage = await desktopContext.newPage();

  // Navigate to the app
  await desktopPage.goto(baseUrl);
  await desktopPage.waitForLoadState('networkidle');
  await desktopPage.waitForTimeout(1000);

  // Capture Dashboard (default view)
  await desktopPage.screenshot({ path: path.join(screenshotDir, 'dashboard_desktop.png'), fullPage: true });
  console.log('Captured: dashboard_desktop.png');

  // Click on Clients tab
  try {
    await desktopPage.click('text=Clients');
    await desktopPage.waitForTimeout(800);
    await desktopPage.screenshot({ path: path.join(screenshotDir, 'clients_desktop.png'), fullPage: true });
    console.log('Captured: clients_desktop.png');
  } catch (e) {
    console.log('Error capturing clients:', e.message);
  }

  // Click on Quotes tab
  try {
    await desktopPage.click('text=Quotes');
    await desktopPage.waitForTimeout(800);
    await desktopPage.screenshot({ path: path.join(screenshotDir, 'quotes_desktop.png'), fullPage: true });
    console.log('Captured: quotes_desktop.png');
  } catch (e) {
    console.log('Error capturing quotes:', e.message);
  }

  // Click on Rates tab
  try {
    await desktopPage.click('text=Rates');
    await desktopPage.waitForTimeout(800);
    await desktopPage.screenshot({ path: path.join(screenshotDir, 'rate_card_desktop.png'), fullPage: true });
    console.log('Captured: rate_card_desktop.png');
  } catch (e) {
    console.log('Error capturing rate card:', e.message);
  }

  // Click on Settings tab
  try {
    await desktopPage.click('text=Settings');
    await desktopPage.waitForTimeout(800);
    await desktopPage.screenshot({ path: path.join(screenshotDir, 'settings_desktop.png'), fullPage: true });
    console.log('Captured: settings_desktop.png');
  } catch (e) {
    console.log('Error capturing settings:', e.message);
  }

  // Go back to Dashboard and click New Quote
  try {
    await desktopPage.click('text=Dashboard');
    await desktopPage.waitForTimeout(500);
    await desktopPage.click('text=New Quote');
    await desktopPage.waitForTimeout(1000);
    await desktopPage.screenshot({ path: path.join(screenshotDir, 'editor_desktop.png'), fullPage: true });
    console.log('Captured: editor_desktop.png');
  } catch (e) {
    console.log('Error capturing editor:', e.message);
  }

  // Go to Clients and click on a client row
  try {
    await desktopPage.click('text=Clients');
    await desktopPage.waitForTimeout(800);
    const clientRows = await desktopPage.locator('table tbody tr').all();
    if (clientRows.length > 0) {
      await clientRows[0].click();
      await desktopPage.waitForTimeout(800);
      await desktopPage.screenshot({ path: path.join(screenshotDir, 'client_detail_desktop.png'), fullPage: true });
      console.log('Captured: client_detail_desktop.png');
    }
  } catch (e) {
    console.log('Error capturing client detail:', e.message);
  }

  await desktopContext.close();

  // Mobile viewport
  const mobileContext = await browser.newContext({
    viewport: { width: 375, height: 812 },
    storageState: {
      cookies: [],
      origins: [{
        origin: baseUrl,
        localStorage: [
          { name: 'tell_auth', value: 'authenticated' }
        ]
      }]
    }
  });
  const mobilePage = await mobileContext.newPage();

  await mobilePage.goto(baseUrl);
  await mobilePage.waitForLoadState('networkidle');
  await mobilePage.waitForTimeout(1000);

  // Capture mobile dashboard
  await mobilePage.screenshot({ path: path.join(screenshotDir, 'dashboard_mobile.png'), fullPage: true });
  console.log('Captured: dashboard_mobile.png');

  // Try mobile navigation (might have hamburger menu)
  try {
    // Look for menu button or navigation
    const menuButton = await mobilePage.locator('[aria-label*="menu"], button:has(svg)').first();
    if (await menuButton.isVisible()) {
      await menuButton.click();
      await mobilePage.waitForTimeout(500);
      await mobilePage.screenshot({ path: path.join(screenshotDir, 'mobile_menu.png'), fullPage: true });
      console.log('Captured: mobile_menu.png');
    }
  } catch (e) {
    console.log('Mobile menu not found or not clickable');
  }

  // Try clicking Clients on mobile
  try {
    await mobilePage.click('text=Clients');
    await mobilePage.waitForTimeout(800);
    await mobilePage.screenshot({ path: path.join(screenshotDir, 'clients_mobile.png'), fullPage: true });
    console.log('Captured: clients_mobile.png');
  } catch (e) {
    console.log('Error capturing mobile clients:', e.message);
  }

  // Try clicking Quotes on mobile
  try {
    await mobilePage.click('text=Quotes');
    await mobilePage.waitForTimeout(800);
    await mobilePage.screenshot({ path: path.join(screenshotDir, 'quotes_mobile.png'), fullPage: true });
    console.log('Captured: quotes_mobile.png');
  } catch (e) {
    console.log('Error capturing mobile quotes:', e.message);
  }

  // Try clicking Settings on mobile
  try {
    await mobilePage.click('text=Settings');
    await mobilePage.waitForTimeout(800);
    await mobilePage.screenshot({ path: path.join(screenshotDir, 'settings_mobile.png'), fullPage: true });
    console.log('Captured: settings_mobile.png');
  } catch (e) {
    console.log('Error capturing mobile settings:', e.message);
  }

  await mobileContext.close();
  await browser.close();
}

captureScreenshots().catch(console.error);
