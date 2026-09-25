# 05. Production Operations & Troubleshooting Guide

This guide is the operational runbook for running, maintaining, releasing, backing up, and troubleshooting the **Rumluos** application in production.

---

## 1. Daily Operations Runbook

### Service Status
Check container health across the entire stack:
```bash
scripts/05_healthcheck.sh
```
Or check with Docker Compose directly:
```bash
docker compose --env-file .env -f docker/docker-compose.yaml ps
```

### Inspecting Live Logs
* **Stream all logs**:
  ```bash
  make logs
  ```
* **Stream backend logs (Spring Boot)**:
  ```bash
  docker compose --env-file .env -f docker/docker-compose.yaml logs -f --tail=100 backend
  ```
* **Stream frontend logs (Next.js)**:
  ```bash
  docker compose --env-file .env -f docker/docker-compose.yaml logs -f --tail=100 frontend
  ```
* **Stream web gateway logs (Nginx)**:
  ```bash
  docker compose --env-file .env -f docker/docker-compose.yaml logs -f --tail=100 nginx
  ```

### Restarting a Specific Service
To restart only the backend without touching the database or frontend:
```bash
docker compose --env-file .env -f docker/docker-compose.yaml restart backend
```

---

## 2. Release Management & Version Bumping

The single source of truth for application versions is the [**`VERSION`**](file:///media/menglanghuo/Menglang/Personal/Rumluos%20App/VERSION) file in the root directory.

### Deploying a New Release:
1. Update the version number in `VERSION`:
   ```bash
   printf '0.2.0\n' > VERSION
   ```
2. Verify:
   ```bash
   make version
   # Output: Rumluos version: 0.2.0
   ```
3. Build new Docker images tagged with the new version:
   ```bash
   scripts/01_build.sh
   ```
4. Deploy the new version and run health checks:
   ```bash
   scripts/02_deploy.sh
   ```
5. Tag the release in Git:
   ```bash
   git add VERSION
   git commit -m "Release v0.2.0"
   git tag v0.2.0
   git push origin main --tags
   ```

---

## 3. Instant Rollbacks

If a new deployment has bugs or fails smoke tests, roll back immediately to a previously built version:

```bash
# 1. View locally available image versions
docker images 'rumluos-*'

# 2. Execute guarded rollback to the known-good version
CONFIRM_ROLLBACK=1 scripts/06_rollback.sh 0.1.0
```

### What the rollback script does:
1. Verifies that `rumluos-backend:0.1.0` and `rumluos-frontend:0.1.0` exist in local Docker storage.
2. Updates `VERSION` back to `0.1.0`.
3. Runs `docker compose up -d --no-build` (boots the old images in seconds without recompiling).
4. Automatically runs `scripts/05_healthcheck.sh` to confirm recovery.

> [!NOTE]
> Database migrations: Application rollback does not reverse Flyway database migrations. Ensure all database migrations are backwards-compatible, and always take a backup before schema changes.

---

## 4. Database Backup & Disaster Recovery

### Creating a Backup
```bash
scripts/03_backup.sh
```
* **How it works**:
  * If `POSTGRES_HOST=postgres` (local Docker), it runs `pg_dump` via `compose exec`.
  * If `POSTGRES_HOST` points to AWS RDS, it executes `pg_dump` using an ephemeral `postgres:17-alpine` container on the private network.
* Backups are saved in `backups/rumluos_YYYYMMDDTHHMMSSZ.dump` with custom PostgreSQL compressed binary format.

### Restoring a Backup
```bash
CONFIRM_RESTORE=1 scripts/04_restore.sh backups/rumluos_20260922T080000Z.dump
```
*(Requires `CONFIRM_RESTORE=1` as a safety gate to prevent accidental data overwrites).*

---

## 5. Troubleshooting Matrix

### Issue 1: Browser Shows `502 Bad Gateway`
* **Symptoms**: Navigating to `http://localhost` or your domain displays `502 Bad Gateway` from Nginx.
* **Cause**: Nginx is running, but the backend (`backend:8080`) or frontend (`frontend:3000`) is not responding.
* **How to Fix**:
  1. Check container status: `docker compose --env-file .env -f docker/docker-compose.yaml ps`.
  2. Spring Boot on first boot runs Flyway migrations and takes ~20–30 seconds. Wait 30 seconds and refresh.
  3. Inspect backend logs:
     ```bash
     docker compose --env-file .env -f docker/docker-compose.yaml logs --tail=100 backend
     ```
  4. If backend is crashing, check for database connectivity errors or missing secrets in `.env`.

---

### Issue 2: `Connection Refused` to PostgreSQL
* **Symptoms**: Backend logs show: `Connection refused: postgres:5432` or `r2dbc:postgresql connection failure`.
* **Causes & Solutions**:
  * **In Local Docker**:
    - Ensure `postgres` service is running: `docker compose --env-file .env -f docker/docker-compose.yaml up -d postgres`.
    - Test postgres health: `docker compose --env-file .env -f docker/docker-compose.yaml exec postgres pg_isready -U rumluos -d rumluos_db`.
  * **On AWS EC2 with RDS**:
    - Verify `POSTGRES_HOST` in `.env` matches your RDS endpoint (`terraform output db_endpoint`).
    - Verify `rumluos-db-sg` has an inbound rule allowing port 5432 from `rumluos-app-sg`.
    - Test connectivity from EC2:
      ```bash
      nc -zv <YOUR_RDS_ENDPOINT> 5432
      ```

---

### Issue 3: S3 Document Uploads Fail (`Access Denied` / 403)
* **Symptoms**: Creating a document upload presigned URL fails with `software.amazon.awssdk.services.s3.model.S3Exception: Access Denied`.
* **Causes & Solutions**:
  * **EC2 Metadata Hop Limit (IMDSv2)**:
    - In Docker bridge network mode, the metadata service requires a hop limit of **2**. If set to 1, the container cannot read IAM role credentials.
    - Check and update using AWS CLI:
      ```bash
      aws ec2 modify-instance-metadata-options \
        --instance-id <YOUR_EC2_INSTANCE_ID> \
        --http-put-response-hop-limit 2
      ```
  * **IAM Policy**:
    - Verify the attached role `rumluos-ec2-role` includes `s3:PutObject`, `s3:GetObject`, and `s3:ListBucket` on your bucket ARN.
  * **Bucket Name Typo**:
    - Check `AWS_S3_BUCKET` in `.env`. Ensure it does not have the `arn:aws:s3:::` prefix.

---

### Issue 4: Out Of Memory (OOM) Killed During `scripts/01_build.sh`
* **Symptoms**: Compiling on a `t3.micro` EC2 instance hangs or shows `Killed` / `Exit Code 137`.
* **Cause**: `t3.micro` only has 1 GB of RAM. Compiling Java 25 and Next.js simultaneously exceeds 1 GB.
* **Solution (Add Swap Space on EC2)**:
  Run these commands on the EC2 host to create a 2 GB swap file:
  ```bash
  sudo dd if=/dev/zero of=/swapfile bs=128M count=16
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
  echo '/swapfile swap swap defaults 0 0' | sudo tee -a /etc/fstab
  ```
  Check with: `free -h`. Compilation will now succeed reliably without crashes.

---

### Issue 5: Flyway Database Migration Checksum Mismatch
* **Symptoms**: Backend logs show: `FlywayException: Validate failed: Migrations have failed validation. Checksum mismatch for migration version X`.
* **Cause**: An existing SQL migration file in `src/main/resources/db/migration` was edited after it had already been applied to the database.
* **Solution**:
  - Never edit applied migration files. Instead, create a new migration file (e.g. `V19__my_fix.sql`).
  - If in development and you intentionally want to repair checksums:
    ```bash
    # Run flyway repair or recreate the local database volume:
    docker compose --env-file .env -f docker/docker-compose.yaml down -v
    ```
