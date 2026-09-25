# 01. Architecture Overview (Explain Like I'm 5)

This document explains the architecture of the **Rumluos** application—how each piece fits together, how requests travel through the system, and why it is designed this way.

---

## 1. The Real-World Analogy (Like I'm 5)

Imagine you are running a modern department store or loan office. To work smoothly and safely, your business needs five distinct roles:

```text
                                 +-------------------------------+
                                 |         PUBLIC USER           |
                                 |    (Browser / Mobile App)     |
                                 +-------------------------------+
                                                 |
                                                 | Port 80 (HTTP) / 443 (HTTPS)
                                                 v
                                 +-------------------------------+
                                 |       1. NGINX CONTAINER      |
                                 |       "The Receptionist"      |
                                 +-------------------------------+
                                            /          \
                         Requests for '/'  /            \  Requests for '/api/*'
                                          v              v
            +-------------------------------+          +-------------------------------+
            |    2. FRONTEND CONTAINER      |          |     3. BACKEND CONTAINER      |
            |   "The Storefront Display"    |          |    "The Kitchen / Brain"      |
            |        Next.js / React        |          |     Spring Boot / Java 25     |
            +-------------------------------+          +-------------------------------+
                                                                 |
                                       +-------------------------+-------------------------+
                                       |                                                   |
                                       | Internal Port 5432                                | HTTPS (AWS SDK)
                                       v                                                   v
                        +-------------------------------+                   +-------------------------------+
                        |     4. DATABASE SERVICE       |                   |       5. S3 FILE STORAGE      |
                        |     "The Filing Cabinet"      |                   |     "The Warehouse Locker"    |
                        |      PostgreSQL 17            |                   |           Amazon S3           |
                        +-------------------------------+                   +-------------------------------+
```

### Role 1: Nginx — "The Receptionist"
* **What it does**: Stands at the entrance (port 80 and 443). When visitors arrive, Nginx examines their request:
  * If they want to view pages, forms, or stylesheets (`/`), Nginx sends them to the **Storefront Display (Next.js)**.
  * If they submit actions, logins, or loan calculations (`/api/*`), Nginx forwards them to the **Kitchen (Spring Boot)**.
* **Why we need it**: Protects internal services from the raw internet, applies rate limiting, compresses assets with Gzip, and injects HTTP security headers.

### Role 2: Frontend — "The Storefront Display"
* **Technology**: **Next.js 15 & React 19** running on Node.js 22.
* **What it does**: The interactive user interface you see in your web browser—menus, interactive data tables, customer loan applications, repayment trackers, and charts.
* **Special feature**: Uses **Next.js Standalone Mode**, creating an ultra-lightweight Docker image without dragging along bulky development dependencies.

### Role 3: Backend API — "The Kitchen & Brain"
* **Technology**: **Spring Boot (Spring WebFlux)** running on modern **Java 25 (Eclipse Temurin JRE)**.
* **What it does**: The business engine. It verifies user passwords, calculates compound interest schedules, executes database migrations, issues digitally signed JWT authentication tokens, and manages permissions.
* **Reactive Engine**: Built with non-blocking reactive I/O (Project Reactor & R2DBC), allowing high concurrency with minimal RAM consumption.

### Role 4: PostgreSQL — "The Filing Cabinet"
* **Technology**: **PostgreSQL 17**.
* **What it does**: The system of record. Every account, customer identity, payment record, ledger entry, and system setting is permanently stored here with ACID guarantees.
* **Local vs Cloud**: In local development, it runs as a local Docker container; on AWS, it runs as a managed **Amazon RDS PostgreSQL** instance with automated daily snapshots.

### Role 5: Amazon S3 — "The Warehouse Locker"
* **Technology**: **Amazon S3 Object Storage**.
* **What it does**: Stores binary files—national identity card scans, loan contract PDFs, receipts, and photos.
* **Security design**: Files are stored in a private bucket with public access blocked. Users download or upload files through short-lived, cryptographically signed **Presigned URLs** generated by the backend API.

---

## 2. Container Network & Port Topology

All containers live on an isolated internal Docker bridge network named `rumluos`.

```text
[ HOST MACHINE / INTERNET ]
        |
        | Port 80 (HTTP) -> forwarded to container port 80
        | Port 443 (HTTPS) -> forwarded to container port 443
        v
+---------------------------------------------------------------------------------+
|  Docker Bridge Network: "rumluos"                                               |
|                                                                                 |
|   +-----------------------+                                                     |
|   |   nginx:1.27-alpine   |                                                     |
|   |   Internal: 80, 443   |                                                     |
|   +-----------------------+                                                     |
|             |          |                                                        |
|             | http://frontend:3000                                              |
|             v          |                                                        |
|   +-----------------------+    http://backend:8080                              |
|   | rumluos-frontend:0.1  |            |                                        |
|   | Internal: 3000        |            v                                        |
|   +-----------------------+   +-----------------------+                         |
|                               |  rumluos-backend:0.1  |                         |
|                               |  Internal: 8080       |                         |
|                               +-----------------------+                         |
|                                        |                                        |
|                                        | r2dbc:postgresql://postgres:5432       |
|                                        v                                        |
|                               +-----------------------+                         |
|                               |  postgres:17-alpine   |                         |
|                               |  Internal: 5432       |                         |
|                               +-----------------------+                         |
+---------------------------------------------------------------------------------+
```

### Port Exposure Rules
* **Only Nginx publishes ports to the host** (`80:80`, `443:443`).
* **Backend (8080), Frontend (3000), and PostgreSQL (5432) NEVER expose ports to the host machine**. They can only be reached by other containers on the private `rumluos` bridge network.
* This prevents unauthorized port scanning and blocks malicious direct access to your database or internal API services.

---

## 3. Step-by-Step Request Flows

### Scenario A: A User Views Their Loan Dashboard
1. The user enters `https://yourdomain.com/loans` in their browser.
2. The browser sends an HTTP request to **Nginx** (Port 80/443).
3. Nginx sees the path `/loans` does not start with `/api/`, so it proxies the request to `http://frontend:3000/loans`.
4. The **Next.js** frontend renders the page layout. To populate the loan data, the frontend calls the backend API at `/api/v1/loans`.
5. Nginx routes `/api/v1/loans` to `http://backend:8080/api/v1/loans`.
6. **Spring Boot** verifies the user's JWT token, executes a non-blocking query to **PostgreSQL**, serializes the loan records to JSON, and returns it.
7. The browser renders the loans table on the user's screen.

---

### Scenario B: Uploading a Customer ID Document (Presigned S3 Flow)
To avoid passing large PDF or image files through our application server, Rumluos uses the **AWS S3 Presigned URL Pattern**:

```text
Browser                       Spring Boot Backend                          Amazon S3
   |                                   |                                       |
   | 1. POST /api/v1/documents/upload  |                                       |
   |    (filename: id_card.jpg)        |                                       |
   |---------------------------------->|                                       |
   |                                   | 2. Checks permissions                 |
   |                                   |    Asks S3Presigner for upload URL    |
   | 3. Returns presigned S3 URL       |                                       |
   |    (valid for 15 minutes)         |                                       |
   |<----------------------------------|                                       |
   |                                                                           |
   | 4. Direct PUT id_card.jpg with presigned URL                              |
   |-------------------------------------------------------------------------->|
   |                                                                           | 5. Stores file securely
   | 6. S3 returns 200 OK                                                      |
   |<--------------------------------------------------------------------------|
```

* **Why this is powerful**:
  * Your server never gets bogged down processing gigabytes of file uploads.
  * Upload bandwidth is offloaded directly to AWS's high-speed S3 infrastructure.
  * Your S3 bucket remains 100% private.

---

## 4. Security Principles Built-In

1. **Non-Root Containers**:
   * Both `rumluos` (Java) and `rumluos-dashboard` (Next.js) drop root privileges upon boot.
   * Java runs as `rumluos:rumluos` (UID 10001).
   * Next.js runs as `nextjs:nextjs`.
   * If an attacker compromises a web process, they are trapped with zero root host privileges.
2. **Zero Hardcoded Secrets**:
   * Passwords, encryption keys, and tokens are read exclusively from environment variables at container start.
3. **AWS IAM Instance Profiles (No Static AWS Keys)**:
   * When hosted on AWS EC2, the backend uses `DefaultCredentialsProvider.create()` to fetch short-lived (1–6 hour) security tokens from the EC2 Instance Metadata Service (IMDSv2). No AWS access keys exist anywhere on the disk.
4. **Defense-in-Depth Network Isolation**:
   * PostgreSQL only accepts incoming TCP connections from the application security group.
   * Public access to the database is disabled at both the cloud VPC level and the Docker container level.
