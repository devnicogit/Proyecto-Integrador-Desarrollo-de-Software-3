"""
Captura screenshots reales del emulador Android (Pixel 9 Pro XL)
mientras corre la app Flutter EcoRoute Driver.

Usa `adb exec-out screencap -p` que pipea el PNG por stdout (más confiable).
"""
import subprocess
import sys
import time
from pathlib import Path

ADB = r"C:\Users\USUARIO\AppData\Local\Android\Sdk\platform-tools\adb.exe"
OUT_DIR = Path(__file__).parent / "figuras_capturas"
OUT_DIR.mkdir(exist_ok=True)

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding='utf-8')


def screenshot(filename: str):
    out_path = OUT_DIR / filename
    # exec-out devuelve el binario PNG directo sin necesidad de pull
    r = subprocess.run([ADB, "exec-out", "screencap", "-p"], capture_output=True)
    if r.returncode != 0:
        print(f"  ERR {filename}: {r.stderr.decode('utf-8', errors='ignore')}")
        return None
    out_path.write_bytes(r.stdout)
    print(f"  OK  {filename}  ({out_path.stat().st_size // 1024} KB)")
    return out_path


def tap(x: int, y: int, label: str = ""):
    subprocess.run([ADB, "shell", "input", "tap", str(x), str(y)], check=False)
    print(f"  TAP ({x},{y}) {label}")


def swipe(x1, y1, x2, y2, duration=300):
    subprocess.run([ADB, "shell", "input", "swipe", str(x1), str(y1), str(x2), str(y2), str(duration)], check=False)


def keyevent(code: str):
    subprocess.run([ADB, "shell", "input", "keyevent", code], check=False)


def back():
    keyevent("KEYCODE_BACK")


def main():
    print("=== Captura del aplicativo móvil EcoRoute Driver ===\n")

    # 1) Estado actual (probablemente Mis Rutas)
    print("[FM_curr] Estado actual de la app")
    screenshot("FM_android_estado_inicial.png")

    # 2) Si está en mapa, hacer scroll para ver lista completa
    print("\n[FM_scroll] Hacer scroll para ver más pedidos")
    swipe(640, 2000, 640, 1200, 400)
    time.sleep(1)
    screenshot("FM_android_lista_pedidos.png")
    swipe(640, 2000, 640, 1200, 400)
    time.sleep(1)
    screenshot("FM_android_lista_pedidos_b.png")

    # 3) Tap en el primer pedido para abrir detalle
    print("\n[FM_detalle] Abrir detalle de un pedido")
    swipe(640, 1200, 640, 2000, 400)  # volver arriba
    time.sleep(1)
    tap(640, 1700, "Primer pedido en lista")
    time.sleep(3)
    screenshot("FM_android_detalle_pedido.png")

    # 4) Probar abrir el menú lateral (si existe) o botón perfil
    print("\n[FM_perfil] Tap icono perfil (esquina superior derecha)")
    back()
    time.sleep(1)
    tap(1180, 175, "Icono perfil")
    time.sleep(3)
    screenshot("FM_android_perfil.png")

    # 5) Cerrar sesion para volver al Login y capturarlo
    print("\n[FM_logout] Cerrar sesión")
    back()
    time.sleep(1)
    tap(1230, 175, "Icono logout")
    time.sleep(3)
    screenshot("FM_android_login_logout.png")

    # 6) Si volvimos al login, capturarlo limpio
    time.sleep(2)
    screenshot("FM_android_login_clean.png")

    print(f"\nLas capturas se guardaron en: {OUT_DIR}")


if __name__ == "__main__":
    main()
