output "app_instance_id" { value = module.application.instance_id }
output "app_public_ip" { value = module.application.instance_public_ip }
output "db_endpoint" { value = module.application.db_endpoint }
output "db_secret_arn" {
  value     = module.application.db_secret_arn
  sensitive = true
}
output "uploads_bucket_name" { value = module.application.uploads_bucket_name }
