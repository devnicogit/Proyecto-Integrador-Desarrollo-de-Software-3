# 🗝️ EcoRoute Keycloak Setup Script
# Configura realm, client, role + usuarios alineados con los conductores reales.
#
# Cada user Keycloak DEBE matchear el `external_id` de un Driver en la BD para
# que la app móvil pueda resolver el perfil correcto. Los external_id son
# mct-001..mct-005 (ver micotrans_seed_complete.sql).

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "🚀 Iniciando Configuración de Keycloak para EcoRoute" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$KC_CONTAINER = "ecoroute-keycloak"
$KCADM = "/opt/keycloak/bin/kcadm.sh"

# 1. Autenticación
Write-Host "[1/6] Autenticando como administrador..." -ForegroundColor Yellow
docker exec $KC_CONTAINER $KCADM config credentials --server http://localhost:8080 --realm master --user admin --password admin

# 2. Crear Realm (idempotente: si ya existe, Keycloak retorna conflict y seguimos)
Write-Host "[2/6] Creando Realm 'ecoroute'..." -ForegroundColor Yellow
docker exec $KC_CONTAINER $KCADM create realms -s realm=ecoroute -s enabled=true 2>$null

# 3. Crear Cliente
Write-Host "[3/6] Creando Cliente 'mobile-app'..." -ForegroundColor Yellow
docker exec $KC_CONTAINER $KCADM create clients -r ecoroute -s clientId=mobile-app -s publicClient=true -s directAccessGrantsEnabled=true -s standardFlowEnabled=true 2>$null

# 4. Crear Roles (DRIVER, DISPATCHER, ADMIN)
Write-Host "[4/6] Creando Roles 'DRIVER', 'DISPATCHER', 'ADMIN'..." -ForegroundColor Yellow
docker exec $KC_CONTAINER $KCADM create roles -r ecoroute -s name=DRIVER     2>$null
docker exec $KC_CONTAINER $KCADM create roles -r ecoroute -s name=DISPATCHER 2>$null
docker exec $KC_CONTAINER $KCADM create roles -r ecoroute -s name=ADMIN      2>$null

# 5. Crear los 5 conductores reales de MICOTRANS
#    El username DEBE coincidir con el external_id del driver en la BD,
#    así el backend (/drivers/me) puede resolver el perfil correcto.
Write-Host "[5/6] Creando 5 usuarios DRIVER (mct-001..mct-005) + 1 'conductor' demo..." -ForegroundColor Yellow

$drivers = @(
    @{ username = "mct-001"; first = "Carlos"; last = "Quispe Mamani"; email = "cquispe@micotrans.com.pe" }
    @{ username = "mct-002"; first = "Luis";   last = "Huamani Soto";  email = "lhuamani@micotrans.com.pe" }
    @{ username = "mct-003"; first = "José";   last = "Ramírez Vega";  email = "jramirez@micotrans.com.pe" }
    @{ username = "mct-004"; first = "Pedro";  last = "Castillo Rojas";email = "pcastillo@micotrans.com.pe" }
    @{ username = "mct-005"; first = "Miguel"; last = "Torres Mendoza";email = "mtorres@micotrans.com.pe" }
)

foreach ($d in $drivers) {
    Write-Host "  - $($d.username) ($($d.first) $($d.last))" -ForegroundColor Gray
    docker exec $KC_CONTAINER $KCADM create users -r ecoroute `
        -s "username=$($d.username)" `
        -s enabled=true `
        -s emailVerified=true `
        -s "firstName=$($d.first)" `
        -s "lastName=$($d.last)" `
        -s "email=$($d.email)" 2>$null
    docker exec $KC_CONTAINER $KCADM set-password -r ecoroute --username $d.username --new-password conductor123 --temporary=$false 2>$null
    docker exec $KC_CONTAINER $KCADM add-roles -r ecoroute --uusername $d.username --rolename DRIVER 2>$null
}

# Usuario 'conductor' demo (compatibilidad con scripts viejos).
# Importante: su email también matchea al primer conductor para que el
# fallback por email funcione hasta que el script se rerun con username=mct-001.
docker exec $KC_CONTAINER $KCADM create users -r ecoroute `
    -s username=conductor -s enabled=true -s emailVerified=true `
    -s firstName=Juan -s lastName=Pérez `
    -s email=cquispe@micotrans.com.pe 2>$null
docker exec $KC_CONTAINER $KCADM set-password -r ecoroute --username conductor --new-password conductor123 --temporary=$false 2>$null
docker exec $KC_CONTAINER $KCADM add-roles -r ecoroute --uusername conductor --rolename DRIVER 2>$null

# Usuario 'admin' para el panel web
docker exec $KC_CONTAINER $KCADM create users -r ecoroute `
    -s username=admin -s enabled=true -s emailVerified=true `
    -s firstName=Administrador -s lastName=EcoRoute `
    -s email=admin@ecoroute.local 2>$null
docker exec $KC_CONTAINER $KCADM set-password -r ecoroute --username admin --new-password admin123 --temporary=$false 2>$null
docker exec $KC_CONTAINER $KCADM add-roles -r ecoroute --uusername admin --rolename ADMIN 2>$null

# Usuario 'dispatcher' para operadores
docker exec $KC_CONTAINER $KCADM create users -r ecoroute `
    -s username=dispatcher -s enabled=true -s emailVerified=true `
    -s firstName=Operador -s lastName=Logístico `
    -s email=dispatcher@ecoroute.local 2>$null
docker exec $KC_CONTAINER $KCADM set-password -r ecoroute --username dispatcher --new-password dispatcher123 --temporary=$false 2>$null
docker exec $KC_CONTAINER $KCADM add-roles -r ecoroute --uusername dispatcher --rolename DISPATCHER 2>$null

# 6. Resumen
Write-Host "[6/6] Verificando..." -ForegroundColor Yellow

Write-Host ""
Write-Host "✅ Configuración completada con éxito." -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Usuarios creados (password: conductor123 / admin123 / dispatcher123):" -ForegroundColor Green
Write-Host "  • mct-001 (Carlos Quispe Mamani)   → driver real #1" -ForegroundColor White
Write-Host "  • mct-002 (Luis Huamani Soto)      → driver real #2" -ForegroundColor White
Write-Host "  • mct-003 (José Ramírez Vega)      → driver real #3" -ForegroundColor White
Write-Host "  • mct-004 (Pedro Castillo Rojas)   → driver real #4" -ForegroundColor White
Write-Host "  • mct-005 (Miguel Torres Mendoza)  → driver real #5" -ForegroundColor White
Write-Host "  • conductor (Juan Pérez)           → alias del driver #1" -ForegroundColor Gray
Write-Host "  • admin                            → panel web /reports" -ForegroundColor Gray
Write-Host "  • dispatcher                       → panel web operativo" -ForegroundColor Gray
Write-Host "==========================================================" -ForegroundColor Cyan
