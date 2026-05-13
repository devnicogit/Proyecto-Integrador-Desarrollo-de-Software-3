"""
Convierte los mockups HTML a PNG de alta resolucion usando Playwright.
Estos PNGs complementan las capturas reales del sistema.
"""
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).parent
MOCKUP_DIR = ROOT / "figuras_mockup"
OUT_DIR = ROOT / "figuras_capturas"
OUT_DIR.mkdir(exist_ok=True)

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding='utf-8')

# Mapeo: archivo HTML -> nombre PNG salida + viewport
MOCKUPS = [
    ("figura_FM2_app_movil.html", "MOCKUP_FM_app_movil_flujo.png", 800, 760, False),
    ("figura_FR1_ficha_IID.html", "MOCKUP_FR_ficha_iid.png", 900, 1280, True),
]


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        for html_file, png_name, w, h, fullpage in MOCKUPS:
            html_path = MOCKUP_DIR / html_file
            if not html_path.exists():
                print(f"SKIP no existe {html_file}")
                continue
            ctx = browser.new_context(
                viewport={"width": w, "height": h},
                device_scale_factor=2,
            )
            page = ctx.new_page()
            page.goto(f"file:///{html_path.absolute().as_posix()}", wait_until="networkidle")
            page.wait_for_timeout(800)
            out = OUT_DIR / png_name
            page.screenshot(path=str(out), full_page=fullpage)
            print(f"  OK  {png_name}  ({out.stat().st_size // 1024} KB)")
            ctx.close()
        browser.close()


if __name__ == "__main__":
    main()
