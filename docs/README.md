# Rumluos Documentation Hub

Welcome to the comprehensive documentation suite for **Rumluos**—a modern business, loan, and financial operations platform.

Whether you are a developer running the application locally on your laptop, a system administrator deploying on-premise hardware, or a cloud engineer configuring high-availability AWS infrastructure, this modular documentation guides you through every step in plain English ("like I'm 5").

---

## 📚 Documentation Index

| Guide | Description | Target Audience |
| :--- | :--- | :--- |
| [**1. Architecture Overview**](01_ARCHITECTURE_OVERVIEW.md) | High-level mental models, component breakdown, network routing, and security boundaries. | Everyone / Architects |
| [**2. Local & On-Premise Setup**](02_LOCAL_ON_PREMISE_SETUP.md) | Complete step-by-step setup on laptops (Mac, Windows, Linux) and bare-metal servers using Docker and native mode. | Developers & Sysadmins |
| [**3. AWS Free-Tier Cloud Setup**](03_AWS_FREE_TIER_SETUP.md) | Manual click-by-click setup for AWS services (VPC, EC2, RDS, S3, CloudFront, ACM, DNS) staying 100% within the Free Tier. | Cloud Engineers & DevOps |
| [**4. Terraform Automation Guide**](04_TERRAFORM_AUTOMATION_GUIDE.md) | Automated 1-click infrastructure provisioning using Terraform for `dev` and `prod` environments. | DevOps & SREs |
| [**5. Operations & Troubleshooting**](05_OPERATIONS_AND_TROUBLESHOOTING.md) | Daily runbooks, database backups, rollbacks, version management, and exhaustive error resolution matrix. | Operations & Support |
| [**6. Zero-to-Live Cloud Deployment**](06_DEV_TEST_LAB_DEEP_DIVE.md) | Step-by-step guide from empty AWS account to `https://yourdomain.com` — VPC, RDS, EC2, Docker, Nginx, domain, and HTTPS. | Everyone |

---

## 🚀 Quick Navigation by Goal

### 💻 "I want to run Rumluos on my local laptop right now"
1. Read the [Prerequisites & Docker Setup](02_LOCAL_ON_PREMISE_SETUP.md#1-prerequisites-and-system-requirements).
2. Generate your JWT keys and configure `.env` following [Environment Configuration](02_LOCAL_ON_PREMISE_SETUP.md#3-step-2-configure-environment-variables-env).
3. Run `make build && make up`.
4. Open [http://localhost](http://localhost) in your browser.

---

### ☁️ "I want to host Rumluos on AWS for free"
1. Set up your zero-spend budget alert in [AWS Free Tier Budget Setup](03_AWS_FREE_TIER_SETUP.md#2-step-0-set-up-zero-spend-budget-alert-first).
2. Provision the core networking and compute resources:
   - [VPC & Subnets](03_AWS_FREE_TIER_SETUP.md#3-step-1-virtual-private-cloud-vpc--subnets)
   - [Security Groups](03_AWS_FREE_TIER_SETUP.md#4-step-2-security-groups-virtual-firewalls)
   - [S3 Storage](03_AWS_FREE_TIER_SETUP.md#5-step-3-amazon-s3-private-storage)
   - [RDS PostgreSQL](03_AWS_FREE_TIER_SETUP.md#7-step-5-amazon-rds-postgresql-database)
   - [EC2 Server](03_AWS_FREE_TIER_SETUP.md#8-step-6-amazon-ec2-virtual-server)
3. Set up free global HTTPS via [CloudFront & ACM](03_AWS_FREE_TIER_SETUP.md#9-step-7-free-https-via-aws-cloudfront-cdn--acm).
4. Or automate the whole process in 3 minutes via [Terraform Automation](04_TERRAFORM_AUTOMATION_GUIDE.md).

---

### 🔬 "I want a deep-dive dev/test lab (VPC, Alerts, Auto Scaling, Custom Domain)"
1. Read [Dev/Test Lab Deep Dive](06_DEV_TEST_LAB_DEEP_DIVE.md).
2. Learn how to configure a custom VPC without the $32/mo NAT Gateway trap.
3. Wire your existing custom domain (via Cloudflare or Let's Encrypt).
4. Set up CloudWatch RAM/CPU alarms and SNS notifications.
5. Configure and stress-test an Auto Scaling Group (1 to 2 instances) within Free Tier limits.

---

### 🛠️ "Something broke or the site is showing 502 Bad Gateway"
1. Check the [Troubleshooting Matrix](05_OPERATIONS_AND_TROUBLESHOOTING.md#4-troubleshooting-matrix).
2. Run `scripts/05_healthcheck.sh` and inspect live container logs with `make logs`.
