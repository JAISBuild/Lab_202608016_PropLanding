# Local Postgres bootstrap for PropLanding (dev only)
$ErrorActionPreference = "Stop"
$pgBin = "C:\Program Files\PostgreSQL\16\bin"
$pgData = "C:\Program Files\PostgreSQL\16\data"
$hba = Join-Path $pgData "pg_hba.conf"
$bak = "$hba.bak"
$psql = Join-Path $pgBin "psql.exe"
$pgCtl = Join-Path $pgBin "pg_ctl.exe"
$root = "c:\!Dev\Apps\Lab_202608016_PropLanding"

if (-not (Test-Path $psql)) { throw "PostgreSQL 16 not found" }
if (-not (Test-Path $bak)) { Copy-Item $hba $bak -Force }

function Restore-Hba {
    Copy-Item $bak $hba -Force
    & $pgCtl reload -D $pgData | Out-Null
}

function Enable-Trust {
    $text = Get-Content $bak -Raw
    $text = $text -replace 'scram-sha-256', 'trust'
    [System.IO.File]::WriteAllText($hba, $text, (New-Object System.Text.UTF8Encoding $false))
    & $pgCtl reload -D $pgData | Out-Null
    Start-Sleep -Seconds 2
}

Write-Host "Enabling temporary trust auth..."
Enable-Trust

Write-Host "Creating role proplanding..."
& $psql -U postgres -h 127.0.0.1 -p 5432 -d postgres -v ON_ERROR_STOP=1 -c "DO `$`$ BEGIN IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'proplanding') THEN CREATE ROLE proplanding LOGIN PASSWORD 'proplanding' CREATEDB; ELSE ALTER ROLE proplanding WITH LOGIN PASSWORD 'proplanding' CREATEDB; END IF; END `$`$;"
if ($LASTEXITCODE -ne 0) { Restore-Hba; throw "Failed to create proplanding role" }

$dbExists = & $psql -U postgres -h 127.0.0.1 -p 5432 -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='proplanding'"
if ($dbExists -ne "1") {
  & $psql -U postgres -h 127.0.0.1 -p 5432 -d postgres -v ON_ERROR_STOP=1 -c "CREATE DATABASE proplanding OWNER proplanding;"
  if ($LASTEXITCODE -ne 0) { Restore-Hba; throw "Failed to create proplanding database" }
}

Write-Host "Restoring pg_hba.conf..."
Restore-Hba

$env:DATABASE_URL = "postgresql://proplanding:proplanding@localhost:5432/proplanding?schema=public"
Push-Location (Join-Path $root "packages\database")
Write-Host "Running prisma migrate deploy..."
corepack pnpm exec prisma migrate deploy
if ($LASTEXITCODE -ne 0) { Pop-Location; throw "migrate deploy failed" }
Write-Host "Running seed..."
corepack pnpm exec prisma db seed
Pop-Location
Write-Host "DB setup complete."
