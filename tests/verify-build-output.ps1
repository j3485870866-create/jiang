$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$distRoot = Join-Path $projectRoot 'dist'
$imageDirectoryName = [string]([char]0x56FE) + [char]0x7247

$requiredPaths = @(
    (Join-Path $distRoot 'index.html'),
    (Join-Path $distRoot $imageDirectoryName),
    (Join-Path $distRoot 'frames')
)

foreach ($absolutePath in $requiredPaths) {
    if (-not (Test-Path -LiteralPath $absolutePath)) {
        throw "Missing required build output: $absolutePath"
    }
}

$builtScripts = Get-ChildItem -LiteralPath (Join-Path $distRoot 'assets') -Filter '*.js' -File -ErrorAction SilentlyContinue
if (-not $builtScripts) {
    throw 'Vite did not emit a JavaScript entry in dist/assets.'
}

$sourceImageCount = (Get-ChildItem -LiteralPath (Join-Path $projectRoot "public/$imageDirectoryName") -Recurse -File).Count
$builtImageCount = (Get-ChildItem -LiteralPath (Join-Path $distRoot $imageDirectoryName) -Recurse -File).Count
if ($sourceImageCount -ne $builtImageCount) {
    throw "Image count mismatch: source=$sourceImageCount output=$builtImageCount"
}

$sourceFrameCount = (Get-ChildItem -LiteralPath (Join-Path $projectRoot 'public/frames') -Recurse -File).Count
$builtFrameCount = (Get-ChildItem -LiteralPath (Join-Path $distRoot 'frames') -Recurse -File).Count
if ($sourceFrameCount -ne $builtFrameCount) {
    throw "Frame count mismatch: source=$sourceFrameCount output=$builtFrameCount"
}

$builtHtml = Get-Content -Raw -LiteralPath (Join-Path $distRoot 'index.html')
if ($builtHtml -match 'file:///') {
    throw 'Built HTML contains an unsupported local file URL.'
}

Write-Host "PASS: Cloudflare build output is valid ($builtImageCount images, $builtFrameCount frame files)."
