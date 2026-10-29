# Commit + push automatique à chaque modification (debounce de 5 s).
# Lancer : powershell -ExecutionPolicy Bypass -File .\auto-sync.ps1
$ErrorActionPreference = 'Continue'
Set-Location $PSScriptRoot
$delay = 5


$utf8 = New-Object System.Text.UTF8Encoding $false

# Met à jour ?v=<hash> des CSS/JS dans les pages HTML pour forcer le rechargement du cache.
function Update-AssetVersions {
    $assets = Get-ChildItem -Path (Join-Path $PSScriptRoot 'css'), (Join-Path $PSScriptRoot 'js') -File -Include *.css, *.js -Recurse
    $versions = @{}
    foreach ($a in $assets) {
        $rel = $a.FullName.Substring($PSScriptRoot.Length + 1).Replace('\', '/')
        $versions[$rel] = (Get-FileHash $a.FullName -Algorithm MD5).Hash.Substring(0, 8).ToLower()
    }
    foreach ($page in Get-ChildItem -Path $PSScriptRoot -Filter *.html -File) {
        $text = [IO.File]::ReadAllText($page.FullName)
        $new = [regex]::Replace($text, '(?<p>(?:css|js)/[\w\-./]+\.(?:css|js))(?:\?v=[\w]*)?(?=")', {
            param($m)
            $p = $m.Groups['p'].Value
            if ($versions.ContainsKey($p)) { "${p}?v=$($versions[$p])" } else { $m.Value }
        })
        if ($new -ne $text) { [IO.File]::WriteAllText($page.FullName, $new, $utf8) }
    }
}

function Sync-Now {
    Update-AssetVersions
    git add -A | Out-Null
    git diff --cached --quiet
    if ($LASTEXITCODE -ne 0) {
        git commit -m ("Auto-save " + (Get-Date -Format 'yyyy-MM-dd HH:mm:ss')) | Out-Null
        git push origin HEAD
        Write-Host ("[{0}] Poussé sur GitHub" -f (Get-Date -Format 'HH:mm:ss'))
    }
}

Write-Host "Surveillance active (Ctrl+C pour arrêter)..."
while ($true) {
    try {
        if (git status --porcelain) {
            # Laisser finir les enregistrements en cours avant de commiter
            Start-Sleep -Seconds $delay
            Sync-Now
        }
    } catch {
        Write-Host ("Erreur : " + $_.Exception.Message)
    }
    Start-Sleep -Seconds 3
}