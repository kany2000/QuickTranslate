# Build script for Chrome Web Store
$ErrorActionPreference = "Stop"

$ProjectRoot = "E:\projects\QuickTranslate"
$DistDir = Join-Path $ProjectRoot "dist"

# Create dist directory if not exists
if (!(Test-Path $DistDir)) {
    New-Item -ItemType Directory -Path $DistDir -Force | Out-Null
}

# Output zip path
$ZipPath = Join-Path $DistDir "QuickTranslate-2.5.2.zip"

# Remove old zip if exists
if (Test-Path $ZipPath) {
    Remove-Item $ZipPath -Force
}

# Files to include (in order they appear in manifest)
$Files = @(
    "manifest.json",
    "popup.html",
    "popup.css",
    "popup.js",
    "background.js",
    "content.js",
    "content.css",
    "i18n.js",
    "float-panel.js",
    "float-panel.css",
    "quick-panel.js",
    "quick-panel.css",
    "tesseract.min.js",
    "LICENSE",
    "README.md"
)

# Directories to include
$Directories = @(
    "_locales",
    "icons"
)

# Get all files first
$AllItems = @()
foreach ($file in $Files) {
    $path = Join-Path $ProjectRoot $file
    if (Test-Path $path) {
        $AllItems += $path
    } else {
        Write-Warning "File not found: $file"
    }
}

foreach ($dir in $Directories) {
    $path = Join-Path $ProjectRoot $dir
    if (Test-Path $path) {
        $AllItems += $path
    } else {
        Write-Warning "Directory not found: $dir"
    }
}

# Create zip using .NET
Add-Type -AssemblyName System.IO.Compression.FileSystem

$ZipStream = [System.IO.File]::Create($ZipPath)
$Archive = [System.IO.Compression.ZipFile]::Open($ZipPath, 'Create')
$Archive.Dispose()
$ZipStream.Dispose()

# Use Shell to create zip (more reliable)
$Shell = New-Object -ComObject Shell.Application
$ZipFolder = $Shell.Namespace($ZipPath)

foreach ($item in $AllItems) {
    if (Test-Path $item -PathType Leaf) {
        $ZipFolder.CopyHere($item)
        Write-Host "Added: $item"
    } elseif (Test-Path $item -PathType Container) {
        # For directories, copy all files recursively
        Get-ChildItem -Path $item -Recurse -File | ForEach-Object {
            $relativePath = $_.FullName.Substring($ProjectRoot.Length + 1)
            $ZipFolder.CopyHere($_.FullName)
            Write-Host "Added: $relativePath"
        }
    }
}

# Wait for zip operations to complete
Start-Sleep -Seconds 2

Write-Host ""
Write-Host "Zip created: $ZipPath" -ForegroundColor Green
Write-Host "Size: $([math]::Round((Get-Item $ZipPath).Length / 1KB, 2)) KB"
