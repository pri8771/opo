$ErrorActionPreference = 'Stop'
$taskRoot = $PSScriptRoot
$taskConfig = Get-Content (Join-Path $taskRoot 'config.json') -Raw | ConvertFrom-Json
$taskSecret = Import-Clixml $taskConfig.secret_path
$env:OPO_OPERATOR_KEY = $taskSecret.GetNetworkCredential().Password
try {
  & 'D:/Apps/Python.Python.3.11/python.exe' (Join-Path $taskRoot 'run.py') --config (Join-Path $taskRoot 'config.json')
  if ($LASTEXITCODE -ne 0) { throw "OPO worker exited $LASTEXITCODE" }
} finally { Remove-Item Env:OPO_OPERATOR_KEY -ErrorAction SilentlyContinue }
