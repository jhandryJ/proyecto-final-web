param(
    [Parameter(Mandatory = $true)]
    [ValidateSet("estudiante", "capitan", "admin")]
    [string]$usuario
)

$configPath = "$env:APPDATA\Claude\claude_desktop_config.json"
$backendPath = "C:\Users\Usuario\Desktop\UIDEportes-backend\backend"
$apiUrl = "http://localhost:3000"

# Mapeo de usuarios a IDs (basado en la base de datos actual)
$userIds = @{
    "estudiante" = 3
    "capitan"    = 2
    "admin"      = 1  # Jhandry Jaramillo
}

$userId = $userIds[$usuario]

Write-Host ""
Write-Host "🔐 Iniciando proceso de autenticación 2FA para: $usuario (ID: $userId)" -ForegroundColor Cyan
Write-Host ""

# Paso 1: Generar código de verificación
Write-Host "📧 Generando código de verificación..." -ForegroundColor Yellow

try {
    $generateResponse = Invoke-RestMethod -Uri "$apiUrl/api/mcp/generate-code" `
        -Method POST `
        -ContentType "application/json" `
        -Body (@{ userId = $userId } | ConvertTo-Json)
    
    if ($generateResponse.success) {
        Write-Host "✅ Código enviado a: $($generateResponse.email)" -ForegroundColor Green
        Write-Host "⏰ El código expirará en 10 minutos" -ForegroundColor Gray
        Write-Host ""
    }
    else {
        Write-Host "❌ Error al generar código: $($generateResponse.error)" -ForegroundColor Red
        exit 1
    }
}
catch {
    Write-Host "❌ Error de conexión con el servidor backend" -ForegroundColor Red
    Write-Host "   Asegúrate de que el servidor esté corriendo en $apiUrl" -ForegroundColor Yellow
    Write-Host "   Ejecuta: npm run dev" -ForegroundColor Gray
    exit 1
}

# Paso 2: Abrir página de verificación en el navegador
Write-Host "🌐 Abriendo página de verificación..." -ForegroundColor Yellow
$verifyUrl = "$apiUrl/public/verify-2fa.html?userId=$userId"
Start-Process $verifyUrl

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "  👉 INGRESA EL CÓDIGO EN LA PÁGINA WEB QUE SE ABRIÓ" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "Esperando verificación..." -ForegroundColor Gray

# Paso 3: Esperar a que el usuario verifique el código (polling)
$maxAttempts = 60  # 5 minutos (60 * 5 segundos)
$attempt = 0
$sessionToken = $null

while ($attempt -lt $maxAttempts -and -not $sessionToken) {
    Start-Sleep -Seconds 5
    $attempt++
    
    # Verificar si hay un token pendiente para este usuario
    try {
        $tokenResponse = Invoke-RestMethod -Uri "$apiUrl/api/mcp/get-pending-token/$userId" `
            -Method GET `
            -ErrorAction SilentlyContinue
        
        if ($tokenResponse.success) {
            $sessionToken = $tokenResponse.sessionToken
            break
        }
    }
    catch {
        # Continuar esperando
    }
    
    if ($attempt % 6 -eq 0) {
        $elapsed = [math]::Floor($attempt / 12)
        Write-Host "  Esperando... ($elapsed min)" -ForegroundColor DarkGray
    }
}

if (-not $sessionToken) {
    Write-Host ""
    Write-Host "❌ Tiempo de espera agotado" -ForegroundColor Red
    Write-Host "   No se detectó verificación del código" -ForegroundColor Yellow
    Write-Host "   Intenta de nuevo: .\cambiar-usuario-claude.ps1 $usuario" -ForegroundColor Gray
    exit 1
}

Write-Host ""
Write-Host "✅ Código verificado exitosamente!" -ForegroundColor Green
Write-Host ""

# Paso 4: Configurar Claude Desktop
Write-Host "⚙️  Configurando Claude Desktop..." -ForegroundColor Yellow

switch ($usuario) {
    "estudiante" { 
        Copy-Item "$backendPath\claude_config_estudiante.json" $configPath 
        Write-Host "✅ Configurado como ESTUDIANTE (Yandri, ID: 3)" -ForegroundColor Green
    }
    "capitan" { 
        Copy-Item "$backendPath\claude_config_capitan.json" $configPath 
        Write-Host "✅ Configurado como CAPITAN (Fernando, ID: 2)" -ForegroundColor Green
    }
    "admin" { 
        Copy-Item "$backendPath\claude_config_admin.json" $configPath 
        Write-Host "✅ Configurado como ADMIN (Jhandry, ID: 1)" -ForegroundColor Green
    }
}

# Leer la configuración actual
$config = Get-Content $configPath | ConvertFrom-Json

# Agregar el token de sesión a las variables de entorno del MCP
if (-not $config.mcpServers."uideportes-server".env) {
    $config.mcpServers."uideportes-server" | Add-Member -NotePropertyName "env" -NotePropertyValue @{} -Force
}

$config.mcpServers."uideportes-server".env.MCP_SESSION_TOKEN = $sessionToken

# Guardar configuración actualizada
$config | ConvertTo-Json -Depth 10 | Set-Content $configPath

Write-Host "✅ Token de sesión configurado" -ForegroundColor Green
Write-Host ""

# Paso 5: Cerrar y abrir Claude Desktop
Write-Host "🔄 Reiniciando Claude Desktop..." -ForegroundColor Yellow
Stop-Process -Name "Claude" -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Buscar y abrir Claude Desktop
$claudePaths = @(
    "C:\Users\Usuario\AppData\Local\Programs\Claude\Claude.exe",
    "$env:LOCALAPPDATA\Programs\Claude\Claude.exe",
    "C:\Program Files\Claude\Claude.exe",
    "C:\Program Files (x86)\Claude\Claude.exe"
)

$claudeFound = $false
foreach ($path in $claudePaths) {
    if (Test-Path $path) {
        Start-Process $path
        $claudeFound = $true
        Write-Host "✅ Claude Desktop iniciado" -ForegroundColor Green
        break
    }
}

if (-not $claudeFound) {
    Write-Host "⚠️  Abre Claude Desktop manualmente desde el menú de inicio" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host "  ✅ AUTENTICACIÓN COMPLETADA" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Próximos pasos:" -ForegroundColor Cyan
Write-Host "   1. Espera 5-10 segundos a que Claude Desktop se conecte" -ForegroundColor White
Write-Host "   2. Pregunta: '¿Cuáles son mis equipos?'" -ForegroundColor White
Write-Host ""
