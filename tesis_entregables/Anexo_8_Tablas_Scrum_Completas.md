# Anexo 8 — Tablas Scrum Completas (Daily, Retrospective, Burndown)

Este documento complementa el Anexo 8 principal ([Anexo_8_Metodologia.md](Anexo_8_Metodologia.md)) con las tablas 29-33 detalladas.

---

## Tabla 29. Product Backlog Detallado

| ID | Historia de Usuario | Story Points | Prioridad MoSCoW | Sprint |
|---|---|---|---|---|
| PB01 | HU01 — Autenticación con Keycloak | 7 | M (Must) | 1 |
| PB02 | HU02 — Gestión de Conductores | 5 | M (Must) | 1 |
| PB03 | HU03 — Gestión de Vehículos | 5 | M (Must) | 1 |
| PB04 | HU04 — Registro de Pedidos con validación de integridad | 7 | M (Must) | 2 |
| PB05 | HU05 — Planificación de Rutas con asignación | 8 | M (Must) | 2 |
| PB06 | HU06 — Hoja de Ruta en app móvil | 5 | M (Must) | 3 |
| PB07 | HU07 — Actualización de estado del pedido | 5 | M (Must) | 3 |
| PB08 | HU08 — Captura de evidencia (foto + firma + DNI) | 7 | M (Must) | 3 |
| PB09 | HU09 — Monitoreo GPS en tiempo real (WebSocket) | 7 | M (Must) | 4 |
| PB10 | HU10 — Dashboard de KPIs (IID, CHR, TDE) | 7 | M (Must) | 4 |
| PB11 | HU11 — Exportación CSV/PDF formato Anexo 2 | 5 | S (Should) | 4 |
| PB12 | HU12 — Modo offline app móvil | 5 | S (Should) | 3 |
| PB13 | HU13 — Dark mode app móvil | 2 | C (Could) | 4 |
| PB14 | HU14 — Módulo de Notificaciones | 3 | C (Could) | 4 |

**Total Story Points planificados:** 78

---

## Tabla 30. Daily Scrum (semana representativa del Sprint 3)

### Día 1 — Lunes

| Miembro | Ayer | Hoy | Impedimentos |
|---|---|---|---|
| Frontend Dev | Setup proyecto Flutter | Pantalla de Login con OIDC | Ninguno |
| Backend Dev | Endpoint /orders por ruta | Endpoint PATCH /orders/{id}/status | Ninguno |
| QA | Revisión criterios HU06 | Probar login móvil | Esperando build |

### Día 2 — Martes

| Miembro | Ayer | Hoy | Impedimentos |
|---|---|---|---|
| Frontend Dev | Login móvil completo | Lista de pedidos por ruta | Ninguno |
| Backend Dev | PATCH status funcionando | Implementar order_status_history | Falta migración Flyway |
| QA | Login móvil OK | Probar transición de estados | Datos inconsistentes en BD |

### Día 3 — Miércoles

| Miembro | Ayer | Hoy | Impedimentos |
|---|---|---|---|
| Frontend Dev | Lista de pedidos terminada | Pantalla de captura de foto (cámara) | Permisos Android |
| Backend Dev | Migración Flyway corregida | Subida a S3 con LocalStack | Bucket no creado |
| QA | Transiciones validadas | Verificar audit trail | Ninguno |

### Día 4 — Jueves

| Miembro | Ayer | Hoy | Impedimentos |
|---|---|---|---|
| Frontend Dev | Foto OK, integrada a S3 | Pad de firma digital con `signature` package | Calibración del trazo |
| Backend Dev | S3 funcionando con LocalStack | Endpoint POST /delivery-proofs | Ninguno |
| QA | Audit trail OK | Probar end-to-end con foto | Latencia red local |

### Día 5 — Viernes

| Miembro | Ayer | Hoy | Impedimentos |
|---|---|---|---|
| Frontend Dev | Firma digital OK | Captura DNI + integración | Ninguno |
| Backend Dev | Endpoint OK + tests integración | Refactor con MapStruct | Ninguno |
| QA | E2E con red local OK | Pruebas de aceptación Sprint Review | Ninguno |

---

## Tabla 31. Sprint Retrospective (consolidada de 4 sprints)

### Sprint 1 — Fundación

| Tipo | Detalle |
|---|---|
| Start | Establecer convenciones de naming en endpoints REST |
| Stop | Mezclar tareas de seguridad con tareas de CRUD en la misma rama |
| Continue | Daily standup de 15 minutos al inicio del día |

### Sprint 2 — Núcleo de Negocio

| Tipo | Detalle |
|---|---|
| Start | Pair programming para queries R2DBC complejas |
| Stop | Subestimar el tiempo de migración de esquema |
| Continue | Tests unitarios antes de marcar HU como completa |

### Sprint 3 — App Móvil

| Tipo | Detalle |
|---|---|
| Start | Validar diseño UI con conductor real antes de implementar |
| Stop | Probar solo en emulador (usar dispositivo físico) |
| Continue | Buena documentación de permisos Android/iOS |

### Sprint 4 — Reportes y Cierre

| Tipo | Detalle |
|---|---|
| Start | Validar cálculos estadísticos con un experto antes de codificar |
| Stop | Asumir formato de fichas sin revisar el Anexo 2 original |
| Continue | Demos al cliente al final de cada sprint |

---

## Tabla 32. Scrum Board (al cierre del Sprint 3)

### Sprint Board Visual

```
| TO DO                | IN PROGRESS                | DONE                          |
|----------------------|----------------------------|-------------------------------|
| HU09 — WebSocket GPS | HU08 — Captura DNI         | HU01 — Login Keycloak ✅      |
| HU10 — KPI Dashboard | HU12 — Modo offline (50%)  | HU02 — Conductores CRUD ✅    |
| HU11 — Export PDF    |                            | HU03 — Vehículos CRUD ✅      |
| HU13 — Dark mode     |                            | HU04 — Pedidos + validación ✅|
| HU14 — Notificaciones|                            | HU05 — Rutas + asignación ✅  |
|                      |                            | HU06 — Hoja ruta móvil ✅     |
|                      |                            | HU07 — Cambio estado ✅       |
|                      |                            | HU08 — Foto + Firma ✅        |
```

---

## Tabla 33. Burndown Chart — Valores por Sprint

### Sprint 1 (2 semanas, 17 SP)

| Día | SP Restantes |
|---|---|
| 0 (Lunes S1) | 17 |
| 2 | 15 |
| 4 | 12 |
| 6 | 9 |
| 8 (Lunes S2) | 7 |
| 10 | 4 |
| 12 | 2 |
| 14 (Cierre) | 0 |

### Sprint 2 (2 semanas, 15 SP)

| Día | SP Restantes |
|---|---|
| 0 | 15 |
| 2 | 13 |
| 4 | 11 |
| 6 | 7 |
| 8 | 5 |
| 10 | 3 |
| 12 | 1 |
| 14 | 0 |

### Sprint 3 (2 semanas, 17 SP)

| Día | SP Restantes |
|---|---|
| 0 | 17 |
| 2 | 16 |
| 4 | 13 |
| 6 | 11 |
| 8 | 9 |
| 10 | 6 |
| 12 | 3 |
| 14 | 1 (HU12 trasladada al Sprint 4) |

### Sprint 4 (2 semanas, 19 SP — incluye SP trasladado)

| Día | SP Restantes |
|---|---|
| 0 | 19 |
| 2 | 17 |
| 4 | 14 |
| 6 | 10 |
| 8 | 7 |
| 10 | 4 |
| 12 | 2 |
| 14 | 0 ✅ |

### Resumen Burndown del proyecto completo

| Sprint | SP planificados | SP ejecutados | % Cumplimiento |
|---|---|---|---|
| Sprint 1 | 17 | 17 | 100% |
| Sprint 2 | 15 | 15 | 100% |
| Sprint 3 | 17 | 16 | 94% |
| Sprint 4 | 19 | 20 | 105% (incluye SP del S3) |
| **TOTAL** | **68** | **68** | **100%** |

> **Cómo generar el gráfico burndown en Excel:** Crear una columna "Día" (0 al 14) y otra "SP Ideal" (línea recta de 19 → 0). Agregar la columna "SP Real" con los valores de arriba. Insertar un gráfico de líneas con ambas series. Esta sería la "Figura 28 — Burndown Chart" referenciada en el Anexo 8.

---

## Tabla adicional — Capacidad del Equipo

| Rol | Horas/día | Días/sprint | SP/sprint |
|---|---|---|---|
| Frontend Dev | 6 | 10 | 8-10 |
| Backend Dev | 6 | 10 | 8-10 |
| QA | 4 | 10 | 4-5 |
| Tech Lead | 2 | 10 | 2-3 |
| **TOTAL EQUIPO** | **18** | **10** | **22-28** |

> Para el proyecto en cuestión, el equipo trabajó como **un único developer full-stack** que cubrió todos los roles, lo que explica los SPs planificados por sprint en el rango 15-19.
