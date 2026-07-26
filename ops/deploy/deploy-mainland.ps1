[CmdletBinding()]
param(
	[string]$ServerHost = $env:SERVER_HOST,
	[string]$ServerUser = $env:SERVER_USER,
	[string]$ServerPath = $env:SERVER_PATH,
	[int]$KeepReleases = 5,
	[switch]$Execute
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($ServerHost) -or
	[string]::IsNullOrWhiteSpace($ServerUser) -or
	[string]::IsNullOrWhiteSpace($ServerPath)) {
	throw "ServerHost, ServerUser and ServerPath are required. Use parameters or SERVER_HOST / SERVER_USER / SERVER_PATH."
}

if ($KeepReleases -lt 1) {
	throw "KeepReleases must be at least 1."
}

& corepack.cmd pnpm verify
if ($LASTEXITCODE -ne 0) {
	exit $LASTEXITCODE
}

$releaseId = [DateTime]::UtcNow.ToString("yyyyMMddTHHmmssZ")
$normalizedServerPath = $ServerPath.TrimEnd("/")
$releasePath = "$normalizedServerPath/releases/$releaseId"
$target = "$ServerUser@$ServerHost"

Write-Host "Target: $target`:$releasePath"
Write-Host "Current link: $normalizedServerPath/current"
Write-Host "Retained releases: $KeepReleases"

if (-not $Execute) {
	Write-Host "Dry run complete. Re-run with -Execute to upload and switch the current link."
	exit 0
}

$archivePath = Join-Path $env:TEMP "blog-release-$releaseId.tgz"
$resolvedTemp = [IO.Path]::GetFullPath($env:TEMP)
$resolvedArchive = [IO.Path]::GetFullPath($archivePath)
if (-not $resolvedArchive.StartsWith($resolvedTemp, [StringComparison]::OrdinalIgnoreCase)) {
	throw "Temporary archive path escaped the expected temp directory."
}

try {
	& tar.exe -C dist -czf $archivePath .
	if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

	& ssh $target "mkdir -p '$releasePath'"
	if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

	$remoteArchive = "$releasePath/release.tgz"
	& scp $archivePath "$target`:$remoteArchive"
	if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

	& ssh $target "tar -xzf '$remoteArchive' -C '$releasePath' && rm -f '$remoteArchive' && test -f '$releasePath/index.html' && test -f '$releasePath/404.html'"
	if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

	& ssh $target "ln -sfn '$releasePath' '$normalizedServerPath/current'"
	if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

	$pruneCommand = "ls -1dt '$normalizedServerPath/releases/'* 2>/dev/null | tail -n +$($KeepReleases + 1) | xargs -r rm -rf --"
	& ssh $target $pruneCommand
	if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}
finally {
	if (Test-Path -LiteralPath $archivePath) {
		Remove-Item -LiteralPath $archivePath -Force
	}
}

Write-Host "Deployment complete: $releaseId"
