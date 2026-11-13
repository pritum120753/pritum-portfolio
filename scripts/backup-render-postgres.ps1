$ErrorActionPreference = "Stop"

$pgDump = Get-Command pg_dump -ErrorAction SilentlyContinue
$pgRestore = Get-Command pg_restore -ErrorAction SilentlyContinue
if (-not $pgDump -or -not $pgRestore) {
    throw "PostgreSQL client tools were not found. Install the PostgreSQL 18 command-line tools and make sure pg_dump and pg_restore are on PATH."
}

$backupDirectory = Join-Path $PSScriptRoot "..\database-backups"
New-Item -ItemType Directory -Path $backupDirectory -Force | Out-Null

$timestamp = (Get-Date).ToUniversalTime().ToString("yyyyMMdd-HHmmssZ")
$backupPath = Join-Path $backupDirectory "pritum-portfolio-db-$timestamp.dump"

Write-Host "Open Render Dashboard > your Postgres database > Connect."
Write-Host "Copy the External Database URL. It will be requested without echoing."
$secureUrl = Read-Host "External Database URL" -AsSecureString
$pointer = [IntPtr]::Zero

try {
    $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureUrl)
    $databaseUrl = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)

    if ([string]::IsNullOrWhiteSpace($databaseUrl) -or $databaseUrl -notmatch '^postgres(ql)?://') {
        throw "The value must be a PostgreSQL connection URL beginning with postgres:// or postgresql://."
    }

    # Keep the URL out of source files and command history. Child processes inherit this
    # process-scoped environment variable; it is removed as soon as the dump is verified.
    $env:PGDATABASE = $databaseUrl
    $databaseUrl = $null

    Write-Host "Creating a custom-format PostgreSQL dump..."
    & $pgDump.Source --format=custom --no-owner --no-privileges --file="$backupPath"
    if ($LASTEXITCODE -ne 0) {
        throw "pg_dump failed with exit code $LASTEXITCODE."
    }

    Write-Host "Verifying the dump archive..."
    $null = & $pgRestore.Source --list "$backupPath" 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "The dump was created but pg_restore could not read it."
    }

    $file = Get-Item -LiteralPath $backupPath
    Write-Host ""
    Write-Host "Backup completed and verified."
    Write-Host "File: $($file.FullName)"
    Write-Host ("Size: {0:N2} MB" -f ($file.Length / 1MB))
    Write-Host "Keep this file somewhere outside the repository and verify that it is included in your own backup storage."
}
catch {
    if (Test-Path -LiteralPath $backupPath) {
        Remove-Item -LiteralPath $backupPath -Force
    }
    throw
}
finally {
    Remove-Item Env:PGDATABASE -ErrorAction SilentlyContinue
    if ($pointer -ne [IntPtr]::Zero) {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
    }
    if ($secureUrl) { $secureUrl.Dispose() }
    $databaseUrl = $null
}
