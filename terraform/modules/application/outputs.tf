output "instance_id" { value = aws_instance.app.id }
output "instance_public_ip" { value = aws_instance.app.public_ip }
output "db_endpoint" { value = aws_db_instance.postgres.address }
output "db_secret_arn" {
  value     = aws_db_instance.postgres.master_user_secret[0].secret_arn
  sensitive = true
}
output "uploads_bucket_name" { value = aws_s3_bucket.uploads.bucket }
output "app_security_group_id" { value = aws_security_group.app.id }
