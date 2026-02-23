# EcoRoute - Sistema de Gestión Logística Inteligente

EcoRoute es una plataforma integral diseñada para optimizar la logística de última milla, permitiendo el seguimiento en tiempo real, la gestión eficiente de rutas y el aseguramiento de la calidad en las entregas.

## 🚀 Funcionalidades Principales

### 1. Trazabilidad y Seguimiento en Tiempo Real
- **Seguimiento GPS:** Visualización en mapa del recorrido histórico y posición actual de los vehículos.
- **Simulación de Movimiento:** Herramientas integradas para simular el desplazamiento de conductores sin necesidad de hardware físico.

### 2. Planificación de Rutas Inteligente
- **Cálculo de Distancias:** Implementación del algoritmo de **Haversine** para calcular kilometrajes reales entre puntos de entrega.
- **Gestión de Carga:** Asignación de vehículos y conductores optimizada por disponibilidad.

### 3. Módulo de Evidencias Digitales
- **Pruebas de Entrega:** Captura de fotos y firmas digitales almacenadas de forma segura en **AWS S3** (Simulado con Localstack).
- **Comprobantes PDF:** Generación automática de reportes de entrega profesionales descargables desde el panel administrativo.

### 4. Dashboard de Control (KPIs)
- **Rendimiento de Entregas:** Gráficos comparativos de entregas "A Tiempo" vs "Retrasadas".
- **Productividad:** Gráficos de barras por conductor con métricas de desempeño.
- **Filtros Avanzados:** Filtrado dinámico por conductor, fechas y estados.

### 5. Validaciones Contextualizadas (Perú)
- **Formatos Locales:** Validación de placas (ABC-123), teléfonos (9 dígitos) y licencias peruanas.
- **Seguridad de Datos:** Integración de Bean Validation (JSR-303) en el backend y validaciones reactivas en el frontend.

## 🛠️ Tecnologías Utilizadas

- **Backend:** Java 17, Spring Boot 3.5, WebFlux (Reactivo), R2DBC.
- **Frontend:** React (TypeScript), Leaflet (Mapas), Chart.js.
- **Seguridad:** Keycloak (OAuth2/JWT).
- **Infraestructura:** Docker, PostgreSQL, Localstack (AWS S3/SQS).

## 📦 Ejecución del Proyecto

1. Levantar el ambiente:
   ```bash
   docker-compose up -d --build
   ```
2. Acceder al Panel: `http://localhost:3000`
3. Credenciales Demo: `mock_ADMIN`

---
© 2026 EcoRoute Logistics.
