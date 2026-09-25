# 02. Local & On-Premise Setup Guide

This guide walks you through setting up, configuring, and running the **Rumluos** application on your local machine (laptop/desktop) or an on-premise physical server (Ubuntu, Debian, macOS, or Windows WSL2).

---

## 1. Prerequisites and System Requirements

### Hardware Requirements
* **CPU**: 2 cores minimum (4 cores recommended).
* **RAM**: 4 GB minimum (8 GB recommended for fast compilation of Spring Boot and Next.js).
* **Disk Space**: 10 GB free space for Docker images, dependencies, and database volumes.

### Software Installation

#### On Ubuntu / Debian Linux:
```bash
# 1. Update system packages
sudo apt update && sudo apt install -y curl git openssl

# 2. Install Docker Engine and Docker Compose v2
sudo apt install -y docker.io docker-compose-v2

# 3. Enable and start Docker service
sudo systemctl enable --now docker

# 4. Add your user to the docker group (so you don't need 'sudo' for docker commands)
sudo usermod -aG docker $USER

# 5. Log out and log back in, or run:
newgrp docker

# 6. Verify installation
docker --version
docker compose version
```

#### On macOS:
1. Install [Docker Desktop for Mac](https://www.docker.com/products/docker-desktop/) (choose Apple Silicon or Intel depending on your Mac).
2. Start Docker Desktop and verify in terminal:
   ```bash
   docker --version
   docker compose version
   git --version
   ```

#### On Windows 10 / 11:
1. Install [WSL2 (Windows Subsystem for Linux)](https://learn.microsoft.com/en-us/windows/wsl/install) by running in PowerShell as Administrator:
   ```powershell
   wsl --install
   ```
2. Install [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/) and ensure **"Use the WSL 2 based engine"** is enabled in Settings.
3. Open your Ubuntu WSL terminal and run all commands there.

---

## 2. Step 1: Clone the Code

Open your terminal and clone the repository:

```bash
git clone <YOUR_REPOSITORY_URL> rumluos
cd rumluos
```

Confirm that the project structure is intact:
```bash
ls -la
test -f VERSION && echo "✅ VERSION file found"
test -f docker/docker-compose.yaml && echo "✅ Docker Compose found"
test -x scripts/01_build.sh && echo "✅ Scripts are executable"
```

---

## 3. Step 2: Configure Environment Variables (.env)

Rumluos uses a `.env` file to configure database credentials, security keys, and network addresses without hardcoding secrets in Git.

```bash
# 1. Copy the example file
cp .env.example .env

# 2. Restrict read permissions to your user only
chmod 600 .env
```

### Complete Environment Variable Reference

Open `.env` in your editor (`nano .env`). Here is what each setting means:

| Variable | Default (Local) | Explanation |
| :--- | :--- | :--- |
| `COMPOSE_PROJECT_NAME` | `rumluos` | Prefix for Docker network and container names. |
| `APP_VERSION` | `0.1.0` | Matches the version in the `VERSION` file. |
| `POSTGRES_HOST` | `postgres` | Hostname of the database. For local Docker, leave as `postgres`. |
| `POSTGRES_PORT` | `5432` | Port of the database. |
| `POSTGRES_DB` | `rumluos_db` | Initial database name created by PostgreSQL. |
| `POSTGRES_USER` | `rumluos` | Database username. |
| `POSTGRES_PASSWORD` | *(Set strong password)* | Master password for PostgreSQL. **Must not be blank.** |
| `DOMAIN` | `localhost` | Domain name for public access. Set to `localhost` for local dev. |
| `JWT_PRIVATE_KEY` | *(Generated below)* | Base64-encoded RSA 2048 PKCS#8 private key for signing auth tokens. |
| `JWT_PUBLIC_KEY` | *(Generated below)* | Base64-encoded RSA 2048 X.509 public key for verifying auth tokens. |
| `AWS_S3_BUCKET` | `rumluos-local-bucket` | Name of the bucket for file uploads. |
| `AWS_S3_REGION` | `ap-southeast-1` | AWS Region (or default local region). |
| `API_INTERNAL_URL` | `http://backend:8080/api/v1` | Internal URL used by Next.js Server Actions to talk to Spring Boot. |

---

### Generating Your RSA 2048-Bit JWT Keys

Rumluos uses asymmetric RSA encryption for authentication tokens. You must generate a matching private and public key pair.

Run these commands directly in your terminal:

```bash
# 1. Generate an RSA 2048-bit private key
openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out jwt-private.pem

# 2. Extract the public key
openssl rsa -pubout -in jwt-private.pem -out jwt-public.pem

# 3. Print the base64-encoded private key (single line)
echo "=== COPY FOR JWT_PRIVATE_KEY ==="
base64 -w0 jwt-private.pem
echo -e "\n"

# 4. Print the base64-encoded public key (single line)
echo "=== COPY FOR JWT_PUBLIC_KEY ==="
base64 -w0 jwt-public.pem
echo -e "\n"

# 5. Clean up temporary PEM files
rm jwt-private.pem jwt-public.pem
```

*(Note for macOS: Use `base64` without `-w0`).*

Copy the printed strings into `JWT_PRIVATE_KEY` and `JWT_PUBLIC_KEY` in your `.env` file.

---

## 4. Step 3: Build the Docker Images

Before running the stack, build the Docker images:

```bash
scripts/01_build.sh
```
*(Or run `make build`).*

### What this script does:
1. Validates your Docker Compose configuration (`docker compose config`).
2. Builds **`rumluos-backend:0.1.0`**:
   - Copies Gradle wrapper and descriptors.
   - Pre-downloads dependencies into a cached Docker layer (`./gradlew dependencies`).
   - Compiles Spring Boot into an executable JAR.
   - Copies the JAR into an ultra-lean runtime container based on **Eclipse Temurin 25 JRE**.
   - Sets non-root user `rumluos:rumluos` (UID 10001) and JVM flag `-XX:MaxRAMPercentage=75`.
3. Builds **`rumluos-frontend:0.1.0`**:
   - Runs a 3-stage Next.js build (`deps` -> `build` -> `runner`).
   - Generates standalone output on Alpine Linux.
   - Configures non-root user `nextjs`.

---

## 5. Step 4: Launch and Verify

Start all containers in the background:

```bash
scripts/02_deploy.sh
```
*(Or run `make up`).*

### Verify Service Health
The deploy script automatically runs the health check at the end. You can also run it manually anytime:

```bash
scripts/05_healthcheck.sh
```

You should see output similar to:
```text
▶️  Validating Docker Compose configuration
ℹ️  Expected Rumluos version: 0.1.0
ℹ️  Container status
NAME                IMAGE                    COMMAND                  SERVICE             CREATED             STATUS                   PORTS
rumluos-backend-1   rumluos-backend:0.1.0    "java -XX:MaxRAMPerc…"   backend             20 seconds ago      Up 18 seconds (healthy)  8080/tcp
rumluos-frontend-1  rumluos-frontend:0.1.0   "docker-entrypoint.s…"   frontend            20 seconds ago      Up 18 seconds            3000/tcp
rumluos-nginx-1     nginx:1.27-alpine        "/docker-entrypoint.…"   nginx               20 seconds ago      Up 18 seconds            0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp
rumluos-postgres-1  postgres:17-alpine       "docker-entrypoint.s…"   postgres            20 seconds ago      Up 20 seconds (healthy)  5432/tcp
ℹ️  Backend health: {"status":"UP"}
ℹ️  Backend version: {"app":{"name":"rumluos","version":"0.1.0"}}
✅ Frontend is reachable
```

### Access the Web Application
Open your web browser and navigate to:
```text
http://localhost
```
You will see the Rumluos sign-in screen!

---

## 6. Daily Operations Runbook

### Streaming Logs
To view combined logs from all services in real time:
```bash
make logs
```
To view logs from a specific container:
```bash
docker compose --env-file .env -f docker/docker-compose.yaml logs -f backend
docker compose --env-file .env -f docker/docker-compose.yaml logs -f frontend
docker compose --env-file .env -f docker/docker-compose.yaml logs -f nginx
docker compose --env-file .env -f docker/docker-compose.yaml logs -f postgres
```

### Stopping the Stack
To safely stop all containers without losing database data:
```bash
make down
```

### Database Backup & Restore
* **Create a backup**:
  ```bash
  scripts/03_backup.sh
  ```
  *(Creates a timestamped file in `backups/rumluos_YYYYMMDDTHHMMSSZ.dump`).*
* **Restore a backup**:
  ```bash
  CONFIRM_RESTORE=1 scripts/04_restore.sh backups/rumluos_20260922T080000Z.dump
  ```

---

## 7. Native Developer Mode (Hot-Reload Outside Docker)

When you are actively writing code, restarting Docker containers can slow you down. You can run PostgreSQL in Docker while running Spring Boot and Next.js directly on your machine for instant hot-reload:

### 1. Start only PostgreSQL:
```bash
docker compose --env-file .env -f docker/docker-compose.yaml up -d postgres
```

### 2. Run the Spring Boot API (Backend):
* Requires **JDK 25** installed.
```bash
cd rumluos
./gradlew bootRun
```
The API is available at `http://localhost:8080`.

### 3. Run the Next.js Dashboard (Frontend):
* Requires **Node.js 22** installed.
```bash
cd rumluos-dashboard
npm install
npm run dev
```
The frontend is available at `http://localhost:3000` with instant React hot-reloading!
