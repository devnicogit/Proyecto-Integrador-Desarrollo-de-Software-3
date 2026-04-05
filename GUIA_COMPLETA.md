# GUIA COMPLETA - EcoRoute: Sistema de Gestion Logistica de Ultima Milla

Esta guia cubre la instalacion desde cero, configuracion y uso completo del sistema EcoRoute en cualquier maquina.

---

## PARTE 1: REQUISITOS PREVIOS

### Software a instalar

| Software | Version | Descarga |
|----------|---------|----------|
| **Docker Desktop** | 4.x+ | https://www.docker.com/products/docker-desktop |
| **Java 17 (OpenJDK)** | 17.x | https://adoptium.net/ (Eclipse Temurin) |
| **Node.js** | 18+ | https://nodejs.org/ (LTS) |
| **Flutter SDK** | 3.x | https://docs.flutter.dev/get-started/install |
| **Android Studio** | 2024+ | https://developer.android.com/studio |
| **Git** | 2.x+ | https://git-scm.com/ |

### Verificar instalaciones

```bash
docker --version          # Docker version 27.x
java -version             # openjdk version "17.x"
node --version            # v18.x o superior
flutter --version         # Flutter 3.x
git --version             # git version 2.x
```

### Configurar Android Studio

1. Abrir Android Studio > Settings > SDK Manager
2. Instalar **Android SDK 34** o superior
3. Ir a Device Manager > Create Device
4. Seleccionar **Pixel 9 Pro XL** > Seleccionar imagen del sistema (API 34+) > Finish

### IMPORTANTE: Puerto 5432

Si tienes PostgreSQL instalado localmente en tu PC, el puerto 5432 estara ocupado. El proyecto usa el **puerto 5433** para evitar conflictos. No necesitas cambiar nada.

---

## PARTE 2: INSTALACION Y CONFIGURACION (desde cero)

### Paso 1: Clonar el repositorio

```bash
git clone <URL_DEL_REPOSITORIO>
cd "Proyecto Integrador Desarrollo de Software 3"
```

### Paso 2: Levantar la infraestructura con Docker

```bash
docker-compose up -d postgres keycloak localstack
```

Esto levanta 3 servicios:
- **PostgreSQL** en puerto `5433` (BD: ecoroute, user: user, password: password)
- **Keycloak** en puerto `8080` (admin: admin, password: admin)
- **LocalStack** en puerto `4566` (simula AWS S3 y SQS)

### Paso 3: Esperar a que los servicios esten listos

Esperar ~30 segundos y verificar:

```bash
# Verificar PostgreSQL
docker exec ecoroute-db pg_isready -U user -d ecoroute

# Verificar Keycloak (debe devolver JSON)
curl http://localhost:8080/realms/master
```

Si Keycloak no responde, esperar 1-2 minutos mas (tarda en arrancar la primera vez).

### Paso 4: Configurar Keycloak (realm, usuarios, roles)

**Opcion A: Script automatico (PowerShell)**

```powershell
./setup-keycloak.ps1
```

**Opcion B: Comandos manuales (Bash/Git Bash)**

```bash
# Autenticar como admin
docker exec ecoroute-keycloak /opt/keycloak/bin/kcadm.sh config credentials --server http://localhost:8080 --realm master --user admin --password admin

# Crear realm
docker exec ecoroute-keycloak /opt/keycloak/bin/kcadm.sh create realms -s realm=ecoroute -s enabled=true

# Crear cliente
docker exec ecoroute-keycloak /opt/keycloak/bin/kcadm.sh create clients -r ecoroute -s clientId=mobile-app -s publicClient=true -s directAccessGrantsEnabled=true -s standardFlowEnabled=true

# Crear rol DRIVER
docker exec ecoroute-keycloak /opt/keycloak/bin/kcadm.sh create roles -r ecoroute -s name=DRIVER

# Crear usuario conductor
docker exec ecoroute-keycloak /opt/keycloak/bin/kcadm.sh create users -r ecoroute -s username=conductor -s enabled=true -s firstName=Juan -s lastName=Perez
docker exec ecoroute-keycloak /opt/keycloak/bin/kcadm.sh set-password -r ecoroute --username conductor --new-password conductor123

# Asignar rol
docker exec ecoroute-keycloak /opt/keycloak/bin/kcadm.sh add-roles -r ecoroute --uusername conductor --rolename DRIVER
```

> **NOTA para Git Bash en Windows**: Si los comandos dan error de path, agregar `export MSYS_NO_PATHCONV=1` al inicio.

### Paso 5: Crear recursos AWS locales (S3 y SQS)

Esperar a que LocalStack este listo (~20 segundos despues de `docker-compose up`):

```bash
# Crear bucket S3 para fotos de evidencia
docker exec ecoroute-localstack awslocal s3 mb s3://ecoroute-proofs

# Crear cola SQS para notificaciones
docker exec ecoroute-localstack awslocal sqs create-queue --queue-name ecoroute-notifications
```

### Paso 6: Arrancar el Backend (Spring Boot)

Desde la raiz del proyecto:

**Windows (PowerShell o CMD):**
```powershell
.\gradlew.bat bootRun --args="--spring.profiles.active=local"
```

**Linux/Mac:**
```bash
./gradlew bootRun --args="--spring.profiles.active=local"
```

Esperar ~30 segundos hasta ver:
```
Netty started on port 8081 (http)
```

> Flyway ejecutara automaticamente las 7 migraciones de base de datos (V1 a V7).

Verificar:
```bash
curl http://localhost:8081/actuator/health
```

> El status sera "DOWN" por Redis (no lo usamos), pero `r2dbc: UP` confirma que la BD funciona.

### Paso 7: Poblar la base de datos con datos iniciales (seed)

```bash
# Copiar script al contenedor
docker cp full_populate.sql ecoroute-db:/populate.sql

# Ejecutar seed
docker exec ecoroute-db psql -U user -d ecoroute -f /populate.sql
```

> **NOTA para Git Bash en Windows**: Usar `export MSYS_NO_PATHCONV=1` antes de estos comandos.

Datos iniciales cargados:
- 1 Hub (Lima Principal)
- 1 Conductor (Juan Perez, LIC-001)
- 1 Vehiculo (ABC-123, Chevrolet N300)
- 1 Ruta con 3 pedidos en Lima (Miraflores, San Isidro, Surco)

### Paso 8: Arrancar el Frontend Web (React)

```bash
cd web-admin
npm install
npm run dev
```

El dashboard estara disponible en: **http://localhost:3000**

### Paso 9: Arrancar la App Movil (Flutter)

Abrir un emulador Android:
```bash
flutter emulators --launch Pixel_9_Pro_XL
```

Esperar ~30 segundos a que el emulador arranque, luego:
```bash
cd mobile-app
flutter clean
flutter pub get
flutter run -d emulator-5554
```

> La primera compilacion tarda 2-3 minutos.

---

## PARTE 3: CREDENCIALES

| Sistema | Usuario | Contrasena | Rol |
|---------|---------|------------|-----|
| Dashboard Web | admin | admin123 | ADMIN (mock) |
| App Movil | conductor | conductor123 | DRIVER (Keycloak) |
| Keycloak Admin | admin | admin | Administrador |
| PostgreSQL | user | password | Superuser |

---

## PARTE 4: PUERTOS Y URLs

| Servicio | URL | Puerto |
|----------|-----|--------|
| Dashboard Web | http://localhost:3000 | 3000 |
| Backend API | http://localhost:8081 | 8081 |
| Keycloak | http://localhost:8080 | 8080 |
| PostgreSQL | localhost:5433 | 5433 |
| LocalStack (S3/SQS) | http://localhost:4566 | 4566 |

---

## PARTE 5: GUIA DE USO - FLUJO END TO END

### 5.1 DASHBOARD WEB (Administrador)

#### Login

1. Abrir **http://localhost:3000**
2. Ingresar: `admin` / `admin123`
3. Click "Iniciar Sesion"
4. Se muestra la pagina de inicio "Bienvenido a EcoRoute"

#### Navegacion del Sidebar

| Seccion | Funcion | Rol requerido |
|---------|---------|---------------|
| Inicio | Pagina principal con modulos | Todos |
| Dashboard | KPIs, graficos, estado de flota | ADMIN |
| Pedidos | CRUD pedidos, importar CSV, evidencia | ADMIN, DISPATCHER |
| Rutas | Gestion de despacho, tracking GPS en vivo | ADMIN, DISPATCHER |
| Conductores | CRUD conductores | ADMIN |
| Vehiculos | CRUD vehiculos | ADMIN |
| Compras | CRUD compras/adquisiciones | ADMIN |
| Reportes | Analitica, exportar CSV | ADMIN |
| Usuarios | Asignar roles a usuarios | ADMIN |

#### Crear un nuevo conductor

1. Ir a **Conductores**
2. Click **"Nuevo Conductor"**
3. Llenar: Nombre, Apellido, Licencia (formato: Q12345678), Telefono (formato: 9XXXXXXXX), Email
4. Click **"Crear"**

#### Crear un nuevo vehiculo

1. Ir a **Vehiculos**
2. Click **"Nuevo Vehiculo"**
3. Llenar: Placa (formato: ABC-123), Marca, Modelo, Capacidad Kg, Capacidad M3
4. Click **"Crear"**

#### Crear una nueva ruta

1. Ir a **Rutas**
2. Click **"+ Nueva Ruta"**
3. Seleccionar: Conductor, Vehiculo, Fecha, Hora estimada de inicio
4. Click **"Crear Ruta"**
5. La ruta aparece con estado **PLANNED**

#### Crear pedidos

1. Ir a **Pedidos**
2. Click **"Nuevo Pedido"**
3. Llenar:
   - Tracking Number (ej: TRK-001)
   - Nombre del cliente
   - Telefono (9 digitos empezando con 9)
   - Direccion de entrega
   - Seleccionar Ruta asignada
   - La direccion se geocodifica automaticamente (latitud/longitud)
4. Click **"Crear"**

#### Importar pedidos por CSV

1. Ir a **Pedidos**
2. Click **"Importar CSV"** (boton verde)
3. Seleccionar archivo CSV con formato:
   ```
   trackingNumber,recipientName,deliveryAddress,latitude,longitude
   TRK-100,Juan Lopez,Av. Larco 500 Miraflores,-12.119,-77.031
   TRK-101,Maria Garcia,Calle Berlin 200 Miraflores,-12.122,-77.035
   ```
4. Ver preview de los datos
5. Click **"Importar"**

#### Iniciar una ruta (despacho)

1. Ir a **Rutas**
2. Seleccionar la ruta con estado PLANNED
3. Click **"Iniciar Despacho"**
4. La ruta cambia a **IN_PROGRESS**
5. Todos los pedidos de esa ruta cambian automaticamente a **IN_TRANSIT**
6. El mapa muestra el seguimiento GPS en tiempo real

#### Ver Dashboard de KPIs

1. Ir a **Dashboard**
2. Ver las 4 tarjetas: Total Pedidos, En Ruta, Entregados, Pendientes
3. Filtrar por conductor o rango de fechas
4. Ver graficos: Rendimiento de Entregas, Entregas por Conductor
5. Ver Estado de la Flota: conductores libres, vehiculos disponibles

#### Exportar reportes

1. Ir a **Reportes**
2. Seleccionar filtros (conductor, fechas)
3. Ver KPIs y tabla de eficiencia por distrito
4. Click **"Exportar CSV"** para descargar

#### Descargar comprobante de entrega (PDF)

1. Ir a **Pedidos**
2. Buscar un pedido con estado DELIVERED
3. Click en el icono de informacion (i)
4. Click **"Descargar PDF"**
5. Se descarga el comprobante con datos de entrega, receptor y GPS

---

### 5.2 APP MOVIL (Conductor)

#### Login

1. Abrir la app EcoRoute Driver en el emulador
2. Ingresar: `conductor` / `conductor123`
3. Click **"INGRESAR"**
4. Aparece snackbar verde: "Bienvenido, conductor!"
5. Se muestra la pantalla "Mis Rutas de Hoy"

#### Pantalla principal - Mis Rutas de Hoy

- **Mapa** centrado en Lima con marcadores de pedidos
- **Linea azul**: ruta optima calculada entre los puntos de entrega
- **Dropdown de rutas**: seleccionar entre las rutas asignadas al conductor
- **Lista de entregas pendientes**: tracking, cliente, direccion, estado

#### Seleccionar una ruta

1. Tocar el dropdown de rutas (ej: "Ruta #1 - 2026-03-24")
2. Se despliegan todas las rutas asignadas al conductor
3. Seleccionar la ruta deseada
4. Los pedidos y el mapa se actualizan

#### Proceso de entrega de un pedido

1. Tocar un pedido de la lista (ej: "Pedido #TRK-001 - IN_TRANSIT")
2. Se abre la pantalla **"Pedido #TRK-001"**:
   - Datos del cliente y direccion
   - Dropdown para cambiar estado
   - Seccion de evidencia fotografica
3. Cambiar estado a **DELIVERED** en el dropdown
4. Aparecen campos adicionales:
   - **Evidencia Fotografica**: tocar el icono de camara para tomar foto
   - **Datos del Receptor**: nombre (pre-llenado) y DNI (obligatorio, 8 digitos)
   - **Firma del Receptor**: area para firmar con el dedo
5. Tomar foto de evidencia
6. Llenar DNI del receptor
7. Firmar en el pad > tocar **"Confirmar Firma"**
8. Click **"GUARDAR ESTADO"**
9. El pedido se marca como DELIVERED y la evidencia se sube a S3

> **IMPORTANTE**: No se puede marcar como DELIVERED sin foto. La app muestra: "Se requiere una foto como evidencia para marcar como DELIVERED"

#### Completar ruta automaticamente

Cuando TODOS los pedidos de una ruta estan en estado final (DELIVERED o FAILED), la ruta se completa automaticamente a estado **COMPLETED**.

#### Ver historial de entregas

1. Tocar el icono de reloj en la barra superior
2. Se muestra la lista de entregas pasadas (DELIVERED y FAILED)
3. Cada entrada muestra: tracking, cliente, direccion, estado con color

#### Ver perfil del conductor

1. Tocar el icono de persona en la barra superior
2. Se muestra:
   - Nombre, ID, correo
   - Rol (DRIVER)
   - Numero de licencia
   - Telefono
3. **Modo Oscuro**: toggle para activar/desactivar tema oscuro
4. **Cerrar Sesion**: boton rojo para logout

---

### 5.3 FLUJO COMPLETO END TO END (paso a paso)

```
ADMIN (Dashboard Web)                    CONDUCTOR (App Movil)
========================                 ========================

1. Login (admin/admin123)
2. Crear Conductor (si no existe)
3. Crear Vehiculo (si no existe)
4. Crear Ruta (PLANNED)
5. Crear Pedidos asignados a la ruta
6. Iniciar Ruta (PLANNED -> IN_PROGRESS)
   [Pedidos -> IN_TRANSIT automatico]
                                         7. Login (conductor/conductor123)
                                         8. Seleccionar la ruta del dia
                                         9. Ver pedidos en mapa + lista
                                         10. Tocar pedido -> Detalle
                                         11. Cambiar estado a DELIVERED
                                         12. Tomar foto de evidencia
                                         13. Llenar DNI receptor
                                         14. Firmar en el pad
                                         15. GUARDAR ESTADO
                                            [Foto -> S3]
                                            [Pedido -> DELIVERED]
                                            [Notificacion -> SQS]
                                         16. Repetir 10-15 para cada pedido
                                         17. Al completar todos:
                                            [Ruta -> COMPLETED automatico]

18. Ver en Dashboard: KPIs actualizados
19. Descargar PDF de comprobante
20. Ver Reportes y exportar CSV
```

---

## PARTE 6: ESTRUCTURA DEL PROYECTO

```
EcoRoute/
├── src/                          # Backend Java (Spring Boot)
│   └── main/
│       ├── java/com/ecoroute/backend/
│       │   ├── domain/           # Modelos, puertos (hexagonal)
│       │   ├── application/      # Casos de uso, servicios
│       │   └── infrastructure/   # Controllers, repositories, config
│       └── resources/
│           ├── application*.yml  # Configuracion por perfil
│           └── db/migration/     # Flyway V1-V7
├── web-admin/                    # Frontend React + TypeScript
│   └── src/
│       ├── pages/                # Login, Home, Dashboard, Orders, etc.
│       ├── components/           # Sidebar, Charts, Pagination, etc.
│       ├── services/             # API calls (Axios)
│       └── context/              # AuthContext
├── mobile-app/                   # App Flutter (Dart)
│   └── lib/
│       ├── core/                 # DI, network, theme, cache, router
│       └── features/             # auth, gps, routes, orders, history, profile
├── docker-compose.yml            # Infraestructura
├── full_populate.sql             # Datos semilla
├── setup-keycloak.ps1            # Script configuracion Keycloak
└── build.gradle                  # Build backend
```

---

## PARTE 7: SOLUCION DE PROBLEMAS

### El backend no arranca (error de Flyway/password)

Si tienes PostgreSQL instalado localmente ocupando el puerto 5432, el proyecto usa el puerto **5433**. Esto ya esta configurado. Si aun falla:

```bash
# Verificar que no hay conflicto de puertos
netstat -ano | findstr ":5433"

# Reiniciar el contenedor
docker restart ecoroute-db
```

### Keycloak no responde

Keycloak tarda 1-2 minutos en arrancar la primera vez. Verificar:

```bash
docker logs ecoroute-keycloak --tail 20
```

Buscar: `Listening on: http://0.0.0.0:8080`

### La app movil no conecta al backend

El emulador Android usa `10.0.2.2` para referirse al host (localhost de tu PC). Esto ya esta configurado en el codigo. Verificar que:
1. El backend esta corriendo en puerto 8081
2. El emulador tiene conexion a internet (WiFi en el emulador)

### Error "Se requiere una foto" en la app

La app requiere tomar foto antes de marcar como DELIVERED. En el emulador:
1. Tocar el area de "Evidencia Fotografica"
2. Se abre la camara del emulador
3. Tomar la foto (el emulador simula una imagen)
4. Confirmar

### Errores de compilacion Flutter

```bash
cd mobile-app
flutter clean
flutter pub get
flutter run
```

### Limpiar y empezar de cero

```bash
# Apagar todo
docker-compose down -v    # -v elimina los volumenes (BD limpia)

# Volver a empezar desde el Paso 2
docker-compose up -d postgres keycloak localstack
# ... seguir los pasos 3 al 9
```

---

## PARTE 8: API REST - ENDPOINTS DISPONIBLES

Todos los endpoints requieren header `Authorization: Bearer mock_ADMIN` (o `mock_DRIVER`).

### Pedidos
| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| GET | /orders | Listar todos (opcional: ?routeId=X) |
| GET | /orders/{id} | Obtener por ID |
| POST | /orders | Crear pedido |
| PATCH | /orders/{id}/status | Actualizar estado |
| DELETE | /orders/{id} | Eliminar |
| POST | /orders/bulk-csv | Importar CSV masivo |

### Rutas
| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| GET | /routes | Listar (opcional: ?date=YYYY-MM-DD&status=X) |
| POST | /routes | Crear ruta |
| PATCH | /routes/{id}/status?status=X | Cambiar estado |
| DELETE | /routes/{id} | Eliminar |

### Conductores
| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| GET | /drivers | Listar todos |
| GET | /drivers/{id} | Obtener por ID |
| POST | /drivers | Crear conductor |
| PUT | /drivers/{id} | Actualizar |
| DELETE | /drivers/{id} | Eliminar |

### Vehiculos
| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| GET | /vehicles | Listar todos |
| POST | /vehicles | Crear vehiculo |
| PUT | /vehicles/{id} | Actualizar |
| DELETE | /vehicles/{id} | Eliminar |

### GPS
| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| POST | /gps/ping | Enviar ubicacion GPS |
| GET | /gps/history/{vehicleId} | Historial GPS del vehiculo |

### Evidencia de Entrega
| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| POST | /delivery-proofs | Registrar evidencia (foto+firma) |
| GET | /delivery-proofs/{orderId}/pdf | Descargar PDF comprobante |

### Dashboard
| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| GET | /dashboard/orders-by-status | Conteo por estado |
| GET | /dashboard/delivery-performance | Entregas a tiempo vs retrasadas |
| GET | /dashboard/deliveries-by-driver | Entregas por conductor |
| GET | /dashboard/orders-by-district | Pedidos por distrito |

### Compras
| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| GET | /purchases | Listar compras |
| POST | /purchases | Crear compra |
| PUT | /purchases/{id} | Actualizar |
| DELETE | /purchases/{id} | Eliminar |

### Notificaciones
| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| GET | /notifications/unread | Listar no leidas |
| GET | /notifications/unread/count | Conteo no leidas |
| PATCH | /notifications/{id}/read | Marcar como leida |

### Reportes
| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| GET | /reports/orders-summary | Resumen de pedidos |
| GET | /reports/driver-performance | Rendimiento por conductor |
| GET | /reports/route-efficiency | Eficiencia por distrito |

### Usuarios
| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| GET | /users | Listar asignaciones de rol |
| POST | /users | Asignar rol |
| DELETE | /users/{id} | Quitar asignacion |

### WebSocket GPS
| Protocolo | Endpoint | Descripcion |
|-----------|----------|-------------|
| WS | ws://localhost:8081/ws/gps | GPS en tiempo real (enviar vehicleId) |
