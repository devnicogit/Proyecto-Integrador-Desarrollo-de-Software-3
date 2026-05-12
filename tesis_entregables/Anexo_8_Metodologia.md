# Anexo 8: Metodología aplicada para el desarrollo del sistema

## Metodología Scrum

**Aplicativo móvil para la gestión administrativa en empresa de transporte de carga en el distrito de Puente Piedra Lima 2025**

Autor: Campos Vargas Kevin Stip (orcid.org/0000-0002-6087-3626)
Empresa: Grupo Micotrans S.A.C.

---

## ÍNDICE

- Capítulo I: Inicio
- Capítulo II: Planificación del Proyecto
- Capítulo III: Ejecución del Proyecto
- Capítulo IV: Programación
- Capítulo V: Pruebas de Calidad de Software

---

## CAPÍTULO I: INICIO

### 1.1 Identificación de las Necesidades

La empresa **Grupo MICOTRANS S.A.C.**, dedicada al transporte de carga en el distrito de Puente Piedra, enfrentaba una serie de ineficiencias operativas en sus procesos administrativos. Pese a contar con conductores experimentados y una flota operativa, el uso de métodos manuales (anotaciones en cuadernos, llamadas telefónicas para confirmar entregas y archivos de papel para registrar evidencias) generaba:

- Registros incompletos o ilegibles de los servicios contratados (integridad de datos deficiente).
- Falta de visibilidad en tiempo real respecto al avance de las rutas asignadas a cada conductor (control de rutas tardío).
- Ausencia de evidencia digital uniforme respecto al receptor de la carga (cierre administrativo lento y disputas con el cliente).

Estas limitaciones impactaban negativamente en la competitividad de la empresa y su eficiencia operativa, debido a la inexistencia de herramientas digitales que optimizaran los procesos internos.

### 1.2 Elicitación de Requisitos

#### Tabla 1. Requerimientos funcionales del sistema

| # | Requerimiento Funcional (RF) |
|---|---|
| RF01 | Permitir acceder al sistema mediante credenciales gestionadas por un proveedor de identidad (Keycloak), con roles ADMIN, DISPATCHER y DRIVER. |
| RF02 | Validar credenciales y campos antes de enviar la solicitud de autenticación; mostrar mensaje de error sin revelar información sensible. |
| RF03 | Permitir el acceso al panel administrativo web únicamente a usuarios con rol ADMIN. |
| RF04 | Permitir visualizar un dashboard administrativo con KPIs operativos y de gestión administrativa (IID, CHR, TDE). |
| RF05 | Permitir a los administradores registrar, editar y eliminar conductores, vehículos y rutas. |
| RF06 | Permitir crear rutas asignando pedidos, conductor y vehículo. |
| RF07 | Permitir al conductor recibir su hoja de ruta y los pedidos asignados en la aplicación móvil. |
| RF08 | Permitir al conductor actualizar el estado de cada pedido (PENDING → IN_TRANSIT → DELIVERED) desde la app móvil. |
| RF09 | Capturar evidencia digital de entrega (fotografía y firma) en la aplicación móvil y almacenarla en la nube (S3). |
| RF10 | Transmitir la posición GPS del vehículo del conductor en tiempo real al panel administrativo (WebSocket). |
| RF11 | Generar y descargar reportes en CSV y PDF con el formato de ficha de registro del Anexo 2. |
| RF12 | Calcular automáticamente los indicadores IID, CHR y TDE para cualquier rango de fechas. |
| RF13 | Permitir la operación offline del conductor con sincronización al recuperar conectividad. |

#### Tabla 2. Requerimientos no funcionales del sistema

| # | Requerimiento No Funcional (RNF) |
|---|---|
| RNF01 | Disponibilidad 24/7 del backend (excluyendo ventanas de mantenimiento). |
| RNF02 | Tiempo de respuesta menor a 3 segundos para operaciones comunes. |
| RNF03 | Escalabilidad: el sistema debe soportar el incremento de conductores, vehículos y pedidos sin degradación. |
| RNF04 | Usabilidad: interfaz intuitiva, responsiva y adaptable a múltiples resoluciones. |
| RNF05 | Seguridad: autenticación OAuth2/OIDC con JWT, autorización por rol, rate limiting en endpoints públicos. |
| RNF06 | Integridad: uso de transacciones reactivas R2DBC y manejo de excepciones centralizado. |
| RNF07 | Mantenibilidad: arquitectura hexagonal (Ports & Adapters) que desacopla dominio de infraestructura. |
| RNF08 | Observabilidad: métricas Prometheus, healthchecks Actuator y trazas. |
| RNF09 | Resiliencia: Circuit Breaker y Retry (Resilience4j) en llamadas a servicios externos (S3, SQS, SNS). |

### 1.3 Propuesta de Solución

Se desarrolló una **solución tecnológica integral** denominada **EcoRoute** compuesta por:

1. **Aplicativo móvil multiplataforma (Flutter)** para conductores: registro de pedidos, captura de evidencia (foto + firma), GPS continuo, modo offline.
2. **Panel administrativo web (React + TypeScript)** para administradores y dispatchers: gestión de conductores, vehículos, rutas y pedidos; dashboard con KPIs en tiempo real; exportación de fichas.
3. **Backend reactivo (Spring Boot WebFlux)** con arquitectura hexagonal: API REST + WebSocket, autenticación delegada a Keycloak, persistencia en PostgreSQL vía R2DBC.

Esta arquitectura garantiza **escalabilidad, mantenibilidad e independencia tecnológica** sin la complejidad operativa de microservicios, lo que es apropiado para una pyme. El aplicativo móvil es la herramienta central que utilizan los conductores para digitalizar los procesos en campo en tiempo real, eliminando el registro manual y mejorando la trazabilidad de las entregas.

---

## CAPÍTULO II: PLANIFICACIÓN DEL PROYECTO

### 2.1 Enfoque de Gestión del Proyecto

#### 2.1.1 Justificación del enfoque a aplicar

Se aplicó **Scrum** como marco de trabajo ágil debido a:

- Requerimientos cambiantes durante la elicitación con los conductores y el área administrativa de MICOTRANS.
- Necesidad de entregas incrementales para validar tempranamente con el cliente.
- Equipo reducido (un desarrollador full-stack) con ciclos cortos de feedback.

#### 2.1.2 Arquitectura del software

El sistema se construyó sobre **Arquitectura Hexagonal (Ports & Adapters)** combinada con **arquitectura en capas**:

- **Capa de Dominio** (`com.ecoroute.backend.domain`): entidades de negocio (Order, Route, Driver, Vehicle, DeliveryProof, VehicleGpsHistory) y puertos (interfaces).
- **Capa de Aplicación** (`com.ecoroute.backend.application`): casos de uso e implementaciones (OrderUseCases, RouteUseCases, KpiReportService, etc.).
- **Capa de Infraestructura** (`com.ecoroute.backend.infrastructure`):
  - **Adaptadores de entrada**: controladores REST (Spring WebFlux) y handlers WebSocket.
  - **Adaptadores de salida**: repositorios R2DBC, clientes AWS S3/SQS, etc.

Esta arquitectura garantiza:

- **Escalabilidad** mediante stack reactivo (Spring WebFlux + R2DBC) que maneja miles de conexiones concurrentes con pocos hilos.
- **Alta mantenibilidad**: los cambios de infraestructura (BD, almacenamiento) no afectan el dominio.
- **Bajo acoplamiento** entre capas (todas las dependencias apuntan al dominio).
- **Facilidad para pruebas unitarias**: el dominio se prueba sin levantar Spring.

#### 2.1.3 Modelos y artefactos a aplicar

**Modelos:**
- Modelo de Negocio (Canvas)
- Modelo de Requerimientos (Historias de Usuario)
- Diagramas UML: Casos de uso, Secuencia, Componentes
- Modelo Entidad–Relación (13 tablas)
- Modelo de Arquitectura Hexagonal

**Artefactos Scrum:**
- Product Backlog
- Sprint Backlog
- Incremento de Producto
- Burndown Chart

**Artefactos Técnicos:**
- Documento de Arquitectura
- Prototipos UI/UX
- Plan de Pruebas
- Casos de prueba

### 2.2 Planificación del Proyecto

#### 2.2.1 Enunciado del alcance

**Dentro del alcance:**
- Back-office web para gestión de pedidos, rutas, conductores, vehículos, compras, usuarios y monitoreo GPS.
- Aplicativo móvil multiplataforma (Android/iOS) para conductores con captura de evidencia y firma digital.
- API REST reactiva y segura.
- Cálculo automático de KPIs IID, CHR y TDE con exportación a CSV/PDF.
- Despliegue local con Docker Compose (PostgreSQL, Keycloak, LocalStack).

**Fuera del alcance:**
- Compra de hardware GPS dedicado.
- Integración con sistemas ERP/SAP externos.
- Integración con sistemas de contabilidad profundos.
- Hardware (dispositivos móviles), provistos por la empresa.

#### 2.2.2 Objetivos del proyecto

1. Digitalizar el registro de pedidos y la planeación de servicios (RF01–RF06).
2. Habilitar el control y monitoreo en tiempo real de las rutas asignadas (RF07–RF10).
3. Automatizar la evaluación y cierre administrativo mediante evidencias digitales (RF09, RF11–RF12).

---

## CAPÍTULO III: EJECUCIÓN DEL PROYECTO

### 3.1 Fase Inicio

#### 3.1.1 Historias de Usuario (HU)

#### Tabla 20. Historias de usuario

| ID | Descripción |
|---|---|
| HU01 | Como usuario quiero iniciar sesión con credenciales seguras para acceder al sistema según mi rol. |
| HU02 | Como administrador quiero registrar y gestionar conductores para asignarlos a rutas. |
| HU03 | Como administrador quiero registrar y gestionar vehículos para su uso en entregas. |
| HU04 | Como administrador quiero registrar pedidos para que puedan ser gestionados en el sistema. |
| HU05 | Como planificador quiero crear rutas asignando pedidos, conductor y vehículo para optimizar entregas. |
| HU06 | Como conductor quiero ver mi hoja de ruta y mis pedidos asignados en la app móvil. |
| HU07 | Como conductor quiero actualizar el estado de los pedidos (pendiente, en tránsito, entregado) desde la app. |
| HU08 | Como conductor quiero capturar evidencia digital (foto + firma) al entregar un pedido. |
| HU09 | Como administrador quiero visualizar en tiempo real la ubicación GPS de mis vehículos en el mapa. |
| HU10 | Como administrador quiero visualizar reportes con los indicadores IID, CHR y TDE filtrables por fecha. |
| HU11 | Como administrador quiero exportar las fichas de los KPIs en formato CSV y PDF. |

### 3.2 Fase Planificación

#### 3.2.1 EDT / Historias priorizadas

#### Tabla 22. Priorización MoSCoW

| Sprint | ID | Historia | Estimado (SP) | MoSCoW |
|---|---|---|---|---|
| Sprint 1 | HU01 | Autenticación con Keycloak | 7 | M (Must) |
| Sprint 1 | HU02 | Gestión de conductores | 5 | M (Must) |
| Sprint 1 | HU03 | Gestión de vehículos | 5 | M (Must) |
| Sprint 2 | HU04 | Registro de pedidos | 7 | M (Must) |
| Sprint 2 | HU05 | Planificación de rutas | 8 | M (Must) |
| Sprint 3 | HU06 | Hoja de ruta en app móvil | 5 | M (Must) |
| Sprint 3 | HU07 | Actualización de estado del pedido | 5 | M (Must) |
| Sprint 3 | HU08 | Captura de evidencia (foto + firma) | 7 | M (Must) |
| Sprint 4 | HU09 | Monitoreo GPS en tiempo real | 7 | M (Must) |
| Sprint 4 | HU10 | Dashboard de KPIs (IID, CHR, TDE) | 7 | M (Must) |
| Sprint 4 | HU11 | Exportación de fichas CSV/PDF | 5 | S (Should) |

#### 3.2.2 Estimación Sprint Backlog

**Sprint 1 — Fundación y Seguridad (2 semanas)**
- Configuración Keycloak (realm, client, roles ADMIN/DRIVER/DISPATCHER).
- CRUD conductores (Spring + R2DBC + React).
- CRUD vehículos.
- Configuración Docker Compose (Postgres, Keycloak, LocalStack).

**Sprint 2 — Núcleo de Negocio (2 semanas)**
- CRUD pedidos con validaciones de integridad.
- Creación de rutas y asignación de pedidos/conductor/vehículo.
- Mapa de visualización con ruta óptima (polyline).

**Sprint 3 — App Móvil del Conductor (2 semanas)**
- Login en Flutter con OIDC.
- Pantalla de rutas y pedidos asignados.
- Actualización de estado del pedido.
- Cámara para fotografía de evidencia.
- Pad de firma digital.
- Subida a S3 (LocalStack).
- Modo offline con caché local y sincronización.

**Sprint 4 — Observabilidad y Reportes (2 semanas)**
- WebSocket para streaming GPS.
- Dashboard de KPIs IID, CHR, TDE en el panel web.
- Endpoints de cálculo de KPIs en backend (queries R2DBC).
- Exportación CSV y PDF en formato ficha (OpenPDF).
- Notificaciones (SNS/SQS) y módulo de compras.

#### 3.2.3 Cronograma

| Sprint | Duración | Funcionalidades |
|---|---|---|
| Sprint 1 | 2 semanas | Login, conductores, vehículos |
| Sprint 2 | 2 semanas | Pedidos, rutas, mapa |
| Sprint 3 | 2 semanas | App móvil: estado, foto, firma, offline |
| Sprint 4 | 2 semanas | GPS, KPIs, reportes, notificaciones |

### 3.3 Fase Ejecución

#### 3.3.1 Seguimiento y validación de sprints

#### Tabla 28. Seguimiento

| Sprint | SP Planificados | SP Ejecutados | % Cumplimiento | Observaciones |
|---|---|---|---|---|
| Sprint 1 | 17 | 17 | 100% | Sin inconvenientes; base estable. |
| Sprint 2 | 15 | 15 | 100% | Validaciones de integridad de orden refinadas tras revisión. |
| Sprint 3 | 17 | 16 | 94% | Sincronización offline trasladó 1 SP al Sprint 4. |
| Sprint 4 | 19 | 20 | 105% | Incluyó el SP movido del Sprint 3 y export PDF de ficha. |

#### 3.3.2 Pruebas de Ejecución

Se ejecutaron pruebas de cada sprint review con el cliente (área administrativa de MICOTRANS) sobre un ambiente Docker local. Se validaron:

- Inicio de sesión con los tres roles.
- Flujo end-to-end: pedido creado en web → asignado a ruta → conductor lo recibe en app → cambia estados → captura evidencia → administrador ve KPI actualizado.
- Reportes IID, CHR y TDE generados sobre datos reales del ambiente.

### 3.4 Fase Transición y Cierre

#### 3.4.1 Lecciones aprendidas

**Buenas prácticas:**
- Uso de stack reactivo (WebFlux + R2DBC) facilitó el streaming GPS.
- Decisión de delegar autenticación a Keycloak ahorró ~2 sprints de seguridad.
- LocalStack permitió desarrollar contra S3/SQS sin costo.
- Flutter dio cobertura iOS+Android desde un solo código base.

**Áreas de mejora:**
- Refinamiento inicial de los KPIs IID/CHR/TDE: tuvieron que reajustarse las consultas SQL tras revisar fichas del Anexo 2.
- Sincronización offline fue subestimada en el Sprint 3.

#### 3.4.2 Conformidad de entregables

| Entregable | Estado |
|---|---|
| Backend Spring Boot reactivo (`/api/...`) | Entregado |
| Panel administrativo web (React + Vite + TS) | Entregado |
| Aplicativo móvil Flutter | Entregado |
| Esquema PostgreSQL consolidado (13 tablas) | Entregado |
| Dashboard de KPIs IID/CHR/TDE | Entregado |
| Endpoints de exportación CSV/PDF | Entregado |
| Seed de datos MICOTRANS (pre-test y post-test) | Entregado |
| Manual de despliegue (`README.md`, `GUIA_COMPLETA.md`) | Entregado |
| Configuración Docker Compose | Entregado |

---

## CAPÍTULO IV: PROGRAMACIÓN

### 4.1 Implementación de la Arquitectura de Software

Se implementó arquitectura basada en:

- **Arquitectura Hexagonal (Ports & Adapters)**
- **Arquitectura en capas** dentro de cada bounded context
- **Backend reactivo con Spring WebFlux** (Project Reactor)
- **Persistencia reactiva R2DBC sobre PostgreSQL 14**
- **Frontend desacoplado**: SPA en React 18 + Vite + TypeScript
- **Aplicativo móvil**: Flutter 3.x con arquitectura Clean (BLoC) — capas data/domain/presentation
- **Autenticación**: OAuth2/OIDC con Keycloak 23
- **Almacenamiento de evidencias**: AWS S3 (LocalStack en desarrollo)
- **Mensajería**: AWS SQS/SNS para notificaciones (LocalStack en desarrollo)
- **Resiliencia**: Resilience4j (Circuit Breaker, Retry)
- **Observabilidad**: Spring Actuator + Micrometer Prometheus
- **Migraciones**: Flyway
- **Documentación de API**: Springdoc OpenAPI 3
- **Generación PDF**: OpenPDF
- **WebSocket**: Spring WebFlux para streaming GPS bidireccional

### 4.2 Creación de la Base de Datos

Se diseñó un esquema empresarial consolidado de 13 tablas:

1. `hubs` — Almacenes/centros de distribución.
2. `drivers` — Conductores.
3. `vehicles` — Flota.
4. `routes` — Hojas de ruta diarias.
5. `orders` — Pedidos (núcleo del negocio).
6. `delivery_proofs` — Evidencias digitales (foto + firma + DNI receptor).
7. `vehicle_gps_history` — Histórico GPS por vehículo.
8. `products`, `order_items` — Catálogo y detalles de pedido.
9. `vehicle_maintenance_logs`, `fuel_logs` — Mantenimiento y combustible.
10. `route_expenses`, `incidents` — Finanzas y siniestros.
11. `driver_contracts`, `driver_shifts` — Recursos humanos.
12. `order_status_history` — Auditoría completa de cambios de estado.

Incluye índices sobre `orders(tracking_number)`, `orders(route_id)`, `orders(status)`, `vehicle_gps_history(vehicle_id, ping_time DESC)`, entre otros.

### 4.3 Implementación de Librerías y Dependencias

Ver `build.gradle` (backend), `web-admin/package.json` (frontend) y `mobile-app/pubspec.yaml` (móvil). Stack resumido:

- **Backend**: Spring Boot 3.5, Spring Security OAuth2, Reactor, R2DBC PostgreSQL, AWS SDK v2.25, Resilience4j 2.2, OpenPDF 1.3, Lombok, MapStruct.
- **Web**: React 18, Vite, TypeScript, React Router, Chart.js 4, react-chartjs-2, Lucide Icons, Axios.
- **Móvil**: Flutter 3.x, flutter_bloc, get_it, dio, geolocator, signature, hive (cache offline), flutter_secure_storage.

### 4.4 Codificación del Backend

Componentes principales:

- `KpiReportService` (cálculo IID, CHR, TDE).
- `KpiFichaExportService` (export CSV/PDF en formato Anexo 2).
- `DashboardService` (métricas operativas).
- `PdfService` (comprobante de entrega).
- `S3Service` (subida de evidencias).
- `NotificationService` (SNS/SQS).
- `GpsWebSocketHandler` (streaming GPS).
- Casos de uso: `OrderUseCasesImpl`, `RouteUseCasesImpl`, `DriverUseCasesImpl`, `VehicleUseCasesImpl`, `CreateDeliveryProofUseCaseImpl`, etc.

### 4.5 Codificación del Frontend

Componentes principales:

- `ThesisKpis.tsx` — Dashboard de IID, CHR, TDE con gráficos comparativos Pre/Post y exportación.
- `Charts.tsx` — Gráficas operativas (Bar, Pie).
- `Pagination.tsx`, `ProtectedRoute.tsx`, `Sidebar.tsx`, `NotificationPanel.tsx`.
- `TrackingMap.tsx` — Mapa con polyline de ruta y posición GPS en vivo.
- `AuthContext.tsx` — Contexto de autenticación con Keycloak.
- Páginas: `Dashboard`, `Drivers`, `Vehicles`, `Routes`, `Orders`, `Purchases`, `Reports`, `Users`, `Login`.

### 4.6 Codificación de Consultas y Reportes

Endpoints REST:

| Endpoint | Método | Descripción |
|---|---|---|
| `/reports/kpi/iid?startDate=&endDate=` | GET | Devuelve IID por día y total agregado. |
| `/reports/kpi/chr?startDate=&endDate=` | GET | Devuelve CHR por día y total agregado. |
| `/reports/kpi/tde?startDate=&endDate=` | GET | Devuelve TDE por día y total agregado. |
| `/reports/kpi/{iid,chr,tde}/csv` | GET | Exporta ficha CSV (formato Anexo 2). |
| `/reports/kpi/{iid,chr,tde}/pdf` | GET | Exporta ficha PDF (formato Anexo 2). |
| `/reports/orders-summary` | GET | Estadísticas operativas. |
| `/reports/driver-performance` | GET | Desempeño por conductor. |
| `/reports/route-efficiency` | GET | Eficiencia por distrito/ruta. |

### 4.7 Codificación de Mantenedores (CRUD) y Procesos Transaccionales

CRUDs completos para `drivers`, `vehicles`, `routes`, `orders`, `purchases`, `users`, `notifications`. Procesos transaccionales clave:

- `createOrder` con validación de integridad (todos los campos críticos no nulos).
- `updateOrderStatus` con escritura inmutable en `order_status_history`.
- `createDeliveryProof` con subida atómica a S3 + insert en `delivery_proofs`.
- Streaming GPS continuo a `vehicle_gps_history` vía WebSocket.

---

## CAPÍTULO V: PRUEBAS DE CALIDAD DE SOFTWARE

### 5.1 Pruebas Unitarias

Se ejecutaron pruebas unitarias para cada caso de uso y servicio crítico. Se usó:

- **JUnit 5** + **Reactor Test** (`StepVerifier`) para flujos reactivos.
- **Mockito** para aislamiento de dependencias.
- **AssertJ** para aserciones fluidas.
- **Spring Security Test** para validar autorización por rol.

Pruebas representativas:

- Cálculo de IID, CHR y TDE con datasets controlados (verificación matemática).
- Validación de integridad de orden (rechazo si faltan campos críticos).
- Transiciones válidas e inválidas del estado del pedido.
- Generación correcta del PDF de ficha.

### 5.2 Pruebas Integrales

Se ejecutaron pruebas de integración con:

- **Testcontainers** (PostgreSQL real ephemeral).
- **R2DBC H2** para tests rápidos.

Se validó:

- Anotación `@Transactional` garantiza rollback en errores de operaciones multi-entidad.
- Manejo global de excepciones (`ResourceNotFoundException` y mappers) devuelve estructura uniforme al frontend.
- Endpoints REST cubiertos con `WebTestClient`.
- Autorización por rol con tokens mock.

---

**Fin del Anexo 8**
