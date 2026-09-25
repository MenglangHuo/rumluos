# 04. Terraform Automation Guide

This guide explains how to use **Terraform** to provision all your AWS cloud infrastructure (VPC, Subnets, EC2, RDS PostgreSQL, S3, IAM Roles, Security Groups) with a single command in ~3 minutes.

---

## 1. What is Terraform? (Like I'm 5)

Imagine building a Lego castle:
* **Manual AWS Console**: You click buttons in your browser, one by one. It takes 45 minutes, and if you forget one checkbox, something breaks.
* **Terraform (Infrastructure as Code)**: You write down a blueprint of your castle in a text file. You run `terraform apply`, and Terraform builds the entire castle automatically in 3 minutes.
* If you ever want to tear it down, you run `terraform destroy`, and Terraform removes all resources cleanly so you are never charged a penny.

---

## 2. Directory Structure Explained

Rumluos uses the **Root Environment & Reusable Child Module** design pattern:

```text
terraform/
├── README.md                      # Quick reference
├── modules/                       # Reusable Lego blocks (environment agnostic)
│   ├── network/                   # Creates VPC, subnets, route tables, IGW, NAT
│   └── application/               # Creates EC2, RDS PostgreSQL, S3, IAM, Security Groups
└── environments/                  # Live deployments (isolated state)
    ├── dev/                       # Cost-optimized single-AZ environment for team testing
    └── prod/                      # Multi-AZ high-availability environment for production
```

### Why Dev and Prod are Separated:
* **Blast Radius Isolation**: Dev and Prod have independent state files. A mistake in Dev will never touch or destroy Production.
* **Cost vs Availability**:
  * **Dev**: 1 Availability Zone, **0 NAT Gateways** (saves ~$32/mo), Single-AZ RDS, deletion protection disabled.
  * **Prod**: 2 Availability Zones, Multi-AZ RDS standby, automated 7-day backups, deletion protection enabled, 2 NAT Gateways.

---

## 3. Prerequisites

1. **Install Terraform (1.6+)**:
   - Check with: `terraform version`
   - [Install Terraform](https://developer.hashicorp.com/terraform/install).
2. **Install AWS CLI (v2)**:
   - Check with: `aws --version`
   - [Install AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html).
3. **Configure AWS Credentials**:
   ```bash
   aws configure
   ```
   Provide your `AWS Access Key ID`, `AWS Secret Access Key`, and default region (e.g., `ap-southeast-1`).
4. **Verify Identity**:
   ```bash
   aws sts get-caller-identity
   ```

---

## 4. Deploying the Dev Environment (Step-by-Step)

Navigate to the `dev` environment:

```bash
cd terraform/environments/dev
```

### Step 1: Create Your Variables File
```bash
cp terraform.tfvars.example terraform.tfvars
```

### Step 2: Edit `terraform.tfvars`
Open `terraform.tfvars` in your editor (`nano terraform.tfvars`):

```hcl
aws_region           = "ap-southeast-1"
availability_zones   = ["ap-southeast-1a"]
vpc_cidr             = "10.10.0.0/16"
public_subnet_cidrs  = ["10.10.1.0/24"]
private_subnet_cidrs = ["10.10.11.0/24"]

# IMPORTANT: Put your real public IP here for emergency SSH access!
# Run: curl ifconfig.me
public_ip_cidr       = "203.0.113.10/32"

instance_type        = "t3.micro"
db_instance_class    = "db.t4g.micro"
db_engine_version    = "17.6"
db_name              = "rumluos_db"
db_username          = "rumluos"
```

### Step 3: Initialize Terraform
Downloads the AWS provider plugins:
```bash
terraform init
```

### Step 4: Validate and Plan
Preview what resources will be created:
```bash
terraform validate
terraform plan -out=dev.tfplan
```
Terraform will display a detailed list of ~15 AWS resources it will create.

### Step 5: Apply the Plan
```bash
terraform apply dev.tfplan
```
*(Takes ~3 to 5 minutes while RDS provisions).*

---

## 5. Inspecting Outputs & Secrets

Once `terraform apply` finishes, view the outputs:

```bash
# Public IP of your EC2 instance
terraform output app_public_ip

# Instance ID
terraform output app_instance_id

# Endpoint of RDS PostgreSQL
terraform output db_endpoint

# Uploads S3 Bucket Name
terraform output uploads_bucket_name

# Retrieve the auto-generated database password from Secrets Manager
aws secretsmanager get-secret-value \
  --secret-id "$(terraform output -raw db_secret_arn)" \
  --query SecretString \
  --output text
```

### Connecting to EC2 via AWS SSM (No SSH Key Needed!)
Because our Terraform module attaches `AmazonSSMManagedInstanceCore` to the EC2 IAM Role, you can connect directly through AWS Systems Manager Session Manager:

```bash
aws ssm start-session --target "$(terraform output -raw app_instance_id)"
```

---

## 6. Team Remote State Management

By default, Terraform stores state locally in `terraform.tfstate`. For shared team collaboration, configure an Amazon S3 backend with DynamoDB locking.

Add this block inside `versions.tf`:

```hcl
terraform {
  backend "s3" {
    bucket         = "your-company-terraform-state"
    key            = "rumluos/dev/terraform.tfstate"
    region         = "ap-southeast-1"
    dynamodb_table = "terraform-locks"
    encrypt        = true
  }
}
```

Then migrate the state:
```bash
terraform init -migrate-state
```

---

## 7. Destroying the Environment

When you are done testing and want to ensure you are never billed:

```bash
cd terraform/environments/dev
terraform destroy
```
Type `yes` when prompted. Terraform will cleanly delete all provisioned AWS resources.
