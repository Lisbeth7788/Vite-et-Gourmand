# Commit + push automatique à chaque modification (debounce de 5 s).
# Lancer : powershell -ExecutionPolicy Bypass -File .\auto-sync.ps1
$ErrorActionPreference = 'Continue'
Set-Location $PSScriptRoot
$delay = 5

$fsw = New-Object System.IO.FileSystemWatcher $PSScriptRoot
$fsw.IncludeSubdirectories = $true
$fsw.EnableRaisingEvents = $true

function Sync-Now {
    git add -A | Out-Null
    git diff --cached --quiet
    if ($LASTEXITCODE -ne 0) {
        git commit -m ("Auto-save " + (Get-Date -Format 'yyyy-MM-dd HH:mm:ss')) | Out-Null
        git push origin HEAD
        Write-Host ("[{0}] Poussé sur GitHub" -f (Get-Date -Format 'HH:mm:ss'))
    }
}

Write-Host "Surveillance active (Ctrl+C pour arrêter)..."
Sync-Now
while ($true) {
    $r = $fsw.WaitForChanged([System.IO.WatcherChangeTypes]::All, 2000)
    if ($r.TimedOut) { continue }
    if ($r.Name -like '.git*' -or $r.Name -like 'node_modules*' -or $r.Name -like 'mongo-data*') { continue }
    # Attendre la fin de la rafale de modifications
    do { $r = $fsw.WaitForChanged([System.IO.WatcherChangeTypes]::All, $delay * 1000) } until ($r.TimedOut)
    Sync-Now
}
