$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.IO.Compression.FileSystem

$root  = "C:\Users\hesssasc\Downloads\MPFB\assetpacks"
$stage = "C:\Users\hesssasc\AppData\Local\Temp\opencode\packs"
$log   = Join-Path $stage "installed.csv"

New-Item -ItemType Directory -Force -Path $root, $stage | Out-Null

$list = @()
foreach ($f in @("packs.csv", "packs_extra.csv")) {
    $list += Import-Csv (Join-Path "C:\Users\hesssasc\AppData\Local\Temp\opencode" $f)
}
$list += [pscustomobject]@{ slug = "faceunits01"; url = "https://files.makehumancommunity.org/functional/faceunits01.zip" }
$list += [pscustomobject]@{ slug = "visemes01";   url = "https://files.makehumancommunity.org/functional/visemes01.zip" }
$list += [pscustomobject]@{ slug = "visemes02";   url = "https://files.makehumancommunity.org/functional/visemes02.zip" }
$list += [pscustomobject]@{ slug = "haireditor";  url = "https://files.makehumancommunity.org/functional/haireditor.zip" }

$done = @{}
if (Test-Path $log) {
    Import-Csv $log | ForEach-Object { $done[$_.slug] = $true }
}

$total = $list.Count
$i = 0
foreach ($p in $list) {
    $i++
    $slug = $p.slug
    if ($done.ContainsKey($slug)) { continue }

    $zip = Join-Path $stage "$slug.zip"
    Write-Output "[$i/$total] $slug downloading"
    try {
        & curl.exe -L -sS --retry 3 --retry-delay 2 -o $zip $p.url
        if ($LASTEXITCODE -ne 0) { throw "curl exit $LASTEXITCODE" }
        if (-not (Test-Path $zip) -or (Get-Item $zip).Length -lt 100) { throw "empty download" }
    } catch {
        Write-Output "[$i/$total] $slug DOWNLOAD FAILED: $_"
        continue
    }

    $tmp = Join-Path $stage "_x"
    if (Test-Path $tmp) { Remove-Item $tmp -Recurse -Force }
    New-Item -ItemType Directory -Force -Path $tmp | Out-Null
    try {
        [System.IO.Compression.ZipFile]::ExtractToDirectory($zip, $tmp)
        $entries = @(Get-ChildItem $tmp -Force | Where-Object { $_.Name -notlike ".*" -and $_.Name -ne "__MACOSX" })
        $src = $tmp
        if (-not ($entries | Where-Object { $_.Name -eq "packs" })) {
            $dirs = @($entries | Where-Object { $_.PSIsContainer })
            if ($entries.Count -eq 1 -and $dirs.Count -eq 1) { $src = $dirs[0].FullName }
        }
        foreach ($e in (Get-ChildItem $src -Force | Where-Object { $_.Name -notlike ".*" -and $_.Name -ne "__MACOSX" })) {
            $dst = Join-Path $root $e.Name
            if ($e.PSIsContainer) {
                & robocopy $e.FullName $dst /E /NFL /NDL /NJH /NJS /NC /NS /NP | Out-Null
                if ($LASTEXITCODE -ge 8) { throw "robocopy $($e.Name) exit $LASTEXITCODE" }
            } else {
                Copy-Item $e.FullName $dst -Force
            }
        }
        Write-Output "[$i/$total] $slug extracted"
    } catch {
        Write-Output "[$i/$total] $slug EXTRACT FAILED: $_"
        if (Test-Path $tmp) { Remove-Item $tmp -Recurse -Force -ErrorAction SilentlyContinue }
        continue
    }
    if (Test-Path $tmp) { Remove-Item $tmp -Recurse -Force -ErrorAction SilentlyContinue }
    Remove-Item $zip -Force -ErrorAction SilentlyContinue
    [pscustomobject]@{ slug = $slug; url = $p.url; when = (Get-Date -Format s) } |
        Export-Csv $log -Append -NoTypeInformation
    $free = [math]::Round((Get-PSDrive C).Free / 1GB, 2)
    Write-Output "[$i/$total] $slug OK  free=${free}GB"
}

Write-Output "ALL DONE"
