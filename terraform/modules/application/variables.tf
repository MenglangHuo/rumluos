variable "name" { type = string }
variable "environment" { type = string }
variable "vpc_id" { type = string }
variable "public_subnet_id" { type = string }
variable "private_subnet_ids" { type = list(string) }
variable "instance_type" { type = string }
variable "db_instance_class" { type = string }
variable "db_name" { type = string }
variable "db_username" { type = string }
variable "db_engine_version" { type = string }
variable "public_ip_cidr" { type = string }
variable "root_volume_size" { type = number }
variable "enable_deletion_protection" { type = bool }
variable "tags" { type = map(string) }

