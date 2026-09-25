# 06. Zero-to-Live: Full Cloud Deployment Guide

A sequential, step-by-step guide to deploy the **Rumluos** full stack (PostgreSQL → Spring Boot API → Next.js Frontend → Nginx → Custom Domain with HTTPS) on **AWS Free Tier** — from an empty AWS account to a publicly accessible `https://yourdomain.com`.

Every step depends on the one before it. Follow them in order.

---

## Prerequisites

Before you start, you need these 3 things ready:

| # | What | How to Get It |
| :--- | :--- | :--- |
| 1 | **An AWS Account** | Sign up at [aws.amazon.com](https://aws.amazon.com/). You get 12 months of Free Tier. |
| 2 | **A Custom Domain** | Already purchased from Namecheap, GoDaddy, Cloudflare, Route 53, etc. |
| 3 | **Your Laptop Terminal** | macOS Terminal, Linux bash, or Windows WSL2. Ensure `ssh` and `git` are installed. |

---

## Step 1: Set Up a Zero-Spend Budget Alert

> [!CAUTION]
> Do this FIRST before creating any AWS resource. It protects you from unexpected charges.

1. Log in to the [AWS Management Console](https://console.aws.amazon.com/).
2. In the top search bar, type **Budgets** → click **AWS Budgets**.
3. Click **Create budget**.
4. Choose **Use a template (simplified)** → select **Zero spend budget**.
5. Enter your email address under **Email recipients**.
6. Click **Create budget**.

✅ **Result**: AWS will email you instantly if any charge exceeds $0.00.

---

## Step 2: Create a VPC (Your Private Network)

A VPC is your own isolated network inside AWS. All your servers and databases live inside it. Before you click anything, understand **what you are building** and **what it costs**.

### 2A. VPC Cost Breakdown (What is Free, What is NOT)

| VPC Component | Cost | Notes |
| :--- | :--- | :--- |
| **VPC itself** | ✅ Free forever | You can create as many VPCs as you want |
| **Subnets** | ✅ Free forever | Just logical slices of the VPC |
| **Route Tables** | ✅ Free forever | Just routing rules |
| **Internet Gateway (IGW)** | ✅ Free forever | The "front door" to the internet |
| **Security Groups** | ✅ Free forever | Firewall rules |
| **Network ACLs** | ✅ Free forever | Subnet-level firewall (we use defaults) |
| **Public IPv4 Address** (on EC2) | ⚠️ **$0.005/hr** (~$3.65/mo) | Free Tier gives **750 hrs/mo free** for first 12 months. 1 instance 24/7 = covered! |
| **Elastic IP** (attached to running EC2) | ⚠️ **$0.005/hr** (~$3.65/mo) | Same IPv4 charge. Free Tier 750 hrs covers it. |
| **Elastic IP** (NOT attached / idle) | ❌ **$0.005/hr** | AWS charges for wasted IPs! Always release unused ones. |
| **NAT Gateway** | ❌ **~$32.40/mo** | We do NOT create this. |
| **VPC Endpoints (Interface)** | ❌ **~$7.30/mo** per AZ | We do NOT create this. |
| **VPC Endpoints (Gateway for S3)** | ✅ Free | Optional, we skip it for simplicity. |

> [!IMPORTANT]
> **Bottom line for your first 12 months**: The entire VPC setup (VPC + Subnets + Route Tables + Internet Gateway + 1 Public IP on EC2) costs **$0.00/month** under the Free Tier.

---

### 2B. Understanding What You Are About to Create

The AWS **"VPC and more"** wizard will create **6 resources** for you in one click. Here is what each one does and how they connect:

```text
                            THE INTERNET
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │   Internet Gateway     │  ← "The front door"
                    │   (rumluos-igw)        │     Allows traffic in/out
                    │   Cost: FREE           │     of your VPC
                    └───────────┬────────────┘
                                │
            ┌───────────────────┼───────────────────┐
            │                   │                   │
            │    VPC: 10.0.0.0/16 (rumluos-vpc)     │  ← Your private network
            │    Cost: FREE                         │     65,536 IP addresses
            │                                       │
            │  ┌─────────────────────────────────┐  │
            │  │  PUBLIC Route Table              │  │  ← Has a rule:
            │  │  0.0.0.0/0 → Internet Gateway   │  │     "Send internet traffic
            │  └──────────────┬──────────────────┘  │      through the IGW"
            │                 │                     │
            │  ┌──────────────▼──────────────────┐  │
            │  │  PUBLIC SUBNET (AZ-a)           │  │  ← Where EC2 lives
            │  │  10.0.1.0/24 (256 IPs)          │  │     CAN reach the internet
            │  │  Cost: FREE                     │  │
            │  └─────────────────────────────────┘  │
            │                                       │
            │  ┌─────────────────────────────────┐  │
            │  │  PRIVATE Route Table             │  │  ← Has NO route to IGW
            │  │  (local traffic only)            │  │     "Stay inside the VPC"
            │  └──────────┬───────────┬──────────┘  │
            │             │           │             │
            │  ┌──────────▼────┐ ┌────▼──────────┐  │
            │  │ PRIVATE       │ │ PRIVATE        │  │  ← Where RDS lives
            │  │ SUBNET (AZ-a) │ │ SUBNET (AZ-b)  │  │     CANNOT reach internet
            │  │ 10.0.10.0/24  │ │ 10.0.11.0/24   │  │     CANNOT be reached
            │  │ Cost: FREE    │ │ Cost: FREE     │  │     from internet
            │  └───────────────┘ └────────────────┘  │
            │                                       │
            └───────────────────────────────────────┘
```

**Why 2 private subnets?** AWS RDS requires a "DB Subnet Group" spanning at least 2 Availability Zones. Even though RDS runs in only one AZ (Free Tier = Single-AZ), AWS needs the second subnet as a fallback target.

**Why no NAT Gateway?** Our EC2 instance is in the public subnet and can reach the internet directly through the Internet Gateway. The RDS database in the private subnet does NOT need internet access — it only talks to EC2 inside the VPC. This saves ~$32/month.

---

### 2C. Step-by-Step: Create VPC Using the AWS Console

#### 1. Select your AWS Region

In the **top-right corner** of the AWS Console, click the region dropdown and select:
- Southeast Asia: **Asia Pacific (Singapore)** `ap-southeast-1`
- North America: **US East (N. Virginia)** `us-east-1`

> [!IMPORTANT]
> Pick one region and use it for EVERYTHING (VPC, EC2, RDS, S3). Mixing regions causes resources to not see each other.

#### 2. Open the VPC Console

- In the top search bar, type **VPC** → click **VPC**.
- You will see the **VPC Dashboard** with a left sidebar menu containing:
  `Your VPCs | Subnets | Route tables | Internet gateways | Elastic IPs | NAT gateways | ...`

#### 3. Click "Create VPC"

- Click the orange **Create VPC** button (top right of the dashboard).
- You will see two tabs at the top:
  - **VPC only** — Creates just the empty VPC (you must manually create subnets, route tables, IGW yourself).
  - **VPC and more** — Creates everything in one wizard. ← **Select this one**.

#### 4. Fill in the "VPC and more" Wizard

The wizard shows a form on the left and a **live Resource Map preview** on the right. Fill in:

| Field | Value | Why |
| :--- | :--- | :--- |
| **Name tag auto-generation** | `rumluos` | All resources will be auto-named: `rumluos-vpc`, `rumluos-subnet-public1`, etc. |
| **IPv4 CIDR block** | `10.0.0.0/16` | Gives you 65,536 private IPs. More than enough. |
| **IPv6 CIDR block** | No IPv6 CIDR block | Keep it simple. IPv6 is optional. |
| **Tenancy** | Default | Shared hardware (free). "Dedicated" costs extra. |
| **Number of Availability Zones (AZs)** | **2** | RDS needs subnets in 2 AZs. |
| **Number of public subnets** | **1** | For your EC2 instance. |
| **Number of private subnets** | **2** | For your RDS database (2 AZs required). |
| **NAT gateways** | **None** | ⚠️ Critical! Selecting "In 1 AZ" adds ~$32/month. |
| **VPC endpoints** | **None** | We don't need private S3 access. EC2 reaches S3 via the internet. |
| **DNS hostnames** | Enable | Allows EC2 instances to get public DNS names. |
| **DNS resolution** | Enable | Allows VPC to resolve DNS names. |

#### 5. Review the Resource Map

On the right side of the wizard, you should see a visual diagram showing:
```
rumluos-vpc
├── rumluos-igw (Internet Gateway)
├── rumluos-subnet-public1-ap-southeast-1a  →  rumluos-rtb-public  →  rumluos-igw
├── rumluos-subnet-private1-ap-southeast-1a →  rumluos-rtb-private1
└── rumluos-subnet-private2-ap-southeast-1b →  rumluos-rtb-private2
```

Confirm that:
- ✅ There is **1 Internet Gateway** connected to the public subnet.
- ✅ The public subnet route table points to the Internet Gateway.
- ✅ The private subnet route tables do **NOT** point to any gateway.
- ✅ There is **0 NAT Gateways** shown.

#### 6. Click "Create VPC"

Click the orange **Create VPC** button. Wait ~15 seconds. AWS will show a progress screen creating each resource one by one:

```
✅ VPC                 rumluos-vpc                created
✅ Internet Gateway    rumluos-igw                created & attached
✅ Subnet (public)     rumluos-subnet-public1     created
✅ Subnet (private)    rumluos-subnet-private1    created
✅ Subnet (private)    rumluos-subnet-private2    created
✅ Route Table (public) rumluos-rtb-public        created
✅ Route Table (private) rumluos-rtb-private1     created
✅ Route Table (private) rumluos-rtb-private2     created
```

---

### 2D. Verify What Was Created (VPC Console Left Sidebar)

After creation, verify each resource by clicking through the left sidebar:

#### Your VPCs
Click **Your VPCs** in the left sidebar. You should see:

| Name | VPC ID | IPv4 CIDR | State |
| :--- | :--- | :--- | :--- |
| rumluos-vpc | vpc-0abc123... | 10.0.0.0/16 | available |

#### Subnets
Click **Subnets**. You should see 3 subnets:

| Name | Subnet ID | VPC | IPv4 CIDR | AZ | Type |
| :--- | :--- | :--- | :--- | :--- | :--- |
| rumluos-subnet-public1-... | subnet-0aaa... | rumluos-vpc | 10.0.0.0/20 | ap-southeast-1a | Public |
| rumluos-subnet-private1-... | subnet-0bbb... | rumluos-vpc | 10.0.128.0/20 | ap-southeast-1a | Private |
| rumluos-subnet-private2-... | subnet-0ccc... | rumluos-vpc | 10.0.144.0/20 | ap-southeast-1b | Private |

> [!NOTE]
> The exact CIDR values may differ slightly (e.g., `/20` instead of `/24`). The wizard auto-calculates them. What matters is: 1 public subnet + 2 private subnets in different AZs.

#### Route Tables
Click **Route tables**. You should see 3 route tables:

**Public Route Table** (`rumluos-rtb-public`):
| Destination | Target | Meaning |
| :--- | :--- | :--- |
| 10.0.0.0/16 | local | Traffic within the VPC stays internal |
| 0.0.0.0/0 | igw-0xyz... | Everything else goes to the Internet Gateway |

**Private Route Tables** (`rumluos-rtb-private1` and `rumluos-rtb-private2`):
| Destination | Target | Meaning |
| :--- | :--- | :--- |
| 10.0.0.0/16 | local | Traffic within the VPC stays internal |
| *(no 0.0.0.0/0 route)* | — | NO internet access (isolated!) |

#### Internet Gateways
Click **Internet gateways**. You should see:

| Name | IGW ID | State | VPC |
| :--- | :--- | :--- | :--- |
| rumluos-igw | igw-0xyz... | attached | rumluos-vpc |

If the state says **"detached"**, something went wrong. You need to click **Actions → Attach to VPC** and select `rumluos-vpc`.

---

### 2E. About Elastic IPs (Skip for Now — Needed in Step 7)

An **Elastic IP** is a static public IPv4 address that stays the same even if you stop/start your EC2 instance. We will decide whether to use one in **Step 7** when launching EC2.

**Cost rules for Elastic IPs**:

| Scenario | Cost |
| :--- | :--- |
| Elastic IP **attached** to a **running** EC2 instance | $0.005/hr (covered by Free Tier 750 hrs) |
| Elastic IP **NOT attached** to any instance (idle) | ❌ $0.005/hr (**NOT** covered by Free Tier — you pay!) |
| EC2 stopped but Elastic IP still allocated | ❌ $0.005/hr (you pay for the idle IP!) |

> [!WARNING]
> **Golden rule**: If you stop your EC2 instance for more than a few hours, **release** the Elastic IP first (EC2 → Elastic IPs → Actions → Release). Re-allocate a new one when you restart. Otherwise AWS charges you for the idle IP even while your server is stopped.

✅ **Result**: You now have a complete VPC with 1 public subnet, 2 private subnets, route tables, and an internet gateway — all at **$0.00/month**.



## Step 3: Create Security Groups (Firewall Rules)

Security groups control which traffic is allowed in and out of your servers.

### Security Group A: `rumluos-web-sg` (for the EC2 server)

1. In VPC console left sidebar → **Security Groups** → **Create security group**.
2. Name: **`rumluos-web-sg`**
3. Description: `Web access and SSH for Rumluos`
4. VPC: select **`rumluos-vpc`**
5. Add 3 **Inbound rules**:

| Type | Port | Source |
| :--- | :--- | :--- |
| HTTP | 80 | Anywhere-IPv4 (`0.0.0.0/0`) |
| HTTPS | 443 | Anywhere-IPv4 (`0.0.0.0/0`) |
| SSH | 22 | My IP (auto-detects your current IP) |

6. Outbound rules: leave default (All traffic).
7. Click **Create security group**.

### Security Group B: `rumluos-db-sg` (for the RDS database)

1. Click **Create security group** again.
2. Name: **`rumluos-db-sg`**
3. Description: `PostgreSQL from EC2 only`
4. VPC: select **`rumluos-vpc`**
5. Add 1 **Inbound rule**:

| Type | Port | Source |
| :--- | :--- | :--- |
| PostgreSQL | 5432 | Custom → type `rumluos-web-sg` and select it |

6. Click **Create security group**.

✅ **Result**: Only your EC2 instance can talk to the database. Nobody from the internet can reach port 5432.

---

## Step 4: Create the S3 Bucket (File Storage)

1. Search for **S3** → click **S3** → **Create bucket**.
2. Bucket name: **`rumluos-uploads-<your-unique-id>`** (must be globally unique, lowercase).
3. Region: same as your VPC (e.g., `ap-southeast-1`).
4. Object Ownership: **ACLs disabled**.
5. Block Public Access: **Keep all checked** (block all).
6. Bucket Versioning: **Enable**.
7. Default encryption: **SSE-S3**.
8. Click **Create bucket**.

✅ **Result**: Private, encrypted S3 bucket for document uploads.

---

## Step 5: Create an IAM Role for EC2

This gives the EC2 server permission to access S3 and SSM without storing any AWS access keys on the server.

1. Search **IAM** → **Roles** → **Create role**.
2. Trusted entity: **AWS service** → Use case: **EC2** → **Next**.
3. Search and check: **`AmazonSSMManagedInstanceCore`** → **Next**.
4. Role name: **`rumluos-ec2-role`** → **Create role**.
5. Click on the new role → **Permissions** tab → **Add permissions** → **Create inline policy**.
6. Click the **JSON** tab, paste this (replace `YOUR_BUCKET_NAME`):
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Sid": "S3ListAccess",
         "Effect": "Allow",
         "Action": ["s3:ListBucket"],
         "Resource": "arn:aws:s3:::YOUR_BUCKET_NAME"
       },
       {
         "Sid": "S3ObjectCrudAccess",
         "Effect": "Allow",
         "Action": ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"],
         "Resource": "arn:aws:s3:::YOUR_BUCKET_NAME/*"
       }
     ]
   }
   ```
7. Click **Next** → Policy name: `rumluos-s3-access` → **Create policy**.

✅ **Result**: EC2 role with SSM access (remote terminal) and S3 read/write.

---

## Step 6: Create the RDS PostgreSQL Database

1. Search **RDS** → left sidebar → **Subnet groups** → **Create DB subnet group**:
   - Name: **`rumluos-db-subnets`**
   - VPC: `rumluos-vpc`
   - Add subnets: select both **private subnets** (from 2 different AZs)
   - Click **Create**.
2. Left sidebar → **Databases** → **Create database**:
   - Method: **Standard create**
   - Engine: **PostgreSQL** (version 17.x)
   - Template: **Free Tier** ← This pre-selects safe free-tier options
   - DB instance identifier: **`rumluos-db`**
   - Master username: **`rumluos`**
   - Master password: **set a strong password** ← **Save this!**
   - Instance class: **`db.t4g.micro`**
   - Storage: `gp3`, **20 GiB**, uncheck "Enable storage autoscaling"
   - Connectivity:
     - VPC: `rumluos-vpc`
     - DB Subnet group: `rumluos-db-subnets`
     - Public access: **No**
     - Security group: remove `default`, select **`rumluos-db-sg`**
   - Additional configuration:
     - Initial database name: **`rumluos_db`**
     - Backup retention: `1 day`
     - Uncheck "Enable deletion protection" (for dev/test, so you can delete it later)
3. Click **Create database**. Wait 5–10 minutes.
4. Once ready, click on the database and copy the **Endpoint** (e.g., `rumluos-db.c123456.ap-southeast-1.rds.amazonaws.com`).

✅ **Result**: PostgreSQL 17 running in a private subnet, accessible only from your EC2 instance.

---

## Step 7: Launch the EC2 Instance (Your Server)

1. Search **EC2** → **Instances** → **Launch instances**.
2. Name: **`rumluos-server`**
3. AMI: **Amazon Linux 2023 AMI** (Free Tier eligible)
4. Architecture: `64-bit (x86)`
5. Instance type: **`t3.micro`** (Free Tier: 750 hrs/month)
6. Key pair: **Create new key pair** → name: `rumluos-key` → RSA → `.pem` → Download it
7. Network settings → click **Edit**:
   - VPC: `rumluos-vpc`
   - Subnet: select your **public subnet**
   - Auto-assign public IP: **Enable**
   - Security group: select existing → **`rumluos-web-sg`**
8. Storage: **20 GiB**, `gp3`
9. Advanced details (scroll down):
   - IAM instance profile: **`rumluos-ec2-role`**
   - Metadata response hop limit: **`2`** ← Docker containers need this to read the IAM role
   - User data (paste this bootstrap script):
     ```bash
        #!/bin/bash
        dnf update -y
        dnf install -y docker git
        systemctl enable --now docker
        usermod -aG docker ec2-user
        mkdir -p /usr/local/lib/docker/cli-plugins /usr/local/bin
        curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/lib/docker/cli-plugins/docker-compose
        chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
        ln -sf /usr/local/lib/docker/cli-plugins/docker-compose /usr/local/bin/docker-compose
        ln -sf /usr/local/lib/docker/cli-plugins/docker-compose /usr/bin/docker-compose
     ```
10. Click **Launch instance**.
11. Wait 1–2 minutes, then click on the instance and note its **Public IPv4 address** (e.g., `13.250.45.67`).

✅ **Result**: A running server with Docker pre-installed, with a public IP address.

---

## Step 8: Point Your Domain to the Server

You already own a domain. Now point it at the EC2 public IP.

### Option A: Via Cloudflare (recommended)

1. Log in to your [Cloudflare dashboard](https://dash.cloudflare.com/).
2. Select your domain → **DNS** → **Add record**:

| Type | Name | Content | Proxy |
| :--- | :--- | :--- | :--- |
| A | `@` (or `app`) | `13.250.45.67` (your EC2 IP) | Proxied (orange cloud) |

3. Go to **SSL/TLS** → set mode to **Flexible** (for initial test) or **Full** (for production with certbot).

### Option B: Via Namecheap / GoDaddy / Route 53

1. Go to your DNS management panel.
2. Add an **A Record**:
   - Host: `@` (root domain) or `app` (subdomain)
   - Value: your EC2 Public IP
   - TTL: `300` (5 minutes, for fast propagation)

### Verify DNS is Working

Wait 2–5 minutes, then run from your laptop:
```bash
dig +short yourdomain.com
# Should output: 13.250.45.67
```

✅ **Result**: `yourdomain.com` now resolves to your EC2 server.

---

## Step 9: SSH into the Server & Clone the Code

From your laptop terminal:

```bash
# 1. Set correct permissions on the key file
chmod 400 rumluos-key.pem

# 2. SSH into the server
ssh -i rumluos-key.pem ec2-user@13.250.45.67
```

> [!TIP]
> Alternative: In the AWS Console, select the instance → **Connect** → **Session Manager** (no SSH key needed, uses the IAM role).

Once logged in:

```bash
# 3. Verify Docker is running
docker --version
docker compose version

# 4. Clone the repository
git clone <YOUR_REPOSITORY_URL> rumluos
cd rumluos
```

✅ **Result**: You are on the server with the source code ready.

---

## Step 10: Configure Environment Variables

```bash
# 1. Copy the template
cp .env.example .env

# 2. Lock down permissions
chmod 600 .env

# 3. Edit the file
nano .env
```

Change these values:

```env
# ── Point to your RDS database (from Step 6) ─────────────────
POSTGRES_HOST=rumluos-db.c123456.ap-southeast-1.rds.amazonaws.com
POSTGRES_PORT=5432
POSTGRES_DB=rumluos_db
POSTGRES_USER=rumluos
POSTGRES_PASSWORD=YourStrongPasswordFromStep6

# ── Your domain ──────────────────────────────────────────────
DOMAIN=yourdomain.com

# ── Your S3 bucket (from Step 4) ─────────────────────────────
AWS_S3_BUCKET=rumluos-uploads-your-unique-id
AWS_S3_REGION=ap-southeast-1

# ── Internal URL (keep as-is for Docker networking) ──────────
API_INTERNAL_URL=http://backend:8080/api/v1
```

### Generate JWT Keys

Still on the server, run:

```bash
# Generate RSA 2048-bit key pair
openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out jwt-private.pem
openssl rsa -pubout -in jwt-private.pem -out jwt-public.pem

# Print single-line base64 keys (stripping PEM headers)
echo "JWT_PRIVATE_KEY=$(grep -v -- '-----' jwt-private.pem | tr -d '\n\r')"
echo "JWT_PUBLIC_KEY=$(grep -v -- '-----' jwt-public.pem | tr -d '\n\r')"

# Clean up temporary pem files
rm jwt-private.pem jwt-public.pem
```

Paste the printed values into `.env` for `JWT_PRIVATE_KEY` and `JWT_PUBLIC_KEY`.

Save and exit (`Ctrl+X`, then `Y`, then `Enter` in nano).

✅ **Result**: Environment configured with database, domain, S3, and JWT keys.

---

## Step 11: Build Docker Images

```bash
scripts/01_build.sh
```

This will:
1. Validate the Docker Compose configuration.
2. Build `rumluos-backend:0.1.0` (Spring Boot → Eclipse Temurin 25 JRE, multi-stage).
3. Build `rumluos-frontend:0.1.0` (Next.js 15 standalone → Node.js 22 Alpine, multi-stage).

Wait 3–8 minutes (first build downloads all dependencies).

Verify images were created:
```bash
docker images --filter "reference=rumluos-*"
```

Expected output:
```
REPOSITORY          TAG       SIZE
rumluos-backend     0.1.0     ~280MB
rumluos-frontend    0.1.0     ~180MB
```

✅ **Result**: Both Docker images are built and ready.

---

## Step 12: Launch the Full Stack

```bash
scripts/02_deploy.sh
```

This starts 4 containers in order:
```
1. postgres (waits for health check: pg_isready)
       ↓
2. backend (waits for postgres healthy, runs Flyway migrations)
       ↓
3. frontend (waits for backend healthy)
       ↓
4. nginx (waits for frontend and backend, binds to port 80 and 443)
```

The script automatically runs the health check at the end. You should see:

```
▶️  Starting Rumluos stack  (v0.1.0)
⏳ Waiting for services to become healthy…
ℹ️  Container status
NAME                IMAGE                    STATUS                   PORTS
rumluos-postgres-1  postgres:17-alpine       Up 30 seconds (healthy)  5432/tcp
rumluos-backend-1   rumluos-backend:0.1.0    Up 25 seconds (healthy)  8080/tcp
rumluos-frontend-1  rumluos-frontend:0.1.0   Up 20 seconds            3000/tcp
rumluos-nginx-1     nginx:1.27-alpine        Up 20 seconds            0.0.0.0:80->80/tcp
ℹ️  Backend health: {"status":"UP"}
✅ Frontend is reachable
```

### Verify from the server
```bash
# Test NGINX healthcheck endpoint
curl http://localhost/healthz
# Output: healthy

# Test backend API
curl http://localhost/api/v1/actuator/health
# Output: {"status":"UP"}

# Test frontend
curl -s -o /dev/null -w "%{http_code}" http://localhost
# Output: 200
```

✅ **Result**: All 4 services are running. The application is serving on port 80.

---

## Step 13: Test from Your Browser (HTTP)

Open your browser and navigate to:

```
http://yourdomain.com
```

You should see the **Rumluos login page**!

> [!NOTE]
> At this point, the site works over HTTP (port 80). If you used Cloudflare with the "Proxied" option in Step 8, Cloudflare already provides HTTPS automatically — your users see `https://yourdomain.com` with a valid certificate. You can stop here if using Cloudflare.

✅ **Result**: Your application is publicly accessible via your custom domain.

---

## Step 14: Enable HTTPS with Let's Encrypt (if NOT using Cloudflare)

If you pointed your DNS directly (no Cloudflare proxy), you need to install an SSL certificate yourself.

### 14a. Stop Nginx temporarily (Certbot needs port 80)
```bash
docker compose --env-file .env -f docker/docker-compose.yaml stop nginx
```

### 14b. Install Certbot and request a certificate
```bash
sudo dnf install -y certbot

sudo certbot certonly --standalone \
  -d yourdomain.com \
  --agree-tos \
  --email your-email@example.com \
  --non-interactive
```

### 14c. Copy certificates to the nginx/certs directory
```bash
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem nginx/certs/fullchain.pem
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem nginx/certs/privkey.pem
sudo chmod 644 nginx/certs/*.pem
```

### 14d. Enable the HTTPS server block in nginx.conf
```bash
nano nginx/nginx.conf
```

Uncomment the entire `# server { listen 443 ssl; ... }` block at the bottom of the file. Update `server_name` to your actual domain:
```nginx
server_name yourdomain.com;
```

### 14e. Add HTTP-to-HTTPS redirect
In the existing `server { listen 80; ... }` block, add this at the top (keep the `/healthz` endpoint):

```nginx
server {
    listen 80;
    server_name _;

    location /healthz {
      access_log off;
      default_type text/plain;
      return 200 "healthy\n";
    }

    # Redirect all other HTTP traffic to HTTPS
    location / {
      return 301 https://$host$request_uri;
    }
}
```

### 14f. Restart Nginx
```bash
docker compose --env-file .env -f docker/docker-compose.yaml up -d nginx
```

### 14g. Set up auto-renewal (certificates expire every 90 days)
```bash
# Add a cron job to renew and copy certificates automatically
sudo tee /etc/cron.d/certbot-renew << 'EOF'
0 3 * * * root certbot renew --quiet --deploy-hook "cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem /home/ec2-user/rumluos/nginx/certs/fullchain.pem && cp /etc/letsencrypt/live/yourdomain.com/privkey.pem /home/ec2-user/rumluos/nginx/certs/privkey.pem && docker compose --env-file /home/ec2-user/rumluos/.env -f /home/ec2-user/rumluos/docker/docker-compose.yaml exec -T nginx nginx -s reload"
EOF
```

### 14h. Verify HTTPS

```bash
curl -I https://yourdomain.com
```

Expected:
```
HTTP/2 200
strict-transport-security: max-age=31536000; includeSubDomains
x-content-type-options: nosniff
x-frame-options: SAMEORIGIN
```

✅ **Result**: Your site is live on `https://yourdomain.com` with a free, auto-renewing SSL certificate.

---

## Step 15: Verify Everything End-to-End

Run the complete verification from your server:

```bash
scripts/05_healthcheck.sh
```

And from your laptop, test all endpoints:

```bash
DOMAIN="yourdomain.com"

# 1. HTTPS accessible
curl -s -o /dev/null -w "Homepage: %{http_code}\n" https://$DOMAIN

# 2. NGINX health endpoint
curl -s https://$DOMAIN/healthz
# Output: healthy

# 3. Backend API health
curl -s https://$DOMAIN/api/v1/actuator/health
# Output: {"status":"UP"}

# 4. HTTP redirects to HTTPS
curl -s -o /dev/null -w "HTTP redirect: %{http_code}\n" http://$DOMAIN
# Output: HTTP redirect: 301

# 5. Security headers present
curl -sI https://$DOMAIN | grep -iE "x-content-type|x-frame|referrer-policy"
```

✅ **Result**: Complete stack verified and publicly accessible.

---

## Summary: What You Built

```text
Step  1: Budget Alert         ─── Protects your wallet
Step  2: VPC                  ─── Private network (10.0.0.0/16)
Step  3: Security Groups      ─── Firewall rules (HTTP/HTTPS/SSH + DB isolation)
Step  4: S3 Bucket            ─── File storage
Step  5: IAM Role             ─── Server permissions (S3 + SSM)
Step  6: RDS PostgreSQL       ─── Database in private subnet
Step  7: EC2 Instance         ─── Server with Docker in public subnet
Step  8: DNS Record           ─── Domain → Server IP
Step  9: SSH + Clone Code     ─── Source code on the server
Step 10: .env Configuration   ─── Secrets and connection strings
Step 11: Docker Build         ─── Backend + Frontend images
Step 12: Docker Deploy        ─── postgres → backend → frontend → nginx
Step 13: HTTP Verification    ─── http://yourdomain.com works
Step 14: HTTPS / SSL          ─── https://yourdomain.com with Let's Encrypt
Step 15: End-to-End Test      ─── All endpoints verified
```

```text
User's Browser
    │
    │  https://yourdomain.com
    ▼
┌─────────────────────────────────────────────────────────┐
│  EC2 Instance (t3.micro) — Public Subnet                │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │ NGINX Container (:80, :443)                     │    │
│  │  ├── /healthz        → 200 OK                   │    │
│  │  ├── /api/*          → Backend :8080             │    │
│  │  ├── /_next/static/* → Frontend :3000 (cached)   │    │
│  │  └── /*              → Frontend :3000            │    │
│  └─────────────────────────────────────────────────┘    │
│       │                          │                      │
│       ▼                          ▼                      │
│  ┌──────────────┐    ┌───────────────────┐              │
│  │ Next.js      │    │ Spring Boot       │              │
│  │ Frontend     │    │ Backend API       │──── S3       │
│  │ :3000        │    │ :8080             │              │
│  └──────────────┘    └───────┬───────────┘              │
│                              │                          │
└──────────────────────────────┼──────────────────────────┘
                               │ Internal VPC Network
                               ▼
                    ┌────────────────────────┐
                    │ RDS PostgreSQL         │
                    │ Private Subnet         │
                    │ :5432                  │
                    └────────────────────────┘
```

---

## Daily Operations Quick Reference

| Task | Command |
| :--- | :--- |
| View all logs | `make logs` |
| Check container status | `make ps` |
| Run health check | `make health` |
| Stop the stack (keep data) | `make down` |
| Restart the stack | `make restart` |
| Backup database | `make backup` |
| Restore database | `make restore FILE=backups/xxx.dump` |
| Rebuild after code changes | `git pull && make build && make restart` |

For advanced topics (CloudWatch Alerts, Auto Scaling Groups, VPC deep dives), see the [Architecture Overview](01_ARCHITECTURE_OVERVIEW.md) and [Operations Guide](05_OPERATIONS_AND_TROUBLESHOOTING.md).
