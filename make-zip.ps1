$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$ProjectRoot = "E:\projects\QuickTranslate"
Set-Location $ProjectRoot

# Remove old zip
$ZipPath = "dist/QuickTranslate-2.5.2.zip"
if (Test-Path $ZipPath) { Remove-Item $ZipPath -Force }

# Add correct .NET assembly
Add-Type -AssemblyName System.IO.Compression.FileSystem

# Get all files
$Files = Get-ChildItem -Recurse -File | Where-Object {
    $_.FullName -notmatch '\\\.git\\' -and
    $_.FullName -notmatch '\\dist\\' -and
    $_.FullName -notlike '*\.zip'
}

Write-Host "Found $($Files.Count) files to zip"

# Create zip using ZipArchive
$Stream = [System.IO.File]::Create($ZipPath)
$Zip = [System.IO.Compression.ZipArchive]::new($Stream, 'Create', 'NoCompression')

foreach ($file in $Files) {
    $relativePath = $file.FullName.Substring($ProjectRoot.Length + 1)
    try {
        $entry = $Zip.CreateEntry($relativePath)
        $entryWriter = $entry.Open()
        [System.IO.File]::OpenRead($file.FullName).CopyTo($entryWriter)
        $entryWriter.Close()
        Write-Host "Added: $relativePath"
    } catch {
        Write-Host "Failed: $relativePath - $_"
    }
}

$Zip.Dispose()
$Stream.Dispose()

Write-Host ""
Write-Host "=== DONE ===" -ForegroundColor Green
Write-Host "Zip: $ZipPath"
if (Test-Path $ZipPath) {
    $size = [math]::Round((Get-Item $ZipPath).Length / 1KB, 2)
    Write-Host "Size: $size KB"
}