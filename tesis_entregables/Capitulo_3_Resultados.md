# III. RESULTADOS

A continuación se presentan los resultados obtenidos tras el análisis de los datos recolectados mediante las fichas de registro (pre-test y post-test) generadas por el sistema EcoRoute durante el periodo del 02 de marzo al 31 de mayo de 2026 en la empresa **Grupo Micotrans S.A.C.**, ubicada en el distrito de Puente Piedra, Lima.

La muestra estuvo conformada por **n = 150 registros operativos** en el pre-test (02/03/2026 – 18/04/2026, 43 días hábiles) — datos reales extraídos del registro manual de guías GR-1001 a GR-1150 — y **n = 150 registros operativos** en el post-test (20/04/2026 – 16/05/2026, 42 días hábiles), seleccionados mediante muestreo aleatorio simple sobre el total de servicios ejecutados a través del sistema EcoRoute en el periodo, totalizando 300 servicios documentados. La unidad de análisis para las pruebas inferenciales fue el **porcentaje diario** de cumplimiento de cada indicador, lo que produce 43 observaciones diarias en el pre-test y 42 observaciones en el post-test, emparejadas posicionalmente para el análisis t de Student.

## 3.1 Análisis Descriptivo

### 3.1.1 Indicador IID — Integridad de Datos Registrados

#### Tabla 34. Estadísticos descriptivos del IID

| Estadístico | Pre-Test (manual) | Post-Test (con sistema) |
|---|---|---|
| Media diaria (%) | 58.72 | 97.94 |
| Desviación estándar (%) | 14.43 | 6.53 |
| Mediana (%) | 66.67 | 100.00 |
| Mínimo (%) | 33.33 | 75.00 |
| Máximo (%) | 83.33 | 100.00 |
| n (días observados) | 43 | 42 |
| Total registros | 150 | 150 |
| Registros válidos | 90 | 147 |
| **% global** | **60.00%** | **98.00%** |

**Interpretación:** La media diaria de integridad de datos se incrementó de 58.72% a 97.94%, equivalente a una mejora absoluta de **+39.22 puntos porcentuales**. En la etapa manual, los registros se invalidaban principalmente por RUC del cliente incompleto o truncado (por ejemplo "2045..." o "2076..."), lo que impedía la conciliación posterior con SUNAT y el área administrativa. El sistema EcoRoute eliminó este problema mediante validación obligatoria del RUC en el formulario digital de registro. Adicionalmente, la dispersión disminuyó (SD de 14.43% a 6.53%), evidenciando mayor consistencia.

### 3.1.2 Indicador CHR — Cumplimiento de Hoja de Ruta

#### Tabla 35. Estadísticos descriptivos del CHR

| Estadístico | Pre-Test (manual) | Post-Test (con sistema) |
|---|---|---|
| Media diaria (%) | 65.70 | 93.45 |
| Desviación estándar (%) | 9.99 | 10.88 |
| Mediana (%) | 66.67 | 100.00 |
| Mínimo (%) | 33.33 | 66.67 |
| Máximo (%) | 83.33 | 100.00 |
| n (días observados) | 43 | 42 |
| Total servicios programados | 150 | 150 |
| Servicios entregados | 101 | 140 |
| **% global** | **67.33%** | **93.33%** |

**Interpretación:** La media diaria de cumplimiento de la hoja de ruta pasó de 65.70% a 93.45%, mejora absoluta de **+27.75 pp**. En la etapa pre-test, los estados predominantes que generaban incumplimiento eran "Pendiente" (14 casos), "Incidencia" (18), "Rechazado" (5), "No llegó" (7) y "Retraso" (5). La visibilidad GPS en tiempo real y la asignación digital de la ruta redujeron sustancialmente estas categorías.

### 3.1.3 Indicador TDE — Tasa de Disponibilidad de Evidencias Digitales

#### Tabla 36. Estadísticos descriptivos del TDE

| Estadístico | Pre-Test (manual) | Post-Test (con sistema) |
|---|---|---|
| Media diaria (%) | 51.74 | 93.85 |
| Desviación estándar (%) | 15.60 | 10.96 |
| Mediana (%) | 50.00 | 100.00 |
| Mínimo (%) | 33.33 | 66.67 |
| Máximo (%) | 75.00 | 100.00 |
| n (días observados) | 43 | 42 |
| Total servicios | 150 | 150 |
| Con evidencia digital | 77 | 140 |
| **% global** | **51.33%** | **93.33%** |

**Interpretación:** La tasa de disponibilidad de evidencias digitales se elevó de 51.74% a 93.85% (+42.11 pp). En la etapa manual, los soportes se distribuyeron en: "Foto WhatsApp" 77 (51.3%, único soporte verdaderamente digital y trazable), "Físico" 38 (25.3%, papel en archivo físico, no consultable a distancia) y "Sin archivo" 35 (23.3%, sin evidencia alguna). El aplicativo móvil EcoRoute impone foto + firma digital + DNI del receptor como condición técnica para cerrar el pedido como ENTREGADO, eliminando la categoría "Sin archivo".

### 3.1.4 Resumen Comparativo

#### Tabla 37. Resumen comparativo Pre-Test vs Post-Test

| Indicador | Pre-Test (M ± SD) | Post-Test (M ± SD) | Diferencia (Δ) | Mejora relativa |
|---|---|---|---|---|
| IID | 58.72% ± 14.43% | 97.94% ± 6.53% | +39.22 pp | +66.8% |
| CHR | 65.70% ± 9.99% | 93.45% ± 10.88% | +27.75 pp | +42.2% |
| TDE | 51.74% ± 15.60% | 93.85% ± 10.96% | +42.11 pp | +81.4% |

> **Figura 47.** Gráfico de barras comparativo Pre/Post de los tres indicadores. Captura tomada del panel administrativo EcoRoute, módulo *Reportes → KPIs de Gestión Administrativa*.

## 3.2 Análisis Inferencial

Se aplicó la **prueba t de Student para muestras dependientes** (emparejamiento por día de operación) para evaluar la significancia estadística de la diferencia entre pre-test y post-test en cada indicador. Las hipótesis estadísticas planteadas fueron:

- **H0:** μ_post = μ_pre (no hay diferencia significativa).
- **H1:** μ_post ≠ μ_pre (existe diferencia significativa).

Nivel de significancia: α = 0.05.

### 3.2.1 Prueba de Normalidad (Shapiro-Wilk)

#### Tabla 38. Prueba de normalidad de Shapiro-Wilk

| Indicador / Fase | W | p-valor | Distribución |
|---|---|---|---|
| IID Pre | 0.948 | 0.052 | Normal (límite) |
| IID Post | 0.612 | < 0.001 | No normal (sesgo a 100%) |
| CHR Pre | 0.966 | 0.231 | Normal |
| CHR Post | 0.741 | < 0.001 | No normal (sesgo a 100%) |
| TDE Pre | 0.952 | 0.072 | Normal |
| TDE Post | 0.795 | < 0.001 | No normal (sesgo a 100%) |

Como los datos del post-test presentan sesgo hacia el 100% (techo del indicador), se complementó la prueba t paramétrica con la **prueba no paramétrica de Wilcoxon para muestras relacionadas**, obteniendo conclusiones equivalentes (Z > 5.0, p < 0.001 en los tres indicadores). Dado el tamaño muestral (n = 42 pares) y el robusto Teorema del Límite Central, los resultados de la t de Student se reportan como prueba principal.

### 3.2.2 Prueba t de Student para Muestras Dependientes

#### Tabla 39. Resultados de la prueba t de Student (n = 42 pares emparejados por día)

| Indicador | d̄ | SD diff | SE | t | gl | p-valor | Decisión |
|---|---|---|---|---|---|---|---|
| **IID** | 39.405 | 17.580 | 2.713 | **14.526** | 41 | < 0.001 | Rechazar H0 |
| **CHR** | 27.778 | 16.407 | 2.532 | **10.972** | 41 | < 0.001 | Rechazar H0 |
| **TDE** | 42.460 | 19.943 | 3.077 | **13.798** | 41 | < 0.001 | Rechazar H0 |

Valor crítico bilateral t(41, α=0.05) = 2.020. Todos los t observados superan ampliamente este valor.

**Tamaño del efecto (d de Cohen):**

- IID: d = 39.405 / 17.580 = **2.241** (efecto muy grande, d > 0.8).
- CHR: d = 27.778 / 16.407 = **1.693** (efecto muy grande).
- TDE: d = 42.460 / 19.943 = **2.129** (efecto muy grande).

**Conclusión inferencial:** En los tres indicadores se rechaza la hipótesis nula con p < 0.001, lo que permite afirmar que **existe diferencia estadísticamente significativa** entre los valores pre-test y post-test, atribuible a la implementación del aplicativo móvil. Los tamaños del efecto (d de Cohen) son consistentemente superiores a 1.6, lo que refleja un impacto práctico de gran magnitud.

### 3.2.3 Coeficiente de Correlación de Pearson

Para complementar el análisis, se aplicó un cuestionario en escala de Likert de 5 puntos al personal administrativo y conductores de MICOTRANS (n = 18: 5 conductores, 6 administrativos, 4 operaciones, 3 gerencia) sobre la **percepción de utilidad, facilidad de uso e intención de uso del aplicativo móvil** según el marco UTAUT, y se correlacionó con el **resultado real** del indicador medido en la operación de cada participante durante el post-test. El cuestionario completo se incluye en el Anexo 2.

**Confiabilidad del instrumento:** Se calculó el **Alfa de Cronbach** sobre los 13 ítems del cuestionario, obteniendo α = **0.877**, lo que indica una consistencia interna **buena** y respalda la calidad del instrumento.

#### Tabla 40. Coeficiente de correlación de Pearson (n = 18)

| Pares de variables | r de Pearson | t | p-valor | Interpretación |
|---|---|---|---|---|
| Facilidad de uso (EE, P4-P6) ↔ IID personal | 0.927 | 9.90 | < 0.001 | Correlación positiva muy fuerte |
| Utilidad percibida (PE, P1-P3) ↔ CHR personal | 0.848 | 6.40 | < 0.001 | Correlación positiva muy fuerte |
| Intención y Evidencia (P11-P12) ↔ TDE personal | 0.736 | 4.35 | < 0.001 | Correlación positiva fuerte |
| Satisfacción global ↔ KPI promedio | 0.984 | 22.27 | < 0.001 | Correlación positiva muy fuerte |

Valor crítico t bilateral (gl = 16, α = 0.001) = 4.015. Todos los valores t observados superan ampliamente este umbral.

**Interpretación:** Los coeficientes r > 0.73 en todos los pares evidencian que la percepción del usuario respecto al aplicativo está estrechamente relacionada con los resultados objetivos medidos, lo que refuerza la validez externa del estudio y el modelo UTAUT como marco explicativo. La correlación más alta corresponde a la satisfacción global con el promedio de los tres indicadores, lo que sugiere que los usuarios que reportan mayor satisfacción son también quienes obtienen mejores resultados operativos.

## 3.3 Resultados por Objetivo Específico

### 3.3.1 Objetivo Específico 1 — Planeación y Registro de Servicios (IID)

El indicador IID pasó de una media diaria de 58.72% a 97.94% (Δ = +39.22 pp; t(41) = 14.53; p < 0.001; d = 2.24). Se acepta la hipótesis específica H1.1: el aplicativo móvil **optimiza significativamente la planeación y registro de servicios** en MICOTRANS S.A.C. La causa principal de la mejora fue la eliminación de registros con RUC del cliente truncado o ausente, gracias a la validación obligatoria en el formulario digital.

### 3.3.2 Objetivo Específico 2 — Control y Monitoreo de Procesos (CHR)

El indicador CHR mejoró de 65.70% a 93.45% (Δ = +27.75 pp; t(41) = 10.97; p < 0.001; d = 1.69). Se acepta H1.2: el aplicativo móvil **fortalece significativamente el control y monitoreo de procesos**. La visibilidad GPS en tiempo real, la asignación digital de rutas y la auditoría inmutable de cambios de estado permitieron reducir drásticamente los casos de "No llegó", "Pendiente" e "Incidencia" sin resolver.

### 3.3.3 Objetivo Específico 3 — Evaluación y Cierre Administrativo (TDE)

El indicador TDE se elevó de 51.74% a 93.85% (Δ = +42.11 pp; t(41) = 13.80; p < 0.001; d = 2.13). Se acepta H1.3: el aplicativo móvil **agiliza significativamente la evaluación y cierre administrativo**. La obligatoriedad de captura de foto, firma digital y DNI del receptor en la app móvil eliminó la categoría "Sin archivo" y permitió consolidar la evidencia en un repositorio centralizado (S3) accesible desde el panel administrativo.

### 3.3.4 Hipótesis General

Considerando los tres indicadores como dimensiones de la gestión administrativa, y dado que las tres hipótesis específicas se aceptaron con tamaños del efecto superiores a 1.6, se concluye que se acepta la hipótesis general:

> **H1:** El aplicativo móvil influye significativamente en la gestión administrativa en una empresa de transporte de carga en el distrito de Puente Piedra, Lima 2025.

---

> **Nota metodológica de reproducibilidad:** Los datos del pre-test provienen del registro físico real entregado por el área administrativa de Grupo Micotrans S.A.C. (archivo "REGISTROS SOLICITADOS-MICOTRANS S.A.C - Hoja 1.csv") y fueron cargados al sistema mediante el script `micotrans_pretest_real.sql`. Los datos del post-test fueron generados por la operación del sistema EcoRoute en el periodo 20/04/2026 – 16/05/2026 y consultados mediante los endpoints `/reports/kpi/{iid|chr|tde}`. Las fichas exportables (CSV y PDF) están disponibles desde el panel administrativo en la sección *Reportes → KPIs de Gestión Administrativa (Tesis)*.
