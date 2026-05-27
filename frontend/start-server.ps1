$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$envFile = Join-Path $projectRoot ".env.local"

if (!(Test-Path -LiteralPath $envFile)) {
  throw "Crie o arquivo frontend\\.env.local antes de iniciar o frontend."
}

if (-not $env:HOSTNAME) {
  $env:HOSTNAME = "0.0.0.0"
}

if (-not $env:PORT) {
  $env:PORT = "4006"
}

Write-Host "Gerando build do frontend..."
& npm run build
if ($LASTEXITCODE -ne 0) {
  exit $LASTEXITCODE
}

Write-Host "Iniciando frontend em http://$($env:HOSTNAME):$($env:PORT)..."
& npm run start
