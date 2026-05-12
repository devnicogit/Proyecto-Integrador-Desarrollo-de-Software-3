# Manual Técnico — Sistema EcoRoute

**Para:** Desarrolladores, administradores de sistemas, equipo TI de MICOTRANS.
**Versión:** 1.0 — Mayo 2026

---

## 1. Arquitectura General

EcoRoute es un sistema **distribuido en 3 componentes principales** + **infraestructura Docker**:

```
┌────────────────────┐   ┌────────────────────┐
│  Web Admin (React) │   │ Mobile App (Flutter)│
│   localhost:3000   │   │  Android / iOS      │
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

### 1.1 Stack Tecnológico

| Capa | Tecnología | Versión |
|---|---|---|
| Backend lenguaje | Java | 17 |
| Backend framework | Spring Boot WebFlux | 3.5 |
| Persistencia | R2DBC PostgreSQL | reactivo |
| BD | PostgreSQL | 14 |
| Autenticación | Keycloak | 23 |
| Migraciones | Flyway | latest |
| Cache | Redis (Lettuce) | latest |
| Cloud storage | AWS S3 SDK v2.25 (LocalStack en dev) | 2.25 |
| Mensajería | AWS SQS/SNS | LocalStack |
| Resiliencia | Resilience4j | 2.2 |
| Web SPA | React + Vite + TypeScript | React 18 |
| Charts | Chart.js + react-chartjs-2 | 4.x |
| Mobile | Flutter + Dart | 3.x |
| State móvil | flutter_bloc | latest |
| Mapas | Google Maps Flutter | latest |

### 1.2 Patrones Arquitectónicos

- **Hexagonal (Ports & Adapters)**: dominio aislado de infraestructura.
- **Reactive Streams**: Mono/Flux en toda la cadena (Controller → UseCase → Repository).
- **Clean Architecture en móvil**: data / domain / presentation por feature.
- **CQRS ligero**: separación entre `Read` (queries reactivas) y `Write` (use cases).
- **Event sourcing parcial**: tabla `order_status_history` registra todos los cambios.

---

## 2. Estructura de Carpetas

```
proyecto-integrador/
├── src/                                  # Backend (Java)
│   ├── main/
│   │   ├── java/com/ecoroute/backend/
│   │   │   ├── domain/                   # Entidades + puertos
│   │   │   │   ├── model/
│   │   │   │   ├── ports/in/
│   │   │   │   └── ports/out/
│   │   │   ├── application/              # Use Cases + Services
│   │   │   │   ├── services/
│   │   │   │   └── usecases/
│   │   │   └── infrastructure/           # Adaptadores
│   │   │       ├── config/
│   │   │       ├── input/rest/
│   │   │       ├── input/websocket/
│   │   │       └── output/persistence/
│   │   └── resources/
│   │       ├── application.yml
│   │       ├── application-local.yml
│   │       ├── application-docker.yml
│   │       └── db/migration/             # Flyway
│   └── test/                             # JUnit + Reactor Test
│
├── web-admin/                            # Panel web React/TS
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/                     # API clients
│   │   ├── context/
│   │   └── styles/
│   └── package.json
│
├── mobile-app/                           # App móvil Flutter
│   ├── lib/
│   │   ├── core/                         # DI, theme, router, cache
│   │   ├── features/                     # auth, gps, orders, routes, history
│   │   └── main.dart
│   └── pubspec.yaml
│
├── infra/                                # Init scripts (LocalStack, etc.)
├── docker-compose.yml
├── schema.sql                            # Esquema BD 13 tablas
├── micotrans_seed_complete.sql           # Seed completo MICOTRANS
└── tesis_entregables/                    # Documentación tesis
```

---

## 3. Despliegue Local Paso a Paso

### 3.1 Prerrequisitos

| Software | Versión mínima |
|---|---|
| Docker Desktop | 4.x |
| Java JDK | 17 |
| Node.js | 18 |
| Flutter SDK | 3.x |
| Android Studio (con SDK 34) | 2024+ |
| Git | 2.x |

### 3.2 Clonar y levantar infraestructura

```powershell
git clone <REPO_URL>
cd "Proyecto Integrador Desarrollo de Software 3"
docker-compose up -d postgres keycloak localstack
```

Esperar 30 segundos a que Keycloak inicialice.

### 3.3 Configurar Keycloak

```powershell
./setup-keycloak.ps1
```

Esto crea:
- Realm `ecoroute`
- Client `mobile-app` (público, direct grants)
- Roles `ADMIN`, `DISPATCHER`, `DRIVER`
- Usuario `admin` / `admin123` (ADMIN)
- Usuario `conductor` / `conductor123` (DRIVER)

### 3.4 Cargar esquema y seed MICOTRANS

```powershell
docker cp schema.sql ecoroute-db:/schema.sql
docker cp micotrans_seed_complete.sql ecoroute-db:/seed.sql
docker exec ecoroute-db psql -U user -d ecoroute -f /schema.sql
docker exec ecoroute-db psql -U user -d ecoroute -f /seed.sql
```

### 3.5 Crear recursos LocalStack

```powershell
docker exec ecoroute-localstack awslocal s3 mb s3://ecoroute-proofs
docker exec ecoroute-localstack awslocal sqs create-queue --queue-name ecoroute-notifications
docker exec ecoroute-localstack awslocal sns create-topic --name ecoroute-alerts
```

### 3.6 Levantar backend

```powershell
./gradlew.bat bootRun --args="--spring.profiles.active=local"
```

Verificar:
- `curl http://localhost:8081/actuator/health` → `{"status":"UP"}`
- `http://localhost:8081/swagger-ui.html` → documentación OpenAPI

### 3.7 Levantar web admin

```powershell
cd web-admin
npm install
npm run dev
```

Abrir `http://localhost:3000`.

### 3.8 Levantar app móvil

```powershell
cd mobile-app
flutter pub get
flutter run -d <emulator_id>
```

---

## 4. Configuración

### 4.1 Variables de entorno principales

| Variable | Default | Propósito |
|---|---|---|
| `DB_HOST` | localhost | Host de PostgreSQL |
| `DB_PORT` | 5433 | Puerto PostgreSQL |
| `DB_NAME` | ecoroute | Nombre BD |
| `DB_USER` | user | Usuario BD |
| `DB_PASSWORD` | password | Password BD |
| `KEYCLOAK_ISSUER_URI` | http://localhost:8080/realms/ecoroute | Issuer JWT |
| `KEYCLOAK_JWK_SET_URI` | http://localhost:8080/realms/ecoroute/protocol/openid-connect/certs | JWKS URL |
| `AWS_ENDPOINT` | http://localhost:4566 | LocalStack endpoint |
| `AWS_REGION` | us-east-1 | Región AWS |

### 4.2 Perfiles Spring

- `local` — desarrollo local (Docker compose en localhost)
- `docker` — backend corre dentro de Docker (usa nombres de servicio)
- `prod` — producción (no incluido en este alcance)

---

## 5. API Endpoints Principales

### 5.1 Autenticación

`POST` al token endpoint de Keycloak para obtener JWT:
```
POST http://localhost:8080/realms/ecoroute/protocol/openid-connect/token
Content-Type: application/x-www-form-urlencoded

grant_type=password&client_id=mobile-app&username=admin&password=admin123
```

### 5.2 CRUDs (autenticados con Bearer JWT)

| Recurso | Endpoints |
|---|---|
| Conductores | `GET/POST /drivers`, `GET/PUT/DELETE /drivers/{id}` |
| Vehículos | `GET/POST /vehicles`, `GET/PUT/DELETE /vehicles/{id}` |
| Rutas | `GET/POST /routes`, `GET /routes/{id}`, `PATCH /routes/{id}/status` |
| Pedidos | `GET/POST /orders`, `GET /orders/{id}`, `PATCH /orders/{id}/status` |
| Evidencias | `POST /delivery-proofs` (multipart con imagen) |

### 5.3 KPIs de Tesis

| Endpoint | Descripción |
|---|---|
| `GET /reports/kpi/iid?startDate=&endDate=` | IID diario + total |
| `GET /reports/kpi/chr?startDate=&endDate=` | CHR diario + total |
| `GET /reports/kpi/tde?startDate=&endDate=` | TDE diario + total |
| `GET /reports/kpi/{ind}/csv?startDate=&endDate=&testType=` | Exporta CSV ficha |
| `GET /reports/kpi/{ind}/pdf?startDate=&endDate=&testType=` | Exporta PDF ficha |

### 5.4 GPS WebSocket

`WSS /ws/gps` — bidireccional. El conductor envía pings cada 5s, el panel recibe broadcasts.

---

## 6. Modelo de Datos

### 6.1 13 Tablas

Ver [schema.sql](../schema.sql) y diagrama E-R en [Diagramas_UML.md](Diagramas_UML.md#4-diagrama-entidad-relación-e-r).

Tablas principales:

- `hubs` — almacenes
- `drivers` — conductores
- `vehicles` — flota
- `routes` — hojas de ruta
- `orders` — pedidos (núcleo)
- `delivery_proofs` — evidencias
- `vehicle_gps_history` — GPS
- `order_status_history` — auditoría

### 6.2 Índices Críticos

```sql
CREATE INDEX idx_orders_tracking ON orders(tracking_number);
CREATE INDEX idx_orders_route ON orders(route_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_gps_history_vehicle ON vehicle_gps_history(vehicle_id, ping_time DESC);
```

### 6.3 Consultas de KPI (referencia para defensa)

```sql
-- IID (Integridad de Datos Registrados)
SELECT
    DATE(created_at) AS day,
    COUNT(*) AS total,
    COUNT(*) FILTER (
        WHERE external_reference IS NOT NULL AND external_reference <> ''
          AND recipient_name IS NOT NULL
          AND delivery_address IS NOT NULL
          AND latitude IS NOT NULL AND longitude IS NOT NULL
    ) AS valid
FROM orders
WHERE created_at BETWEEN :start AND :end
GROUP BY DATE(created_at);

-- CHR (Cumplimiento de Hoja de Ruta)
SELECT
    DATE(created_at) AS day,
    COUNT(*) AS programados,
    COUNT(*) FILTER (WHERE status = 'DELIVERED') AS entregados
FROM orders
WHERE route_id IS NOT NULL
  AND created_at BETWEEN :start AND :end
GROUP BY DATE(created_at);

-- TDE (Tasa de Disponibilidad de Evidencias)
SELECT
    DATE(o.created_at) AS day,
    COUNT(*) AS programados,
    COUNT(dp.id) FILTER (
        WHERE dp.image_url IS NOT NULL OR dp.signature_data_url IS NOT NULL
    ) AS con_evidencia
FROM orders o
LEFT JOIN delivery_proofs dp ON dp.order_id = o.id
WHERE o.route_id IS NOT NULL
  AND o.created_at BETWEEN :start AND :end
GROUP BY DATE(o.created_at);
```

---

## 7. Seguridad

### 7.1 Autenticación

- **OAuth2 / OpenID Connect** vía Keycloak.
- Backend valida JWT en cada request (`oauth2ResourceServer.jwt`).
- Mobile app y SPA web usan el flujo *Resource Owner Password* (Direct Access Grant) para simplicidad.

### 7.2 Autorización (RBAC)

Configuración en `SecurityConfig.java`:

| Path | Rol requerido |
|---|---|
| `/dashboard/**`, `/reports/**`, `/users/**` | ADMIN |
| `/drivers/**`, `/vehicles/**`, `/routes/**` | ADMIN, DISPATCHER, DRIVER |
| `/orders/**`, `/delivery-proofs/**`, `/gps/**` | ADMIN, DISPATCHER, DRIVER |
| `/purchases/**` | ADMIN, DISPATCHER |
| `/notifications/**` | ADMIN, DISPATCHER, DRIVER |
| `/actuator/health`, `/v3/api-docs/**` | público |

### 7.3 Rate Limiting

`RateLimitFilter.java` aplica throttling con Bucket4j para evitar abuso de endpoints públicos.

### 7.4 Buenas prácticas implementadas

- Contraseñas nunca en código (Keycloak gestiona).
- HTTPS recomendado en producción.
- Tokens JWT con expiración corta (5 min) + refresh tokens.
- Validación de entrada con Bean Validation (`@Valid`).
- SQL parametrizado (R2DBC), no concatenación.
- CORS configurado restrictivamente.

---

## 8. Observabilidad

- **Healthcheck**: `GET /actuator/health`
- **Métricas Prometheus**: `GET /actuator/prometheus`
- **Info**: `GET /actuator/info`
- **OpenAPI Docs**: `GET /v3/api-docs` y UI en `/swagger-ui.html`

---

## 9. Despliegue en Producción (futuro)

Recomendaciones para una eventual puesta en producción:

1. **Cloud**: AWS o Azure con managed PostgreSQL (RDS).
2. **Container orquestación**: ECS Fargate o Kubernetes.
3. **Keycloak**: usar instancia dedicada con SSL.
4. **S3 real** (no LocalStack) con buckets versionados y backup.
5. **CI/CD**: GitHub Actions o Azure DevOps para build/test/deploy.
6. **Monitoreo**: CloudWatch o Grafana + Loki.
7. **Backup BD**: snapshots automáticos diarios.
8. **DNS + SSL**: Let's Encrypt o ACM.
9. **CDN**: CloudFront para web admin.
10. **App Store**: subir el .apk a Play Store / .ipa a App Store.

---

## 10. Mantenimiento y Troubleshooting

### 10.1 Logs

- Backend: `logs/spring-boot-logger.log`
- Logs nivel DEBUG para `com.ecoroute.backend` en `application-local.yml`.

### 10.2 Problemas comunes

| Síntoma | Causa probable | Solución |
|---|---|---|
| 401 en todas las requests | Token JWT expirado | Volver a hacer login |
| Frontend no se conecta al backend | Vite proxy mal configurado | Revisar `vite.config.ts` |
| Migraciones Flyway fallan | Schema modificado manualmente | `docker exec ecoroute-db psql ... DROP DATABASE` y recrear |
| LocalStack pierde datos | Reinicio de Docker | Re-crear bucket S3 + queue SQS |
| GPS no actualiza | WebSocket cerrado | Revisar consola navegador, reconectar |
| App móvil no compila | Versiones Flutter | `flutter clean && flutter pub get` |

### 10.3 Backup y restauración

**Backup:**
```powershell
docker exec ecoroute-db pg_dump -U user ecoroute > backup_$(Get-Date -Format yyyyMMdd).sql
```

**Restauración:**
```powershell
docker exec -i ecoroute-db psql -U user ecoroute < backup_20260531.sql
```

---

## 11. Contacto Técnico

**Desarrollador principal:** Campos Vargas Kevin Stip
**ORCID:** 0000-0002-6087-3626
**Repositorio:** [URL del repo]
**Documentación adicional:** Anexo 8 (Metodología), README.md, GUIA_COMPLETA.md

---

> Este manual técnico complementa el código fuente. Para detalles de implementación específicos, ver los comentarios en código y los tests en `src/test/`.
