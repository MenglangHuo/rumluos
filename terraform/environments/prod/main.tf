locals {
  environment = "prod"
  name        = "rumluos-prod"
  tags = {
    Application = "rumluos"
    Environment = local.environment
    ManagedBy   = "terraform"
  }
}

module "network" {
  source               = "../../modules/network"
  name                 = local.name
  vpc_cidr             = var.vpc_cidr
  availability_zones   = var.availability_zones
  public_subnet_cidrs  = var.public_subnet_cidrs
  private_subnet_cidrs = var.private_subnet_cidrs
  enable_nat_gateway   = true
  single_nat_gateway   = false
  tags                 = local.tags
}

module "application" {
  source                     = "../../modules/application"
  name                       = local.name
  environment                = local.environment
  vpc_id                     = module.network.vpc_id
  public_subnet_id           = module.network.public_subnet_ids[0]
  private_subnet_ids         = module.network.private_subnet_ids
  instance_type              = var.instance_type
  db_instance_class          = var.db_instance_class
  db_name                    = var.db_name
  db_username                = var.db_username
  db_engine_version          = var.db_engine_version
  public_ip_cidr             = var.public_ip_cidr
  root_volume_size           = 50
  enable_deletion_protection = true
  tags                       = local.tags
}

