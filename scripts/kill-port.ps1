# PowerShell script để kill process đang sử dụng port 3001
$port = 3001
$processes = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique

if ($processes) {
    foreach ($processId in $processes) {
        try {
            Stop-Process -Id $processId -Force -ErrorAction Stop
            Write-Host "✅ Killed process $processId on port $port" -ForegroundColor Green
        } catch {
            Write-Host "⚠️  Could not kill process $processId (might already be stopped)" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "✅ Port $port is free" -ForegroundColor Green
}

