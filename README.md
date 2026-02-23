# EcoRoute - Sistema de Gestión Logística Inteligente

EcoRoute es una plataforma enterprise diseñada para la optimización de logística de última milla, centrada en la eficiencia operativa, trazabilidad en tiempo real y análisis de KPIs para el mercado peruano.

## 🚀 Funcionalidades Principales

### 1. Panel de Control y Bienvenida
- **Pantalla de Inicio:** Interfaz centralizada para acceso rápido a módulos mediante tarjetas interactivas.
- **Layout Full-Width:** Diseño optimizado para aprovechar todo el ancho de pantalla en centros de control.
- **Login Centrado:** Interfaz de acceso profesional y minimalista.

### 2. Trazabilidad GPS e Inteligencia de Ruteo
- **Algoritmo de Proximidad:** Ordenamiento automático de paradas (Vecino más Cercano) para minimizar tiempos de recorrido.
- **Visualización Dinámica:** Mapa con dos capas: Ruta Planificada (Gris) y Recorrido Real (Azul).
- **Paradas Numeradas:** Identificación clara de la secuencia de entrega (Parada #1, #2, etc.) con Tooltips permanentes.
- **Limpieza Dinámica:** Los destinos completados desaparecen del mapa en tiempo real para enfocar la operación pendiente.

### 3. Gestión Operativa Escalable
- **Filtros Avanzados:** Gestión de despacho segmentada por Hoy, Mañana e Histórico.
- **Paginación Inteligente:** Tablas optimizadas para manejar flotas de más de 200 vehículos y miles de pedidos (10 registros por página).
- **Geocodificación:** Botón de localización automática que convierte direcciones de texto en coordenadas GPS reales usando OpenStreetMap.

### 4. Módulo de Evidencias y Documentación
- **Evidencia Digital:** Captura de fotos y firmas almacenadas en AWS S3.
- **Reportes PDF:** Generación de comprobantes de entrega profesionales descargables.
- **Auto-Completado:** Las rutas se cierran automáticamente al detectar la última entrega del manifiesto.

### 5. Analítica de Negocio (Dashboard)
- **Rendimiento (KPI):** Gráficos de entregas "A Tiempo" vs "Retrasadas".
- **Productividad:** Desempeño por conductor con visualización multi-color.
- **Geomarketing:** Distribución de pedidos por distritos de Lima.
- **Estado de Flota:** Indicadores visuales de unidades libres y en mantenimiento.

## 🛠️ Arquitectura y Tecnologías

- **Backend:** Java 17, Spring Boot 3.5, WebFlux (Programación Reactiva), R2DBC.
- **Frontend:** React 19, TypeScript, Vite, Leaflet, Chart.js.
- **Base de Datos:** PostgreSQL 14 con esquema consolidado (Core + Enterprise Expansion).
- **Infraestructura:** Docker Compose, Localstack (S3/SQS), Keycloak.

## 📦 Ejecución

```bash
docker-compose up -d --build
```
Acceso: `http://localhost:3000` | Credenciales: `admin / admin123`

---
© 2026 EcoRoute Logistics.
