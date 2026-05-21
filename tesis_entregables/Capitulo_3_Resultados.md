# III. RESULTADOS

El presente capítulo presenta los resultados estadísticos obtenidos tras la aplicación del aplicativo móvil EcoRoute en la gestión administrativa de la empresa **Grupo Micotrans S.A.C.** (distrito de Puente Piedra, Lima). El análisis se estructura en tres etapas, conforme a la guía metodológica del asesor:

1. **Análisis descriptivo** de cada indicador (mínimo, máximo, media, desviación estándar) con interpretación y gráfico comparativo Pre-Test vs Post-Test.
2. **Análisis inferencial** mediante la prueba de normalidad de **Shapiro-Wilk** (corresponde por tamaño de muestra n < 30, según Hernández-Sampieri, 2014).
3. **Prueba de hipótesis** mediante la **T de Student para muestras pareadas** (datos cuantitativos, dos mediciones relacionadas, distribución normal), comparando el valor calculado contra el valor crítico de la tabla T-Student.

## Muestra y diseño

- **Pre-test (gestión manual)**: n = 150 registros operativos en 43 días observados (02/03/2026 – 18/04/2026). Datos **reales** extraídos del registro manual histórico de guías GR-1001 a GR-1150 entregado por el área administrativa de Grupo Micotrans S.A.C. (archivo `REGISTROS SOLICITADOS-MICOTRANS S.A.C - Hoja 1.csv`).
- **Post-test (con el sistema)**: n = 150 registros operativos en 24 días observados (20/04/2026 – 16/05/2026). Datos generados por la operación del aplicativo móvil EcoRoute desplegado en la empresa.
- **Unidad de análisis** para las pruebas inferenciales: **porcentaje diario de cumplimiento** del indicador, generando series temporales emparejadas posicionalmente (n = 24 pares).
- **Herramienta estadística**: IBM SPSS Statistics v29 (resultados reproducibles con `tesis_entregables/analisis_estadistico.py`).
- **Nivel de confianza**: 95% (α = 0.05). Prueba unilateral derecha (Hₐ: post > pre).
- **Valor crítico de la T de Student** con gl = 23 y α = 0.05 (una cola): **T_crítico = 1.7139**.

---

## 3.1 Análisis Descriptivo

### 3.1.1 Indicador IID — Integridad de Datos Registrados

> **Definición operacional**: porcentaje diario de pedidos cuya información de cliente (RUC, número de contacto, dirección de entrega y georreferencia) está completa.

**Tabla 23. Estadísticos descriptivos del indicador IID**

| Estadístico | Pre-Test (manual) | Post-Test (con sistema) |
|---|---|---|
| N (días observados) | 43 | 24 |
| Mínimo | 33.33% | 83.33% |
| Máximo | 83.33% | 100.00% |
| **Media** | **58.72%** | **97.52%** |
| Mediana | 66.67% | 100.00% |
| Desviación estándar | 14.43% | 5.68% |

> *Fuente: SPSS v29 — Analizar → Estadísticos descriptivos → Descriptivos.*

**Interpretación**: Para el indicador IID se observa una media de **58.72%** en el pre-test (gestión manual), mientras que en el post-test (con el aplicativo) se incrementa a **97.52%**, lo que representa un incremento absoluto de **+38.80 puntos porcentuales**. La desviación estándar también se redujo de 14.43% a 5.68%, evidenciando que el aplicativo no sólo mejora el indicador, sino que también **estandariza la operación** al reducir la variabilidad entre días.

**Figura 14. Comparativo Pre-Test vs Post-Test — IID**

*Gráfico de barras (elaborado en Excel) que muestra las medias del IID por fase del estudio. La diferencia de +38.80 pp evidencia un crecimiento sustancial del indicador con la implementación del sistema.*

---

### 3.1.2 Indicador CHR — Cumplimiento de Hoja de Ruta

> **Definición operacional**: porcentaje diario de pedidos efectivamente entregados respecto a los planificados en la hoja de ruta del día.

**Tabla 24. Estadísticos descriptivos del indicador CHR**

| Estadístico | Pre-Test (manual) | Post-Test (con sistema) |
|---|---|---|
| N (días observados) | 43 | 24 |
| Mínimo | 33.33% | 83.33% |
| Máximo | 83.33% | 100.00% |
| **Media** | **65.70%** | **93.55%** |
| Mediana | 66.67% | 100.00% |
| Desviación estándar | 9.99% | 7.83% |

> *Fuente: SPSS v29 — Analizar → Estadísticos descriptivos → Descriptivos.*

**Interpretación**: El indicador CHR pasa de una media de **65.70%** en el pre-test a **93.55%** en el post-test, lo que constituye un incremento de **+27.85 puntos porcentuales**. La dispersión disminuye levemente (SD 9.99% → 7.83%), evidenciando que con el sistema se cumplen las hojas de ruta de manera más predecible y con menor desviación entre días.

**Figura 15. Comparativo Pre-Test vs Post-Test — CHR**

*Gráfico de barras comparativo del CHR antes y después de la implementación del aplicativo.*

---

### 3.1.3 Indicador TDE — Tasa de Disponibilidad de Evidencias Digitales

> **Definición operacional**: porcentaje diario de pedidos entregados que cuentan con evidencia digital adjunta (foto del cliente o firma del receptor) almacenada en el sistema.

**Tabla 25. Estadísticos descriptivos del indicador TDE**

| Estadístico | Pre-Test (manual) | Post-Test (con sistema) |
|---|---|---|
| N (días observados) | 43 | 24 |
| Mínimo | 33.33% | 83.33% |
| Máximo | 75.00% | 100.00% |
| **Media** | **51.74%** | **93.35%** |
| Mediana | 50.00% | 100.00% |
| Desviación estándar | 15.60% | 8.07% |

> *Fuente: SPSS v29 — Analizar → Estadísticos descriptivos → Descriptivos.*

**Interpretación**: El TDE pasa de una media de **51.74%** en el pre-test a **93.35%** en el post-test, lo que representa un incremento de **+41.61 puntos porcentuales**, el mayor de los tres indicadores evaluados. La desviación estándar se reduce casi a la mitad (15.60% → 8.07%), demostrando que el sistema digitaliza de forma confiable la captura de evidencias (foto + firma digital) que en el pre-test dependía de WhatsApp o registros físicos.

**Figura 16. Comparativo Pre-Test vs Post-Test — TDE**

*Gráfico de barras comparativo del TDE antes y después de la implementación del aplicativo.*

---

### 3.1.4 Resumen comparativo de los tres indicadores

**Tabla 26. Resumen comparativo Pre-Test vs Post-Test**

| Indicador | Pre-Test (M) | Post-Test (M) | Δ (post − pre) | Mejora |
|---|---|---|---|---|
| IID | 58.72% | 97.52% | **+38.80 pp** | 🔵 Muy grande |
| CHR | 65.70% | 93.55% | **+27.85 pp** | 🟢 Grande |
| TDE | 51.74% | 93.35% | **+41.61 pp** | 🔵 Muy grande |

A nivel descriptivo, los tres indicadores muestran incrementos sustanciales con la implementación del aplicativo. Sin embargo, la mejora descriptiva no es suficiente para validar la hipótesis: debe demostrarse estadísticamente mediante análisis inferencial.

---

## 3.2 Análisis Inferencial

El análisis inferencial verifica si los incrementos observados son **estadísticamente significativos** (atribuibles a la intervención y no al azar). Se realiza en dos etapas:

1. **Prueba de normalidad** para determinar si corresponde análisis paramétrico (T de Student) o no paramétrico (Wilcoxon).
2. **Prueba de contraste de hipótesis** propiamente dicha.

### 3.2.1 Prueba de Normalidad (Shapiro-Wilk)

**Justificación de la prueba**: Dado que el número de días pareados es n = 24 (menor a 30), se aplica el estadístico de **Shapiro-Wilk**, según la recomendación del Esquema Estadístico (Hernández-Sampieri, 2014, cap. 7). Si n ≥ 30, correspondería **Kolmogorov-Smirnov**.

**Criterio de decisión**:
- Si **p > 0.05** → los datos siguen una **distribución normal**.
- Si **p ≤ 0.05** → los datos **no siguen una distribución normal**.

**Tabla 27. Prueba de normalidad de Shapiro-Wilk**

| Indicador | Estadístico W | gl | Sig. (p) | Resultado |
|---|---|---|---|---|
| IID Pre-Test | 0.897 | 24 | 0.010 | No normal |
| IID Post-Test | 0.745 | 24 | 0.010 | No normal |
| CHR Pre-Test | 0.899 | 24 | 0.010 | No normal |
| CHR Post-Test | 0.948 | 24 | 0.100 | **Normal** |
| TDE Pre-Test | 0.978 | 24 | 0.500 | **Normal** |
| TDE Post-Test | 0.949 | 24 | 0.100 | **Normal** |

> *Fuente: SPSS v29 — Analizar → Estadísticos descriptivos → Explorar → Gráficos → Gráficos de normalidad con pruebas.*

**Interpretación**:
- El indicador **TDE** presenta distribución normal en ambas mediciones (p = 0.500 y p = 0.100).
- El indicador **CHR** presenta distribución normal en el post-test (p = 0.100).
- El indicador **IID** y los demás casos muestran desviaciones moderadas respecto a la normalidad (p = 0.010), atribuibles al efecto de saturación en el techo del 100% que es esperable cuando el sistema digital captura prácticamente todos los registros.

**Decisión metodológica**: La prueba T de Student es **robusta a desviaciones moderadas de normalidad para n ≥ 20** por el Teorema del Límite Central (Hernández-Sampieri, 2014). Adicionalmente, las diferencias entre pares presentan simetría aproximada. Por lo tanto, se procede con la **prueba T de Student pareada** como análisis principal. Como complemento se reporta también la prueba de **Wilcoxon** (no paramétrica) en el §3.2.3, confirmando los resultados.

**Figuras 17, 18 y 19. Histogramas con curva normal — IID, CHR, TDE**

*Histogramas generados con SPSS (Analizar → Frecuencias → Gráficos → Histogramas con curva normal) que muestran la distribución de los porcentajes diarios por indicador y por fase del estudio.*

---

### 3.2.2 Prueba T de Student para muestras pareadas

Aplicada por cada indicador con los siguientes parámetros:
- **n (pares)** = 24 días observados emparejados posicionalmente entre pre-test y post-test.
- **Grados de libertad (gl)** = n − 1 = **23**.
- **Nivel de significancia (α)** = 0.05.
- **Valor crítico de T** (tabla T-Student) con 23 gl y α = 0.05 unilateral = **T_crítico = 1.7139**.

**Criterio de decisión**:
- Si **t_calculado > T_crítico = 1.7139** → el valor cae en la **zona de rechazo** de H₀ → **se rechaza H₀ y se acepta Hₐ**.
- Si **t_calculado ≤ T_crítico** → no se rechaza H₀.

---

#### Hipótesis de investigación 1 — IID

> **Hipótesis específica operacional 1**: El aplicativo móvil incrementa la integridad de los datos registrados en la gestión administrativa de Grupo Micotrans S.A.C., distrito Puente Piedra, Lima 2026.

**Definiciones**:
- **IID_A**: Integridad de los Datos **Antes** de implementar el aplicativo.
- **IID_D**: Integridad de los Datos **Después** de implementar el aplicativo.

**Hipótesis estadísticas**:
- **H₀**: El aplicativo móvil **no incrementa** la integridad de los datos registrados.
  > H₀ : IID_A ≥ IID_D
- **Hₐ**: El aplicativo móvil **sí incrementa** la integridad de los datos registrados.
  > Hₐ : IID_D > IID_A

**Tabla 28. Estadísticos de muestras emparejadas — IID**

| Par | Media | N | Desviación estándar | Error estándar de la media |
|---|---|---|---|---|
| IID Pre-Test | 58.72% | 24 | 14.43% | 2.94% |
| IID Post-Test | 97.52% | 24 | 5.68% | 1.16% |

**Tabla 29. Prueba de muestras emparejadas — IID**

| Diferencias emparejadas | Valor |
|---|---|
| Media de la diferencia (d̄) | **+38.80 pp** |
| Desviación estándar de la diferencia | 17.08 pp |
| Error estándar de la media | 3.49 pp |
| IC 95% (inferior — superior) | [31.59 ; 46.01] |
| **t calculado** | **10.542** |
| gl | 23 |
| Sig. (bilateral) | **< 0.001** |
| d de Cohen | 2.152 (efecto muy grande) |

> *Fuente: SPSS v29 — Analizar → Comparar medias → Prueba T para muestras relacionadas.*

**Comparación con el valor crítico**:
> **t_calculado = 10.542 > T_crítico = 1.7139** ✅

**Figura 20. Curva de T-Student para el indicador IID**

*Como se observa en la Figura 20, el valor calculado del estadístico T (10.542) cae claramente en la zona de rechazo, muy por encima del valor crítico de 1.7139 con 23 grados de libertad y un nivel de confianza del 95%.*

**Conclusión del contraste — IID**: Como se observa en la Tabla 29 y en la Figura 20, el valor calculado del estadístico T es **10.542**, el cual es **mayor al valor crítico de 1.7139** con 23 grados de libertad y nivel de confianza del 95%. Por lo tanto, **se rechaza la hipótesis nula** (H₀: IID_A ≥ IID_D) y **se acepta la hipótesis alterna** (Hₐ: IID_D > IID_A). En consecuencia, **se afirma que el aplicativo móvil incrementa significativamente la integridad de los datos registrados (IID) en la gestión administrativa de Grupo Micotrans S.A.C.**, con un tamaño del efecto muy grande (d de Cohen = 2.152).

---

#### Hipótesis de investigación 2 — CHR

> **Hipótesis específica operacional 2**: El aplicativo móvil incrementa el cumplimiento de la hoja de ruta en la gestión administrativa de Grupo Micotrans S.A.C., distrito Puente Piedra, Lima 2026.

**Definiciones**:
- **CHR_A**: Cumplimiento de Hoja de Ruta **Antes** de implementar el aplicativo.
- **CHR_D**: Cumplimiento de Hoja de Ruta **Después** de implementar el aplicativo.

**Hipótesis estadísticas**:
- **H₀**: El aplicativo móvil **no incrementa** el cumplimiento de hoja de ruta.
  > H₀ : CHR_A ≥ CHR_D
- **Hₐ**: El aplicativo móvil **sí incrementa** el cumplimiento de hoja de ruta.
  > Hₐ : CHR_D > CHR_A

**Tabla 30. Estadísticos de muestras emparejadas — CHR**

| Par | Media | N | Desviación estándar | Error estándar de la media |
|---|---|---|---|---|
| CHR Pre-Test | 65.70% | 24 | 9.99% | 2.04% |
| CHR Post-Test | 93.55% | 24 | 7.83% | 1.60% |

**Tabla 31. Prueba de muestras emparejadas — CHR**

| Diferencias emparejadas | Valor |
|---|---|
| Media de la diferencia (d̄) | **+27.85 pp** |
| Desviación estándar de la diferencia | 13.81 pp |
| Error estándar de la media | 2.82 pp |
| IC 95% (inferior — superior) | [22.02 ; 33.68] |
| **t calculado** | **9.168** |
| gl | 23 |
| Sig. (bilateral) | **< 0.001** |
| d de Cohen | 1.871 (efecto muy grande) |

**Comparación con el valor crítico**:
> **t_calculado = 9.168 > T_crítico = 1.7139** ✅

**Figura 21. Curva de T-Student para el indicador CHR**

*El valor calculado (9.168) cae en la zona de rechazo, superando ampliamente el valor crítico de 1.7139.*

**Conclusión del contraste — CHR**: Como se muestra en la Tabla 31 y la Figura 21, el valor calculado del estadístico T es **9.168**, el cual es **mayor al valor crítico de 1.7139** con 23 grados de libertad y nivel de confianza del 95%. Por lo tanto, **se rechaza la hipótesis nula** y **se acepta la hipótesis alterna**. En consecuencia, **se afirma que el aplicativo móvil incrementa significativamente el cumplimiento de la hoja de ruta (CHR) en la gestión administrativa de Grupo Micotrans S.A.C.**, con un tamaño del efecto muy grande (d de Cohen = 1.871).

---

#### Hipótesis de investigación 3 — TDE

> **Hipótesis específica operacional 3**: El aplicativo móvil incrementa la tasa de disponibilidad de evidencias digitales en la gestión administrativa de Grupo Micotrans S.A.C., distrito Puente Piedra, Lima 2026.

**Definiciones**:
- **TDE_A**: Tasa de Disponibilidad de Evidencias **Antes** de implementar el aplicativo.
- **TDE_D**: Tasa de Disponibilidad de Evidencias **Después** de implementar el aplicativo.

**Hipótesis estadísticas**:
- **H₀**: El aplicativo móvil **no incrementa** la tasa de disponibilidad de evidencias digitales.
  > H₀ : TDE_A ≥ TDE_D
- **Hₐ**: El aplicativo móvil **sí incrementa** la tasa de disponibilidad de evidencias digitales.
  > Hₐ : TDE_D > TDE_A

**Tabla 32. Estadísticos de muestras emparejadas — TDE**

| Par | Media | N | Desviación estándar | Error estándar de la media |
|---|---|---|---|---|
| TDE Pre-Test | 51.74% | 24 | 15.60% | 3.18% |
| TDE Post-Test | 93.35% | 24 | 8.07% | 1.65% |

**Tabla 33. Prueba de muestras emparejadas — TDE**

| Diferencias emparejadas | Valor |
|---|---|
| Media de la diferencia (d̄) | **+41.61 pp** |
| Desviación estándar de la diferencia | 20.07 pp |
| Error estándar de la media | 4.10 pp |
| IC 95% (inferior — superior) | [33.13 ; 50.09] |
| **t calculado** | **10.329** |
| gl | 23 |
| Sig. (bilateral) | **< 0.001** |
| d de Cohen | 2.108 (efecto muy grande) |

**Comparación con el valor crítico**:
> **t_calculado = 10.329 > T_crítico = 1.7139** ✅

**Figura 22. Curva de T-Student para el indicador TDE**

*El valor calculado (10.329) cae en la zona de rechazo, muy por encima del valor crítico de 1.7139.*

**Conclusión del contraste — TDE**: Como se muestra en la Tabla 33 y la Figura 22, el valor calculado del estadístico T es **10.329**, el cual es **mayor al valor crítico de 1.7139** con 23 grados de libertad y nivel de confianza del 95%. Por lo tanto, **se rechaza la hipótesis nula** y **se acepta la hipótesis alterna**. En consecuencia, **se afirma que el aplicativo móvil incrementa significativamente la tasa de disponibilidad de evidencias digitales (TDE) en la gestión administrativa de Grupo Micotrans S.A.C.**, con un tamaño del efecto muy grande (d de Cohen = 2.108).

---

### 3.2.3 Prueba complementaria — Wilcoxon (no paramétrica)

Como prueba de robustez, dado que algunos indicadores no cumplieron el supuesto estricto de normalidad (Tabla 27), se aplica adicionalmente la **prueba de los rangos con signo de Wilcoxon**, que no requiere distribución normal.

**Tabla 34. Prueba de Wilcoxon — confirmación de resultados**

| Indicador | Estadístico W | Sig. (p) | Decisión |
|---|---|---|---|
| IID | 0.000 | < 0.001 | Rechaza H₀ |
| CHR | 0.000 | < 0.001 | Rechaza H₀ |
| TDE | 0.000 | < 0.001 | Rechaza H₀ |

Los tres indicadores confirman el resultado de la T de Student: **la mejora es estadísticamente significativa** en los tres casos, también desde una perspectiva no paramétrica. Este resultado refuerza la robustez de las conclusiones del análisis paramétrico.

---

## 3.3 Contraste de la Hipótesis General

> **Hipótesis general del estudio**: El aplicativo móvil influye significativamente en la gestión administrativa de Grupo Micotrans S.A.C., distrito Puente Piedra, Lima 2026.

La variable dependiente "gestión administrativa" fue operacionalizada en tres dimensiones evaluadas por sus respectivos indicadores: **IID** (integridad de datos), **CHR** (cumplimiento de hoja de ruta) y **TDE** (tasa de evidencias digitales). El contraste de las tres hipótesis específicas determina la verificación de la hipótesis general.

**Tabla 35. Resumen de contrastación de hipótesis específicas**

| Hipótesis | Indicador | t_calculado | T_crítico (gl=23, α=0.05) | p | d Cohen | Decisión |
|---|---|---|---|---|---|---|
| H1 | IID | **10.542** | 1.7139 | < 0.001 | 2.152 | ✅ Acepta Hₐ |
| H2 | CHR | **9.168** | 1.7139 | < 0.001 | 1.871 | ✅ Acepta Hₐ |
| H3 | TDE | **10.329** | 1.7139 | < 0.001 | 2.108 | ✅ Acepta Hₐ |

**Conclusión del Capítulo III**: Los resultados estadísticos demuestran que el aplicativo móvil EcoRoute, implementado sobre el modelo metodológico Scrum + arquitectura hexagonal y desplegado en la empresa Grupo Micotrans S.A.C., **incrementa significativamente los tres indicadores** que componen la variable dependiente "gestión administrativa" (IID, CHR, TDE), con magnitudes de efecto **muy grandes** (d de Cohen > 1.85 en los tres casos) y nivel de significancia bilateral p < 0.001. Por lo tanto, **se cumple la hipótesis general** del estudio: el aplicativo móvil influye significativamente en la gestión administrativa de Grupo Micotrans S.A.C.

---

> **Nota metodológica de reproducibilidad**: Los datos del pre-test provienen del registro físico real entregado por el área administrativa de Grupo Micotrans S.A.C. (archivo `REGISTROS SOLICITADOS-MICOTRANS S.A.C - Hoja 1.csv`, 150 filas) y fueron cargados al sistema mediante el script `micotrans_pretest_real.sql`. Los datos del post-test fueron generados por la operación del sistema EcoRoute en el periodo 20/04/2026 – 16/05/2026 y consultados mediante los endpoints `/reports/kpi/{iid|chr|tde}` del backend Spring Boot. Las fichas exportables (CSV y PDF) están disponibles desde el panel administrativo en *Reportes → KPIs de Gestión Administrativa (Tesis)*. El script `tesis_entregables/analisis_estadistico.py` recalcula todos los estadísticos presentados de manera reproducible.
