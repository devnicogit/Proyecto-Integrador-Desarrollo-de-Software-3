# Modelo de Negocio Canvas — Sistema EcoRoute para Grupo MICOTRANS S.A.C.

## Visión a una página (Business Model Canvas)

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                      MODELO DE NEGOCIO — ECOROUTE / MICOTRANS                       │
├──────────────────┬──────────────────┬──────────────────┬──────────────────┬─────────┤
│  SOCIOS CLAVE    │  ACTIVIDADES     │   PROPUESTA      │   RELACIÓN       │ SEGMENTO│
│                  │      CLAVE       │   DE VALOR       │   CON CLIENTES   │CLIENTES │
├──────────────────┼──────────────────┼──────────────────┼──────────────────┼─────────┤
│ • UCV (académico)│ • Recolección y  │ "Digitalización  │ • Capacitación   │ Interno:│
│ • Keycloak (auth)│   transporte de  │ del ciclo        │   in situ        │ • Admin │
│ • AWS / Local-   │   carga          │ administrativo   │ • Soporte WhatsApp│  trat.  │
│   Stack (cloud)  │ • Asignación de  │ con trazabilidad │ • Manual de uso  │ • Disp. │
│ • Proveedor      │   rutas óptimas  │ digital de       │                  │ • Cond. │
│   celulares      │ • Captura de     │ pedidos, rutas   │                  │         │
│ • SUNAT (RUC     │   evidencias en  │ y entregas que   │                  │ Externo:│
│   validación)    │   tiempo real    │ eleva IID 60→98%,│                  │ • PYMES │
│                  │ • Generación de  │ CHR 67→93%,      │                  │  Lima   │
├──────────────────┤   KPIs           │ TDE 51→94%."     ├──────────────────┤  Norte  │
│  RECURSOS CLAVE  │                  │                  │   CANALES        │ • Empre │
├──────────────────┤                  │                  ├──────────────────┤  -sas   │
│ • 5 conductores  │                  │                  │ • Panel web      │  cliente│
│ • 5 vehículos    │                  │                  │   en navegador   │  de     │
│ • Plataforma     │                  │                  │ • App móvil      │  trans- │
│   EcoRoute       │                  │                  │   Android/iOS    │  porte  │
│ • Servidor       │                  │                  │ • WhatsApp para  │  de     │
│   (Docker local) │                  │                  │   soporte        │  carga  │
│ • BD PostgreSQL  │                  │                  │                  │         │
├──────────────────┴──────────────────┴──────────────────┴──────────────────┴─────────┤
│                ESTRUCTURA DE COSTOS              │           FUENTES DE INGRESOS    │
├──────────────────────────────────────────────────┼──────────────────────────────────┤
│ • Desarrollo (S/0 — académico)                   │ Por mejora operativa de MICOTRANS:│
│ • Servidor / hosting (S/200/mes producción)      │ • Reducción de horas-hombre admin │
│ • Datos móviles para conductores (S/40 × 5)      │   = S/2,400/mes                   │
│ • Capacitación y soporte (S/0 inicial)           │ • Reducción de disputas con clien │
│ • Mantenimiento y actualizaciones (S/300/mes)    │   = S/1,800/mes (estimado)        │
│ • Capacidades Keycloak/PostgreSQL/LocalStack:    │ • Aceleración ciclo facturación   │
│   open-source (S/0)                              │   = S/2,500/mes (liquidez)        │
│                                                  │ • Reducción de errores en RUC y   │
│                                                  │   conciliación tributaria         │
│                                                  │   = S/500/mes                     │
│ TOTAL: ~S/700/mes (operación post-piloto)        │ TOTAL: ~S/7,200/mes               │
└──────────────────────────────────────────────────┴──────────────────────────────────┘
```

---

## Detalle de cada bloque

### 1. Segmento de Clientes (¿Para quién?)

**Cliente principal (B2B):** Grupo MICOTRANS S.A.C. y, potencialmente, otras pymes de transporte de carga en Lima Norte (Puente Piedra, Comas, Los Olivos, Carabayllo).

**Usuarios finales internos:**
- Conductores (5 actualmente)
- Personal administrativo y de operaciones (6-8 personas)
- Gerencia (3 personas)

**Clientes externos (que reciben las cargas):** beneficiarios indirectos del aplicativo a través de mejor servicio y trazabilidad.

### 2. Propuesta de Valor (¿Qué ofrecemos?)

**Para la empresa:** Digitalización integral del ciclo administrativo del transporte, eliminando registros incompletos, asegurando cumplimiento de rutas y centralizando las evidencias digitales. Resultado medible: IID 60→98%, CHR 67→93%, TDE 51→94%.

**Para los conductores:** Una herramienta móvil sencilla que reemplaza papeles y llamadas, con modo offline para zonas sin señal.

**Para la gerencia:** KPIs en tiempo real para la toma de decisiones basadas en datos, no en percepciones.

### 3. Canales (¿Cómo lo entregamos?)

- **Panel web** accesible desde cualquier navegador moderno en oficina o móvil.
- **App móvil** instalada en los celulares de los conductores (apk firmado, no por Play Store en esta fase).
- **WhatsApp Business** para soporte de primer nivel.
- **Manuales digitales** (PDF) descargables desde el panel.

### 4. Relación con Clientes

- **Onboarding personal**: capacitación in situ de 2 sesiones (admin y conductores).
- **Acompañamiento**: el investigador permanece disponible las primeras 4 semanas post-despliegue.
- **Soporte continuo**: WhatsApp para preguntas, ticketing para issues.

### 5. Fuentes de Ingresos (modelo proyectado para PMU spin-off post-tesis)

| Concepto | Modelo | Tarifa estimada |
|---|---|---|
| Licencia SaaS | Suscripción mensual por usuario activo | S/30 por usuario / mes |
| Setup inicial | Pago único por implementación | S/3,000 - S/8,000 |
| Capacitación | Por sesión | S/300 / sesión |
| Soporte premium | Pago anual | S/200 / mes |

> Para el contexto académico actual, el proyecto se entrega **sin costo** a MICOTRANS como contraparte a su autorización.

### 6. Recursos Clave

- Plataforma EcoRoute (Backend + Web + Móvil).
- Infraestructura PostgreSQL + Keycloak + LocalStack/AWS.
- Equipo técnico (1 dev full-stack inicialmente).
- Conocimiento del dominio logístico de MICOTRANS.
- Datos históricos del pre-test (150 registros base).

### 7. Actividades Clave

- Desarrollo y mantenimiento del software.
- Soporte y capacitación.
- Generación de reportes y análisis de KPIs.
- Actualizaciones funcionales (notificaciones, dark mode, etc.).
- Mejora continua de la arquitectura (resiliencia, observabilidad).

### 8. Socios Clave

- **Universidad César Vallejo** — patrocinio académico.
- **MICOTRANS** — empresa piloto y proveedor de datos reales.
- **Keycloak Project** — proveedor de identidad.
- **AWS** (en producción futura) — almacenamiento e infraestructura.
- **SUNAT** — validación de RUCs en línea (integración futura).

### 9. Estructura de Costos

- **Costos fijos** (mensuales): hosting (S/200), licencias dev tools (S/0 open-source).
- **Costos variables**: datos móviles conductores (S/40 × N), almacenamiento S3 según volumen.
- **Costos de capital humano**: 1 dev full-time en fase de desarrollo (en este caso, el investigador, sin costo monetario por ser proyecto académico).

---

## Análisis estratégico (SWOT)

| Fortalezas | Oportunidades |
|---|---|
| Stack moderno y escalable (WebFlux + R2DBC) | Mercado pyme transporte mayormente sin digitalizar |
| Arquitectura hexagonal facilita extensión | Tendencia regional de adopción digital pos-pandemia |
| Modo offline real para zonas con baja conectividad | Posible integración con SUNAT/Detracciones |

| Debilidades | Amenazas |
|---|---|
| Equipo inicial pequeño (1 dev) | Soluciones internacionales (Onfleet, Bringg) con mayor presupuesto |
| Falta de presencia comercial inicial | Inseguridad ciudadana puede dificultar la adopción móvil |
| Sin app en Play Store oficial todavía | Cambios regulatorios SUNAT podrían requerir adaptaciones costosas |
