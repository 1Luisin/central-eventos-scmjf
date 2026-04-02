$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$jarPath = Join-Path $projectRoot "target\central-eventos-api-1.0.0.jar"

if (!(Test-Path -LiteralPath (Join-Path $projectRoot "datasource-local.properties"))) {
  throw "Crie o arquivo backend\\datasource-local.properties antes de iniciar a API."
}

if (!(Test-Path -LiteralPath (Join-Path $projectRoot "auth-local.properties"))) {
  throw "Crie o arquivo backend\\auth-local.properties antes de iniciar a API."
}

if (!(Test-Path -LiteralPath $jarPath)) {
  Write-Host "Build da API não encontrado. Gerando pacote..."
  & mvn -q -DskipTests package
  if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
  }
}

if (-not $env:SERVER_ADDRESS) {
  $env:SERVER_ADDRESS = "0.0.0.0"
}

if (-not $env:SERVER_PORT) {
  $env:SERVER_PORT = "8080"
}

if (-not $env:FRONTEND_BASE_URL) {
  $env:FRONTEND_BASE_URL = "http://172.18.2.246:3000"
}

Write-Host "Iniciando API em $($env:SERVER_ADDRESS):$($env:SERVER_PORT)..."
& java -jar $jarPath
