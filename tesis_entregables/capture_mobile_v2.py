"""
Captura mejorada de la app Flutter EcoRoute Driver.
Flutter Web renderiza con canvas — usa keyboard nativo para inputs.
"""
import sys
import time
from pathlib import Path
from playwright.sync_api import sync_playwright

OUT_DIR = Path(__file__).parent / "figuras_capturas"
OUT_DIR.mkdir(exist_ok=True)
MOBILE = "http://127.0.0.1:3001"

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding='utf-8')


def shot(page, filename, full_page=False):
    path = OUT_DIR / filename
    page.screenshot(path=str(path), full_page=full_page)
    print(f"  OK  {filename}  ({path.stat().st_size // 1024} KB)")


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx = browser.new_context(
            viewport={"width": 390, "height": 844},
            device_scale_factor=3,
            user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1",
            is_mobile=True,
            has_touch=True,
        )
        page = ctx.new_page()

        print("[FM1] Login Flutter")
        page.goto(MOBILE, wait_until="networkidle", timeout=60000)
        time.sleep(8)  # esperar bootstrap Flutter
        shot(page, "FM1_app_login.png")

        # Click en el campo Usuario y escribir
        print("  Click campo Usuario...")
        try:
            page.get_by_text("Usuario / Correo").click(timeout=5000)
            time.sleep(0.5)
            page.keyboard.type("conductor", delay=80)
            time.sleep(0.5)
            # Tab al siguiente campo
            page.keyboard.press("Tab")
            time.sleep(0.5)
            page.keyboard.type("conductor123", delay=80)
            time.sleep(0.5)
            shot(page, "FM1b_app_login_lleno.png")
            print("  Click INGRESAR...")
            page.get_by_text("INGRESAR").click(timeout=5000)
            time.sleep(6)  # esperar redirect post-login
            shot(page, "FM2_app_dashboard.png", full_page=True)
        except Exception as e:
            print(f"  WARN: {e}")
            shot(page, "FM2_app_estado.png", full_page=True)

        # Capturas adicionales si llegamos
        try:
            time.sleep(2)
            shot(page, "FM3_app_pagina_actual.png", full_page=True)
        except Exception:
            pass

        browser.close()


if __name__ == "__main__":
    main()
