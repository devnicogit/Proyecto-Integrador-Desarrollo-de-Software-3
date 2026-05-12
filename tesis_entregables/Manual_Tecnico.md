# Manual Técnico — Sistema EcoRoute (v3 — Pack Total)

**Para:** Desarrolladores, administradores de sistemas, equipo TI de MICOTRANS, sustentación de tesis.
**Versión:** 3.0 — Mayo 2026 (incluye flujo end-to-end verificado en emulador real)
**Autor del proyecto:** Campos Vargas Kevin Stip — UCV
**Para qué sirve este manual:** levantar el sistema desde cero, validar que funciona contra los datos REALES de MICOTRANS, capturar las pruebas que respaldan la tesis, regenerar los entregables y empaquetar el Pack Total.

---

## 0. Lectura rápida — ¿Qué vas a hacer y por qué?

| Si querés… | Saltá a |
|---|---|
| Sólo entender qué hace el sistema | §1 Arquitectura |
| Levantar todo y verlo funcionar | §3 Despliegue (sigue del paso 3.1 al 3.13) |
| Capturar las pruebas para la tesis (figuras 20–46 + flujo móvil) | §5 Captura de evidencias |
| Regenerar los .docx, fichas KPI y Anexos | §6 Regeneración de entregables |
| Volver a armar el zip Pack Total | §7 Pack Total |
| Resolver un problema | §8 Troubleshooting |
| Saber qué hay en el repo | §2 Estructura |
| API / endpoints | §4 API |

---

## 1. Arquitectura General

EcoRoute es un sistema **distribuido en 3 componentes principales** + **infraestructura Docker**:

```
┌────────────────────┐   ┌─────────────────────┐
│  Web Admin (React) │   │ Mobile App (Flutter)│
│   localhost:3000   │   │  Android Pixel 9 XL │
└──────────┬─────────┘   └──────────┬──────────┘
           │ HTTPS/REST              │ HTTPS/REST + WSS
           └───────────┬─────────────┘
                       ▼
           ┌────────────────────────┐
           │ Backend Spring WebFlux │
           │   localhost:8081       │
           └─────┬──────┬─────┬─────┘
                 │      │     │
        ┌────────▼─┐ ┌──▼──┐ ┌▼──────────┐
        │PostgreSQL│ │Key- │ │ LocalStack│
        │ :5433    │ │cloak│ │ S3+SQS+SNS│
        │          │ │:8080│ │  :4566    │
        └──────────┘ └─────┘ └───────────┘
```

### 1.1 Stack tecnológico

| Capa | Tecnología | Versión | Por qué |
|---|---|---|---|
| Backend lenguaje | Java | 17 | Tipado fuerte, ecosistema maduro, requisito de LTS |
| Backend framework | Spring Boot WebFlux | 3.5 | Reactivo (Mono/Flux), no bloqueante, escalable |
| Persistencia | R2DBC PostgreSQL | reactivo | Coherente con WebFlux; sin pool JDBC bloqueante |
| BD | PostgreSQL | 14 | SQL estándar, JSONB, índices parciales |
| Autenticación | Keycloak | 23 | OAuth2/OIDC listo, sin reinventar JWT |
| Migraciones | Flyway | latest | Versionado SQL idempotente |
| Cache | Redis (Lettuce) | latest | Sesiones, throttling, cache de rutas |
| Cloud storage | AWS S3 SDK v2.25 (LocalStack en dev) | 2.25 | Mismo SDK que prod; LocalStack emula S3+SQS+SNS |
| Mensajería | AWS SQS/SNS | LocalStack | Eventos asíncronos (entrega completada, alerta) |
| Resiliencia | Resilience4j | 2.2 | Circuit breaker, retry, timeouts |
| Web SPA | React + Vite + TypeScript | React 18 | Vite = HMR rápido; TS = menos bugs en runtime |
| Charts | Chart.js + react-chartjs-2 | 4.x | Curvas KPI pre/post-test |
| Mobile | Flutter + Dart | 3.x | Una sola codebase Android + iOS |
| State móvil | flutter_bloc | latest | Separa UI de lógica; testeable |
| Mapas | Google Maps Flutter | latest | Polilíneas y markers para rutas |

### 1.2 Patrones arquitectónicos

- **Hexagonal (Ports & Adapters)**: el dominio (`domain/`) no depende de Spring ni de la BD. Los puertos están en `domain/ports/{in,out}` y los adaptadores en `infrastructure/{input,output}`. Esto permite testear el dominio sin levantar Spring.
- **Reactive Streams** end-to-end: `Mono`/`Flux` desde el controller hasta el repository (R2DBC). Una request bloqueada no bloquea el thread.
- **Clean Architecture** en móvil: `data` / `domain` / `presentation` por feature (`auth`, `orders`, `routes`, `gps`, `history`).
- **CQRS ligero**: `KpiRepository` y `KpiReportService` son sólo lectura; los use cases `Place*` y `Update*Status` son escritura.
- **Event sourcing parcial**: la tabla `order_status_history` registra cada cambio de estado de cada pedido, con timestamp y usuario que lo emitió. Sirve para auditoría y para calcular la CHR del pre-test.

---

## 2. Estructura de carpetas (qué hay y para qué)

```
proyecto-integrador/
├── src/                                      Backend Spring Boot (Java 17)
│   ├── main/java/com/ecoroute/backend/
│   │   ├── domain/                           Entidades + puertos (sin dependencias Spring)
│   │   │   ├── model/                        Order, Driver, Vehicle, Route, DeliveryProof…
│   │   │   ├── ports/in/                     Interfaces de use cases
│   │   │   └── ports/out/                    Interfaces de repositories
│   │   ├── application/                      Implementaciones de los puertos
│   │   │   ├── services/
│   │   │   │   ├── KpiReportService          Calcula IID/CHR/TDE pre y post-test
│   │   │   │   ├── KpiFichaExportService     Exporta CSV/PDF (reportlab) de fichas
│   │   │   │   ├── S3Service                 Upload de fotos/firmas a S3
│   │   │   │   └── NotificationService       Publica eventos a SQS
│   │   │   └── usecases/
│   │   └── infrastructure/                   Adaptadores concretos
│   │       ├── config/                       SecurityConfig, CorsConfig, JacksonConfig…
│   │       ├── input/rest/                   Controllers (ReportController, OrderController…)
│   │       ├── input/websocket/              GPS y notificaciones realtime
│   │       └── output/persistence/           R2DBC repositories + Spring Data
│   ├── main/resources/
│   │   ├── application.yml                   Config base (SQS queue-url, S3 endpoint…)
│   │   ├── application-local.yml             Override para desarrollo
│   │   ├── application-docker.yml            Override cuando backend corre en contenedor
│   │   └── db/migration/                     Flyway V001__init.sql, V002__add_kpis.sql…
│   └── test/java/...                         JUnit 5 + Reactor Test + WebTestClient
│
├── web-admin/                                Panel web React/TS
│   ├── src/
│   │   ├── components/
│   │   │   └── ThesisKpis.tsx                Dashboard pre/post-test con Chart.js
│   │   ├── pages/
│   │   │   ├── Reports.tsx                   Tabs Operativo / Tesis
│   │   │   └── Dashboard.tsx
│   │   ├── services/
│   │   │   └── reportService.ts              fetch wrappers: getKpi, downloadKpiFicha
│   │   ├── context/                          AuthContext, ThemeContext (dark mode)
│   │   └── styles/
│   └── package.json
│
├── mobile-app/                               Flutter (Android Pixel 9 Pro XL / iOS)
│   ├── lib/
│   │   ├── core/                             DI (get_it), theme, router (go_router), cache
│   │   ├── features/
│   │   │   ├── auth/                         Login Keycloak password grant
│   │   │   ├── gps/                          WebSocket + foreground service
│   │   │   ├── orders/                       Detalle pedido + cambio estado + evidencia
│   │   │   ├── routes/                       "Mis Rutas de Hoy"
│   │   │   └── history/                      Histórico de entregas
│   │   └── main.dart
│   └── pubspec.yaml
│
├── infra/                                    Init scripts LocalStack (ver §3.7)
├── docker-compose.yml                        5 servicios: postgres, keycloak, localstack, backend, web-admin
├── schema.sql                                Esquema BD (13 tablas)
├── micotrans_seed.sql                        Seed modular (usa \i, requiere psql)
├── micotrans_seed_complete.sql               ⭐ Seed unificado todo-en-uno
├── micotrans_pretest_real.sql                Sólo el pre-test real (150 INSERTs del CSV)
├── EcoRoute_TesisPack_Total_v3.zip           Artifact del release (ignorado por git)
└── tesis_entregables/                        Toda la documentación de tesis
    ├── docx/                                 18 .docx generados desde los .md
    ├── fichas_kpi_pdf/                       6 fichas KPI pre/post + sus CSV + PNGs
    ├── figuras_capturas/                     ~70 PNGs (web 2880×1800 + móvil 1344×2992)
    ├── figuras_mockup/                       5 HTML mockups (alternativa a capturas reales)
    ├── *.md                                  Fuentes editables (Cap III, Anexos, Manuales…)
    ├── safe_capture.py                       Helper anti-2000px ⭐
    ├── build_anexo_figuras_completo.py       Inserta capturas en Anexo Figuras docx
    ├── build_anexo2_consolidado.py           Consolida cuestionario + 6 fichas PDF en docx
    ├── convert_md_to_docx.py                 Pasa todos los .md a .docx con pandoc
    ├── capture_android_full_flow.py          Captura flujo end-to-end del emulador
    └── analisis_estadistico.py               t-Student / Pearson / Cronbach desde CSV
```

---

## 3. Despliegue local — paso a paso completo

Esta sección levanta TODO el sistema desde cero y deja la base con los datos reales de MICOTRANS lista para validar la tesis.

### 3.1 Prerrequisitos

| Software | Versión mín. | Verificación |
|---|---|---|
| Docker Desktop | 4.x | `docker --version` |
| Java JDK | 17 | `java -version` |
| Node.js | 18 | `node --version` |
| Flutter SDK | 3.x | `flutter --version` |
| Android Studio + SDK 34 + AVD Pixel 9 Pro XL | 2024+ | `adb devices` |
| Git | 2.x | `git --version` |
| Python | 3.10+ | `python --version` |
| pandoc | 3.x | `pandoc --version` (para convertir .md → .docx) |
| AWS CLI (opcional) | latest | `aws --version` |

### 3.2 Clonar el repositorio

```powershell
git clone git@github.com:devnicogit/Proyecto-Integrador-Desarrollo-de-Software-3.git
cd "Proyecto Integrador Desarrollo de Software 3"
```

### 3.3 Levantar la infraestructura Docker

```powershell
docker compose up -d
```

Crea 5 contenedores:

| Contenedor | Puerto host | Para qué |
|---|---|---|
| `ecoroute-db` (Postgres 14) | 5433 | Datos persistentes |
| `ecoroute-keycloak` | 8080 | Autenticación JWT |
| `ecoroute-localstack` | 4566 | S3 (fotos/firmas) + SQS (eventos) + SNS (alerts) |
| `ecoroute-backend` (Spring Boot) | 8081 | API REST + WS |
| `ecoroute-web-admin` (nginx + React) | 3000 | Panel administrativo |

Esperar 30–60 segundos. Verificar:

```powershell
docker ps
curl http://localhost:8081/actuator/health
```

Si el health responde `{"status":"UP"}` o devuelve `DOWN` sólo por `redis`/`r2dbc` arrancando, está bien.

### 3.4 Configurar Keycloak

```powershell
./setup-keycloak.ps1
```

Crea automáticamente:
- Realm `ecoroute`
- Client `mobile-app` (público, *direct access grant*)
- Roles `ADMIN`, `DISPATCHER`, `DRIVER`
- Usuarios:
  - `admin` / `admin123` (rol ADMIN)
  - `dispatcher` / `dispatcher123` (rol DISPATCHER)
  - `conductor` / `conductor123` (rol DRIVER)

### 3.5 Cargar esquema + datos REALES de MICOTRANS

```powershell
docker cp schema.sql ecoroute-db:/schema.sql
docker cp micotrans_seed_complete.sql ecoroute-db:/seed.sql
docker exec ecoroute-db psql -U user -d ecoroute -f /schema.sql
docker exec ecoroute-db psql -U user -d ecoroute -f /seed.sql
```

Al final del seed verificar las salidas esperadas (críticas para la defensa):

| Métrica | Esperado | Por qué |
|---|---|---|
| PRE-TEST IID (real) | **60.0%** (90/150) | Base sin el sistema (CSV histórico) |
| PRE-TEST CHR (real) | **67.3%** (101/150) | |
| PRE-TEST TDE (real) | **51.3%** (77/150) | |
| POST-TEST IID | ~98% | Datos del sistema EcoRoute en producción simulada |
| POST-TEST CHR | ~93% | |
| POST-TEST TDE | ~94% | |

### 3.6 Crear recursos en LocalStack (S3 + SQS + SNS)

⚠️ **Crítico**: sin esto, la subida de evidencias falla con `NoSuchBucketException` o `QueueDoesNotExistException` (el error que aparece como toast rojo `Fallo de red al subir evidencia` en la app móvil).

```powershell
docker exec ecoroute-localstack awslocal s3 mb s3://ecoroute-proofs
docker exec ecoroute-localstack awslocal sqs create-queue --queue-name ecoroute-notifications
docker exec ecoroute-localstack awslocal sns create-topic --name ecoroute-alerts
```

Verificación:

```powershell
docker exec ecoroute-localstack awslocal s3 ls
docker exec ecoroute-localstack awslocal sqs list-queues
```

### 3.7 (Opcional) Init script automático para LocalStack

Para que estos recursos se creen sin acción manual cada vez que levantes el compose, hay un script en `infra/localstack-init.sh` que monta `docker-compose` automáticamente:

```yaml
# docker-compose.yml (fragmento)
localstack:
  volumes:
    - ./infra/localstack-init.sh:/etc/localstack/init/ready.d/init.sh
```

### 3.8 (Si necesitás backend fuera de Docker) Levantarlo local

Si modificás código backend y querés debug rápido, podés correrlo fuera de Docker (apagando primero `ecoroute-backend`):

```powershell
docker compose stop ecoroute-backend
./gradlew.bat bootRun --args="--spring.profiles.active=local"
```

Verificar:
- `http://localhost:8081/actuator/health` → `UP`
- `http://localhost:8081/swagger-ui.html` → OpenAPI

### 3.9 (Si necesitás web-admin con HMR) Levantarlo local

```powershell
docker compose stop ecoroute-web-admin
cd web-admin
npm install
npm run dev
```

Abrir `http://localhost:3000`. Login `admin` / `admin123`.

### 3.10 Arrancar el emulador Android

```powershell
# Listar AVDs
%LOCALAPPDATA%\Android\Sdk\emulator\emulator.exe -list-avds
# Lanzar el Pixel 9 Pro XL (en background)
Start-Process -FilePath "$env:LOCALAPPDATA\Android\Sdk\emulator\emulator.exe" -ArgumentList "-avd Pixel_9_Pro_XL -no-snapshot-save -no-boot-anim"
# Verificar
%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe devices
%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe shell getprop sys.boot_completed
```

Esperar a `sys.boot_completed = 1` (60–90 segundos).

### 3.11 Compilar e instalar la app móvil

```powershell
cd mobile-app
flutter pub get
flutter build apk --debug
adb install -r build/app/outputs/flutter-apk/app-debug.apk
adb shell am start -n com.example.ecoroute_driver_app/.MainActivity
```

**Importante**: la app debe apuntar al backend en `http://10.0.2.2:8081` (cuando corre en emulador) o `http://host.docker.internal:8081`. Está configurado en `mobile-app/lib/core/config/api_config.dart`.

### 3.12 Login del conductor en la app móvil

```powershell
# Apaga teclado primero
adb shell input keyevent 4
# Tap campo usuario
adb shell input tap 672 1650
adb shell input text "conductor"
# Tap fuera para cerrar teclado
adb shell input tap 50 600
# Tap campo password
adb shell input tap 672 1860
adb shell input text "conductor123"
adb shell input tap 50 600
# Tap botón login
adb shell input tap 672 2115
```

Tras login, la app muestra **"Mis Rutas de Hoy"** con los 6 pedidos reales del CSV de MICOTRANS (GR-1019 a GR-1024) y un mapa con los pines en Lima.

### 3.13 Validar visualmente

| Cosa a ver | Dónde |
|---|---|
| Login admin | `http://localhost:3000` → `admin/admin123` |
| Pedidos reales de MICOTRANS | Pedidos → tabla con GR-1001..GR-1024 |
| Dashboard KPIs Tesis | Reportes → tab "KPIs de Gestión Administrativa (Tesis)" → muestra IID/CHR/TDE pre vs post |
| Mapa con rutas | Rutas → seleccionar Ruta #4 |
| App móvil con datos reales | Emulador → login conductor → ver lista de 6 pedidos |

---

## 4. API Endpoints (referencia rápida)

### 4.1 Autenticación

```http
POST http://localhost:8080/realms/ecoroute/protocol/openid-connect/token
Content-Type: application/x-www-form-urlencoded

grant_type=password&client_id=mobile-app&username=admin&password=admin123
```

### 4.2 CRUDs principales (todos requieren `Authorization: Bearer <jwt>`)

| Recurso | Endpoints | Roles |
|---|---|---|
| Conductores | `GET/POST /drivers`, `GET/PUT/DELETE /drivers/{id}` | ADMIN, DISPATCHER |
| Vehículos | `GET/POST /vehicles`, `GET/PUT/DELETE /vehicles/{id}` | ADMIN, DISPATCHER |
| Rutas | `GET/POST /routes`, `GET /routes/{id}`, `PATCH /routes/{id}/status` | ADMIN, DISPATCHER, DRIVER |
| Pedidos | `GET/POST /orders`, `GET /orders/{id}`, `PATCH /orders/{id}/status` | ADMIN, DISPATCHER, DRIVER |
| Evidencias | `POST /delivery-proofs` (multipart imagen + signature_data_url + DNI) | DRIVER |

### 4.3 KPIs de tesis

| Endpoint | Devuelve | Para qué |
|---|---|---|
| `GET /reports/kpi/iid?startDate=&endDate=&testType=` | `[{day, total, valid, percent}]` | Curva IID por día |
| `GET /reports/kpi/chr?startDate=&endDate=&testType=` | `[{day, total, delivered, percent}]` | Curva CHR |
| `GET /reports/kpi/tde?startDate=&endDate=&testType=` | `[{day, total, with_evidence, percent}]` | Curva TDE |
| `GET /reports/kpi/{ind}/csv?startDate=&endDate=&testType=` | CSV ficha | Anexo 2 de la tesis |
| `GET /reports/kpi/{ind}/pdf?startDate=&endDate=&testType=` | PDF ficha (reportlab) | Anexo 2 de la tesis |

Parámetro `testType` ∈ `{pre, post}`.

### 4.4 WebSocket GPS

`WSS /ws/gps` — bidireccional. Conductor envía pings cada 5s; el panel admin recibe broadcasts y los pinta en tiempo real sobre el mapa.

---

## 5. Captura de evidencias para la tesis

Esta sección es la **clave** para generar las figuras 20-46 (web) y M-50..M-70 (móvil) que van en el Anexo Figuras del informe.

### 5.1 Helper anti-2000px (lectura obligatoria)

El emulador Android Pixel 9 Pro XL devuelve screenshots a **1344×2992** y la API de Anthropic (en uso en pipelines automatizados) **rechaza imágenes con dimensión > 2000 px**. Para evitar bloqueos, usá siempre `safe_capture.py`:

```powershell
cd tesis_entregables
# Tomar una captura nueva
python safe_capture.py shot RFM_nombre_descriptivo
# Genera DOS archivos:
#   figuras_capturas/RFM_nombre_descriptivo.png       (1344×2992 original — para el .docx)
#   figuras_capturas/RFM_nombre_descriptivo_thumb.png (≤1500 px — único seguro para Read en pipelines)
```

Para shrinkar todo lo que ya tenés capturado:

```powershell
python safe_capture.py shrink_all ./figuras_capturas
```

### 5.2 Capturar el panel web administrativo (Figuras 20-26 + 39 + 47)

Con web-admin corriendo (`http://localhost:3000`) y sesión iniciada como `admin/admin123`:

```powershell
cd tesis_entregables
python capture_html_mockups.py     # captura mockups HTML (figuras_mockup/*.html)
python capture_screenshots.py      # captura el web admin real (requiere Playwright)
```

Cada script abre el navegador, navega a cada pantalla y guarda PNG a 2880×1800 en `figuras_capturas/`.

### 5.3 Capturar el flujo end-to-end de la app móvil (M-50..M-70)

Con el emulador booteado, app instalada y conductor logueado:

```powershell
cd tesis_entregables
python capture_android_full_flow.py
```

Este script automatiza el flujo HU07+HU08+HU09 completo:

1. Login con `conductor/conductor123`.
2. Listar pedidos reales (6 entregas de Ruta #4: GR-1019..GR-1024).
3. Abrir GR-1020 (PENDING).
4. Cambiar dropdown a IN_TRANSIT → tomar foto → guardar.
5. Re-abrir → cambiar a DELIVERED → llenar DNI `47852963` → dibujar firma → confirmar → guardar.
6. Verificar lista refrescada con GR-1020 DELIVERED.
7. (Prueba negativa) Abrir GR-1021 ya entregado → app muestra "ENTREGA FINALIZADA - No se puede modificar".

Cada paso genera una captura RFM01..RFM22 + su thumb. Las 22 capturas se integran en el Anexo Figuras automáticamente.

### 5.4 Recalibrar coordenadas si el AVD cambia

Si usás un AVD distinto al Pixel 9 Pro XL, las coordenadas (x, y) del script no encajan. Para regenerarlas usá uiautomator:

```powershell
adb shell uiautomator dump /sdcard/ui.xml
adb exec-out cat /sdcard/ui.xml > tesis_entregables/ui_dump.xml
```

Luego inspeccionar `bounds="[x1,y1][x2,y2]"` de cada elemento (campo usuario, password, botón Login, dropdown, cámara, GUARDAR ESTADO…) y ajustar el script.

### 5.5 Captura del flujo de error (S3 down)

Si querés mostrar también el manejo de errores (toast rojo "Fallo de red al subir evidencia"):

```powershell
# Tirar el bucket S3 sin tirar el resto
docker exec ecoroute-localstack awslocal s3 rb s3://ecoroute-proofs --force
# Intentar guardar un DELIVERED en la app → debería tirar toast rojo
# Tomar captura
python safe_capture.py shot RFM_error_upload
# Re-crear el bucket
docker exec ecoroute-localstack awslocal s3 mb s3://ecoroute-proofs
```

---

## 6. Regeneración de entregables

Todos los `.docx`, fichas KPI y anexos del Pack se regeneran desde los `.md` fuente y las CSV. Si cambiás un valor (ej: ajustás una cifra en `Capitulo_3_Resultados.md`), basta con re-ejecutar el pipeline.

### 6.1 Análisis estadístico (recalcula los números del Cap III)

```powershell
cd tesis_entregables
python analisis_estadistico.py
```

Salida esperada (con los datos pre/post del seed):

| Test | Resultado |
|---|---|
| t-Student paired IID | t = 14.53, p < 0.001, d Cohen = 2.24 |
| t-Student paired CHR | t = 10.97, p < 0.001, d Cohen = 1.69 |
| t-Student paired TDE | t = 13.80, p < 0.001, d Cohen = 2.13 |
| Pearson r (Facilidad↔IID) | 0.927 |
| Pearson r (Utilidad↔CHR) | 0.848 |
| Pearson r (Evidencia↔TDE) | 0.736 |
| Pearson r (Satisfacción↔KPI promedio) | 0.984 |
| Alfa de Cronbach (UTAUT) | 0.877 |

Si los números no coinciden, revisar el seed.

### 6.2 Conversión Markdown → Word (todos los .md a .docx)

```powershell
cd tesis_entregables
python convert_md_to_docx.py
```

Convierte todos los `.md` de la carpeta a `.docx` (en `tesis_entregables/docx/`) usando pandoc. Salida esperada: 17 archivos.

### 6.3 Anexo 2 consolidado (cuestionario UTAUT + 6 fichas KPI)

```powershell
cd tesis_entregables
python build_anexo2_consolidado.py
```

Genera `docx/Anexo_2_Consolidado.docx` que combina el instrumento Likert + las 6 fichas PDF (CHR/IID/TDE × pre/post) como páginas insertadas.

### 6.4 Anexo Figuras (panel web + flujo móvil end-to-end)

```powershell
cd tesis_entregables
python build_anexo_figuras_completo.py
```

Genera `docx/Anexo_Figuras_Capturas.docx` con:
- Sección 1: Panel Web Administrativo (10 figuras: F20–F26, F39, F47, F47b).
- Sección 2: Aplicativo Móvil — Flujo End-to-End (21 figuras: RFM01–RFM22 + RFM_extra).

Total **31 figuras** con captions explicativos.

### 6.5 Fichas KPI individuales (PDFs descargables)

Las 6 fichas (CHR/IID/TDE × pre/post) se generan a través del backend:

```powershell
# Obtener token JWT primero
$token = (curl -s -X POST "http://localhost:8080/realms/ecoroute/protocol/openid-connect/token" `
  -H "Content-Type: application/x-www-form-urlencoded" `
  -d "grant_type=password&client_id=mobile-app&username=admin&password=admin123" | ConvertFrom-Json).access_token

# Descargar cada ficha
foreach ($ind in @('chr','iid','tde')) {
  foreach ($test in @('pre','post')) {
    Invoke-WebRequest -Uri "http://localhost:8081/reports/kpi/$ind/pdf?startDate=2026-01-01&endDate=2026-04-30&testType=$test" `
      -Headers @{Authorization="Bearer $token"} `
      -OutFile "tesis_entregables/fichas_kpi_pdf/ficha_${ind}_${test}-test.pdf"
  }
}
```

---

## 7. Pack Total — empaquetado final

El **Pack Total** es el zip que se entrega a Kevin para la sustentación. Contiene todos los `.docx`, fichas KPI, capturas reales, scripts reproducibles, markdowns fuente, SQL pre-test.

### 7.1 Generar el zip

```powershell
cd "Proyecto Integrador Desarrollo de Software 3"
python -c "
import zipfile
from pathlib import Path
root = Path('.')
zip_path = root / 'EcoRoute_TesisPack_Total_v3.zip'
te = root / 'tesis_entregables'
EXCLUDE_NAMES = {'__pycache__', '.ipynb_checkpoints'}
EXCLUDE_EXT = {'.xml'}
EXCLUDE_SUFFIX = {'_thumb.png'}
def keep(p):
    if any(part in EXCLUDE_NAMES for part in p.parts): return False
    if p.suffix.lower() in EXCLUDE_EXT: return False
    if any(p.name.endswith(s) for s in EXCLUDE_SUFFIX): return False
    if p.name.startswith('_diag_'): return False
    return True
with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED, compresslevel=6) as z:
    for p in te.rglob('*'):
        if p.is_file() and keep(p):
            z.write(p, arcname=str(p.relative_to(root)))
    pre = root / 'micotrans_pretest_real.sql'
    if pre.exists(): z.write(pre, arcname=pre.name)
print(f'OK -> {zip_path.stat().st_size//1024//1024} MB')
"
```

Output esperado: `EcoRoute_TesisPack_Total_v3.zip` ≈ 57 MB, 156 archivos.

### 7.2 Publicar como GitHub Release

```powershell
git tag -a tesis-pack-v3-$(Get-Date -Format yyyyMMdd) -m "Pack Total v3 - tesis MICOTRANS end-to-end"
git push origin tesis-pack-v3-$(Get-Date -Format yyyyMMdd)
gh release create tesis-pack-v3-$(Get-Date -Format yyyyMMdd) EcoRoute_TesisPack_Total_v3.zip `
  --title "Pack Total v3 - Tesis MICOTRANS" `
  --notes-file tesis_entregables/RELEASE_NOTES_v3.md
```

(Si `gh release create` falla por permisos, subirlo manualmente en `https://github.com/<user>/<repo>/releases/new?tag=<tag>` y arrastrar el zip.)

### 7.3 ¿Qué contiene el zip?

| Subcarpeta | Cantidad | Para qué |
|---|---|---|
| `tesis_entregables/docx/` | 18 .docx | Documentos finales listos para imprimir |
| `tesis_entregables/fichas_kpi_pdf/` | 6 PDF + 6 CSV + 12 PNG | Fichas KPI individuales |
| `tesis_entregables/figuras_capturas/` | ~70 PNG originales | Imágenes alta resolución para el Anexo |
| `tesis_entregables/figuras_mockup/` | 5 HTML | Mockups alternativos |
| `tesis_entregables/*.md` | 17 markdowns | Fuentes editables de todo el Pack |
| `tesis_entregables/*.py` | 14 scripts | Pipeline reproducible |
| `tesis_entregables/*.csv` | datos UTAUT + fichas | |
| `micotrans_pretest_real.sql` | 1 SQL | 150 INSERTs reales del pre-test |

Excluido del zip (regenerable):
- Thumbs `*_thumb.png` (los regenera `safe_capture.py shrink_all`)
- UI dumps `ui_*.xml` (debug temporal)
- Capturas `_diag_*` (diagnóstico)

---

## 8. Troubleshooting

### 8.1 Síntomas y soluciones

| Síntoma | Causa probable | Solución |
|---|---|---|
| `401 Unauthorized` en todas las requests | Token JWT expirado o realm sin configurar | Re-ejecutar `setup-keycloak.ps1`; pedir token nuevo |
| Health del backend dice DOWN por Redis | Redis no levantado o port mismatch | `docker compose up -d redis` (si no está, el endpoint sigue funcionando para REST, sólo afecta cache) |
| `NoSuchBucketException` al guardar entrega | Bucket S3 no creado en LocalStack | §3.6 — `awslocal s3 mb s3://ecoroute-proofs` |
| `QueueDoesNotExistException` al guardar entrega | Cola SQS no creada | §3.6 — `awslocal sqs create-queue --queue-name ecoroute-notifications` |
| Toast rojo en la app: "Fallo de red al subir evidencia" | Backend devolvió 500 al `POST /delivery-proofs` | Revisar logs del backend (`docker logs ecoroute-backend`) buscando S3 o SQS errors; aplicar §3.6 |
| App móvil compila pero no se conecta al backend | URL del backend errónea | Editar `mobile-app/lib/core/config/api_config.dart` para que apunte a `10.0.2.2:8081` en emulador |
| Emulador no detectado por `adb devices` | adb daemon muerto | `adb kill-server && adb start-server` |
| Migraciones Flyway fallan | Schema modificado manualmente | `docker exec ecoroute-db psql -U user -c "DROP DATABASE ecoroute"` y recrear |
| Captura PNG bloquea el pipeline con "image exceeds 2000px" | Estás haciendo `Read` directo de la imagen original | Usar **siempre** `safe_capture.py` y leer sólo `*_thumb.png` |
| Flutter no compila | Versiones SDK incompatibles | `flutter clean && flutter pub get && flutter pub upgrade` |
| GPS no actualiza en el panel | WebSocket cerrado | F12 → consola → reconectar; revisar logs del backend |
| `gh release create` falla con "workflow scope required" | Token gh sin permisos en este repo | Subir manualmente desde la web de GitHub |

### 8.2 Logs útiles

```powershell
docker logs ecoroute-backend --tail 100
docker logs ecoroute-db --tail 50
docker logs ecoroute-keycloak --tail 50
docker logs ecoroute-localstack --tail 50
adb logcat *:E   # errores del emulador
```

### 8.3 Reset total

Si todo se rompió y necesitás volver al estado inicial:

```powershell
docker compose down -v        # tira contenedores Y volúmenes
docker compose up -d
./setup-keycloak.ps1
docker cp schema.sql ecoroute-db:/schema.sql
docker cp micotrans_seed_complete.sql ecoroute-db:/seed.sql
docker exec ecoroute-db psql -U user -d ecoroute -f /schema.sql
docker exec ecoroute-db psql -U user -d ecoroute -f /seed.sql
docker exec ecoroute-localstack awslocal s3 mb s3://ecoroute-proofs
docker exec ecoroute-localstack awslocal sqs create-queue --queue-name ecoroute-notifications
```

---

## 9. Seguridad (resumen para defensa)

| Aspecto | Implementación |
|---|---|
| Auth | OAuth2 / OIDC vía Keycloak (no se reinventa) |
| Tokens | JWT firmados, expiración corta (5 min) + refresh |
| Autorización | RBAC por endpoint en `SecurityConfig.java` |
| Rate limiting | Bucket4j en `RateLimitFilter` |
| SQL injection | R2DBC parametrizado, sin concatenación |
| CORS | Restringido a `localhost:3000` en dev |
| Validación input | Bean Validation (`@Valid`) |
| Secretos en código | Cero — Keycloak los gestiona |
| HTTPS | Obligatorio en prod (Let's Encrypt / ACM) |

---

## 10. Observabilidad

| Endpoint | Para qué |
|---|---|
| `GET /actuator/health` | Healthcheck (probe de Kubernetes) |
| `GET /actuator/prometheus` | Métricas en formato Prometheus |
| `GET /actuator/info` | Info de build |
| `GET /v3/api-docs` | OpenAPI JSON |
| `GET /swagger-ui.html` | UI Swagger interactiva |

---

## 11. Despliegue en producción (referencia para Cap. VI Recomendaciones)

| Componente | Sustituir LocalStack por… | Notas |
|---|---|---|
| Storage | AWS S3 real, bucket versionado + replicación cross-region | Para fotos/firmas (datos sensibles del cliente) |
| Cola | AWS SQS managed | Dead-letter queue para reintentos |
| BD | AWS RDS PostgreSQL Multi-AZ | Snapshots diarios automáticos |
| Auth | Keycloak en ECS Fargate o Cognito | Con SSL terminado en ALB |
| Backend | ECS Fargate o EKS | 2-3 tasks atrás de ALB |
| Frontend | CloudFront + S3 | Cache largo, invalidación en deploy |
| CI/CD | GitHub Actions | Build → test → push image → deploy |
| Monitoreo | CloudWatch + Grafana | Logs centralizados, dashboards |
| App móvil | Play Store (Android) + App Store (iOS) | Code signing |

---

## 12. Contacto

**Desarrollador principal:** Campos Vargas Kevin Stip
**ORCID:** 0000-0002-6087-3626
**Repositorio:** `git@github.com:devnicogit/Proyecto-Integrador-Desarrollo-de-Software-3.git`
**Documentación adicional:** [README_ENTREGABLES.md](README_ENTREGABLES.md), [Anexo_8_Metodologia.md](Anexo_8_Metodologia.md), [Manual_Usuario.md](Manual_Usuario.md).

---

> Este manual complementa el código fuente. Para detalles de implementación, ver comentarios en código y tests en `src/test/`. Si algo falla, primero §8 Troubleshooting.
