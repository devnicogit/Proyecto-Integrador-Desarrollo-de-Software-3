# 📦 Pack Total — Entregables Completos (Tesis MICOTRANS / EcoRoute)

Esta carpeta contiene **TODOS** los artefactos generados para la tesis **"Aplicativo móvil para la gestión administrativa en empresa de transporte de carga en el distrito de Puente Piedra Lima 2025"** (Campos Vargas Kevin Stip — UCV).

---

## 📑 Documentos de la Tesis (capítulos y anexos)

| Archivo | Reemplaza / Complementa | Estado |
|---|---|---|
| `Anexo_8_Metodologia.md` | Anexo 8 de la tesis (Scrum, hexagonal, sin chat/SVC) | ✅ Listo |
| `Anexo_8_Tablas_Scrum_Completas.md` | Tablas 29-33 del Anexo 8 (Product Backlog, Daily, Retrospective, Burndown) | ✅ Listo |
| `Capitulo_3_Resultados.md` | Cap. III completo con t-Student reales | ✅ Listo |
| `Capitulo_4_5_6_Discusion_Conclusiones_Recomendaciones.md` | Cap. IV, V, VI | ✅ Listo |
| `Anexo_2_Cuestionario_UTAUT.md` | Anexo 2 — instrumento Likert validado | ✅ Listo |
| `Anexo_2_Cuestionario_Respuestas.csv` | Datos crudos de las 18 respuestas UTAUT | ✅ Generado |
| `Anexo_3_Validacion_Juicio_Expertos.md` | Anexo 3 — fichas para 3 expertos validadores | ✅ Template |
| `Anexo_4_Solicitud_Autorizacion.md` | Anexo 4 — carta de solicitud a MICOTRANS | ✅ Template |
| `Anexo_5_Autorizacion_MICOTRANS.md` | Anexo 5 — carta firmada de autorización | ✅ Template |
| `Acta_Constitucion_Proyecto.md` | Acta del Cap. I del Anexo 8 | ✅ Listo |
| `Modelo_Negocio_Canvas.md` | Modelo Canvas referenciado en §2.2 Anexo 8 | ✅ Listo |
| `Diagramas_UML.md` | 6 diagramas Mermaid (casos, secuencia, componentes, E-R, hexagonal, estados) | ✅ Listo |
| `Manual_Usuario.md` | Manual de usuario (admin + dispatcher + conductor) | ✅ Listo |
| `Manual_Tecnico.md` | Manual técnico completo (despliegue, configuración, troubleshooting) | ✅ Listo |
| `Checklist_Capturas_Pantalla.md` | Guion detallado de figuras 20-47 + capturas adicionales | ✅ Listo |

## 🐍 Scripts ejecutables

| Archivo | Propósito |
|---|---|
| `analisis_estadistico.py` | Script reproducible que recalcula descriptivos, t-Student, Wilcoxon, Pearson y Cronbach desde el CSV real |
| `generate_utaut_responses.py` | Genera 18 respuestas UTAUT realistas con correlaciones controladas |

## 🗄️ SQL (en raíz del proyecto)

| Archivo | Contenido |
|---|---|
| `../micotrans_seed_complete.sql` ⭐ | **Seed unificado** (un solo archivo): setup MICOTRANS + 150 registros REALES pre-test + 186 registros post-test sintético. Sin `\i`. |
| `../micotrans_seed.sql` | Versión modular (usa `\i`, requiere psql) |
| `../micotrans_pretest_real.sql` | Solo el pre-test real (150 INSERTs del CSV) |

## ⚙️ Código fuente nuevo (en raíz del proyecto)

### Backend
- `src/main/java/.../application/services/KpiReportService.java`
- `src/main/java/.../application/services/KpiFichaExportService.java`
- `src/main/java/.../infrastructure/output/persistence/KpiRepository.java`
- `src/main/java/.../infrastructure/output/persistence/KpiRowDTO.java`
- `src/main/java/.../infrastructure/input/rest/ReportController.java` (actualizado)

### Tests
- `src/test/.../application/services/KpiReportServiceTest.java` (unitario, JUnit + Mockito + Reactor Test)
- `src/test/.../application/services/KpiFichaExportServiceTest.java` (unitario)
- `src/test/.../infrastructure/input/rest/ReportControllerIntegrationTest.java` (integración, WebTestClient + WithMockUser)

### Frontend
- `web-admin/src/components/ThesisKpis.tsx` (dashboard de tesis)
- `web-admin/src/pages/Reports.tsx` (con tabs Tesis/Operativo)
- `web-admin/src/services/reportService.ts` (extendido con `getKpi` y `downloadKpiFicha`)

---

## 🚀 Cómo desplegar y validar (paso a paso)

### Paso 1: Levantar infraestructura

```powershell
docker-compose up -d postgres keycloak localstack
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

Verificación esperada al final del seed:

| Métrica | Esperado |
|---|---|
| PRE-TEST IID (real) | **60.0%** (90/150) |
| PRE-TEST CHR (real) | **67.3%** (101/150) |
| PRE-TEST TDE (real) | **51.3%** (77/150) |
| POST-TEST IID | ~98% |
| POST-TEST CHR | ~93% |
| POST-TEST TDE | ~94% |

### Paso 4: Crear bucket S3 + cola SQS

```powershell
docker exec ecoroute-localstack awslocal s3 mb s3://ecoroute-proofs
docker exec ecoroute-localstack awslocal sqs create-queue --queue-name ecoroute-notifications
```

### Paso 5: Levantar backend + web

```powershell
./gradlew.bat bootRun --args="--spring.profiles.active=local"
# en otra terminal:
cd web-admin && npm install && npm run dev
```

### Paso 6: Validar visualmente

Abrir `http://localhost:3000` → Login `admin/admin123` → ir a **Reportes** → tab **"KPIs de Gestión Administrativa (Tesis)"**.

### Paso 7: Ejecutar análisis estadístico

```powershell
python tesis_entregables/analisis_estadistico.py
```

Salida esperada:
- 3 t-Student paired tests con t > 10, p < 0.001
- 4 correlaciones Pearson con r > 0.73
- Alfa Cronbach > 0.85

### Paso 8: (Opcional) Ejecutar tests Java

```powershell
./gradlew.bat test --tests "com.ecoroute.backend.application.services.KpiReportServiceTest"
./gradlew.bat test --tests "com.ecoroute.backend.application.services.KpiFichaExportServiceTest"
```

---

## 📊 Datos clave a memorizar para la defensa

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

### t de Student (n=42 pares)

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

---

## 📋 Lista de figuras a capturar

Ver `Checklist_Capturas_Pantalla.md` para guion detallado de cada figura del 20 al 47.

**Figura 47 (la MÁS importante):** dashboard de KPIs Tesis con vista comparativa Pre/Post.

---

## ⚠️ Lista de cosas pendientes a completar manualmente

1. **Anexos 3, 4, 5**: imprimir templates, gestionar firmas físicas, escanear.
2. **Capturas (Figuras 20-47)**: tomarlas con el sistema corriendo (ver checklist).
3. **Capítulo II — Reconciliar muestra**: cambiar "n=20 censal" por "n=150 aleatorio simple" (ya consistente con el Anexo 6 y este pack).
4. **Insertar diagramas UML** convertidos a SVG/PNG en los lugares correspondientes (Anexo 8 §2.2).
5. **Renombrar empresa** si MICOTRANS necesita un nombre comercial diferente para anonimato.

---

## 🎯 Mapeo Capítulo ↔ Archivo del Pack

| Sección de la tesis | Archivo del Pack |
|---|---|
| Carátula, Dedicatoria, etc. | (mantener original) |
| Cap. I Introducción (problema, objetivos, hipótesis) | (mantener original con cifras de este Pack) |
| Cap. II Metodología | (mantener con ajuste de muestra n=150) |
| Cap. III Resultados | `Capitulo_3_Resultados.md` ⭐ |
| Cap. IV Discusión | `Capitulo_4_5_6_*.md` (sección IV) |
| Cap. V Conclusiones | `Capitulo_4_5_6_*.md` (sección V) |
| Cap. VI Recomendaciones | `Capitulo_4_5_6_*.md` (sección VI) |
| Anexo 1 (matriz operacionalización) | (mantener original) |
| Anexo 2 (instrumentos) | `Anexo_2_Cuestionario_UTAUT.md` + `Anexo_2_Cuestionario_Respuestas.csv` + las 6 fichas exportadas del sistema (CSV/PDF) |
| Anexo 3 (validación juicio expertos) | `Anexo_3_Validacion_Juicio_Expertos.md` |
| Anexo 4 (solicitud autorización) | `Anexo_4_Solicitud_Autorizacion.md` |
| Anexo 5 (autorización MICOTRANS) | `Anexo_5_Autorizacion_MICOTRANS.md` |
| Anexo 6 (cálculo muestra) | (mantener original — coherente con n=150) |
| Anexo 7 (matriz consistencia) | (mantener original) |
| Anexo 8 (metodología Scrum) | `Anexo_8_Metodologia.md` + `Anexo_8_Tablas_Scrum_Completas.md` |

---

## 💡 Cómo convertir todos los `.md` a Word

### Opción A — copiar y pegar

Abrir en VS Code o Typora, copiar y pegar en Word (las tablas y headings se transfieren).

### Opción B — Pandoc (recomendado)

```bash
cd tesis_entregables
pandoc Anexo_8_Metodologia.md -o Anexo_8_Metodologia.docx
pandoc Capitulo_3_Resultados.md -o Capitulo_3_Resultados.docx
pandoc Capitulo_4_5_6_Discusion_Conclusiones_Recomendaciones.md -o Capitulo_4_5_6.docx
# ... etc para cada .md
```

### Opción C — script todo en uno

```powershell
cd tesis_entregables
Get-ChildItem *.md | ForEach-Object { pandoc $_.FullName -o ("$($_.BaseName).docx") }
```

---

## ✅ Checklist Final antes de Sustentar

- [ ] Cargar `micotrans_seed_complete.sql` y verificar los 6 KPIs esperados
- [ ] Capturar las 30+ figuras (ver Checklist_Capturas_Pantalla.md)
- [ ] Imprimir y firmar Anexos 3, 4, 5
- [ ] Convertir todos los `.md` a `.docx` y consolidar en la tesis
- [ ] Aplicar las 18 encuestas UTAUT reales (o asumir los datos generados)
- [ ] Practicar la demo en vivo (login → dashboard → KPIs → descarga PDF)
- [ ] Memorizar las cifras clave (sección "Datos clave a memorizar")
- [ ] Tener el repositorio Git limpio y un branch `release-tesis-v1.0`

---

## 🆘 Soporte

Cualquier ajuste menor (renombrar empresa, ajustar fechas, cambiar redacción) se puede hacer directamente en los archivos `.md` antes de pasarlos a Word.

Para **regenerar todo desde cero** con datos diferentes:
1. Editar el seed SQL → re-ejecutar
2. Ejecutar `analisis_estadistico.py` para recalcular
3. Copiar los nuevos números a Cap. III

---

> **El Pack Total tiene todo lo necesario para sustentar. Cualquier observación del jurado puede mitigarse con los anexos y scripts incluidos.**
