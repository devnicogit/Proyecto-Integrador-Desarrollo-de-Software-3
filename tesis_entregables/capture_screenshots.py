"""
Captura automatizada de pantallas del sistema EcoRoute para la tesis.
Usa Playwright (Chromium headless) y guarda PNGs HD en figuras_capturas/.

REQUISITOS:
    pip install playwright
    python -m playwright install chromium
    + Docker + Backend + Web admin levantados (puerto 3000)
"""
import subprocess
import sys
import time
from pathlib import Path

OUT_DIR = Path(__file__).parent / "figuras_capturas"
OUT_DIR.mkdir(exist_ok=True)
WEB = "http://localhost:3000"

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding='utf-8')


def ensure_playwright_browser() -> bool:
    """Asegura que el browser de Playwright esté instalado.
    Si falta, ejecuta `playwright install chromium` automáticamente.
    Devuelve True si está OK, False si no se pudo instalar."""
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print("[ERR] Falta instalar playwright. Ejecutá: pip install playwright")
        return False
    try:
        # Probar lanzar el browser; si falla por executable doesn't exist, instalar
        with sync_playwright() as p:
            try:
                browser = p.chromium.launch(headless=True)
                browser.close()
                return True
            except Exception as e:
                if "Executable doesn't exist" in str(e) or "playwright install" in str(e):
                    print("[INFO] Browser de Playwright no instalado; instalando chromium...")
                    result = subprocess.run(
                        [sys.executable, "-m", "playwright", "install", "chromium"],
                        capture_output=False,
                    )
                    return result.returncode == 0
                raise
    except Exception as e:
        print(f"[ERR] Playwright no disponible: {e}")
        return False


# Garantizar browser instalado antes de importar lo demás
if not ensure_playwright_browser():
    print("[FATAL] No se pudo asegurar el browser de Playwright. Abortando.")
    sys.exit(1)

from playwright.sync_api import sync_playwright, TimeoutError as PWTimeout


def shot(page, filename, full_page=True):
    path = OUT_DIR / filename
    page.screenshot(path=str(path), full_page=full_page)
    print(f"  OK  {filename}  ({path.stat().st_size // 1024} KB)")


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx = browser.new_context(
            viewport={"width": 1440, "height": 900},
            device_scale_factor=2,  # retina-like, alta resolucion
        )
        page = ctx.new_page()
        # Inject mock_ADMIN token before navigation to skip Keycloak
        page.goto(WEB + "/login", wait_until="networkidle")
        page.evaluate("localStorage.setItem('token', 'mock_ADMIN')")
        page.evaluate("localStorage.setItem('user', JSON.stringify({username:'admin', roles:['ADMIN']}))")

        # F20 Login (limpio)
        print("[F20] Login")
        page.reload(wait_until="networkidle")
        time.sleep(1)
        shot(page, "F20_login.png", full_page=False)

        # Loggear y entrar
        page.evaluate("localStorage.setItem('token', 'mock_ADMIN')")
        page.evaluate("localStorage.setItem('user', JSON.stringify({username:'admin', roles:['ADMIN']}))")

        # F21 Home
        print("[F21] Home")
        page.goto(WEB + "/home", wait_until="networkidle")
        time.sleep(1)
        shot(page, "F21_home.png", full_page=True)

        # F22 Dashboard
        print("[F22] Dashboard")
        page.goto(WEB + "/dashboard", wait_until="networkidle")
        time.sleep(2)
        shot(page, "F22_dashboard.png", full_page=True)

        # F23 Pedidos
        print("[F23] Pedidos")
        page.goto(WEB + "/orders", wait_until="networkidle")
        time.sleep(2)
        shot(page, "F23_pedidos.png", full_page=True)

        # F24 Rutas
        print("[F24] Rutas")
        page.goto(WEB + "/routes", wait_until="networkidle")
        time.sleep(2)
        shot(page, "F24_rutas.png", full_page=True)

        # F25 Conductores
        print("[F25] Conductores")
        page.goto(WEB + "/drivers", wait_until="networkidle")
        time.sleep(2)
        shot(page, "F25_conductores.png", full_page=True)

        # F26 Vehículos
        print("[F26] Vehiculos")
        page.goto(WEB + "/vehicles", wait_until="networkidle")
        time.sleep(2)
        shot(page, "F26_vehiculos.png", full_page=True)

        # F47 KPI Dashboard Tesis (POST-TEST, default)
        print("[F47] KPI Dashboard Tesis Post-Test")
        page.goto(WEB + "/reports", wait_until="networkidle")
        time.sleep(3)
        shot(page, "F47_kpi_dashboard_post.png", full_page=True)

        # F47b KPI Dashboard Pre-Test
        print("[F47b] KPI Dashboard Tesis Pre-Test")
        try:
            page.get_by_text("Pre-Test").first.click(timeout=5000)
            time.sleep(2)
            shot(page, "F47b_kpi_dashboard_pre.png", full_page=True)
        except Exception as e:
            print(f"  WARN: No se pudo cambiar a Pre-Test: {e}")

        # F47c KPIs Vista Solo Cards (tab Tesis, vuelve a Post)
        print("[F47c] KPI Cards Post-Test (vuelve)")
        try:
            page.get_by_text("Post-Test").first.click(timeout=5000)
            time.sleep(2)
            shot(page, "F47c_kpi_cards_post.png", full_page=False)
        except Exception:
            pass

        # F39 Dashboard otra vista (con scroll)
        print("[F39] Dashboard scroll")
        page.goto(WEB + "/dashboard", wait_until="networkidle")
        time.sleep(2)
        page.evaluate("window.scrollTo(0, 0)")
        shot(page, "F39_dashboard_top.png", full_page=False)
        page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        time.sleep(1)
        shot(page, "F39b_dashboard_bottom.png", full_page=False)

        browser.close()
        print(f"\nTotal capturas en: {OUT_DIR}")


if __name__ == "__main__":
    main()
