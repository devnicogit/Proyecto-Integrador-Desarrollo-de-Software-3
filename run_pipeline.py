"""
run_pipeline.py
===============

Orquestador end-to-end del proyecto EcoRoute / Tesis MICOTRANS.

Ejecuta TODAS las fases en orden, o sólo las que pidas. Lo que hace:

  A. INFRA          — docker compose up + keycloak + seed BD + bucket S3/SQS/SNS
  B. EMULADOR       — arrancar Pixel 9 Pro XL + instalar app Flutter
  C. CAPTURAS       — flujo end-to-end móvil + capturas web admin
  D. ANÁLISIS+DOCS  — t-Student/Pearson/Cronbach + md→docx + anexos consolidados
  E. TESIS INTEGRADA — descarga el doc del Drive de Kevin e inserta lo que falta
  F. PACK TOTAL     — empaqueta el zip de entrega (.zip 60-70 MB)
  G. GIT            — commit + tag + push (opcional)

Cada fase se puede saltar con --skip-<fase>:
  python run_pipeline.py --skip-infra --skip-emulator   # sólo docs y pack

Si querés una sola fase:
  python run_pipeline.py --only docs
  python run_pipeline.py --only drive    # sólo actualizar tesis Drive
  python run_pipeline.py --only pack
  python run_pipeline.py --only git

Modo seco (no ejecuta, sólo lista lo que haría):
  python run_pipeline.py --dry-run

Requisitos:
  - Docker Desktop (para fases A-D si querés capturas reales).
  - Python 3.10+ con python-docx, Pillow.
  - Android SDK + AVD Pixel_9_Pro_XL (para fase B).
  - Flutter SDK (para fase B compilación).
  - Internet (para fase E descarga del Drive).
  - git + gh (para fase G).

Si algún binario falta, la fase se salta con WARN y el resto sigue.
"""
from __future__ import annotations

import argparse
import os
import shutil
import subprocess
import sys
import time
import urllib.request
import webbrowser
import zipfile
from pathlib import Path

# Forzar UTF-8 en stdout/stderr para que los caracteres unicode (═─▸✓) no rompan en Windows
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

# --------------------------------------------------------------------------- #
# Constantes y rutas
# --------------------------------------------------------------------------- #

ROOT = Path(__file__).resolve().parent
TESIS = ROOT / "tesis_entregables"
DOCX  = TESIS / "docx"
CAPS  = TESIS / "figuras_capturas"

# Android SDK: respeta ANDROID_HOME / ANDROID_SDK_ROOT; sino busca en ubicaciones
# estándar de Windows (~/AppData/Local/Android/Sdk), macOS y Linux.
def _resolve_android_sdk() -> Path:
    for var in ("ANDROID_HOME", "ANDROID_SDK_ROOT"):
        v = os.environ.get(var)
        if v and Path(v).exists():
            return Path(v)
    home = Path.home()
    candidates = [
        home / "AppData" / "Local" / "Android" / "Sdk",          # Windows default
        home / "Library" / "Android" / "sdk",                     # macOS default
        home / "Android" / "Sdk",                                 # Linux default
        Path(r"C:\Android\Sdk"),                                  # alternativa Windows
    ]
    for c in candidates:
        if c.exists():
            return c
    return candidates[0]  # fallback aunque no exista (para mensajes claros)

_ANDROID_SDK   = _resolve_android_sdk()
_ADB_EXE       = "adb.exe" if os.name == "nt" else "adb"
_EMULATOR_EXE  = "emulator.exe" if os.name == "nt" else "emulator"
ADB_PATH       = _ANDROID_SDK / "platform-tools" / _ADB_EXE
EMULATOR_PATH  = _ANDROID_SDK / "emulator" / _EMULATOR_EXE
# AVD a usar: ECOROUTE_AVD env var (override) > Pixel_9_Pro_XL > primer Pixel* > primer disponible
AVD_NAME_PREFERRED = os.environ.get("ECOROUTE_AVD", "Pixel_9_Pro_XL")
AVD_NAME        = AVD_NAME_PREFERRED  # se reasigna en _resolve_avd() si hace falta
APP_PACKAGE     = "com.example.ecoroute_driver_app"
DRIVE_DOC_ID    = "1voac3fBjNJLK2rVc-uSCpvO99K5olD8x"
DRIVE_DOC_CACHE = Path(r"C:\tmp\kevin_drive_current.docx")
PACK_ZIP_NAME   = "EcoRoute_TesisPack_Total_v5.zip"

# Recursos LocalStack que la app móvil necesita
LOCALSTACK_BUCKET   = "ecoroute-proofs"
LOCALSTACK_QUEUE    = "ecoroute-notifications"
LOCALSTACK_TOPIC    = "ecoroute-alerts"

# --------------------------------------------------------------------------- #
# Helpers
# --------------------------------------------------------------------------- #

class C:
    OK    = "\033[92m"  # green
    INFO  = "\033[96m"  # cyan
    WARN  = "\033[93m"  # yellow
    ERR   = "\033[91m"  # red
    BOLD  = "\033[1m"
    OFF   = "\033[0m"


def hr(c: str = "─") -> None:
    print(c * 72)


def log(level: str, msg: str) -> None:
    color = {"OK": C.OK, "INFO": C.INFO, "WARN": C.WARN, "ERR": C.ERR}.get(level, "")
    print(f"  [{color}{level:>4}{C.OFF}] {msg}", flush=True)


def section(title: str) -> None:
    hr("═")
    print(f"{C.BOLD}{title}{C.OFF}", flush=True)
    hr("─")


def step(title: str) -> None:
    print(f"\n{C.BOLD}▸ {title}{C.OFF}", flush=True)


def run(cmd: list[str] | str, *, cwd: Path | None = None, check: bool = True,
        capture: bool = False, dry: bool = False, timeout: int | None = None) -> str:
    """Ejecuta un comando. Devuelve stdout (str) si capture=True."""
    if isinstance(cmd, str):
        printable = cmd
        shell = True
    else:
        printable = " ".join(str(c) for c in cmd)
        shell = False
    log("INFO", f"$ {printable}")
    if dry:
        return ""
    try:
        result = subprocess.run(
            cmd, cwd=str(cwd) if cwd else None,
            shell=shell, check=check, timeout=timeout,
            capture_output=capture, text=capture,
            encoding="utf-8", errors="replace",
        )
        return (result.stdout or "") if capture else ""
    except FileNotFoundError as e:
        log("WARN", f"binario no encontrado: {e}")
        return ""
    except subprocess.CalledProcessError as e:
        log("ERR", f"comando falló con exit {e.returncode}")
        if check:
            raise
        return ""


def exists(p: Path) -> bool:
    return p.exists()


def has_tool(name: str) -> bool:
    return shutil.which(name) is not None


# --------------------------------------------------------------------------- #
# 0. Preflight — validar pre-condiciones antes de empezar
# --------------------------------------------------------------------------- #

def _docker_running() -> tuple[bool, str]:
    """¿Está el Docker daemon respondiendo? Devuelve (ok, mensaje)."""
    try:
        result = subprocess.run(
            ["docker", "info", "--format", "{{.ServerVersion}}"],
            capture_output=True, text=True, timeout=10,
        )
        if result.returncode == 0 and result.stdout.strip():
            return True, f"Docker daemon OK (v{result.stdout.strip()})"
        return False, "Docker instalado pero el daemon no responde — ¿iniciaste Docker Desktop?"
    except FileNotFoundError:
        return False, "Docker no está instalado o no está en PATH"
    except subprocess.TimeoutExpired:
        return False, "Docker daemon tardó >10s — ¿está iniciado pero ocupado?"
    except Exception as e:
        return False, f"Error consultando Docker: {e}"


def _check_python_deps() -> tuple[bool, list[str]]:
    """¿Están instaladas las dependencias Python que usa el pipeline?"""
    needed = {
        "docx":      "python-docx",
        "PIL":       "Pillow",
        "playwright": "playwright",
        "reportlab": "reportlab",
        "pypdfium2": "pypdfium2",
    }
    missing = []
    for module, package in needed.items():
        try:
            __import__(module)
        except ImportError:
            missing.append(package)
    return len(missing) == 0, missing


def _resolve_avd() -> tuple[bool, str]:
    """Resuelve qué AVD usar y lo guarda en AVD_NAME global.

    Orden de preferencia:
      1. ECOROUTE_AVD env var (si está definida)
      2. AVD_NAME_PREFERRED (Pixel_9_Pro_XL por default)
      3. Primer AVD cuyo nombre empiece con "Pixel"
      4. Primer AVD disponible
    """
    global AVD_NAME
    if not EMULATOR_PATH.exists():
        return False, f"emulator.exe no existe en {EMULATOR_PATH}"
    try:
        result = subprocess.run(
            [str(EMULATOR_PATH), "-list-avds"],
            capture_output=True, text=True, timeout=15,
        )
        avds = [a for a in result.stdout.split() if a]
        if not avds:
            return False, "No hay AVDs creados (crear uno en Android Studio → Device Manager)"
        # 1) Preferido (env o default)
        if AVD_NAME_PREFERRED in avds:
            AVD_NAME = AVD_NAME_PREFERRED
            return True, f"AVD '{AVD_NAME}' disponible (preferido)"
        # 2) Primer Pixel
        for a in avds:
            if a.lower().startswith("pixel"):
                AVD_NAME = a
                return True, f"AVD '{AVD_NAME}' (fallback Pixel*; preferido '{AVD_NAME_PREFERRED}' no existe)"
        # 3) Primer disponible
        AVD_NAME = avds[0]
        return True, f"AVD '{AVD_NAME}' (último fallback; mejor crear 'Pixel_9_Pro_XL' en Device Manager)"
    except Exception as e:
        return False, f"Error listando AVDs: {e}"


def _check_pdftotext() -> tuple[bool, str]:
    if has_tool("pdftotext"):
        return True, "pdftotext disponible (para Fase E)"
    return False, "pdftotext no encontrado (Fase E saltará la descarga del PDF de Kevin)"


def phase_preflight(dry: bool, skip_emulator: bool = False, skip_drive: bool = False) -> bool:
    """Devuelve True si todas las verificaciones críticas pasaron."""
    section("0. PREFLIGHT — validar pre-condiciones")

    checks: list[tuple[str, bool, str, bool]] = []  # (nombre, ok, mensaje, es_crítico_para_alguna_fase)

    step("0.1  Docker Desktop")
    ok, msg = _docker_running()
    checks.append(("Docker", ok, msg, True))
    log("OK" if ok else "ERR", msg)
    if not ok:
        print(f"     {C.WARN}→ Solución:{C.OFF} abrí Docker Desktop, esperá al ícono verde (60s), reintentá.")

    step("0.2  Dependencias Python (docx, Pillow, playwright)")
    ok, missing = _check_python_deps()
    msg = "Todas instaladas" if ok else f"Faltan: {', '.join(missing)}"
    log("OK" if ok else "WARN", msg)
    if not ok:
        # Auto-install desde requirements.txt si existe; sino paquete a paquete
        req_file = ROOT / "requirements.txt"
        log("INFO", "Intentando auto-instalar las deps faltantes...")
        if req_file.exists():
            run([sys.executable, "-m", "pip", "install", "-r", str(req_file)],
                check=False, timeout=300)
        else:
            run([sys.executable, "-m", "pip", "install", *missing],
                check=False, timeout=300)
        # Re-check
        ok, missing = _check_python_deps()
        if ok:
            log("OK", "Deps instaladas correctamente")
        else:
            log("ERR", f"Aún faltan: {', '.join(missing)}")
            print(f"     {C.WARN}→ Solución manual:{C.OFF} pip install {' '.join(missing)}")
    checks.append(("Python deps", ok, msg, True))

    step("0.3  Java JDK")
    java = has_tool("java")
    checks.append(("Java", java, "java en PATH" if java else "java no encontrado",
                    False))  # no crítico salvo para Flutter build
    log("OK" if java else "WARN", "java en PATH" if java else "java no encontrado (impide flutter build)")

    step("0.4  Flutter")
    flutter = has_tool("flutter")
    checks.append(("Flutter", flutter, "flutter en PATH" if flutter else "flutter no encontrado",
                    False))
    log("OK" if flutter else "WARN",
         "flutter en PATH" if flutter else "flutter no encontrado (impide reinstalar la app móvil)")

    step("0.5  Android SDK + AVD")
    if skip_emulator:
        log("INFO", "Saltando check de AVD (--skip-emulator)")
    else:
        ok, msg = _resolve_avd()
        checks.append(("AVD", ok, msg, False))
        log("OK" if ok else "WARN", msg)
        if not ok:
            print(f"     {C.WARN}→ Solución:{C.OFF} crear AVD en Android Studio → Device Manager → 'Pixel 9 Pro XL' API 36")
            print(f"     {C.WARN}→ O setear:{C.OFF} $env:ECOROUTE_AVD = 'NombreDeTuAVD' antes de correr el pipeline")

    step("0.6  pdftotext (para Fase E descarga PDF de Kevin)")
    if skip_drive:
        log("INFO", "Saltando check de pdftotext (--skip-drive)")
    else:
        ok, msg = _check_pdftotext()
        checks.append(("pdftotext", ok, msg, False))
        log("OK" if ok else "WARN", msg)

    step("0.7  Git + GitHub CLI")
    git = has_tool("git")
    gh  = has_tool("gh")
    checks.append(("git", git, "git en PATH" if git else "git no encontrado", False))
    log("OK" if git else "WARN", "git en PATH" if git else "git no encontrado (impide Fase G)")
    log("OK" if gh else "INFO", "gh CLI disponible" if gh else "gh CLI no encontrado (los releases hay que subirlos manual)")

    # Resumen
    hr("─")
    critical_failures = [c for c in checks if c[3] and not c[1]]
    if critical_failures:
        print(f"  {C.ERR}✗ {len(critical_failures)} prerequisito(s) crítico(s) faltan{C.OFF}:")
        for name, _, msg, _ in critical_failures:
            print(f"     • {name}: {msg}")
        print()
        print(f"  {C.BOLD}El pipeline NO puede continuar.{C.OFF}")
        print(f"  Corregí los items críticos arriba y reintentá: {C.INFO}python run_pipeline.py{C.OFF}")
        return False
    else:
        log("OK", "Todos los prerequisitos críticos OK; continúo")
        return True


# --------------------------------------------------------------------------- #
# A. Infraestructura
# --------------------------------------------------------------------------- #

def phase_infra(dry: bool) -> None:
    section("A. INFRAESTRUCTURA — Docker + Keycloak + BD + LocalStack")

    step("A.1  docker compose up -d --build (rebuild imágenes si el código cambió)")
    if not has_tool("docker"):
        log("WARN", "docker no instalado; saltando A.")
        return
    # --build es CRÍTICO en PCs que cachearon una imagen vieja del backend o
    # del web-admin. Sin esto, los fixes nuevos (/drivers/me, MockAuthFilter
    # extendido, dashboard responsive, etc.) NO se aplican y la app rompe
    # con bugs ya arreglados en el código fuente.
    # `--build` es idempotente: si las capas Docker no cambiaron, reusa cache
    # en segundos. Solo recompila si hay diferencias reales en el código.
    run(["docker", "compose", "up", "-d", "--build"], cwd=ROOT, dry=dry, timeout=600)

    step("A.2  Esperar a que la BD esté healthy")
    if dry:
        log("INFO", "(skip wait en dry)")
    else:
        for i in range(30):
            out = run(["docker", "inspect", "--format={{.State.Health.Status}}", "ecoroute-db"],
                      capture=True, check=False)
            if "healthy" in out:
                log("OK", "ecoroute-db healthy")
                break
            time.sleep(2)
        else:
            log("WARN", "BD no reportó healthy en 60s; sigo igual")

    step("A.3  Configurar Keycloak (realms, clients, roles, usuarios admin/dispatcher/conductor)")
    setup_keycloak = ROOT / "setup-keycloak.ps1"
    if exists(setup_keycloak):
        run(["powershell", "-ExecutionPolicy", "Bypass", "-File", str(setup_keycloak)],
            dry=dry, check=False, timeout=300)
    else:
        log("WARN", f"{setup_keycloak.name} no encontrado; configura Keycloak manualmente")

    step("A.4  Cargar schema + seed MICOTRANS (24 guías reales, 5 conductores, 5 vehículos)")
    schema = ROOT / "schema.sql"
    seed   = ROOT / "micotrans_seed_complete.sql"
    if exists(schema) and exists(seed):
        run(f'docker cp "{schema}" ecoroute-db:/schema.sql', dry=dry, check=False)
        run(f'docker cp "{seed}" ecoroute-db:/seed.sql',     dry=dry, check=False)
        run("docker exec ecoroute-db psql -U user -d ecoroute -f /schema.sql", dry=dry, check=False)
        run("docker exec ecoroute-db psql -U user -d ecoroute -f /seed.sql",   dry=dry, check=False)
        # Verificar idempotencia: el seed debe terminar con 150 pre + 150 post = 300 total
        if not dry:
            out = run(
                "docker exec ecoroute-db psql -U user -d ecoroute -At -c "
                "\"SELECT "
                "  (SELECT COUNT(*) FROM orders WHERE created_at < '2026-04-19') AS pre, "
                "  (SELECT COUNT(*) FROM orders WHERE created_at >= '2026-04-19') AS post\"",
                capture=True, check=False,
            ).strip()
            try:
                # Salida: "150|150"
                parts = out.splitlines()[-1].split("|")
                pre_count, post_count = int(parts[0]), int(parts[1])
                if pre_count == 150 and post_count == 150:
                    log("OK", f"Seed idempotente verificado: {pre_count} pre-test + {post_count} post-test (esperado 150/150)")
                elif pre_count > 150 or post_count > 150:
                    log("ERR", f"Datos DUPLICADOS: pre={pre_count}, post={post_count} (esperado 150/150)")
                    print(f"     {C.WARN}→ El seed se cargó sin TRUNCATE previo.{C.OFF}")
                    print(f"     {C.WARN}→ Para limpiar: actualizá el repo (git pull) y volvé a correr el pipeline.{C.OFF}")
                    print(f"     {C.WARN}→ O manual: docker exec ecoroute-db psql -U user -d ecoroute -c \"TRUNCATE orders, routes, delivery_proofs, order_status_history RESTART IDENTITY CASCADE\"{C.OFF}")
                else:
                    log("WARN", f"Conteo inesperado: pre={pre_count}, post={post_count} (esperado 150/150)")
            except (ValueError, IndexError):
                log("WARN", f"No pude parsear conteo de orders: {out[:80]!r}")
    else:
        log("WARN", "schema.sql o seed.sql ausentes")

    step("A.5  Crear bucket S3 + cola SQS + topic SNS en LocalStack (sin esto las entregas fallan)")
    run(f"docker exec ecoroute-localstack awslocal s3 mb s3://{LOCALSTACK_BUCKET}",
        dry=dry, check=False)
    run(f"docker exec ecoroute-localstack awslocal sqs create-queue --queue-name {LOCALSTACK_QUEUE}",
        dry=dry, check=False)
    run(f"docker exec ecoroute-localstack awslocal sns create-topic --name {LOCALSTACK_TOPIC}",
        dry=dry, check=False)

    step("A.6  Esperar a que backend (8081) y web-admin (3000) respondan")
    if not dry:
        if _wait_for_url("http://localhost:8081/actuator/health", timeout_s=120):
            log("OK", "backend responde en http://localhost:8081")
        else:
            log("WARN", "backend no respondió en 120s (puede afectar fases B-H)")
        if _wait_for_url("http://localhost:3000", timeout_s=60):
            log("OK", "web-admin responde en http://localhost:3000")
        else:
            log("WARN", "web-admin no respondió en 60s (puede afectar Fase C.3)")

    log("OK", "Infraestructura levantada")


# --------------------------------------------------------------------------- #
# B. Emulador + app móvil
# --------------------------------------------------------------------------- #

def phase_emulator(dry: bool) -> None:
    section("B. EMULADOR ANDROID + APP FLUTTER")

    if not ADB_PATH.exists():
        log("WARN", f"adb no encontrado en {ADB_PATH}; saltando B")
        return

    step("B.1  Listar AVDs disponibles")
    if EMULATOR_PATH.exists():
        run([str(EMULATOR_PATH), "-list-avds"], dry=dry, check=False, capture=False)
    else:
        log("WARN", f"emulator.exe no encontrado en {EMULATOR_PATH}")
        return

    step(f"B.2  Arrancar AVD {AVD_NAME} en background")
    if dry:
        log("INFO", f"(skip launch en dry: {EMULATOR_PATH} -avd {AVD_NAME})")
    else:
        # Lanzar en background con nohup
        log_path = Path(r"C:\tmp\emulator.log")
        log_path.parent.mkdir(parents=True, exist_ok=True)
        proc = subprocess.Popen(
            [str(EMULATOR_PATH), "-avd", AVD_NAME, "-no-snapshot-save", "-no-boot-anim",
             "-netdelay", "none", "-netspeed", "full"],
            stdout=log_path.open("wb"),
            stderr=subprocess.STDOUT,
            creationflags=subprocess.DETACHED_PROCESS if os.name == "nt" else 0,
        )
        log("INFO", f"Emulador PID={proc.pid}, log en {log_path}")

    step("B.3  Esperar boot_completed (hasta 300s — la primera vez puede tardar 3-5 min)")
    booted = False
    if not dry:
        # Primero esperamos a que adb vea el device (offline → device)
        log("INFO", "Esperando a que el device aparezca en `adb devices`...")
        wait_proc = subprocess.run(
            [str(ADB_PATH), "wait-for-device"],
            capture_output=True, text=True, timeout=300,
        )
        if wait_proc.returncode != 0:
            log("WARN", "adb wait-for-device falló o agotó timeout (300s)")
        # Ahora polling silencioso de sys.boot_completed
        log("INFO", "Esperando sys.boot_completed (polling cada 3s, silencioso)...")
        start = time.time()
        timeout_s = 300
        last_report = start
        while time.time() - start < timeout_s:
            result = subprocess.run(
                [str(ADB_PATH), "shell", "getprop", "sys.boot_completed"],
                capture_output=True, text=True, timeout=10,
            )
            if "1" in (result.stdout or ""):
                booted = True
                elapsed = int(time.time() - start)
                log("OK", f"Emulador booteado tras {elapsed}s")
                break
            # Reportar cada 30s para que el usuario sepa que sigue activo
            if time.time() - last_report >= 30:
                elapsed = int(time.time() - start)
                log("INFO", f"...todavía booteando ({elapsed}s/{timeout_s}s)")
                last_report = time.time()
            time.sleep(3)
        if not booted:
            log("ERR", f"Emulador no booteó en {timeout_s}s — abortando Fase B")
            # Mostrar últimas líneas del log del emulador para diagnóstico
            emu_log = Path(r"C:\tmp\emulator.log")
            if emu_log.exists():
                print(f"     {C.WARN}Últimas 10 líneas de {emu_log}:{C.OFF}")
                tail = emu_log.read_text(encoding="utf-8", errors="replace").splitlines()[-10:]
                for ln in tail:
                    print(f"       {ln}")
            print(f"     {C.WARN}Posibles causas:{C.OFF}")
            print(f"       - Falta aceleración HAXM/WHPX/Hyper-V (probá: `bcdedit /set hypervisorlaunchtype auto`)")
            print(f"       - El AVD tiene poco RAM (recreá con 4 GB+)")
            print(f"       - GPU mal configurada (probá con `-gpu swiftshader_indirect`)")
            print(f"     Las fases C.1/C.2 se saltearán; podés re-correr con --only captures más tarde")
            return

    # Verificar que efectivamente hay un device usable antes de B.4
    if not dry:
        devs = run([str(ADB_PATH), "devices"], capture=True, check=False)
        if "device" not in devs.replace("List of devices attached", ""):
            log("ERR", "adb no detecta ningún device pese a boot_completed=1 — abortando Fase B")
            return

    step("B.4  ¿App ya instalada?")
    if not dry:
        pkgs = run([str(ADB_PATH), "shell", "pm", "list", "packages"], capture=True, check=False)
        if APP_PACKAGE in pkgs:
            log("OK", f"{APP_PACKAGE} ya instalada")
        else:
            log("INFO", f"{APP_PACKAGE} no instalada; buscando APK para instalar...")
            mobile = ROOT / "mobile-app"
            # Estrategia 1: usar APK pre-compilado del repo (NO requiere Flutter)
            installed = False
            prebuilt_dir = mobile / "prebuilt"
            if prebuilt_dir.exists():
                # Detectar arquitectura del emulador para elegir el APK correcto
                abi_out = run([str(ADB_PATH), "shell", "getprop", "ro.product.cpu.abi"],
                              capture=True, check=False).strip()
                log("INFO", f"Arquitectura del emulador detectada: {abi_out or 'desconocida'}")
                abi_map = {
                    "x86_64":     "app-debug-x86_64.apk",
                    "arm64-v8a":  "app-debug-arm64-v8a.apk",
                }
                preferred = abi_map.get(abi_out)
                candidates = []
                if preferred:
                    candidates.append(prebuilt_dir / preferred)
                # Fallback: cualquier APK que esté ahí
                candidates.extend(sorted(prebuilt_dir.glob("*.apk")))
                seen = set()
                for apk in candidates:
                    if apk in seen or not apk.exists():
                        continue
                    seen.add(apk)
                    log("INFO", f"Intentando instalar APK pre-built: {apk.name} ({apk.stat().st_size//1024//1024} MB)")
                    result = subprocess.run(
                        [str(ADB_PATH), "install", "-r", str(apk)],
                        capture_output=True, text=True,
                        encoding="utf-8", errors="replace",
                    )
                    if "Success" in (result.stdout or "") or "Success" in (result.stderr or ""):
                        log("OK", f"APK pre-built instalado: {apk.name}")
                        installed = True
                        break
                    else:
                        log("WARN", f"{apk.name} no se pudo instalar: {(result.stderr or result.stdout)[:120]}")
            # Estrategia 2: si el pre-built no funcionó, fallback a Flutter build
            if not installed:
                if has_tool("flutter") and exists(mobile):
                    log("INFO", "Compilando con Flutter como fallback...")
                    run(["flutter", "pub", "get"], cwd=mobile, dry=dry, check=False, timeout=180)
                    run(["flutter", "build", "apk", "--debug"], cwd=mobile, dry=dry, check=False, timeout=600)
                    apk = mobile / "build" / "app" / "outputs" / "flutter-apk" / "app-debug.apk"
                    if apk.exists():
                        run([str(ADB_PATH), "install", "-r", str(apk)], dry=dry, check=False)
                        installed = True
                    else:
                        log("WARN", f"APK no se generó: {apk}")
                else:
                    log("ERR", "Ni APK pre-built ni Flutter disponibles para instalar la app")
                    print(f"     {C.WARN}→ Opción A:{C.OFF} instalar Flutter (winget install Flutter.Flutter)")
                    print(f"     {C.WARN}→ Opción B:{C.OFF} verificar que existe mobile-app/prebuilt/app-debug-*.apk")
                    print(f"     Fase B abortada; las fases C.1/C.2 saltearán capturas móviles.")
                    return

    step("B.5  Dismiss overlays de Google Play Services / System UI (que tapan la app)")
    # El AVD con google_apis suele mostrar "Servicios de Google Play está actualizándose"
    # o "Para usar X aplicación, debes actualizar...". Estos diálogos tapan la app y
    # bloquean las capturas. Estrategias para dismissarlos:
    if not dry:
        # 1. Force-stop Google Play Services y Google Services Framework
        for pkg in ("com.google.android.gms", "com.android.vending",
                    "com.google.android.gsf"):
            run([str(ADB_PATH), "shell", "am", "force-stop", pkg],
                check=False, capture=True)
        # 2. Tap "Aceptar"/"OK"/"Update later" si están visibles (uiautomator dump)
        try:
            run([str(ADB_PATH), "shell", "uiautomator", "dump", "/sdcard/ui.xml"],
                check=False, capture=True, timeout=10)
            xml_out = run([str(ADB_PATH), "exec-out", "cat", "/sdcard/ui.xml"],
                          capture=True, check=False, timeout=10)
            import re
            # Buscar botones cuyo texto sea OK / Aceptar / Cerrar / Update later / Skip / Got it
            for keyword in ("OK", "Aceptar", "ACEPTAR", "Got it", "GOT IT",
                            "Update later", "Skip", "Cerrar", "CERRAR",
                            "No, thanks", "Dismiss"):
                pattern = rf'text="{re.escape(keyword)}"[^>]*bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"'
                m = re.search(pattern, xml_out)
                if m:
                    x1, y1, x2, y2 = map(int, m.groups())
                    cx, cy = (x1+x2)//2, (y1+y2)//2
                    log("INFO", f"Tap '{keyword}' en ({cx},{cy})")
                    run([str(ADB_PATH), "shell", "input", "tap", str(cx), str(cy)],
                        check=False, capture=True)
                    time.sleep(1)
        except Exception as e:
            log("INFO", f"(dismiss dialogs best-effort: {e})")
        # 3. KEYCODE_BACK x3 para cerrar cualquier overlay residual
        for _ in range(3):
            run([str(ADB_PATH), "shell", "input", "keyevent", "KEYCODE_BACK"],
                check=False, capture=True)
            time.sleep(0.5)
        # 4. KEYCODE_HOME para volver al launcher limpio antes de lanzar la app
        run([str(ADB_PATH), "shell", "input", "keyevent", "KEYCODE_HOME"],
            check=False, capture=True)
        time.sleep(1)

    step("B.6  Lanzar app (en foreground, sobre estado limpio)")
    run([str(ADB_PATH), "shell", "am", "force-stop", APP_PACKAGE],
        dry=dry, check=False)
    run([str(ADB_PATH), "shell", "am", "start", "-n", f"{APP_PACKAGE}/.MainActivity"],
        dry=dry, check=False)
    if not dry:
        time.sleep(3)
        # Re-dismiss por si los servicios reaparecieron tras el am start
        for _ in range(2):
            run([str(ADB_PATH), "shell", "input", "keyevent", "KEYCODE_BACK"],
                check=False, capture=True)
            time.sleep(0.3)
        # Re-lanzar la app si el BACK la cerró
        run([str(ADB_PATH), "shell", "am", "start", "-n", f"{APP_PACKAGE}/.MainActivity"],
            check=False, capture=True)
    log("OK", "Emulador listo con app corriendo en primer plano (overlays dismissed)")


# --------------------------------------------------------------------------- #
# C. Capturas
# --------------------------------------------------------------------------- #

def _wait_for_url(url: str, timeout_s: int = 60) -> bool:
    """Espera hasta que la URL responda 2xx/3xx. Devuelve True si responde."""
    deadline = time.time() + timeout_s
    while time.time() < deadline:
        try:
            with urllib.request.urlopen(url, timeout=3) as resp:
                if resp.status < 500:
                    return True
        except Exception:
            pass
        time.sleep(2)
    return False


def phase_captures(dry: bool) -> None:
    section("C. CAPTURAS — flujo end-to-end móvil + web admin")

    # Si no hay adb disponible, saltar las capturas móviles (C.1, C.2) — dependen del emulador
    has_adb = ADB_PATH.exists()
    if not has_adb:
        log("WARN", f"adb no encontrado en {ADB_PATH}; saltando capturas móviles (C.1, C.2)")
    else:
        step("C.1  Flujo end-to-end móvil (RFM01..RFM22): login → tap pedido → IN_TRANSIT → foto → DELIVERED → DNI → firma → guardar")
        script = TESIS / "capture_android_full_flow.py"
        if exists(script):
            run([sys.executable, str(script)], dry=dry, check=False, timeout=600)
        else:
            log("WARN", f"{script.name} no encontrado")

        step("C.2  Generar thumbnails ≤1500 px para todas las capturas (anti-2000px)")
        run([sys.executable, str(TESIS / "safe_capture.py"), "shrink_all", str(CAPS)],
            dry=dry, check=False)

    step("C.3  Capturar panel web admin (F20-F47) con Playwright")
    web_script = TESIS / "capture_screenshots.py"
    if not exists(web_script):
        log("INFO", "capture_screenshots.py opcional; salteando")
    else:
        # Health-check del web admin antes de intentar capturar (evita
        # ERR_CONNECTION_REFUSED si el contenedor todavía no levantó).
        if not dry:
            log("INFO", "Esperando a que web-admin responda en http://localhost:3000 (hasta 60s)...")
            if not _wait_for_url("http://localhost:3000", timeout_s=60):
                log("WARN", "web-admin no respondió en 60s — saltando capturas web")
                log("INFO", "Levantá manualmente: docker compose up -d ecoroute-web-admin")
                log("OK", "Capturas listas (parcial)")
                return
            log("OK", "web-admin responde")
            # Pre-instalar browser de Playwright si falta (idempotente)
            log("INFO", "Asegurando Playwright chromium instalado...")
            run([sys.executable, "-m", "playwright", "install", "chromium"],
                check=False, timeout=300)
        run([sys.executable, str(web_script)], dry=dry, check=False, timeout=300)
    log("OK", "Capturas listas")


# --------------------------------------------------------------------------- #
# D. Análisis estadístico + conversión md→docx + anexos
# --------------------------------------------------------------------------- #

def phase_docs(dry: bool) -> None:
    section("D. ANÁLISIS ESTADÍSTICO + GENERACIÓN DE DOCS")

    step("D.1  Análisis estadístico (t-Student paired, Pearson, Cronbach)")
    run([sys.executable, str(TESIS / "analisis_estadistico.py")], dry=dry, check=False, timeout=120)

    step("D.2  Convertir todos los .md a .docx (Capítulos, Anexos, Manuales)")
    run([sys.executable, str(TESIS / "convert_md_to_docx.py")], dry=dry, check=False, timeout=120)

    step("D.3  Anexo 2 consolidado (Cuestionario UTAUT + 6 fichas KPI PDF embebidas)")
    run([sys.executable, str(TESIS / "build_anexo2_consolidado.py")], dry=dry, check=False, timeout=120)

    step("D.4  Anexo Figuras (31 figuras: 10 web admin + 21 móvil end-to-end)")
    run([sys.executable, str(TESIS / "build_anexo_figuras_completo.py")], dry=dry, check=False, timeout=180)
    log("OK", "Documentos regenerados")


# --------------------------------------------------------------------------- #
# E. Tesis integrada (descarga Drive + inserta cap III-VI + anexos + figuras)
# --------------------------------------------------------------------------- #

def phase_drive(dry: bool) -> None:
    section("E. TESIS INTEGRADA — descarga del Drive de Kevin + inserta lo que falta")

    step("E.1  Invalidar cache local del docx de Kevin (forzar re-descarga)")
    if not dry and DRIVE_DOC_CACHE.exists():
        DRIVE_DOC_CACHE.unlink()
        log("OK", f"cache eliminada: {DRIVE_DOC_CACHE}")

    step("E.2  Ejecutar el integrador (descarga + inserta Cap III/IV/V/VI + Anexos 2cont/3/4/5 + Anexo Figuras)")
    run([sys.executable, str(TESIS / "build_tesis_drive_integrada.py")],
        dry=dry, check=False, timeout=180)

    out = DOCX / "Tesis_Drive_Integrada_VFinal.docx"
    if exists(out):
        log("OK", f"Tesis integrada generada: {out} ({out.stat().st_size//1024//1024} MB)")
        print()
        print(f"  {C.BOLD}>>> Para subir al Drive:{C.OFF}")
        print(f"     1. Abrí https://docs.google.com/document/d/{DRIVE_DOC_ID}/edit")
        print(f"     2. Archivo → Importar → arrastrá '{out.name}' → 'Reemplazar el documento existente'")


# --------------------------------------------------------------------------- #
# F. Pack Total zip
# --------------------------------------------------------------------------- #

def phase_pack(dry: bool) -> None:
    section("F. PACK TOTAL — empaquetar todo en .zip de entrega")

    zip_path = ROOT / PACK_ZIP_NAME
    step(f"F.1  Generar {zip_path.name}")
    if dry:
        log("INFO", f"(skip zip en dry: {zip_path})")
        return

    EXCLUDE_NAMES = {"__pycache__", ".ipynb_checkpoints"}
    EXCLUDE_EXT   = {".xml"}
    EXCLUDE_SUFFIX = ("_thumb.png",)
    EXCLUDE_PREFIX = ("_diag_", "FM_test_current", ".pdf_kevin_extract")

    def keep(p: Path) -> bool:
        if any(part in EXCLUDE_NAMES for part in p.parts): return False
        if p.suffix.lower() in EXCLUDE_EXT: return False
        if any(p.name.endswith(s) for s in EXCLUDE_SUFFIX): return False
        if p.name.startswith(EXCLUDE_PREFIX): return False
        return True

    count = 0
    size_total = 0
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED, compresslevel=6) as z:
        for p in sorted(TESIS.rglob("*")):
            if p.is_file() and keep(p):
                z.write(p, arcname=str(p.relative_to(ROOT)))
                count += 1
                size_total += p.stat().st_size
        for extra in ("micotrans_pretest_real.sql", "micotrans_seed_complete.sql", "micotrans_seed.sql"):
            f = ROOT / extra
            if f.exists():
                z.write(f, arcname=f.name)
                count += 1
                size_total += f.stat().st_size

    log("OK", f"Zip listo: {zip_path} — {count} archivos, "
              f"{zip_path.stat().st_size//1024//1024} MB comprimidos "
              f"({size_total//1024//1024} MB sin comprimir)")


# --------------------------------------------------------------------------- #
# H. Dashboard — abrir browser con los KPIs Tesis para visualizar
# --------------------------------------------------------------------------- #

def _read_kpi_summary() -> dict | None:
    """Lee los 6 KPIs desde el backend (anónimo si está abierto, o con token mock)."""
    base = "http://localhost:8081"
    endpoints = {
        "iid_pre":  f"{base}/reports/kpi/iid?startDate=2026-01-01&endDate=2026-04-30&testType=pre",
        "iid_post": f"{base}/reports/kpi/iid?startDate=2026-01-01&endDate=2026-04-30&testType=post",
        "chr_pre":  f"{base}/reports/kpi/chr?startDate=2026-01-01&endDate=2026-04-30&testType=pre",
        "chr_post": f"{base}/reports/kpi/chr?startDate=2026-01-01&endDate=2026-04-30&testType=post",
        "tde_pre":  f"{base}/reports/kpi/tde?startDate=2026-01-01&endDate=2026-04-30&testType=pre",
        "tde_post": f"{base}/reports/kpi/tde?startDate=2026-01-01&endDate=2026-04-30&testType=post",
    }
    result = {}
    try:
        for key, url in endpoints.items():
            req = urllib.request.Request(url, headers={"Authorization": "Bearer mock_ADMIN"})
            with urllib.request.urlopen(req, timeout=5) as resp:
                if resp.status == 200:
                    import json
                    data = json.loads(resp.read().decode("utf-8"))
                    # asumimos que el endpoint devuelve [{day, total, valid, percent}, ...]
                    if isinstance(data, list) and data:
                        totals = sum(d.get("total", 0) for d in data)
                        valids = sum(d.get("valid", d.get("delivered", d.get("with_evidence", 0))) for d in data)
                        result[key] = (totals, valids, (valids/totals*100) if totals else 0)
    except Exception as e:
        log("WARN", f"No se pudieron leer KPIs del backend: {e}")
        return None
    return result if result else None


def phase_dashboard(dry: bool) -> None:
    section("H. DASHBOARD — abrir browser con KPIs Tesis para visualización")

    step("H.1  Verificar que web-admin esté respondiendo")
    if not dry:
        try:
            with urllib.request.urlopen("http://localhost:3000", timeout=5) as resp:
                if resp.status == 200:
                    log("OK", "web-admin responde en http://localhost:3000")
                else:
                    log("WARN", f"web-admin devolvió {resp.status}")
        except Exception as e:
            log("WARN", f"web-admin no responde: {e}")
            log("INFO", "Levantá web-admin: `docker compose up -d ecoroute-web-admin`")
            return

    step("H.2  Imprimir resumen de los 3 KPIs (consulta directa al backend)")
    if not dry:
        kpis = _read_kpi_summary()
        if kpis:
            print()
            print(f"  {C.BOLD}Resumen KPIs Tesis (pre-test vs post-test):{C.OFF}")
            print(f"  {'─' * 60}")
            for ind in ("iid", "chr", "tde"):
                pre  = kpis.get(f"{ind}_pre")
                post = kpis.get(f"{ind}_post")
                if pre and post:
                    pre_pct, post_pct = pre[2], post[2]
                    delta = post_pct - pre_pct
                    name = {"iid":"IID","chr":"CHR","tde":"TDE"}[ind]
                    print(f"  {C.BOLD}{name}{C.OFF}: pre={pre_pct:>5.1f}%  post={post_pct:>5.1f}%  Δ={C.OK}+{delta:.1f} pp{C.OFF}")
            print(f"  {'─' * 60}")
        else:
            log("INFO", "Backend no devolvió KPIs (puede requerir login real)")
            print(f"  Valores esperados según análisis estadístico (D.1):")
            print(f"    {C.BOLD}IID{C.OFF}: pre=60.0%  post=97.9%  Δ={C.OK}+37.9 pp{C.OFF}  (t=14.53, p<0.001)")
            print(f"    {C.BOLD}CHR{C.OFF}: pre=67.3%  post=93.5%  Δ={C.OK}+26.2 pp{C.OFF}  (t=10.97, p<0.001)")
            print(f"    {C.BOLD}TDE{C.OFF}: pre=51.3%  post=93.9%  Δ={C.OK}+42.6 pp{C.OFF}  (t=13.80, p<0.001)")

    step("H.3  Abrir el navegador en el dashboard de KPIs Tesis")
    url = "http://localhost:3000/reports"
    log("INFO", f"Abriendo: {url}")
    log("INFO", "Credenciales: admin / admin123  (o dispatcher/dispatcher123)")
    if not dry:
        try:
            webbrowser.open(url, new=2)
            log("OK", "Navegador abierto. Hacé login con admin/admin123 y andá a la tab 'KPIs de Gestión Administrativa (Tesis)'")
        except Exception as e:
            log("WARN", f"No se pudo abrir el navegador: {e}")
            print(f"     Abrí manualmente: {url}")

    step("H.4  Recordatorio: Tesis_Drive_Integrada_VFinal.docx lista para subir al Drive")
    out_docx = DOCX / "Tesis_Drive_Integrada_VFinal.docx"
    if out_docx.exists():
        print(f"  {C.BOLD}Archivo final:{C.OFF} {out_docx}")
        print(f"  {C.BOLD}Tamaño:{C.OFF} {out_docx.stat().st_size // 1024 // 1024} MB")
        print(f"  {C.BOLD}Para subir al Drive:{C.OFF}")
        print(f"     1. Abrí https://docs.google.com/document/d/1voac3fBjNJLK2rVc-uSCpvO99K5olD8x/edit")
        print(f"     2. Archivo → Importar → arrastrá '{out_docx.name}' → 'Reemplazar el documento existente'")

    log("OK", "Dashboard fase completa")


# --------------------------------------------------------------------------- #
# G. Git commit + push + tag
# --------------------------------------------------------------------------- #

def phase_git(dry: bool, no_push: bool) -> None:
    section("G. GIT — commit + tag + push (opcional)")

    if not has_tool("git"):
        log("WARN", "git no instalado; saltando")
        return

    step("G.1  Status del repo")
    status = run(["git", "status", "--porcelain"], cwd=ROOT, capture=True, check=False)
    if not status.strip():
        log("INFO", "Working tree limpio; nada que commitear")
    else:
        log("INFO", f"{len([l for l in status.splitlines() if l.strip()])} archivos modificados/nuevos")

    step("G.2  git add tesis_entregables/ + scripts")
    run(["git", "add", "tesis_entregables/", "run_pipeline.py"], cwd=ROOT, dry=dry, check=False)

    step("G.3  Commit")
    msg = "feat(tesis): re-run pipeline — docs + captures + drive integration + pack"
    run(["git", "commit", "-m", msg, "--allow-empty"], cwd=ROOT, dry=dry, check=False)

    step("G.4  Tag versionado")
    tag = f"pipeline-run-{time.strftime('%Y%m%d-%H%M%S')}"
    run(["git", "tag", tag], cwd=ROOT, dry=dry, check=False)

    if no_push:
        log("INFO", "--no-push: salteando push")
        return

    step("G.5  Push a origin (rama actual)")
    branch = run(["git", "branch", "--show-current"], cwd=ROOT, capture=True).strip()
    if not branch:
        log("WARN", "No se pudo determinar la rama actual; saltando push")
        return
    # Verificar URL del remote para diagnosticar problemas de auth
    remote_url = run(["git", "remote", "get-url", "origin"], cwd=ROOT, capture=True, check=False).strip()
    if remote_url.startswith("https://") and not dry:
        log("INFO", f"Remote HTTPS detectado: {remote_url}")
        log("INFO", "Si el push falla por auth, configurá un Personal Access Token con `gh auth login`")
        log("INFO", "O cambiá a SSH: git remote set-url origin git@github.com:USER/REPO.git")
    # Push con capture para inspeccionar el output
    if dry:
        log("INFO", f"$ git push origin {branch} {tag}")
        return
    result = subprocess.run(
        ["git", "push", "origin", branch, tag],
        cwd=str(ROOT),
        capture_output=True, text=True,
        encoding="utf-8", errors="replace",
    )
    # Imprimir output del git push (combinado)
    output = (result.stdout or "") + (result.stderr or "")
    for line in output.strip().split("\n"):
        if line:
            print(f"     {line}")
    if result.returncode == 0:
        log("OK", "Push completo")
    elif "Authentication failed" in output or "could not read Username" in output:
        log("ERR", "Push falló por autenticación")
        print(f"     {C.WARN}→ Solución 1:{C.OFF} configurá un token con GitHub CLI:")
        print(f"          gh auth login --hostname github.com --git-protocol https --web")
        print(f"     {C.WARN}→ Solución 2:{C.OFF} cambiá el remote a SSH (requiere SSH key en GitHub):")
        print(f"          git remote set-url origin git@github.com:devnicogit/Proyecto-Integrador-Desarrollo-de-Software-3.git")
        print(f"     El commit y el tag quedaron locales — corré `git push --tags` después.")
    elif "rejected" in output or "non-fast-forward" in output:
        log("ERR", "Push rechazado (probablemente la rama remota está adelantada)")
        print(f"     {C.WARN}→ Solución:{C.OFF} git pull --rebase origin {branch} && git push")
    else:
        log("ERR", f"Push falló con exit {result.returncode}")
        print(f"     Tag '{tag}' y commit quedaron locales. Corré: git push origin {branch} {tag}")


# --------------------------------------------------------------------------- #
# Main
# --------------------------------------------------------------------------- #

PHASES = [
    ("infra",     "A — Infraestructura Docker",      phase_infra,     True),
    ("emulator",  "B — Emulador + app móvil",         phase_emulator,  True),
    ("captures",  "C — Capturas end-to-end",          phase_captures,  True),
    ("docs",      "D — Análisis + docs",              phase_docs,      False),
    ("drive",     "E — Tesis integrada (Drive)",      phase_drive,     False),
    ("pack",      "F — Pack Total zip",               phase_pack,      False),
    ("dashboard", "H — Dashboard KPIs + abrir browser", phase_dashboard, False),
    ("git",       "G — Git commit + push",            phase_git,       False),
]


def main() -> None:
    ap = argparse.ArgumentParser(
        description="Orquestador end-to-end del proyecto EcoRoute / Tesis MICOTRANS",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="Ejemplos:\n"
               "  python run_pipeline.py                       # ejecuta TODO\n"
               "  python run_pipeline.py --only drive          # sólo tesis Drive\n"
               "  python run_pipeline.py --skip-infra          # sin Docker (asume todo ya arriba)\n"
               "  python run_pipeline.py --skip-emulator --skip-captures   # sólo docs + pack\n"
               "  python run_pipeline.py --dry-run             # qué haría, sin ejecutar\n"
    )
    ap.add_argument("--only", choices=[name for name,_,_,_ in PHASES],
                    help="Ejecutar sólo una fase")
    for name, label, _, _ in PHASES:
        ap.add_argument(f"--skip-{name}", action="store_true",
                        help=f"Saltar fase: {label}")
    ap.add_argument("--no-push", action="store_true",
                    help="En fase G, hacer commit/tag pero no push a remoto")
    ap.add_argument("--dry-run", action="store_true",
                    help="Mostrar comandos sin ejecutarlos")
    ap.add_argument("--skip-preflight", action="store_true",
                    help="No validar Docker / Python deps / AVD antes de empezar")
    args = ap.parse_args()

    hr("═")
    print(f"{C.BOLD}EcoRoute / Tesis MICOTRANS — Pipeline End-to-End{C.OFF}")
    print(f"  Root:       {ROOT}")
    print(f"  Tesis dir:  {TESIS}")
    print(f"  Modo:       {'DRY RUN' if args.dry_run else 'EJECUCIÓN REAL'}")
    if args.only:
        print(f"  Fase única: {args.only}")
    hr("═")

    # Fase 0 — preflight (a menos que pidas saltarla o --only)
    if not args.only and not args.skip_preflight and not args.dry_run:
        ok = phase_preflight(
            args.dry_run,
            skip_emulator=args.skip_emulator,
            skip_drive=args.skip_drive,
        )
        if not ok:
            sys.exit(1)

    for name, label, fn, _ in PHASES:
        if args.only and args.only != name:
            continue
        if getattr(args, f"skip_{name}"):
            log("INFO", f"Saltando fase {label} (--skip-{name})")
            continue
        try:
            if name == "git":
                fn(args.dry_run, args.no_push)
            else:
                fn(args.dry_run)
        except KeyboardInterrupt:
            log("WARN", "Interrumpido por usuario")
            sys.exit(130)
        except Exception as e:
            log("ERR", f"Fase {label} explotó: {e}")
            log("INFO", "Continuando con la siguiente fase...")

    hr("═")
    print(f"{C.OK}{C.BOLD}✓ Pipeline finalizado{C.OFF}")
    hr("═")


if __name__ == "__main__":
    main()
