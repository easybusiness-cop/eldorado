$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $projectRoot

$npmCommand = Get-Command npm.cmd -ErrorAction SilentlyContinue

if (-not $npmCommand) {
  $candidatePaths = @(
    (Join-Path $env:ProgramFiles "nodejs\npm.cmd"),
    (Join-Path $env:LOCALAPPDATA "Programs\nodejs\npm.cmd")
  )

  $ruffloNodeRoot = Join-Path $env:LOCALAPPDATA "Programs\RuffloNode"
  if (Test-Path -LiteralPath $ruffloNodeRoot) {
    $candidatePaths += Get-ChildItem -LiteralPath $ruffloNodeRoot -Directory -Filter "node-v*-win-x64" |
      Sort-Object LastWriteTime -Descending |
      ForEach-Object { Join-Path $_.FullName "npm.cmd" }
  }

  $npmPath = $candidatePaths |
    Where-Object { Test-Path -LiteralPath $_ } |
    Select-Object -First 1

  if (-not $npmPath) {
    throw "Node.js and npm were not found. Install Node.js LTS, then reopen this workspace."
  }

  $env:PATH = "$(Split-Path -Parent $npmPath);$env:PATH"
} else {
  $npmPath = $npmCommand.Source
}

if (-not (Test-Path -LiteralPath (Join-Path $projectRoot "node_modules\tsx\dist\cli.mjs"))) {
  throw "Project dependencies are missing. Run 'npm install' in the project folder, then reopen this workspace."
}

Write-Output "Rufflo dev server startup initiated."

try {
  $health = Invoke-RestMethod -Uri "http://localhost:3000/api/health" -TimeoutSec 3
  if ($health.status -eq "ok") {
    Write-Output "[Rufflo Server] Running on http://localhost:3000 (already running)"
    exit 0
  }
} catch {
  # No healthy Rufflo server is listening yet; start the development server below.
}

& $npmPath run dev
exit $LASTEXITCODE
