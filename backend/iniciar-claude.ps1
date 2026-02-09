$configPath = "$env:APPDATA\Claude\claude_desktop_config.json"
$backendPath = "C:\Users\Usuario\Desktop\UIDEportes-backend\backend"
$genericConfig = "$backendPath\claude_config_generic.json"

Write-Host "🔄 Configurando Claude Desktop para autenticación en chat..." -ForegroundColor Cyan

# Copiar configuración genérica
Copy-Item $genericConfig $configPath -Force

Write-Host "✅ Configuración actualizada." -ForegroundColor Green
Write-Host "   Ahora Claude iniciará sin usuario pre-definido." -ForegroundColor Gray
Write-Host "   Deberás usar la herramienta 'solicitar_codigo_acceso' en el chat." -ForegroundColor Gray
Write-Host ""

# Reiniciar Claude
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
    Write-Host "⚠️  No se pudo iniciar Claude automáticamente. Por favor abre Claude Desktop manualmente." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🚀 ¡Listo!" -ForegroundColor Green
Write-Host "   Ahora habla con Claude y dile: 'Quiero iniciar sesión con mi correo: ferchoc1423@gmail.com'" -ForegroundColor Cyan
Write-Host ""
