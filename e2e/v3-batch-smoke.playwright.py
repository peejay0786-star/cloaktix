#!/usr/bin/env python3
"""Headless smoke against production Vite build — no wallet signing."""
from __future__ import annotations
import http.server
import socketserver
import threading
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1] / "web-dist-app-preview"
SMOKE = ROOT / "v3-batch-smoke.html"
if not SMOKE.is_file():
    print(f"Missing {SMOKE} — run web build:preview first", file=sys.stderr)
    sys.exit(2)

MIME = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".wasm": "application/wasm",
    ".json": "application/json",
}


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=str(ROOT), **k)

    def end_headers(self):
        self.send_header("Cross-Origin-Opener-Policy", "same-origin")
        self.send_header("Cross-Origin-Embedder-Policy", "require-corp")
        super().end_headers()

    def log_message(self, fmt, *args):
        pass


httpd = socketserver.TCPServer(("127.0.0.1", 0), Handler)
port = httpd.server_address[1]
thread = threading.Thread(target=httpd.serve_forever, daemon=True)
thread.start()

errors: list[str] = []
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, channel="chrome", executable_path="/usr/bin/google-chrome")
    page = browser.new_page()
    page.on("pageerror", lambda exc: errors.append(str(exc)))
    page.on("console", lambda msg: errors.append(msg.text) if msg.type == "error" else None)
    page.goto(f"http://127.0.0.1:{port}/v3-batch-smoke.html", wait_until="networkidle", timeout=120_000)
    page.wait_for_function("() => window.__V3_BATCH_SMOKE__", timeout=120_000)
    result = page.evaluate("() => window.__V3_BATCH_SMOKE__")
    body = page.locator("#out").inner_text()
    browser.close()

httpd.shutdown()
print(body)
if result != "PASS" or any("read only property" in e or "getProvableCircuitIds" in e for e in errors):
    print("SMOKE FAILED", result, errors, file=sys.stderr)
    sys.exit(1)
print("playwright v3-batch-smoke PASS")
