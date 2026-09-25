# Rumluos AWS infrastructure

This directory contains the infrastructure for the Rumluos application. Terraform is split into two independent root modules:

- `environments/dev` — small and inexpensive for team testing.
- `environments/prod` — a multi-AZ starting point for production.

The reusable modules are in `modules/`.

## What Terraform creates

Each environment creates:

1. A VPC with public and private subnets.
2. An Amazon Linux EC2 instance in a public subnet. Its user-data script installs Docker; application deployment is still performed separately.
3. A private Amazon RDS PostgreSQL database. The database accepts traffic only from the EC2 security group.
4. A private, encrypted, versioned S3 bucket for application uploads.
5. An EC2 IAM role with access to the S3 bucket and AWS Systems Manager (SSM).
6. Security groups allowing HTTP/HTTPS from the internet, emergency SSH from your configured CIDR, and PostgreSQL only from the application host.

The RDS master password is generated and managed by AWS Secrets Manager. Terraform does not require a database password in a `.tfvars` file.

## Prerequisites

Install Terraform 1.6+, the AWS CLI, and use an AWS identity allowed to create VPC, EC2, RDS, S3, IAM, and SSM resources.

Configure AWS credentials using the AWS CLI, SSO, or environment variables:

```bash
aws configure --profile rumluos-dev
export AWS_PROFILE=rumluos-dev

# For an SSO profile, use this instead:
aws sso login --profile rumluos-dev
export AWS_PROFILE=rumluos-dev
```

Verify the selected account before applying:

```bash
aws sts get-caller-identity
```

## Configure an environment

Choose one environment and copy its example variables file:

```bash
cd terraform/environments/dev
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` before running Terraform:

| Variable | Meaning |
| --- | --- |
| `aws_region` | AWS region where resources are created. |
| `availability_zones` | AZs in that region. Dev uses one; prod uses two. |
| `vpc_cidr` | Private address range for the environment. Keep dev and prod different. |
| `public_subnet_cidrs` | Public subnet ranges; one CIDR per AZ. |
| `private_subnet_cidrs` | Private subnet ranges; one CIDR per AZ. |
| `public_ip_cidr` | Your public IP in CIDR format, for emergency SSH. Example: `198.51.100.25/32`. |
| `instance_type` | EC2 size. Dev defaults to `t3.micro`. |
| `db_instance_class` | RDS size. Dev defaults to `db.t4g.micro`. |
| `db_engine_version` | PostgreSQL version available in the selected region. |
| `db_name` / `db_username` | Initial database name and master username. |

Use your real public IP for `public_ip_cidr`; the example documentation address is not usable for access. Do not commit `terraform.tfvars`, credentials, database passwords, or private keys.

## Deploy dev

Dev is the recommended environment for the team. It uses one AZ and no NAT gateway to reduce cost. The EC2 host is public, while RDS remains private.

```bash
cd terraform/environments/dev
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars.

terraform init
terraform fmt -check -recursive
terraform validate
terraform plan -out=dev.tfplan
terraform apply dev.tfplan
```

Review the plan carefully. `terraform apply` creates billable AWS resources.

After apply, view the important values:

```bash
terraform output app_public_ip
terraform output instance_id
terraform output uploads_bucket_name
terraform output db_endpoint
terraform output -raw db_secret_arn
```

Retrieve the managed RDS credentials from Secrets Manager:

```bash
aws secretsmanager get-secret-value \
  --secret-id "$(terraform output -raw db_secret_arn)" \
  --query SecretString \
  --output text
```

Connect to EC2 through SSM:

```bash
aws ssm start-session --target "$(terraform output -raw instance_id)"
```

The user-data script only installs Docker. Build and deploy the application using the existing scripts and Docker Compose instructions in the root README. Configure the application with the RDS endpoint, Secrets Manager credentials, S3 bucket name, and AWS region.

## Deploy prod

Production uses two AZs, two NAT gateways, a larger EC2 instance, multi-AZ RDS, seven days of backups, and deletion protection.

```bash
cd terraform/environments/prod
cp terraform.tfvars.example terraform.tfvars
# Review region, AZs, CIDRs, and instance sizes.

terraform init
terraform fmt -check -recursive
terraform validate
terraform plan -out=prod.tfplan
terraform apply prod.tfplan
```

This configuration does not yet create a load balancer, HTTPS certificate, DNS record, or autoscaling group. Add those when production traffic and availability requirements are known.

## Team state management

By default, each root uses local Terraform state. Local state is suitable for a first test but not for shared team work.

Before the first shared apply, create a dedicated encrypted S3 state bucket and lock table, then add a backend block to each environment. Example:

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

Use a different `key` for production, such as `rumluos/prod/terraform.tfstate`. Run `terraform init -migrate-state` after adding the backend. Protect the state with IAM and encryption.

For team workflow, commit `.tf` files and lock files, run `terraform fmt` and `terraform validate` in CI, review `terraform plan`, and allow only approved plans to be applied.

## Change or remove infrastructure

```bash
terraform plan
terraform apply
```

To remove a development environment after testing:

```bash
terraform destroy
```

Do not run `terraform destroy` in production without explicit review. Production RDS has deletion protection enabled and must be deliberately changed before destruction.

