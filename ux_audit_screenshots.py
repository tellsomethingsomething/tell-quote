#!/usr/bin/env python3
import sys
sys.path.insert(0, '/Users/tom/.claude/plugins/cache/anthropic-agent-skills/document-skills/00756142ab04/skills/webapp-testing/scripts')

from playwright.sync_api import sync_playwright
import os

def capture_screenshots():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        # Desktop viewport
        desktop_context = browser.new_context(viewport={'width': 1440, 'height': 900})
        page = desktop_context.new_page()

        # Enable console logging
        page.on('console', lambda msg: print(f'Console: {msg.text}'))

        base_url = 'http://localhost:5174'
        screenshot_dir = '/Users/tom/quote/audit_screenshots'
        os.makedirs(screenshot_dir, exist_ok=True)

        routes = [
            ('/', 'dashboard'),
            ('/clients', 'clients'),
            ('/quotes', 'quotes'),
            ('/rate-card', 'rate_card'),
            ('/settings', 'settings'),
            ('/login', 'login'),
        ]

        # Capture desktop screenshots
        for route, name in routes:
            try:
                page.goto(f'{base_url}{route}')
                page.wait_for_load_state('networkidle')
                page.wait_for_timeout(500)
                page.screenshot(path=f'{screenshot_dir}/{name}_desktop.png', full_page=True)
                print(f'Captured: {name}_desktop.png')
            except Exception as e:
                print(f'Error capturing {name}: {e}')

        # Try to capture a client detail page if clients exist
        try:
            page.goto(f'{base_url}/clients')
            page.wait_for_load_state('networkidle')
            page.wait_for_timeout(500)

            # Look for a client row to click
            client_rows = page.locator('table tbody tr, [data-testid="client-row"], .client-item').all()
            if client_rows:
                client_rows[0].click()
                page.wait_for_load_state('networkidle')
                page.wait_for_timeout(500)
                page.screenshot(path=f'{screenshot_dir}/client_detail_desktop.png', full_page=True)
                print('Captured: client_detail_desktop.png')
        except Exception as e:
            print(f'Could not capture client detail: {e}')

        desktop_context.close()

        # Mobile viewport
        mobile_context = browser.new_context(viewport={'width': 375, 'height': 812})
        mobile_page = mobile_context.new_page()

        for route, name in routes[:4]:  # Capture main pages on mobile
            try:
                mobile_page.goto(f'{base_url}{route}')
                mobile_page.wait_for_load_state('networkidle')
                mobile_page.wait_for_timeout(500)
                mobile_page.screenshot(path=f'{screenshot_dir}/{name}_mobile.png', full_page=True)
                print(f'Captured: {name}_mobile.png')
            except Exception as e:
                print(f'Error capturing mobile {name}: {e}')

        mobile_context.close()
        browser.close()

if __name__ == '__main__':
    capture_screenshots()
