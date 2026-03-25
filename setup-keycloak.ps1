# 🗝️ EcoRoute Keycloak Setup Script
# Este script configura automáticamente el entorno de identidad.

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "🚀 Iniciando Configuración de Keycloak para EcoRoute" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$KC_CONTAINER = "ecoroute-keycloak"

# 1. Autenticación
Write-Host "[1/6] Autenticando como administrador..." -ForegroundColor Yellow
docker exec $KC_CONTAINER /opt/keycloak/bin/kcadm.sh config credentials --server http://localhost:8080 --realm master --user admin --password admin

# 2. Crear Realm
Write-Host "[2/6] Creando Realm 'ecoroute'..." -ForegroundColor Yellow
docker exec $KC_CONTAINER /opt/keycloak/bin/kcadm.sh create realms -s realm=ecoroute -s enabled=true

# 3. Crear Cliente
Write-Host "[3/6] Creando Cliente 'mobile-app'..." -ForegroundColor Yellow
docker exec $KC_CONTAINER /opt/keycloak/bin/kcadm.sh create clients -r ecoroute -s clientId=mobile-app -s publicClient=true -s directAccessGrantsEnabled=true -s standardFlowEnabled=true

# 4. Crear Rol
Write-Host "[4/6] Creando Rol 'DRIVER'..." -ForegroundColor Yellow
docker exec $KC_CONTAINER /opt/keycloak/bin/kcadm.sh create roles -r ecoroute -s name=DRIVER

# 5. Crear Usuario y Contraseña
Write-Host "[5/6] Creando Usuario 'conductor'..." -ForegroundColor Yellow
docker exec $KC_CONTAINER /opt/keycloak/bin/kcadm.sh create users -r ecoroute -s username=conductor -s enabled=true -s firstName=Juan -s lastName=Pérez
docker exec $KC_CONTAINER /opt/keycloak/bin/kcadm.sh set-password -r ecoroute --username conductor --new-password conductor123 --temporary=$false

# 6. Asignar Rol
Write-Host "[6/6] Asignando Rol 'DRIVER' al usuario 'conductor'..." -ForegroundColor Yellow
docker exec $KC_CONTAINER /opt/keycloak/bin/kcadm.sh add-roles -r ecoroute --uusername conductor --rolename DRIVER

Write-Host ""
Write-Host "✅ Configuración completada con éxito." -ForegroundColor Green
Write-Host "Usuario: conductor" -ForegroundColor Green
Write-Host "Password: conductor123" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan
