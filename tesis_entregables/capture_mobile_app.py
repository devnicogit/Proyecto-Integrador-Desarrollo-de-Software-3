"""
Captura pantallas reales de la app móvil Flutter corriendo en Chrome.
Usa viewport tipo móvil (375x812 - iPhone 12).
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
            viewport={"width": 390, "height": 844},   # iPhone 14 Pro
            device_scale_factor=3,
            user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1",
            is_mobile=True,
            has_touch=True,
        )
        page = ctx.new_page()

        print("[FM1] Login app móvil")
        page.goto(MOBILE, wait_until="networkidle", timeout=60000)
        time.sleep(6)  # Flutter web needs time to bootstrap
        shot(page, "FM1_app_login.png")

        print("[FM2] Intentando ingresar como conductor...")
        # Flutter renders text — encontrar inputs y rellenar
        try:
            # Encontrar el input de usuario por placeholder o label
            user_input = page.locator("input[type='text'], input[autocomplete='username']").first
            user_input.fill("conductor", timeout=5000)
            pwd_input = page.locator("input[type='password'], input[autocomplete='current-password']").first
            pwd_input.fill("conductor123", timeout=5000)
            time.sleep(1)
            # Click en login (botón)
            try:
                page.locator("flt-glass-pane").first.click(timeout=2000)
            except Exception:
                pass
            page.get_by_text("Iniciar", exact=False).first.click(timeout=5000)
            time.sleep(4)
            shot(page, "FM2_app_lista_rutas.png")
        except Exception as e:
            print(f"  WARN login flow: {e}")
            shot(page, "FM2_app_estado_actual.png")

        # Mas pantallas si llegamos al home
        try:
            shot(page, "FM3_app_home.png", full_page=True)
        except Exception:
            pass

        browser.close()
        print(f"\nCapturas móvil en: {OUT_DIR}")


if __name__ == "__main__":
    main()
