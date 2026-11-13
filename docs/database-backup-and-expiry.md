# Render PostgreSQL backup and expiry runbook

## Current production database

The Render database linked to the portfolio API is on the **Free** plan. Render currently reports this instance expiry:

- Created: November 4, 2026
- Expires: **December 4, 2026 at 02:27:54 UTC (08:27:54 Bangladesh time)**

This is an instance-specific expiry, not a recurring renewal date. Confirm the current expiry in the Render Dashboard before acting.

Render documents that Free Postgres databases expire 30 days after creation. Once expired, the database becomes inaccessible unless upgraded; there is a 14-day grace period to upgrade before Render deletes the database and its data. Free Postgres databases do not receive Render-managed backups. See [Render's Free instance limits](https://render.com/docs/free) and [Postgres backup documentation](https://render.com/docs/postgresql-backups).

## 1. Create an independent backup now

The repository includes a PowerShell helper:

```powershell
.\scripts\backup-render-postgres.ps1
```

Run it from the repository root on Windows. It requires the PostgreSQL command-line tools (`pg_dump` and `pg_restore`); the production database currently runs PostgreSQL 18, so install PostgreSQL 18 client tools where available.

The script:

1. Prompts for the Render **External Database URL** without echoing it.
2. Keeps the URL in a process-scoped environment variable instead of writing it to a file or source code.
3. Creates a custom-format dump in `database-backups\`.
4. Checks that `pg_restore --list` can read the resulting archive.
5. Removes the connection URL from the current PowerShell process when finished.

The `database-backups\` folder and `.dump` files are ignored by Git. **Do not commit, email, or paste the database URL or backup archive into source control or chat.** Store the verified dump somewhere outside this repository as a second copy.

## 2. Decide how to keep production running

Before the expiry time, choose one of these paths:

- **Keep the existing database:** upgrade this database to a paid Render Postgres plan in the Render Dashboard. Check the price and billing terms shown in the dashboard before confirming. An expired database is inaccessible until it is upgraded.
- **Move to another PostgreSQL instance:** create the destination database, restore the dump into an empty database, update the backend service's `DATABASE_URL` to the destination's External Database URL, and verify the API and Admin dashboard before retiring the old database.

Do not delete the current database or change the backend connection string until a backup has been created and verified and the destination has been tested.

## 3. Restore a custom-format dump to an empty database

Only restore into a new/empty PostgreSQL database. The command below does not include destructive `--clean` flags:

```powershell
$secureUrl = Read-Host "Destination External Database URL" -AsSecureString
$ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureUrl)
try {
    $env:PGDATABASE = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
    pg_restore --no-owner --no-privileges --format=custom --verbose .\database-backups\YOUR_BACKUP_FILE.dump
    if ($LASTEXITCODE -ne 0) { throw "pg_restore failed with exit code $LASTEXITCODE" }
}
finally {
    Remove-Item Env:PGDATABASE -ErrorAction SilentlyContinue
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
    $secureUrl.Dispose()
}
```

Replace `YOUR_BACKUP_FILE.dump` with the verified backup filename. Keep the destination URL private. Do not restore over a database containing important data.

After restoring, confirm the backend connects to the destination, run the deployed Prisma migration command if needed, and verify public portfolio content plus Admin login before switching traffic or retiring the source.

## 4. Completion checklist

- [ ] A fresh dump has been created and `pg_restore --list` verification passed.
- [ ] A second copy of the dump is stored outside the repository.
- [ ] The existing database has been upgraded, or a replacement database has been restored and verified.
- [ ] The backend service is connected to the intended database.
- [ ] Public portfolio content and Admin access have been checked.
- [ ] The old database is retained until the new setup is confirmed.
