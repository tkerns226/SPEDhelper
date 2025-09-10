param(
  [int]$Port = 5500
)

$py = Get-Command python -ErrorAction SilentlyContinue
if (-not $py) { $py = Get-Command py -ErrorAction SilentlyContinue }
if (-not $py) { Write-Error "Python not found in PATH."; exit 1 }

$pwd = (Get-Location).Path
Write-Host "Starting server on http://127.0.0.1:$Port from $pwd"

$job = Start-Job -ScriptBlock {
  param($exe, $port, $root)
  Set-Location $root
  & $exe -m http.server $port --bind 127.0.0.1
} -ArgumentList $py.Source, $Port, $pwd

Start-Sleep -Seconds 1

try {
  $ok = Test-NetConnection -ComputerName 127.0.0.1 -Port $Port -InformationLevel Quiet
} catch { $ok = $false }

if ($ok) {
  Start-Process ("http://127.0.0.1:{0}" -f $Port) | Out-Null
  Write-Host "Server started. Job Id: $($job.Id)"
  Write-Host "Stop with: Stop-Job -Id $($job.Id) ; Remove-Job -Id $($job.Id)"
} else {
  Write-Warning "Server may not have started. Inspect: Receive-Job -Id $($job.Id) -Keep"
}

