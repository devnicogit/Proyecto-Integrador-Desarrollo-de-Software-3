# Checklist de Capturas de Pantalla para la Tesis

Esta guía detalla **qué capturar, desde dónde y cómo encuadrarla** para cada figura referenciada en el cuerpo de la tesis y en el Anexo 8. Las capturas deben tomarse del sistema **ya cargado con el seed `micotrans_seed_complete.sql`** para mostrar datos reales/coherentes de MICOTRANS.

## Preparación previa

1. Levantar el sistema completo:
   ```powershell
   docker-compose up -d
   ./setup-keycloak.ps1
   docker cp schema.sql ecoroute-db:/schema.sql
   docker cp micotrans_seed_complete.sql ecoroute-db:/seed.sql
   docker exec ecoroute-db psql -U user -d ecoroute -f /schema.sql
   docker exec ecoroute-db psql -U user -d ecoroute -f /seed.sql
   ./gradlew.bat bootRun --args="--spring.profiles.active=local"
   ```
2. En otra terminal:
   ```powershell
   cd web-admin
   npm run dev
   ```
3. Abrir Chrome en modo ventana (no maximizado) a **1366×768** para uniformidad de capturas.
4. Para capturar usar **Win + Shift + S** (Snip & Sketch) o **Greenshot** (recomendado).
5. Guardar todas las capturas en `tesis_entregables/figuras/` con nombre `figura_NN_descripcion.png`.

---

## Capturas del Panel Administrativo Web (Figuras 20–47)

| # | Figura | Ruta / Pantalla | Acción a capturar | Observaciones |
|---|---|---|---|---|
| **F20** | Interfaz de Login | `http://localhost:3000/login` | Mostrar formulario con campos email/password + logo EcoRoute | Pantalla limpia, sin mensajes de error |
| **F21** | Panel principal (Home) | `/home` después de login como admin | Cards de bienvenida + accesos rápidos | Captura completa |
| **F22** | Dashboard Logístico | `/dashboard` | Vista con KPIs operativos + gráficos | Datos cargados del post-test |
| **F23** | Gestión de Pedidos | `/orders` | Tabla de pedidos con filtros, paginación visible | Mostrar al menos 10 pedidos |
| **F24** | Planificación y Seguimiento de Rutas | `/routes` | Lista de rutas + mapa con polilínea | Seleccionar una ruta del post-test |
| **F25** | Gestión de Conductores | `/drivers` | Tabla de los 5 conductores MICOTRANS | Captura completa |
| **F26** | Gestión de Vehículos | `/vehicles` | Tabla de los 5 vehículos (placas AFT-101 a AFT-105) | Captura completa |
| **F27** | Tablero Kanban (Scrum) | Generar en Trello / Notion / Miro | Columnas: Backlog, To Do, In Progress, Done | Crear manualmente como dibujo |
| **F28** | Burndown Chart | Excel / Google Sheets | Gráfico de horas restantes por sprint (4 sprints) | Ver datos en `Anexo_8_Tablas_Scrum.md` |
| **F29** | Código DashboardService.java | IDE (VS Code / IntelliJ) | Abrir `src/main/java/com/ecoroute/backend/application/services/DashboardService.java` | Mostrar las primeras 40 líneas |
| **F30** | Código NotificationService.java | IDE | Abrir `NotificationService.java` | 40 líneas |
| **F31** | Código PdfService.java | IDE | Abrir `PdfService.java` | 40 líneas |
| **F32** | Código S3Service.java | IDE | Abrir `S3Service.java` | 40 líneas |
| **F33** | Componente Charts.tsx | IDE | Abrir `web-admin/src/components/Charts.tsx` | 40 líneas |
| **F34** | Componente Pagination.tsx | IDE | Abrir `Pagination.tsx` | Mostrar el componente |
| **F35** | Componente ProtectedRoute.tsx | IDE | Abrir `ProtectedRoute.tsx` | Mostrar el componente |
| **F36** | Componente Sidebar.tsx | IDE | Abrir `Sidebar.tsx` | Mostrar el componente |
| **F37** | Componente TrackingMap.tsx | IDE | Abrir `TrackingMap.tsx` | Mostrar el inicio del componente |
| **F38** | AuthContext.tsx | IDE | Abrir `web-admin/src/context/AuthContext.tsx` | Mostrar provider y hook |
| **F39** | Página Dashboard.tsx en ejecución | `/dashboard` en navegador | Captura completa con datos | Igual que F22 pero ángulo distinto |
| **F40** | Página Drivers.tsx en ejecución | `/drivers` | Captura mostrando los 5 conductores | |
| **F41** | Página Home.tsx en ejecución | `/home` | Captura inicial | |
| **F42** | Prueba de Cálculo (test unitario) | IDE | Abrir `src/test/.../KpiReportServiceTest.java` | Mostrar test que valida cálculo IID |
| **F43** | Prueba de Implementación | IDE | Test del Controller | |
| **F44** | Prueba de Trazabilidad | IDE | Test que valida order_status_history | |
| **F45** | Prueba Integral Controladores | IDE | Test de integración WebTestClient | |
| **F46** | Prueba lógica paginando | IDE | Test de paginación | |
| **F47** ⭐ | **KPI Dashboard de Tesis** | `/reports` → tab "KPIs de Gestión Administrativa (Tesis)" | **Vista comparativa Pre vs Post con los 3 KPIs y gráfico** | **LA MÁS IMPORTANTE — esta es la prueba visual de los resultados** |

## Capturas de la App Móvil Flutter (figuras adicionales)

| # | Figura | Pantalla | Acción a capturar |
|---|---|---|---|
| **FM1** | Login móvil | Pantalla de login Flutter | Capturar con `flutter screenshot` o emulador |
| **FM2** | Lista de pedidos del conductor | Después de login con `conductor` | Mostrar pedidos asignados a la ruta del día |
| **FM3** | Detalle de pedido | Tap sobre un pedido | Mostrar estado actual y botones de transición |
| **FM4** | Captura de foto de evidencia | Tap en "Tomar foto" | Vista de cámara o foto capturada |
| **FM5** | Pad de firma digital | Pantalla de firma | Mostrar firma con trazo visible |
| **FM6** | Confirmación de entrega | Después de guardar evidencia | Mensaje de éxito |
| **FM7** | Mapa GPS con ruta óptima | Pantalla de mapa | Polilínea visible + puntos de entrega |
| **FM8** | Modo oscuro | Activar dark mode desde settings | Misma pantalla de pedidos pero en oscuro |

## Capturas de Infraestructura (opcionales pero útiles)

| # | Captura | Comando / Vista |
|---|---|---|
| FI1 | Docker Desktop con contenedores corriendo | Captura de Docker Desktop con `ecoroute-db`, `ecoroute-keycloak`, `ecoroute-localstack`, `ecoroute-backend` activos |
| FI2 | Keycloak Admin Console | `http://localhost:8080/admin` → realm `ecoroute` → users |
| FI3 | Swagger / OpenAPI UI | `http://localhost:8081/swagger-ui.html` — lista de endpoints |
| FI4 | DBeaver mostrando tablas | Vista del esquema con 13 tablas y conteos |
| FI5 | Métricas Prometheus / Actuator | `http://localhost:8081/actuator/metrics` |

## Capturas para Cap. III (Resultados)

| # | Captura | Procedimiento |
|---|---|---|
| **FR1** | Ficha PDF exportada — IID Pre-Test | Desde el dashboard, descargar `iid_pre-test.pdf` y capturar la primera página |
| **FR2** | Ficha PDF exportada — IID Post-Test | Descargar `iid_post-test.pdf` y capturar |
| **FR3** | Ficha PDF exportada — CHR Pre/Post | Idem para CHR |
| **FR4** | Ficha PDF exportada — TDE Pre/Post | Idem para TDE |
| **FR5** | Gráfico comparativo (mismo que F47, recorte solo del gráfico) | Recortar el Bar chart Pre vs Post |
| **FR6** | Tabla de Pearson en Excel | Capturar `Anexo_2_Cuestionario_Analisis.xlsx` (generado con script) |
| **FR7** | Output del test t-Student | Captura de la salida de `analisis_estadistico.py` |

---

## Consejos generales

- **Tema claro**: usar siempre tema claro del navegador para legibilidad en impresión.
- **Datos reales**: no usar la captura del estado inicial vacío — siempre tras cargar el seed.
- **Resolución**: 1920×1080 si es Full HD, 1366×768 si pantalla típica. Mantener consistencia.
- **Privacidad**: ocultar (con difuminado o cuadro negro) cualquier dato sensible (correos personales reales, números de celular reales).
- **Numeración**: respetar la numeración de figuras del documento original.
- **Calidad**: exportar a PNG (no JPG) para evitar artefactos.

---

> **Tip:** Una vez tomadas todas las capturas, insertarlas en el documento Word de la tesis usando la opción "Insertar → Imagen". Centrarlas, agregar un caption "Figura N°XX: descripción" debajo y referenciarlas desde el cuerpo del texto.
