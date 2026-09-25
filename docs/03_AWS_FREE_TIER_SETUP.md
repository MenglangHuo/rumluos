# 03. AWS Free-Tier Cloud Setup Guide

This guide is an exhaustive, click-by-click manual for hosting the **Rumluos** application in the AWS Cloud using **AWS Free Tier** services.

Every single service is explained in plain English, with exact fields, settings, and warnings so you can run Rumluos 24/7 without unexpected charges.

---

## 1. Understanding the AWS Free Tier

When you create an AWS account, you receive **12 Months of Free Tier benefits** starting from your registration date:

| AWS Service | Free Tier Allowance | How We Configure It in Rumluos | Cost |
| :--- | :--- | :--- | :--- |
| **Amazon EC2 (Compute)** | 750 hours/month of `t2.micro` or `t3.micro` | 1 `t3.micro` instance running 24/7 | **$0.00** |
| **Amazon RDS (PostgreSQL)** | 750 hours/month of `db.t4g.micro` or `db.t3.micro` + 20 GB gp2/gp3 storage | 1 `db.t4g.micro` PostgreSQL 17 database | **$0.00** |
| **Amazon S3 (Storage)** | 5 GB standard storage + 20,000 GET + 2,000 PUT requests | Encrypted bucket for document uploads | **$0.00** |
| **Amazon CloudFront (CDN)** | 1 TB data transfer out/month + 10,000,000 requests | Caches static assets globally & terminates SSL | **$0.00** |
| **AWS Certificate Manager (ACM)**| Unlimited public SSL/TLS certificates | Free `https://` lock for your custom domain | **$0.00** |
| **VPC & IAM** | Unlimited virtual networks & roles | Network isolation and permissions | **$0.00** |
| **Route 53 (DNS)** | *Not covered by free tier* ($0.50/month per hosted zone) | Custom domain routing (or use free Cloudflare) | ~$0.50/mo |

> [!CAUTION]
> ### The 3 Common AWS Traps to Avoid:
> 1. **NAT Gateways**: A single NAT Gateway costs ~$32/month. **We explicitly configure zero NAT Gateways** in this guide.
> 2. **Multi-AZ RDS**: Multi-AZ databases run two simultaneous DB instances, doubling hours to 1,500 hrs/month (exceeding the 750 hr free limit). For the Free Tier, we use **Single-AZ**.
> 3. **Unattached Elastic IPs**: AWS charges for public IPv4 addresses that are allocated but NOT attached to a running instance. We attach our public IP directly to our running EC2 instance.

---

## 2. Step 0: Set Up a Zero-Spend Budget Alert First

Before clicking anything else in AWS, set up a budget alert so AWS will automatically email you if your account ever reaches $1.00:

1. Log in to the [AWS Management Console](https://console.aws.amazon.com/).
2. In the top search bar, type **Budgets** and click **AWS Budgets**.
3. Click the orange **Create budget** button.
4. Under **Budget setup**, choose **Use a template (simplified)**.
5. Select the **Zero spend budget** template.
6. Under **Email recipients**, enter your personal email address.
7. Click **Create budget**.
*(You will now receive an instant notification if any billable charges occur).*

---

## 3. Step 1: Virtual Private Cloud (VPC) & Subnets

A VPC is your private, fenced network in the cloud.

1. In the top right corner of the AWS console, choose your desired region:
   * Recommended for Southeast Asia: **Asia Pacific (Singapore) `ap-southeast-1`**.
   * Recommended for North America: **US East (N. Virginia) `us-east-1`**.
2. Search for **VPC** in the search bar and click **VPC**.
3. Click **Create VPC**.
4. Under **Resources to create**, select **VPC and more** (this automatically sets up subnets, routing tables, and internet gateways).
5. Name tag auto-generation: Type **`rumluos`**.
6. IPv4 CIDR block: Leave as **`10.10.0.0/16`** (or `10.0.0.0/16`).
7. Number of Availability Zones (AZs): Select **2**.
8. Number of public subnets: Select **1**.
9. Number of private subnets: Select **2** *(RDS requires subnets in at least two AZs to create a DB Subnet Group)*.
10. **NAT gateways**: Select **None** *(Crucial for Free Tier: keeps cost at $0.00)*.
11. **VPC endpoints**: Select **None**.
12. Click **Create VPC**.

AWS will take 15 seconds to create your VPC, 1 public subnet, 2 private subnets, an Internet Gateway, and route tables.

---

## 4. Step 2: Security Groups (Virtual Firewalls)

Security groups act as firewalls controlling which network traffic is allowed in or out.

### Security Group 1: `rumluos-app-sg` (For EC2 Web Server)
1. In the VPC navigation bar on the left, click **Security Groups**.
2. Click **Create security group**.
3. **Security group name**: `rumluos-app-sg`.
4. **Description**: `Public web access and emergency SSH for Rumluos`.
5. **VPC**: Select your `rumluos-vpc`.
6. Under **Inbound rules**, click **Add rule** 3 times:
   * **Rule 1 (HTTP)**:
     - Type: `HTTP` | Port: `80` | Source: `Anywhere-IPv4` (`0.0.0.0/0`).
   * **Rule 2 (HTTPS)**:
     - Type: `HTTPS` | Port: `443` | Source: `Anywhere-IPv4` (`0.0.0.0/0`).
   * **Rule 3 (SSH)**:
     - Type: `SSH` | Port: `22` | Source: `My IP` *(automatically detects your current IP address)*.
7. Under **Outbound rules**: Leave default (All traffic to `0.0.0.0/0`).
8. Click **Create security group**.

---

### Security Group 2: `rumluos-db-sg` (For RDS Database)
1. Click **Create security group**.
2. **Security group name**: `rumluos-db-sg`.
3. **Description**: `PostgreSQL access from EC2 application host only`.
4. **VPC**: Select your `rumluos-vpc`.
5. Under **Inbound rules**, click **Add rule**:
   * **Type**: `PostgreSQL` | Port: `5432`.
   * **Source**: Choose **Custom**, type `rumluos-app-sg` in the box, and select the `rumluos-app-sg` group created above.
   *(This means ONLY your EC2 instance can talk to PostgreSQL. Nobody on the internet can reach your database!)*.
6. Click **Create security group**.

---

## 5. Step 3: Amazon S3 (Private Storage)

1. In the search bar, search for **S3** and click **S3**.
2. Click **Create bucket**.
3. **Bucket name**: Enter a globally unique name (lowercase, dashes allowed), e.g., `rumluos-uploads-prod-<YOUR_NAME_OR_NUMBERS>`.
4. **AWS Region**: Select the same region as your VPC (e.g., `ap-southeast-1`).
5. **Object Ownership**: ACLs disabled (recommended).
6. **Block Public Access settings**: Leave **Block all public access** CHECKED.
7. **Bucket Versioning**: Enable (protects against accidental deletions).
8. **Default encryption**: Server-side encryption with Amazon S3 managed keys (SSE-S3).
9. Click **Create bucket**.

---

## 6. Step 4: AWS IAM Role for EC2

We give our EC2 server an IAM Role so that the Spring Boot backend can access S3 and AWS Systems Manager (SSM) **without saving any AWS access keys on the server**.

1. Search for **IAM** -> click **Roles** in the left menu -> click **Create role**.
2. **Trusted entity type**: Select **AWS service**.
3. **Use case**: Select **EC2** -> click **Next**.
4. **Add permissions**:
   - In the search box, search for: `AmazonSSMManagedInstanceCore`.
   - Check the checkbox next to it.
5. Click **Next**.
6. **Role name**: Enter **`rumluos-ec2-role`**.
7. Click **Create role**.
8. In the Roles list, click on your newly created **`rumluos-ec2-role`**.
9. Under the **Permissions** tab, click **Add permissions** -> **Create inline policy**.
10. Click the **JSON** tab and paste:
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
          "Action": [
            "s3:GetObject",
            "s3:PutObject",
            "s3:DeleteObject"
          ],
          "Resource": "arn:aws:s3:::YOUR_BUCKET_NAME/*"
        }
      ]
    }
    ```
    *(Replace `YOUR_BUCKET_NAME` with your actual bucket name from Step 3).*
11. Click **Next**. Policy name: `rumluos-s3-access` -> click **Create policy**.

---

## 7. Step 5: Amazon RDS PostgreSQL Database

1. Search for **RDS** and open the RDS console.
2. In the left navigation bar, click **Subnet groups** -> **Create DB subnet group**:
   - **Name**: `rumluos-db-subnets`.
   - **Description**: `Private subnets for RDS PostgreSQL`.
   - **VPC**: Select `rumluos-vpc`.
   - **Add subnets**: Select your 2 Availability Zones and choose your two **private subnets**.
   - Click **Create**.
3. In the left navigation bar, click **Databases** -> click **Create database**:
   - **Choose a database creation method**: Standard create.
   - **Engine type**: **PostgreSQL**.
   - **Engine Version**: **PostgreSQL 17.x** (or latest 16.x).
   - **Templates**: Select **Free Tier** *(This disables multi-AZ and pre-selects free-tier options)*.
   - **Settings**:
     - DB instance identifier: `rumluos-postgres`.
     - Master username: `rumluos`.
     - Master password: Enter a strong random password (e.g., 20+ characters). **Save this password!**
   - **Instance configuration**:
     - DB instance class: **`db.t4g.micro`** (or `db.t3.micro`).
   - **Storage**:
     - Storage type: `gp3`.
     - Allocated storage: **`20` GiB**.
     - Storage autoscaling: **Uncheck "Enable storage autoscaling"** *(Prevents growing beyond free tier)*.
   - **Connectivity**:
     - Virtual Private Cloud: Select `rumluos-vpc`.
     - DB Subnet group: Select `rumluos-db-subnets`.
     - Public access: **No** *(Keeps database completely private)*.
     - Existing VPC security groups: Remove `default` and select **`rumluos-db-sg`**.
   - **Additional configuration**:
     - Initial database name: **`rumluos_db`**.
     - Backup retention period: `1 day` (or 7 days).
     - Deletion protection: Check "Enable deletion protection" (prevents accidental deletion).
4. Click **Create database**.
*(RDS will take 5–10 minutes to provision. When ready, copy the **Endpoint**, which looks like `rumluos-postgres.c123456789.ap-southeast-1.rds.amazonaws.com`).*

---

## 8. Step 6: Amazon EC2 Virtual Server

1. Search for **EC2** and click **Instances** -> **Launch instances**.
2. **Name**: `rumluos-app-server`.
3. **Application and OS Images**: **Amazon Linux 2023 AMI** (Free Tier eligible).
4. **Architecture**: `64-bit (x86)`.
5. **Instance type**: **`t3.micro`** (Free Tier eligible).
6. **Key pair (login)**:
   - Select an existing key pair, or click **Create new key pair** -> name it `rumluos-key` -> RSA -> `.pem` -> download and save it on your computer.
7. **Network settings** -> Click **Edit**:
   - VPC: Select `rumluos-vpc`.
   - Subnet: Select your **public subnet**.
   - Auto-assign public IP: **Enable**.
   - Firewall (security groups): Select existing security group -> choose **`rumluos-app-sg`**.
8. **Configure storage**:
   - Change size to **`20` GiB** (Free Tier covers up to 30 GiB). Type: `gp3`.
9. **Advanced details** (Scroll to the bottom):
   - **IAM instance profile**: Select **`rumluos-ec2-role`**.
   - **Metadata response hop limit**: Set to **`2`** *(CRITICAL: Docker containers on EC2 need hop limit 2 to read the IAM Role)*.
   - **User data**: Paste this startup script so Docker and Git are installed automatically on first boot:
     ```bash
     #!/bin/bash
     dnf update -y
     dnf install -y docker git
     systemctl enable --now docker
     usermod -aG docker ec2-user
     ```
10. Click **Launch instance**.

Once launched, click on the instance and note its **Public IPv4 address** (e.g., `13.250.45.67`).

---

## 9. Step 7: Free HTTPS via AWS CloudFront (CDN) & ACM

Instead of dealing with manual certbot renewals on the server, you can use **AWS CloudFront** and **AWS Certificate Manager (ACM)** for free, automated SSL:

1. **Request Free Certificate**:
   - In the top right corner, switch region to **US East (N. Virginia) `us-east-1`** *(CloudFront certificates must always be in us-east-1)*.
   - Search for **Certificate Manager** -> **Request certificate**.
   - Domain names: `yourdomain.com` and `*.yourdomain.com`.
   - Validation method: **DNS validation**.
   - Click **Request**.
   - Click on your certificate and click **Create records in Route 53** (or copy CNAME to your DNS provider). Once validated, status becomes **Issued**.
2. **Create CloudFront Distribution**:
   - Search for **CloudFront** -> **Create distribution**.
   - **Origin domain**: Enter your EC2 Public DNS or IP address.
   - **Protocol**: **HTTP only** (CloudFront connects to EC2 on port 80, but serves HTTPS to your users).
   - **Viewer protocol policy**: **Redirect HTTP to HTTPS**.
   - **Allowed HTTP methods**: `GET, HEAD, OPTIONS, PUT, POST, PATCH, DELETE`.
   - **Custom SSL certificate**: Select the ACM certificate requested in step 1.
   - Click **Create distribution**.
   - Copy your CloudFront distribution domain name (e.g. `d111111abcdef8.cloudfront.net`).

---

## 10. Step 8: Point Your Domain (DNS)

* **If using AWS Route 53**:
  1. Go to Route 53 -> Hosted zones -> click your domain name.
  2. Click **Create record**.
  3. Toggle **Alias** to **ON**.
  4. Route traffic to: **Alias to CloudFront distribution** -> select your distribution.
* **If using Cloudflare or Namecheap**:
  1. Add a `CNAME` record for `@` pointing to `d111111abcdef8.cloudfront.net`.

---

## 11. Step 9: Deploy Rumluos Code on EC2

Now connect to your EC2 instance from your terminal:

```bash
chmod 400 rumluos-key.pem
ssh -i rumluos-key.pem ec2-user@YOUR_EC2_PUBLIC_IP
```
*(Or in the AWS console, select the instance and click **Connect -> Session Manager**).*

### On the EC2 Server:

```bash
# 1. Clone the repository
git clone <YOUR_REPOSITORY_URL> rumluos
cd rumluos

# 2. Create the production .env file
cp .env.example .env
chmod 600 .env
nano .env
```

Configure your `.env` for production:
```env
COMPOSE_PROJECT_NAME=rumluos
APP_VERSION=0.1.0

# Point to your RDS PostgreSQL Endpoint!
POSTGRES_HOST=rumluos-postgres.c123456789.ap-southeast-1.rds.amazonaws.com
POSTGRES_PORT=5432
POSTGRES_DB=rumluos_db
POSTGRES_USER=rumluos
POSTGRES_PASSWORD=YourMasterPasswordFromStep5

DOMAIN=yourdomain.com

# Your generated JWT RSA Keys
JWT_PRIVATE_KEY=...
JWT_PUBLIC_KEY=...

# Your S3 bucket name from Step 3
AWS_S3_BUCKET=rumluos-uploads-prod-12345
AWS_S3_REGION=ap-southeast-1

API_INTERNAL_URL=http://backend:8080/api/v1
```

Build and launch the application:
```bash
# Build the Docker images
scripts/01_build.sh

# Launch the containers and check health
scripts/02_deploy.sh
```

Run health check:
```bash
scripts/05_healthcheck.sh
```

Now open your browser and navigate to:
```text
https://yourdomain.com
```
You now have a fully operational, production-ready, secure deployment of Rumluos running on AWS Free Tier!
