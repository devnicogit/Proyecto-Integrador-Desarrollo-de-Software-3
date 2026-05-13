# Acta de Constitución del Proyecto

## Información General

| Campo | Detalle |
|---|---|
| **Nombre del Proyecto** | EcoRoute — Aplicativo móvil para la gestión administrativa en empresa de transporte de carga |
| **Cliente** | Grupo MICOTRANS S.A.C. |
| **Ubicación** | Distrito de Puente Piedra, Lima — Perú |
| **Patrocinador del proyecto** | Gerencia General de Grupo MICOTRANS S.A.C. |
| **Sponsor académico** | Universidad César Vallejo — Escuela Profesional de Ingeniería de Sistemas |
| **Investigador / Desarrollador** | Campos Vargas, Kevin Stip (ORCID: 0000-0002-6087-3626) |
| **Asesor académico** | Dr. Estrada Aro, Wilibaldo Marcelino (ORCID: 0000-0003-4297-2994) |
| **Fecha de inicio** | 02 de marzo de 2026 |
| **Fecha de cierre** | 31 de mayo de 2026 |
| **Duración estimada** | 13 semanas (4 sprints de 2 semanas + fase de evaluación pre/post) |
| **Presupuesto** | Académico (sin costo monetario para la empresa) |

---

## 1. Justificación del Proyecto

Grupo MICOTRANS S.A.C., empresa de transporte de carga ubicada en Puente Piedra, opera con métodos manuales para el registro de pedidos, asignación de rutas y confirmación de entregas. Esta gestión administrativa manual genera ineficiencias operativas medidas por tres indicadores clave:

- **Integridad de Datos Registrados (IID)** = 60.0% (40% de registros con información incompleta — RUC truncado).
- **Cumplimiento de Hoja de Ruta (CHR)** = 67.3% (32.7% de entregas no concretadas).
- **Tasa de Disponibilidad de Evidencias Digitales (TDE)** = 51.3% (48.7% sin respaldo digital).

Estas ineficiencias afectan la facturación, la atención al cliente y la competitividad de la empresa. El proyecto se justifica por la necesidad urgente de digitalizar el ciclo administrativo.

## 2. Objetivo General del Proyecto

Diseñar, desarrollar e implementar el sistema EcoRoute (panel administrativo web + aplicativo móvil) para optimizar la gestión administrativa de Grupo MICOTRANS S.A.C., logrando una mejora medible en los indicadores IID, CHR y TDE.

## 3. Objetivos Específicos

| # | Objetivo | Indicador asociado |
|---|---|---|
| 1 | Digitalizar el registro de pedidos con validación obligatoria de campos críticos | IID |
| 2 | Implementar asignación de rutas con seguimiento GPS en tiempo real | CHR |
| 3 | Habilitar captura de evidencia digital integrada (foto + firma + DNI) | TDE |
| 4 | Producir reportes y fichas exportables que sustenten la mejora estadística | Los tres |

## 4. Alcance del Proyecto

### Dentro del alcance

- Panel administrativo web para gestión de pedidos, rutas, conductores, vehículos, usuarios.
- Aplicativo móvil Android/iOS (Flutter) para conductores con cámara, firma y GPS.
- Backend reactivo (Spring WebFlux + R2DBC) con arquitectura hexagonal.
- Autenticación delegada a Keycloak (OAuth2/OIDC).
- Integración con AWS S3 (LocalStack en desarrollo) para almacenamiento de evidencias.
- Dashboard de KPIs con cálculo automático de IID, CHR y TDE.
- Exportación de fichas en formato CSV y PDF (Anexo 2).
- Documentación técnica y manuales de usuario.
- Pruebas unitarias e integrales.

### Fuera del alcance

- Compra de hardware GPS dedicado (se usan los celulares de los conductores).
- Integración con sistemas ERP (SAP, Oracle Financials, etc.).
- Integración profunda con SUNAT (facturación electrónica).
- Provisión de dispositivos móviles (los entrega MICOTRANS).
- Producción en cloud público (Azure/AWS) — el alcance es desarrollo local con Docker.

## 5. Entregables

| Entregable | Fecha | Responsable |
|---|---|---|
| Acta de Constitución firmada | Semana 0 | Sponsor + Investigador |
| Esquema E-R y arquitectura | Semana 1 | Investigador |
| Sprint 1: Autenticación + CRUD conductores/vehículos | Semana 2 | Investigador |
| Sprint 2: CRUD pedidos + Rutas | Semana 4 | Investigador |
| Sprint 3: App móvil completa | Semana 6 | Investigador |
| Sprint 4: GPS + Reportes + KPIs | Semana 8 | Investigador |
| Datos pre-test consolidados | Semana 7 | Investigador + MICOTRANS |
| Sistema desplegado en MICOTRANS | Semana 8 | Investigador |
| Datos post-test consolidados | Semana 13 | Investigador + MICOTRANS |
| Análisis estadístico final | Semana 13 | Investigador |
| Manual técnico y de usuario | Semana 13 | Investigador |
| Tesis final aprobada | Semana 14+ | Investigador |

## 6. Stakeholders

| Stakeholder | Rol | Interés |
|---|---|---|
| Gerente General MICOTRANS | Sponsor del proyecto | Mejora de competitividad |
| Jefe de Operaciones MICOTRANS | Usuario clave (DISPATCHER) | Eficiencia operativa |
| Personal administrativo (3 personas) | Usuarios (ADMIN/DISPATCHER) | Reducir tiempo en registros |
| Conductores (5 personas) | Usuarios finales (DRIVER) | Herramientas claras y rápidas |
| Asesor UCV | Validador académico | Cumplimiento metodológico |
| Investigador | Líder técnico | Aprobación de tesis |
| Jurado de sustentación | Evaluadores | Rigor académico |

## 7. Riesgos Identificados

| ID | Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|---|
| R01 | Conductores rechazan adopción del aplicativo | Media | Alto | Capacitación + acompañamiento sprint 3 |
| R02 | Fallas de conectividad en zonas periféricas | Alta | Medio | Modo offline con sincronización automática |
| R03 | Datos pre-test entregados con retraso por MICOTRANS | Media | Alto | Solicitar formalmente antes del Sprint 1 |
| R04 | Cambios de scope durante el desarrollo | Media | Medio | Definir MoSCoW estricto, congelar tras Sprint 2 |
| R05 | Asesor o jurado rechaza enfoque metodológico | Baja | Crítico | Validación temprana de instrumentos por juicio de expertos |
| R06 | Pérdida de credenciales o datos sensibles | Baja | Alto | Keycloak + variables de entorno + no hardcoded |

## 8. Hitos del Proyecto

```
Semana  0: Firma de Acta + Autorización MICOTRANS (Anexo 5)
Semana  1: Validación de instrumentos por 3 expertos (Anexo 3)
Semana  2: Cierre Sprint 1 (Login + CRUD básicos)
Semana  4: Cierre Sprint 2 (Núcleo Pedidos/Rutas)
Semana  6: Cierre Sprint 3 (App móvil funcional)
Semana  7: Recopilación pre-test (150 registros manuales)
Semana  8: Cierre Sprint 4 + Despliegue en MICOTRANS
Semana  9-13: Operación con sistema (post-test)
Semana 13: Análisis estadístico + redacción Resultados
Semana 14: Sustentación de tesis
```

## 9. Criterios de Aceptación

El proyecto se considerará exitoso si se cumplen TODOS los siguientes criterios:

- ✅ El sistema captura los 3 indicadores correctamente y permite exportarlos.
- ✅ Los conductores logran usar la app móvil sin intervención del investigador después de la capacitación.
- ✅ Los indicadores post-test superan en al menos 25 puntos porcentuales a los pre-test (objetivo de mejora).
- ✅ La prueba t de Student arroja p < 0.05 en los tres indicadores.
- ✅ El asesor académico aprueba la versión final.
- ✅ Grupo MICOTRANS firma el acta de conformidad de los entregables.

## 10. Aprobaciones

| Rol | Nombre | Firma | Fecha |
|---|---|---|---|
| **Sponsor (Gerente MICOTRANS)** | _______________________ | _______________ | ___/___/2026 |
| **Asesor académico** | Dr. Estrada Aro Wilibaldo Marcelino | _______________ | ___/___/2026 |
| **Investigador** | Campos Vargas Kevin Stip | _______________ | ___/___/2026 |

---

> **Acta emitida el ___ de ___________________ de 2026, en cumplimiento de los lineamientos de gestión de proyectos del PMBOK (PMI) adaptados al marco ágil Scrum aplicado en esta investigación.**
