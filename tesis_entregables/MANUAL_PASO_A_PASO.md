# Manual Paso a Paso — EcoRoute / Tesis MICOTRANS

**Para:** Kevin, jurado, equipo TI de MICOTRANS, cualquiera que quiera reproducir el sistema y los entregables de tesis desde cero.

**Cómo leerlo:** las fases A→G están en orden de dependencia. Si una falla, las siguientes pueden saltarse. Cada paso explica **qué hace**, **para qué** y **el comando exacto**.

**Tip:** todo lo que está acá lo automatiza `run_pipeline.py` desde la raíz del repo:
```powershell
python run_pipeline.py                       # ejecuta TODO (A→G)
python run_pipeline.py --only drive          # sólo actualiza la tesis en el Drive
python run_pipeline.py --skip-infra --skip-emulator   # sólo docs + pack
python run_pipeline.py --dry-run             # lista lo que haría sin ejecutar
```

---

## A. Levantar la infraestructura

**Para qué:** prender los 5 contenedores que el sistema necesita para responder requests (postgres + keycloak + localstack + backend Spring + web admin).

### A.1 docker compose up

**Qué hace:** crea/levanta los 5 contenedores. Si es la primera vez, descarga imágenes y compila backend y web admin.

```powershell
docker compose up -d
```

**Verificación:**
```powershell
docker ps
```
Deberías ver:
- `ecoroute-db` (postgres:14) — puerto 5433
- `ecoroute-keycloak` — puerto 8080
- `ecoroute-localstack` — puerto 4566
- `ecoroute-backend` — puerto 8081
- `ecoroute-web-admin` — puerto 3000

### A.2 Esperar a que la BD esté healthy

**Para qué:** Keycloak y el backend dependen de Postgres; si arrancan antes de que esté listo, fallan en el primer query.

```powershell
docker inspect --format='{{.State.Health.Status}}' ecoroute-db
```
Esperar a que devuelva `healthy` (30-60 segundos la primera vez).

### A.3 Configurar Keycloak

**Para qué:** crear el realm `ecoroute`, el cliente `mobile-app`, los 3 roles (ADMIN/DISPATCHER/DRIVER) y los 3 usuarios (admin/admin123, dispatcher/dispatcher123, conductor/conductor123). Sin esto, nadie puede loguearse.

```powershell
.\setup-keycloak.ps1
```

**Verificación:** abrí `http://localhost:8080/admin` → master realm → user `admin/admin` → buscar realm "ecoroute" → ver users.

### A.4 Cargar el esquema + datos REALES de MICOTRANS

**Para qué:** crear las 13 tablas + insertar 150 pedidos pre-test reales (CSV histórico) + 186 post-test sintéticos + 5 conductores + 5 vehículos + 24 guías GR-1001..GR-1024. Sin esto, la app móvil muestra vacío.

```powershell
docker cp schema.sql ecoroute-db:/schema.sql
docker cp micotrans_seed_complete.sql ecoroute-db:/seed.sql
docker exec ecoroute-db psql -U user -d ecoroute -f /schema.sql
docker exec ecoroute-db psql -U user -d ecoroute -f /seed.sql
```

**Verificación**: al final del seed se imprimen los 6 KPIs:

| Métrica | Esperado |
|---|---|
| PRE-TEST IID | 60.0% (90/150) |
| PRE-TEST CHR | 67.3% (101/150) |
| PRE-TEST TDE | 51.3% (77/150) |
| POST-TEST IID | ~98% |
| POST-TEST CHR | ~93% |
| POST-TEST TDE | ~94% |

Si los números difieren, el seed no se aplicó bien.

### A.5 Crear bucket S3 + cola SQS + topic SNS en LocalStack

**Para qué:** la app móvil, al confirmar una entrega DELIVERED, sube la foto y la firma al bucket `ecoroute-proofs` y publica un evento en la cola `ecoroute-notifications`. **Sin esto, el guardado falla con toast rojo "Fallo de red al subir evidencia"** (que justamente fue el flujo que tuvimos que arreglar en la sesión real, y por eso es crítico).

```powershell
docker exec ecoroute-localstack awslocal s3 mb s3://ecoroute-proofs
docker exec ecoroute-localstack awslocal sqs create-queue --queue-name ecoroute-notifications
docker exec ecoroute-localstack awslocal sns create-topic --name ecoroute-alerts
```

**Verificación:**
```powershell
docker exec ecoroute-localstack awslocal s3 ls
docker exec ecoroute-localstack awslocal sqs list-queues
```

---

## B. Emulador Android + app Flutter

**Para qué:** correr el aplicativo móvil contra el backend real para evidenciar las HU07 (cambio de estado), HU08 (foto de evidencia) y HU09 (firma digital con DNI).

### B.1 Listar y arrancar el AVD

**Para qué:** verificar que el AVD `Pixel_9_Pro_XL` existe (es el que tiene resolución 1344×2992 que matchea las capturas del Anexo Figuras).

```powershell
& "$env:LOCALAPPDATA\Android\Sdk\emulator\emulator.exe" -list-avds
```

Lanzar en background (no bloquea la terminal):
```powershell
Start-Process `
  -FilePath "$env:LOCALAPPDATA\Android\Sdk\emulator\emulator.exe" `
  -ArgumentList "-avd Pixel_9_Pro_XL -no-snapshot-save -no-boot-anim -netdelay none -netspeed full"
```

### B.2 Esperar boot

```powershell
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" wait-for-device
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" shell getprop sys.boot_completed
```
Cuando devuelva `1`, el emulador está listo.

### B.3 Compilar e instalar la app Flutter

**Para qué:** generar el APK debug y empujarlo al emulador.

```powershell
cd mobile-app
flutter pub get
flutter build apk --debug
adb install -r build/app/outputs/flutter-apk/app-debug.apk
```

**Nota:** la app está configurada para apuntar a `http://10.0.2.2:8081` (el alias del host desde dentro del emulador) en `mobile-app/lib/core/config/api_config.dart`.

### B.4 Lanzar la app

```powershell
adb shell am start -n com.example.ecoroute_driver_app/.MainActivity
```

### B.5 Login del conductor (manual o automatizado)

**Manual** (en el emulador con dedo/mouse): usuario `conductor`, password `conductor123`, tap "Ingresar".

**Programático** (coordenadas para el AVD Pixel 9 Pro XL):
```powershell
adb shell input tap 672 1650          # campo usuario
adb shell input text "conductor"
adb shell input tap 50 600            # cerrar teclado tocando fuera
adb shell input tap 672 1860          # campo password
adb shell input text "conductor123"
adb shell input tap 50 600
adb shell input tap 672 2115          # botón Login
```

**Tras login**: la app abre "Mis Rutas de Hoy" con 6 pedidos reales (GR-1019..GR-1024) y mapa con pines en Lima.

---

## C. Capturas para los Anexos de la tesis

**Para qué:** generar las 31 figuras del Anexo Figuras (10 del panel web + 21 del flujo móvil end-to-end). Estas son **el corazón de la evidencia visual** de la sustentación.

### C.1 Capturar el flujo end-to-end móvil

**Qué hace:** automatiza con ADB taps/swipes/screencaps todo el recorrido del pedido GR-1020:
1. Lista de Mis Rutas con datos reales MICOTRANS.
2. Tap GR-1020 PENDING → detalle.
3. Dropdown estado → IN_TRANSIT.
4. Tap cámara → foto.
5. Guardar estado → toast verde.
6. Re-abrir → cambiar a DELIVERED.
7. La UI expande Datos del Receptor + DNI + Firma digital.
8. Llenar DNI `47852963`, dibujar firma con 3 swipes, confirmar.
9. Guardar → upload a S3 + evento SQS → lista refrescada con GR-1020 DELIVERED.
10. Bonus: abrir GR-1021 (ya entregado) → app muestra "ENTREGA FINALIZADA - no se puede modificar".

```powershell
cd tesis_entregables
python capture_android_full_flow.py
```

**Salida:** 22 PNGs `RFM01_*..RFM22_*` en `tesis_entregables/figuras_capturas/`.

### C.2 Generar thumbnails ≤1500 px

**Para qué:** el emulador escupe screenshots a 1344×2992; cualquier captura con dimensión > 2000 px puede romper pipelines automatizados con la API de Anthropic. El helper genera siempre dos archivos: el original (alta resolución, para el .docx) y un thumb seguro.

```powershell
python safe_capture.py shrink_all figuras_capturas
```

**Salida:** un `*_thumb.png` por cada PNG existente.

### C.3 Capturar el panel web administrativo

**Para qué:** las figuras 20-26, 39 y 47 (login, home, dashboard, pedidos, rutas, conductores, vehículos, KPIs Tesis).

Con web-admin corriendo en `http://localhost:3000` y sesión `admin/admin123`:

```powershell
python capture_screenshots.py
```

Usa Playwright para abrir las pantallas y guardar PNG a 2880×1800.

---

## D. Análisis estadístico + Generación de documentos

**Para qué:** recalcular los números clave del Capítulo III y armar los `.docx` de cada anexo. Es 100% Python — no requiere Docker.

### D.1 Análisis estadístico

**Qué hace:** lee el CSV pre/post-test, calcula descriptivos, prueba de normalidad (Shapiro-Wilk), t-Student paired, Pearson, alfa de Cronbach. Imprime resultados.

```powershell
cd tesis_entregables
python analisis_estadistico.py
```

**Salida esperada:**
- t-Student paired IID: t = 14.53, p < 0.001, d Cohen = 2.24
- t-Student paired CHR: t = 10.97, p < 0.001, d Cohen = 1.69
- t-Student paired TDE: t = 13.80, p < 0.001, d Cohen = 2.13
- Pearson r (Facilidad↔IID) = 0.927, (Utilidad↔CHR) = 0.848, (Evidencia↔TDE) = 0.736
- Pearson r (Satisfacción↔KPI promedio) = 0.984
- Alfa Cronbach = 0.877

Si los números difieren, revisar que el seed `micotrans_seed_complete.sql` se cargó completo.

### D.2 Convertir todos los `.md` a `.docx`

**Para qué:** las fuentes de los Capítulos, Anexos, Manuales viven en Markdown (versionable, editable). Esto las convierte a Word.

```powershell
python convert_md_to_docx.py
```

**Salida:** 17 `.docx` en `tesis_entregables/docx/`.

### D.3 Anexo 2 consolidado

**Para qué:** generar el `Anexo_2_Consolidado.docx` que combina:
- El cuestionario UTAUT (5 dimensiones, 18 preguntas, escala Likert 1-5).
- Las 6 fichas KPI PDF (CHR/IID/TDE × pre/post) embebidas como páginas.

```powershell
python build_anexo2_consolidado.py
```

### D.4 Anexo Figuras

**Para qué:** generar el `Anexo_Figuras_Capturas.docx` con **31 figuras + captions**:
- Sección 1: 10 capturas del panel web administrativo (figuras 20-29).
- Sección 2: 21 capturas del flujo móvil end-to-end (M-50..M-70).

```powershell
python build_anexo_figuras_completo.py
```

---

## E. Tesis integrada — actualizar el documento del Drive de Kevin

**Para qué:** integrar TODO lo nuevo (Cap III/IV/V/VI + Anexos 2 UTAUT/3/4/5 + Anexo Figuras) dentro del documento real más actualizado que Kevin tiene en su Drive, **sin destruir lo que él ya tiene escrito**.

### E.1 ¿Cuál es el "doc real" de Kevin?

Es el archivo de Google Docs en:
```
https://docs.google.com/document/d/1voac3fBjNJLK2rVc-uSCpvO99K5olD8x/edit
```

Tiene 1138 párrafos, 51 imágenes, su carátula, declaratorias, Cap I y II completos, Anexo 8 Scrum con sus CAPÍTULO IV (Programación) y V (Pruebas) ya escritos. Le faltan: **el contenido de Cap III/IV/V/VI principales**, **el cuestionario UTAUT y las fichas post-test del Anexo 2**, **los Anexos 3/4/5 con contenido**, **el Anexo de Figuras del sistema**.

### E.2 Pre-condición: el doc debe estar compartido como "cualquiera con el link puede ver"

Sin eso, no se puede descargar con `curl`. Cambiar el permiso en el botón **Compartir** del doc.

### E.3 Ejecutar el integrador

**Qué hace** (ver `build_tesis_drive_integrada.py`):
1. Descarga el doc del Drive como `.docx` con `curl -sL .../export?format=docx`.
2. Promueve los placeholders "Resultados", "Discusión", "Conclusiones", "Recomendaciones" a Heading 1 numerados (III, IV, V, VI).
3. Inserta el contenido de `Capitulo_3_Resultados.docx` y `Capitulo_4_5_6_*.docx` justo después de cada placeholder.
4. Elimina los placeholders "Normal" residuales para que no haya duplicados.
5. Inserta el cuestionario UTAUT antes del Anexo 3.
6. Llena los Anexos 3, 4, 5 con sus contenidos pre-llenados.
7. Agrega "Anexo Visual — Capturas del Sistema EcoRoute" al final con 31 figuras.
8. Guarda en `tesis_entregables/docx/Tesis_Drive_Integrada_VFinal.docx`.

```powershell
cd tesis_entregables
# Invalidar cache local para forzar re-descarga del Drive (si Kevin lo editó)
del C:\tmp\kevin_drive_current.docx -ErrorAction SilentlyContinue
python build_tesis_drive_integrada.py
```

**Salida esperada:**
```
Base cargada: 1138 párrafos, 51 imágenes
[281] 'Resultados' -> promote a H1 'III. Resultados' + insertar contenido
   -> 63 elementos insertados
[382] 'Discusión' -> promote a H1 'IV. Discusión' + insertar Cap IV-V-VI
   -> 43 elementos insertados (incluye IV, V, VI)
   -> placeholder 'Conclusiones' eliminado
   -> placeholder 'Recomendaciones' eliminado
[704] insertar UTAUT antes de Anexo 3 -> 44 elementos
[746] insertar contenido Anexo 3      -> 82 elementos
[826] insertar contenido Anexo 4      -> 41 elementos
[873] insertar contenido Anexo 5      -> 33 elementos
+ Anexo Figuras del sistema           -> 98 elementos
OK -> Tesis_Drive_Integrada_VFinal.docx (19515 KB)
   Párrafos finales: 1525
   Imágenes finales: 82
```

### E.4 Subir al Drive

**Opción A — Reemplazar el contenido del doc actual (conserva la URL):**
1. Abrí https://docs.google.com/document/d/1voac3fBjNJLK2rVc-uSCpvO99K5olD8x/edit
2. **Archivo → Importar → Subir** y elegí `Tesis_Drive_Integrada_VFinal.docx`.
3. Elegí **"Reemplazar el documento existente"** → Importar datos.

**Opción B — Subir como doc nuevo:**
1. Andá a https://drive.google.com → Nuevo → Subir archivo → `Tesis_Drive_Integrada_VFinal.docx`.
2. Click derecho sobre el archivo subido → Abrir con → Google Docs (Google lo convierte).

### E.5 Re-ejecutar si Kevin sigue editando

Cada vez que él toque el doc en el Drive, basta con:
```powershell
cd tesis_entregables
del C:\tmp\kevin_drive_current.docx -ErrorAction SilentlyContinue
python build_tesis_drive_integrada.py
```

> **⚠️ Idempotencia parcial:** el script asume que los placeholders "Resultados", "Discusión", "Conclusiones", "Recomendaciones" todavía están vacíos como `Normal`. Si Kevin ya copió manualmente algo en esas secciones, el script **igual va a insertar** todo el contenido (duplica). Antes de re-correr, asegurate de que las 4 secciones siguen vacías o ajustar el script para que detecte contenido existente.

---

## F. Pack Total — empaquetar el zip de entrega

**Para qué:** generar el `.zip` que se entrega a Kevin para la sustentación: todos los `.docx`, fichas KPI, capturas, scripts, markdowns, SQL pre-test. Excluye thumbs y XMLs de debug (regenerables).

```powershell
cd "Proyecto Integrador Desarrollo de Software 3"
python run_pipeline.py --only pack
```

O manualmente (sin el pipeline):
```powershell
python -c "
import zipfile
from pathlib import Path
root = Path('.')
zip_path = root / 'EcoRoute_TesisPack_Total_v5.zip'
te = root / 'tesis_entregables'
def keep(p):
    if '__pycache__' in p.parts: return False
    if p.suffix == '.xml': return False
    if p.name.endswith('_thumb.png'): return False
    if p.name.startswith(('_diag_','FM_test_current','.pdf_kevin_extract')): return False
    return True
with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED, compresslevel=6) as z:
    for p in sorted(te.rglob('*')):
        if p.is_file() and keep(p):
            z.write(p, arcname=str(p.relative_to(root)))
    for extra in ('micotrans_pretest_real.sql','micotrans_seed_complete.sql','micotrans_seed.sql'):
        f = root / extra
        if f.exists(): z.write(f, arcname=f.name)
print(f'Zip listo: {zip_path.stat().st_size//1024//1024} MB')
"
```

**Salida esperada:** ~70 MB, 160+ archivos.

---

## G. Versionado en git (opcional)

### G.1 Commit local

```powershell
git add tesis_entregables/ run_pipeline.py
git commit -m "feat(tesis): re-run pipeline - docs + captures + drive integration"
```

### G.2 Tag y push

```powershell
$tag = "pipeline-run-$(Get-Date -Format yyyyMMdd-HHmmss)"
git tag $tag
git push origin (git branch --show-current) $tag
```

### G.3 GitHub Release con el zip (manual, web)

1. Abrí `https://github.com/<user>/<repo>/releases/new?tag=$tag`
2. Arrastrá `EcoRoute_TesisPack_Total_v5.zip`.
3. Publicar release.

---

## Resumen de archivos importantes

| Archivo | Para qué |
|---|---|
| `run_pipeline.py` | Orquestador end-to-end (este manual automatizado) |
| `docker-compose.yml` | Stack de 5 contenedores |
| `setup-keycloak.ps1` | Crear realm + clientes + usuarios |
| `schema.sql` | 13 tablas del modelo de datos |
| `micotrans_seed_complete.sql` | Seed unificado MICOTRANS (150 pre + 186 post) |
| `tesis_entregables/safe_capture.py` | Helper anti-2000 px (siempre original + thumb) |
| `tesis_entregables/capture_android_full_flow.py` | Captura flujo end-to-end móvil |
| `tesis_entregables/capture_screenshots.py` | Captura panel web admin |
| `tesis_entregables/analisis_estadistico.py` | t-Student, Pearson, Cronbach |
| `tesis_entregables/convert_md_to_docx.py` | Conversor MD→DOCX |
| `tesis_entregables/build_anexo2_consolidado.py` | UTAUT + 6 fichas KPI |
| `tesis_entregables/build_anexo_figuras_completo.py` | 31 figuras en docx |
| `tesis_entregables/build_tesis_drive_integrada.py` | **Integrador del Drive de Kevin** |
| `tesis_entregables/docx/Tesis_Drive_Integrada_VFinal.docx` | **Tesis lista para subir al Drive** |
| `EcoRoute_TesisPack_Total_v5.zip` | Pack final de entrega |

---

## Troubleshooting express

| Síntoma | Causa | Solución |
|---|---|---|
| `docker compose up` cuelga | Docker Desktop no arrancó | Iniciar Docker Desktop, esperar al ícono verde |
| Toast rojo en la app "Fallo de red al subir evidencia" | Falta bucket S3 o cola SQS | Paso A.5 |
| `setup-keycloak.ps1` errores 401 | Keycloak aún no booteó | Esperar 60s más, reintentar |
| App móvil no se conecta al backend | URL apunta a `localhost` | Editar `mobile-app/lib/core/config/api_config.dart` para que use `10.0.2.2:8081` |
| Emulador no detectado | adb daemon muerto | `adb kill-server && adb start-server` |
| `pdftotext: command not found` | Pandoc/poppler no instalado | `choco install pandoc poppler` o saltar fase E |
| Captura PNG bloquea el pipeline con "image exceeds 2000px" | Estás haciendo `Read` directo sobre la imagen original | Usar siempre `safe_capture.py` y leer sólo `*_thumb.png` |
| Drive download devuelve HTML | El doc no está compartido como "cualquiera con link puede ver" | Cambiar permiso en el doc → reintentar |
| `gh release create` falla con "workflow scope" | El token gh está en otra cuenta sin permisos en el repo | Subir el zip manualmente desde la web de GitHub |
| El integrador inserta contenido duplicado al re-correr | Kevin ya copió algo en Cap III/IV/V/VI | Borrar las secciones manualmente en el Drive antes de re-correr |

---

## Para sustentar — checklist final

- [ ] **A** — Docker arriba, BD con seed cargado (verificación KPIs)
- [ ] **A.5** — S3 + SQS + SNS creados en LocalStack
- [ ] **D.1** — Análisis estadístico ejecutado (t > 10, p < 0.001 en los 3 KPIs)
- [ ] **D.4** — Anexo Figuras con 31 capturas reales generado
- [ ] **E.3** — Tesis_Drive_Integrada_VFinal.docx generado (1525 párrafos, 82 imágenes)
- [ ] **E.4** — Subido al Drive (Archivo → Importar → Reemplazar)
- [ ] **Manual** — Anexos 3, 4, 5 con firmas físicas escaneadas y reemplazadas en el doc
- [ ] **F** — Pack Total v5.zip generado
- [ ] **G** — Tag y push al repo
- [ ] **Demo** — Practicar el flujo en vivo: login admin → KPIs Tesis → descargar PDF → app móvil → flujo GR-1020 PENDING→DELIVERED

> **Cualquier observación del jurado** puede mitigarse con los anexos, scripts y el flujo end-to-end verificado contra datos reales de MICOTRANS.
