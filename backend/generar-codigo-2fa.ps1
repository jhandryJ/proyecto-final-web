param(
    [Parameter(Mandatory = $true)]
    [ValidateSet("estudiante", "capitan", "admin")]
    [string]$usuario
)

# Mapeo de usuarios a IDs (basado en la base de datos actual)
$userIds = @{
    "estudiante" = 4
    "capitan"    = 5
    "admin"      = 1  # Jhandry Jaramillo - jhjaramillope@uide.edu.ec
}

$userId = $userIds[$usuario]
$backendPath = "C:\Users\Usuario\Desktop\UIDEportes-backend\backend"

Write-Host ""
Write-Host "🔐 Generando código de verificación 2FA para: $usuario (ID: $userId)" -ForegroundColor Cyan
Write-Host ""

# Ejecutar el helper de Node.js con tsx
Push-Location $backendPath
$output = npx tsx src/utils/generate-code-cli.ts $userId 2>&1 | Out-String
Pop-Location

# Parsear resultado (formato: SUCCESS:codigo:email:expiration)
if ($output -match "SUCCESS:(\d{6}):([^:]+):([^\s]+)") {
    $code = $matches[1]
    $email = $matches[2]
    $expiration = $matches[3]
    
    Write-Host "✅ Código generado exitosamente" -ForegroundColor Green
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
    Write-Host "  CÓDIGO DE VERIFICACIÓN: $code" -ForegroundColor Yellow -BackgroundColor Black
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "📧 Correo enviado a: $email" -ForegroundColor Cyan
    Write-Host "⏰ Expira en: 10 minutos" -ForegroundColor Gray
    Write-Host ""
    Write-Host "📝 PRÓXIMOS PASOS:" -ForegroundColor Cyan
    Write-Host "   1. Cierra Claude Desktop si está abierto" -ForegroundColor White
    Write-Host "   2. Ejecuta: .\cambiar-usuario-claude.ps1 $usuario" -ForegroundColor White
    Write-Host "   3. El servidor MCP verificará automáticamente este código" -ForegroundColor White
    Write-Host ""
}
else {
    Write-Host "❌ Error al generar código:" -ForegroundColor Red
    Write-Host $output -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Asegúrate de que:" -ForegroundColor Yellow
    Write-Host "   - El servidor backend esté corriendo (npm run dev)" -ForegroundColor Gray
    Write-Host "   - Las credenciales de email estén configuradas en .env" -ForegroundColor Gray
    Write-Host "   - El usuario con ID $userId exista en la base de datos" -ForegroundColor Gray
}

