variable "aws_region" { type = string }
variable "availability_zones" { type = list(string) }
variable "vpc_cidr" { type = string }
variable "public_subnet_cidrs" { type = list(string) }
variable "private_subnet_cidrs" { type = list(string) }
variable "public_ip_cidr" { type = string }
variable "instance_type" { type = string }
variable "db_instance_class" { type = string }
variable "db_engine_version" { type = string }
variable "db_name" { type = string }
variable "db_username" { type = string }

