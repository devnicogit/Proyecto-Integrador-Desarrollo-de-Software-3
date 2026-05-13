"""
Captura el flujo completo de la app móvil EcoRoute Driver en emulador Pixel 9 Pro XL.
Pantalla 1344x2992 (DPR 3.5 aprox), pero coords lógicas ≈ 412x917 dp.

ADB input tap usa coords físicas (1344x2992).
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
    r = subprocess.run([ADB, "exec-out", "screencap", "-p"], capture_output=True)
    if r.returncode != 0:
        print(f"  ERR {filename}")
        return None
    out_path.write_bytes(r.stdout)
    print(f"  OK  {filename}  ({out_path.stat().st_size // 1024} KB)")
    return out_path


def tap(x, y, label=""):
    subprocess.run([ADB, "shell", "input", "tap", str(x), str(y)], check=False)
    print(f"  TAP ({x},{y}) {label}")


def type_text(text):
    subprocess.run([ADB, "shell", "input", "text", text], check=False)


def keyevent(code):
    subprocess.run([ADB, "shell", "input", "keyevent", code], check=False)


def swipe(x1, y1, x2, y2, duration=400):
    subprocess.run([ADB, "shell", "input", "swipe", str(x1), str(y1), str(x2), str(y2), str(duration)], check=False)


def main():
    print("=== Flujo Completo App Móvil EcoRoute Driver (Android) ===\n")

    # Asegurar que estamos en pantalla de login
    print("[STEP 1] Reiniciando app a estado limpio")
    # Find package
    r = subprocess.run([ADB, "shell", "pm", "list", "packages"], capture_output=True, text=True)
    pkg = "com.example.ecoroute_driver_app"
    for line in r.stdout.splitlines():
        if "ecoroute" in line.lower() or "driver" in line.lower():
            pkg = line.replace("package:", "").strip()
            break
    print(f"  Paquete: {pkg}")
    subprocess.run([ADB, "shell", "am", "force-stop", pkg], check=False)
    time.sleep(2)
    subprocess.run([ADB, "shell", "monkey", "-p", pkg, "-c", "android.intent.category.LAUNCHER", "1"], check=False, capture_output=True)
    time.sleep(8)
    screenshot("FM01_android_login_inicio.png")

    # Coords approx para pantalla 1344x2992 (Pixel 9 Pro XL):
    # Campo Usuario: y ≈ 1500
    # Campo Pass:    y ≈ 1730
    # Botón:         y ≈ 1950
    print("\n[STEP 2] Llenando formulario login")
    tap(672, 1500, "Campo Usuario")
    time.sleep(1.5)
    type_text("conductor")
    time.sleep(1)
    screenshot("FM02_android_usuario_ingresado.png")

    # Cerrar teclado
    keyevent("KEYCODE_BACK")
    time.sleep(1)

    tap(672, 1730, "Campo Contraseña")
    time.sleep(1.5)
    type_text("conductor123")
    time.sleep(1)
    keyevent("KEYCODE_BACK")
    time.sleep(1)
    screenshot("FM03_android_credenciales_completas.png")

    print("\n[STEP 3] Tap INGRESAR")
    tap(672, 1950, "INGRESAR")
    time.sleep(8)
    screenshot("FM04_android_post_login.png")

    print("\n[STEP 4] Pantalla principal Mis Rutas")
    time.sleep(2)
    screenshot("FM05_android_mis_rutas.png")

    # Scroll para ver más
    print("\n[STEP 5] Scroll para ver más pedidos")
    swipe(672, 2400, 672, 1200, 400)
    time.sleep(1)
    screenshot("FM06_android_scroll_pedidos.png")

    # Tap en primer pedido (después de volver arriba)
    swipe(672, 1200, 672, 2400, 400)
    time.sleep(1)
    print("\n[STEP 6] Abrir detalle del primer pedido")
    tap(672, 2000, "Primer pedido")
    time.sleep(3)
    screenshot("FM07_android_detalle_pedido.png")

    # Tap en dropdown de estado
    print("\n[STEP 7] Cambiar estado del pedido")
    tap(672, 990, "Dropdown estado")
    time.sleep(2)
    screenshot("FM08_android_dropdown_estados.png")
    keyevent("KEYCODE_BACK")
    time.sleep(1)

    # Volver atrás
    keyevent("KEYCODE_BACK")
    time.sleep(2)

    # Ir al perfil
    print("\n[STEP 8] Pantalla perfil del conductor")
    tap(1232, 230, "Icono perfil")
    time.sleep(3)
    screenshot("FM09_android_perfil.png")
    keyevent("KEYCODE_BACK")
    time.sleep(2)

    # Capturas extra del estado final
    screenshot("FM10_android_estado_final.png")

    print(f"\nCapturas en: {OUT_DIR}")


if __name__ == "__main__":
    main()
