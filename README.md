# Rumluos Deployment and Operations Guide

Rumluos is a business and loan operations system composed of:

- Spring WebFlux backend
- Next.js dashboard
- PostgreSQL database
- Nginx reverse proxy
- AWS S3 for file storage

The same Docker Compose structure is used locally and on AWS EC2.

> [!TIP]
> **Looking for a beginner-friendly, step-by-step tutorial?**
> Explore our complete **[Rumluos Documentation Hub](docs/README.md)** with dedicated guides:
> - [**01. Architecture Overview (Explain Like I'm 5)**](docs/01_ARCHITECTURE_OVERVIEW.md)
> - [**02. Local & On-Premise Setup Guide**](docs/02_LOCAL_ON_PREMISE_SETUP.md)
> - [**03. AWS Free-Tier Cloud Setup Guide**](docs/03_AWS_FREE_TIER_SETUP.md)
> - [**04. Terraform Automation Guide**](docs/04_TERRAFORM_AUTOMATION_GUIDE.md)
> - [**05. Production Operations & Troubleshooting Guide**](docs/05_OPERATIONS_AND_TROUBLESHOOTING.md)

## 1. Project structure

```text
.
├── VERSION                         # Single application version
├── .env.example                    # Environment template
├── docker/
│   └── docker-compose.yaml         # Application stack
├── nginx/
│   └── nginx.conf                  # Public reverse proxy
├── terraform/                      # AWS infrastructure (dev and prod)
├── rumluos/                        # Spring WebFlux backend
├── rumluos-dashboard/              # Next.js frontend
├── scripts/
│   ├── 01_build.sh                 # Build versioned Docker images
│   ├── 02_deploy.sh                # Start the application
│   ├── 03_backup.sh                # Backup PostgreSQL
│   ├── 04_restore.sh               # Restore PostgreSQL backup
│   ├── 05_healthcheck.sh            # Check all services
│   └── 06_rollback.sh               # Roll back to an old version
└── backups/                        # Local database backups, ignored by Git
```

## AWS infrastructure

Terraform configuration for AWS lives in [`terraform/`](terraform/). It provides separate `dev` and `prod` roots with reusable VPC/application modules. Dev is intentionally small for team testing; production is a multi-AZ starting point. See [`terraform/README.md`](terraform/README.md) for initialization and apply instructions.

## 2. Requirements

For local development or an EC2 server, install:

- Git
- Docker Engine
- Docker Compose v2
- At least 4 GB RAM recommended for building the Java and Next.js images

Java, Node.js, and PostgreSQL do not need to be installed directly when using Docker.

## 3. Clone the project

Clone the repository from your local machine or server:

```bash
git clone YOUR_REPOSITORY_URL rumluos
cd rumluos
```

Confirm the expected files exist:

```bash
ls
test -f VERSION
test -f docker/docker-compose.yaml
test -x scripts/01_build.sh
```

## 4. Configure environment variables

Create the local environment file:

```bash
cp .env.example .env
chmod 600 .env
nano .env
```

At minimum, set these values:

```env
APP_VERSION=0.1.0
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=rumluos_db
POSTGRES_USER=rumluos
POSTGRES_PASSWORD=use-a-long-random-password

JWT_PRIVATE_KEY=base64-pkcs8-private-key
JWT_PUBLIC_KEY=base64-x509-public-key

AWS_S3_BUCKET=your-private-s3-bucket
AWS_S3_PUBLIC_BUCKET_NAME=
AWS_S3_REGION=ap-southeast-1
```

Never commit `.env` to Git. Only `.env.example` belongs in the repository.

### Generate JWT keys

Run this on a secure machine:

```bash
openssl genpkey -algorithm RSA \
  -pkeyopt rsa_keygen_bits:2048 \
  -out jwt-private.pem

openssl rsa -pubout \
  -in jwt-private.pem \
  -out jwt-public.pem

base64 -w0 jwt-private.pem
base64 -w0 jwt-public.pem
```

Copy the two base64 values into `JWT_PRIVATE_KEY` and `JWT_PUBLIC_KEY` in `.env`.

Keep the private key secret. Generate a new pair if an old key was exposed.

## 5. Optional Grafana Cloud observability

The backend supports OpenTelemetry logs, traces, and metrics. All three signals are disabled by default, and each can be enabled independently. Grafana Cloud accepts OTLP for metrics, logs, and traces; Spring Boot uses Micrometer OTLP for application metrics and OpenTelemetry for tracing/logging.

From Grafana Cloud, open **Connections → OpenTelemetry** and copy the OTLP endpoint and authentication header. Put them only in the server `.env`:

```env
GRAFANA_OTLP_URL=https://otlp-gateway-<region>.grafana.net/otlp
GRAFANA_OTLP_AUTH=Authorization=Basic%20<base64-credentials>
OTEL_SERVICE_NAME=rumluos-backend
OTEL_SDK_DISABLED=false
```

Enable the signals you want:

```env
OTEL_TRACES_EXPORTER=otlp
OTEL_METRICS_EXPORTER=otlp
OTEL_METRICS_ENABLED=true
OTEL_LOGS_EXPORTER=otlp
```

To disable a signal, set its exporter to `none`:

```env
OTEL_TRACES_EXPORTER=none
OTEL_METRICS_EXPORTER=none
OTEL_METRICS_ENABLED=false
OTEL_LOGS_EXPORTER=none
```

`OTEL_METRICS_EXPORTER=otlp` selects the OpenTelemetry exporter, while `OTEL_METRICS_ENABLED=true` enables Spring/Micrometer OTLP metrics. Both are intentionally required for metrics. `OTEL_TRACES_SAMPLER_ARG=0.1` would sample approximately 10% of traces; use `1.0` for all traces during initial testing.

After changing telemetry settings, recreate the backend:

```bash
docker compose --env-file .env -f docker/docker-compose.yaml up -d --force-recreate backend
scripts/05_healthcheck.sh
```

Do not put Grafana authentication in Git or in frontend variables. Direct application-to-Grafana OTLP is suitable for this single-server setup; Grafana recommends Grafana Alloy as a collector for more reliable production pipelines and routing.

References: [Grafana Cloud OTLP](https://grafana.com/docs/grafana-cloud/send-data/otlp/send-data-otlp/), [Spring Boot observability](https://docs.spring.io/spring-boot/reference/actuator/observability.html).

## 6. Start locally

Validate the rendered Docker Compose configuration:

```bash
make config
```

Build the backend and frontend images:

```bash
scripts/01_build.sh
```

Start PostgreSQL, backend, frontend, and Nginx:

```bash
scripts/02_deploy.sh
```

Open the application:

```text
http://localhost
```

Check service status and versions:

```bash
scripts/05_healthcheck.sh
```

Useful local commands:

```bash
make logs
make down
docker compose --env-file .env -f docker/docker-compose.yaml ps
```

The public entrypoint is Nginx. PostgreSQL and the backend are not published directly to the host.

## 7. Manage application versions

`VERSION` is the single source of truth for frontend, backend, and Docker image tags:

```bash
printf '0.2.0\n' > VERSION
make version
scripts/01_build.sh
scripts/02_deploy.sh
```

This creates images similar to:

```text
rumluos-backend:0.2.0
rumluos-frontend:0.2.0
```

After testing a release:

```bash
git add VERSION
git commit -m "Release v0.2.0"
git tag v0.2.0
git push origin master --tags
```

The backend version is available at:

```text
http://localhost/actuator/info
```

## 8. Database backup and restore

Create a PostgreSQL backup before risky deployments or migrations:

```bash
scripts/03_backup.sh
ls -lh backups/
```

Restore a backup only when necessary. This replaces database contents:

```bash
CONFIRM_RESTORE=1 scripts/04_restore.sh backups/rumluos_<timestamp>.dump
```

Store production backups outside the EC2 instance as well, such as Amazon S3. The local `backups/` directory is ignored by Git.

## 9. Roll back a failed release

List locally available application images:

```bash
docker images 'rumluos-*'
```

Roll back to a previously built version:

```bash
CONFIRM_ROLLBACK=1 scripts/06_rollback.sh 0.1.0
```

The rollback script:

1. Verifies that both frontend and backend images exist.
2. Changes `VERSION` to the selected version.
3. Starts the old images with `--no-build`.
4. Runs the health checks.

Application rollback does not reverse Flyway database migrations. Keep migrations backward-compatible and always create a backup before schema changes.

## 10. Prepare AWS EC2

Create an Ubuntu EC2 instance and allocate an Elastic IP. An Elastic IP prevents the public server address from changing.

Configure the EC2 security group with these inbound rules:

```text
SSH    TCP 22   Your current public IP only
HTTP   TCP 80   0.0.0.0/0
HTTPS  TCP 443  0.0.0.0/0
```

Do not open these ports publicly:

```text
5432  PostgreSQL
8080  Spring backend
3000  Next.js
```

AWS references:

- [EC2 security group rules](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/security-group-rules-reference.html)
- [Connect to a Linux EC2 instance](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/connect-to-linux-instance.html)
- [Route a domain to an EC2 instance](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/routing-to-ec2-instance.html)

## 11. Connect to EC2

From your local computer:

```bash
chmod 400 your-ec2-key.pem
ssh -i your-ec2-key.pem ubuntu@YOUR_ELASTIC_IP
```

The default username is usually `ubuntu` for Ubuntu AMIs.

## 12. Install Docker and Git on EC2

Run on the EC2 server:

```bash
sudo apt update
sudo apt install -y docker.io docker-compose-v2 git
sudo systemctl enable --now docker
sudo usermod -aG docker ubuntu
exit
```

Reconnect so the Docker group change takes effect:

```bash
ssh -i your-ec2-key.pem ubuntu@YOUR_ELASTIC_IP
docker --version
docker compose version
```

## 13. Deploy the project to EC2

Clone the project on EC2:

```bash
git clone YOUR_REPOSITORY_URL rumluos
cd rumluos
```

Create the production environment file:

```bash
cp .env.example .env
chmod 600 .env
nano .env
```

Use production values for configuration:
- Set `POSTGRES_HOST` to your RDS endpoint (obtained via `terraform output db_endpoint`).
- Set `POSTGRES_PASSWORD` to the password retrieved from AWS Secrets Manager (`aws secretsmanager get-secret-value --secret-id "$(terraform output -raw db_secret_arn)" --query SecretString --output text`).
- Set `AWS_S3_BUCKET` to your S3 bucket name (`terraform output uploads_bucket_name`).
- Set production JWT keys and domain-related settings.

Build and start the application:

```bash
scripts/01_build.sh
scripts/02_deploy.sh
```

Check the deployment:

```bash
scripts/05_healthcheck.sh
docker compose --env-file .env -f docker/docker-compose.yaml logs --tail=100 backend
```

At this stage, the site is available through the EC2 IP:

```text
http://YOUR_ELASTIC_IP
```

## 14. Connect your domain

At your domain provider, create an IPv4 A record:

```text
Type:  A
Name:  @
Value: YOUR_ELASTIC_IP
```

Optional `www` record:

```text
Type:  A
Name:  www
Value: YOUR_ELASTIC_IP
```

After DNS propagation, visit:

```text
http://yourdomain.com
```

The current Nginx configuration is HTTP-only. Port 443 is reserved for the HTTPS configuration and certificate setup.

## 15. HTTPS before public production use

Before sharing the website publicly, configure TLS for the domain. Use either:

- Certbot with the existing Nginx container
- An AWS Application Load Balancer with an AWS Certificate Manager certificate
- A TLS reverse proxy such as Caddy

The HTTPS configuration must mount the certificate files into the Nginx container and add an SSL listener for port 443. Do not claim HTTPS is active until:

```bash
curl -I https://yourdomain.com
```

returns successfully.

## 16. Production operations

View logs:

```bash
make logs
docker compose --env-file .env -f docker/docker-compose.yaml logs -f backend
```

Restart services:

```bash
docker compose --env-file .env -f docker/docker-compose.yaml restart
```

Stop services without deleting database volumes:

```bash
make down
```

Create backups regularly:

```bash
scripts/03_backup.sh
```

Deploy a new version:

```bash
printf '0.2.0\n' > VERSION
scripts/01_build.sh
scripts/02_deploy.sh
```

If the new version fails:

```bash
CONFIRM_ROLLBACK=1 scripts/06_rollback.sh 0.1.0
```

Do not expose PostgreSQL or application ports publicly, do not commit `.env`, and use an EC2 IAM role for S3 access instead of long-lived AWS access keys.
