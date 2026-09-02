# QuickTranslate Build Script for Chrome Web Store
param(
    [switch]$SkipUpload
)

$ErrorActionPreference = "Stop"
Add-Type -Assembly System.IO.Compression.FileSystem
$ProjectRoot = $PSScriptRoot
$OutputFile = Join-Path $ProjectRoot "quicktranslate-webstore.zip"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "QuickTranslate WebStore Build" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Files to include (hardcoded list, explicitly complete)
$Files = @(
    "manifest.json",
    "background.js",
    "content-japanese.js",
    "content-text-extract.js",
    "content-ui.js",
    "content.js",
    "content.css",
    "quick-panel.js",
    "quick-panel.css",
    "float-panel.js",
    "float-panel.css",
    "popup.html",
    "popup.css",
    "popup.js",
    "tesseract.min.js",
    "i18n.js",
    "sandbox.html",
    "module-host.html",
    "module-host.js"
)

$Directories = @(
    "core",
    "modules",
    "icons"
)

$TempDir = Join-Path $ProjectRoot "_build_temp"

# Clean previous build
if (Test-Path $OutputFile) {
    Remove-Item -Force $OutputFile
    Write-Host "[CLEAN] Removed old build" -ForegroundColor Yellow
}
if (Test-Path $TempDir) {
    Remove-Item -Recurse -Force $TempDir
}
New-Item -ItemType Directory -Path $TempDir | Out-Null

# Copy files
Write-Host "[BUILD] Copying files..." -ForegroundColor Yellow
$missing = $false
foreach ($file in $Files) {
    $src = Join-Path $ProjectRoot $file
    if (Test-Path $src) {
        Copy-Item $src $TempDir
        Write-Host "  + $file" -ForegroundColor Green
    } else {
        Write-Host "  ! $file NOT FOUND" -ForegroundColor Red
        $missing = $true
    }
}

# Copy directories
foreach ($dir in $Directories) {
    $src = Join-Path $ProjectRoot $dir
    if (Test-Path $src -PathType Container) {
        Copy-Item $src $TempDir -Recurse
        Write-Host "  + $dir/" -ForegroundColor Green
    } else {
        Write-Host "  ! $dir/ NOT FOUND" -ForegroundColor Red
        $missing = $true
    }
}

if ($missing) {
    Remove-Item -Recurse -Force $TempDir
    Write-Host ""
    Write-Host "[ERROR] Build aborted: missing files" -ForegroundColor Red
    exit 1
}

# Create ZIP
Write-Host ""
Write-Host "[BUILD] Creating ZIP archive..." -ForegroundColor Yellow
Compress-Archive -Path (Join-Path $TempDir "*") -DestinationPath $OutputFile -CompressionLevel Optimal

# Verify ZIP contents
Write-Host ""
Write-Host "[VERIFY] ZIP contents:" -ForegroundColor Yellow
$zip = [System.IO.Compression.ZipFile]::OpenRead($OutputFile)
foreach ($entry in $zip.Entries) {
    Write-Host "    $($entry.FullName)" -ForegroundColor Gray
}
$zip.Dispose()

# Cleanup
Remove-Item -Recurse -Force $TempDir

$Size = [math]::Round((Get-Item $OutputFile).Length / 1KB, 2)
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "[DONE] Build complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "Output: $OutputFile" -ForegroundColor White
Write-Host "Size: $Size KB" -ForegroundColor White
Write-Host ""
Write-Host "Ready for Chrome Web Store upload!" -ForegroundColor Cyan
