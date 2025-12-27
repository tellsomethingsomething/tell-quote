#!/usr/bin/env python3
"""Mobile responsiveness audit for ProductionOS marketing site."""

from playwright.sync_api import sync_playwright
import os

# Create output directory for screenshots
os.makedirs('/tmp/mobile_audit', exist_ok=True)

PAGES_TO_TEST = [
    ('/', 'homepage'),
    ('/pricing', 'pricing'),
    ('/resources/blog', 'blog'),
    ('/company/about', 'about'),
    ('/company/contact', 'contact'),
    ('/features/quoting', 'feature_quoting'),
    ('/features/projects', 'feature_projects'),
    ('/features/crm', 'feature_crm'),
]

def audit_page(page, path, name):
    """Audit a single page for mobile responsiveness issues."""
    issues = []
    url = f'http://localhost:5173{path}'

    print(f"\n{'='*60}")
    print(f"Testing: {name} ({path})")
    print('='*60)

    # Navigate and wait for content to load
    page.goto(url)
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(1000)  # Extra time for animations

    # Clear any localStorage/sessionStorage to see marketing pages
    page.evaluate('localStorage.clear(); sessionStorage.clear();')
    page.reload()
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(500)

    # Take full page screenshot
    page.screenshot(path=f'/tmp/mobile_audit/{name}_full.png', full_page=True)
    print(f"  Screenshot saved: /tmp/mobile_audit/{name}_full.png")

    # Check for horizontal overflow (common mobile issue)
    scroll_width = page.evaluate('document.documentElement.scrollWidth')
    viewport_width = page.evaluate('window.innerWidth')
    if scroll_width > viewport_width:
        issues.append(f"HORIZONTAL OVERFLOW: Page width ({scroll_width}px) exceeds viewport ({viewport_width}px)")
    else:
        print(f"  Horizontal scroll: OK (no overflow)")

    # Check body font size
    body_font = page.evaluate('window.getComputedStyle(document.body).fontSize')
    print(f"  Body font size: {body_font}")

    # Find elements with potentially too-small touch targets
    small_buttons = page.evaluate('''() => {
        const elements = document.querySelectorAll('button, a, input[type="submit"]');
        const small = [];
        elements.forEach(el => {
            const rect = el.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
                if (rect.width < 44 || rect.height < 44) {
                    small.push({
                        tag: el.tagName,
                        text: el.textContent?.trim().substring(0, 30) || el.className,
                        width: Math.round(rect.width),
                        height: Math.round(rect.height)
                    });
                }
            }
        });
        return small.slice(0, 5);  // Limit to first 5
    }''')

    if small_buttons:
        print(f"  Small touch targets found: {len(small_buttons)}")
        for btn in small_buttons[:3]:
            print(f"    - {btn['tag']}: '{btn['text'][:20]}...' ({btn['width']}x{btn['height']}px)")
    else:
        print(f"  Touch targets: All adequately sized")

    # Check text readability - look for very small fonts
    small_text = page.evaluate('''() => {
        const elements = document.querySelectorAll('p, span, div, li, td, th');
        const small = [];
        elements.forEach(el => {
            const style = window.getComputedStyle(el);
            const fontSize = parseFloat(style.fontSize);
            if (fontSize > 0 && fontSize < 12 && el.textContent?.trim().length > 10) {
                small.push({
                    tag: el.tagName,
                    text: el.textContent?.trim().substring(0, 30),
                    size: fontSize
                });
            }
        });
        return small.slice(0, 3);
    }''')

    if small_text:
        print(f"  Small text found (<12px):")
        for txt in small_text:
            issues.append(f"Small text ({txt['size']}px): {txt['text'][:30]}")
            print(f"    - {txt['size']}px: '{txt['text']}'")
    else:
        print(f"  Text readability: OK (no text <12px)")

    # Test navigation menu (mobile hamburger)
    hamburger = page.locator('button:has(svg), [class*="menu"], [class*="hamburger"]').first
    if hamburger.is_visible():
        print(f"  Mobile menu button: Found")
        try:
            hamburger.click()
            page.wait_for_timeout(500)
            page.screenshot(path=f'/tmp/mobile_audit/{name}_menu_open.png')
            print(f"    Menu open screenshot saved")
            # Close menu by clicking again or elsewhere
            hamburger.click()
            page.wait_for_timeout(300)
        except Exception as e:
            print(f"    Could not interact with menu: {e}")

    # Scroll down and take a screenshot of content below fold
    page.evaluate('window.scrollTo(0, 800)')
    page.wait_for_timeout(300)
    page.screenshot(path=f'/tmp/mobile_audit/{name}_scrolled.png')

    return issues


def main():
    print("\n" + "="*60)
    print("MOBILE RESPONSIVENESS AUDIT")
    print("ProductionOS Marketing Site")
    print("Viewport: 375x812 (iPhone X)")
    print("="*60)

    all_issues = {}

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        # iPhone X viewport
        context = browser.new_context(
            viewport={'width': 375, 'height': 812},
            device_scale_factor=2,
            is_mobile=True,
            has_touch=True
        )
        page = context.new_page()

        for path, name in PAGES_TO_TEST:
            try:
                issues = audit_page(page, path, name)
                if issues:
                    all_issues[name] = issues
            except Exception as e:
                print(f"  ERROR: {e}")
                all_issues[name] = [f"Error loading page: {e}"]

        browser.close()

    # Summary report
    print("\n" + "="*60)
    print("AUDIT SUMMARY")
    print("="*60)

    if all_issues:
        print("\nIssues found:")
        for page_name, issues in all_issues.items():
            print(f"\n{page_name}:")
            for issue in issues:
                print(f"  - {issue}")
    else:
        print("\nNo critical issues found!")

    print(f"\nScreenshots saved to: /tmp/mobile_audit/")
    print("Review screenshots to identify visual layout issues.")


if __name__ == '__main__':
    main()
