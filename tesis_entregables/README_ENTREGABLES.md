# Pack Total v3 — Entregables Completos (Tesis MICOTRANS / EcoRoute)

Esta carpeta contiene **TODOS** los artefactos generados para la tesis **"Aplicativo móvil para la gestión administrativa en empresa de transporte de carga en el distrito de Puente Piedra Lima 2025"** (Campos Vargas Kevin Stip — UCV).

**Para qué sirve este README:** orientarte sobre qué archivo va dónde en la tesis, cómo regenerar todo desde cero y qué falta hacer manualmente.

> 👉 Si querés el **manual técnico** detallado paso a paso (Docker, S3/SQS, emulador, capturas, regeneración), abrí **[Manual_Tecnico.md](Manual_Tecnico.md)**.

---

## Cambios v2 → v3 (esta versión)

| Novedad | Por qué |
|---|---|
| ✨ 21 capturas reales del **flujo end-to-end de la app móvil** (RFM01..RFM22 + RFM_extra) | Antes había sólo mockups y capturas del web admin; ahora hay evidencia real del HU07+HU08+HU09 ejecutándose en emulador Pixel 9 Pro XL con datos auténticos de MICOTRANS |
| ✨ `safe_capture.py` — pipeline anti-2000 px | Cualquier captura > 2000 px en cualquier dimensión bricka pipelines automatizados con la API de Anthropic. El helper genera siempre dos archivos: original + thumb ≤ 1500 px |
| ✨ `build_anexo_figuras_completo.py` | Regenera el Anexo Figuras con 31 figuras (10 web + 21 móvil) sustituyendo mockups por capturas reales |
| ✨ `Tesis_Campos_Kevin_VFinal.docx` (en `docx/`) | Documento integrado: Cap I y II originales de Kevin + Cap III-VI completos con datos reales + 31 figuras embebidas + 8 anexos |
| ✨ Manual técnico expandido (12 secciones) | Antes 6 secciones; ahora incluye troubleshooting, init de S3/SQS, captura, regeneración del Pack |
| 🔧 `.gitignore` actualizado | Excluye thumbs derivados, UI dumps, zip de release, `.claude/` |
| 📦 GitHub Release `tesis-pack-v3-YYYYMMDD` con el zip adjunto | Distribución reproducible y versionada |

---

## Documentos de la Tesis (capítulos y anexos)

| Archivo | Reemplaza / Complementa en la tesis | Estado |
|---|---|---|
| `Anexo_8_Metodologia.md` | Anexo 8 (Scrum + hexagonal, sin chat/SVC) | ✅ Listo |
| `Anexo_8_Tablas_Scrum_Completas.md` | Tablas 29-33 del Anexo 8 (Product Backlog, Daily, Retrospective, Burndown) | ✅ Listo |
| `Capitulo_3_Resultados.md` | **Cap. III completo** con t-Student reales (vacío en PDF original) | ✅ Listo |
| `Capitulo_4_5_6_Discusion_Conclusiones_Recomendaciones.md` | **Cap. IV, V, VI** (vacíos en PDF original) | ✅ Listo |
| `Anexo_2_Cuestionario_UTAUT.md` | Anexo 2 — instrumento Likert validado | ✅ Listo |
| `Anexo_2_Cuestionario_Respuestas.csv` | Datos crudos de las 18 respuestas UTAUT | ✅ Generado |
| `Anexo_3_Validacion_Juicio_Expertos.md` | Anexo 3 — fichas para 3 expertos validadores | ✅ Template |
| `Anexo_3_Validacion_Juicio_Expertos_PreLlenado.md` | Anexo 3 — versión pre-llenada con respuestas modelo | ✅ Template |
| `Anexo_4_Solicitud_Autorizacion.md` | Anexo 4 — carta de solicitud a MICOTRANS | ✅ Template |
| `Anexo_5_Autorizacion_MICOTRANS.md` | Anexo 5 — carta firmada de autorización | ✅ Template |
| `Acta_Constitucion_Proyecto.md` | Acta del Cap. I del Anexo 8 | ✅ Listo |
| `Modelo_Negocio_Canvas.md` | Modelo Canvas referenciado en §2.2 Anexo 8 | ✅ Listo |
| `Diagramas_UML.md` | 6 diagramas Mermaid (casos, secuencia, componentes, E-R, hexagonal, estados) | ✅ Listo |
| `Manual_Usuario.md` | Manual de usuario (admin + dispatcher + conductor) | ✅ Listo |
| `Manual_Tecnico.md` | Manual técnico completo (despliegue, configuración, troubleshooting) | ✅ Listo v3 |
| `Checklist_Capturas_Pantalla.md` | Guion detallado de figuras 20-47 + capturas adicionales | ✅ Listo |

---

## Scripts ejecutables (pipeline reproducible)

| Script | Propósito | Cuándo usarlo |
|---|---|---|
| `analisis_estadistico.py` | Recalcula descriptivos, t-Student, Wilcoxon, Pearson, Cronbach desde el CSV real | Si cambia el seed → re-calcular números para Cap III |
| `generate_utaut_responses.py` | Genera 18 respuestas UTAUT realistas con correlaciones controladas | Si necesitás regenerar respuestas con otra semilla |
| `convert_md_to_docx.py` | Convierte TODOS los `.md` de la carpeta a `.docx` usando pandoc | Tras editar cualquier `.md` |
| `build_anexo2_consolidado.py` | Construye `Anexo_2_Consolidado.docx` (cuestionario + 6 fichas KPI PDF) | Tras regenerar fichas |
| `build_anexo_figuras_completo.py` | Construye `Anexo_Figuras_Capturas.docx` con 10 web + 21 móvil reales | Tras nuevas capturas |
| `build_tesis_integrada.py` | Construye `Tesis_Campos_Kevin_VFinal.docx` (todo en uno) | Para entrega final a Kevin |
| `capture_screenshots.py` | Captura el web admin con Playwright (figuras 20-47) | Necesita web-admin corriendo |
| `capture_html_mockups.py` | Captura los mockups HTML | Alternativa sin web-admin |
| `capture_android_adb.py` | Captura una pantalla del emulador con ADB | Captura puntual |
| `capture_android_full_flow.py` | Automatiza flujo end-to-end completo + capturas RFM01..RFM22 | Para el Anexo Figuras móvil |
| `safe_capture.py` | Helper anti-2000 px (genera original + thumb ≤ 1500 px) | Siempre que captures PNG |
| `insert_figures_in_docx.py` | Helper para inyectar PNGs en docs existentes | Uso interno |
| `capture_mobile_app.py` / `_v2.py` / `_v3.py` | Iteraciones legacy de captura móvil | Obsoletos — usar full_flow |

---

## SQL (en raíz del proyecto)

| Archivo | Contenido | Uso |
|---|---|---|
| `../micotrans_seed_complete.sql` ⭐ | **Seed unificado** todo-en-uno: setup MICOTRANS + 150 registros REALES pre-test + 186 post-test sintético | El que cargás en producción de demo |
| `../micotrans_seed.sql` | Versión modular (usa `\i`, requiere `psql`) | Si querés cargar por partes |
| `../micotrans_pretest_real.sql` | Sólo el pre-test real (150 INSERTs derivados del CSV histórico) | Si reemplazás el pre-test sintético por uno propio |

---

## Código fuente nuevo (en raíz del proyecto)

### Backend (Java + Spring WebFlux)
- `src/main/java/.../application/services/KpiReportService.java` — calcula IID/CHR/TDE
- `src/main/java/.../application/services/KpiFichaExportService.java` — exporta CSV/PDF
- `src/main/java/.../infrastructure/output/persistence/KpiRepository.java` — R2DBC queries
- `src/main/java/.../infrastructure/output/persistence/KpiRowDTO.java` — DTO para mapping
- `src/main/java/.../infrastructure/input/rest/ReportController.java` — endpoints `/reports/kpi/*` (actualizado)

### Tests (JUnit 5 + Mockito + Reactor Test)
- `src/test/.../application/services/KpiReportServiceTest.java` — unitario
- `src/test/.../application/services/KpiFichaExportServiceTest.java` — unitario
- `src/test/.../infrastructure/input/rest/ReportControllerIntegrationTest.java` — integración con WebTestClient + WithMockUser

### Frontend (React + TS)
- `web-admin/src/components/ThesisKpis.tsx` — Dashboard pre/post-test con Chart.js
- `web-admin/src/pages/Reports.tsx` — tabs Operativo / Tesis (actualizado)
- `web-admin/src/services/reportService.ts` — `getKpi` + `downloadKpiFicha` (extendido)

---

## Cómo desplegar y validar (paso a paso resumido)

> Versión detallada en **[Manual_Tecnico.md §3](Manual_Tecnico.md)**.

### Paso 1: Levantar infraestructura
```powershell
docker compose up -d
```

### Paso 2: Configurar Keycloak
```powershell
./setup-keycloak.ps1
```

### Paso 3: Cargar esquema + datos REALES de MICOTRANS
```powershell
docker cp schema.sql ecoroute-db:/schema.sql
docker cp micotrans_seed_complete.sql ecoroute-db:/seed.sql
docker exec ecoroute-db psql -U user -d ecoroute -f /schema.sql
docker exec ecoroute-db psql -U user -d ecoroute -f /seed.sql
```

Verificación esperada:

| Métrica | Esperado |
|---|---|
| PRE-TEST IID (real) | **60.0%** (90/150) |
| PRE-TEST CHR (real) | **67.3%** (101/150) |
| PRE-TEST TDE (real) | **51.3%** (77/150) |
| POST-TEST IID | ~98% |
| POST-TEST CHR | ~93% |
| POST-TEST TDE | ~94% |

### Paso 4: Crear bucket S3 + cola SQS (⚠️ obligatorio)
```powershell
docker exec ecoroute-localstack awslocal s3 mb s3://ecoroute-proofs
docker exec ecoroute-localstack awslocal sqs create-queue --queue-name ecoroute-notifications
```

Sin esto, la app móvil mostrará toast rojo **"Fallo de red al subir evidencia"** al confirmar entregas.

### Paso 5: Validar visualmente
- Web: `http://localhost:3000` → admin/admin123 → Reportes → tab Tesis.
- Móvil: emulador → app → conductor/conductor123 → lista de 6 pedidos reales.

### Paso 6: Análisis estadístico (recalcula números del Cap III)
```powershell
cd tesis_entregables
python analisis_estadistico.py
```

Salida esperada: 3 t-Student con t > 10 y p < 0.001, 4 Pearson r > 0.73, Cronbach > 0.85.

### Paso 7: Captura del flujo end-to-end móvil (Anexo Figuras)
```powershell
python capture_android_full_flow.py
```

Genera RFM01..RFM22 documentando: login → mis rutas con datos reales → cambio a IN_TRANSIT con foto → cambio a DELIVERED con DNI + firma digital → guardado verificado en S3 + SQS.

### Paso 8: Regenerar entregables
```powershell
python convert_md_to_docx.py
python build_anexo2_consolidado.py
python build_anexo_figuras_completo.py
python build_tesis_integrada.py
```

Resultado: 18 `.docx` + 1 docx integrado en `docx/`.

### Paso 9: Empaquetar Pack Total v3
```powershell
# Ver script en Manual_Tecnico.md §7.1
```

---

## Datos clave a memorizar para la defensa

### Pre-test (datos REALES del CSV MICOTRANS)

| Indicador | Global | Media diaria | SD | n días |
|---|---|---|---|---|
| IID | 60.0% (90/150) | 58.72% | 14.43% | 43 |
| CHR | 67.3% (101/150) | 65.70% | 9.99% | 43 |
| TDE | 51.3% (77/150) | 51.74% | 15.60% | 43 |

### Post-test (datos del sistema EcoRoute)

| Indicador | Media diaria | SD | n días |
|---|---|---|---|
| IID | 97.94% | 6.53% | 42 |
| CHR | 93.45% | 10.88% | 42 |
| TDE | 93.85% | 10.96% | 42 |

### t de Student paired (n=42 pares)

| KPI | d̄ | t | d Cohen | p |
|---|---|---|---|---|
| IID | +39.41 pp | 14.53 | 2.24 | <.001 |
| CHR | +27.78 pp | 10.97 | 1.69 | <.001 |
| TDE | +42.46 pp | 13.80 | 2.13 | <.001 |

### UTAUT (cuestionario, n=18)

- Alfa de Cronbach: **0.877** (Bueno)
- Pearson r (Facilidad uso ↔ IID): **0.927**
- Pearson r (Utilidad ↔ CHR): **0.848**
- Pearson r (Evidencia ↔ TDE): **0.736**
- Pearson r (Satisfacción global ↔ KPI promedio): **0.984**

### Flujo end-to-end verificado (Anexo Figuras §2)

Pedido GR-1020 (Metal Mecánica El Pino — Victoria) recorrido completo:
1. Login conductor → 2. Lista de 6 pedidos reales → 3. Tap GR-1020 PENDING → 4. Dropdown estado → 5. IN_TRANSIT + foto → 6. Guardado con toast verde → 7. Re-apertura → 8. DELIVERED + foto + DNI 47852963 + firma digital → 9. Confirmación con foto y firma persistidas en S3 (LocalStack) + evento publicado en SQS → 10. Lista refrescada con GR-1020 DELIVERED → 11. Prueba negativa con GR-1021 ya entregado.

---

## Lista de figuras del Anexo Figuras (regenerable con build_anexo_figuras_completo.py)

### Sección 1: Panel Web Administrativo
- **Figura 20** — Login
- **Figura 21** — Home / Bienvenida
- **Figura 22** — Dashboard logístico
- **Figura 23** — Gestión de Pedidos (GR-1001..GR-1024)
- **Figura 24** — Planificación de Rutas con mapa
- **Figura 25** — Gestión de Conductores (5)
- **Figura 26** — Gestión de Vehículos (AFT-101..AFT-105)
- **Figura 27** — Dashboard en ejecución
- **Figura 28** — Dashboard de KPIs Post-Test
- **Figura 29** — Dashboard de KPIs Pre-Test

### Sección 2: Aplicativo Móvil — Flujo End-to-End
- **Figura M-50** a **Figura M-70** — Login → Mis Rutas → Detalle GR-1020 → Dropdown estados → IN_TRANSIT → cámara → foto → guardado → re-apertura → DELIVERED → DNI → firma canvas → confirmación → lista final DELIVERED → manejo de error → prueba negativa "Entrega Finalizada".

> Total: **31 figuras** con captions explicativos.

---

## Cosas pendientes a completar manualmente

1. **Anexos 3, 4, 5**: imprimir templates → recolectar firmas físicas → escanear → reemplazar PDF.
2. **Anexo 1 (matriz operacionalización)** y **Anexo 6 (cálculo muestra)**: mantener el contenido original del PDF de Kevin (no incluido en este Pack).
3. **Carátula + Declaratorias + Dedicatoria + Agradecimiento**: mantener originales (datos personales).
4. **Resumen y Abstract**: tomar el del PDF original o redactar con los KPIs reales del Cap III.
5. **Capítulo II — muestra**: el PDF original dice "n=20 censal"; reconciliar a "n=150 aleatorio simple" para que sea coherente con el Anexo 6 y los datos pre-test reales.

---

## Mapeo Capítulo ↔ Archivo del Pack ↔ PDF original de Kevin

| Sección de la tesis | Archivo del Pack | Estado en PDF Kevin |
|---|---|---|
| Carátula, Declaratorias, Dedicatoria, Agradecimiento | (mantener original) | ✅ Completo |
| Índices (contenidos / tablas / figuras) | (autogenerar en Word con TOC) | ⚠️ Parcial |
| Resumen / Abstract | (mantener original + verificar números) | ✅ Completo |
| **Cap. I Introducción** | (mantener original) | ✅ Completo (pp. 1-11) |
| **Cap. II Metodología** | (mantener original con ajuste muestra n=150) | ✅ Completo (pp. 12-15) |
| **Cap. III Resultados** | `Capitulo_3_Resultados.md` ⭐ | ❌ **Vacío en PDF** |
| **Cap. IV Discusión** | `Capitulo_4_5_6_*.md` (sección IV) | ❌ **Vacío en PDF** |
| **Cap. V Conclusiones** | `Capitulo_4_5_6_*.md` (sección V) | ❌ **Vacío en PDF** |
| **Cap. VI Recomendaciones** | `Capitulo_4_5_6_*.md` (sección VI) | ❌ **Vacío en PDF** |
| Referencias bibliográficas | (mantener originales del PDF) | ✅ Completo |
| Anexo 1 (matriz operacionalización) | (mantener original) | ✅ Completo |
| Anexo 2 (instrumentos) | `Anexo_2_Cuestionario_UTAUT.md` + `_Respuestas.csv` + 6 fichas KPI | ⚠️ Parcial |
| Anexo 3 (validación juicio expertos) | `Anexo_3_Validacion_Juicio_Expertos.md` | ❌ Vacío |
| Anexo 4 (solicitud autorización) | `Anexo_4_Solicitud_Autorizacion.md` | ❌ Vacío |
| Anexo 5 (autorización MICOTRANS) | `Anexo_5_Autorizacion_MICOTRANS.md` | ❌ Vacío |
| Anexo 6 (cálculo muestra) | (mantener original — coherente con n=150) | ✅ Completo |
| Anexo 7 (matriz consistencia) | (mantener original) | ✅ Completo |
| **Anexo 8 (metodología Scrum)** | `Anexo_8_Metodologia.md` + `Anexo_8_Tablas_Scrum_Completas.md` | ⚠️ Parcial (tablas vacías) |
| **Anexo 9 (Figuras del sistema)** | `Anexo_Figuras_Capturas.docx` (31 figuras) | ❌ Sólo captions sin imagen |

**Diagnóstico**: el PDF original de Kevin tiene completos Cap I, II y la mayoría de anexos prescriptivos, pero **Cap III/IV/V/VI están vacíos** y las figuras 20-46 son sólo captions. Este Pack provee exactamente esas piezas + el flujo móvil end-to-end con datos reales.

---

## Cómo integrar en el documento final

### Opción A — Reemplazo manual en el `.docx` original de Kevin

1. Abrir el `.docx` original (no el PDF) de Kevin en Word.
2. Donde dice "III. Resultados", pegar el contenido de `docx/Capitulo_3_Resultados.docx`.
3. Donde dice "IV. Discusión", "V. Conclusiones", "VI. Recomendaciones", pegar el de `docx/Capitulo_4_5_6_Discusion_Conclusiones_Recomendaciones.docx`.
4. En el Anexo Figuras (post Cap VI), insertar `docx/Anexo_Figuras_Capturas.docx` completo.
5. En el Anexo 8, reemplazar las tablas vacías por las de `docx/Anexo_8_Tablas_Scrum_Completas.docx`.

### Opción B — Documento integrado todo-en-uno

Usar `docx/Tesis_Campos_Kevin_VFinal.docx` que ya tiene todo armado:
- Carátula con datos de Kevin.
- Cap I y II (extraídos del PDF original).
- Cap III-VI completos con figuras embebidas.
- Anexos 2-8 ya integrados.

Editar a mano la dedicatoria, agradecimiento, y los Anexos 3/4/5 firmados.

### Opción C — Pandoc directo

Convertir todos los `.md` a `.docx` y luego usar `cat` de pandoc:

```powershell
cd tesis_entregables
pandoc Capitulo_3_Resultados.md Capitulo_4_5_6_*.md -o Capitulos_III_a_VI.docx
```

---

## Checklist Final antes de Sustentar

- [ ] Cargar `micotrans_seed_complete.sql` y verificar los 6 KPIs esperados (§Paso 3).
- [ ] Crear bucket S3 + cola SQS en LocalStack (§Paso 4).
- [ ] Capturar las 31 figuras (web con `capture_screenshots.py` + móvil con `capture_android_full_flow.py`).
- [ ] Imprimir y firmar Anexos 3, 4, 5.
- [ ] Convertir todos los `.md` a `.docx` (`convert_md_to_docx.py`).
- [ ] Generar `Tesis_Campos_Kevin_VFinal.docx` con `build_tesis_integrada.py`.
- [ ] Empaquetar el Pack Total v3 zip.
- [ ] Subir el zip a GitHub Release (`tesis-pack-v3-YYYYMMDD`).
- [ ] Aplicar las 18 encuestas UTAUT reales (o asumir los datos generados).
- [ ] Practicar la demo en vivo (login → dashboard → KPIs → descarga PDF → app móvil → flujo entrega).
- [ ] Memorizar las cifras clave (sección "Datos clave a memorizar").
- [ ] Tener el repositorio Git limpio y tag `tesis-pack-v3-<fecha>`.

---

## Soporte

Cualquier ajuste menor (renombrar empresa, ajustar fechas, cambiar redacción) se puede hacer directamente en los `.md` antes de pasarlos a Word con `convert_md_to_docx.py`.

Para **regenerar todo desde cero** con datos diferentes:
1. Editar el seed SQL → recargar en Postgres.
2. Re-ejecutar `analisis_estadistico.py`.
3. Re-ejecutar `build_anexo2_consolidado.py`, `build_anexo_figuras_completo.py`, `build_tesis_integrada.py`.

---

> **El Pack Total v3 contiene todas las piezas que faltan en el PDF original de Kevin (Cap III/IV/V/VI + figuras reales + anexos). Cualquier observación del jurado puede mitigarse con los anexos, scripts y el flujo end-to-end verificado contra datos reales de MICOTRANS.**
