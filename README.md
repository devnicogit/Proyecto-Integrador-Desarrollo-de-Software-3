# 🚚 EcoRoute: Sistema de Gestión Logística de Última Milla

EcoRoute es una solución integral para la optimización de rutas, seguimiento en tiempo real y gestión de evidencias para empresas de logística.

---

## 🛠️ Requisitos Previos

Antes de comenzar, asegúrate de tener instalado lo siguiente en tu PC:

1.  **Docker & Docker Compose:** Para gestionar la base de datos, seguridad y servicios AWS locales.
2.  **Java 17 (OpenJDK):** Necesario para el Backend (Spring Boot).
3.  **Node.js (v18+) & npm:** Necesario para el Panel Administrativo (React).
4.  **Flutter SDK (3.x):** Necesario para la Aplicación Móvil.
5.  **Git:** Para el control de versiones.
6.  **Deseable:** Un cliente SQL (como DBeaver) para visualizar la base de datos.

---

## 🚀 Guía de Instalación y Configuración (Flujo Completo)

Sigue estos pasos en el orden exacto para garantizar que el sistema funcione correctamente.

### 1. Levantar la Infraestructura (Docker)
Abre una terminal en la raíz del proyecto y ejecuta:
```powershell
docker-compose up -d
```
Esto levantará:
*   **PostgreSQL (8081):** Base de datos.
*   **Keycloak (8080):** Servidor de identidad.
*   **LocalStack (4566):** Simulador de servicios AWS (S3, SQS).

### 2. Configuración Manual de Servicios (Vital)
Debido a que el entorno es volátil (LocalStack), debemos crear los recursos necesarios manualmente:

**A. Crear Bucket de Fotos (S3):**
```powershell
docker exec ecoroute-localstack awslocal s3 mb s3://ecoroute-proofs
```

**B. Crear Cola de Notificaciones (SQS):**
```powershell
docker exec ecoroute-localstack awslocal sqs create-queue --queue-name ecoroute-notifications
```

### 3. Configuración de Seguridad (Keycloak)
Puedes configurar Keycloak automáticamente ejecutando nuestro script de PowerShell:

```powershell
./setup-keycloak.ps1
```

*(O si prefieres hacerlo manualmente, sigue los comandos detallados en el archivo `setup-keycloak.ps1`)*

### 4. Población de Datos (SQL)
Para que el sistema tenga rutas y pedidos que mostrar, inserta la data maestra:

```powershell
# Copiar y ejecutar los scripts de población (ajusta los nombres de archivo si es necesario)
docker cp schema.sql ecoroute-db:/schema.sql
docker cp full_populate.sql ecoroute-db:/populate.sql
docker exec ecoroute-db psql -U user -d ecoroute -f /schema.sql
docker exec ecoroute-db psql -U user -d ecoroute -f /populate.sql
```

---

## 💻 Ejecución de Componentes

### Backend (Java/Spring)
Desde la raíz del proyecto:
```powershell
./gradlew.bat bootRun --args="--spring.profiles.active=local"
```
*El API estará disponible en `http://localhost:8081`*

### Web Admin (React)
1.  Ve a la carpeta: `cd web-admin`
2.  Instala dependencias: `npm install`
3.  Ejecuta: `npm run dev`
*Accede desde `http://localhost:3000` (o el puerto que indique Vite)*

### Mobile App (Flutter)
1.  Ve a la carpeta: `cd mobile-app`
2.  Limpia el entorno: `flutter clean` (recomendado la primera vez)
3.  Obtén paquetes: `flutter pub get`
4.  Ejecuta: `flutter run`
*Asegúrate de tener un emulador Android abierto.*

---

## 🔄 Flujo de Uso (Test de entrega)

1.  **Login:** Ingresa con `conductor` / `conductor123`.
2.  **Visualización:** Verás el mapa centrado en Lima con los pedidos marcados y una **línea azul** (ruta óptima) uniéndolos.
3.  **Proceso de Entrega:**
    *   Selecciona un pedido de la lista.
    *   Cambia el estado a `IN_TRANSIT` o `DELIVERED`.
    *   Toma la foto de evidencia.
    *   Presiona **GUARDAR ESTADO**.
4.  **Resultado:** El pedido desaparecerá del mapa y de la lista de pendientes, y quedará bloqueado para edición.

---

## 📁 Archivos de Población de Referencia
*   `schema.sql`: Estructura completa de tablas.
*   `full_populate.sql`: Datos de prueba (Juan Pérez ID:1, Vehículo ID:1, 3 pedidos en Lima).
