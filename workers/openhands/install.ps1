[CmdletBinding()]
param(
  [string]$Python = "py",
  [switch]$SkipNodeInstall
)

$ErrorActionPreference = "Stop"
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "../..")).Path
$venvPython = Join-Path $PSScriptRoot ".venv/Scripts/python.exe"
$lockFile = Join-Path $PSScriptRoot "requirements.lock.txt"

Push-Location $repoRoot
try {
  if (-not $SkipNodeInstall) {
    & npm.cmd ci
    if ($LASTEXITCODE -ne 0) { throw "npm ci failed with exit code $LASTEXITCODE." }
  }

  if (-not (Test-Path -LiteralPath $venvPython)) {
    & $Python -3.13 -m venv (Join-Path $PSScriptRoot ".venv")
    if ($LASTEXITCODE -ne 0) { throw "Could not create the OpenHands Python 3.13 environment." }
  }

  & $venvPython -m pip install --requirement $lockFile
  if ($LASTEXITCODE -ne 0) { throw "OpenHands Python dependency installation failed." }

  $serverPackage = & $venvPython -c "from importlib.metadata import version; print(version('openhands-agent-server'))"
  if ($LASTEXITCODE -ne 0 -or $serverPackage.Trim() -ne "1.55.1") {
    throw "OpenHands Agent Server 1.55.1 was not installed as pinned."
  }

  $opencode = & npm.cmd exec -- opencode --version
  if ($LASTEXITCODE -ne 0 -or $opencode.Trim() -ne "1.19.4") {
    throw "OpenCode CLI 1.19.4 was not installed as pinned."
  }

  Write-Host "Rufflo coding dependencies installed: OpenHands 1.55.1 and OpenCode 1.19.4."

  $dockerPath = (Get-Command docker -ErrorAction SilentlyContinue).Source
  if (-not $dockerPath) {
    $dockerPath = @(
      (Join-Path $env:ProgramFiles "Docker/Docker/resources/bin/docker.exe"),
      (Join-Path $env:LOCALAPPDATA "Programs/Docker/Docker/resources/bin/docker.exe")
    ) | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
  }

  if ($dockerPath) {
    & $dockerPath pull ghcr.io/openhands/agent-server:1.55.1-python
    if ($LASTEXITCODE -ne 0) { throw "Could not pull the pinned OpenHands Agent Server image." }

    & $dockerPath build --tag rufflo/openhands-controller:1.55.1 --file (Join-Path $PSScriptRoot "Dockerfile") $PSScriptRoot
    if ($LASTEXITCODE -ne 0) { throw "Could not build the OpenHands Docker-runtime controller image." }

    $workerDockerfile = Join-Path $repoRoot "workers/opencode/Dockerfile"
    & $dockerPath build --tag rufflo/opencode-worker:1.19.4 --file $workerDockerfile (Split-Path -Parent $workerDockerfile)
    if ($LASTEXITCODE -ne 0) { throw "Could not build the pinned OpenCode worker image." }

    Write-Host "Images prepared: rufflo/openhands-controller:1.55.1 and rufflo/opencode-worker:1.19.4."
    Write-Host "Create an egress-restricted Docker network and configure private runtime credentials before enabling agent tasks."
  }
  else {
    Write-Warning "Docker Engine is unavailable. Package install is complete, but isolated coding runtimes are not runnable on this host. Install Docker Desktop or use an isolated Linux worker host, then rerun this script to build the worker images."
  }
}
finally {
  Pop-Location
}
