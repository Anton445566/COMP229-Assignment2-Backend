$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$projectRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$outputDirectory = Join-Path $projectRoot 'submission'
New-Item -ItemType Directory -Force -Path $outputDirectory | Out-Null
$archivePath = Join-Path $outputDirectory 'COMP229_Assignment3_Portfolio.zip'
$stream = [IO.File]::Open($archivePath, [IO.FileMode]::Create)
$archive = [IO.Compression.ZipArchive]::new($stream, [IO.Compression.ZipArchiveMode]::Create)
try {
    $rootFiles = @('.env.example', '.gitignore', 'README.md', 'package.json', 'package-lock.json', 'server.js', 'template.js')
    $files = @($rootFiles | ForEach-Object { Get-Item -LiteralPath (Join-Path $projectRoot $_) })
    foreach ($folder in @('client', 'config', 'server', 'scripts')) {
        $files += Get-ChildItem -LiteralPath (Join-Path $projectRoot $folder) -File -Recurse |
            Where-Object { $_.FullName -notmatch '[\\/](node_modules|dist|coverage|reference|references|\.npm-cache|\.git)[\\/]' -and
                $_.Name -notmatch '^\.env($|\.)|\.log$|^yarn\.lock$' }
    }
    foreach ($file in $files) {
        $relativePath = $file.FullName.Substring($projectRoot.Length + 1).Replace('\', '/')
        [IO.Compression.ZipFileExtensions]::CreateEntryFromFile($archive, $file.FullName, $relativePath, [IO.Compression.CompressionLevel]::Optimal) | Out-Null
    }
} finally {
    $archive.Dispose()
    $stream.Dispose()
}
$verification = [IO.Compression.ZipFile]::OpenRead($archivePath)
try {
    $unsafe = @($verification.Entries | Where-Object { $_.FullName -match '(^|/)(node_modules|\.git|reference|references|submission|dist)/|(^|/)\.env($|/)|\.log$' })
    if ($unsafe.Count -gt 0) { throw 'Archive contains an excluded entry.' }
    if (-not ($verification.Entries.FullName -contains '.env.example')) { throw 'Missing safe environment example.' }
    Write-Output ("Submission ZIP verified: {0} ({1} files)" -f $archivePath, $verification.Entries.Count)
} finally { $verification.Dispose() }
