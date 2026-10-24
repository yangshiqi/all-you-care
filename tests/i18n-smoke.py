"""Check locale hydration after dependency upgrades against a production server.

Start the app with `npm run build && npm start -- -p 1728`, then run:
  uv run --with playwright==1.64.1 python tests/i18n-smoke.py
If Chromium is missing, install it with:
  uv run --with playwright==1.64.1 python -m playwright install chromium
Pass --base-url to test another local port. No forms are submitted.
"""
import argparse
import os
import subprocess
from playwright.sync_api import expect, sync_playwright


def process_tree():
    rows = subprocess.check_output(['ps', '-axo', 'pid=,ppid='], text=True)
    return {int(pid): int(parent) for pid, parent in (row.split() for row in rows.splitlines())}


def descendants(tree, parent):
    owned = {parent}
    while True:
        expanded = owned | {pid for pid, ppid in tree.items() if ppid in owned}
        if expanded == owned:
            return owned - {parent}
        owned = expanded


def check(base_url):
    baseline = process_tree()
    owned = set()
    errors = []
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            owned = descendants(process_tree(), os.getpid()) - baseline.keys()
            context = browser.new_context(viewport={'width': 1440, 'height': 900}, locale='en-US')
            try:
                page = context.new_page()
                page.on('pageerror', lambda error: errors.append(str(error)))
                page.goto(f'{base_url.rstrip("/")}/en', wait_until='domcontentloaded')
                page.wait_for_load_state('networkidle')
                assert not errors, errors
                header = page.locator('header')
                expect(header.locator('nav').first.get_by_role('link', name='AI Daily', exact=True)).to_be_visible()
                expect(header.locator('button').filter(has=page.locator('svg.lucide-globe'))).to_be_visible()
                page.get_by_role('button', name='中文', exact=True).click()
                page.wait_for_url('**/zh-CN')
                expect(header.locator('nav').first.get_by_role('link', name='AI 日报', exact=True)).to_be_visible()
                assert page.evaluate('localStorage.getItem("language")') == 'zh-CN'
                page.get_by_role('button', name='EN', exact=True).click()
                page.wait_for_url('**/en')
                expect(header.locator('nav').first.get_by_role('link', name='AI Daily', exact=True)).to_be_visible()
                assert page.evaluate('localStorage.getItem("language")') == 'en'
                page.reload(wait_until='networkidle')
                expect(header.locator('nav').first.get_by_role('link', name='AI Daily', exact=True)).to_be_visible()
                page.set_viewport_size({'width': 390, 'height': 844})
                menu = page.get_by_role('button', name='Toggle menu')
                menu.click()
                expect(header.locator('nav').last.get_by_role('link', name='AI Daily', exact=True)).to_be_visible()
                expect(menu.locator('svg.lucide-x')).to_be_visible()
                menu.click()
                expect(header.locator('nav').last.get_by_role('link', name='AI Daily', exact=True)).not_to_be_visible()
                assert not errors, errors
                print('PASS: English hydration/reload, language switching/storage, Lucide icons, mobile menu; no page errors')
            finally:
                owned |= descendants(process_tree(), os.getpid()) - baseline.keys()
                context.close()
                browser.close()
    finally:
        remaining = owned & process_tree().keys()
        assert not remaining, f'Owned browser/driver processes still running: {sorted(remaining)}'


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--base-url', default='http://127.0.0.1:1728')
    check(parser.parse_args().base_url)
