param(
  [switch]$SkipFrontend,
  [switch]$SkipBackend
)

$ErrorActionPreference = "Stop"

Write-Host "Setup started..." -ForegroundColor Cyan

$repoRoot = Split-Path -Parent $PSScriptRoot

if (-not $SkipBackend) {
  $backendVenv = Join-Path $repoRoot "backend\\.venv"
  $backendPython = Join-Path $backendVenv "Scripts\\python.exe"

  if (-not (Test-Path $backendPython)) {
    Write-Host "Creating backend virtual environment..." -ForegroundColor Yellow
    python -m venv $backendVenv
  }

  Write-Host "Installing backend requirements..." -ForegroundColor Yellow
  & $backendPython -m pip install -r (Join-Path $repoRoot "backend\\requirements.txt")
}

if (-not $SkipFrontend) {
  Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
  Push-Location (Join-Path $repoRoot "frontend")
  npm install
  Pop-Location
}

Write-Host "Setup complete." -ForegroundColor Green
