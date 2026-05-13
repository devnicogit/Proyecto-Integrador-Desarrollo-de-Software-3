# IV. DISCUSIÓN

Los resultados obtenidos confirman la hipótesis general planteada: la implementación del aplicativo móvil **EcoRoute** influyó significativamente en la gestión administrativa de Grupo Micotrans S.A.C. en el distrito de Puente Piedra. Los tres indicadores diseñados como dimensiones de la variable dependiente (IID, CHR y TDE) mostraron mejoras estadísticamente significativas (p < 0.001) con tamaños del efecto excepcionales (d de Cohen entre 1.69 y 2.24), lo que respalda un impacto práctico de alta relevancia.

## 4.1 Sobre la planeación y registro de servicios (IID)

El incremento del IID de 58.72% a 97.94% (Δ = +39.22 pp) coincide con lo reportado por **Soto et al. [11]**, quienes demostraron que el diseño de un aplicativo móvil reemplaza los procesos manuales y mejora la integridad del registro de información administrativa. La aplicación móvil EcoRoute, al obligar el llenado de campos críticos (RUC del cliente, datos del receptor, dirección, coordenadas geográficas) antes de poder guardar el pedido, eliminó los registros con información incompleta. En el análisis del archivo de registro manual original de MICOTRANS (150 guías GR-1001 a GR-1150) se identificó que el 40% de los registros tenía el RUC del cliente truncado (ejemplo "2045..." o "2055..."), lo que impedía la conciliación tributaria posterior con SUNAT. El sistema digital eliminó por completo esta categoría de error en el post-test.

Este hallazgo confirma además lo señalado por **Pacheco [17]** respecto a la importancia del control interno en la gestión administrativa: la digitalización del registro de pedidos opera como un control preventivo automático, no como un control correctivo a posteriori. La diferencia metodológica con dicho estudio radica en que esta investigación midió el impacto **objetivamente** mediante fichas de registro provenientes de un sistema funcional, mientras que Pacheco se limitó a percepciones.

## 4.2 Sobre el control y monitoreo de procesos (CHR)

La mejora en el CHR (de 65.70% a 93.45%, Δ = +27.75 pp) se alinea con los resultados de **Salazar [12]** y **Sucso y Casanova [19]**, quienes documentaron incrementos significativos en el cumplimiento de rutas tras implementar soluciones móviles con seguimiento GPS. En el pre-test de MICOTRANS se observaron 49 servicios con estados de incumplimiento distribuidos en: Incidencia (18), Pendiente (14), No llegó (7), Rechazado (5) y Retraso (5). El sistema EcoRoute habilitó tres mecanismos clave:

1. **Visibilidad en tiempo real** del avance del conductor mediante streaming GPS por WebSocket.
2. **Asignación digital de la hoja de ruta** que elimina malentendidos derivados de la transmisión verbal de instrucciones.
3. **Auditoría completa** de cada cambio de estado del pedido en la tabla `order_status_history`, lo que permite identificar puntos no visitados y sus razones.

La menor variabilidad post-test (SD reducida de 10.4% a 5.9%) indica que el sistema no solo eleva el desempeño promedio, sino que también lo estandariza entre conductores y rutas, reduciendo la dependencia de la experiencia individual del personal.

## 4.3 Sobre la evaluación y cierre administrativo (TDE)

El TDE registró la mejora más pronunciada (+42.11 pp), pasando de 51.74% a 93.85%. Este resultado refuerza lo planteado por **Pérez [13]** y **Ydrogo [18]** respecto a la centralidad de la evidencia digital en el ciclo administrativo de las empresas de transporte. En la etapa pre-test de MICOTRANS, el soporte de cierre se distribuía en tres modalidades: Foto WhatsApp (77 servicios, 51.3%, única vía digital trazable), Físico (38, 25.3%, papel en archivo físico no consultable a distancia) y Sin archivo (35, 23.3%, sin evidencia alguna). Casi una cuarta parte de los servicios se cerraba sin respaldo formal, lo que prolongaba el ciclo de facturación y dificultaba la resolución de disputas con clientes.

EcoRoute integra el flujo de cierre en una única transacción: foto, firma digital con pad táctil, captura del DNI del receptor y geolocalización, almacenadas atómicamente en AWS S3 + base de datos. Este diseño se inspira en el modelo descrito por **Raukko [14]** sobre Transport Management Systems (TMS), adaptado al contexto de una pyme peruana mediante el uso de stack open-source y arquitectura reactiva ligera.

## 4.4 Aporte metodológico

Esta investigación supera tres limitaciones identificadas en los antecedentes revisados:

1. **Frente a Serpa [16]**, que se centró en mototaxis y midió formalización en lugar de gestión administrativa, este estudio aplica el mismo diseño preexperimental en el mismo distrito (Puente Piedra) pero a un problema de negocio real con indicadores objetivos del ciclo de servicio.
2. **Frente a Pacheco [17]**, que utilizó un diseño correlacional sin intervención tecnológica y midió percepciones subjetivas, esta investigación introduce la variable independiente (aplicativo móvil) y obtiene mediciones objetivas mediante fichas de registro generadas automáticamente por el sistema.
3. **Frente a Castro et al. [20]**, que se centró en una sola dimensión (tiempos de espera), esta investigación cubre las tres dimensiones del ciclo administrativo: planeación, control y cierre.

## 4.5 Limitaciones del estudio

Se reconocen las siguientes limitaciones:

- **Diseño preexperimental sin grupo de control**: aunque coherente con el contexto de una sola pyme, limita la atribución causal pura. Estudios futuros podrían replicar el diseño en múltiples empresas del distrito.
- **Periodo de observación corto** (~6 semanas en cada fase): si bien suficiente para detectar el efecto inmediato, no permite evaluar la sostenibilidad de la mejora en el largo plazo.
- **Dependencia de conectividad**: aunque el modo offline mitiga interrupciones puntuales, una pérdida prolongada de conectividad podría degradar el TDE. Se mitigó con cola local de sincronización en la app Flutter.

---

# V. CONCLUSIONES

A partir del análisis de los resultados se establecen las siguientes conclusiones:

**Primera.** La implementación del aplicativo móvil EcoRoute influyó significativamente en la gestión administrativa de Grupo Micotrans S.A.C., evidenciado por la mejora estadísticamente significativa (p < 0.001) de los tres indicadores que componen la variable dependiente. La media global de cumplimiento administrativo pasó de **58.72%** en el pre-test a **95.08%** en el post-test, equivalente a una mejora absoluta de **+36.36 puntos porcentuales**.

**Segunda.** Respecto al objetivo específico 1, el aplicativo móvil optimizó significativamente la **planeación y registro de servicios**, incrementando la integridad de datos registrados (IID) de 58.72% a 97.94% (Δ = +39.22 pp; t(41) = 14.53; p < 0.001; d = 2.24). La obligatoriedad de campos críticos —especialmente el RUC del cliente, que en el registro manual aparecía truncado en el 40% de las guías— y la sincronización automática con la base de datos eliminaron los registros incompletos del proceso manual.

**Tercera.** Respecto al objetivo específico 2, el aplicativo móvil fortaleció significativamente el **control y monitoreo de procesos**, elevando el cumplimiento de la hoja de ruta digital (CHR) de 65.70% a 93.45% (Δ = +27.75 pp; t(41) = 10.97; p < 0.001; d = 1.69). La visibilidad en tiempo real del GPS, la asignación digital de rutas y la auditoría inmutable de cambios de estado fueron los mecanismos determinantes para reducir los casos de incidencia, pendientes y servicios sin llegada.

**Cuarta.** Respecto al objetivo específico 3, el aplicativo móvil agilizó significativamente la **evaluación y cierre administrativo**, elevando la tasa de disponibilidad de evidencias digitales (TDE) de 51.74% a 93.85% (Δ = +42.11 pp; t(41) = 13.80; p < 0.001; d = 2.13). La integración nativa de captura de foto, firma digital y DNI del receptor en un único flujo transaccional eliminó las modalidades de cierre sin respaldo (23.3% del proceso manual) y reemplazó el papel físico por evidencia digital centralizada.

**Quinta.** Los coeficientes de correlación de Pearson (r > 0.75 en todos los pares) entre la percepción de los usuarios (cuestionario Likert, n=18) y los resultados objetivos confirman la validez externa del estudio y respaldan el modelo UTAUT como marco explicativo de la adopción tecnológica en la pyme estudiada.

**Sexta.** El estudio demuestra empíricamente que la digitalización del ciclo de servicio mediante un aplicativo móvil con arquitectura reactiva (Spring WebFlux + Flutter) y orientada al dominio (Hexagonal) es viable técnica y económicamente para pymes del sector transporte en Lima Metropolitana, sin requerir hardware especializado ni infraestructura empresarial compleja.

---

# VI. RECOMENDACIONES

A partir de las conclusiones se formulan las siguientes recomendaciones:

**Primera.** Se recomienda a la gerencia de Grupo Micotrans S.A.C. **mantener la operación del sistema EcoRoute en producción** y formalizar políticas internas que exijan la captura digital de pedidos y evidencias como condición para la facturación. Esto institucionaliza los beneficios observados y previene un retorno a los procesos manuales.

**Segunda.** Se recomienda **extender el monitoreo de los indicadores IID, CHR y TDE** mediante reportes semanales automáticos enviados al área administrativa, aprovechando el módulo de notificaciones (SNS/SQS) ya implementado. Establecer umbrales mínimos (IID ≥ 90%, CHR ≥ 88%, TDE ≥ 92%) y planes de acción cuando los valores desciendan.

**Tercera.** Se recomienda **incorporar la dimensión de tiempos** al sistema de KPIs en una segunda fase del proyecto. Indicadores complementarios como Tiempo Promedio de Registro (TPR), Tiempo de Ciclo de Entrega (TCE) y Tiempo de Cierre Administrativo (TCA) permitirían validar empíricamente la reducción de horas-hombre dedicadas a procesos administrativos.

**Cuarta.** Se recomienda a futuros investigadores **replicar el estudio en empresas similares del distrito de Puente Piedra** o de otros distritos de Lima Norte (Comas, Los Olivos, Carabayllo) bajo un diseño cuasi-experimental con grupo de control, lo que permitiría aislar el efecto del aplicativo móvil de otros factores contextuales y fortalecer la generalización de los resultados.

**Quinta.** Se recomienda a la academia y a entidades como la Cámara de Comercio de Lima **fomentar programas de capacitación tecnológica** para conductores y personal administrativo de pymes de transporte, dado que los resultados del cuestionario UTAUT muestran que la facilidad de uso percibida (r = 0.812 con IID) es un predictor clave de la adopción exitosa.

**Sexta.** Se recomienda al equipo de desarrollo **fortalecer la operación offline** de la aplicación móvil incorporando resolución de conflictos basada en CRDT (Conflict-free Replicated Data Types) para escenarios de baja conectividad prolongada en zonas periféricas del distrito, y considerar la integración futura con la facturación electrónica de SUNAT para automatizar completamente el cierre administrativo.

---

**Fin de los Capítulos IV, V y VI**
