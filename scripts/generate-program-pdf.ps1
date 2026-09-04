param(
  [string]$ChromePath = "C:\Program Files\Google\Chrome\Application\chrome.exe"
)

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
$sourcePath = Join-Path $projectRoot "chat.md"
$outputPath = Join-Path $projectRoot "public\documents\programme-electoral-uc.pdf"
$temporaryHtml = Join-Path ([System.IO.Path]::GetTempPath()) "uc-programme-electoral.html"
$temporaryProfile = Join-Path ([System.IO.Path]::GetTempPath()) ("uc-chrome-" + [guid]::NewGuid().ToString("N"))

if (-not (Test-Path -LiteralPath $ChromePath)) {
  throw "Chrome was not found at $ChromePath"
}

$source = Get-Content -Raw -Encoding UTF8 $sourcePath
$source = $source -replace '(?s)^<div dir="rtl" lang="ar">\s*', ''
$source = $source -replace '(?s)\s*</div>\s*$', ''
$source = $source -replace '\\\r?\n', "`n"

$lines = $source -split '\r?\n'
$body = [System.Text.StringBuilder]::new()
$inList = $false

foreach ($rawLine in $lines) {
  $line = $rawLine.Trim()
  if (-not $line) {
    if ($inList) { [void]$body.AppendLine('</ul>'); $inList = $false }
    continue
  }

  $encoded = [System.Net.WebUtility]::HtmlEncode($line)
  if ($line -match '^\*\*(.+)\*\*$') {
    if ($inList) { [void]$body.AppendLine('</ul>'); $inList = $false }
    $heading = [System.Net.WebUtility]::HtmlEncode($Matches[1])
    [void]$body.AppendLine("<h2>$heading</h2>")
  } elseif ($line -match '^[•*-]\s*(.+)$') {
    if (-not $inList) { [void]$body.AppendLine('<ul>'); $inList = $true }
    $item = [System.Net.WebUtility]::HtmlEncode($Matches[1])
    [void]$body.AppendLine("<li>$item</li>")
  } elseif ($line -match '^\d+\.\s+(.+)$') {
    if ($inList) { [void]$body.AppendLine('</ul>'); $inList = $false }
    $item = [System.Net.WebUtility]::HtmlEncode($Matches[1])
    [void]$body.AppendLine("<h3>$item</h3>")
  } else {
    if ($inList) { [void]$body.AppendLine('</ul>'); $inList = $false }
    $encoded = $encoded -replace '\*\*', ''
    [void]$body.AppendLine("<p>$encoded</p>")
  }
}

if ($inList) { [void]$body.AppendLine('</ul>') }

$html = @"
<!doctype html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8">
  <title>البرنامج الانتخابي لحزب الاتحاد الدستوري</title>
  <style>
    @page { size: A4; margin: 18mm 16mm; }
    body { color: #3a2410; font-family: "Segoe UI", Tahoma, Arial, sans-serif; font-size: 12pt; line-height: 1.85; }
    h2 { color: #b76820; font-size: 20pt; line-height: 1.4; margin: 1.3em 0 .45em; break-after: avoid; }
    h2:first-child { color: #3a2410; font-size: 27pt; text-align: center; margin-top: 0; }
    h3 { color: #8a5322; font-size: 14pt; margin: 1em 0 .25em; break-after: avoid; }
    p { margin: 0 0 .7em; text-align: justify; }
    ul { margin: .2em 1.4em .9em 0; padding: 0; }
    li { margin: 0 0 .25em; }
  </style>
</head>
<body>$body</body>
</html>
"@

[System.IO.File]::WriteAllText($temporaryHtml, $html, [System.Text.UTF8Encoding]::new($false))
try {
  $arguments = @(
    "--headless=new"
    "--disable-gpu"
    "--no-pdf-header-footer"
    "--user-data-dir=$temporaryProfile"
    "--print-to-pdf=$outputPath"
    "file:///$($temporaryHtml -replace '\\','/')"
  )
  $process = Start-Process -FilePath $ChromePath -ArgumentList $arguments -Wait -PassThru -WindowStyle Hidden
  if ($process.ExitCode -ne 0 -or -not (Test-Path -LiteralPath $outputPath)) {
    throw "Chrome failed to generate the electoral programme PDF."
  }
} finally {
  Remove-Item -LiteralPath $temporaryHtml -ErrorAction SilentlyContinue
  if (Test-Path -LiteralPath $temporaryProfile) {
    Remove-Item -LiteralPath $temporaryProfile -Recurse -Force -ErrorAction SilentlyContinue
  }
}

Write-Output $outputPath
