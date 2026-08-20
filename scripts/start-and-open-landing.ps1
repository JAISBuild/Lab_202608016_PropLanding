# Start API/web and open landing until HTTP 200
$ErrorActionPreference = "Continue"
$root = "c:\!Dev\Apps\Lab_202608016_PropLanding"
$url = "http://localhost:3000/c/riverside"
$envFile = Join-Path $root ".env"
$maxAttempts = 30

Set-Location $root

function Test-Landing {
    try {
        $r = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 15
        return ($r.StatusCode -eq 200 -and $r.Content.Length -gt 1000)
    } catch { return $false }
}

function Test-ApiReady {
    try {
        $r = Invoke-WebRequest -Uri "http://localhost:4000/ready" -UseBasicParsing -TimeoutSec 8
        return ($r.StatusCode -eq 200)
    } catch { return $false }
}

# Kill stale listeners if needed
foreach ($port in 3000,4000) {
    Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue |
        ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
    Start-Sleep -Seconds 1
}

Write-Host "Starting API..."
Start-Process powershell -WindowStyle Hidden -ArgumentList @(
    "-NoProfile","-Command",
    "Set-Location '$root'; corepack pnpm --filter @proplanding/api exec tsx watch --env-file '$envFile' src/index.ts"
) | Out-Null

Write-Host "Starting Web (Turbopack)..."
Start-Process powershell -WindowStyle Hidden -ArgumentList @(
    "-NoProfile","-Command",
    "Set-Location '$root'; corepack pnpm --filter @proplanding/web exec next dev --turbopack --port 3000"
) | Out-Null

for ($i = 1; $i -le $maxAttempts; $i++) {
    Write-Host "Attempt $i/$maxAttempts ..."
    Start-Sleep -Seconds 8
    $ready = Test-ApiReady
    $landing = Test-Landing
    Write-Host "  ready=$ready landing=$landing"
    if ($ready -and $landing) {
        Start-Process $url
        Write-Host "SUCCESS: opened $url"
        exit 0
    }
}

Write-Host "FAILED after $maxAttempts attempts"
exit 1
