# Manual de Usuario — Sistema EcoRoute

**Cliente:** Grupo MICOTRANS S.A.C.
**Versión:** 1.0
**Fecha:** Mayo 2026

---

## Índice

1. Introducción
2. Acceso al sistema
3. Manual del Administrador (panel web)
4. Manual del Dispatcher (panel web)
5. Manual del Conductor (aplicación móvil)
6. Preguntas frecuentes
7. Soporte

---

## 1. Introducción

EcoRoute es la plataforma digital de gestión logística que MICOTRANS utiliza para:

- **Registrar** todos los servicios de transporte con datos completos del cliente y destino.
- **Asignar** rutas, conductores y vehículos a los pedidos.
- **Seguir** la ubicación GPS de la flota en tiempo real.
- **Capturar** evidencia digital (foto + firma + DNI) en el momento de la entrega.
- **Medir** el desempeño operativo a través de indicadores (IID, CHR, TDE).

El sistema tiene **dos componentes**:

| Componente | Para quién | Cómo se accede |
|---|---|---|
| **Panel Administrativo Web** | Administradores, dispatchers, operaciones, gerencia | Navegador (Chrome/Edge) en `http://ecoroute.micotrans.com.pe` |
| **Aplicativo Móvil EcoRoute** | Conductores | App Android instalada en su celular |

---

## 2. Acceso al sistema

### 2.1 Credenciales

Su contraseña inicial fue entregada por el área administrativa el día de la capacitación. **Cámbiela en el primer ingreso.**

| Rol | Permisos |
|---|---|
| **ADMIN** | Acceso total: usuarios, conductores, vehículos, pedidos, rutas, reportes, KPIs. |
| **DISPATCHER** | Crear pedidos, asignar rutas, ver GPS, ver reportes. NO gestiona usuarios. |
| **DRIVER** | Solo aplicación móvil. Ve sus pedidos asignados, captura evidencia. |

### 2.2 Pantalla de login

1. Abra el navegador y vaya a la URL del sistema.
2. Ingrese su correo y contraseña.
3. Haga clic en **"Iniciar sesión"**.

> ⚠️ Si olvida su contraseña, contacte al administrador (no hay recuperación automática en esta versión).

---

## 3. Manual del Administrador

### 3.1 Pantalla Home

Al iniciar sesión verá:
- **Sidebar izquierdo**: menú con todas las secciones.
- **Header superior**: notificaciones, perfil, modo oscuro.
- **Tarjetas resumen** del día actual.

### 3.2 Gestión de Conductores

**Ruta:** Sidebar → *Conductores*

- **Agregar conductor**: clic en "+ Nuevo Conductor", llene los campos (nombres, apellidos, licencia, teléfono, email). El sistema validará que la licencia sea única.
- **Editar**: clic en el ícono de lápiz junto al conductor.
- **Desactivar**: clic en el ícono de candado (no se elimina, queda inactivo para preservar el histórico).

### 3.3 Gestión de Vehículos

**Ruta:** Sidebar → *Vehículos*

- Campos: placa, modelo, marca, capacidad (kg y m³).
- El sistema valida placa única.

### 3.4 Registro de Pedidos

**Ruta:** Sidebar → *Pedidos* → "+ Nuevo Pedido"

Campos **obligatorios** (sistema bloquea si faltan):

| Campo | Ejemplo |
|---|---|
| N° Guía (tracking) | GR-2026-0001 |
| **RUC del cliente** | 20554896321 |
| Nombre del receptor | Gamma Cargo S.A.C. |
| Teléfono | 987654321 |
| Dirección | Av. Argentina 1234 |
| Distrito | Callao |
| Coordenadas (lat/lon) | -12.0566, -77.1180 |

> **Importante:** El RUC del cliente debe ingresarse **completo** (11 dígitos). Esto alimenta el indicador **IID — Integridad de Datos**.

### 3.5 Creación de Rutas

**Ruta:** Sidebar → *Rutas* → "+ Nueva Ruta"

1. Seleccione fecha de la ruta.
2. Asigne conductor.
3. Asigne vehículo.
4. Agregue pedidos a la ruta (botón "Agregar pedidos") — solo aparecen pedidos sin ruta asignada.
5. Guarde. El sistema generará automáticamente la **ruta óptima** entre los puntos.

### 3.6 Dashboard de KPIs (Tesis)

**Ruta:** Sidebar → *Reportes* → pestaña *"KPIs de Gestión Administrativa (Tesis)"*

Vista comparativa con:
- **3 tarjetas**: IID, CHR, TDE con % global y conteos.
- **Toggle** Pre-Test (manual) vs Post-Test (con sistema).
- **Gráfico comparativo** Pre vs Post.
- **Fichas día por día** con totales.
- **Botones de descarga**: CSV y PDF para cada indicador.

### 3.7 Generación de Reportes

**Ruta:** Sidebar → *Reportes* → pestaña *"Reportes Operativos"*

- Filtros: conductor, rango de fechas.
- Estadísticas: pedidos por estado, a tiempo vs retrasados, rendimiento por conductor.
- Exportar a CSV.

### 3.8 Gestión de Usuarios

**Ruta:** Sidebar → *Usuarios*

Solo el ADMIN puede crear nuevos usuarios y asignarles rol (ADMIN / DISPATCHER / DRIVER).

---

## 4. Manual del Dispatcher

El dispatcher (operaciones) tiene un subconjunto de funciones del administrador:

| Función | Permitido |
|---|---|
| Crear pedidos | ✅ |
| Asignar rutas | ✅ |
| Ver GPS en tiempo real | ✅ |
| Ver reportes | ✅ |
| Gestionar usuarios | ❌ |
| Gestionar conductores y vehículos | ❌ |

### 4.1 Monitoreo GPS en tiempo real

**Ruta:** Sidebar → *Dashboard* → mapa principal

- Los conductores aparecen como pines en el mapa.
- Tooltip con nombre, vehículo, velocidad actual.
- Polilíneas muestran la ruta planificada.
- Actualización cada 5 segundos vía WebSocket.

---

## 5. Manual del Conductor (App Móvil)

### 5.1 Primer inicio

1. Abra **EcoRoute** en su celular.
2. Ingrese su usuario y contraseña (los mismos del panel web).
3. La app pedirá permisos de **cámara**, **ubicación** y **almacenamiento**. Acepte todos.

### 5.2 Pantalla principal: Mis Rutas

Verá la lista de **pedidos asignados a su ruta del día**, ordenados por la secuencia óptima calculada por el sistema.

Cada pedido muestra:
- N° de guía y nombre del cliente.
- Dirección y distrito.
- Estado actual (PENDIENTE / EN TRÁNSITO / ENTREGADO).
- Distancia desde su ubicación actual.

### 5.3 Iniciar ruta

1. Pulse el botón **"Iniciar ruta"** en la parte superior.
2. El sistema empezará a registrar su GPS cada 5 segundos.
3. El panel administrativo verá su ubicación en tiempo real.

### 5.4 Atender un pedido

1. Pulse el pedido al que va a atender.
2. Verá el detalle: cliente, dirección, observaciones, mapa con punto de destino.
3. Use el botón **"Cómo llegar"** para abrir Google Maps con la ruta.
4. Al llegar al destino, pulse **"Llegué"** (cambia el estado a EN TRÁNSITO → llegada).

### 5.5 Confirmar entrega con evidencia

1. Una vez que el cliente reciba la carga, pulse **"Confirmar entrega"**.
2. Aparecerá un wizard de 3 pasos:
   - **Paso 1 — Foto**: tome una foto de la carga entregada o del cliente firmando el recibo. Use buena iluminación.
   - **Paso 2 — Firma**: el cliente firma sobre la pantalla con el dedo. Si la firma es muy pequeña, pida que firme más grande.
   - **Paso 3 — DNI receptor**: ingrese el DNI de la persona que recibe la carga (8 dígitos).
3. Pulse **"Guardar entrega"**.
4. Confirmación: ✅ "Entrega registrada exitosamente". El pedido pasa a estado ENTREGADO.

> 💡 La evidencia se sube automáticamente al servidor. Si no tiene señal, queda guardada localmente y se sincroniza cuando recupere conectividad.

### 5.6 Casos especiales

| Situación | Acción |
|---|---|
| **Cliente no se encuentra** | Pulse "Marcar como NO LLEGÓ", anote motivo y horario en observaciones. |
| **Cliente rechaza la carga** | Pulse "RECHAZADO", indique motivo (carga dañada, pedido incorrecto, etc.). |
| **Incidente en ruta** | Pulse "INCIDENCIA", describa lo ocurrido (accidente, tráfico extremo, etc.) y adjunte foto. |
| **Sin señal de datos móviles** | Continúe trabajando normalmente. La app guarda todo localmente y sincroniza después. |

### 5.7 Modo oscuro

En la pantalla de **Perfil**, active el switch "Modo oscuro" si la pantalla le molesta de noche.

### 5.8 Historial de entregas

**Ruta:** Pestaña inferior → *Historial*

Verá todas las entregas que ha completado, con foto, firma y fecha. Solo lectura — no se puede modificar.

---

## 6. Preguntas Frecuentes (FAQ)

### ¿Qué hago si me olvidé la contraseña?
Contacte al administrador de MICOTRANS. Le generará una contraseña temporal y deberá cambiarla en el primer ingreso.

### ¿Por qué el sistema no me deja guardar el pedido?
Asegúrese de haber llenado **todos los campos obligatorios**, especialmente el RUC del cliente (11 dígitos). Si falta alguno, aparecerá en rojo.

### ¿Qué pasa si no tengo señal mientras hago una entrega?
La app guarda la evidencia (foto, firma, DNI) **localmente** en su celular y la sincroniza automáticamente cuando recupere señal. No pierde nada.

### ¿Puedo modificar una entrega ya confirmada?
**No.** Las entregas son inmutables una vez confirmadas. Si hay un error, contacte al administrador para que registre una corrección manual.

### ¿Cómo sé que el administrador vio mi entrega?
En la pestaña *Historial*, las entregas sincronizadas tienen un ícono ✅. Si aún no se sincronizó, aparece un ícono ⏳.

### ¿El GPS consume mucha batería?
El sistema toma una posición cada 5 segundos solo cuando la ruta está **activa**. Recomendamos llevar el celular cargado o usar power bank.

---

## 7. Soporte

| Tipo de problema | A quién contactar |
|---|---|
| Olvido de contraseña | Administrador interno MICOTRANS |
| Error técnico (app no abre, no sincroniza) | Soporte técnico: ___________________ |
| Sugerencias de mejora | Email: ___________________ |
| Capacitación adicional | Solicitar al Gerente de Operaciones |

**Horario de soporte técnico:** Lunes a Sábado, 8:00 – 18:00.

---

> **Recordatorio para conductores:** Su uso correcto del aplicativo móvil es directamente medido por los indicadores IID, CHR y TDE. Mientras más completo y consistente sea el registro, mejor evalúan los indicadores de la empresa.
