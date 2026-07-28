$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$imageDirectoryName = [string]([char]0x56FE) + [char]0x7247
$requiredPaths = @(
    'package.json',
    'vite.config.js',
    'src/main.jsx',
    'index.html',
    (Join-Path 'public' $imageDirectoryName),
    'public/frames'
)

foreach ($relativePath in $requiredPaths) {
    $absolutePath = Join-Path $projectRoot $relativePath
    if (-not (Test-Path -LiteralPath $absolutePath)) {
        throw "Missing required Vite project path: $relativePath"
    }
}

$package = Get-Content -Raw -LiteralPath (Join-Path $projectRoot 'package.json') | ConvertFrom-Json
if ($package.scripts.build -ne 'vite build') {
    throw 'package.json must define "build": "vite build".'
}

$html = Get-Content -Raw -LiteralPath (Join-Path $projectRoot 'index.html')
if ($html -notmatch '<script\s+type="module"\s+src="/src/main\.jsx"></script>') {
    throw 'index.html must load /src/main.jsx as a module.'
}

if ($html -notmatch 'id="react-vite-runtime"') {
    throw 'index.html must include the isolated React runtime mount.'
}

Write-Host 'PASS: React + Vite project contract is valid.'
