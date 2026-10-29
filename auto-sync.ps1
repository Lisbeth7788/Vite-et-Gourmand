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

$pageNames = @{
    'index.html' = "la page d'accueil"; 'menus.html' = 'la page des menus'; 'menu-detail.html' = "la page détail d'un menu"
    'commande.html' = 'la page de commande'; 'compte.html' = 'la page compte'; 'admin.html' = 'la page admin'
    'connexion.html' = 'la page de connexion'; 'inscription.html' = 'la page de création de compte'; 'contact.html' = 'la page contact'; 'histoire.html' = 'la page à propos'
    'cgv.html' = 'les CGV'; 'mentions-legales.html' = 'les mentions légales'; 'confidentialite.html' = 'la page confidentialité'
}

# Écrit un message de commit simple, comme une débutante : "Modification de ..."
function Get-CommitMessage {
    $files = @(git diff --cached --name-status | ForEach-Object { $_ })
    $parts = New-Object System.Collections.ArrayList
    foreach ($line in $files) {
        $status, $path = $line -split "`t", 2
        $name = Split-Path $path -Leaf
        $label = $null
        if ($pageNames.ContainsKey($name)) { $label = $pageNames[$name] }
        elseif ($path -like 'css/*') { $label = 'le design (CSS)' }
        elseif ($path -like 'js/*') { $label = 'le JavaScript' }
        elseif ($path -like 'api/*') { $label = "l'API PHP" }
        elseif ($path -like 'sql/*') { $label = 'la base de données' }
        elseif ($path -like 'images/*') { $label = 'les images' }
        elseif ($path -like '.git*' -or $name -eq 'auto-sync.ps1') { $label = 'la configuration' }
        else { $label = "le fichier $name" }
        if (-not $parts.Contains($label)) { [void]$parts.Add($label) }
    }
    if ($parts.Count -eq 0) { return 'Petite modification' }
    $verb = if (($files | Where-Object { $_ -like 'A*' }).Count -eq $files.Count) { 'Ajout de' } else { 'Modification de' }
    if ($parts.Count -gt 3) { return "$verb $($parts[0]), $($parts[1]) et d'autres fichiers" }
    return "$verb " + ($parts -join ', ')
}

function Sync-Now {
    Update-AssetVersions
    git add -A | Out-Null
    git diff --cached --quiet
    if ($LASTEXITCODE -ne 0) {
        git commit -m (Get-CommitMessage) | Out-Null
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