"""
Captura del flujo de login Flutter usando coordenadas directas.
El viewport es 390x844 (iPhone 14 Pro).
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
            is_mobile=True,
            has_touch=True,
        )
        page = ctx.new_page()

        print("[FM1] Cargando Flutter app...")
        page.goto(MOBILE, wait_until="networkidle", timeout=60000)
        time.sleep(10)
        shot(page, "FM1_app_login.png")

        # Inyectar accesibilidad en Flutter Web
        print("  Habilitando semantics...")
        try:
            page.evaluate("""
                () => {
                    if (window.$flutterSemanticsService) {
                        window.$flutterSemanticsService.semanticsEnabled = true;
                    }
                    // Force semantics via aria
                    document.dispatchEvent(new Event('semantics-enabled'));
                }
            """)
            time.sleep(2)
        except Exception as e:
            print(f"  WARN semantics: {e}")

        # Coords aproximadas según la captura (viewport 390x844):
        # Campo Usuario: y ≈ 360
        # Campo Pass: y ≈ 420
        # Botón INGRESAR: y ≈ 490
        print("  Click campo Usuario @ (195, 360)")
        page.mouse.click(195, 360)
        time.sleep(0.5)
        page.keyboard.type("conductor", delay=100)
        time.sleep(0.5)
        shot(page, "FM1a_usuario_lleno.png")

        print("  Click campo Password @ (195, 420)")
        page.mouse.click(195, 420)
        time.sleep(0.5)
        page.keyboard.type("conductor123", delay=100)
        time.sleep(0.5)
        shot(page, "FM1b_pass_lleno.png")

        print("  Click INGRESAR @ (195, 490)")
        page.mouse.click(195, 490)
        time.sleep(8)
        shot(page, "FM2_app_post_login.png", full_page=True)

        # Intentar capturar más vistas si la app navegó
        for i in range(3):
            time.sleep(2)
            shot(page, f"FM3_app_view_{i+1}.png", full_page=False)

        browser.close()
        print("\nListo")


if __name__ == "__main__":
    main()
