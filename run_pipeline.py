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

ADB_PATH        = Path(os.environ.get("ANDROID_HOME", r"C:\Users\USUARIO\AppData\Local\Android\Sdk")) / "platform-tools" / "adb.exe"
EMULATOR_PATH   = Path(os.environ.get("ANDROID_HOME", r"C:\Users\USUARIO\AppData\Local\Android\Sdk")) / "emulator" / "emulator.exe"
AVD_NAME        = "Pixel_9_Pro_XL"
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
# A. Infraestructura
# --------------------------------------------------------------------------- #

def phase_infra(dry: bool) -> None:
    section("A. INFRAESTRUCTURA — Docker + Keycloak + BD + LocalStack")

    step("A.1  docker compose up -d (5 contenedores: postgres, keycloak, localstack, backend, web-admin)")
    if not has_tool("docker"):
        log("WARN", "docker no instalado; saltando A.")
        return
    run(["docker", "compose", "up", "-d"], cwd=ROOT, dry=dry, timeout=300)

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
    else:
        log("WARN", "schema.sql o seed.sql ausentes")

    step("A.5  Crear bucket S3 + cola SQS + topic SNS en LocalStack (sin esto las entregas fallan)")
    run(f"docker exec ecoroute-localstack awslocal s3 mb s3://{LOCALSTACK_BUCKET}",
        dry=dry, check=False)
    run(f"docker exec ecoroute-localstack awslocal sqs create-queue --queue-name {LOCALSTACK_QUEUE}",
        dry=dry, check=False)
    run(f"docker exec ecoroute-localstack awslocal sns create-topic --name {LOCALSTACK_TOPIC}",
        dry=dry, check=False)
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

    step("B.3  Esperar boot_completed (hasta 120s)")
    if not dry:
        for i in range(60):
            out = run([str(ADB_PATH), "shell", "getprop", "sys.boot_completed"],
                      capture=True, check=False)
            if "1" in out:
                log("OK", "Emulador booteado")
                break
            time.sleep(2)
        else:
            log("WARN", "Emulador no booteó en 120s")

    step("B.4  ¿App ya instalada?")
    if not dry:
        pkgs = run([str(ADB_PATH), "shell", "pm", "list", "packages"], capture=True, check=False)
        if APP_PACKAGE in pkgs:
            log("OK", f"{APP_PACKAGE} ya instalada")
        else:
            log("INFO", f"{APP_PACKAGE} no instalada; compilando con Flutter...")
            mobile = ROOT / "mobile-app"
            if has_tool("flutter") and exists(mobile):
                run(["flutter", "pub", "get"], cwd=mobile, dry=dry, check=False, timeout=180)
                run(["flutter", "build", "apk", "--debug"], cwd=mobile, dry=dry, check=False, timeout=600)
                apk = mobile / "build" / "app" / "outputs" / "flutter-apk" / "app-debug.apk"
                if apk.exists():
                    run([str(ADB_PATH), "install", "-r", str(apk)], dry=dry, check=False)
                else:
                    log("WARN", f"APK no se generó: {apk}")
            else:
                log("WARN", "flutter o mobile-app/ no disponibles; saltando build")

    step("B.5  Lanzar app")
    run([str(ADB_PATH), "shell", "am", "start", "-n", f"{APP_PACKAGE}/.MainActivity"],
        dry=dry, check=False)
    log("OK", "Emulador listo con app corriendo")


# --------------------------------------------------------------------------- #
# C. Capturas
# --------------------------------------------------------------------------- #

def phase_captures(dry: bool) -> None:
    section("C. CAPTURAS — flujo end-to-end móvil + web admin")

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
    if exists(web_script):
        run([sys.executable, str(web_script)], dry=dry, check=False, timeout=300)
    else:
        log("INFO", "capture_screenshots.py opcional; salteando")
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
    run(["git", "push", "origin", branch, tag], cwd=ROOT, dry=dry, check=False)
    log("OK", "Push completo")


# --------------------------------------------------------------------------- #
# Main
# --------------------------------------------------------------------------- #

PHASES = [
    ("infra",     "A — Infraestructura Docker",      phase_infra,    True),
    ("emulator",  "B — Emulador + app móvil",         phase_emulator, True),
    ("captures",  "C — Capturas end-to-end",          phase_captures, True),
    ("docs",      "D — Análisis + docs",              phase_docs,     False),
    ("drive",     "E — Tesis integrada (Drive)",      phase_drive,    False),
    ("pack",      "F — Pack Total zip",               phase_pack,     False),
    ("git",       "G — Git commit + push",            phase_git,      False),
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
    args = ap.parse_args()

    hr("═")
    print(f"{C.BOLD}EcoRoute / Tesis MICOTRANS — Pipeline End-to-End{C.OFF}")
    print(f"  Root:       {ROOT}")
    print(f"  Tesis dir:  {TESIS}")
    print(f"  Modo:       {'DRY RUN' if args.dry_run else 'EJECUCIÓN REAL'}")
    if args.only:
        print(f"  Fase única: {args.only}")
    hr("═")

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
