# Diagramas UML — Sistema EcoRoute

Los siguientes diagramas están en formato **Mermaid**, que se puede renderizar:
- Directamente en GitHub (al ver este `.md`)
- En **draw.io** (importar como Mermaid)
- En **Mermaid Live Editor**: https://mermaid.live/
- En Notion (bloque `code` con lenguaje `mermaid`)
- En Word/PPT: copiar el SVG generado en Mermaid Live

---

## 1. Diagrama de Casos de Uso

```mermaid
flowchart TB
    subgraph Sistema ["Sistema EcoRoute"]
        UC1((Iniciar sesión))
        UC2((Registrar pedido))
        UC3((Gestionar conductores))
        UC4((Gestionar vehículos))
        UC5((Crear ruta))
        UC6((Ver hoja de ruta))
        UC7((Actualizar estado pedido))
        UC8((Capturar evidencia digital))
        UC9((Visualizar GPS en tiempo real))
        UC10((Ver dashboard KPIs))
        UC11((Exportar ficha CSV/PDF))
        UC12((Gestionar usuarios))
        UC13((Recibir notificaciones))
    end

    Admin[Administrador]
    Dispatcher[Dispatcher / Operaciones]
    Conductor[Conductor]
    Cliente[Cliente Receptor]

    Admin --> UC1
    Admin --> UC3
    Admin --> UC4
    Admin --> UC10
    Admin --> UC11
    Admin --> UC12

    Dispatcher --> UC1
    Dispatcher --> UC2
    Dispatcher --> UC5
    Dispatcher --> UC9
    Dispatcher --> UC13

    Conductor --> UC1
    Conductor --> UC6
    Conductor --> UC7
    Conductor --> UC8
    Conductor --> UC13

    Cliente -.recibe.-> UC8
```

---

## 2. Diagrama de Secuencia — Flujo de Entrega

```mermaid
sequenceDiagram
    actor Cond as Conductor
    participant App as App Móvil (Flutter)
    participant API as Backend API (WebFlux)
    participant DB as PostgreSQL
    participant S3 as AWS S3 (LocalStack)
    participant WS as WebSocket GPS
    participant Web as Panel Admin (React)
    actor Admin

    Cond->>App: Inicia sesión
    App->>API: POST /auth (Keycloak)
    API-->>App: JWT token

    Cond->>App: Selecciona pedido de ruta
    App->>API: GET /orders/{id}
    API->>DB: SELECT order
    DB-->>API: order data
    API-->>App: order detail

    Cond->>App: Cambia estado IN_TRANSIT
    App->>API: PATCH /orders/{id}/status
    API->>DB: UPDATE status + INSERT history
    API-->>App: 200 OK

    loop Cada 5 segundos
        App->>WS: GPS ping (lat, lon, speed)
        WS->>DB: INSERT vehicle_gps_history
        WS-->>Web: broadcast posición
        Web-->>Admin: actualiza mapa
    end

    Cond->>App: Llega a destino - captura foto
    Cond->>App: Captura firma digital + DNI
    App->>S3: PUT image.jpg
    S3-->>App: URL
    App->>API: POST /delivery-proofs
    API->>DB: INSERT delivery_proofs
    API->>DB: UPDATE order SET status=DELIVERED
    API->>DB: INSERT order_status_history
    API-->>App: 201 Created

    App-->>Cond: ✅ Entrega registrada
    Admin->>Web: Refresca KPIs
    Web->>API: GET /reports/kpi/tde
    API->>DB: SELECT con FILTER
    DB-->>API: aggregated
    API-->>Web: TDE actualizado
```

---

## 3. Diagrama de Componentes

```mermaid
flowchart LR
    subgraph Mobile["📱 Mobile App (Flutter)"]
        ML[Login BLoC]
        MR[Routes BLoC]
        MO[Order BLoC]
        MG[GPS BLoC]
        MH[History BLoC]
        MC[(Cache Local Hive)]
    end

    subgraph Web["🌐 Web Admin (React/TS)"]
        WD[Dashboard]
        WK[ThesisKpis]
        WT[TrackingMap]
        WO[Orders Page]
        WR[Routes Page]
    end

    subgraph Backend["⚙️ Backend (Spring WebFlux)"]
        BC[Controllers REST]
        BU[UseCases]
        BS[Services<br/>Kpi/Pdf/S3/Notification]
        BR[Repositories R2DBC]
        BW[WebSocket Handler]
    end

    subgraph Infra["🔧 Infraestructura"]
        KC[(Keycloak<br/>OAuth2)]
        PG[(PostgreSQL)]
        S3[(AWS S3<br/>LocalStack)]
        SQS[(AWS SQS<br/>LocalStack)]
        PR[(Prometheus)]
    end

    Mobile -->|HTTPS REST| BC
    Mobile -->|WSS GPS| BW
    Web -->|HTTPS REST| BC
    BC --> BU
    BU --> BS
    BU --> BR
    BR --> PG
    BS --> S3
    BS --> SQS
    BS --> KC
    BC -. JWT validation .-> KC
    BC --> PR
```

---

## 4. Diagrama Entidad-Relación (E-R)

```mermaid
erDiagram
    HUBS {
        bigserial id PK
        varchar name
        varchar code UK
        decimal latitude
        decimal longitude
    }

    DRIVERS {
        bigserial id PK
        varchar external_id UK
        varchar first_name
        varchar last_name
        varchar license_number UK
        varchar email UK
        boolean is_active
    }

    VEHICLES {
        bigserial id PK
        varchar plate_number UK
        varchar model
        decimal capacity_kg
        decimal capacity_m3
        boolean is_active
    }

    ROUTES {
        bigserial id PK
        bigint driver_id FK
        bigint vehicle_id FK
        date route_date
        varchar status
        timestamp actual_start_time
        decimal total_distance_km
    }

    ORDERS {
        bigserial id PK
        varchar tracking_number UK
        varchar external_reference
        bigint route_id FK
        varchar status
        varchar recipient_name
        varchar recipient_phone
        text delivery_address
        decimal latitude
        decimal longitude
    }

    DELIVERY_PROOFS {
        bigserial id PK
        bigint order_id FK,UK
        text image_url
        text signature_data_url
        varchar receiver_name
        varchar receiver_dni
        timestamp verified_at
    }

    VEHICLE_GPS_HISTORY {
        bigserial id PK
        bigint vehicle_id FK
        bigint driver_id FK
        decimal latitude
        decimal longitude
        decimal speed_kmh
        timestamp ping_time
    }

    ORDER_STATUS_HISTORY {
        bigserial id PK
        bigint order_id FK
        varchar status
        text reason
        decimal location_lat
        decimal location_lon
        varchar changed_by
        timestamp created_at
    }

    DRIVERS ||--o{ ROUTES : "conduce"
    VEHICLES ||--o{ ROUTES : "asignado a"
    ROUTES ||--o{ ORDERS : "contiene"
    ORDERS ||--o| DELIVERY_PROOFS : "evidenciado por"
    ORDERS ||--o{ ORDER_STATUS_HISTORY : "audita"
    VEHICLES ||--o{ VEHICLE_GPS_HISTORY : "rastrea"
    DRIVERS ||--o{ VEHICLE_GPS_HISTORY : "manejado por"
```

---

## 5. Diagrama de Arquitectura Hexagonal

```mermaid
flowchart TB
    subgraph Domain["🎯 Domain (Núcleo)"]
        DM[Entidades<br/>Order, Route, Driver, Vehicle, DeliveryProof]
        DPI[Puertos de Entrada<br/>UseCases interfaces]
        DPO[Puertos de Salida<br/>Repositories interfaces]
    end

    subgraph App["🔧 Application"]
        UC[Use Cases Implementaciones<br/>OrderUseCasesImpl, RouteUseCasesImpl, etc.]
        SV[Servicios<br/>KpiReportService, PdfService, S3Service]
    end

    subgraph InfraIn["📥 Infrastructure - Adaptadores Entrada"]
        REST[REST Controllers<br/>OrderController, RouteController, ReportController]
        WS[WebSocket Handler<br/>GpsWebSocketHandler]
    end

    subgraph InfraOut["📤 Infrastructure - Adaptadores Salida"]
        R2DBC[R2DBC Repositories<br/>R2dbcOrderRepository, KpiRepository, etc.]
        AWS[AWS Clients<br/>S3Client, SqsClient]
        SEC[Keycloak JWT<br/>SecurityConfig]
    end

    REST -->|llama| DPI
    WS -->|llama| DPI
    UC -. implementa .-> DPI
    SV --> DPO
    UC --> DPO
    DPO -. implementan .-> R2DBC
    DPO -. implementan .-> AWS

    style Domain fill:#fef3c7
    style App fill:#dbeafe
    style InfraIn fill:#dcfce7
    style InfraOut fill:#fce7f3
```

---

## 6. Diagrama de Estados — Ciclo de Vida del Pedido

```mermaid
stateDiagram-v2
    [*] --> PENDING: Pedido creado
    PENDING --> ASSIGNED: Asignado a ruta
    ASSIGNED --> PICKED_UP: Conductor recoge
    PICKED_UP --> IN_TRANSIT: Inicia ruta
    IN_TRANSIT --> DELIVERED: Entrega exitosa + evidencia
    IN_TRANSIT --> FAILED: Cliente no encontrado
    IN_TRANSIT --> RETURNED: Cliente rechaza
    DELIVERED --> [*]
    FAILED --> [*]
    RETURNED --> [*]

    note right of DELIVERED
        Requiere:
        - Foto (image_url)
        - Firma digital
        - DNI receptor
        - GPS location
    end note
```

---

## Cómo exportar a imagen para Word

1. Copia el bloque mermaid completo (entre los ` ```mermaid ` y ` ``` `).
2. Abre https://mermaid.live/
3. Pega en el editor.
4. Clic en **Actions → SVG** o **PNG** para descargar.
5. Inserta la imagen en la tesis con caption "Figura N°XX: …".

## Mapeo a figuras del documento

| Diagrama | Figura tesis |
|---|---|
| 1. Casos de Uso | Figura 5 (a agregar en Anexo 8 §2.2) |
| 2. Secuencia (entrega) | Figura 6 |
| 3. Componentes | Figura 7 |
| 4. E-R | Figura 8 |
| 5. Arquitectura Hexagonal | Figura 9 |
| 6. Estados del pedido | Figura 10 |
